// Mede a escala de cada tira pela largura da cabeça (independe da pose).
// Uso: node tools/audit-head-scale.mjs <pacote> [pacote...]
// Para cada quadro: acha o topo da figura e mede a largura opaca numa faixa logo
// abaixo do topo (a cabeça). A mediana dos quadros, dividida pela do parado, é a escala.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';

export async function headWidths(file) {
  const img = sharp(file);
  const m = await img.metadata();
  const cell = m.height;
  const n = Math.round(m.width / cell);
  const raw = await img.ensureAlpha().raw().toBuffer();
  const a = (x, y) => raw[(y * m.width + x) * 4 + 3] > 127;
  const out = [];
  for (let k = 0; k < n; k++) {
    let top = -1;
    for (let y = 0; y < cell && top < 0; y++) for (let x = k * cell; x < (k + 1) * cell; x++) if (a(x, y)) { top = y; break; }
    if (top < 0) continue;
    // largura média em três linhas dentro da cabeça
    const ws = [];
    for (const dy of [0.04, 0.055, 0.07]) {
      const y = Math.min(cell - 1, top + Math.round(dy * cell));
      let l = -1;
      let r = -1;
      for (let x = k * cell; x < (k + 1) * cell; x++) if (a(x, y)) { if (l < 0) l = x; r = x; }
      ws.push((r - l) / cell);
    }
    out.push(ws.sort((p, q) => p - q)[1]);
  }
  return out.sort((p, q) => p - q)[Math.floor(out.length / 2)];
}

export async function headScales(dir) {
  const files = readdirSync(dir).filter((f) => /\.(webp|png)$/.test(f));
  const idle = await headWidths(`${dir}/${files.find((f) => f.startsWith('parado.'))}`);
  const res = {};
  for (const f of files) res[f.replace(/\.(webp|png)$/, '')] = (await headWidths(`${dir}/${f}`)) / idle;
  return res;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const p of process.argv.slice(2)) {
    const r = await headScales(`production/sprites/final/${p}`);
    console.log(`\n== ${p}`);
    for (const [k, v] of Object.entries(r).sort((x, y) => x[1] - y[1])) console.log(`${k.padEnd(24)} ${v.toFixed(2)}${v < 0.92 ? '  <<< menor' : v > 1.08 ? '  <<< MAIOR' : ''}`);
  }
}
