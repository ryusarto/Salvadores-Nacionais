import { SYS } from '../data/system.js';
import { phoneBox } from '../data/characters/chupetinha.js';
import { CHUPETINHA_FX_CROPS } from '../data/chupetinha-art.js';
import { drawSpriteLayer } from './sprites.js';

const GY = SYS.GROUND_Y;
const phase = (age, duration) => Math.max(0, Math.min(5, Math.floor(age / Math.max(1, duration) * 6)));
const draw = (c, art) => drawSpriteLayer(c, 'chupetinha-fx', art.name, art.index,
  { ...art.box, crop: CHUPETINHA_FX_CROPS[art.name] });
const phoneStates = new WeakMap();

/** Pure visual transition; the live resource and phoneBox remain authoritative. */
export function chupetinhaPhoneArt(f, frame, previous) {
  if (f.ch.id !== 'chupetinha' || !f.res || f.state === 'ko') return null;
  const r = f.res;
  let transition = previous?.res === r ? previous.transition : null;
  let started = previous?.res === r ? previous.started : frame;
  if (previous?.res === r) {
    if (r.live && !previous.live) { transition = 'celular-ativacao'; started = frame; }
    else if (previous.live && (!r.live || r.signal < previous.signal)) { transition = 'celular-dano'; started = frame; }
  } else if (r.live) transition = 'celular-ativacao';
  if (frame - started >= 16) transition = null;
  const stable = r.live ? r.signal >= 3 ? 'celular-live' : 'celular-live-' + Math.max(1, r.signal) : 'celular-sem-sinal';
  const b = phoneBox(f);
  return { res: r, live: r.live, signal: r.signal, transition, started,
    name: transition || stable, index: transition ? phase(frame - started, 16) : Math.floor(frame / 8) % 6,
    box: { x: (b.l + b.r) / 2, y: GY - (b.b + b.t) / 2 + Math.sin(frame / 14) * 6,
      w: 148, h: 148, anchor: 'center' } };
}

export function drawChupetinhaPhone(c, f, frame) {
  const art = chupetinhaPhoneArt(f, frame, phoneStates.get(f));
  if (!art) return false;
  phoneStates.set(f, art);
  return draw(c, art);
}

export function chupetinhaEntityArt(e, ownerId) {
  if (ownerId !== 'chupetinha' || e.kind !== 'chupeta') return null;
  return { name: 'projetil-chupeta', index: Math.floor(e.age / 3) % 6,
    box: { x: e.x, y: GY - e.y - e.h / 2, w: e.w * 1.25, h: e.h * 1.25, face: e.dir, anchor: 'center' } };
}

export function drawChupetinhaEntity(c, e, ownerId) {
  const art = chupetinhaEntityArt(e, ownerId);
  return art ? draw(c, art) : false;
}

/** Local coordinates: the caller already mirrors the fighter toward the rival. */
export function chupetinhaAttackArt(f) {
  if (f.ch.id !== 'chupetinha' || f.state !== 'attack' || !f.move) return null;
  const h = f.move.hits.find(h => f.sf >= h.from && f.sf <= h.to);
  if (!h || (f.move.weapon !== 'whip' && f.moveKey !== '4S')) return null;
  const suck = f.moveKey === '6S', b = h.box;
  return { name: suck ? 'sugada' : 'arco-mangual', index: phase(f.sf - h.from, h.to - h.from + 1),
    box: { x: b.x + b.w / 2, y: -(b.y + b.h / 2), w: b.w, h: Math.max(suck ? 180 : 120, b.h), anchor: 'center' } };
}

export function drawChupetinhaAttack(c, f) {
  const art = chupetinhaAttackArt(f);
  return art ? draw(c, art) : false;
}

export function chupetinhaEventArt(e, st) {
  const actor = st.f[e.side];
  if (e.t === 'hit' && actor?.ch.id === 'chupetinha') return {
    name: 'impacto-chupeta', x: e.x, y: GY - e.y, w: e.super ? 260 : 190, h: e.super ? 260 : 190, dur: 16, face: actor.face };
  if (e.t === 'pop' && e.str === '+ENGAJAMENTO') {
    const f = st.f.find(f => f.ch.id === 'chupetinha' && f.x === e.x);
    if (f) return { name: 'engajamento', x: f.x + f.face * 70, y: GY - f.y - 490, w: 150, h: 150, dur: 32, face: 1 };
  }
  return null;
}

export function drawChupetinhaParticle(c, p) {
  return draw(c, { name: p.name, index: phase(p.t, p.dur),
    box: { x: p.x, y: p.y - (p.name === 'engajamento' ? p.t * 1.4 : 0), w: p.w, h: p.h, face: p.face, anchor: 'center' } });
}
