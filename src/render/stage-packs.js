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
  if (!requests.has(id)) requests.set(id, loadStageArt({ [id]: catalog.get(id) }, { prepare: true }));
  return requests.get(id);
}
/**
 * Imagem decodificada fora da thread do jogo e que o navegador não descarta:
 * um <img> pode ser decodificado de novo no meio da luta (50-100 ms), e
 * createImageBitmap(<img>) decodifica na thread principal. Um Blob, não.
 */
export async function loadPersistentImage(url, options) {
  if (typeof createImageBitmap === 'function' && typeof fetch === 'function' && typeof document !== 'undefined') {
    try {
      const response = await fetch(url);
      if (response.ok) return await createImageBitmap(await response.blob(), options);
    } catch { /* cai no <img> abaixo */ }
  }
  const img = new Image(); img.decoding = 'async'; img.src = url;
  await img.decode();
  return img;
}
const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
/** Explicit loaders keep editable layers for art previews; runtime requests opt into baking. */
export async function loadStageArt(all, { prepare = false } = {}) {
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
        const img = await loadPersistentImage(a.url);
        if (!(img.width > 0 && img.height > 0)) throw Error('empty image');
        images.set(key, img);
      } catch { errors.push(key); }
    }));
    if (!(essential.length && essential.every(key => images.has(key)))) return;
    const item = { pack, images, errors, loaded: images.size, fast: null };
    // No navegador, pré-monta o cenário uma vez; a luta desenha poucas camadas prontas.
    if (prepare && canPrepare()) {
      try {
        item.fast = await prepareStage(pack, images);
        // Gameplay entities still draw independently; scenery atlases can be released.
        item.images = new Map((pack.interactive || []).filter(key => images.has(key)).map(key => [key, images.get(key)]));
      } catch { item.fast = null; }
    }
    packs.set(id, item);
  }));
}
export function stageArtStatus(id) {
  const item = packs.get(id);
  return { ready: !!item, loaded: item?.loaded || 0, errors: [...(item?.errors || [])], prepared: !!item?.fast };
}

// --- Cenário pré-montado -------------------------------------------------
// Desenhar 70+ objetos e tiras de 3000x500 a cada quadro estoura o cache de
// imagens decodificadas do navegador (159 MB no palco) e derruba a luta para
// 14-45 fps. Objetos parados e seguidos na mesma profundidade viram uma camada
// (a operação "over" é associativa, o resultado é o mesmo); tiras animadas são
// reduzidas ao tamanho em que aparecem; o chão fica em cache por pixel de câmera.
export const canPrepare = () => typeof OffscreenCanvas === 'function' || typeof document !== 'undefined';
const makeCanvas = (w, h) => typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
const yieldTask = () => new Promise(resolve => setTimeout(resolve, 0));

function geometry(a, size, o) {
  const frames = a.frames || 1, cellW = a.cellWidth || (size.width / frames);
  const [sx, sy, sw, sh] = a.crop || [0, 0, cellW, size.height];
  const h = o.h ?? (o.w ? o.w * sh / sw : sh), w = o.w ?? h * sw / sh;
  return { frames, cellW, sx, sy, sw, sh, w, h, x: o.x - w / 2, y: o.y - h, factor: finite(o.factor, 1), alpha: clamp(finite(o.opacity, 1), 0, 1) };
}

/**
 * Plano de desenho na ordem original: trechos de objetos parados na mesma
 * profundidade viram "bake"; cada objeto animado continua separado ("anim").
 * @param {Array} list objetos do manifesto
 * @param {Object} assets assets do manifesto
 * @param {Map<string,{width:number,height:number}>} sizes tamanhos carregados
 */
export function planStageObjects(list, assets, sizes) {
  const ops = [];
  for (const o of list || []) {
    const a = assets[o.asset], size = sizes.get(o.asset);
    if (!a || !size) continue;
    const g = geometry(a, size, o);
    if (g.frames > 1) { ops.push({ type: 'anim', key: o.asset, fps: o.fps, phase: o.phase, ...g }); continue; }
    const last = ops.at(-1);
    const run = last?.type === 'bake' && last.factor === g.factor ? last : null;
    const item = { key: o.asset, ...g };
    if (run) run.items.push(item); else ops.push({ type: 'bake', factor: g.factor, items: [item] });
  }
  for (const op of ops) if (op.type === 'bake') {
    const x0 = Math.floor(Math.min(...op.items.map(i => i.x))), y0 = Math.floor(Math.min(...op.items.map(i => i.y)));
    const x1 = Math.ceil(Math.max(...op.items.map(i => i.x + i.w))), y1 = Math.ceil(Math.max(...op.items.map(i => i.y + i.h)));
    op.box = { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }
  return ops;
}

/** Pré-monta uma lista de objetos: camadas paradas juntas e tiras animadas no tamanho da tela. */
export async function prepareStageObjects(list, assets, images) {
  const ops = planStageObjects(list, assets, images);
  for (const op of ops) {
    if (op.type === 'bake') {
      const cv = makeCanvas(op.box.w, op.box.h), g = cv.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      for (const i of op.items) { g.globalAlpha = i.alpha; g.drawImage(images.get(i.key), i.sx, i.sy, i.sw, i.sh, i.x - op.box.x, i.y - op.box.y, i.w, i.h); }
      op.cv = cv;
    } else {
      const cw = Math.max(1, Math.ceil(op.w)), ch = Math.max(1, Math.ceil(op.h));
      const cv = makeCanvas(cw * op.frames, ch), g = cv.getContext('2d');
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      for (let f = 0; f < op.frames; f++) g.drawImage(images.get(op.key), op.sx + f * op.cellW, op.sy, op.sw, op.sh, f * cw, 0, op.w, op.h);
      op.cv = cv; op.cw = cw;
    }
    op.items = null;
    await yieldTask();
  }
  return ops;
}
async function prepareStage(pack, images) {
  const prepared = [];
  for (const list of [pack.objects, pack.foreground]) prepared.push(await prepareStageObjects(list, pack.assets, images));
  const layers = pack.layers.map(layer => ({ layer, img: images.get(layer.asset) })).filter(l => l.img);
  const ground = pack.ground && images.get(pack.ground.asset);
  return { layers, objects: prepared[0], foreground: prepared[1], ground, groundCache: null, groundCam: null };
}

export function drawPrepared(c, ops, camera, frame, reducedEffects, warm = false) {
  for (const op of ops) {
    if (op.type === 'bake') {
      const x = Math.round(op.box.x - camera * op.factor);
      if (!warm && (x + op.box.w < 0 || x > 1920)) continue;
      c.globalAlpha = 1;
      c.drawImage(op.cv, x, op.box.y);
    } else {
      const x = Math.round(op.x - camera * op.factor);
      if (!warm && (x + op.w < 0 || x > 1920)) continue;
      const f = stageAnimationFrame(reducedEffects ? 0 : frame, op.fps, op.frames, op.phase);
      c.globalAlpha = op.alpha;
      c.drawImage(op.cv, f * op.cw, 0, op.w, op.h, x, Math.round(op.y), op.w, op.h);
    }
  }
  c.globalAlpha = 1;
}

// Painted floors already include their perspective; older arenas keep the tiled projection.
function drawPackGround(c, pack, image, camera) {
  const ground = pack.ground, flat = ground.projection === 'flat';
  const y = flat ? finite(ground.y, finite(pack.world?.groundTopY, 826)) : 826;
  const height = flat ? finite(ground.height, finite(pack.world?.height, 1080) - y) : 254;
  if (flat) {
    const width = finite(ground.width, finite(pack.world?.width, 2600));
    c.drawImage(image, finite(ground.x, 0) - camera * finite(ground.factor, 1), y, width, height);
  } else drawBelemGround(c, image, camera);
  if (ground.shade) {
    c.save(); c.fillStyle = ground.shade; c.fillRect(0, y, 1920, height); c.restore();
  }
}

// O chão projetado custa ~130 drawImage; só é refeito quando a câmera muda de pixel.
const GROUND_TOP = 820;
function drawPreparedGround(c, pack, fast, camera) {
  // A flat floor is already one drawImage; caching would resample its camera position.
  if (pack.ground.projection === 'flat') {
    drawPackGround(c, pack, fast.ground, camera);
    return;
  }
  const pixel = Math.round(camera);
  fast.groundCache ??= makeCanvas(1920, 1080 - GROUND_TOP);
  if (fast.groundCam !== pixel) {
    const g = fast.groundCache.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1920, 1080 - GROUND_TOP);
    g.setTransform(1, 0, 0, 1, 0, -GROUND_TOP);
    drawPackGround(g, pack, fast.ground, pixel);
    fast.groundCam = pixel;
  }
  c.drawImage(fast.groundCache, 0, GROUND_TOP);
}

function drawFast(c, item, camera, frame, options) {
  const { pack, fast } = item;
  c.save();
  for (const { layer, img } of fast.layers) {
    const height = layer.height ?? 1080, width = layer.width ?? img.width * height / img.height;
    c.globalAlpha = clamp(finite(layer.opacity, 1), 0, 1);
    c.drawImage(img, (layer.x || 0) - camera * finite(layer.factor, 1), layer.y || 0, width, height);
  }
  drawPrepared(c, fast.objects, camera, frame, options.reducedEffects, options.warm);
  if (fast.ground) drawPreparedGround(c, pack, fast, camera);
  drawPrepared(c, fast.foreground, camera, frame, options.reducedEffects, options.warm);
  c.restore();
  return true;
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
  if (item.fast) return drawFast(c, item, camera, frame, options);
  for (const layer of pack.layers) {
    const img = item.images.get(layer.asset); if (!img) continue;
    const height = layer.height ?? 1080, width = layer.width ?? img.width * height / img.height;
    c.save(); c.globalAlpha = clamp(finite(layer.opacity, 1), 0, 1);
    c.drawImage(img, (layer.x || 0) - camera * finite(layer.factor, 1), layer.y || 0, width, height);
    c.restore();
  }
  for (const o of pack.objects || []) object(c, item, o, camera, frame, options.reducedEffects);
  if (pack.ground && item.images.has(pack.ground.asset)) {
    drawPackGround(c, pack, item.images.get(pack.ground.asset), camera);
  }
  for (const o of pack.foreground || []) object(c, item, o, camera, frame, options.reducedEffects);
  return true;
}
