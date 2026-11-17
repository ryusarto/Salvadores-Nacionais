import { drawBelemGround } from './belem-stage.js';
const packs = new Map();
const catalog = new Map(), requests = new Map();
/** Register metadata without downloading arenas which have not been visited. */
export function registerStageArt(all) {
  for (const [id, pack] of Object.entries(all)) {
    if (id === 'belem') continue;
    catalog.set(id, pack); requests.delete(id); packs.delete(id);
  }
}
export function requestStageArt(id) {
  if (packs.has(id) || !catalog.has(id)) return requests.get(id);
  if (!requests.has(id)) requests.set(id, loadStageArt({ [id]: catalog.get(id) }));
  return requests.get(id);
}
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/** Independent layers, positioned props, animation strips and a tiled floor. */
export async function loadStageArt(all) {
  await Promise.all(Object.entries(all).filter(([id]) => id !== 'belem').map(async ([id, pack]) => {
    packs.delete(id);
    if (!Array.isArray(pack.layers) || !pack.layers.length || !pack.assets) return;
    const used = [...pack.layers, ...(pack.objects || []), ...(pack.foreground || [])].map(o => o.asset);
    if (pack.ground) used.push(pack.ground.asset);
    used.push(...(pack.interactive || []));
    const essential = pack.essential || used;
    const images = new Map(), errors = [];
    await Promise.all([...new Set(used)].map(async key => {
      const a = pack.assets[key];
      if (!a || a.kind === 'audio') { errors.push(key); return; }
      try {
        const img = new Image(); img.decoding = 'async'; img.src = a.url;
        await img.decode();
        if (!(img.width > 0 && img.height > 0)) throw Error('empty image');
        images.set(key, img);
      } catch { errors.push(key); }
    }));
    if (essential.length && essential.every(key => images.has(key))) packs.set(id, { pack, images, errors });
  }));
}
export function stageArtStatus(id) {
  const item = packs.get(id);
  return { ready: !!item, loaded: item?.images.size || 0, errors: [...(item?.errors || [])] };
}
export function stageAnimationFrame(frame, fps = 5, count = 6, phase = 0) {
  const n = Math.max(1, Math.floor(finite(count, 1)));
  return ((Math.floor(Math.max(0, finite(frame, 0)) * Math.max(0, finite(fps, 5)) / 60) + Math.floor(finite(phase, 0))) % n + n) % n;
}
function object(c, item, o, cam, frame, reducedEffects, cull = true) {
  const a = item.pack.assets[o.asset], img = item.images.get(o.asset);
  if (!a || !img) return false;
  const frames = a.frames || 1, cellW = a.cellWidth || (img.width / frames);
  const [sx, sy, sw, sh] = a.crop || [0, 0, cellW, img.height];
  const h = o.h ?? (o.w ? o.w * sh / sw : sh), w = o.w ?? h * sw / sh;
  const x = o.x - cam * finite(o.factor, 1) - w / 2, y = o.y - h;
  if (cull && (x + w < 0 || x > 1920)) return true;
  const f = frames > 1 ? stageAnimationFrame(reducedEffects ? 0 : frame, o.fps, frames, o.phase) : 0;
  c.save(); c.globalAlpha = clamp(finite(o.opacity, 1), 0, 1);
  c.drawImage(img, sx + f * cellW, sy, sw, sh, x, y, w, h);
  c.restore();
  return true;
}
/** Paint a gameplay prop in the caller's world/local coordinates, centered on its base. */
export function drawStageProp(c, stageId, asset, options) {
  const item = packs.get(stageId);
  if (!item) { void requestStageArt(stageId); return false; }
  const { frame = 0, reducedEffects = false, ...placement } = options;
  return object(c, item, { ...placement, asset, opacity: finite(placement.opacity, 1) * finite(c.globalAlpha, 1) }, 0, frame, reducedEffects, false);
}
export function drawStageArt(c, id, cam, frame = 0, options = {}) {
  const item = packs.get(id);
  if (!item) { void requestStageArt(id); return false; }
  const camera = clamp(finite(cam, 0), 0, 680), { pack } = item;
  for (const layer of pack.layers) {
    const img = item.images.get(layer.asset); if (!img) continue;
    const height = layer.height ?? 1080, width = layer.width ?? img.width * height / img.height;
    c.save(); c.globalAlpha = clamp(finite(layer.opacity, 1), 0, 1);
    c.drawImage(img, (layer.x || 0) - camera * finite(layer.factor, 1), layer.y || 0, width, height);
    c.restore();
  }
  for (const o of pack.objects || []) object(c, item, o, camera, frame, options.reducedEffects);
  if (pack.ground && item.images.has(pack.ground.asset)) {
    const ground = pack.ground, image = item.images.get(ground.asset);
    const flat = ground.projection === 'flat';
    const y = flat ? finite(ground.y, finite(pack.world?.groundTopY, 826)) : 826;
    const height = flat ? finite(ground.height, finite(pack.world?.height, 1080) - y) : 254;
    // Painted tarmac already contains its perspective; older packs retain tiled projection.
    if (flat) {
      const width = finite(ground.width, finite(pack.world?.width, 2600));
      c.drawImage(image, finite(ground.x, 0) - camera * finite(ground.factor, 1), y, width, height);
    } else drawBelemGround(c, image, camera);
    if (pack.ground.shade) {
      c.save(); c.fillStyle = pack.ground.shade; c.fillRect(0, y, 1920, height); c.restore();
    }
  }
  for (const o of pack.foreground || []) object(c, item, o, camera, frame, options.reducedEffects);
  return true;
}
