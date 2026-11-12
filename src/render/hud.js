import { SYS } from '../data/system.js';
import { text, slab } from './draw.js';

/** HUD da luta: vida, Ginga, super, tempo, rounds, combo e a mecânica própria. */
const W = SYS.VIEW_W;

export function createHud() {
  return { lag: [1, 1], combo: [{ n: 0, t: 0, dmg: 0 }, { n: 0, t: 0, dmg: 0 }] };
}

function bar(c, x, y, w, h, frac, color, flip, back = '#2a1a22') {
  slab(c, x, y, w, h, back, 10);
  if (frac <= 0) return;
  const fw = w * Math.max(0, Math.min(1, frac));
  slab(c, flip ? x + w - fw : x, y, fw, h, color, 10, null);
}

function side(c, st, hud, i) {
  const f = st.f[i];
  const flip = i === 1; // o lado direito esvazia para a direita
  const x0 = i === 0 ? 150 : W - 150 - 700;
  const hp = Math.max(0, f.hp / f.maxHp);
  hud.lag[i] += (hp - hud.lag[i]) * (hud.lag[i] > hp ? 0.04 : 1);
  if (st.f[i].comboHits > 0) hud.lag[i] = Math.max(hud.lag[i], hp); // segura a barra vermelha durante o combo

  // retrato
  const px = i === 0 ? 40 : W - 140;
  slab(c, px, 40, 100, 100, f.ch.colors.top, 8);
  c.fillStyle = f.ch.colors.skin;
  c.beginPath();
  c.arc(px + 50, 98, 30, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = f.ch.colors.hair;
  c.beginPath();
  c.arc(px + 50, 82, 32, Math.PI, 0);
  c.fill();
  c.strokeStyle = '#12080c';
  c.lineWidth = 4;
  c.beginPath();
  c.arc(px + 50, 98, 30, 0, Math.PI * 2);
  c.stroke();

  // vida
  bar(c, x0, 52, 700, 40, hud.lag[i], '#e23b2e', !flip);
  bar(c, x0, 52, 700, 40, hp, hp > 0.25 ? '#6fdc3a' : '#ffb02e', !flip, 'rgba(0,0,0,0)');
  text(c, f.ch.name, i === 0 ? x0 + 6 : x0 + 694, 28, 34, '#fff', i === 0 ? 'left' : 'right');

  // Ginga: 6 gomos
  const G = SYS.GINGA;
  for (let k = 0; k < 6; k++) {
    const gx = i === 0 ? x0 + 96 + k * 46 : x0 + 700 - 96 - 40 - k * 46;
    const fill = Math.max(0, Math.min(1, (f.ginga - k * G.pip) / G.pip));
    slab(c, gx, 100, 40, 18, '#2a1a22', 5);
    if (fill > 0) slab(c, gx, 100, 40 * fill, 18, f.burnout ? '#8a8a92' : '#35d6c0', 5, null);
  }
  text(c, f.burnout ? 'SEM FÔLEGO' : 'GINGA', i === 0 ? x0 + 4 : x0 + 696, 110, 20, f.burnout ? '#b0b0b8' : '#9ff5e8', i === 0 ? 'left' : 'right', '#12080c', 4);

  // rounds
  for (let k = 0; k < SYS.ROUNDS_TO_WIN; k++) {
    const rx = i === 0 ? x0 + 660 - k * 34 : x0 + 14 + k * 34;
    slab(c, rx, 98, 24, 22, k < f.rounds ? '#ffcf2a' : '#2a1a22', 4);
  }

  // super (embaixo)
  const sx = i === 0 ? 150 : W - 150 - 420;
  const stocks = Math.floor(f.super / SYS.SUPER.stock);
  const part = (f.super % SYS.SUPER.stock) / SYS.SUPER.stock;
  for (let k = 0; k < 3; k++) {
    const bx = i === 0 ? sx + k * 142 : sx + 420 - 136 - k * 142;
    const fr = k < stocks ? 1 : k === stocks ? part : 0;
    slab(c, bx, 1000, 136, 30, '#2a1a22', 10);
    if (fr > 0) slab(c, i === 0 ? bx : bx + 136 * (1 - fr), 1000, 136 * fr, 30, fr >= 1 ? '#ffcf2a' : '#ff7a2e', 10, null);
  }
  const nx = i === 0 ? 86 : W - 86;
  c.save();
  c.translate(nx, 1006);
  c.rotate(-0.1);
  text(c, String(stocks), 0, 0, 92, stocks >= 3 ? '#ffcf2a' : '#fff');
  if (stocks >= 3) text(c, 'MAX', 0, 46, 28, '#ffcf2a');
  c.restore();

  // mecânica própria
  const m = f.ch.mech?.hud?.(f, st.f[1 - i], st);
  if (m) {
    const mx = i === 0 ? 150 : W - 150;
    const al = i === 0 ? 'left' : 'right';
    text(c, m.ready && m.readyText ? `${m.label}: ${m.readyText}` : m.label, mx, 972, 24, m.ready ? '#ffe14a' : '#d8d0dc', al, '#12080c', 5);
    const tw = 26;
    for (let k = 0; k < (m.pips || 0); k++) {
      const px2 = i === 0 ? mx + 190 + k * (tw + 6) : mx - 190 - tw - k * (tw + 6);
      slab(c, px2, 962, tw, 20, k < m.value ? m.color || '#ffe14a' : '#2a1a22', 4);
    }
    if (m.text) text(c, m.text, i === 0 ? mx + 190 : mx - 190, 972, 24, '#fff', al, '#12080c', 5);
  }

  // combo sofrido pelo adversário = combo deste jogador
  const o = st.f[1 - i];
  const cb = hud.combo[i];
  if (o.comboHits >= 2) {
    cb.n = o.comboHits;
    cb.dmg = o.comboDmg;
    cb.t = 50;
  } else if (cb.t > 0) cb.t--;
  if (cb.t > 0 && cb.n >= 2) {
    c.globalAlpha = Math.min(1, cb.t / 12);
    const cx = i === 0 ? 170 : W - 170;
    c.save();
    c.translate(cx, 250);
    c.rotate(i === 0 ? -0.08 : 0.08);
    text(c, `${cb.n} GOLPES!`, 0, 0, 70, '#ffe14a', i === 0 ? 'left' : 'right');
    text(c, `${cb.dmg} de dano`, 0, 52, 30, '#fff', i === 0 ? 'left' : 'right');
    c.restore();
    c.globalAlpha = 1;
  }
}

/** Desenha a HUD inteira. */
export function drawHud(c, st, hud) {
  side(c, st, hud, 0);
  side(c, st, hud, 1);
  slab(c, W / 2 - 62, 38, 124, 84, '#e02b2b', 10);
  text(c, st.training ? '∞' : String(Math.max(0, Math.ceil(st.timer / SYS.FPS))), W / 2, 84, 70, '#fff');
  slab(c, W / 2 - 80, 10, 160, 34, '#12080c', 8, null);
  text(c, st.training ? 'TREINO' : `ROUND ${st.round}`, W / 2, 28, 26, '#ffcf2a', 'center', null);
  if (st.phase === 'intro' && st.pf < SYS.INTRO_FRAMES - 10) {
    const t = st.pf / SYS.INTRO_FRAMES;
    c.save();
    c.translate(W / 2, 460);
    c.rotate(-0.06);
    text(c, st.training ? 'TREINO' : `ROUND ${st.round}`, 0, 0, 170 * (1 + t * 0.1), '#fff', 'center', '#12080c', 22);
    c.restore();
  }
}
