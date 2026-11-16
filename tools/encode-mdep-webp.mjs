// Gera as tiras do jogo do M'Dep em WebP a partir dos PNGs mestres.
// Uso: node tools/encode-mdep-webp.mjs
// Mestres (10 células de 768 px, RGBA): production/sprites/source/mdep-v3/strips/<tira>.png
// Saída do jogo: production/sprites/final/mdep/<tira>.webp
// Qualidade 92 com alpha sem perda: visualmente igual ao PNG e cerca de 4× menor.
import sharp from 'sharp';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const masters = 'production/sprites/source/mdep-v3/strips';
const game = 'production/sprites/final/mdep';
const QUALITY = 92;

mkdirSync(game, { recursive: true });
let before = 0, after = 0;
for (const file of readdirSync(masters).filter(f => f.endsWith('.png')).sort()) {
  const src = join(masters, file);
  const dest = join(game, file.replace(/\.png$/, '.webp'));
  const meta = await sharp(src).metadata();
  if (meta.width !== 7680 || meta.height !== 768 || !meta.hasAlpha) throw new Error(`${file}: esperado 7680×768 com alpha`);
  await sharp(src).webp({ quality: QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(dest);
  before += statSync(src).size;
  after += statSync(dest).size;
  console.log(file, '→', (statSync(dest).size / 1e6).toFixed(2), 'MB');
}
console.log(`Total: ${(before / 1e6).toFixed(1)} MB em PNG → ${(after / 1e6).toFixed(1)} MB em WebP`);
