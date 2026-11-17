import test from 'node:test';
import assert from 'node:assert/strict';
import { registerSprites, drawSprite } from '../../src/render/sprites.js';
import { majisEntityArt } from '../../src/render/majis-art.js';
import ryuchi from '../../src/data/characters/ryuchi.js';

test('per-strip scale evens out strips drawn smaller than the idle pose', async (t) => {
  const previous = globalThis.Image;
  t.after(() => { globalThis.Image = previous; });
  globalThis.Image = class { naturalWidth = 3000; naturalHeight = 500; set src(url) { this.url = url; queueMicrotask(() => this.onload()); } };
  await registerSprites('ryuchi', { parado: 'parado', 'golpe-5L': 'golpe-5L' }, { trueAlpha: true, frames: 6, cellSize: 500 });
  let drawn = [];
  const c = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage(...a) { drawn.push(a); } };
  const size = () => drawn[0][7];
  const idle = { ch: ryuchi, state: 'idle', sf: 0, face: 1, vx: 0, vy: 0, y: 0 };
  drawSprite(c, idle, 0);
  const base = size();
  drawn = [];
  drawSprite(c, { ...idle, state: 'attack', moveKey: '5L', move: ryuchi.moves['5L'], sf: 2 }, 0);
  assert.equal(drawn[0][0].url, 'golpe-5L');
  assert.ok(Math.abs(size() / base - 1.12) < 1e-9);
});

test('the Majis note is drawn big enough to read, without touching its hitbox', () => {
  const e = { kind: 'note', art: 'fx-nota-sonica', x: 500, y: 270, w: 70, h: 80, age: 0, dir: 1 };
  const a = majisEntityArt(e);
  assert.ok(a.box.w >= 200 && a.box.h >= 150);
  assert.equal(e.w, 70);
});
