import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStageArt, drawStageArt, stageArtStatus } from '../../src/render/stage-packs.js';

class FakeImage {
  set src(url) { this.url = url; this.width = 1200; this.height = 400; }
  async decode() { if (this.url === 'missing') throw Error('missing'); }
}
globalThis.Image = FakeImage;
const context = () => ({
  calls: [], save() {}, restore() {},
  drawImage(...args) { this.calls.push(['image', ...args]); },
  fillRect(...args) { this.calls.push(['fill', ...args]); },
  createLinearGradient() { return { addColorStop() {} }; },
});
const airport = () => ({
  world: { width: 2600, height: 1080, groundTopY: 826 },
  essential: ['sky', 'asfalto'], layers: [{ asset: 'sky', width: 1920, height: 1080, factor: 0 }],
  ground: { asset: 'asfalto', projection: 'flat' },
  objects: [{ asset: 'terminal', x: 1000, y: 826, w: 500, h: 300, factor: .25 }],
  foreground: [{ asset: 'escada', x: 2300, y: 930, w: 300, h: 450, factor: 1 }],
  assets: Object.fromEntries(['sky', 'asfalto', 'terminal', 'escada'].map(key => [key, { url: key }])),
});

test('painted airport floor stays registered to world coordinates over the full camera range', async () => {
  await loadStageArt({ aeroporto: airport() });
  for (const cam of [0, 340, 680, 900]) {
    const c = context();
    assert.equal(drawStageArt(c, 'aeroporto', cam), true);
    const ground = c.calls.filter(([type, img]) => type === 'image' && img.url === 'asfalto');
    assert.equal(ground.length, 1, 'no tiling or perspective resampling of painted tarmac');
    assert.deepEqual(ground[0].slice(2), [0 - Math.min(cam, 680), 826, 2600, 254]);
    assert.ok(ground[0][2] <= 0 && ground[0][2] + ground[0][4] >= 1920, 'floor covers the viewport without exposed edges');
  }
});

test('airport foreground stairs remain above the floor with the same world camera', async () => {
  await loadStageArt({ airportOrder: airport() });
  const c = context(); drawStageArt(c, 'airportOrder', 680);
  const images = c.calls.filter(([type]) => type === 'image');
  assert.deepEqual(images.map(([, img]) => img.url), ['sky', 'terminal', 'asfalto', 'escada']);
  assert.deepEqual(images.at(-1).slice(-4), [1470, 480, 300, 450]);
});

test('an unavailable essential airport floor preserves the complete procedural fallback', async () => {
  const p = airport(); p.assets.asfalto.url = 'missing';
  await loadStageArt({ airportMissing: p });
  assert.equal(stageArtStatus('airportMissing').ready, false);
  assert.equal(drawStageArt(context(), 'airportMissing', 340), false);
});

test('existing arenas keep the tiled perspective while flat ground honors optional bounds', async () => {
  const old = airport(); delete old.ground.projection;
  await loadStageArt({ oldProjection: old });
  const c = context(); drawStageArt(c, 'oldProjection', 340);
  assert.ok(c.calls.filter(([type, img]) => type === 'image' && img.url === 'asfalto').length > 100);
  const p = airport(); p.ground = { ...p.ground, x: -50, y: 800, width: 2800, height: 280, factor: .5, shade: 'rgba(0,0,0,.1)' };
  await loadStageArt({ customFlat: p });
  const custom = context(); drawStageArt(custom, 'customFlat', 340);
  assert.deepEqual(custom.calls.find(([type, img]) => type === 'image' && img.url === 'asfalto').slice(2), [-220, 800, 2800, 280]);
  assert.deepEqual(custom.calls.find(([type]) => type === 'fill').slice(1), [0, 800, 1920, 280]);
});
