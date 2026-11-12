// Gera as tiras de guia de pose de um personagem em production/sprites/guides/<id>/
// Uso: node tools/pose-guides.mjs franco [tira ...]
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [id = 'franco', ...only] = process.argv.slice(2);
const out = await build({ entryPoints: ['src/tools/guides.js'], bundle: true, format: 'iife', write: false });
const html = join(tmpdir(), `guides-${process.pid}.html`);
writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0"><canvas id="c"></canvas><script>${out.outputFiles[0].text}</script>`);
const dir = `production/sprites/guides/${id}`;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${html}`);
const names = only.length ? only : await page.evaluate((i) => window.__guides.listGuides(i), id);
for (const name of names) {
  const n = await page.evaluate(([i, nm]) => window.__guides.renderGuide(document.getElementById('c'), i, nm), [id, name]);
  await page.locator('#c').screenshot({ path: `${dir}/${name}.png` });
  console.log(`${dir}/${name}.png — ${n} quadros`);
}
await browser.close();
