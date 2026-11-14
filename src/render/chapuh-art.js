import { CHAPUH_ART_CROPS } from '../data/chapuh-art.js';
import { SYS } from '../data/system.js';
import { drawSpriteLayer } from './sprites.js';

const frameFor = (age, duration) => Math.min(3, Math.max(0, Math.floor(age / Math.max(1, duration) * 4)));
const draw = (c, name, index, box) => drawSpriteLayer(c, 'chapuh-fx', name, index, { ...box, crop: CHAPUH_ART_CROPS[name] });

/** O efeito acompanha a janela de acerto real, inclusive especiais turbinados. */
export function chapuhAttackArt(f) {
  if (f.ch.id !== 'chapuh' || f.state !== 'attack') return null;
  const name = f.moveKey === 'SA1' ? 'fx-grafite-total'
    : ['5M', '2M', '5S', 'c2'].includes(f.moveKey) ? 'fx-spray-preto' : null;
  const hits = f.move.hits;
  if (!name || !hits.length) return null;
  const first = hits[0].from, last = hits[hits.length - 1].to;
  if (f.sf < first || f.sf > last) return null;
  const box = hits[0].box, start = Math.min(180, box.x + box.w * 0.4);
  return { name, index: frameFor(f.sf - first, last - first + 1),
    box: { x: start, y: -(box.y + box.h / 2), w: box.x + box.w - start, h: box.h, anchor: 'left' } };
}

export function drawChapuhAttack(c, f) {
  const art = chapuhAttackArt(f);
  return art ? draw(c, art.name, art.index, art.box) : false;
}

/** Metadados explícitos mantêm a arte exclusiva do Chapuh e o resto do elenco intacto. */
export function chapuhEntityArt(e) {
  if (!CHAPUH_ART_CROPS[e.art]) return null;
  let name = e.art, index;
  if (e.behavior === 'puddle') index = frameFor(e.age, 12);
  else if (e.kind === 'paint') index = Math.floor(e.age / 4) % 4;
  else if (e.art === 'pinscher-salto') index = e.age < 3 ? 0 : e.vy > 12 ? 1 : e.vy > -8 ? 2 : 3;
  else if (e.art === 'pinscher-final') index = frameFor(e.age, 16);
  else if (e.hitCD > 0 && e.art === 'pinscher-mordidas') index = frameFor(9 - e.hitCD, 9);
  else { name = e.travelArt || e.art; index = Math.floor(e.age / 4) % 4; }
  const ground = e.behavior === 'puddle' || (e.kind === 'dog' && e.y <= 0);
  return { name, index, box: { x: e.x, y: SYS.GROUND_Y - e.y - (ground ? 0 : e.h / 2),
    w: e.w, h: e.behavior === 'puddle' ? Math.max(80, e.h) : e.h,
    face: e.dir || 1, anchor: ground ? 'bottom' : 'center' } };
}

export function drawChapuhEntity(c, e) {
  const art = chapuhEntityArt(e);
  return art ? draw(c, art.name, art.index, art.box) : false;
}
