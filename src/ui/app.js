import { SYS } from '../data/system.js';
import { HEROES, BOSSES } from '../data/characters/index.js';
import { createMatch, step } from '../core/match.js';
import { createFighter } from '../core/fighter.js';
import { createBrain, aiInput } from '../core/ai.js';
import { EMPTY_INPUT } from '../core/input.js';
import { buildStage, drawStage } from '../render/stage.js';
import { drawFighter, drawBoxes } from '../render/mannequin.js';
import { createFx, fxEvents, fxUpdate, fxDrawBack, fxDrawFront, fxDrawScreen, drawEntities } from '../render/fx.js';
import { createHud, drawHud } from '../render/hud.js';
import { text, slab, halftone } from '../render/draw.js';
import { readInput, takePressed, pollPad } from './devices.js';
import { audioEvents, sfx } from './audio.js';

const W = SYS.VIEW_W;
const H = SYS.VIEW_H;
const MENU = [['story', 'MODO HISTÓRIA'], ['versus', 'VERSUS CPU'], ['training', 'TREINO'], ['diff', 'DIFICULDADE']];
const loadDiff = () => {
  try {
    const n = +localStorage.getItem('sn-dificuldade');
    return n >= 0 && n < SYS.DIFFICULTY.length ? n : 0;
  } catch {
    return 0;
  }
};
const PAUSE = ['CONTINUAR', 'LISTA DE GOLPES', 'REINICIAR LUTA', 'SAIR'];
const RESULT = ['REVANCHE', 'TROCAR PERSONAGEM', 'MENU'];
const DUMMY = ['PARADO', 'DEFENDE TUDO', 'CPU'];
const KEY_LABEL = { c1: '→ ← + Leve', c2: '↓ → + Médio', '5S': 'Especial', '6S': '→ + Especial', '2S': '↓ + Especial', '4S': '← + Especial', jS: 'No ar: Especial', SA1: 'Super (1 barra)', SA3: '↓ + Super (3 barras)' };

/** Cria o jogo sobre um canvas. Retorna o objeto do app (útil para testes). */
export function createApp(canvas, devices, opts = {}) {
  const c = canvas.getContext('2d');
  const app = {
    screen: 'title', cur: 0, mode: 'story', hero: 0, foe: null,
    st: null, brain: null, fx: createFx(), hud: createHud(), layers: buildStage(),
    cam: (SYS.STAGE_W - W) / 2, frame: 0, paused: false, pcur: 0, moveList: false,
    boxes: !!opts.boxes, dummy: 0, level: SYS.DIFFICULTY[loadDiff()].level, diff: loadDiff(), stats: null, overT: 0, vsT: 0,
    autoplay: opts.autoplay || null,
  };

  function startFight() {
    const hero = HEROES[app.hero];
    const D = SYS.DIFFICULTY[app.diff];
    app.level = D.level;
    app.st = createMatch({ chars: [hero, app.foe], seed: (Date.now() & 0xffff) + 1, training: app.mode === 'training', dmgMul: app.mode === 'training' ? [1, 1] : D.dmg });
    app.brain = createBrain(app.level);
    app.p1brain = app.autoplay ? createBrain(2) : null;
    app.fx = createFx();
    app.hud = createHud();
    app.stats = { maxCombo: 0, dmg: 0, frames: 0 };
    app.paused = false;
    app.moveList = false;
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

  /** Um passo lógico (1/60 s). */
  function tick() {
    app.frame++;
    const pr = takePressed(devices);
    const horiz = app.screen !== 'title';
    const nav = (n, len) => (app[n] = (app[n] + len + (pr.down || (horiz && pr.right) ? 1 : 0) - (pr.up || (horiz && pr.left) ? 1 : 0)) % len);
    const ok = pr.start || pr.L || pr.S;
    const back = pr.back || pr.M;
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
      } else if (ok) {
        app.mode = MENU[app.cur][0];
        app.screen = 'select';
      }
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
      if (back) app.screen = 'select';
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
        if (app.moveList) {
          if (ok || back) app.moveList = false;
        } else {
          nav('pcur', PAUSE.length);
          if (back) app.paused = false;
          else if (ok) {
            if (app.pcur === 0) app.paused = false;
            else if (app.pcur === 1) app.moveList = true;
            else if (app.pcur === 2) startFight();
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
      const in0 = app.p1brain ? aiInput(st, 0, app.p1brain) : readInput(devices);
      step(st, in0, p2Input());
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
        else if (app.cur === 1) app.screen = 'select';
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
      slab(c, W / 2 - 340, 570 + i * 88, 680, 72, sel ? '#e02b2b' : '#2a1a22', 26);
      text(c, (sel && id !== 'diff' ? '▶ ' : '') + label, W / 2, 608 + i * 88, 48, sel ? '#fff' : '#b8a8b4');
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
    if (app.mode === 'story' && b.place) {
      slab(c, W / 2 - 330, 800, 660, 80, '#ffcf2a', 22);
      text(c, `CAPÍTULO 1 — ${b.place}`, W / 2, 842, 46, '#12080c', 'center', null);
    }
    text(c, 'ENTER para começar', W / 2, 1010, 34, '#d8d0dc');
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
    for (const f of order) drawFighter(c, f, app.frame + f.side * 17);
    drawEntities(c, st);
    fxDrawFront(c, fx);
    if (app.boxes) for (const f of st.f) drawBoxes(c, f);
    c.restore();
    drawHud(c, st, app.hud);
    fxDrawScreen(c, fx, 'over');
    if (app.mode === 'training') {
      text(c, `F1 caixas: ${app.boxes ? 'SIM' : 'NÃO'}   F2 boneco: ${DUMMY[app.dummy]}   F3 nível CPU: ${app.level + 1}`, W / 2, 160, 26, '#fff', 'center', '#12080c', 5);
      const m = a.move;
      if (m) text(c, `${m.name}  preparo ${m.startup} · ativo ${m.active} · recuperação ${m.recovery}`, W / 2, 196, 24, '#ffe14a', 'center', '#12080c', 5);
    }
    if (app.paused) drawPause();
  }

  function drawPause() {
    c.fillStyle = 'rgba(10,4,12,.78)';
    c.fillRect(0, 0, W, H);
    if (app.moveList) return drawMoveList();
    slab(c, W / 2 - 220, 190, 440, 100, '#e02b2b', 30);
    text(c, 'PAUSE', W / 2, 242, 80, '#fff');
    PAUSE.forEach((label, i) => {
      const sel = i === app.pcur;
      slab(c, W / 2 - 320, 360 + i * 100, 640, 78, sel ? '#ffcf2a' : '#2a1a22', 24);
      text(c, label, W / 2, 400 + i * 100, 50, sel ? '#12080c' : '#d8d0dc', 'center', sel ? null : '#12080c');
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
    row('→→ / ←←', 'Correr / Recuo rápido');
    text(c, 'ENTER ou ESC para voltar', W / 2, 1030, 30, '#d8d0dc');
  }

  function drawResult() {
    backdrop('#1c0c10');
    const st = app.st;
    const win = st.winner === 0;
    const me = st.f[0];
    preview(win ? me.ch : st.f[1].ch, 430, 940, 1.5, 1);
    c.save();
    c.translate(1180, 250);
    c.rotate(-0.06);
    text(c, win ? 'VITÓRIA!' : st.winner === null ? 'EMPATE' : 'DERROTA', 0, 0, 210, win ? '#ffcf2a' : '#e02b2b', 'center', '#12080c', 26);
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
    else if (app.screen === 'vs') drawVs();
    else if (app.screen === 'fight') drawFight();
    else drawResult();
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
