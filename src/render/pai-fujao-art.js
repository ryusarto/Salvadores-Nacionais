import { SYS } from '../data/system.js';
import { PAI } from '../data/characters/pai-fujao.js';
import { PAI_FUJAO_FX_CROPS } from '../data/pai-fujao-art.js';
import { drawSpriteLayer } from './sprites.js';

const GY = SYS.GROUND_Y;
const phase = (age, duration) => Math.max(0, Math.min(5, Math.floor(age / Math.max(1, duration) * 6)));
export function paiZoneIndex(f, frame) {
  const distance = Math.abs(f.x - PAI.zoneX);
  const band = distance > PAI.zoneR ? 4 : distance > PAI.zoneR - 90 ? 2 : 0;
  return band + Math.floor(frame / 8) % 2;
}
const draw = (c, a) => drawSpriteLayer(c, 'pai-fujao-fx', a.name, a.index,
  { ...a.box, crop: PAI_FUJAO_FX_CROPS[a.name] });

/** Positions and state come exclusively from the live entities. */
export function paiEntityArt(e, ownerId, target) {
  if (ownerId !== 'pai-fujao') return null;
  if (e.kind === 'dinheiro') return { name: 'dinheiro-girar', index: Math.floor(e.age / 3) % 6,
    box: { x: e.x, y: GY - e.y - e.h / 2, w: e.w * 1.3, h: e.h * 1.3, face: e.dir } };
  if (e.kind !== 'capanga') return null;
  const distance = target ? Math.abs(target.x - e.x) : Infinity;
  const attacking = distance < 300;
  return { name: attacking ? 'capanga-ataque' : 'capanga-correr',
    index: attacking ? Math.min(3, Math.floor((300 - distance) / 140 * 2)) : Math.floor(e.age / 3) % 6,
    box: { x: e.x, y: GY - e.y, w: 280, h: e.h, face: e.dir, anchor: 'bottom' } };
}
export function drawPaiEntity(c, e, ownerId, target) {
  const a = paiEntityArt(e, ownerId, target);
  return a ? draw(c, a) : false;
}

export function paiAttackArt(f) {
  if (f.ch.id !== 'pai-fujao' || f.state !== 'attack' || !['5H', '4S'].includes(f.moveKey)) return null;
  const h = f.move?.hits.find(h => f.sf >= h.from && f.sf <= h.to);
  if (!h) return null;
  return { name: 'bengala-arco', index: phase(f.sf - h.from, h.to - h.from + 1),
    box: { x: h.box.x + h.box.w / 2, y: -(h.box.y + h.box.h / 2), w: h.box.w, h: Math.max(130, h.box.h) } };
}
export function drawPaiAttack(c, f) {
  const a = paiAttackArt(f);
  return a ? draw(c, a) : false;
}

export function paiStatusArt(f, frame) {
  if (f.ch.id !== 'pai-fujao' || !f.res || f.state === 'ko') return [];
  const index = Math.floor(frame / 8) % 6, x = f.x, y = GY - f.y;
  const a = [];
  if (f.res.foro > 0) a.push({ name: 'foro-escudo', index, box: { x, y: y - 250, w: 440, h: 600 } });
  if (f.res.fury) a.push({ name: 'furia-aura', index, box: { x, y: y - 235, w: 360, h: 520 } });
  // HUD indicators; the body's ankle monitor and hand-held phone are already drawn.
  a.push({ name: f.res.callT > 0 ? 'telefone-ocupado' : 'telefone-pronto', index,
    box: { x: x - f.face * 110, y: y - 540, w: 70, h: 70 } });
  a.push({ name: 'tornozeleira-monitor', index: paiZoneIndex(f, frame),
    box: { x: x + f.face * 95, y: y - 540, w: 65, h: 65 } });
  return a;
}
export function drawPaiStatus(c, f, frame, layer = 'all') {
  for (const a of paiStatusArt(f, frame)) {
    const behind = ['foro-escudo', 'furia-aura'].includes(a.name);
    if (layer === 'back' && !behind || layer === 'front' && behind) continue;
    draw(c, a);
  }
}

export function drawPaiZone(c, f, zoneX, zoneR, frame) {
  if (f.ch.id !== 'pai-fujao' || f.state === 'ko') return false;
  c.save(); c.translate(zoneX, GY + 10); c.scale(zoneR / 200, .24);
  const ok = draw(c, { name: 'tornozeleira-zona', index: paiZoneIndex(f, frame),
    box: { x: 0, y: 0, w: 400, h: 400 } });
  c.restore();
  return ok;
}

export function paiEventArt(e, st) {
  const actor = st.f[e.side];
  const particle = (name, x, y, w = 190, h = w, dur = 18, extra = {}) => ({ name, x, y, w, h, dur, face: 1, ...extra });
  if (e.t === 'hit' && actor?.ch.id === 'pai-fujao') {
    if (e.key === 'SA1') return [particle('dinheiro-impacto', e.x, GY - e.y),
      particle('dinheiro-cura', actor.x, GY - actor.y - 300, 180, 200, 26)];
    if (e.key === 'SA3') {
      const i = actor.move?.hits.findLastIndex(h => h.from <= actor.sf) ?? 0;
      return [particle(i >= 2 ? 'prisao-impacto-final' : i === 1 ? 'prisao-choque' : 'impacto', e.x, GY - e.y, i >= 2 ? 350 : 220)];
    }
    return [particle('impacto', e.x, GY - e.y, e.super ? 280 : 190)];
  }
  if (e.t === 'shock' && actor?.ch.id === 'pai-fujao')
    return [particle('tornozeleira-choque', actor.x, GY - actor.y - 35, 160, 160, 36, { bind: e.side, offsetY: 35 })];
  if (e.t === 'trap' && actor && st.f[1 - e.side]?.ch.id === 'pai-fujao')
    return [particle('prisao-trava', actor.x, GY - actor.y - 30, 100, 90, 70, { bind: e.side, offsetY: 30 })];
  if (e.t === 'pop') {
    const f = st.f.find(f => f.ch.id === 'pai-fujao' && f.x === e.x);
    if (!f) return [];
    const name = ({ 'FORO PRIVILEGIADO!': 'foro-impacto', 'FORO CASSADO!': 'foro-cassado', 'FORO DE VOLTA': 'foro-retorno' })[e.str];
    if (name) return [particle(name, f.x, GY - f.y - 260, 350, 520, 28)];
  }
  return [];
}
export function drawPaiParticle(c, p, st) {
  const f = p.bind != null ? st?.f[p.bind] : null;
  return draw(c, { name: p.name, index: phase(p.t, p.dur), box: {
    x: f?.x ?? p.x, y: f ? GY - f.y - p.offsetY : p.y,
    w: p.w, h: p.h, face: p.face } });
}
