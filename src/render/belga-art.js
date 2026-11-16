import { SYS } from '../data/system.js';
import { BELGA_ART_CROPS } from '../data/belga-art.js';
import { drawSpriteLayer } from './sprites.js';

const phase = (age, duration) => Math.min(5, Math.max(0, Math.floor(age / Math.max(1, duration) * 6)));
const draw = (c, name, index, box) => drawSpriteLayer(c, 'belga-fx', name, index, { ...box, crop: BELGA_ART_CROPS[name] });

export function belgaEntityArt(e, ownerId) {
  if (ownerId !== 'belga' || e.kind !== 'vinyl') return null;
  return { name: 'vinil-girar', index: Math.floor(e.age / 2) % 6,
    box: { x: e.x, y: SYS.GROUND_Y - e.y - e.h / 2, w: e.w * 1.22, h: e.h * 1.22, face: e.dir, anchor: 'center' } };
}

export function drawBelgaEntity(c, e, ownerId) {
  const art = belgaEntityArt(e, ownerId);
  return art ? draw(c, art.name, art.index, art.box) : false;
}

/** Local fighter coordinates, driven by actual contact and evasion windows. */
export function belgaAttackArt(f) {
  if (f.ch.id !== 'belga' || f.state !== 'attack' || !f.move) return null;
  if (f.moveKey === '2S') {
    const window = f.move.inv[0];
    if (!window || f.sf < window.from || f.sf > window.to) return null;
    const scale=(f.ch.spriteScale??.92)/.92;
    return { name: 'fx-pendulo', index: phase(f.sf - window.from, window.to - window.from + 1),
      box: { x: 20*scale, y: -190*scale, w: 300*scale, h: 260*scale, anchor: 'center' } };
  }
  const i = f.move.hits.findIndex(h => f.sf >= h.from && f.sf <= h.to);
  if (i < 0) return null;
  const h = f.move.hits[i], key = f.moveKey;
  if (['2L', '2M', '3H', 'jM', 'throw'].includes(key)) return null;
  const name = ['2H', '4S'].includes(key) ? 'fx-gancho'
    : ['c2', '6M'].includes(key) ? 'fx-bate-estaca'
    : ['5L', 'jL'].includes(key) || (key === 'c1' && i === 0) ? 'fx-jab' : 'fx-direto';
  return { name, index: phase(f.sf - h.from, h.to - h.from + 1),
    box: { x: h.box.x + h.box.w * .75, y: -(h.box.y + h.box.h / 2), w: h.box.w, h: h.box.h, anchor: 'center' } };
}

export function drawBelgaAttack(c, f) {
  const art = belgaAttackArt(f);
  return art ? draw(c, art.name, art.index, art.box) : false;
}

export function drawBelgaParticle(c, p) {
  return draw(c, p.name, phase(p.t, p.dur),
    { x: p.x, y: p.y, w: p.w, h: p.h, face: p.face, anchor: 'center' });
}
