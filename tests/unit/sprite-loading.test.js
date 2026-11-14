import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSprites, decodedSpriteNames, hasSpriteStrip } from '../../src/render/sprites.js';

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
