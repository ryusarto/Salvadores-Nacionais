import { SYS } from '../data/system.js';
import { LAR } from '../data/characters/laranjao.js';
import { LARANJAO_FX_CROPS, LARANJAO_WALL_BOUNDS } from '../data/laranjao-art.js';
import { drawSpriteLayer, drawSpriteMapped } from './sprites.js';
import { drawHeadline, drawGoldArmor } from './boss-art.js';

const GY = SYS.GROUND_Y;
const phase = (t, n) => Math.max(0, Math.min(5, Math.floor(t / Math.max(1, n) * 6)));
const draw = (c, a) => drawSpriteLayer(c, 'laranjao-fx', a.name, a.index, { ...a.box, crop: LARANJAO_FX_CROPS[a.name] });
const meta = new WeakMap(), turboTweets = new WeakMap();
const particle = (name, x, y, w = 230, h = w, dur = 24, extra = {}) => ({ k: 'laranjao', name, x, y, w, h, t: 0, dur, ...extra });

/** Same animation clock, cached decoded pose, armor and facing as the owner. */
export function laranjaoClone(owner, entity, frame) {
  return { fighter: { ...owner, x: entity.x, ghost: true, spriteSource: owner }, frame: frame + owner.side * 17 };
}
export function drawLaranjaoIdleFallback(c, f, frame) {
  if (f.ch?.id !== 'laranjao' || f.state !== 'idle') return false;
  return drawSpriteLayer(c, 'laranjao-fx', 'clone-parado', Math.floor(frame / 80 * 6) % 6,
    { x: 0, y: 0, w: 768 * .76, h: 700 * .76, anchor: 'bottom', crop: [0, 0, 768, 700] });
}
export function laranjaoStatusArt(f, frame) {
  if (f.ch?.id !== 'laranjao' || f.state === 'ko' || !f.res?.armor) return [];
  const x = f.x, y = GY - f.y, index = Math.floor(frame / 8) % 6;
  return [{ name: 'armadura-campo', index, box: { x, y: y - 250, w: 380, h: 560 } },
    ...Array.from({ length: f.res.armor }, (_, i) => ({ name: 'armadura-carga', index,
      box: { x: x + (i - (f.res.armor - 1) / 2) * 42, y: y - 565, w: 38, h: 44 } }))];
}
export function drawLaranjaoStatus(c, f, frame, layer) {
  for (const a of laranjaoStatusArt(f, frame)) {
    if ((a.name === 'armadura-campo') !== (layer === 'back')) continue;
    if (!draw(c, a) && a.name === 'armadura-campo') drawGoldArmor(c, f, frame);
  }
}
export function drawLaranjaoHeadline(c, f, str, frame) {
  const y = GY - f.y - (f.res?.armor ? 630 : 560);
  if (!draw(c, { name: 'manchete-placa', index: Math.floor(frame / 10) % 6, box: { x: f.x, y, w: 340, h: 120 } })) {
    drawHeadline(c, f.x, y, str); return;
  }
  c.save(); c.font = "bold 20px Impact, 'Arial Black', sans-serif";
  c.fillStyle = '#211729'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(str, f.x, y, 270); c.restore();
}
export function drawLaranjaoAttack(c, f) {
  if (f.ch?.id !== 'laranjao' || !f.move) return false;
  const h = f.move.hits.find(h => f.sf >= h.from && f.sf <= h.to);
  if (f.moveKey === '6S' && f.sf >= 6 && f.sf <= 24)
    draw(c, { name: 'tarifaco-rastro', index: phase(f.sf - 6, 19), box: { x: -75, y: -230, w: 500, h: 400 } });
  if (f.moveKey === '4S' && h)
    draw(c, { name: 'veto-arco', index: phase(f.sf - h.from, h.to - h.from + 1), box: { x: 95, y: -340, w: 300, h: 490 } });
  return true;
}
export function laranjaoEntityArt(e, ownerId) {
  if (ownerId !== 'laranjao') return null;
  if (e.kind === 'tuite') return { name: 'tuitada-projetil', index: Math.floor(e.age / 3) % 6,
    box: { x: e.x, y: GY - e.y - e.h / 2, w: e.w * 1.3, h: e.h * 1.5, face: e.dir } };
  if (e.kind !== 'muralha') return null;
  const name = e.age < 10 ? 'muralha-queda' : e.hp < LAR.wallHp ? 'muralha-danos' : 'muralha-erguida';
  const index = name === 'muralha-danos' ? Math.max(0, Math.min(5, LAR.wallHp - e.hp)) : name === 'muralha-queda' ? phase(e.age, 10) : Math.floor(e.age / 8) % 6;
  return { name, index, solid: LARANJAO_WALL_BOUNDS[name][index],
    box: { x: e.x - e.w / 2, y: GY - e.y - e.h - (name === 'muralha-queda' ? (1 - e.age / 10) ** 2 * 720 : 0), w: e.w, h: e.h } };
}
export function drawLaranjaoEntity(c, e, ownerId) {
  const a = laranjaoEntityArt(e, ownerId);
  if (!a) return false;
  if (a.solid) return drawSpriteMapped(c, 'laranjao-fx', a.name, a.index, a.solid, a.box);
  if (turboTweets.get(e)) draw(c, { name: 'tuitada-turbo-rastro', index: Math.floor(e.age / 3) % 6,
    box: { ...a.box, x: e.x - e.dir * 85, w: 220, h: 85 } });
  return draw(c, a);
}

/** Visual observer: remembers removed entities, never writes into the simulation. */
export function syncLaranjaoFx(fx, st) {
  let m = meta.get(fx);
  if (!m || m.st !== st || m.fighters !== st.f || m.round !== st.round) {
    fx.parts = fx.parts.filter(p => p.k !== 'laranjao');
    m = { st, fighters: st.f, round: st.round, entities: new Map(), returns: new Map() }; meta.set(fx, m);
  }
  const now = new Map();
  for (const e of st.ents || []) {
    const owner = st.f[e.owner];
    if (e.dead || owner?.ch?.id !== 'laranjao') continue;
    const old = m.entities.get(e.id);
    now.set(e.id, { ...e });
    if (!old && e.kind === 'tuite') turboTweets.set(e, !!owner.move?.isTurbo);
    if (!old && e.kind === 'clone') fx.parts.push(particle('clone-surgir', e.x, GY - owner.y - 250, 360, 540));
    if (e.kind === 'muralha') {
      if ((!old || old.age < 10) && e.age >= 10) fx.parts.push(particle('muralha-impacto-chao', e.x, GY - 25, 420, 160));
      if (old && e.hp < old.hp) fx.parts.push(particle('impacto', e.x, GY - 350, 180));
    }
  }
  for (const [id, e] of m.entities) if (!now.has(id)) {
    if (e.kind === 'clone') fx.parts.push(particle('clone-romper', e.x, GY - e.y - 250, 350, 540));
    if (e.kind === 'muralha') fx.parts.push(particle('muralha-destruir', e.x, GY, e.w, e.h, 36, { wall: e }));
  }
  m.entities = now;
  for (const [side, p] of m.returns) {
    const f = st.f[side];
    if (f.status?.banished > 0) { p.dur = 0; m.returns.delete(side); }
    else if (f.y <= 0) {
      p.dur = 0; m.returns.delete(side);
      fx.parts.push(particle('banimento-retorno', f.x, GY - 70, 350, 240, 24, { landed: true }));
    }
  }
}
export function laranjaoEventArt(e, st) {
  const actor = st.f[e.side], arts = [];
  if (e.t === 'hit' && actor?.ch?.id === 'laranjao') arts.push(particle(e.key === '2S' ? 'tuitada-impacto' : 'impacto', e.x, GY - e.y));
  if (e.t === 'pop' && actor?.ch?.id === 'laranjao') {
    if (e.str?.startsWith('TARIFA SUPREMA!')) {
      for (const x of [actor.x, ...st.ents.filter(c => c.kind === 'clone' && !c.dead && c.owner === e.side).map(c => c.x)])
        arts.push(particle('tarifa-coleta', x, GY - actor.y - 300, 360, 400));
    }
    if (e.str === 'TARIFADO!') {
      arts.push(particle('armadura-impacto', actor.x, GY - actor.y - 260, 390, 540));
      if (!actor.res.armor) arts.push(particle('armadura-ruptura', actor.x, GY - actor.y - 260, 390, 540, 30));
    }
  }
  if (e.t === 'armor' && actor?.ch?.id === 'laranjao') arts.push(particle('armadura-impacto', actor.x, GY - actor.y - 260, 360, 500));
  if (e.t === 'fakeNews' && actor?.ch?.id === 'laranjao') {
    // Every candidate gets both effects: their only identifying clue remains the shadow.
    for (const x of [actor.x, ...st.ents.filter(c => c.kind === 'clone' && !c.dead && c.owner === e.side).map(c => c.x)])
      arts.push(particle('clone-surgir', x, GY - actor.y - 250, 360, 540), particle('fake-news-troca', x, GY - actor.y - 260, 360, 540));
  }
  if (e.t === 'unbanish' && actor && st.f[1 - e.side]?.ch?.id === 'laranjao')
    arts.push(particle('banimento-retorno', actor.x, GY - actor.y - 180, 340, 420, Infinity, { bind: e.side }));
  return arts;
}
export function queueLaranjaoEvent(fx, e, st) {
  for (const p of laranjaoEventArt(e, st)) {
    if (p.bind != null) { const m = meta.get(fx), old = m?.returns.get(p.bind); if (old) old.dur = 0; m?.returns.set(p.bind, p); }
    // Spawn events and entity observation may refer to the same clone this tick.
    if (!fx.parts.some(a => a.k === p.k && a.name === p.name && a.x === p.x && a.t === 0)) fx.parts.push(p);
  }
}
export function laranjaoReturnIndex(p) {
  return p.landed ? 3 + Math.min(2, Math.floor(p.t / p.dur * 3)) : Math.min(2, Math.floor(p.t / 6));
}
export function drawLaranjaoParticle(c, p, st) {
  if (p.wall) return drawSpriteMapped(c, 'laranjao-fx', p.name, phase(p.t, p.dur), LARANJAO_WALL_BOUNDS[p.name][0],
    { x: p.wall.x - p.wall.w / 2, y: GY - p.wall.y - p.wall.h, w: p.wall.w, h: p.wall.h });
  const f = p.bind != null ? st?.f[p.bind] : null;
  return draw(c, { name: p.name, index: p.name === 'banimento-retorno' ? laranjaoReturnIndex(p) : phase(p.t, p.dur),
    box: { x: f?.x ?? p.x, y: f ? GY - f.y - 180 : p.y, w: p.w, h: p.h, face: p.face ?? 1 } });
}
export function drawLaranjaoBanish(c, f) {
  const left = f.status?.banished || 0;
  if (!left) return false;
  const age = LAR.banish - left;
  if (age < 18) draw(c, { name: 'banimento-portal', index: phase(age, 18), box: { x: f.x, y: GY - 210, w: 350, h: 470 } });
  const index = left <= 12 ? 3 + Math.min(2, Math.floor((12 - left) / 4)) : Math.min(2, Math.floor(age / 4));
  return draw(c, { name: 'banimento-selo', index, box: { x: f.x, y: GY - 260, w: 330, h: 300 } });
}
