/** Character metadata, including FX and independent facing packs, drives registration. */
export function spriteOptions(id, characters, metadata = {}) {
  const ch = characters.find(ch => [ch.id, ...Object.values(ch.spriteFacingPacks || {})].some(base => [base, `${base}-fx`, `fx-${base}`].includes(id)));
  const effects = id.startsWith('fx-') || id.endsWith('-fx');
  const profile = metadata[id]?.profile || ch?.spriteProfile;
  const twelve = profile === 'twelve-frame' && (!effects || metadata[id]?.profile === 'twelve-frame');
  const ten = profile === 'ten-frame', six = profile === 'six-frame';
  return {
    lazy: true, maxDecoded: twelve ? 1 : effects ? 4 : ten ? 8 : 6,
    trueAlpha: twelve || ten || six, frames: twelve ? 12 : ten ? 10 : six ? 6 : 4,
    cellSize: twelve || ten ? 768 : six ? 500 : undefined,
    preload: [], prefetch: false, pinIdle: !twelve, material: !twelve, warmAll: twelve,
  };
}
