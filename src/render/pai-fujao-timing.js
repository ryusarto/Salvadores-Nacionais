import { PAI } from '../data/characters/pai-fujao.js';
import { chupetinhaProgress } from './chupetinha-timing.js';

const reactions = new WeakMap();

/** Render-only reactions. Resource identity resets the cache between rounds. */
export function paiAnimation(f, frame, animation) {
  if (f.ch?.id !== 'pai-fujao' || f.ch.spriteProfile !== 'six-frame' || !f.res) return animation;
  const old = reactions.get(f), r = f.res;
  const current = old?.res === r ? old : { res: r, fury: false, pending: false, started: null };
  if (r.fury && !current.fury) current.pending = true;
  current.fury = r.fury;
  if (!r.fury) { current.pending = false; current.started = null; }
  if (current.pending && ['idle', 'walk'].includes(f.state)) {
    current.started = frame; current.pending = false;
  }
  reactions.set(f, current);
  if (f.state === 'dizzy' && r.shockT > PAI.shockCD - 36)
    return { name: 'reacao-tornozeleira', p: Math.min(.999, (PAI.shockCD - r.shockT) / 36) };
  if (current.started != null && frame - current.started < 36 && ['idle', 'walk'].includes(f.state))
    return { name: 'furia-paterna', p: Math.max(0, (frame - current.started) / 36) };
  return animation;
}

/** Six native poses: anticipation 0/1, contact 2/3, recovery 4/5. */
export function paiProgress(f, animation) {
  if (['reacao-tornozeleira', 'furia-paterna'].includes(animation.name)) return animation.p;
  if (f.state === 'attack' && f.moveKey === 'SA3' && f.move) {
    const hits = f.move.hits, sf = f.sf;
    if (sf < hits[0].from) return Math.min(1.999, sf / hits[0].from * 2) / 6;
    if (sf > hits.at(-1).to) return 5 / 6;
    return (2 + Math.max(0, hits.findLastIndex(h => h.from <= sf))) / 6;
  }
  // Both approved six-frame sets share the same normal/state chronology.
  return chupetinhaProgress(f, animation);
}
