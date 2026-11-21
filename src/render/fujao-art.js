import { SYS } from '../data/system.js';
import { FUJAO_FX_BOUNDS } from '../data/fujao-art.js';
import { drawSpriteLayer } from './sprites.js';

const phase = (t, n) => Math.max(0, Math.min(5, Math.floor(t / Math.max(1, n) * 6)));
export const drawFujaoLayer = (c, name, index, box) => FUJAO_FX_BOUNDS[name]
  ? drawSpriteLayer(c, 'fujao-fx', name, index, { ...box, crop: FUJAO_FX_BOUNDS[name] }) : false;

export function fujaoEntityArt(e, owner) {
  if (owner !== 'fujao') return null;
  const ground = SYS.GROUND_Y;
  if (e.kind === 'mala') return { name: 'mala-no-chao', index: Math.floor(e.age / 8) % 6, box: { x: e.x, y: ground, w: e.w, h: e.h, anchor: 'bottom' } };
  if (e.kind === 'mala-voando') return { name: 'mala-voando', index: Math.floor(e.age / 3) % 6, box: { x: e.x, y: ground - e.y - e.h / 2, w: e.w * 1.4, h: e.h * 1.5, face: e.dir } };
  if (e.kind === 'mala-caindo') {
    const p = Math.max(0, Math.min(1, 1 - e.delay / 12));
    return { name: 'mala-caindo', index: phase(p, 1), box: { x: e.x, y: ground - (e.delay > 0 ? 720 * (1 - p * p) : 0), w: e.w, h: 150, anchor: 'bottom' }, warning: e.delay > 0 };
  }
  return null;
}
export function drawFujaoEntity(c, e, owner) {
  const a = fujaoEntityArt(e, owner);
  if (!a) return false;
  if (a.warning) drawFujaoLayer(c, 'aviso-queda', Math.floor(e.age / 3) % 6, { x: e.x, y: SYS.GROUND_Y + 10, w: e.w, h: 95, anchor: 'bottom' });
  return drawFujaoLayer(c, a.name, a.index, a.box);
}
export function drawFujaoAttack(c, f) {
  if (f.ch.id !== 'fujao' || !f.move) return false;
  if (f.moveKey === '6S' && f.sf < 30) drawFujaoLayer(c, f.move.isTurbo ? 'carrinho-turbo' : 'carrinho-bagagem', Math.floor(f.sf / 3) % 6, { x: 210, y: 0, w: 270, h: 300, anchor: 'bottom' });
  if (f.moveKey === 'SA3' && f.sf >= 4 && f.sf <= 25) drawFujaoLayer(c, 'esteira-super', Math.floor((f.sf - 4) / 3) % 6, { x: 250, y: -680, w: 420, h: 180 });
  return true;
}
export function drawFujaoStatus(c, f, frame) {
  if (f.ch.id !== 'fujao' || f.hp <= 0) return;
  const name = f.res.board > 0 ? 'embarque-progresso' : f.res.cornered ? 'encurralado-aviso' : f.res.escapeCD <= 0 ? 'fuga-pronta' : null;
  if (name) drawFujaoLayer(c, name, Math.floor(frame / 6) % 6, { x: f.x, y: SYS.GROUND_Y - f.y - 545, w: 120, h: 95 });
}
export function fujaoEventArt(e, st) {
  const actor = st.f[e.side], f = st.f.find(f => f.ch?.id === 'fujao' && (e.x == null || Math.abs(f.x - e.x) < 50));
  if (e.t === 'hit' && actor?.ch?.id === 'fujao' && ['5H', 'jH', '5S', '6S', 'SA1', 'SA3'].includes(e.key)) return { name: e.key === 'SA1' ? 'pista-livre-impacto' : 'mala-impacto', x: e.x, y: SYS.GROUND_Y - e.y, w: 240, h: 220, dur: 18 };
  if (e.t === 'strike' && e.kind === 'mala-caindo') return { name: 'mala-impacto', x: e.x, y: SYS.GROUND_Y - 65, w: 230, h: 170, dur: 18 };
  if ((e.t === 'escape' || e.t === 'move' && e.key === '4S') && actor?.ch?.id === 'fujao') return { name: 'fuga-poeira', x: e.x ?? actor.x, y: SYS.GROUND_Y, w: 280, h: 130, anchor: 'bottom', dur: 24 };
  if (e.t === 'pop' && f) {
    const name = e.str === 'EMBARQUE NEGADO!' ? 'embarque-negado' : e.str.startsWith('QUASE EMBARCOU!') ? 'embarque-cura' : null;
    if (name) return { name, x: f.x, y: SYS.GROUND_Y - 600, w: 180, h: 160, dur: 30 };
  }
  return null;
}
export const drawFujaoParticle = (c, p) => drawFujaoLayer(c, p.name, phase(p.t, p.dur), p);
