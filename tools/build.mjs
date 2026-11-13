// Empacota o jogo inteiro em um único arquivo HTML.
// Uso: node tools/build.mjs [--min] [--sprites=pasta] [--out=arquivo.html]
// Os sprites em production/sprites/final/<personagem>/<tira>.png entram embutidos.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] || d;
const spritesDir = arg('sprites', 'production/sprites/final');
const outFile = arg('out', 'dist/salvadores-nacionais.html');

const sprites = {};
if (existsSync(spritesDir)) {
  for (const id of readdirSync(spritesDir)) {
    const dir = join(spritesDir, id);
    let files = [];
    try { files = readdirSync(dir).filter((f) => f.endsWith('.png') || f.endsWith('.webp')); } catch { continue; }
    if (!files.length) continue;
    sprites[id] = {};
    for (const f of files) {
      const mime = f.endsWith('.webp') ? 'image/webp' : 'image/png';
      sprites[id][f.replace(/\.(png|webp)$/, '')] = `data:${mime};base64,${readFileSync(join(dir, f)).toString('base64')}`;
    }
  }
}
// Cenários pintados: production/stages/<fase>.(jpg|webp|png)
const stages = {};
if (existsSync('production/stages')) {
  for (const f of readdirSync('production/stages')) {
    const m = f.match(/^(.+)\.(jpg|jpeg|webp|png)$/);
    if (!m) continue;
    const mime = m[2] === 'png' ? 'image/png' : m[2] === 'webp' ? 'image/webp' : 'image/jpeg';
    stages[m[1]] = `data:${mime};base64,${readFileSync(join('production/stages', f)).toString('base64')}`;
  }
}
const out = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020' });
const js = `window.__SPRITES=${JSON.stringify(sprites)};window.__STAGES=${JSON.stringify(stages)};\n${out.outputFiles[0].text}`.replace(/<\/script>/g, '<\\/script>');
const html = readFileSync('src/index.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync(outFile, html);
const n = Object.entries(sprites).map(([id, s]) => `${id}: ${Object.keys(s).length} tiras`).join(', ');
console.log(`${outFile} — ${(html.length / 1024).toFixed(0)} KB${n ? ` — sprites: ${n}` : ' — sem sprites (manequim)'}${Object.keys(stages).length ? ` — cenários: ${Object.keys(stages).join(', ')}` : ''}`);
