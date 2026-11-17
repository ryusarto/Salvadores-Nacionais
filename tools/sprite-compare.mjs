// Monta uma prancha com o primeiro quadro de várias tiras lado a lado, na mesma escala.
// Uso: node tools/sprite-compare.mjs <personagem> <saida.png> tira1 tira2 ...
import sharp from 'sharp';
const [id, out, ...names] = process.argv.slice(2);
const dir = `production/sprites/final/${id}`;
const tiles = [];
for (const n of names) {
  const img = sharp(`${dir}/${n}.webp`);
  const m = await img.metadata();
  const cell = m.height;
  const frame = Number((n.match(/@(\d)/) || [])[1] || 0);
  tiles.push(await sharp(`${dir}/${n.replace(/@\d/, '')}.webp`).extract({ left: frame * cell, top: 0, width: cell, height: cell }).resize(400, 400).png().toBuffer());
}
const W = tiles.length * 400;
await sharp({ create: { width: W, height: 420, channels: 4, background: '#e8e2d4' } })
  .composite([...tiles.map((t, i) => ({ input: t, left: i * 400, top: 0 })),
    { input: Buffer.from(`<svg width="${W}" height="420"><line x1="0" y1="${400 * 0.908}" x2="${W}" y2="${400 * 0.908}" stroke="red" stroke-width="2"/><line x1="0" y1="${400 * (0.908 - 0.796)}" x2="${W}" y2="${400 * (0.908 - 0.796)}" stroke="blue" stroke-width="2"/></svg>`), left: 0, top: 0 }])
  .png().toFile(out);
