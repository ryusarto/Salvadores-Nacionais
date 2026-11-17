// Auditoria de escala: compara a altura das tiras "em pé" de cada personagem.
// Uso: node tools/audit-sprite-scale.mjs <pacote> [pacote...]
// Mede o primeiro quadro e o quadro mais alto de cada tira em pé e compara com a
// mediana do personagem. Tiras desenhadas maiores ou menores aparecem marcadas.
import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';

export const STANDING = ['parado', 'andar', 'andar-tras', 'defesa-em-pe', 'dano-alto', 'tonto', 'vitoria', 'escape-agarrao',
  'golpe-5L', 'golpe-5M', 'golpe-5H', 'golpe-throw', 'golpe-5S', 'golpe-6S', 'golpe-SA1', 'golpe-SA3', 'golpe-c1', 'golpe-blindado'];

export async function frameHeights(file) {
  const img = sharp(file);
  const m = await img.metadata();
  const cell = m.height;
  const n = Math.round(m.width / cell);
  const raw = await img.ensureAlpha().raw().toBuffer();
  const out = [];
  for (let k = 0; k < n; k++) {
    let top = cell;
    let bot = -1;
    for (let y = 0; y < cell; y += 2) for (let x = k * cell; x < (k + 1) * cell; x += 2) {
      if (raw[(y * m.width + x) * 4 + 3] > 127) {
        if (y < top) top = y;
        if (y > bot) bot = y;
      }
    }
    out.push((bot - top) / cell);
  }
  return out;
}

export async function auditPack(dir) {
  const rows = [];
  for (const name of STANDING) {
    const file = ['webp', 'png'].map((e) => `${dir}/${name}.${e}`).find(existsSync);
    if (!file) continue;
    const hs = await frameHeights(file);
    rows.push({ name, first: hs[0], max: Math.max(...hs) });
  }
  const sorted = rows.map((r) => r.max).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  for (const r of rows) r.ratio = r.max / median;
  return { median, rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const p of process.argv.slice(2)) {
    const { median, rows } = await auditPack(`production/sprites/final/${p}`);
    console.log(`\n== ${p} (mediana ${(median * 100).toFixed(1)}% da célula)`);
    for (const r of rows.sort((a, b) => b.ratio - a.ratio)) {
      const flag = r.ratio > 1.07 ? '  <<< MAIOR' : r.ratio < 0.9 ? '  <<< menor' : '';
      console.log(`${r.name.padEnd(16)} ${r.ratio.toFixed(2)}${flag}`);
    }
  }
}
