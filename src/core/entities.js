import { SYS } from '../data/system.js';
import { applyHit } from './combat.js';
import { hurtbox, worldBox, overlap, setState, emit } from './fighter.js';

/**
 * Entidades: projéteis, marcas no chão, poças e ajudantes.
 * behavior: 'fly' (voa e acerta), 'strike' (espera `delay` e cai), 'puddle' (faz escorregar),
 * 'patch' (armadilha parada no chão).
 */
export function spawnEntity(st, f, def) {
  const d = typeof def.make === 'function' ? def.make(st, f) : def;
  if (!d) return null;
  const o = st.f[1 - f.side];
  const e = {
    ...d,
    hit: d.hit ? { ...d.hit } : null,
    id: st.nextId++,
    owner: f.side,
    dir: f.face,
    x: d.at_opponent ? o.x : f.x + f.face * d.x,
    y: d.behavior === 'fly' ? f.y + d.y : d.y,
    vx: d.vx * f.face,
    age: 0,
    hitCD: 0,
  };
  e.x = Math.max(60, Math.min(SYS.STAGE_W - 60, e.x));
  st.ents.push(e);
  emit(st, { t: 'spawn', kind: e.kind, x: e.x, y: e.y, side: f.side });
  return e;
}

const entBox = (e) => ({ l: e.x - e.w / 2, r: e.x + e.w / 2, b: e.y, t: e.y + e.h });

/** Avança todas as entidades um quadro. */
export function updateEntities(st) {
  for (const e of st.ents) {
    e.age++;
    if (e.hitCD > 0) e.hitCD--;
    const owner = st.f[e.owner];
    const target = st.f[1 - e.owner];
    if (e.delay > 0) {
      e.delay--;
      if (e.delay === 0) emit(st, { t: 'strike', kind: e.kind, x: e.x, y: e.y });
      continue;
    }
    e.life--;
    if (e.behavior === 'fly') {
      e.x += e.vx;
      e.y += e.vy;
      if (e.g) {
        e.vy -= e.g;
        if (e.y <= 0) {
          e.dead = true;
          if (e.landSpawn) st.ents.push({ ...e.landSpawn, hit: e.landSpawn.hit ? { ...e.landSpawn.hit } : null, id: st.nextId++, owner: e.owner, dir: e.dir, x: e.x, y: 0, vx: 0, age: 0, hitCD: 0 });
          emit(st, { t: 'splash', kind: e.kind, x: e.x, y: 0 });
        }
      }
      if (e.x < -100 || e.x > SYS.STAGE_W + 100) e.dead = true;
    }
    if (e.dead || e.life <= 0) {
      e.dead = true;
      continue;
    }
    const tb = worldBox(target, hurtbox(target));
    if (e.behavior === 'puddle') {
      const moving = Math.abs(target.vx) > 2 && target.y <= 0 && ['walk', 'run', 'dash', 'rush', 'backdash'].includes(target.state);
      if (moving && overlap(entBox(e), tb)) {
        setState(target, 'slip');
        target.stun = e.slip || 36;
        target.vx = 0;
        e.dead = true;
        emit(st, { t: 'slip', side: target.side, x: target.x });
      }
      continue;
    }
    if (!e.hit || e.hitCD > 0) continue;
    if (overlap(entBox(e), tb)) {
      const res = applyHit(st, owner, target, e.hit, { type: 'proj', ent: e, x: e.x });
      if (res !== 'miss') {
        e.hitsLeft--;
        e.hitCD = 9;
        if (e.hitsLeft <= 0) e.dead = true;
      }
    }
  }
  // Projéteis de donos diferentes se anulam
  const fl = st.ents.filter((e) => !e.dead && e.behavior === 'fly' && e.hit && !e.delay);
  for (let i = 0; i < fl.length; i++) {
    for (let j = i + 1; j < fl.length; j++) {
      const a = fl[i];
      const b = fl[j];
      if (a.owner !== b.owner && !a.dead && !b.dead && overlap(entBox(a), entBox(b))) {
        if (--a.hitsLeft <= 0) a.dead = true;
        if (--b.hitsLeft <= 0) b.dead = true;
        emit(st, { t: 'clash', x: (a.x + b.x) / 2, y: a.y + a.h / 2 });
      }
    }
  }
  st.ents = st.ents.filter((e) => !e.dead);
}
