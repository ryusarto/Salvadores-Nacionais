// Empacota o jogo inteiro em um único arquivo HTML: dist/salvadores-nacionais.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = await build({ entryPoints: ['src/main.js'], bundle: true, format: 'iife', minify: process.argv.includes('--min'), write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');
const html = readFileSync('src/index.html', 'utf8').replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/salvadores-nacionais.html', html);
console.log(`dist/salvadores-nacionais.html — ${(html.length / 1024).toFixed(0)} KB`);
