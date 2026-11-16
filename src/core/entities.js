import { SYS } from '../data/system.js';
import { applyHit } from './combat.js';
import { hurtbox, worldBox, overlap, setState, emit } from './fighter.js';

/**
 * Entidades: projéteis, marcas no chão, poças e ajudantes.
 * behavior: 'fly' (voa e acerta), 'strike' (espera `delay` e cai), 'puddle' (faz escorregar),
 * 'patch' (armadilha parada no chão), 'barrier' (parede no chão: o rival não passa a pé,
 * só pulando; golpes do rival a derrubam; com `trap`, quem encostar fica preso), 'decoy'
 * (cópia falsa: não segura ninguém, mas engole o golpe ou projétil do rival que a acertar).
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
    x: d.at_opponent ? o.x + (d.ox || 0) : f.x + f.face * d.x,
    y: d.behavior === 'fly' ? f.y + d.y : d.y,
    vx: d.vx * f.face,
    age: 0,
    hitCD: 0,
    moveKey: f.moveKey, // golpe que criou a entidade (lista de combos)
  };
  e.x = Math.max(60, Math.min(SYS.STAGE_W - 60, e.x));
  st.ents.push(e);
  emit(st, { t: 'spawn', kind: e.kind, x: e.x, y: e.y, side: f.side });
  return e;
}

const entBox = (e) => ({ l: e.x - e.w / 2, r: e.x + e.w / 2, b: e.y, t: e.y + e.h });

function damageBarrier(st, e) {
  if (--e.hp > 0) return;
  e.dead = true;
  emit(st, { t: 'pop', str: e.breakText || 'DERRUBOU!', x: e.x, y: e.h + 60, color: '#ffcf2a', size: 44 });
  emit(st, { t: 'barrierDown', kind: e.kind, x: e.x });
}

function popDecoy(st, e) {
  e.dead = true;
  emit(st, { t: 'pop', str: e.popText || 'FAKE!', x: e.x, y: 520, color: '#ff8a3a', size: 46 });
  emit(st, { t: 'decoy', x: e.x });
}

/** Cópia falsa: engole o golpe do rival que a acertar (o golpe é gasto) e some. */
function updateDecoy(st, e, target) {
  const box = { l: e.x - e.w / 2, r: e.x + e.w / 2, b: 0, t: e.h };
  if (target.state === 'attack') {
    for (let i = 0; i < target.move.hits.length; i++) {
      const h = target.move.hits[i];
      if (target.hitDone[i] || target.sf < h.from || target.sf > h.to) continue;
      if (overlap(worldBox(target, h.box), box)) {
        target.hitDone = target.move.hits.map(() => true);
        target.connected = 'block';
        popDecoy(st, e);
        return;
      }
    }
  }
  for (const p of st.ents) {
    if (p.dead || p.owner === e.owner || p.behavior !== 'fly' || !p.hit || p.delay) continue;
    if (overlap(entBox(p), box)) {
      p.dead = true;
      popDecoy(st, e);
      return;
    }
  }
}

/** Parede no chão: segura o rival, apanha dos golpes dele e pode prender quem encostar. */
function updateBarrier(st, e, target) {
  // golpes do rival (cada golpe conta uma vez: a lista de acertos é nova a cada golpe)
  if (target.state === 'attack' && e.lastHit !== target.hitDone) {
    for (const h of target.move.hits) {
      if (target.sf < h.from || target.sf > h.to) continue;
      // hitH: altura que apanha (a placa da cerca fica acima da grade que segura)
      if (overlap(worldBox(target, h.box), { ...entBox(e), t: e.y + (e.hitH || e.h) })) {
        e.lastHit = target.hitDone;
        damageBarrier(st, e);
        if (e.dead) return;
        break;
      }
    }
  }
  if (target.y >= e.h || target.state === 'ko' || target.state === 'thrown') return;
  const half = -SYS.BODY.stand.x;
  const left = target.x < e.x;
  const edge = left ? e.x - e.w / 2 - half : e.x + e.w / 2 + half;
  if (left ? target.x <= edge : target.x >= edge) return;
  if (e.trap && target.y <= 0 && target.state !== 'frozen' && !e.trapped) {
    e.trapped = true;
    setState(target, 'frozen');
    target.stun = e.trap;
    target.status.queue = e.id;
    emit(st, { t: 'pop', str: e.trapText || 'PRESO!', x: target.x, y: 560, color: '#9ff5e8', size: 44 });
  }
  target.x = edge;
  // no chão, para; no ar, só não atravessa a grade (o pulo continua e pode passar por cima)
  if (target.y <= 0 && Math.sign(target.vx) === (left ? 1 : -1)) target.vx = 0;
}

/** Avança todas as entidades um quadro. */
export function updateEntities(st) {
  for (const e of st.ents) {
    e.age++;
    if (e.hitCD > 0) e.hitCD--;
    const owner = st.f[e.owner];
    const target = st.f[1 - e.owner];
    if (e.delay > 0) {
      e.delay--;
      if (e.delay === 0 && e.behavior === 'strike') emit(st, { t: 'strike', kind: e.kind, x: e.x, y: e.y });
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
    if (e.behavior === 'barrier') {
      updateBarrier(st, e, target);
      continue;
    }
    if (e.behavior === 'decoy') {
      updateDecoy(st, e, target);
      continue;
    }
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
  // Barreiras seguram os projéteis do rival
  for (const w of st.ents) {
    if (w.dead || w.behavior !== 'barrier') continue;
    for (const p of st.ents) {
      if (p.dead || p.owner === w.owner || p.behavior !== 'fly' || !p.hit || p.delay) continue;
      if (overlap(entBox(p), entBox(w))) {
        p.dead = true;
        damageBarrier(st, w);
        emit(st, { t: 'clash', x: w.x, y: p.y + p.h / 2 });
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
