import { encounterStage } from '../data/stages.js';
import { drawEventStage } from '../render/event-stage.js';
import { drawStageArt, requestStageArt } from '../render/stage-packs.js';
import { warmBelemStage } from '../render/belem-stage.js';
import { createMenuAccess } from './menu-access.js';
import { loadPreferences, savePreferences } from './preferences.js';
import { LESSONS, createLesson, advanceLesson, skipLesson } from './lessons.js';
import { HERO_ENDINGS, CHAPTERS, BOSS_TALK } from '../data/story.js';
import { SYS } from '../data/system.js';
import { HEROES, BOSSES, ALL } from '../data/characters/index.js';
import { createMatch, step, resetTraining, BAN_LABEL } from '../core/match.js';
import { createBrain, aiInput } from '../core/ai.js';
import { EMPTY_INPUT } from '../core/input.js';
import { buildStage, drawStage } from '../render/stage.js';
import { drawEffect, prepareSprites, spritePacksFor } from '../render/sprites.js';
import { laranjaoClone, drawLaranjaoStatus, drawLaranjaoHeadline, drawLaranjaoBanish } from '../render/laranjao-art.js';
import { drawFighter, drawBoxes } from '../render/mannequin.js';
import { drawLivePhone, drawBanStamp, drawAnkleZone, drawFired, drawWings } from '../render/boss-art.js';
import { drawPavanassiStatus } from '../render/pavanassi-art.js';
import { drawFujaoStatus } from '../render/fujao-art.js';
import { drawPaiStatus } from '../render/pai-fujao-art.js';
import { drawInfernoStage } from '../render/inferno-stage.js';
import { drawWashingtonStage } from '../render/washington-stage.js';
import { drawMansionStage } from '../render/mansion-stage.js';
import { PAI } from '../data/characters/pai-fujao.js';
import { drawAirportStage } from '../render/airport-stage.js';

import { createFx, fxEvents, fxUpdate, fxDrawBack, fxDrawFront, fxDrawScreen, drawEntities } from '../render/fx.js';
import { createHud, drawHud } from '../render/hud.js';
import { text, slab, halftone } from '../render/draw.js';
import { readInput, takePressed, pollPad, glyphs, rumble, remapPad, resetPad, PS_NAMES, readInputFrom, takePressedFrom, clearPressed, rumbleOn, padLabel } from './devices.js';
import { COMBOS } from '../data/combos.js';
import { createTracker, trackCombo, createRunner, runnerInput, runnerDone, stepLabel } from '../core/combos.js';
import { audioEvents, sfx, setStageAudioActive, selectStageAudio } from './audio.js';
import { banterEvents } from './banter.js';
import {drawComicScreen,drawComicPause,FOES,FOE_COLS} from './comic-screens.js';
import {comicBackground} from '../render/comic-ui.js';
import { titleItem, optionItem, heroCards, foeCards, chapterBox } from './retro-screens.js';
import { RETRO as R, ptext, ptextWidth, pwrap, pixelBox, navyBackground, headerBar } from '../render/retro-ui.js';
import { createRun, createRunAt, moveChapter, nextChapter, currentFight, fightLevel, winFight, continueFight, openingPages, closingPages, talkLines, loadProgress, saveCleared, saveCheckpoint, resumeRun } from './story.js';

const W = SYS.VIEW_W;
const H = SYS.VIEW_H;
const MENU = [['story', 'MODO HISTÓRIA'], ['versus', 'VS'], ['training', 'TREINO'], ['settings', 'OPÇÕES']];
// Dentro de OPÇÕES: dificuldade, acessibilidade e o que saiu do menu principal.
const OPTIONS = [['diff', 'DIFICULDADE'], ['reducedEffects', 'REDUZIR TREMOR E CLARÕES'], ['leftHanded', 'CONTROLES PARA CANHOTOS'], ['largeButtons', 'BOTÕES MAIORES'], ['controls', 'CONTROLES'], ['gallery', 'FINAIS']];
const DEFAULT_DIFF = 1; // MÉDIO
const loadDiff = () => {
  try {
    const n = +localStorage.getItem('sn-dificuldade');
    const raw = localStorage.getItem('sn-dificuldade');
    return raw !== null && Number.isInteger(n) && n >= 0 && n < SYS.DIFFICULTY.length ? n : DEFAULT_DIFF;
  } catch {
    return DEFAULT_DIFF;
  }
};
const PAUSE = ['CONTINUAR', 'LISTA DE COMBOS', 'LISTA DE GOLPES', 'CONTROLES', 'SOM', 'REINICIAR LUTA', 'SAIR'];
// Na pausa, o item SOM mostra o estado atual (o botão da página some na luta).
const pauseLabels = () => PAUSE.map(item => item === 'SOM' ? (sfx.isMuted() ? 'SOM: DESLIGADO' : 'SOM: LIGADO') : item);
function toggleSound() {
  const muted = sfx.toggleMute();
  const button = typeof document !== 'undefined' && document.getElementById('sound');
  if (button) { button.textContent = muted ? 'SOM: DESLIGADO' : 'SOM: LIGADO'; button.setAttribute('aria-pressed', String(muted)); }
}
const ACTIONS = [['L', 'Leve'], ['M', 'Médio'], ['H', 'Forte'], ['S', 'Especial'], ['G', 'Defesa (Ginga)'], ['T', 'Agarrão'], ['X', 'Super'], ['start', 'Pausa'], ['back', 'Voltar']];
const RESULT = ['REVANCHE', 'TROCAR PERSONAGEM', 'MENU'];
const STORY_LOSE = ['CONTINUAR', 'DESISTIR'];
const DUMMY = ['PARADO', 'DEFENDE TUDO', 'CPU'];
/** Linha i da tela de controles (as 9 ações e, por último, RESTAURAR PADRÃO). */
const controlRow = (i) => ({ x: 160, y: 220 + i * 68, w: 1000, h: 58 });
const KEY_LABEL = { c1: '→ ← + Leve', c2: '↓ → + Médio', '5S': 'Especial', '6S': '→ + Especial', '2S': '↓ + Especial', '4S': '← + Especial', jS: 'No ar: Especial', SA3: 'Super com 3 barras', SA1: '↓ + Super (1 barra)' };

/** Cria o jogo sobre um canvas. Retorna o objeto do app (útil para testes). */
export function createApp(canvas, devices, opts = {}) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const syncMenu = createMenuAccess(canvas);
  const preferences = loadPreferences();
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) preferences.reducedEffects = true;
  const app = {
    preferences, lesson: null, systemPaused: false, screen: 'title', cur: 0, mode: 'story', hero: 0, foe: null, foeCur: FOES.length - 1,
    st: null, brain: null, fx: createFx(), hud: createHud(), layers: buildStage(),
    cam: (SYS.STAGE_W - W) / 2, frame: 0, paused: false, pcur: 0, sub: null, ccur: 0, kcur: 0, remap: 0, trial: null, demo: null, demoT: 0, inputLog: [], lastIn: null,
    boxes: !!opts.boxes, dummy: 0, level: SYS.DIFFICULTY[loadDiff()].level, diff: loadDiff(), stats: null, overT: 0, vsT: 0,
    autoplay: opts.autoplay || null,
    slots: [null, null], ready: [false, false], hero2: 1, p1src: 'kb',
  };

  /** Texto de um item de OPÇÕES, com o valor atual quando é um ajuste. */
  function optionLabel(id, label) {
    if (id === 'diff') return `${label}: ${SYS.DIFFICULTY[app.diff].name}`;
    if (id in preferences) return `${label}: ${preferences[id] ? 'SIM' : 'NÃO'}`;
    return label;
  }

  function startFight() {
    const hero = HEROES[app.hero];
    const D = SYS.DIFFICULTY[app.diff];
    app.level = app.mode === 'story' && app.story ? fightLevel(app.story, D.level) : D.level;
    const fair = ['training', 'tutorial', 'vs2'].includes(app.mode);
    if (app.mode === 'vs2') app.foe = HEROES[app.hero2];
    app.st = createMatch({ chars: [hero, app.foe], seed: (Date.now() & 0xffff) + 1, training: ['training', 'tutorial'].includes(app.mode), dmgMul: fair ? [1, 1] : app.foe?.boss ? D.bossDmg : D.dmg });
    // Luta espelhada: o lado 2 usa a paleta alternativa para dar para distinguir.
    if (app.st.f[0].ch.id === app.st.f[1].ch.id) app.st.f[1].alt = true;
    app.brain = createBrain(app.level);
    app.p1brain = app.autoplay ? createBrain(2) : null;
    app.fx = createFx();
    app.hud = createHud();
    app.stats = { maxCombo: 0, dmg: 0, frames: 0 };
    app.banter = {};
    app.paused = false;
    app.sub = null;
    app.trial = null;
    app.demo = null;
    app.inputLog = [];
    app.overT = 0;
    app.screen = 'fight';
    app.lesson = app.mode === 'tutorial' ? createLesson(app.st.f[0].x) : null;
    if (app.mode === 'story') saveCheckpoint(app.story);
  }

  // Entra na tela de versus e prepara os sprites só dos dois lutadores.
  function enterVs() {
    app.vsT = 0;
    app.vsReady = false;
    app.screen = 'vs';
    const ids = [HEROES[app.hero], app.foe].flatMap(spritePacksFor);
    const token = app.vsToken = (app.vsToken || 0) + 1;
    // A arena pintada baixa e é pré-montada durante a tela de versus, não no meio da luta.
    void requestStageArt(encounterStage(app));
    if (encounterStage(app) === 'belem') setTimeout(() => warmBelemStage(app.cam), 0);
    prepareSprites(ids).then(() => prepareSprites(ids.filter(id => id.startsWith('zanata') && id.endsWith('-fx')), ['fx-estalo','fx-impacto','fx-defesa'], { activate: false })).then(() => { if (app.vsToken === token) app.vsReady = true; });
  }

  function pickFoe() {
    if (app.mode === 'story') app.foe = app.story ? ALL[currentFight(app.story).foe] : BOSSES[0];
    else if (['training', 'tutorial'].includes(app.mode)) app.foe = app.mode === 'tutorial' ? HEROES[1] : BOSSES[0];
    else {
      const pool = [...HEROES, ...BOSSES];
      app.foe = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  function p2Input() {
    const st = app.st;
    if (app.mode === 'vs2') return readInputFrom(devices, app.slots[1]);
    if (app.mode === 'tutorial') {
      const me = st.f[0], partner = st.f[1];
      if (app.lesson?.index === 1 && Math.abs(me.x - partner.x) > 190) partner.x = Math.min(SYS.STAGE_W - SYS.WALL_PAD, me.x + 180);
      return app.lesson?.index === 1 && st.frame % 90 === 0 ? { ...EMPTY_INPUT, L: 1 } : EMPTY_INPUT;
    }
    if (app.mode !== 'training' || app.dummy === 2) return aiInput(st, 1, app.brain);
    if (app.dummy === 1) {
      const a = st.f[0];
      const me = st.f[1];
      const low = a.state === 'attack' && a.move.hits[0]?.guard === 'low';
      const high = a.y > 0 || (a.state === 'attack' && a.move.hits[0]?.guard === 'high');
      return { ...EMPTY_INPUT, x: -(Math.sign(a.x - me.x) || 1), y: low || !high ? (high ? 0 : -1) : 0 };
    }
    return EMPTY_INPUT;
  }

  /** Nome curto de uma fonte de entrada (teclado ou controle). */
  function srcName(src) {
    if (src === 'kb') return 'TECLADO';
    const p = devices.pads[src];
    return p ? `CONTROLE ${src + 1} — ${padLabel(p.id)}` : `CONTROLE ${src + 1}`;
  }

  /** Fontes que podem entrar no versus: o teclado e cada controle conectado. */
  function sources() {
    return ['kb', ...Object.keys(devices.pads).map(Number)];
  }

  /** Fonte (teclado ou controle) que acabou de apertar algo, sem consumir os apertos. */
  function freshSource() {
    return sources().find((src) => Object.keys(src === 'kb' ? devices.kbPressed : devices.pads[src]?.pressed || {}).length);
  }

  /**
   * Seleção do VS: um segundo controle (ou o teclado, se o 1P está no controle)
   * aperta START e a partida vira 2 jogadores, já na escolha simultânea.
   */
  function versusJoinTick() {
    for (const src of sources()) {
      const p = takePressedFrom(devices, src);
      if (src === app.p1src || !p.start) continue;
      app.mode = 'vs2';
      app.slots = [app.p1src, src];
      app.ready = [false, false];
      app.hero2 = (app.hero + 1) % HEROES.length;
      clearPressed(devices);
      sfx.ok();
      rumbleOn(devices, src, 0.4, 0.6, 150);
      app.screen = 'select2';
      return true;
    }
    return false;
  }

  /** Escolha simultânea: cada jogador move o próprio cursor e confirma. */
  function select2Tick() {
    const n = HEROES.length;
    for (let i = 0; i < 2; i++) {
      const src = app.slots[i];
      const p = takePressedFrom(devices, src);
      const key = i === 0 ? 'hero' : 'hero2';
      const okp = p.ok || p.S || p.start || (src === 'kb' && p.L);
      const backp = p.cancel || p.back || (src === 'kb' && p.M);
      if (!app.ready[i]) {
        const mv = (p.right ? 1 : 0) - (p.left ? 1 : 0) + (p.down ? 4 : 0) - (p.up ? 4 : 0);
        if (mv) {
          app[key] = (app[key] + n + mv) % n;
          sfx.menu();
        }
        if (okp) {
          app.ready[i] = true;
          sfx.ok();
        } else if (backp) return 'back';
      } else if (backp) app.ready[i] = false;
    }
    return app.ready[0] && app.ready[1] ? 'go' : null;
  }

  /** Começa o desafio de um combo; com demo = true, a CPU mostra como se faz. */
  function startCombo(combo, demo) {
    const st = app.st;
    const mid = SYS.STAGE_W / 2;
    st.f[0].x = mid - 90;
    st.f[1].x = mid + 85;
    st.f[0].super = SYS.SUPER.max;
    for (const f of st.f) {
      f.y = 0;
      f.vy = 0;
      f.state = 'idle';
      f.sf = 0;
      f.move = null;
      f.moveKey = null;
      f.comboHits = 0;
    }
    st.ents = [];
    app.trial = createTracker(combo);
    app.demo = demo ? createRunner(combo) : null;
    app.demoT = 0;
    app.dummy = 0;
    app.paused = false;
    app.sub = null;
  }

  /** Guarda as últimas entradas do jogador para o painel do Treino. */
  function logInput(inp) {
    const dirs = { '-1,-1': '↙', '0,-1': '↓', '1,-1': '↘', '-1,0': '←', '1,0': '→', '-1,1': '↖', '0,1': '↑', '1,1': '↗' };
    const face = app.st.f[0].face;
    const d = dirs[`${inp.x * face},${inp.y}`] || '';
    const g = glyphs(devices);
    const keys = ['L', 'M', 'H', 'S', 'G', 'T', 'X'];
    const btns = keys.filter((b) => inp[b] && !(app.lastIn && app.lastIn[b])).map((b) => g[b] || b);
    const sig = `${d}|${keys.filter((b) => inp[b]).join('')}`;
    if (sig !== (app.lastSig || '') && (d || btns.length)) {
      app.inputLog.unshift({ d, b: btns.join(' '), t: app.frame });
      app.inputLog.length = Math.min(app.inputLog.length, 14);
    }
    app.lastSig = sig;
    app.lastIn = inp;
  }

  /** Tela de controles: mostra o controle, testa os botões e troca o mapeamento. Retorna true para sair. */
  function controlsTick(pr, ok, back) {
    const rows = ACTIONS.length + 1;
    if (app.remap) {
      if (app.frame > app.remap && devices.lastRaw != null) {
        remapPad(devices, ACTIONS[app.kcur][0], devices.lastRaw);
        app.remap = 0;
        sfx.ok();
      } else if (pr.back && !devices.padName) app.remap = 0;
      return false;
    }
    if (pr.up) app.kcur = (app.kcur + rows - 1) % rows;
    if (pr.down) app.kcur = (app.kcur + 1) % rows;
    if (back) return true;
    if (ok) {
      if (app.kcur === ACTIONS.length) resetPad(devices);
      else if (devices.padName) {
        devices.lastRaw = null;
        app.remap = app.frame + 8;
      }
    }
    return false;
  }

  /** Modo História: começa a turnê com o herói escolhido. */
  function startStory() {
    app.story = resumeRun(HEROES[app.hero].id, loadProgress());
    app.storyPages = openingPages(app.story, shortName(HEROES[app.hero]));
    app.screen = 'storyIntro';
  }

  const shortName = (ch) => ch.name.split(',')[0];

  /** Páginas de HQ (abertura e fechamento): Leve/Enter avança, Médio/Esc volta. */
  function storyPagesTick(ok, back) {
    const run = app.story;
    if ((ok && run.page >= app.storyPages.length - 1)) {
      run.page = 0;
      app.screen = 'storyMap';
    } else if (ok) run.page++;
    else if (back && run.page > 0) run.page--;
  }

  /** Fim de uma luta da turnê: próxima luta, fechamento do capítulo ou "Continuar?". */
  function storyAfterFight(won) {
    const run = app.story;
    if (!won) {
      app.screen = 'storyLose';
      return;
    }
    if (winFight(run) === 'next') {
      saveCheckpoint(run);
      app.screen = 'storyTalk';
      return;
    }
    saveCleared(run);
    app.storyPages = closingPages(run, shortName(HEROES[app.hero]));
    app.screen = 'storyEnd';
  }

  function setDiff(i) {
    app.diff = (i + SYS.DIFFICULTY.length) % SYS.DIFFICULTY.length;
    try {
      localStorage.setItem('sn-dificuldade', String(app.diff));
    } catch { /* sem armazenamento: vale só nesta sessão */ }
  }

  /** Um passo lógico (1/60 s). */
  function tick() {
    app.frame++;
    // Quem está mexendo no menu vira o 1P; fora das telas por jogador, os apertos por fonte são descartados.
    const src = freshSource();
    if (src !== undefined && app.screen !== 'select2' && !(app.mode === 'versus' && ['select', 'selectFoe'].includes(app.screen))) app.p1src = src;
    const pr = takePressed(devices);
    if (app.mode === 'versus' && ['select', 'selectFoe'].includes(app.screen)) { if (versusJoinTick()) return; }
    else if (app.screen !== 'select2') clearPressed(devices);
    const horiz = app.screen !== 'title';
    const nav = (n, len) => (app[n] = (app[n] + len + (pr.down || (horiz && pr.right) ? 1 : 0) - (pr.up || (horiz && pr.left) ? 1 : 0)) % len);
    const ok = pr.start || pr.L || pr.S || pr.ok;
    const back = pr.back || pr.M || pr.cancel;
    if (app.systemPaused) return;
    if (pr.up || pr.down || pr.left || pr.right) sfx.menu();
    if (ok) sfx.ok();

    if (app.screen === 'title') {
      nav('cur', MENU.length);
      if (ok && MENU[app.cur][0] === 'settings') { app.screen = 'settings'; app.kcur = 0; }
      else if (ok) {
        app.mode = MENU[app.cur][0];
        app.screen = 'select';
      }
    } else if (app.screen === 'settings') {
      if (pr.up) app.kcur = (app.kcur + OPTIONS.length - 1) % OPTIONS.length;
      if (pr.down) app.kcur = (app.kcur + 1) % OPTIONS.length;
      const id = OPTIONS[app.kcur][0];
      if (back) { app.screen = 'title'; app.cur = MENU.findIndex(([m]) => m === 'settings'); }
      else if (id === 'diff' && (ok || pr.left || pr.right)) setDiff(app.diff + (pr.left ? -1 : 1));
      else if (ok && id === 'controls') { app.screen = 'controls'; app.kcur = 0; app.remap = 0; }
      else if (ok && id === 'gallery') app.screen = 'gallery';
      else if (ok) { preferences[id] = !preferences[id]; savePreferences(preferences); }
    } else if (app.screen === 'gallery') {
      app.hero = (app.hero + HEROES.length + (pr.right ? 1 : 0) - (pr.left ? 1 : 0)) % HEROES.length;
      if (back || ok) { app.screen = 'settings'; app.kcur = OPTIONS.findIndex(([o]) => o === 'gallery'); }
    } else if (app.screen === 'select2') {
      const r = select2Tick();
      if (r === 'back') {
        app.slots = [null, null];
        clearPressed(devices);
        app.mode = 'versus';
        app.screen = 'select';
      } else if (r === 'go') {
        app.foe = HEROES[app.hero2];
        enterVs();
      }
    } else if (app.screen === 'controls') {
      if (controlsTick(pr, ok, back)) { app.screen = 'settings'; app.kcur = OPTIONS.findIndex(([o]) => o === 'controls'); }
    } else if (app.screen === 'select') {
      const n = HEROES.length;
      app.hero = (app.hero + n + (pr.right ? 1 : 0) - (pr.left ? 1 : 0) + (pr.down ? 4 : 0) - (pr.up ? 4 : 0)) % n;
      if (back) app.screen = app.mode === 'tutorial' ? 'settings' : 'title';
      if (ok && app.mode === 'versus') app.screen = 'selectFoe';
      else if (ok && app.mode === 'story') startStory();
      else if (ok) {
        pickFoe();
        enterVs();
      }
    } else if (app.screen === 'storyIntro' || app.screen === 'storyEnd') {
      storyPagesTick(ok, back);
    } else if (app.screen === 'storyMap') {
      const run = app.story;
      if (pr.left || pr.right) moveChapter(run, pr.right ? 1 : -1);
      if (back) app.screen = 'title';
      else if (ok && run.cleared && nextChapter(run)) {
        app.story = createRunAt(run.hero, run.chapter + 1, run.done);
        saveCheckpoint(app.story);
        app.storyPages = openingPages(app.story, shortName(HEROES[app.hero]));
        app.screen = 'storyIntro';
      } else if (ok && run.cleared) app.screen = 'title';
      else if (ok && run.intro !== run.chapter) {
        // capítulo trocado no mapa: mostra a abertura dele antes da primeira luta
        run.intro = run.chapter;
        run.page = 0;
        app.storyPages = openingPages(run, shortName(HEROES[app.hero]));
        app.screen = 'storyIntro';
      } else if (ok) {
        run.page = 0;
        app.screen = 'storyTalk';
      }
    } else if (app.screen === 'storyTalk') {
      const n = talkLines(app.story).length;
      if (ok && app.story.page >= n - 1) {
        pickFoe();
        enterVs();
      } else if (ok) app.story.page++;
      else if (back && app.story.page > 0) app.story.page--;
    } else if (app.screen === 'storyLose') {
      nav('cur', STORY_LOSE.length);
      if (ok && app.cur === 0) {
        continueFight(app.story);
        saveCheckpoint(app.story);
        startFight();
      } else if (ok) app.screen = 'title';
    } else if (app.screen === 'selectFoe') {
      const n = FOES.length;
      app.foeCur = (app.foeCur + n + (pr.right ? 1 : 0) - (pr.left ? 1 : 0) + (pr.down ? FOE_COLS : 0) - (pr.up ? FOE_COLS : 0)) % n;
      if (back) app.screen = 'select';
      else if (ok) {
        const pool = FOES.filter(Boolean);
        app.foe = FOES[app.foeCur] || pool[Math.floor(Math.random() * pool.length)];
        enterVs();
      }
    } else if (app.screen === 'vs') {
      app.vsT++;
      if (back) {
        app.ready = [false, false];
        app.screen = app.mode === 'vs2' ? 'select2' : app.mode === 'versus' ? 'selectFoe' : app.mode === 'story' ? 'storyMap' : 'select';
      }
      else if (app.vsReady && ((ok && app.vsT > 20) || app.vsT > 240)) startFight();
    } else if (app.screen === 'fight') {
      const st = app.st;
      if (pr.boxes) app.boxes = !app.boxes;
      if (pr.dummy) app.dummy = (app.dummy + 1) % DUMMY.length;
      if (pr.level) {
        app.level = (app.level + 1) % 3;
        app.brain.level = app.level;
      }
      if (app.paused) {
        // START nas telas internas da pausa volta direto para a luta; na lista da pausa ele
        // confirma a opção marcada (como em todos os menus), e a pausa abre em CONTINUAR.
        if (pr.start && app.sub) { app.paused = false; app.sub = null; return; }
        if (app.sub === 'moves') {
          if (ok || back) app.sub = null;
        } else if (app.sub === 'controls') {
          if (controlsTick(pr, ok, back)) app.sub = null;
        } else if (app.sub === 'combos') {
          const list = COMBOS[st.f[0].ch.id] || [];
          nav('ccur', Math.max(1, list.length));
          const combo = list[app.ccur];
          if (back) app.sub = null;
          else if (combo && app.mode === 'training' && (pr.L || pr.T)) startCombo(combo, true);
          else if (combo && app.mode === 'training' && ok) startCombo(combo, false);
          else if (ok) app.sub = null;
        } else {
          nav('pcur', PAUSE.length);
          if (back) app.paused = false;
          else if (ok) {
            const item = PAUSE[app.pcur];
            if (item === 'CONTINUAR') app.paused = false;
            else if (item === 'LISTA DE COMBOS') {
              app.sub = 'combos';
              app.ccur = 0;
            } else if (item === 'LISTA DE GOLPES') app.sub = 'moves';
            else if (item === 'CONTROLES') {
              app.sub = 'controls';
              app.kcur = 0;
              app.remap = 0;
            } else if (item === 'SOM') toggleSound();
            else if (item === 'REINICIAR LUTA') startFight();
            else { app.screen = 'title'; app.paused = false; app.sub = null; }
          }
        }
        return;
      }
      if ((pr.start || pr.back) && st.phase === 'fight') {
        app.paused = true;
        app.pcur = 0;
        return;
      }
      if (app.mode === 'tutorial' && pr.skip) skipLesson(app.lesson);
      if (pr.reset && st.training) { resetTraining(st); app.demo = null; app.trial = null; app.brain = createBrain(app.level); }
      // câmera lenta no nocaute
      if (st.phase === 'ko' && st.pf < 60 && app.frame % 2) return;
      let in0 = app.p1brain ? aiInput(st, 0, app.p1brain) : app.mode === 'vs2' ? readInputFrom(devices, app.slots[0]) : readInput(devices);
      if (app.demo) {
        in0 = runnerInput(app.demo, st);
        if (runnerDone(app.demo).finished || ++app.demoT > 360) app.demo = null;
      }
      logInput(in0);
      step(st, in0, p2Input());
      advanceLesson(app.lesson, st);
      st.events.push(...banterEvents(st, app.banter));
      trackCombo(app.trial, st);
      for (const e of st.events) {
        if (app.mode === 'vs2') {
          // cada controle vibra pelo seu lutador: forte quando apanha, leve quando acerta
          if (e.t === 'hit') {
            rumbleOn(devices, app.slots[e.side], 0.25, 0.35, 70);
            rumbleOn(devices, app.slots[1 - e.side], 0.7, 0.5, e.super ? 160 : 90);
          } else if (e.t === 'ko') for (const s of app.slots) rumbleOn(devices, s, 1, 1, 450);
          else if (e.t === 'super') rumbleOn(devices, app.slots[e.side], 0.5, 0.8, 220);
        } else if (e.t === 'hit') rumble(devices, e.side === 0 ? 0.25 : 0.7, e.side === 0 ? 0.35 : 0.5, e.super ? 160 : 70);
        else if (e.t === 'ko') rumble(devices, 1, 1, 450);
        else if (e.t === 'super' && e.side === 0) rumble(devices, 0.5, 0.8, 220);
      }
      fxEvents(app.fx, st);
      audioEvents(st.events);
      fxUpdate(app.fx);
      for (const e of st.events) {
        if (e.t === 'hit' && e.side === 0) {
          app.stats.maxCombo = Math.max(app.stats.maxCombo, e.combo);
          app.stats.dmg += e.dmg;
        }
      }
      if (st.phase === 'fight') app.stats.frames++;
      if (st.phase === 'over' && ++app.overT > 100) {
        app.cur = 0;
        if (app.mode === 'story' && app.story) storyAfterFight(st.winner === 0);
        else app.screen = 'result';
      }
    } else if (app.screen === 'result') {
      nav('cur', RESULT.length);
      if (ok) {
        if (app.cur === 0) startFight();
        else if (app.cur === 1) {
          app.ready = [false, false];
          clearPressed(devices);
          app.screen = app.mode === 'vs2' ? 'select2' : 'select';
        }
        else app.screen = 'title';
        app.cur = 0;
      }
    }
  }

  function backdrop() {
    comicBackground(c,app.frame,true);
  }

  function wrap(str, x, y, maxW, size, color) {
    c.font = `italic 900 ${size}px Impact, 'Arial Black', sans-serif`;
    let line = '';
    let yy = y;
    for (const w of str.split(' ')) {
      if (c.measureText(line + w).width > maxW && line) {
        text(c, line.trim(), x, yy, size, color, 'left', '#12080c', 5);
        line = '';
        yy += size * 1.25;
      }
      line += w + ' ';
    }
    text(c, line.trim(), x, yy, size, color, 'left', '#12080c', 5);
  }

  function drawFight() {
    const st = app.st;
    const [a, b] = st.f;
    const target = Math.max(0, Math.min(SYS.STAGE_W - W, (a.x + b.x) / 2 - W / 2));
    app.cam += (target - app.cam) * 0.16;
    const fx = app.fx;
    if (preferences.reducedEffects) { fx.shake = 0; fx.flash = 0; }
    const sx = fx.shake ? (Math.random() - 0.5) * fx.shake * 2 : 0;
    const sy = fx.shake ? (Math.random() - 0.5) * fx.shake * 2 : 0;
    const stage = encounterStage(app);
    if (drawStageArt(c, stage, app.cam, st.frame, { reducedEffects: preferences.reducedEffects })) { /* complete pack replaces temporary scenery */ }
    else if (stage === 'palco' || stage === 'banheiros') drawEventStage(c, app.layers, app.cam, app.frame, stage);
    else if (stage === 'aeroporto') drawAirportStage(c, app.cam, app.frame);
    else if (stage === 'mansao') drawMansionStage(c, app.cam, app.frame);
    else if (stage === 'washington') drawWashingtonStage(c, app.cam, app.frame);
    else if (stage === 'inferno') drawInfernoStage(c, app.cam, app.frame);
    else drawStage(c, app.layers, app.cam, app.frame);
    fxDrawScreen(c, fx, 'under');
    c.save();
    c.translate(-app.cam + sx, sy);
    fxDrawBack(c, fx);
    for (const f of st.f) if (f.ch.id === 'pai-fujao') drawAnkleZone(c, f, PAI.zoneX, PAI.zoneR, app.frame);
    const order = b.state === 'attack' || a.state === 'hitstun' || a.state === 'thrown' ? [a, b] : [b, a];
    // cópias falsas do Laranjão: o mesmo boneco, sem sombra, com outra manchete
    for (const e of st.ents) {
      if (e.kind !== 'clone') continue;
      const owner = st.f[e.owner];
      if (e.dead || owner.status.banished > 0) continue;
      const clone = laranjaoClone(owner, e, app.frame);
      drawLaranjaoStatus(c, clone.fighter, app.frame, 'back');
      drawFighter(c, clone.fighter, clone.frame);
      drawLaranjaoStatus(c, clone.fighter, app.frame, 'front');
      drawLaranjaoHeadline(c, clone.fighter, e.headline, app.frame);
    }
    for (const f of order) {
      if (f.status.banished > 0) {
        if (!st.f.some(o => o.ch.id === 'laranjao') || !drawLaranjaoBanish(c, f)) drawFired(c, f, app.frame);
        continue;
      }
      drawLaranjaoStatus(c, f, app.frame, 'back');
      if (f.ch.id === 'djabo' && f.ch.form === 2) drawWings(c, f, app.frame);
      const absorb = fx.parts.find(p => p.k === 'absorb' && p.side === f.side);
      c.save();
      if (absorb) {
        const t = absorb.t / absorb.dur;
        const scale = Math.max(.08, 1 - t * .92);
        c.translate(absorb.x + (absorb.target - absorb.x) * t, absorb.y - 220 * t);
        c.scale(scale, Math.max(.06, 1 - t));
        c.translate(-f.x, -(SYS.GROUND_Y - f.y));
        c.globalAlpha = Math.max(.1, 1 - t);
      }
      drawPaiStatus(c, f, app.frame, 'back');
      drawFighter(c, f, app.frame + f.side * 17);
      if (f.ch.id === 'chupetinha') drawLivePhone(c, f, app.frame);
      drawBanStamp(c, f, BAN_LABEL);
      drawPavanassiStatus(c, f, app.frame);
      drawFujaoStatus(c, f, app.frame);
      drawPaiStatus(c, f, app.frame, 'front');
      drawLaranjaoStatus(c, f, app.frame, 'front');
      if (f.ch.id === 'laranjao' && f.res.headline && st.ents.some((e) => e.kind === 'clone' && e.owner === f.side)) drawLaranjaoHeadline(c, f, f.res.headline, app.frame);
      if (absorb && absorb.t / absorb.dur > .35) {
        c.translate(f.x, SYS.GROUND_Y - f.y);
        c.scale(absorb.face,1);
        drawEffect(c,'franco','adversario-sugado',absorb.t/absorb.dur,-220,-480,440,480);
      }
      c.restore();
    }
    drawEntities(c, st);
    fxDrawFront(c, fx, st);
    if (app.boxes) for (const f of st.f) drawBoxes(c, f);
    c.restore();
    drawHud(c, st, app.hud);
    if (app.mode === 'vs2') {
      text(c, 'J1', 90, 168, 34, '#ffcf2a');
      text(c, 'J2', W - 90, 168, 34, '#35d6c0');
    }
    fxDrawScreen(c, fx, 'over');
    if (app.mode === 'tutorial') {
      const lesson = LESSONS[app.lesson.index];
      slab(c, 350, 160, 1220, 130, '#17131b', 10);
      text(c, lesson?.title || 'PRÁTICA CONCLUÍDA', W / 2, 190, 32, '#ffcf2a');
      text(c, lesson?.text || `Etapas cumpridas: ${app.lesson.passed.length}/4 · puladas: ${app.lesson.skipped.length}. Continue praticando ou volte ao menu.`, W / 2, 240, 25, '#fff');
    }
    if (app.mode === 'training') {
      drawTrial();
      drawInputLog();
      if (!app.touchUI) text(c, `F1 caixas: ${app.boxes ? 'SIM' : 'NÃO'}   F2 boneco: ${DUMMY[app.dummy]}   F3 nível CPU: ${app.level + 1}`, W / 2, 188, 24, '#fff', 'center', '#12080c', 4);
      const m = a.move;
      if (m) text(c, `${m.name}  preparo ${m.startup} · ativo ${m.active} · recuperação ${m.recovery}`, W / 2, 222, 22, '#ffe14a', 'center', '#12080c', 4);
    }
    if (app.foe?.boss && !app.st.training && st.pf < 240 && !app.paused) {
      slab(c, 330, 160, 1260, 115, '#17131b', 8);
      wrap(bossHint().replace('DICA: ', ''), 370, 194, 1180, 27, '#fff');
    }
    if (app.paused) drawPause();
  }

  function drawPause() {
    c.fillStyle = 'rgba(23,19,27,.9)';
    c.fillRect(0,0,W,H);
    if (app.sub === 'moves') return drawMoveList();
    if (app.sub === 'combos') return drawComboList();
    if (app.sub === 'controls') return drawControls();
    drawComicPause(c,app,pauseLabels());
  }

  /** Lista de golpes: especiais e supers à esquerda, comandos básicos à direita. */
  function drawMoveList() {
    const ch = app.st.f[0].ch;
    navyBackground(c);
    headerBar(c, 'LISTA DE GOLPES', ch.name);
    pixelBox(c, 60, 160, 880, 540, '#000428', '#5878ff', 6);
    ptext(c, 'ESPECIAIS E SUPERS', 90, 200, 4, 'yellow', 'left');
    let y = 252;
    let turbo = false;
    for (const [key, label] of Object.entries(KEY_LABEL)) {
      const m = ch.moves[key];
      if (!m) continue;
      turbo ||= !!m.turbo;
      ptext(c, label, 90, y, 3, 'cyan', 'left', 330);
      ptext(c, m.name + (m.turbo ? ' *' : ''), 440, y, 3, 'creamOut', 'left', 480);
      y += 46;
    }
    if (turbo) ptext(c, '* GINGA + ESPECIAL = TURBINADO', 90, 672, 3, 'dim', 'left');
    pixelBox(c, 60, 720, 880, 270, '#000', R.yellow, 6);
    ptext(c, `MECÂNICA: ${ch.mechName}`, 90, 762, 4, 'gold', 'left', 820);
    pwrap(ch.mechDesc, 820, 3).slice(0, 6).forEach((l, i) => ptext(c, l, 90, 812 + i * 32, 3, 'cream', 'left'));
    pixelBox(c, 980, 160, 880, 830, '#000428', '#5878ff', 6);
    ptext(c, 'COMANDOS BÁSICOS', 1010, 200, 4, 'yellow', 'left');
    [['LEVE → MÉDIO → FORTE', 'Combo básico; termine com Especial e Super'],
      ['↓ + FORTE / ↘ + FORTE', 'Gancho anti-aéreo / Rasteira'],
      ['→ + MÉDIO', 'Golpe de cima (acerta quem defende agachado)'],
      ['LEVE + MÉDIO (OU O)', 'Agarrão: aperte de novo para escapar'],
      ['GINGA (SEGURAR)', 'Defesa em pé, agachado e no ar; no tempo exato, Defesa Perfeita'],
      ['→ + GINGA NUM GOLPE QUE ACERTOU', 'Arrancada: corre e continua o combo'],
      ['GINGA + FORTE', 'Golpe Blindado: aguenta 2 golpes e derruba'],
      ['LEVE + MÉDIO DEFENDENDO', 'Empurrão: afasta o atacante (1 gomo de Ginga)'],
      ['GANCHO ACERTOU + SEGURAR ↑', 'Pulo alto: emende golpes no ar'],
      ['BOTÃO DE GOLPE AO CAIR', 'Rolamento: levanta rolando (← ou → escolhe o lado)'],
      ['→→ / ←←', 'Correr / Recuo rápido']].forEach(([cmd, what], i) => {
      const yy = 252 + i * 68;
      ptext(c, cmd, 1010, yy, 3, 'cyan', 'left', 820);
      ptext(c, what, 1010, yy + 28, 3, 'cream', 'left', 820);
    });
    const gg = glyphs(devices);
    ptext(c, `${devices.kind === 'controle' ? '○' : 'ESC'} VOLTA   •   LEVE ${gg.L} • MÉDIO ${gg.M} • FORTE ${gg.H} • ESPECIAL ${gg.S} • DEFESA ${gg.G} • AGARRÃO ${gg.T} • SUPER ${gg.X}`, W / 2, 1040, 3, 'silver', 'center', 1840);
  }

  /** Lista de combos do lutador; no Treino, cada um pode ser praticado ou demonstrado. */
  function drawComboList() {
    const ch = app.st.f[0].ch;
    const list = COMBOS[ch.id] || [];
    const g = glyphs(devices);
    navyBackground(c);
    headerBar(c, 'LISTA DE COMBOS', ch.name);
    if (!list.length) ptext(c, 'ESTE PERSONAGEM AINDA NÃO TEM COMBOS NA LISTA.', W / 2, 500, 5, 'cream');
    list.forEach((cb, i) => {
      const y = 160 + i * 205;
      const sel = i === app.ccur;
      pixelBox(c, 100, y, 1720, 185, sel ? '#14082c' : '#000428', sel ? R.yellow : '#5878ff', 6);
      if (sel && app.frame % 30 < 20) ptext(c, '▶', 70, y + 42, 5, 'gold');
      ptext(c, `${i + 1}. ${cb.name}`, 140, y + 42, 5, sel ? 'gold' : 'creamOut', 'left', 1300);
      const t = app.trial && app.trial.combo === cb ? app.trial : null;
      if (t && t.done) ptext(c, '✓ COMPLETO', 1780, y + 42, 4, 'green', 'right');
      let x = 140;
      cb.steps.forEach((st, k) => {
        const lab = stepLabel(st, g).toUpperCase();
        const w = ptextWidth(lab, 4) + 36;
        pixelBox(c, x, y + 78, w, 54, '#000', sel ? R.cream : '#8088b0', 4);
        ptext(c, lab, x + w / 2, y + 105, 4, 'creamOut');
        x += w + 14;
        if (k < cb.steps.length - 1) { ptext(c, '→', x + 14, y + 105, 3, 'yellow'); x += 42; }
      });
      ptext(c, cb.tip, 140, y + 160, 3, 'dim', 'left', 1640);
    });
    const back = devices.kind === 'controle' ? '○' : 'ESC';
    const hint = app.mode === 'training'
      ? `${g.S} TREINAR ESTE COMBO   •   ${g.L} VER DEMONSTRAÇÃO   •   ${back} VOLTAR`
      : `NO TREINO DÁ PARA TREINAR CADA COMBO E VER A DEMONSTRAÇÃO   •   ${back} VOLTAR`;
    ptext(c, hint, W / 2, 1040, 4, 'blue', 'center', 1840);
  }

  /** Controles: mapeamento do controle à esquerda, teste de botões à direita. */
  function drawControls() {
    const g = devices.padName;
    navyBackground(c);
    headerBar(c, 'CONTROLES', g ? 'CONTROLE CONECTADO' : 'TECLADO');
    ptext(c, g ? `CONECTADO: ${g.slice(0, 70)}` : 'NENHUM CONTROLE: CONECTE (USB OU BLUETOOTH) E APERTE QUALQUER BOTÃO NELE.', 160, 172, 3, g ? 'green' : 'yellow', 'left', 1700);
    const held = { ...(devices.pad || {}) };
    for (const [k, v] of Object.entries(devices.held || {})) if (v) held[k] = true;
    const row = (i, label, value, waiting) => {
      const r = controlRow(i), sel = i === app.kcur;
      pixelBox(c, r.x, r.y, r.w, r.h, sel ? '#14082c' : '#000428', sel ? R.yellow : '#5878ff', 4);
      ptext(c, label, r.x + 30, r.y + r.h / 2, 4, sel ? 'gold' : 'creamOut', value == null ? 'left' : 'left', 520);
      if (value != null) ptext(c, value, r.x + r.w - 30, r.y + r.h / 2, 4, waiting ? 'gold' : 'cyan', 'right', 420);
    };
    ACTIONS.forEach(([a, label], i) => {
      const btn = Object.entries(devices.padMap).filter(([, v]) => v === a).map(([b]) => PS_NAMES[b] || `B${b}`).join(' / ') || '—';
      const waiting = i === app.kcur && app.remap;
      row(i, label.toUpperCase(), waiting ? 'APERTE O BOTÃO NOVO…' : btn.toUpperCase(), waiting);
    });
    row(ACTIONS.length, 'RESTAURAR PADRÃO', null, false);
    // teste de botões: tudo que está apertado acende
    pixelBox(c, 1220, 220, 600, 660, '#000', R.yellow, 6);
    ptext(c, 'TESTE DE BOTÕES', 1520, 270, 5, 'gold');
    for (const [k, sym, x, yy] of [['up', '↑', 1520, 390], ['down', '↓', 1520, 530], ['left', '←', 1440, 460], ['right', '→', 1600, 460]]) {
      pixelBox(c, x - 40, yy - 34, 80, 68, held[k] ? '#7dff8a' : '#1c1c66', held[k] ? '#ffffff' : '#5878ff', 4);
      ptext(c, sym, x, yy, 5, held[k] ? 'ink' : 'creamOut');
    }
    ACTIONS.slice(0, 7).forEach(([a, label], i) => {
      const x = 1270 + (i % 4) * 128;
      const yy = 680 + Math.floor(i / 4) * 92;
      pixelBox(c, x, yy - 34, 114, 68, held[a] ? '#7dff8a' : '#1c1c66', held[a] ? '#ffffff' : '#5878ff', 4);
      ptext(c, label.split(' ')[0].toUpperCase(), x + 57, yy, 3, held[a] ? 'ink' : 'creamOut', 'center', 100);
    });
    ptext(c, g ? '✕ TROCA O BOTÃO DA AÇÃO ESCOLHIDA   •   ○ VOLTA' : 'TECLADO: J K L I GOLPES • U DEFESA • O AGARRÃO • P SUPER • ENTER PAUSA • ESC VOLTA', W / 2, 1040, 4, 'blue', 'center', 1840);
  }

  /** Painel do desafio de combo (Treino). */
  function drawTrial() {
    const t = app.trial;
    if (!t) return;
    const g = glyphs(devices);
    const top = 340;
    slab(c, 30, top, 640, 80 + t.combo.steps.length * 52, 'rgba(18,8,12,.82)', 16);
    text(c, `${app.demo ? 'DEMONSTRAÇÃO' : 'DESAFIO'}: ${t.combo.name}`, 60, top + 32, 32, '#ffcf2a', 'left');
    t.combo.steps.forEach((s, i) => {
      const y = top + 82 + i * 52;
      const done = t.done || i < t.idx;
      const cur = !t.done && i === t.idx;
      text(c, `${done ? '✔' : cur ? '▶' : '·'} ${stepLabel(s, g)}`, 70, y, 34, done ? '#7dff8a' : cur ? '#fff' : '#8a7a84', 'left', '#12080c', 5);
    });
    if (t.fails && !t.done && t.idx === 0) text(c, 'caiu: recomece do início', 60, top + 82 + t.combo.steps.length * 52, 24, '#ff8a7a', 'left', '#12080c', 4);
  }

  /** Últimas entradas do jogador (Treino). */
  function drawInputLog() {
    app.inputLog.forEach((e, i) => {
      c.globalAlpha = Math.max(0.25, 1 - i * 0.06);
      text(c, `${e.d} ${e.b}`.trim(), W - 120, 250 + i * 44, 32, '#fff', 'right', '#12080c', 5);
    });
    c.globalAlpha = 1;
  }

  function drawNotice() {
    const n = devices.notice;
    if (!n || n.t <= 0) return;
    n.t--;
    c.globalAlpha = Math.min(1, n.t / 30);
    slab(c, W / 2 - 440, 940, 880, 60, '#12080c', 16, '#7dff8a');
    text(c, n.text, W / 2, 970, 30, '#7dff8a', 'center', null);
    c.globalAlpha = 1;
  }

  const bossHint = () => BOSS_TALK[app.foe?.id]?.find(line => line.say.startsWith('DICA:'))?.say || app.foe?.mechDesc || '';

  function syncAccessibleMenus() {
    const items = [], add = (id, label, x, y, w, h, activate, selected = false, focus) => items.push({ id, label, x, y, w, h, activate, selected, focus });
    const press = k => { devices.pressed[k] = true; };
    const choose = (field, i) => { app[field] = i; press('ok'); };
    let title = 'Salvadores Nacionais', description = '';
    if (app.screen === 'title') MENU.forEach(([id, label], i) => { const r = titleItem(i); add(id, label, r.x, r.y, r.w, r.h, () => choose('cur', i), app.cur === i, () => { app.cur = i; }); });
    else if (app.screen === 'select' || app.screen === 'selectFoe') {
      const rival = app.screen === 'selectFoe', list = rival ? FOES : HEROES, field = rival ? 'foeCur' : 'hero';
      title = rival ? 'Escolha o rival' : 'Escolha seu Salvador';
      const ch = list[app[field]]; description = ch ? `${ch.name} · ${ch.style}. ${ch.mechDesc}` : 'Surpresa: um rival será sorteado.';
      const boxes = rival ? foeCards(list.length) : heroCards(app.mode === 'story');
      list.forEach((ch, i) => { const r = boxes[i]; add(`pick-${i}`, ch?.name || 'Aleatório', r.x, r.y, r.w, r.h, () => { app[field] = i; }, app[field] === i, () => { app[field] = i; }); items.at(-1).icon = globalThis.__COMIC_UI?.assets['icon-' + ch?.id]?.url; });
      add('confirm-selection', 'Confirmar escolha', 660, 985, 600, 50, () => press('ok'));
    } else if (['storyIntro', 'storyEnd', 'storyTalk', 'storyMap', 'storyLose'].includes(app.screen)) {
      const run = app.story; title = `Capítulo ${run.chapter + 1} · ${CHAPTERS[run.chapter].place}`;
      if (app.screen === 'storyIntro' || app.screen === 'storyEnd') description = app.storyPages[run.page] || '';
      if (app.screen === 'storyTalk') { const line = talkLines(run)[run.page]; description = `${line?.who ? ALL[line.who].name + ': ' : ''}${line?.say || ''}`; }
      if (app.screen === 'storyLose') { title = 'A turnê não pode parar'; ['Continuar', 'Menu'].forEach((label, i) => add(`continue-${i}`, label, 880, 620 + i * 91, 850, 64, () => choose('cur', i))); }
      else {
        if (app.screen === 'storyMap') {
          description = run.cleared ? 'Capítulo concluído. Os aliados seguem juntos para a próxima parada.' : `Próximo confronto: ${CHAPTERS[run.chapter].bossName}. Sem duelos entre aliados.`;
          if (!run.cleared && run.idx === 0) CHAPTERS.forEach((ch, i) => { const r = chapterBox(i); if (i <= run.done) add(`chapter-${i}`, `${ch.n} · ${ch.bossName}`, r.x, r.y, r.w, r.h, () => { Object.assign(run, createRunAt(run.hero, i, run.done), { intro: -1 }); saveCheckpoint(run); }); });
        }
        add('next', app.screen === 'storyMap' ? (run.cleared && !nextChapter(run) ? 'Voltar ao menu' : 'Seguir para o confronto') : 'Continuar', 1400, 1018, 480, 62, () => press('ok'));
        add('previous', app.screen === 'storyMap' ? 'Menu' : 'Página anterior', 30, 1018, 650, 62, () => press('back'));
      }
    } else if (app.screen === 'vs') {
      title = `${HEROES[app.hero].name} × ${app.foe.name}`; description = app.mode === 'story' ? 'Os Salvadores lutam juntos contra os chefes da turnê.' : app.foe.mechDesc;
      add('fight', app.vsReady ? 'Começar luta' : 'Carregando lutadores…', 650, 800, 620, 200, () => press('ok'));
    } else if (app.screen === 'result') {
      title = app.st.winner === null ? 'Empate' : app.st.winner === 0 ? 'Vitória!' : 'Derrota';
      RESULT.forEach((label, i) => add(`result-${i}`, label, 880, 681 + i * 91, 850, 64, () => choose('cur', i), app.cur === i));
    } else if (app.screen === 'settings') {
      title = 'Opções';
      OPTIONS.forEach(([id, label], i) => { const r = optionItem(i); add(id, optionLabel(id, label), r.x, r.y, r.w, r.h, () => choose('kcur', i), app.kcur === i, () => { app.kcur = i; }); });
    } else if (app.screen === 'gallery') {
      title = `Finais · ${HEROES[app.hero].name}`; description = (loadProgress()[HEROES[app.hero].id] || 0) >= CHAPTERS.length ? HERO_ENDINGS[HEROES[app.hero].id] : 'Complete a História com este Salvador para liberar seu final.';
      add('hero-previous', 'Salvador anterior', 80, 800, 700, 100, () => press('left')); add('hero-next', 'Próximo Salvador', 1100, 800, 700, 100, () => press('right'));
    } else if (app.screen === 'controls' || (app.screen === 'fight' && app.paused && app.sub === 'controls')) {
      title = 'Controles'; description = 'Toque: direcional e botões na luta. Teclado: WASD/setas, J/K/L, I especial, U defesa, O agarrão, P super. Conecte um controle para remapear.';
      ACTIONS.forEach(([key, label], i) => { const r = controlRow(i); add(`control-${key}`, label, r.x, r.y, r.w, r.h, () => choose('kcur', i), app.kcur === i); });
    } else if (app.screen === 'fight' && app.paused) {
      title = 'Pausado'; description = bossHint();
      if (app.sub === 'moves') { title = 'Lista de golpes'; description = Object.entries(app.st.f[0].ch.moves).filter(([key]) => key !== 'click').map(([key, m]) => `${KEY_LABEL[key] || key}: ${m.name}`).join(' · '); }
      else if (app.sub === 'combos') {
        title = 'Lista de combos'; description = 'Escolha um combo para praticar ou peça uma demonstração.';
        (COMBOS[app.st.f[0].ch.id] || []).forEach((combo, i) => { add(`combo-${i}`, `${combo.name}: ${combo.steps.join(' → ')}`, 100, 160 + i * 205, 1400, 185, () => { app.ccur = i; startCombo(combo, false); }); if (app.st.training) add(`demo-${i}`, `Demonstrar ${combo.name}`, 1520, 160 + i * 205, 300, 185, () => startCombo(combo, true)); });
      } else pauseLabels().forEach((label, i) => add(`pause-${i}`, label, 750, 355 + i * 76, 650, 64, () => choose('pcur', i), app.pcur === i));
    } else if (app.screen === 'select2') {
      title = 'Versus 2 jogadores'; description = 'Cada jogador entra e escolhe com seu próprio controle. O teclado pode ser um dos jogadores.';
    }
    if (app.screen !== 'title' && items.length && !['storyIntro', 'storyEnd', 'storyTalk', 'storyMap'].includes(app.screen)) add('back', 'Voltar', 20, 1018, 500, 62, () => press('back'));
    // A connected gamepad remains responsible for its own player slot; no synthetic joins.
    if (!items.length && app.screen === 'select2') add('back', 'Voltar', 20, 1018, 500, 62, () => press('back'));
    syncMenu(title, description, items);
  }

  function render() {
    if(document.body.dataset.screen!==app.screen)document.body.dataset.screen=app.screen;
    selectStageAudio(encounterStage(app));
    setStageAudioActive(app.screen === 'fight' && !app.paused && !document.hidden);
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    app.onRender?.();
    syncAccessibleMenus();
    document.body.dataset.paused = String(app.paused || app.systemPaused);
    if(drawComicScreen(c,app,{menu:MENU,options:OPTIONS.map(([id,label])=>[id,optionLabel(id,label)]),srcName,keys:{pad:devices.kind==='controle'}})){drawNotice();return;}
    if (app.screen === 'fight') drawFight();
    else if (app.screen === 'controls') drawControls();
    else backdrop();
    drawNotice();
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    pollPad(devices);
    acc += Math.min(100, now - last);
    last = now;
    let n = 0;
    while (acc >= 1000 / 60 && n++ < 5) {
      tick();
      acc -= 1000 / 60;
    }
    render();
    app.raf = requestAnimationFrame(loop);
  }

  app.interrupt = reason => {
    clearPressed(devices); devices.held = {}; devices.touch = {};
    if (app.screen === 'fight') { app.paused = true; app.sub = null; app.pcur = 0; }
    app.systemPaused = reason === 'portrait' || reason === 'hidden';
  };
  app.releaseInterruption = () => { app.systemPaused = false; };
  app.tick = tick;
  app.render = render;
  app.startFight = startFight;
  app.pickFoe = pickFoe;
  app.startStory = startStory;
  app.run = () => {
    last = performance.now();
    app.raf = requestAnimationFrame(loop);
  };
  return app;
}
