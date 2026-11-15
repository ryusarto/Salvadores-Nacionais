import { SYS } from '../data/system.js';
import { TRUNKS_ART_CROPS } from '../data/trunks-art.js';
import { drawSpriteLayer } from './sprites.js';

const phase = (age, duration) => Math.min(5, Math.max(0, Math.floor(age / Math.max(1, duration) * 6)));
const draw = (c, name, index, box) => drawSpriteLayer(c, 'trunks-fx', name, index, { ...box, crop: TRUNKS_ART_CROPS[name] });

/** Art follows the existing entity. No simulation numbers are changed. */
export function trunksEntityArt(e, ownerId) {
  if (ownerId !== 'trunks') return null;
  if (e.kind === 'dog') {
    const name = e.hit?.launch ? 'caes-final' : e.y > 0 ? 'caes-salto' : e.hitCD > 0 ? 'caes-mordida' : 'caes-correr';
    return { name, index: Math.floor(e.age / 4) % 6,
      box: { x: e.x, y: SYS.GROUND_Y - e.y, w: e.w * 1.5, h: e.h * 1.5, face: e.dir, anchor: 'bottom' } };
  }
  if (e.kind === 'ambulance') {
    const p = e.delay > 0 ? 1 - e.delay / (e.delay0 || 26) : 1;
    return { name: 'ambulancia-queda', index: phase(p, 1),
      box: { x: e.x, y: -260 + (SYS.GROUND_Y + 150) * p * p, w: e.w, h: e.w, face: e.dir, anchor: 'center' } };
  }
  if (e.kind === 'mark') {
    const p = e.delay > 0 ? 1 - e.delay / (e.delay0 || 150) : .999;
    return { name: 'fx-marca', index: phase(p, 1),
      box: { x: e.x, y: SYS.GROUND_Y + 12, w: e.w, h: e.w * .48, anchor: 'bottom' } };
  }
  return null;
}

export function drawTrunksEntity(c, e, ownerId) {
  const art = trunksEntityArt(e, ownerId);
  if (!art) return false;
  const ready = draw(c, art.name, art.index, art.box);
  if (ready && e.kind === 'ambulance' && e.delay > 0) {
    draw(c, 'fx-marca', phase(1 - e.delay / (e.delay0 || 26), 1),
      { x: e.x, y: SYS.GROUND_Y + 12, w: e.w, h: e.w * .4, anchor: 'bottom' });
  }
  return ready;
}

export function trunksAttackArt(f) {
  if (f.ch.id !== 'trunks' || f.state !== 'attack' || f.move.fx !== 'bite') return null;
  const first = f.move.hits[0]?.from, last = f.move.hits.at(-1)?.to;
  if (first == null || f.sf < first || f.sf > last) return null;
  const box = f.move.hits[0].box;
  return { name: 'fx-mordida', index: phase(f.sf - first, last - first + 1),
    box: { x: box.x + box.w * .7, y: -(box.y + box.h / 2), w: box.w * .9, h: box.h, anchor: 'center' } };
}

export function drawTrunksAttack(c, f) {
  const art = trunksAttackArt(f);
  return art ? draw(c, art.name, art.index, art.box) : false;
}

export function drawTrunksParticle(c, p) {
  return draw(c, p.name, phase(p.t, p.dur),
    { x: p.x, y: p.y, w: p.w, h: p.h, face: p.face, anchor: 'center' });
}
