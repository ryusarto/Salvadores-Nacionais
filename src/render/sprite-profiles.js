/** Character metadata, including FX and independent facing packs, drives registration. */
export function spriteOptions(id, characters, metadata = {}) {
  const ch = characters.find(ch => [ch.id, ...Object.values(ch.spriteFacingPacks || {})].some(base => [base, `${base}-fx`, `fx-${base}`].includes(id)));
  const effects = id.startsWith('fx-') || id.endsWith('-fx');
  const profile = metadata[id]?.profile || ch?.spriteProfile;
  const ten = profile === 'ten-frame', six = profile === 'six-frame';
  return { lazy: true, maxDecoded: effects ? 4 : ten ? 8 : 6, trueAlpha: ten || six, frames: ten ? 10 : six ? 6 : 4, cellSize: six ? 500 : ten ? 768 : undefined, preload: [], prefetch: false };
}
