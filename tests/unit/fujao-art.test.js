import test from 'node:test';
import assert from 'node:assert/strict';
import fujao from '../../src/data/characters/fujao.js';
import { animFor } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { fujaoEntityArt, fujaoEventArt } from '../../src/render/fujao-art.js';
import { SYS } from '../../src/data/system.js';

const frame = (key, sf, turbo = false) => {
  const move = turbo ? fujao.moves[key].turbo : fujao.moves[key];
  return Math.floor(spriteProgress({ ch: fujao, state: 'attack', moveKey: key, move, sf }, { p: 0 }) * 6);
};
test('Fujão art releases bags exactly at normal and turbo spawns', () => {
  for (const [key, turbo] of [['5S', false], ['5S', true], ['2S', false]]) {
    const m = turbo ? fujao.moves[key].turbo : fujao.moves[key];
    const at = m.spawn[0].at;
    assert.equal(frame(key, at - 1, turbo), 2);
    assert.equal(frame(key, at, turbo), 3);
    assert.equal(frame(key, m.total - 1, turbo), 5);
  }
});
test('Fujão four super contacts and five drops follow distinct native poses', () => {
  assert.deepEqual(fujao.moves.SA1.hits.map(h => frame('SA1', h.from)), [1, 2, 3, 4]);
  assert.deepEqual(fujao.moves.SA3.spawn.map(s => frame('SA3', s.at)), [2, 2, 3, 3, 4]);
});
test('Fujão escape releases at frame two and running art cycles until braking', () => {
  assert.equal(frame('4S', 1), 0); assert.equal(frame('4S', 2), 1);
  assert.deepEqual([3, 6, 9, 12].map(t => frame('4S', t)), [2, 3, 2, 3]);
  assert.equal(frame('4S', 23), 4); assert.equal(frame('4S', 30), 5);
  for (const turbo of [false, true]) assert.deepEqual([8, 12, 16, 27].map(t => frame('6S', t, turbo)), [2, 3, 4, 5]);
});
test('Fujão boarding and corner art only override idle', () => {
  const f = { ch: fujao, state: 'idle', res: { board: 1, cornered: true } };
  assert.equal(animFor(f, 10).name, 'embarcar'); f.res.board = 0;
  assert.equal(animFor(f, 10).name, 'encurralado');
  f.state = 'walk'; f.vx = 1; f.face = 1;
  assert.equal(animFor(f, 10).name, 'andar');
});
test('Fujão suitcase visuals preserve simulation dimensions and other owners', () => {
  const e = { kind: 'mala-caindo', x: 1300, y: 0, w: 170, h: 700, delay: 5, age: 12 };
  const before = JSON.stringify(e), a = fujaoEntityArt(e, 'fujao');
  assert.ok(a.warning); assert.equal(a.name, 'mala-caindo');
  assert.ok(a.box.y < SYS.GROUND_Y); assert.equal(JSON.stringify(e), before);
  assert.equal(fujaoEntityArt(e, 'pai-fujao'), null);
  assert.equal(fujaoEntityArt({ ...e, delay: 0 }, 'fujao').box.y, SYS.GROUND_Y);
});
test('Fujão boarding result icons follow the actual simulation events', () => {
  const st = { f: [{ ch: fujao, x: 2000 }] };
  assert.equal(fujaoEventArt({ t: 'pop', str: 'EMBARQUE NEGADO!', x: 2000 }, st).name, 'embarque-negado');
  assert.equal(fujaoEventArt({ t: 'pop', str: 'QUASE EMBARCOU! +VIDA', x: 2000 }, st).name, 'embarque-cura');
});
