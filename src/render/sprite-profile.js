import { ALL } from '../data/characters/index.js';
export function spriteLoadOptions(id) {
  const effects = id.startsWith('fx-') || id.endsWith('-fx');
  const base = id.replace(/^fx-/, '').replace(/-fx$/, '').replace(/-esquerda$/, '');
  const profile = ALL[base]?.spriteProfile;
  const twelve = profile === 'twelve-frame' && !effects;
  const ten = base === 'mdep' && profile === 'ten-frame';
  const six = profile === 'six-frame';
  return { lazy: true, maxDecoded: twelve ? 1 : ten ? 8 : effects ? 4 : 6,
    trueAlpha: twelve || ten || six, frames: twelve ? 12 : ten ? 10 : six ? 6 : 4,
    cellSize: six ? 500 : ten || twelve ? 768 : undefined, preload: [], prefetch: false, pinIdle: !twelve, material: !twelve, warmAll: twelve };
}
