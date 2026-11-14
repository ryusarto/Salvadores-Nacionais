import { SYS } from '../data/system.js';
import { HEROES, BOSSES } from '../data/characters/index.js';
import { createMatch, step } from '../core/match.js';
import { createFighter } from '../core/fighter.js';
import { createBrain, aiInput } from '../core/ai.js';
import { EMPTY_INPUT } from '../core/input.js';
import { buildStage, drawStage } from '../render/stage.js';
import { drawEffect } from '../render/sprites.js';
import { drawFighter, drawBoxes } from '../render/mannequin.js';
import { createFx, fxEvents, fxUpdate, fxDrawBack, fxDrawFront, fxDrawScreen, drawEntities } from '../render/fx.js';
import { createHud, drawHud } from '../render/hud.js';
import { text, slab, halftone } from '../render/draw.js';
import { readInput, takePressed, pollPad, glyphs, rumble, remapPad, resetPad, PS_NAMES, readInputFrom, takePressedFrom, clearPressed, rumbleOn, padLabel } from './devices.js';
import { COMBOS } from '../data/combos.js';
import { createTracker, trackCombo, createRunner, runnerInput, runnerDone, stepLabel } from '../core/combos.js';
import { audioEvents, sfx } from './audio.js';

const W = SYS.VIEW_W;
const H = SYS.VIEW_H;
const MENU = [['story', 'MODO HISTÓRIA'], ['versus', 'VERSUS CPU'], ['vs2', 'VERSUS 2 JOGADORES'], ['training', 'TREINO'], ['controls', 'CONTROLES'], ['diff', 'DIFICULDADE']];
const loadDiff = () => {
  try {
    const n = +localStorage.getItem('sn-dificuldade');
    return n >= 0 && n < SYS.DIFFICULTY.length ? n : 0;
  } catch {
    return 0;
  }
};
const PAUSE = ['CONTINUAR', 'LISTA DE COMBOS', 'LISTA DE GOLPES', 'CONTROLES', 'REINICIAR LUTA', 'SAIR'];
const ACTIONS = [['L', 'Leve'], ['M', 'Médio'], ['H', 'Forte'], ['S', 'Especial'], ['G', 'Defesa (Ginga)'], ['T', 'Agarrão'], ['X', 'Super'], ['start', 'Pausa'], ['back', 'Voltar']];
const RESULT = ['REVANCHE', 'TROCAR PERSONAGEM', 'MENU'];
const DUMMY = ['PARADO', 'DEFENDE TUDO', 'CPU'];
const KEY_LABEL = { c1: '→ ← + Leve', c2: '↓ → + Médio', '5S': 'Especial', '6S': '→ + Especial', '2S': '↓ + Especial', '4S': '← + Especial', jS: 'No ar: Especial', SA3: 'Super com 3 barras', SA1: '↓ + Super (1 barra)' };

/** Cria o jogo sobre um canvas. Retorna o objeto do app (útil para testes). */
export function createApp(canvas, devices, opts = {}) {
  const c = canvas.getContext('2d');
  const app = {
    screen: 'title', cur: 0, mode: 'story', hero: 0, foe: null,
    st: null, brain: null, fx: createFx(), hud: createHud(), layers: buildStage(),
    cam: (SYS.STAGE_W - W) / 2, frame: 0, paused: false, pcur: 0, sub: null, ccur: 0, kcur: 0, remap: 0, trial: null, demo: null, demoT: 0, inputLog: [], lastIn: null,
    boxes: !!opts.boxes, dummy: 0, level: SYS.DIFFICULTY[loadDiff()].level, diff: loadDiff(), stats: null, overT: 0, vsT: 0,
    autoplay: opts.autoplay || null,
    slots: [null, null], ready: [false, false], hero2: 1,
  };

  function startFight() {
    const hero = HEROES[app.hero];
    const D = SYS.DIFFICULTY[app.diff];
    app.level = D.level;
    const fair = app.mode === 'training' || app.mode === 'vs2';
    if (app.mode === 'vs2') app.foe = HEROES[app.hero2];
    app.st = createMatch({ chars: [hero, app.foe], seed: (Date.now() & 0xffff) + 1, training: app.mode === 'training', dmgMul: fair ? [1, 1] : D.dmg });
    app.brain = createBrain(app.level);
    app.p1brain = app.autoplay ? createBrain(2) : null;
    app.fx = createFx();
    app.hud = createHud();
    app.stats = { maxCombo: 0, dmg: 0, frames: 0 };
    app.paused = false;
    app.sub = null;
    app.trial = null;
    app.demo = null;
    app.inputLog = [];
    app.overT = 0;
    app.screen = 'fight';
  }

  function pickFoe() {
    if (app.mode === 'story') app.foe = BOSSES[0];
    else if (app.mode === 'training') app.foe = BOSSES[0];
    else {
      const pool = [...HEROES, ...BOSSES];
      app.foe = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  function p2Input() {
    const st = app.st;
    if (app.mode === 'vs2') return readInputFrom(devices, app.slots[1]);
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

  /** Tela de entrada: cada jogador aperta ✕ (ou Enter) no seu controle. */
  function joinTick(back) {
    for (const src of sources()) {
      const p = takePressedFrom(devices, src);
      const join = p.ok || p.S || p.start || (src === 'kb' && (p.L || p.S));
      const leave = p.cancel || p.back || (src === 'kb' && p.M);
      const at = app.slots.indexOf(src);
      if (leave && at >= 0) {
        app.slots[at] = null;
        app.ready[at] = false;
      } else if (join && at < 0) {
        const free = app.slots.indexOf(null);
        if (free >= 0) {
          app.slots[free] = src;
          sfx.ok();
          rumbleOn(devices, src, 0.4, 0.6, 150);
        }
      }
    }
    if (back && app.slots.every((s) => s === null)) return 'exit';
    if (app.slots.every((s) => s !== null)) {
      app.ready = [false, false];
      app.hero2 = (app.hero + 1) % HEROES.length;
      return 'select';
    }
    return null;
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

  /** Um passo lógico (1/60 s). */
  function tick() {
    app.frame++;
    const pr = takePressed(devices);
    const horiz = app.screen !== 'title';
    const nav = (n, len) => (app[n] = (app[n] + len + (pr.down || (horiz && pr.right) ? 1 : 0) - (pr.up || (horiz && pr.left) ? 1 : 0)) % len);
    const ok = pr.start || pr.L || pr.S || pr.ok;
    const back = pr.back || pr.M || pr.cancel;
    if (pr.up || pr.down || pr.left || pr.right) sfx.menu();
    if (ok) sfx.ok();

    if (app.screen === 'title') {
      nav('cur', MENU.length);
      const isDiff = MENU[app.cur][0] === 'diff';
      if (isDiff && (ok || pr.left || pr.right)) {
        app.diff = (app.diff + SYS.DIFFICULTY.length + (pr.left ? -1 : 1)) % SYS.DIFFICULTY.length;
        try {
          localStorage.setItem('sn-dificuldade', String(app.diff));
        } catch { /* sem armazenamento: vale só nesta sessão */ }
      } else if (ok && MENU[app.cur][0] === 'controls') {
        app.screen = 'controls';
        app.kcur = 0;
        app.remap = 0;
      } else if (ok && MENU[app.cur][0] === 'vs2') {
        app.mode = 'vs2';
        app.slots = [null, null];
        app.ready = [false, false];
        clearPressed(devices);
        app.screen = 'join';
      } else if (ok) {
        app.mode = MENU[app.cur][0];
        app.screen = 'select';
      }
    } else if (app.screen === 'join') {
      const r = joinTick(back);
      if (r === 'exit') app.screen = 'title';
      else if (r === 'select') {
        clearPressed(devices);
        app.screen = 'select2';
      }
    } else if (app.screen === 'select2') {
      const r = select2Tick();
      if (r === 'back') {
        app.slots = [null, null];
        clearPressed(devices);
        app.screen = 'join';
      } else if (r === 'go') {
        app.foe = HEROES[app.hero2];
        app.vsT = 0;
        app.screen = 'vs';
      }
    } else if (app.screen === 'controls') {
      if (controlsTick(pr, ok, back)) app.screen = 'title';
    } else if (app.screen === 'select') {
      const n = HEROES.length;
      app.hero = (app.hero + n + (pr.right ? 1 : 0) - (pr.left ? 1 : 0) + (pr.down ? 4 : 0) - (pr.up ? 4 : 0)) % n;
      if (back) app.screen = 'title';
      if (ok) {
        pickFoe();
        app.vsT = 0;
        app.screen = 'vs';
      }
    } else if (app.screen === 'vs') {
      app.vsT++;
      if (back) {
        app.ready = [false, false];
        app.screen = app.mode === 'vs2' ? 'select2' : 'select';
      }
      else if ((ok && app.vsT > 20) || app.vsT > 240) startFight();
    } else if (app.screen === 'fight') {
      const st = app.st;
      if (pr.boxes) app.boxes = !app.boxes;
      if (pr.dummy) app.dummy = (app.dummy + 1) % DUMMY.length;
      if (pr.level) {
        app.level = (app.level + 1) % 3;
        app.brain.level = app.level;
      }
      if (app.paused) {
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
            } else if (item === 'REINICIAR LUTA') startFight();
            else app.screen = 'title';
          }
        }
        return;
      }
      if ((pr.start || pr.back) && st.phase === 'fight') {
        app.paused = true;
        app.pcur = 0;
        return;
      }
      // câmera lenta no nocaute
      if (st.phase === 'ko' && st.pf < 60 && app.frame % 2) return;
      let in0 = app.p1brain ? aiInput(st, 0, app.p1brain) : app.mode === 'vs2' ? readInputFrom(devices, app.slots[0]) : readInput(devices);
      if (app.demo) {
        in0 = runnerInput(app.demo, st);
        if (runnerDone(app.demo).finished || ++app.demoT > 360) app.demo = null;
      }
      logInput(in0);
      step(st, in0, p2Input());
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
        app.screen = 'result';
        app.cur = 0;
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

  function backdrop(tone = '#1a0d14') {
    c.fillStyle = tone;
    c.fillRect(0, 0, W, H);
    halftone(c, 0, 0, W, 420, 'rgba(224,43,43,.28)', 22, 8);
    slab(c, -60, 820, W + 120, 300, '#12080c', 60, null);
    c.strokeStyle = 'rgba(255,207,42,.12)';
    c.lineWidth = 8;
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      c.moveTo(i * 170 - 200 + ((app.frame * 0.6) % 170), 0);
      c.lineTo(i * 170 - 600 + ((app.frame * 0.6) % 170), H);
      c.stroke();
    }
  }

  function logo(x, y, s = 1) {
    c.save();
    c.translate(x, y);
    c.rotate(-0.05);
    const g = c.createLinearGradient(0, -80 * s, 0, 120 * s);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#ffe14a');
    g.addColorStop(1, '#2fbf4a');
    text(c, 'SALVADORES', 0, -62 * s, 150 * s, g, 'center', '#12080c', 24 * s);
    text(c, 'NACIONAIS', 20 * s, 74 * s, 170 * s, g, 'center', '#12080c', 24 * s);
    c.restore();
  }

  function preview(ch, x, y, scale, face = 1) {
    const f = createFighter(ch, 0, 0);
    f.face = face;
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.translate(0, -SYS.GROUND_Y);
    drawFighter(c, f, app.frame);
    c.restore();
  }

  function controls(y = 1040) {
    if (app.touchUI) return text(c, 'Direcional move · LEVE confirma · MÉDIO volta · II pausa · LEVE+MÉDIO agarrão', W / 2, y - 6, 30, '#d8d0dc', 'center', '#12080c', 5);
    text(c, 'WASD/SETAS mover   J leve · K médio · L forte · I especial   U ginga · O agarrão · P super   ENTER confirma · ESC volta', W / 2, y, 26, '#d8d0dc', 'center', '#12080c', 5);
  }

  function drawTitle() {
    backdrop();
    logo(W / 2, 300, 1.15);
    text(c, 'TURNÊ PELO BRASIL — BUILD DE COMBATE', W / 2, 505, 34, '#ffcf2a');
    MENU.forEach(([id, name], i) => {
      const sel = i === app.cur;
      const label = id === 'diff' ? `◀ ${name}: ${SYS.DIFFICULTY[app.diff].name} ▶` : name;
      slab(c, W / 2 - 340, 560 + i * 80, 680, 66, sel ? '#e02b2b' : '#2a1a22', 26);
      text(c, (sel && id !== 'diff' ? '▶ ' : '') + label, W / 2, 594 + i * 80, 44, sel ? '#fff' : '#b8a8b4');
    });
    controls();
  }

  function drawSelect() {
    backdrop('#160b12');
    const ch = HEROES[app.hero];
    slab(c, 60, 50, 760, 90, '#e02b2b', 30);
    text(c, 'SELECIONE SEU SALVADOR', 440, 96, 58, '#fff');
    preview(ch, 440, 850, 1.2);
    slab(c, 100, 880, 680, 90, '#12080c', 26);
    text(c, ch.name, 440, 926, 60, '#ffe14a');
    // grade
    const cols = 4;
    HEROES.forEach((h, i) => {
      const x = 940 + (i % cols) * 228;
      const y = 80 + Math.floor(i / cols) * 250;
      const sel = i === app.hero;
      slab(c, x, y, 200, 220, sel ? '#ffcf2a' : '#2a1a22', 10);
      c.save();
      c.beginPath();
      c.rect(x - 6, y + 4, 212, 212);
      c.clip();
      preview(h, x + 100, y + 330, 0.62);
      c.restore();
      slab(c, x - 4, y + 176, 208, 44, sel ? '#e02b2b' : '#12080c', 8);
      text(c, h.name.split(',')[0], x + 100, y + 199, 28, '#fff', 'center', '#12080c', 5);
    });
    // ficha
    slab(c, 940, 596, 900, 320, '#12080c', 20);
    text(c, `ESTILO: ${ch.style.toUpperCase()}`, 980, 646, 36, '#ffcf2a', 'left');
    text(c, `MECÂNICA: ${ch.mechName}`, 980, 700, 40, '#35d6c0', 'left');
    wrap(ch.mechDesc, 980, 748, 820, 28, '#fff');
    text(c, `SUPER: ${ch.moves.SA3.name.toUpperCase()}`, 980, 880, 36, '#ff7a2e', 'left');
    text(c, MENU.find((m) => m[0] === app.mode)[1], 440, 168, 34, '#ffcf2a');
    controls();
  }

  const P_COL = ['#ffcf2a', '#35d6c0'];

  function drawJoin() {
    backdrop('#160b12');
    slab(c, 60, 50, 900, 90, '#e02b2b', 30);
    text(c, 'VERSUS 2 JOGADORES', 510, 96, 58, '#fff');
    text(c, 'Cada jogador aperta ✕ no seu controle (ou Enter no teclado) para entrar.', W / 2, 220, 36, '#fff');
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? 260 : 1060;
      const src = app.slots[i];
      slab(c, x, 300, 600, 420, src !== null ? '#2a1a22' : '#1a1016', 30, P_COL[i]);
      text(c, `JOGADOR ${i + 1}`, x + 300, 380, 64, P_COL[i]);
      if (src !== null) {
        text(c, srcName(src), x + 300, 500, 30, '#fff');
        text(c, 'PRONTO!', x + 300, 600, 70, '#7dff8a');
      } else {
        const blink = Math.floor(app.frame / 30) % 2;
        text(c, blink ? 'APERTE ✕' : 'AGUARDANDO…', x + 300, 540, 56, '#d8d0dc');
      }
    }
    const n = Object.keys(devices.pads).length;
    text(c, n ? `${n} controle(s) conectado(s)` : 'Nenhum controle conectado: ligue os controles por USB ou Bluetooth e aperte um botão em cada um.', W / 2, 820, 32, n >= 2 ? '#7dff8a' : '#ffcf2a');
    text(c, '○ sai da vaga (com as duas vagas vazias, volta ao menu)   ·   ESC volta ao menu', W / 2, 1040, 30, '#d8d0dc');
  }

  function drawSelect2() {
    backdrop('#160b12');
    slab(c, W / 2 - 420, 30, 840, 80, '#e02b2b', 30);
    text(c, 'ESCOLHAM SEUS SALVADORES', W / 2, 72, 50, '#fff');
    const picks = [HEROES[app.hero], HEROES[app.hero2]];
    for (let i = 0; i < 2; i++) {
      const ch = picks[i];
      const cx = i === 0 ? 300 : W - 300;
      preview(ch, cx, 860, 1.05, i === 0 ? 1 : -1);
      slab(c, cx - 270, 880, 540, 80, '#12080c', 24, P_COL[i]);
      text(c, ch.name, cx, 920, 42, P_COL[i]);
      text(c, `J${i + 1} · ${srcName(app.slots[i])}`, cx, 160, 26, P_COL[i]);
      if (app.ready[i]) {
        c.save();
        c.translate(cx, 500);
        c.rotate(-0.1);
        text(c, 'PRONTO!', 0, 0, 90, '#7dff8a', 'center', '#12080c', 14);
        c.restore();
      }
    }
    // grade central, com os dois cursores
    const cols = 4;
    HEROES.forEach((h, i) => {
      const x = 590 + (i % cols) * 190;
      const y = 200 + Math.floor(i / cols) * 230;
      const s1 = i === app.hero;
      const s2 = i === app.hero2;
      slab(c, x, y, 170, 200, s1 && s2 ? '#7dff8a' : s1 ? P_COL[0] : s2 ? P_COL[1] : '#2a1a22', 10);
      c.save();
      c.beginPath();
      c.rect(x - 6, y + 4, 182, 192);
      c.clip();
      preview(h, x + 85, y + 300, 0.55);
      c.restore();
      slab(c, x - 4, y + 160, 178, 40, '#12080c', 8);
      text(c, h.name.split(',')[0], x + 85, y + 180, 24, '#fff', 'center', '#12080c', 5);
      if (s1) text(c, 'J1', x + 20, y + 24, 28, P_COL[0], 'center', '#12080c', 5);
      if (s2) text(c, 'J2', x + 150, y + 24, 28, P_COL[1], 'center', '#12080c', 5);
    });
    text(c, 'Cada um move o seu cursor   ·   ✕ confirma   ·   ○ desfaz', W / 2, 1040, 30, '#d8d0dc');
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

  function drawVs() {
    backdrop('#1c0c10');
    const a = HEROES[app.hero];
    const b = app.foe;
    const t = Math.min(1, app.vsT / 14);
    preview(a, 430 - (1 - t) * 500, 940, 1.5, 1);
    preview(b, W - 430 + (1 - t) * 500, 940, 1.5, -1);
    c.save();
    c.translate(W / 2, 470);
    c.rotate(-0.08);
    text(c, 'VS', 0, 0, 300, '#ffcf2a', 'center', '#12080c', 34);
    c.restore();
    slab(c, 80, 60, 700, 90, '#12080c', 26);
    text(c, a.name, 430, 106, 56, '#fff');
    slab(c, W - 780, 60, 700, 90, '#e02b2b', 26);
    text(c, b.name, W - 430, 106, 56, '#fff');
    if (app.mode === 'vs2') {
      text(c, 'JOGADOR 1', 430, 170, 34, '#ffcf2a');
      text(c, 'JOGADOR 2', W - 430, 170, 34, '#35d6c0');
    }
    if (app.mode === 'story' && b.place) {
      slab(c, W / 2 - 330, 800, 660, 80, '#ffcf2a', 22);
      text(c, `CAPÍTULO 1 — ${b.place}`, W / 2, 842, 46, '#12080c', 'center', null);
    }
    text(c, devices.kind === 'controle' ? '✕ para começar' : 'ENTER para começar', W / 2, 1010, 34, '#d8d0dc');
  }

  function drawFight() {
    const st = app.st;
    const [a, b] = st.f;
    const target = Math.max(0, Math.min(SYS.STAGE_W - W, (a.x + b.x) / 2 - W / 2));
    app.cam += (target - app.cam) * 0.16;
    const fx = app.fx;
    const sx = fx.shake ? (Math.random() - 0.5) * fx.shake * 2 : 0;
    const sy = fx.shake ? (Math.random() - 0.5) * fx.shake * 2 : 0;
    drawStage(c, app.layers, app.cam);
    fxDrawScreen(c, fx, 'under');
    c.save();
    c.translate(-app.cam + sx, sy);
    fxDrawBack(c, fx);
    const order = b.state === 'attack' || a.state === 'hitstun' || a.state === 'thrown' ? [a, b] : [b, a];
    for (const f of order) {
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
      drawFighter(c, f, app.frame + f.side * 17);
      if (absorb && absorb.t / absorb.dur > .35) {
        c.translate(f.x, SYS.GROUND_Y - f.y);
        c.scale(absorb.face,1);
        drawEffect(c,'franco','adversario-sugado',absorb.t/absorb.dur,-220,-480,440,480);
      }
      c.restore();
    }
    drawEntities(c, st);
    fxDrawFront(c, fx);
    if (app.boxes) for (const f of st.f) drawBoxes(c, f);
    c.restore();
    drawHud(c, st, app.hud);
    if (app.mode === 'vs2') {
      text(c, 'J1', 90, 168, 34, '#ffcf2a');
      text(c, 'J2', W - 90, 168, 34, '#35d6c0');
    }
    fxDrawScreen(c, fx, 'over');
    if (app.mode === 'training') {
      drawTrial();
      drawInputLog();
      text(c, `F1 caixas: ${app.boxes ? 'SIM' : 'NÃO'}   F2 boneco: ${DUMMY[app.dummy]}   F3 nível CPU: ${app.level + 1}`, W / 2, 160, 26, '#fff', 'center', '#12080c', 5);
      const m = a.move;
      if (m) text(c, `${m.name}  preparo ${m.startup} · ativo ${m.active} · recuperação ${m.recovery}`, W / 2, 196, 24, '#ffe14a', 'center', '#12080c', 5);
    }
    if (app.paused) drawPause();
  }

  function drawPause() {
    c.fillStyle = 'rgba(10,4,12,.78)';
    c.fillRect(0, 0, W, H);
    if (app.sub === 'moves') return drawMoveList();
    if (app.sub === 'combos') return drawComboList();
    if (app.sub === 'controls') return drawControls();
    slab(c, W / 2 - 220, 190, 440, 100, '#e02b2b', 30);
    text(c, 'PAUSE', W / 2, 242, 80, '#fff');
    PAUSE.forEach((label, i) => {
      const sel = i === app.pcur;
      slab(c, W / 2 - 320, 330 + i * 92, 640, 72, sel ? '#ffcf2a' : '#2a1a22', 24);
      text(c, label, W / 2, 367 + i * 92, 46, sel ? '#12080c' : '#d8d0dc', 'center', sel ? null : '#12080c');
    });
  }

  function drawMoveList() {
    const ch = app.st.f[0].ch;
    slab(c, 120, 50, 900, 84, '#e02b2b', 26);
    text(c, `LISTA DE GOLPES — ${ch.name}`, 570, 94, 46, '#fff');
    let y = 190;
    const row = (k, v, col = '#fff') => {
      text(c, k, 160, y, 32, '#ffcf2a', 'left', '#12080c', 5);
      text(c, v, 620, y, 32, col, 'left', '#12080c', 5);
      y += 46;
    };
    for (const [key, label] of Object.entries(KEY_LABEL)) {
      const m = ch.moves[key];
      if (m) row(label, m.name + (m.turbo ? '  (Ginga + Especial = turbinado)' : ''));
    }
    y += 16;
    row(`MECÂNICA: ${ch.mechName}`, '', '#35d6c0');
    wrap(ch.mechDesc, 160, y, 1500, 30, '#fff');
    y += 90;
    row('Leve → Médio → Forte', 'Combo básico; termine com Especial e Super');
    row('↓ + Forte / ↘ + Forte', 'Gancho anti-aéreo / Rasteira');
    row('→ + Médio', 'Golpe de cima (acerta quem defende agachado)');
    row('Leve + Médio (ou O)', 'Agarrão — aperte de novo para escapar');
    row('Ginga (segurar)', 'Defesa em pé, agachado (com ↓) e no ar; no tempo exato, Defesa Perfeita');
    row('→ + Ginga num golpe que acertou', 'Arrancada: corre e continua o combo (→→ na defesa: Arrancada livre)');
    row('Ginga + Forte', 'Golpe Blindado: aguenta 2 golpes e derruba');
    row('Leve + Médio defendendo', 'Empurrão: afasta o atacante (1 gomo de Ginga)');
    row('Gancho acertou + segurar ↑', 'Pulo alto: emende Leve, Médio e Forte no ar');
    row('Botão de golpe ao cair', 'Rolamento: levanta rolando (← ou → escolhe o lado)');
    row('→→ / ←←', 'Correr / Recuo rápido');
    const gg = glyphs(devices);
    text(c, `${devices.kind === 'controle' ? '○' : 'ESC'} para voltar   ·   Leve ${gg.L} · Médio ${gg.M} · Forte ${gg.H} · Especial ${gg.S} · Defesa ${gg.G} · Agarrão ${gg.T} · Super ${gg.X}`, W / 2, 1030, 28, '#d8d0dc');
  }

  function drawComboList() {
    const ch = app.st.f[0].ch;
    const list = COMBOS[ch.id] || [];
    const g = glyphs(devices);
    slab(c, 120, 50, 980, 84, '#e02b2b', 26);
    text(c, `LISTA DE COMBOS — ${ch.name}`, 610, 94, 46, '#fff');
    if (!list.length) text(c, 'Este personagem ainda não tem combos na lista.', W / 2, 400, 40, '#fff');
    list.forEach((cb, i) => {
      const y = 170 + i * 200;
      const sel = i === app.ccur;
      slab(c, 120, y, 1680, 180, sel ? '#3a2430' : '#1e1218', 24, sel ? '#ffcf2a' : '#12080c');
      text(c, `${i + 1}. ${cb.name}`, 170, y + 38, 40, sel ? '#ffcf2a' : '#fff', 'left');
      const t = app.trial && app.trial.combo === cb ? app.trial : null;
      if (t && t.done) text(c, '✔ COMPLETO', 1760, y + 38, 34, '#7dff8a', 'right');
      let x = 170;
      cb.steps.forEach((s, k) => {
        const lab = stepLabel(s, g);
        c.font = "italic 900 34px Impact, 'Arial Black', sans-serif";
        const w = c.measureText(lab).width + 40;
        slab(c, x, y + 72, w, 54, '#12080c', 12, '#5a4a52');
        text(c, lab, x + w / 2, y + 99, 34, '#fff', 'center', null);
        x += w + 18;
        if (k < cb.steps.length - 1) {
          text(c, '›', x - 4, y + 99, 40, '#ffcf2a', 'center', null);
          x += 22;
        }
      });
      text(c, cb.tip, 170, y + 155, 26, '#d8d0dc', 'left', '#12080c', 4);
    });
    const back = devices.kind === 'controle' ? '○' : 'ESC';
    const hint = app.mode === 'training'
      ? `${g.S} treinar este combo   ·   ${g.L} ver demonstração   ·   ${back} voltar`
      : `No Treino dá para treinar cada combo e ver a demonstração   ·   ${back} voltar`;
    text(c, hint, W / 2, 1040, 30, '#ffe14a');
  }

  function drawControls() {
    const g = devices.padName;
    c.fillStyle = 'rgba(10,4,12,.9)';
    c.fillRect(0, 0, W, H);
    slab(c, 120, 50, 900, 84, '#e02b2b', 26);
    text(c, 'CONTROLES', 570, 94, 50, '#fff');
    text(c, g ? `Conectado: ${g.slice(0, 70)}` : 'Nenhum controle: conecte o controle (USB ou Bluetooth) e aperte qualquer botão nele.', 160, 180, 30, g ? '#7dff8a' : '#ffcf2a', 'left');
    const held = { ...(devices.pad || {}) };
    for (const [k, v] of Object.entries(devices.held || {})) if (v) held[k] = true;
    ACTIONS.forEach(([a, label], i) => {
      const y = 230 + i * 72;
      const sel = i === app.kcur;
      const btn = Object.entries(devices.padMap).filter(([, v]) => v === a).map(([b]) => PS_NAMES[b] || `B${b}`).join(' / ') || '—';
      slab(c, 160, y, 900, 60, sel ? '#3a2430' : '#1e1218', 16, sel ? '#ffcf2a' : '#12080c');
      text(c, label, 200, y + 30, 34, '#fff', 'left', null);
      const waiting = sel && app.remap;
      text(c, waiting ? 'APERTE O BOTÃO NOVO…' : btn, 1020, y + 30, 34, waiting ? '#ffcf2a' : '#9ff5e8', 'right', null);
    });
    const yr = 230 + ACTIONS.length * 72;
    const selR = app.kcur === ACTIONS.length;
    slab(c, 160, yr, 900, 60, selR ? '#3a2430' : '#1e1218', 16, selR ? '#ffcf2a' : '#12080c');
    text(c, 'RESTAURAR PADRÃO', 610, yr + 30, 34, '#fff', 'center', null);
    // teste de botões: tudo que está apertado acende
    slab(c, 1240, 230, 560, 600, '#1e1218', 20);
    text(c, 'TESTE DE BOTÕES', 1520, 280, 36, '#ffcf2a');
    for (const [k, s, x, yy] of [['up', '↑', 1520, 390], ['down', '↓', 1520, 510], ['left', '←', 1440, 450], ['right', '→', 1600, 450]]) {
      slab(c, x - 40, yy - 34, 80, 68, held[k] ? '#7dff8a' : '#2a1a22', 10);
      text(c, s, x, yy, 44, held[k] ? '#12080c' : '#fff', 'center', null);
    }
    ACTIONS.slice(0, 7).forEach(([a, label], i) => {
      const x = 1290 + (i % 4) * 122;
      const yy = 640 + Math.floor(i / 4) * 84;
      slab(c, x, yy - 32, 110, 64, held[a] ? '#7dff8a' : '#2a1a22', 10);
      text(c, label.split(' ')[0], x + 55, yy, 22, held[a] ? '#12080c' : '#fff', 'center', null);
    });
    text(c, g ? '✕ trocar o botão da ação escolhida   ·   ○ voltar' : 'Teclado: J K L I golpes · U defesa · O agarrão · P super · Enter pausa · ESC volta', W / 2, 1040, 30, '#ffe14a');
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

  function drawResult() {
    backdrop('#1c0c10');
    const st = app.st;
    const win = st.winner === 0;
    const me = st.f[0];
    preview(win || st.winner === null ? me.ch : st.f[1].ch, 430, 940, 1.5, 1);
    c.save();
    c.translate(1180, 250);
    c.rotate(-0.06);
    if (app.mode === 'vs2') text(c, st.winner === null ? 'EMPATE' : `JOGADOR ${st.winner + 1} VENCE!`, 0, 0, 150, st.winner === 1 ? '#35d6c0' : '#ffcf2a', 'center', '#12080c', 22);
    else text(c, win ? 'VITÓRIA!' : st.winner === null ? 'EMPATE' : 'DERROTA', 0, 0, 210, win ? '#ffcf2a' : '#e02b2b', 'center', '#12080c', 26);
    c.restore();
    const s = app.stats;
    const rows = [['TEMPO DE LUTA', `${Math.round(s.frames / 60)} s`], ['COMBO MÁXIMO', `${s.maxCombo} golpes`], ['DANO CAUSADO', String(s.dmg)], ['ROUNDS', `${st.f[0].rounds} x ${st.f[1].rounds}`]];
    rows.forEach(([k, v], i) => {
      text(c, k, 860, 440 + i * 62, 42, '#d8d0dc', 'left');
      text(c, v, 1560, 440 + i * 62, 46, '#fff', 'right');
    });
    RESULT.forEach((label, i) => {
      const sel = i === app.cur;
      slab(c, 900, 720 + i * 88, 620, 70, sel ? '#e02b2b' : '#2a1a22', 22);
      text(c, label, 1210, 756 + i * 88, 44, sel ? '#fff' : '#b8a8b4');
    });
  }

  function render() {
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    if (app.screen === 'title') drawTitle();
    else if (app.screen === 'select') drawSelect();
    else if (app.screen === 'join') drawJoin();
    else if (app.screen === 'select2') drawSelect2();
    else if (app.screen === 'vs') drawVs();
    else if (app.screen === 'fight') drawFight();
    else if (app.screen === 'controls') {
      backdrop();
      drawControls();
    } else drawResult();
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

  app.tick = tick;
  app.render = render;
  app.startFight = startFight;
  app.pickFoe = pickFoe;
  app.run = () => {
    last = performance.now();
    app.raf = requestAnimationFrame(loop);
  };
  return app;
}
