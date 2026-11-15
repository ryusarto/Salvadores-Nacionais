import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import trunks from '../../src/data/characters/trunks.js';
import { STATE_ANIMS, animFor, moveArtWindow } from '../../src/render/anim.js';
import { trunksEntityArt, trunksAttackArt } from '../../src/render/trunks-art.js';
import { TRUNKS_ART_CROPS } from '../../src/data/trunks-art.js';
import { fight } from './helpers.js';
import { spawnEntity } from '../../src/core/entities.js';
import { createFx, fxEvents } from '../../src/render/fx.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import sharp from 'sharp';

test('Trunks has dedicated art for every state and move; old aliases cannot override it', () => {
  assert.deepEqual(trunks.spriteAlias, {});
  const required = [...Object.keys(STATE_ANIMS), ...Object.keys(trunks.moves).map(k => 'golpe-' + k)].sort();
  const folder = new URL('../../production/sprites/final/trunks/', import.meta.url);
  const names = readdirSync(folder).map(f => f.replace('.webp', '')).sort();
  assert.deepEqual(names, required);
  const hashes = names.map(n => createHash('sha256').update(readFileSync(new URL(n + '.webp', folder))).digest('hex'));
  assert.equal(new Set(hashes).size, 40);
  assert.equal(Object.keys(TRUNKS_ART_CROPS).length, 8);
});

test('all Trunks moves hold contact during the actual hit/spawn window, including turbo', () => {
  for (const [moveKey, base] of Object.entries(trunks.moves)) for (const move of [base, base.turbo].filter(Boolean)) {
    const [first, last] = moveArtWindow(move);
    const a = sf => animFor({ ch: trunks, state: 'attack', moveKey, move, sf }, 0);
    assert.equal(a(0).index, 0, moveKey);
    for (let sf = first; sf <= last; sf++) assert.equal(a(sf).index, 2, moveKey);
    assert.equal(a(move.total - 1).index, 3, moveKey);
    const frame = sf => Math.floor(spriteProgress({ ch:trunks, state:'attack', moveKey, move, sf },a(sf))*6);
    assert.equal(frame(0),0,moveKey);
    for(let sf=first;sf<=last;sf++)assert.equal(frame(sf),3,moveKey);
    assert.equal(frame(move.total-1),5,moveKey);
  }
});

test('every new Trunks image is one animation with six 500px cells and no enlargement', async () => {
  const root=new URL('../../',import.meta.url);
  const m=JSON.parse(readFileSync(new URL('production/sprites/source/trunks-v3/manifest.json',root)));
  assert.equal(m.sequences.length,40);assert.equal(m.effects.length,8);
  assert.equal(m.frames,6);assert.equal(m.cell,500);assert.equal(m.upscaled,false);
  for(const s of [...m.sequences,...m.effects]){
    const meta=await sharp(readFileSync(new URL(s.file,root))).metadata();
    assert.equal(meta.width,3000,s.name);assert.equal(meta.height,500,s.name);assert.equal(meta.hasAlpha,true,s.name);
    assert.equal(s.frames.length,6);assert.equal(new Set(s.frames.map(f=>f.sha256)).size,6,s.name);
    assert.ok(s.scale>0&&s.scale<=1,s.name);
    for(const f of s.frames){assert.equal(f.edgePixels,0,s.name);assert.equal(f.alphaMin,0,s.name);}
    assert.equal(createHash('sha256').update(readFileSync(new URL(s.png,root))).digest('hex'),s.pngSha256,s.name);
  }
});

test('bite layer appears only during the bite hitbox, on ground and in air', () => {
  for (const moveKey of ['5H', 'jH', 'c2']) {
    const move = trunks.moves[moveKey], f = { ch: trunks, state: 'attack', moveKey, move, sf: move.hits[0].from - 1 };
    assert.equal(trunksAttackArt(f), null);
    f.sf++; assert.equal(trunksAttackArt(f).name, 'fx-mordida');
    f.sf = move.hits.at(-1).to + 1; assert.equal(trunksAttackArt(f), null);
  }
});

test('the eight SA3 dogs, delayed marks and ambulance use their own art without changing behavior', () => {
  const st = fight('trunks', 'zanata', 1200), f = st.f[0];
  f.moveKey = 'SA3';
  const dogs = trunks.moves.SA3.spawn.map(s => spawnEntity(st, f, s));
  assert.equal(dogs.length, 8);
  assert.equal(trunksEntityArt(dogs[0], 'trunks').name, 'caes-correr');
  assert.equal(trunksEntityArt(dogs[3], 'trunks').name, 'caes-salto');
  assert.equal(trunksEntityArt(dogs[7], 'trunks').name, 'caes-final');
  assert.equal(trunksEntityArt(dogs[0], 'chapuh'), null);
  for (const key of ['2S', 'SA1']) {
    const e = spawnEntity(st, f, trunks.moves[key].spawn[0]);
    assert.equal(e.delay, key === '2S' ? 150 : 26);
    assert.equal(trunksEntityArt(e, 'trunks').name, key === '2S' ? 'fx-marca' : 'ambulancia-queda');
    const age = e.age; trunksEntityArt(e, 'trunks'); assert.equal(e.age, age);
  }
  const fx = createFx();
  st.events = [{ t: 'strike', kind: 'ambulance', x: 1200 }, { t: 'hit', side: 0, key: 'SA3', x: 1300, y: 100, power: 'X' }];
  fxEvents(fx, st);
  assert.ok(fx.parts.some(p => p.id === 'trunks-fx' && p.name === 'fx-explosao'));
  assert.ok(fx.parts.some(p => p.id === 'trunks-fx' && p.name === 'caes-mordida'));
});
