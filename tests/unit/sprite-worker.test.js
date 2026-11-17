import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { build } from 'esbuild';
import { keyOutPixels, recolorPixels } from '../../src/render/sprite-pixels.js';
import { spriteWorkerSource, spriteWorkerAvailable } from '../../src/render/sprite-worker.js';
import { recolorAlt } from '../../src/render/sprites.js';
import { ALTERNATE_PALETTES } from '../../src/data/alternate-palettes.js';

// Versão anterior do recolor, copiada como referência: o worker não pode mudar a arte.
function legacyRecolor(px, palette) {
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const r = px[i] / 255, g = px[i + 1] / 255, b = px[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    if (l < 0.12) continue;
    let h = 0, s = 0;
    if (d > 0) { s = d / (1 - Math.abs(2 * l - 1)); h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    if (s >= 0.15 && h >= 5 && h <= 50 && l >= 0.2 && l <= 0.88) continue;
    let nh, ns;
    if (s < 0.15) { nh = palette.neutralHue; ns = palette.saturation; } else { nh = (h + palette.rotation) % 360; ns = s; }
    const c = (1 - Math.abs(2 * l - 1)) * ns, x = c * (1 - Math.abs((nh / 60) % 2 - 1)), m = l - c / 2;
    const [r1, g1, b1] = nh < 60 ? [c, x, 0] : nh < 120 ? [x, c, 0] : nh < 180 ? [0, c, x] : nh < 240 ? [0, x, c] : nh < 300 ? [x, 0, c] : [c, 0, x];
    px[i] = Math.round((r1 + m) * 255); px[i + 1] = Math.round((g1 + m) * 255); px[i + 2] = Math.round((b1 + m) * 255);
  }
  return px;
}

function randomPixels(n, seed = 7) {
  const px = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < px.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; px[i] = seed % 256; }
  for (let i = 3; i < px.length; i += 16) px[i] = 0;
  return px;
}

test('mirror palette pixels are identical to the previous main-thread recolor', () => {
  for (const palette of [...Object.values(ALTERNATE_PALETTES), { rotation: 150, neutralHue: 205, saturation: .42 }]) {
    const a = randomPixels(4096), b = a.slice();
    assert.deepEqual(recolorPixels(a, palette), legacyRecolor(b, palette));
  }
  const a = randomPixels(512), b = a.slice();
  assert.deepEqual(recolorAlt(a, 'ryuchi-esquerda'), legacyRecolor(b, ALTERNATE_PALETTES.ryuchi));
});

test('background key-out clears the flat corner color only from the edges and cell seams', () => {
  const W = 8, H = 4, p = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) { p.set([10, 200, 10, 255], i * 4); }
  p.set([200, 10, 10, 255], (1 * W + 1) * 4); // figura dentro da primeira célula
  p.set([10, 200, 10, 255], (2 * W + 2) * 4);
  assert.equal(keyOutPixels(p, W, H), true);
  assert.equal(p[(1 * W + 1) * 4 + 3], 255, 'pixel da figura fica');
  assert.equal(p[(2 * W + 2) * 4 + 3], 0, 'fundo ligado à borda sai');
  const clear = new Uint8ClampedArray(W * H * 4);
  assert.equal(keyOutPixels(clear, W, H), false, 'tira já transparente não é tocada');
});

test('the worker source runs on its own, even after minification', async () => {
  const bundle = await build({ stdin: { contents: "import {spriteWorkerSource} from './src/render/sprite-worker.js'; globalThis.out = spriteWorkerSource();", resolveDir: process.cwd() }, bundle: true, minify: true, write: false, format: 'iife', target: 'es2020' });
  const host = {};
  vm.runInNewContext(bundle.outputFiles[0].text, host);
  for (const source of [spriteWorkerSource(), host.out]) {
    const self = {};
    vm.runInNewContext(source, { self, Math, Uint8Array, Error, String, JSON });
    assert.equal(typeof self.onmessage, 'function');
  }
});

test('without worker support the reader keeps the main-thread path', () => {
  assert.equal(spriteWorkerAvailable(), false);
});
