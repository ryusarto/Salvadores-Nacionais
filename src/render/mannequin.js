import { SYS } from '../data/system.js';
import { hurtbox, worldBox } from '../core/fighter.js';
import { poseFor } from './poses.js';
import { drawSprite } from './sprites.js';

/**
 * Desenho provisório dos lutadores: um manequim articulado com as cores e a
 * silhueta de cada personagem. Quando os sprites finais chegarem, basta trocar
 * `drawFighter` por um desenhista de sprites: as regras do combate não mudam.
 */
const LEN = { thigh: 118, shin: 118, torso: 150, neck: 16, head: 44, ua: 76, fa: 72 };
const rad = (d) => (d * Math.PI) / 180;
const dv = (a, n) => [Math.sin(rad(a)) * n, Math.cos(rad(a)) * n];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];

/** Calcula as juntas do esqueleto (origem nos pés, y para baixo, olhando para a direita). */
export function skeleton(pose) {
  const [lean, head, aFs, aFe, aBs, aBe, lFh, lFk, lBh, lBk, rot, air, hipH] = pose;
  const leg = (h, k) => {
    const knee = dv(h, LEN.thigh);
    const foot = add(knee, dv(h + k, LEN.shin));
    return { knee, foot, ang: h + k };
  };
  const lf = leg(lFh, lFk);
  const lb = leg(lBh, lBk);
  const groundH = Math.max(lf.foot[1], lb.foot[1], 40);
  const H = groundH * (1 - air) + hipH * air;
  const hip = [0, -H];
  const up = (a, n) => [Math.sin(rad(a)) * n, -Math.cos(rad(a)) * n];
  const neck = add(hip, up(lean, LEN.torso));
  const sh = add(hip, up(lean, LEN.torso - 16));
  const headC = add(neck, up(lean + head, LEN.neck + LEN.head));
  const arm = (s, e) => {
    const elbow = add(sh, dv(s, LEN.ua));
    const hand = add(elbow, dv(s + e, LEN.fa));
    return { elbow, hand, ang: s + e };
  };
  const af = arm(aFs, aFe);
  const ab = arm(aBs, aBe);
  const J = {
    hip, neck, sh, head: headC,
    kneeF: add(hip, lf.knee), footF: add(hip, lf.foot), shinF: lf.ang,
    kneeB: add(hip, lb.knee), footB: add(hip, lb.foot), shinB: lb.ang,
    elbowF: af.elbow, handF: af.hand, foreF: af.ang,
    elbowB: ab.elbow, handB: ab.hand, foreB: ab.ang,
    lean: lean + head,
  };
  if (rot) {
    const c = Math.cos(rad(rot));
    const s = Math.sin(rad(rot));
    for (const k of Object.keys(J)) {
      if (!Array.isArray(J[k])) continue;
      const x = J[k][0] - hip[0];
      const y = J[k][1] - hip[1];
      J[k] = [hip[0] + x * c - y * s, hip[1] + x * s + y * c];
    }
    J.lean += rot;
    J.foreF += -rot;
    J.shinF += -rot;
    J.shinB += -rot;
  }
  return J;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r},${g},${b})`;
}

const OUT = '#120a10';
function limb(c, a, b, w, col) {
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(a[0], a[1]);
  c.lineTo(b[0], b[1]);
  c.strokeStyle = OUT;
  c.lineWidth = w + 10;
  c.stroke();
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
}
function blob(c, p, r, col, ry = r) {
  c.beginPath();
  c.ellipse(p[0], p[1], r, ry, 0, 0, Math.PI * 2);
  c.fillStyle = col;
  c.fill();
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  c.stroke();
}
function shoe(c, foot, ang, col) {
  c.save();
  c.translate(foot[0], foot[1]);
  c.rotate(-rad(Math.max(-60, Math.min(60, ang))) * 0.5);
  c.beginPath();
  c.roundRect(-22, -22, 62, 26, 10);
  c.fillStyle = col;
  c.fill();
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  c.stroke();
  c.restore();
}

function hair(c, J, ch, front) {
  const h = J.head;
  const col = ch.colors.hair;
  const R = LEN.head;
  const t = ch.look.hair;
  c.save();
  c.translate(h[0], h[1]);
  c.rotate(rad(J.lean));
  if (!front) {
    if (t === 'afro') blob(c, [-8, -14], R + 22, col);
    else if (t === 'curly') blob(c, [-6, -12], R + 10, col);
    else if (t === 'long') {
      blob(c, [-14, -4], R + 8, col);
      c.beginPath();
      c.moveTo(-R - 6, -10);
      c.quadraticCurveTo(-R - 34, 70, -R + 4, 150);
      c.lineTo(-10, 120);
      c.quadraticCurveTo(-30, 50, -6, 0);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      c.strokeStyle = OUT;
      c.lineWidth = 5;
      c.stroke();
    } else if (t === 'dreads') {
      for (let i = 0; i < 5; i++) limb(c, [-R + 6 + i * 6, -10], [-R - 10 + i * 4, 70 + (i % 2) * 14], 9, col);
    }
  } else {
    if (t === 'spikes' || t === 'mohawk') {
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        const a = rad(i * 26 - 10);
        c.moveTo(Math.sin(a - 0.22) * R, -Math.cos(a - 0.22) * R);
        c.lineTo(Math.sin(a) * (R + 46), -Math.cos(a) * (R + 46));
        c.lineTo(Math.sin(a + 0.22) * R, -Math.cos(a + 0.22) * R);
        c.closePath();
        c.fillStyle = col;
        c.fill();
        c.strokeStyle = OUT;
        c.lineWidth = 4;
        c.stroke();
      }
    } else if (t === 'beanie' || t === 'cap' || t === 'bandana' || t === 'bucket') {
      const hc = ch.colors.hat || ch.colors.accent;
      c.beginPath();
      c.arc(0, -4, R + 4, Math.PI * 1.05, Math.PI * 1.95);
      c.closePath();
      c.fillStyle = hc;
      c.fill();
      c.strokeStyle = OUT;
      c.lineWidth = 5;
      c.stroke();
      if (t === 'cap') limb(c, [R - 8, -14], [R + 34, -8], 8, hc);
      if (t === 'bucket') limb(c, [-R - 8, -12], [R + 14, -12], 9, hc);
      if (t === 'bandana') limb(c, [-R + 2, -16], [-R - 26, 4], 7, hc);
    } else if (t === 'dreads') {
      c.beginPath();
      c.arc(0, -4, R + 3, Math.PI * 1.0, Math.PI * 1.9);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      c.stroke();
    } else if (t === 'horns') {
      for (const s of [-1, 1]) limb(c, [s * 22, -R + 6], [s * 40, -R - 34], 9, ch.colors.accent);
    }
    // rosto
    c.fillStyle = OUT;
    c.beginPath();
    c.ellipse(20, -4, 4, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = OUT;
    c.beginPath();
    c.moveTo(10, -16);
    c.lineTo(30, -12);
    c.stroke();
    if (ch.look.glasses) {
      c.strokeRect(8, -14, 26, 16);
    }
  }
  c.restore();
}

function weapon(c, J, f, ch) {
  const w = ch.look.weapon;
  if (!w || w === 'whip') return;
  const h = J.handF;
  c.save();
  c.translate(h[0], h[1]);
  c.rotate(-rad(J.foreF) + Math.PI / 2);
  if (w === 'katana') {
    const drawn = f.state === 'attack' && f.move.weapon !== 'sheath';
    limb(c, [0, 0], [drawn ? 190 : 120, drawn ? -30 : 40], 5, drawn ? '#e8f6ff' : '#2a2030');
  } else if (w === 'guitar') {
    limb(c, [-20, 0], [120, -10], 9, '#3b2a22');
    blob(c, [-34, 6], 36, ch.colors.accent, 26);
  } else if (w === 'gun') {
    limb(c, [0, -4], [46, -4], 10, '#2c2c34');
    limb(c, [4, 0], [0, 18], 9, '#2c2c34');
  } else if (w === 'spray') {
    c.fillStyle = ch.colors.accent;
    c.strokeStyle = OUT;
    c.lineWidth = 4;
    c.beginPath();
    c.roundRect(-10, -34, 22, 46, 6);
    c.fill();
    c.stroke();
  } else if (w === 'knuckle') {
    blob(c, [6, 0], 17, '#f0c040');
  } else if (w === 'phone') {
    c.fillStyle = '#20202a';
    c.fillRect(-6, -22, 14, 26);
  }
  c.restore();
}

function whip(c, J, f) {
  const hand = J.handF;
  let tip = [hand[0] + 40, -4];
  let ctrl = [hand[0] + 70, hand[1] / 2];
  if (f.state === 'attack' && f.move.weapon === 'whip' && f.move.hits.length) {
    const m = f.move;
    const h = m.hits.find((x) => f.sf <= x.to) || m.hits[m.hits.length - 1];
    const far = [h.box.x + h.box.w, -(h.box.y + h.box.h / 2)];
    const last = m.hits[m.hits.length - 1].to;
    if (f.sf < h.from) {
      const t = Math.max(0, (f.sf - m.startup * 0.4) / (m.startup * 0.6));
      tip = [-160 + (far[0] + 160) * t * t, hand[1] - 60 + (far[1] - hand[1] + 60) * t];
      ctrl = [hand[0] - 60 + 200 * t, hand[1] - 160];
    } else if (f.sf <= last) {
      tip = far;
      ctrl = [(hand[0] + far[0]) / 2, Math.min(hand[1], far[1]) - 50 + Math.sin(f.sf * 2.1) * 30];
    } else {
      const t = (f.sf - last) / Math.max(1, m.total - last);
      tip = [far[0] + (hand[0] + 40 - far[0]) * t, far[1] + (-4 - far[1]) * t];
      ctrl = [(hand[0] + tip[0]) / 2, hand[1] + 60 * t];
    }
  }
  for (const [w, col] of [[9, OUT], [4, '#7a4a2a']]) {
    c.beginPath();
    c.moveTo(hand[0], hand[1]);
    c.quadraticCurveTo(ctrl[0], ctrl[1], tip[0], tip[1]);
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.stroke();
  }
}

/**
 * Desenha um lutador.
 * @param {CanvasRenderingContext2D} c contexto já transladado pela câmera
 * @param {object} f lutador
 * @param {number} frame quadro global (para animações cíclicas)
 */
export function drawFighter(c, f, frame) {
  const ch = f.ch;
  const col = ch.colors;
  const { pose, flip, tint } = poseFor(f, frame);
  const J = skeleton(pose);
  const gy = SYS.GROUND_Y;
  const shake = f.hitstop > 0 && ['hitstun', 'air_hit', 'crumple', 'blockstun', 'ko'].includes(f.state) ? (frame % 2 ? 5 : -5) : 0;

  // sombra
  c.fillStyle = 'rgba(10,5,15,.38)';
  c.beginPath();
  c.ellipse(f.x, gy + 6, 105 - Math.min(50, f.y * 0.12), 16, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(f.x + shake, gy - f.y);
  c.scale(f.face * (flip ? -1 : 1), 1);
  if (tint) {
    c.shadowColor = tint;
    c.shadowBlur = 34;
  }
  const look = ch.look;
  const sleeve = look.sleeves === 'long' ? col.top : null;
  const upper = look.sleeves === 'none' ? col.skin : col.top;
  const shin = look.pants === 'shorts' ? col.skin : col.bottom;
  const dark = 0.72;

  const sprite = drawSprite(c, f, frame);
  if (!sprite) {
  hair(c, J, ch, false);
  // braço e perna de trás
  limb(c, J.sh, J.elbowB, 30, shade(upper, dark));
  limb(c, J.elbowB, J.handB, 26, shade(sleeve || col.skin, dark));
  blob(c, J.handB, 17, shade(col.skin, dark));
  limb(c, J.hip, J.kneeB, 44, shade(col.bottom, dark));
  limb(c, J.kneeB, J.footB, 36, shade(shin, dark));
  shoe(c, J.footB, J.shinB, shade(col.shoe, dark));
  // tronco
  blob(c, J.hip, 40, col.bottom);
  limb(c, J.hip, J.neck, 84, col.top);
  for (const [a, b, sc] of look.stripes || []) {
    const p = (t) => [J.hip[0] + (J.neck[0] - J.hip[0]) * t, J.hip[1] + (J.neck[1] - J.hip[1]) * t];
    c.lineCap = 'butt';
    c.beginPath();
    c.moveTo(...p(a));
    c.lineTo(...p(b));
    c.strokeStyle = sc;
    c.lineWidth = 84;
    c.stroke();
  }
  // perna da frente
  limb(c, J.hip, J.kneeF, 46, col.bottom);
  limb(c, J.kneeF, J.footF, 38, shin);
  shoe(c, J.footF, J.shinF, col.shoe);
  // cabeça
  blob(c, J.head, LEN.head, col.skin);
  hair(c, J, ch, true);
  // braço da frente
  if (look.weapon === 'whip') whip(c, J, f);
  limb(c, J.sh, J.elbowF, 32, upper);
  limb(c, J.elbowF, J.handF, 28, sleeve || col.skin);
  blob(c, J.handF, 19, col.skin);
  weapon(c, J, f, ch);
  } else if (look.weapon === 'whip') whip(c, J, f);
  c.shadowBlur = 0;

  // rastro do golpe
  if (f.state === 'attack' && f.move.weapon !== 'whip') {
    for (const h of f.move.hits) {
      if (f.sf < h.from || f.sf > h.to + 1) continue;
      const b = h.box;
      const cx = b.x + b.w * 0.55;
      const cy = -(b.y + b.h / 2);
      c.save();
      c.translate(cx, cy);
      c.globalAlpha = 0.85;
      c.beginPath();
      c.ellipse(0, 0, b.w * 0.55, Math.max(26, b.h * 0.42), 0, -Math.PI * 0.42, Math.PI * 0.42);
      c.ellipse(-b.w * 0.16, 0, b.w * 0.5, Math.max(16, b.h * 0.3), 0, Math.PI * 0.36, -Math.PI * 0.36, true);
      c.closePath();
      c.fillStyle = f.move.type === 'normal' ? '#fff8e0' : col.accent;
      c.fill();
      c.restore();
    }
  }
  c.restore();
}

/** Desenha as caixas de acerto (vermelho) e do corpo (verde) para depuração. */
export function drawBoxes(c, f) {
  const gy = SYS.GROUND_Y;
  const draw = (wb, col) => {
    c.fillStyle = col + '44';
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.fillRect(wb.l, gy - wb.t, wb.r - wb.l, wb.t - wb.b);
    c.strokeRect(wb.l, gy - wb.t, wb.r - wb.l, wb.t - wb.b);
  };
  draw(worldBox(f, hurtbox(f)), '#35e06a');
  if (f.state === 'attack') {
    for (const h of f.move.hits) if (f.sf >= h.from && f.sf <= h.to) draw(worldBox(f, h.box), '#ff3344');
  }
}
