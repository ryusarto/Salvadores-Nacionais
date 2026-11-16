import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSprites, decodedSpriteNames, hasSpriteStrip, prepareSprites, spritePacksFor } from '../../src/render/sprites.js';

test('large transparent strips load on demand, deduplicate requests and evict safely', async t => {
  const previous = { Image: globalThis.Image, fetch: globalThis.fetch };
  t.after(() => Object.assign(globalThis, previous));
  const requests = [];
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
  globalThis.Image = class {
    naturalWidth = 7680;
    naturalHeight = 768;
    set src(url) {
      requests.push(url);
      queueMicrotask(() => url === 'missing' ? this.onerror() : this.onload());
    }
  };
  const sheets = { parado: 'idle', andar: 'walk', correr: 'run', falha: 'missing' };
  await registerSprites('loading-test', sheets, { lazy: true, trueAlpha: true, maxDecoded: 2, frames: 10 });
  assert.deepEqual(requests, ['idle']);
  assert.deepEqual(decodedSpriteNames('loading-test'), ['parado']);
  assert.equal(hasSpriteStrip('loading-test', 'andar'), false);
  assert.equal(hasSpriteStrip('loading-test', 'andar'), false);
  await Promise.resolve();
  assert.equal(hasSpriteStrip('loading-test', 'andar'), true);
  assert.equal(requests.filter(url => url === 'walk').length, 1);
  hasSpriteStrip('loading-test', 'correr');
  await Promise.resolve();
  assert.deepEqual(decodedSpriteNames('loading-test').sort(), ['correr', 'parado']);
  hasSpriteStrip('loading-test', 'andar');
  await Promise.resolve();
  assert.deepEqual(decodedSpriteNames('loading-test').sort(), ['andar', 'parado']);
  assert.equal(requests.filter(url => url === 'walk').length, 2);
  hasSpriteStrip('loading-test', 'falha');
  await Promise.resolve();
  assert.equal(hasSpriteStrip('loading-test', 'falha'), false);
  assert.equal(requests.filter(url => url === 'missing').length, 1);
  assert.equal(hasSpriteStrip('loading-test', 'unknown'), false);
});

test('characters without lazy loading still await all their strips', async t => {
  const previous = { Image: globalThis.Image, document: globalThis.document };
  t.after(() => Object.assign(globalThis, previous));
  globalThis.Image = class {
    naturalWidth = 2048;
    naturalHeight = 512;
    set src(_) { queueMicrotask(() => this.onload()); }
  };
  globalThis.document = { createElement: () => ({ getContext: () => ({
    drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(2048 * 512 * 4) }),
  }) }) };
  await registerSprites('legacy-loading-test', { parado: 'old-idle', andar: 'old-walk' });
  assert.deepEqual(decodedSpriteNames('legacy-loading-test'), ['parado', 'andar']);
});

test('nothing downloads at startup; only the packs of the two fighters are prepared', async t => {
  const previous = { Image: globalThis.Image, fetch: globalThis.fetch };
  t.after(() => Object.assign(globalThis, previous));
  const decoded = [], fetched = [];
  globalThis.fetch = async url => { fetched.push(url); return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) }; };
  globalThis.Image = class {
    naturalWidth = 3000; naturalHeight = 500;
    set src(url) { decoded.push(url); queueMicrotask(() => this.onload()); }
  };
  const opts = { lazy: true, trueAlpha: true, frames: 6, preload: [], prefetch: false };
  await registerSprites('lutador-a', { parado: 'a-parado', andar: 'a-andar', 'golpe-5L': 'a-5L', correr: 'a-correr' }, opts);
  await registerSprites('lutador-a-fx', { faisca: 'a-faisca' }, opts);
  await registerSprites('lutador-b', { parado: 'b-parado', correr: 'b-correr' }, opts);
  await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(decoded, []);
  assert.deepEqual(fetched, []);
  assert.deepEqual(spritePacksFor({ id: 'lutador-a' }), ['lutador-a', 'lutador-a-fx', 'fx-lutador-a']);
  await prepareSprites(spritePacksFor({ id: 'lutador-a' }));
  await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(decoded.sort(), ['a-5L', 'a-andar', 'a-parado']);
  assert.deepEqual(fetched.sort(), ['a-5L', 'a-andar', 'a-correr', 'a-faisca', 'a-parado']);
  assert.ok(!fetched.some(url => url.startsWith('b-')), 'the other fighter is untouched');
  await prepareSprites(spritePacksFor({ id: 'lutador-a' }));
  assert.equal(fetched.length, 5, 'a second preparation does not download again');
});
