import test from 'node:test';
import assert from 'node:assert/strict';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import mdep from '../../src/data/characters/mdep.js';

test('both rifle supers keep the rifle aimed throughout every actual shot', () => {
  for (const key of ['SA1', 'SA3']) {
    const move = mdep.moves[key], before = JSON.stringify(move);
    for (const shot of move.spawn) {
      const index = Math.floor(spriteProgress({ ch: mdep, state: 'attack', move, sf: shot.at }, { p: 0 }) * 10);
      assert.ok(index === 4 || index === 5, `${key} shot at ${shot.at}: frame ${index}`);
    }
    assert.equal(Math.floor(spriteProgress({ ch: mdep, state: 'attack', move, sf: move.total - 1 }, { p: 0 }) * 10), 9);
    assert.equal(JSON.stringify(move), before);
  }
});

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

test('guard and reaction art advance while combat counters stay unchanged', () => {
  const ch = { spriteProfile: 'ten-frame' };
  assert.ok(spriteProgress({ ch, state: 'guard', sf: 20 }, { p: 0 }) >= 0.4);
  const hurt = { ch, state: 'hitstun', sf: 19, stun: 1 };
  const before = JSON.stringify(hurt);
  assert.equal(Math.floor(spriteProgress(hurt, { p: 0 }) * 10), 9);
  assert.equal(JSON.stringify(hurt), before);
  assert.equal(Math.floor(spriteProgress({ ch, state: 'wakeup', sf: 13 }, { p: 0 }) * 10), 9);
  assert.equal(spriteProgress({ ch, state: 'knockdown', sf: 0 }, { p: 0 }), 0);
  assert.equal(spriteProgress({ ch, state: 'knockdown', sf: 25 }, { p: 0 }), 0.999);
});

test('jump drawings follow ascent, apex and descent continuously', () => {
  const ch = { spriteProfile: 'ten-frame', jumpScale: 1 };
  const pick = vy => spriteProgress({ ch, state: 'air', vy }, { p: 0 });
  assert.equal(pick(36), 0);
  assert.equal(pick(0), 0.5);
  assert.equal(pick(-36), 0.999);
});
