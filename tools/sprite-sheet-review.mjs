// Prancha de revisão: um quadro de cada tira de um pacote, na mesma escala, com a
// linha do pé (vermelha) e a altura do topo da cabeça no parado (azul).
// Uso: node tools/sprite-sheet-review.mjs <pacote> <saida.png> [quadro=0] [escala.json]
import sharp from 'sharp';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const [id, out, frameArg = '0', scaleFile] = process.argv.slice(2);
const dir = `production/sprites/final/${id}`;
const scales = scaleFile && existsSync(scaleFile) ? JSON.parse(readFileSync(scaleFile, 'utf8')) : {};
const files = readdirSync(dir).filter((f) => /\.(webp|png)$/.test(f) && !f.startsWith('fx-')).sort((a, b) => (a.startsWith('parado') ? -1 : b.startsWith('parado') ? 1 : a.localeCompare(b)));
const T = 180;
const COLS = 9;
const tiles = [];
let idleTop = null;
for (const f of files) {
  const name = f.replace(/\.(webp|png)$/, '');
  const m = await sharp(`${dir}/${f}`).metadata();
  const cell = m.height;
  const n = Math.round(m.width / cell);
  const k = Math.min(n - 1, Number(frameArg));
  const s = scales[name] || 1;
  const size = Math.round(T * s);
  let img = await sharp(`${dir}/${f}`).extract({ left: k * cell, top: 0, width: cell, height: cell }).resize(size, size).png().toBuffer();
  // escala em volta do pé (50% x, 91% y), recortada para o quadro de T x T
  const footX = 0.5 * size;
  const footY = 0.91 * size;
  const left = Math.round(T * 0.5 - footX);
  const top = Math.round(T * 0.91 - footY);
  const canvas = sharp({ create: { width: T, height: T + 22, channels: 4, background: '#e8e2d4' } });
  const crop = await sharp(img).extract({ left: Math.max(0, -left), top: Math.max(0, -top), width: Math.min(size, T - Math.max(0, left)) , height: Math.min(size, T - Math.max(0, top)) }).toBuffer();
  const label = Buffer.from(`<svg width="${T}" height="${T + 22}"><text x="4" y="${T + 16}" font-size="13" font-family="Arial">${name}${s !== 1 ? ' ×' + s : ''}</text><line x1="0" y1="${T * 0.91}" x2="${T}" y2="${T * 0.91}" stroke="red"/></svg>`);
  tiles.push(await canvas.composite([{ input: crop, left: Math.max(0, left), top: Math.max(0, top) }, { input: label, left: 0, top: 0 }]).png().toBuffer());
}
const rows = Math.ceil(tiles.length / COLS);
await sharp({ create: { width: COLS * T, height: rows * (T + 22), channels: 4, background: '#ffffff' } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % COLS) * T, top: Math.floor(i / COLS) * (T + 22) })))
  .png().toFile(out);
console.log(out, files.length, 'tiras');
