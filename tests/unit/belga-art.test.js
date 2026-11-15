import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import belga from '../../src/data/characters/belga.js';
import { STATE_ANIMS, animFor, moveArtWindow } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { belgaEntityArt, belgaAttackArt } from '../../src/render/belga-art.js';
import { BELGA_ART_CROPS } from '../../src/data/belga-art.js';
import { createFx, fxEvents } from '../../src/render/fx.js';
import { spawnEntity } from '../../src/core/entities.js';
import { fight } from './helpers.js';

const frame = f => Math.floor(spriteProgress(f, animFor(f, 0)) * 6);
test('Belga has dedicated six-frame art for every state and move', async () => {
  assert.deepEqual(belga.spriteAlias, {});
  const required = [...Object.keys(STATE_ANIMS), ...Object.keys(belga.moves).map(k => 'golpe-' + k)].sort();
  const folder = new URL('../../production/sprites/final/belga/', import.meta.url);
  assert.deepEqual(readdirSync(folder).map(f => f.replace('.webp', '')).sort(), required);
  const root = new URL('../../', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('production/sprites/source/belga-v2/manifest.json', root)));
  assert.equal(manifest.sequences.length, 40); assert.equal(manifest.effects.length, 8);
  assert.equal(Object.keys(BELGA_ART_CROPS).length, 8);
  assert.equal(manifest.cell, 500); assert.equal(manifest.frames, 6); assert.equal(manifest.upscaled, false);
  const hashes = new Set();
  for (const s of [...manifest.sequences, ...manifest.effects]) {
    const bytes = readFileSync(new URL(s.file, root)), meta = await sharp(bytes).metadata();
    assert.equal(meta.width, 3000, s.name); assert.equal(meta.height, 500, s.name); assert.ok(meta.hasAlpha, s.name);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
    assert.equal(s.frames.length, 6); assert.equal(new Set(s.frames.map(f => f.sha256)).size, 6, s.name);
    assert.ok(s.scale > 0 && s.scale <= 1, s.name);
    for (const f of s.frames) { assert.equal(f.sourceEdgePixels, 0, s.name); assert.equal(f.edgePixels, 0, s.name); assert.equal(f.alphaMin, 0, s.name); }
    const sheet = await sharp(readFileSync(new URL(s.sheet, root))).metadata();
    assert.equal(sheet.width, 1500); assert.equal(sheet.height, 1000);
  }
  assert.equal(hashes.size, 48);
});

test('Belga contact and recovery art respects turbo and all five BPM levels', () => {
  const st = fight('belga', 'zanata'), f = st.f[0]; f.state = 'attack';
  for (const [key, base] of Object.entries(belga.moves)) for (const variant of [base, base.turbo].filter(Boolean)) for (let bpm = 0; bpm <= 4; bpm++) {
    f.res.bpm = bpm; f.moveKey = key; f.move = belga.mech.modifyMove(f, variant);
    f.sf = 0; assert.equal(frame(f), 0, key);
    if (key === 'c1') {
      for (const [i, h] of f.move.hits.entries()) for (let sf = h.from; sf <= h.to; sf++) { f.sf = sf; assert.equal(frame(f), [2, 4][i], key); }
      f.sf = 10; assert.equal(frame(f), 3);
    } else if (['SA1', 'SA3'].includes(key)) {
      for (const [i, shot] of f.move.spawn.entries()) { f.sf = shot.at; assert.equal(frame(f), [2, 3, 4][i % 3], key); }
    } else {
      const [first, last] = moveArtWindow(f.move);
      for (let sf = first; sf <= last; sf++) { f.sf = sf; assert.equal(frame(f), 3, key); }
    }
    f.sf = f.move.total - 1; assert.equal(frame(f), 5, key + ' BPM ' + bpm);
  }
});

test('vinyl art follows all three and seven existing projectiles and their owner', () => {
  for (const [key, count] of [['SA1', 3], ['SA3', 7]]) {
    const st = fight('belga', 'zanata'), f = st.f[0]; f.moveKey = key;
    const entities = belga.moves[key].spawn.map(s => spawnEntity(st, f, s));
    assert.equal(entities.length, count);
    for (const e of entities) {
      const before = JSON.stringify(e), art = belgaEntityArt(e, 'belga');
      assert.equal(art.name, 'vinil-girar'); assert.equal(art.box.x, e.x);
      assert.equal(JSON.stringify(e), before); assert.equal(belgaEntityArt(e, 'trunks'), null);
    }
  }
});

test('Um-Dois effects distinguish both hits, disappear between them, and Pêndulo follows invulnerability', () => {
  const f = { ch: belga, state: 'attack', moveKey: 'c1', move: belga.moves.c1, sf: 7 };
  assert.equal(belgaAttackArt(f).name, 'fx-jab'); f.sf = 10; assert.equal(belgaAttackArt(f), null);
  f.sf = 13; assert.equal(belgaAttackArt(f).name, 'fx-direto');
  f.moveKey = '2S'; f.move = belga.moves['2S']; f.sf = 2; assert.equal(belgaAttackArt(f), null);
  f.sf = 3; assert.equal(belgaAttackArt(f).name, 'fx-pendulo'); f.sf = 19; assert.equal(belgaAttackArt(f), null);
  const st = fight('belga', 'zanata'), fx = createFx(); st.f[0].res.bpm = 1;
  st.events = [{ t: 'hit', side: 0, key: 'SA1', x: 1200, y: 200 }, { t: 'hit', side: 0, key: '5L', x: 1250, y: 260 }];
  fxEvents(fx, st);
  assert.ok(fx.parts.some(p => p.id === 'belga-fx' && p.name === 'vinil-impacto'));
  assert.ok(fx.parts.some(p => p.id === 'belga-fx' && p.name === 'fx-bpm'));
});
