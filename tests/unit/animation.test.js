import test from 'node:test';
import assert from 'node:assert/strict';
import { animFor } from '../../src/render/anim.js';
import { SYS } from '../../src/data/system.js';
import dney from '../../src/data/characters/dney.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('walk selects forward/backward art relative to facing on either side', () => {
  for (const face of [1, -1]) {
    assert.equal(animFor({ state: 'walk', face, vx: 6 * face }, 7).name, 'andar');
    assert.equal(animFor({ state: 'walk', face, vx: -5 * face }, 7).name, 'andar-tras');
  }
});

test('backdash plays all four poses within its actual 21-frame duration', () => {
  const seen = new Set();
  for (let sf = 0; sf < SYS.BACKDASH.frames; sf++) {
    const a = animFor({ state: 'backdash', sf }, 1000);
    assert.equal(a.name, 'recuo');
    assert.ok(a.p >= 0 && a.p < 1);
    seen.add(Math.floor(a.p * 4));
  }
  assert.deepEqual([...seen], [0, 1, 2, 3]);
  assert.equal(animFor({ state: 'backdash', sf: 0 }, 800).p, 0);
});

test('backdash timing is local, restarts on a new dash, and clamps at end', () => {
  assert.deepEqual(animFor({ state: 'backdash', sf: 11 }, 12), animFor({ state: 'backdash', sf: 11 }, 900));
  assert.equal(Math.floor(animFor({ state: 'backdash', sf: 21 }, 90).p * 4), 3);
  assert.equal(animFor({ state: 'backdash', sf: 0 }, 901).p, 0);
});

test('throw escape keeps its held pose instead of using backdash timing', () => {
  assert.equal(animFor({ state: 'tech', sf: 7 }, 90).p, 0);
  assert.equal(animFor({ state: 'idle' }, 0).name, 'parado');
  assert.equal(animFor({ state: 'run' }, 0).name, 'correr');
});

test('Dney physical strikes display contact throughout their real hit windows', () => {
  for (const moveKey of dney.spritePhasedMoves) {
    const move = dney.moves[moveKey];
    const first = move.hits[0].from;
    const last = move.hits.at(-1).to;
    const pose = sf => animFor({ ch: dney, state: 'attack', move, moveKey, sf }, 0);
    assert.equal(pose(0).index, 0, moveKey);
    for (let sf = first; sf <= last; sf++) assert.equal(pose(sf).index, 2, moveKey);
    assert.equal(pose(move.total - 1).index, 3, moveKey);
  }
});

test('Dney recovery actions animate all frames; throw release uses the impact pose', () => {
  for (const [state, total] of [['tech', 20], ['techroll', SYS.TECH_ROLL.frames]]) {
    const indices = new Set(Array.from({ length: total }, (_, sf) => animFor({ ch: dney, state, sf }, 0).index));
    assert.deepEqual([...indices], [0, 1, 2, 3]);
  }
  assert.equal(animFor({ ch: dney, state: 'throwing', sf: 0 }, 0).index, 1);
  assert.equal(animFor({ ch: dney, state: 'throwEnd', sf: 0 }, 0).index, 2);
  assert.equal(animFor({ ch: dney, state: 'throwEnd', sf: 21 }, 0).index, 3);
});

test('Dney new actions have distinct image files and no obsolete aliases', () => {
  const names = ['andar-tras', 'recuo', ...dney.spritePhasedMoves.map(k => 'golpe-' + k), 'escape-agarrao', 'recuperacao-rolamento'];
  const hashes = new Set();
  for (const name of names) {
    const b = readFileSync(new URL('../../production/sprites/final/dney/' + name + '.webp', import.meta.url));
    assert.equal(b.toString('ascii', 0, 4), 'RIFF', name);
    assert.equal(b.toString('ascii', 8, 12), 'WEBP', name);
    assert.ok(!dney.spriteAlias[name], name + ' must use its own art');
    hashes.add(createHash('sha256').update(b).digest('hex'));
  }
  assert.equal(hashes.size, 15, 'no repeated placeholders');
  const airHeavy = readFileSync(new URL('../../production/sprites/final/dney/golpe-jH.webp', import.meta.url));
  const airShot = readFileSync(new URL('../../production/sprites/final/dney/golpe-jS.webp', import.meta.url));
  assert.notDeepEqual(airHeavy, airShot);
});
