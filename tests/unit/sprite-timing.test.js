import test from 'node:test';
import assert from 'node:assert/strict';
import { spriteProgress } from '../../src/render/sprite-timing.js';

test('ten-frame art follows hit windows without changing combat data', () => {
  const m = { startup: 13, active: 5, total: 38, hits: [{ from: 14, to: 18 }], spawn: [] };
  const before = JSON.stringify(m);
  const frame = sf => Math.floor(spriteProgress({ ch: { spriteProfile: 'ten-frame' }, state: 'attack', move: m, sf }, { p: 0 }) * 10);
  assert.equal(frame(0), 0);
  assert.equal(frame(13), 4);
  for (let sf = 14; sf <= 18; sf++) assert.ok([5, 6].includes(frame(sf)));
  assert.equal(frame(37), 9);
  assert.equal(JSON.stringify(m), before);
});

test('unprofiled characters keep their original animation progress', () => {
  for (const p of [0, 0.25, 0.75, 0.999]) assert.equal(spriteProgress({ state: 'attack' }, { p }), p);
});

test('held crouch stays low and knockdown selects the settled pose', () => {
  const ch = { spriteProfile: 'ten-frame' };
  assert.ok(spriteProgress({ ch, state: 'crouch', sf: 100 }, { p: 0.75 }) < 0.5);
  assert.equal(spriteProgress({ ch, state: 'knockdown' }, { p: 0 }), 0.999);
});
