const packs = new Map();
/** New painted arenas declare layers and audio in production/stages/<id>/manifest.json. */
export async function loadStageArt(all) {
  await Promise.all(Object.entries(all).filter(([id]) => id !== 'belem').map(async ([id, pack]) => {
    if (!Array.isArray(pack.layers)) return;
    const images = new Map();
    await Promise.all(pack.layers.map(async layer => {
      const a = pack.assets[layer.asset]; if (!a) return;
      try { const img = new Image(); img.src = a.url; await img.decode(); images.set(layer.asset, img); } catch { /* keep functional scene fallback */ }
    }));
    if (images.size === pack.layers.length) packs.set(id, { pack, images });
  }));
}
export function drawStageArt(c, id, cam) {
  const item = packs.get(id); if (!item) return false;
  for (const layer of item.pack.layers) {
    const img = item.images.get(layer.asset), height = layer.height ?? 1080;
    const width = img.width * height / img.height;
    c.drawImage(img, -(cam * (layer.factor ?? 1)), layer.y ?? 0, width, height);
  }
  return true;
}
