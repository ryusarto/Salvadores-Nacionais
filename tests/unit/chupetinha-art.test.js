import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import chupetinha from '../../src/data/characters/chupetinha.js';
import { STATE_ANIMS, animFor, moveArtWindow } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { chupetinhaPhoneArt, chupetinhaEntityArt, chupetinhaAttackArt, drawChupetinhaAttack } from '../../src/render/chupetinha-art.js';
import { drawLivePhone } from '../../src/render/boss-art.js';
import { createFx, fxEvents, drawEntities, fxDrawFront } from '../../src/render/fx.js';
import { registerSprites, drawSprite, spritePacksFor } from '../../src/render/sprites.js';
import { spriteOptions } from '../../src/render/sprite-profiles.js';
import { configureFighterMaterial } from '../../src/render/fighter-material.js';
import { spawnEntity } from '../../src/core/entities.js';
import { fight } from './helpers.js';

const frame = f => Math.floor(spriteProgress(f, animFor(f, 0)) * 6);
const base = new URL('../../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('production/sprites/source/chupetinha-v3/runtime-manifest.json', base)));

test('Chupetinha has 41 complete six-frame strips and 11 separate alpha FX, without aliases', async () => {
  const required = [...Object.keys(STATE_ANIMS), ...Object.keys(chupetinha.moves).map(k => 'golpe-' + k), ...chupetinha.spriteTurboMoves.map(k => 'golpe-' + k + '-turbo')].sort();
  const files = readdirSync(new URL('production/sprites/final/chupetinha', base)).map(f => f.replace('.webp', '')).sort();
  assert.deepEqual(files, required); assert.equal(files.length, 41); assert.equal(chupetinha.spriteAlias, undefined);
  assert.deepEqual(readdirSync(new URL('production/sprites/final/chupetinha-fx', base)).map(f=>f.replace('.webp','')).sort(), manifest.effects.map(a=>a.name).sort());
  assert.ok([...manifest.sequences,...manifest.effects].every(a=>a.frames.length===6));
  assert.equal(manifest.bodyFrames, 246); assert.equal(manifest.effectAnimations, 11); assert.equal(manifest.effectFrames, 66);
  assert.deepEqual(spritePacksFor(chupetinha), ['chupetinha', 'chupetinha-fx', 'fx-chupetinha']);
  for (const pack of ['chupetinha', 'chupetinha-fx']) assert.equal(spriteOptions(pack, [chupetinha]).trueAlpha, true);
  for (const a of [...manifest.sequences, ...manifest.effects]) {
    const bytes = readFileSync(new URL(a.file, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), a.sha256, a.name);
    const meta = await sharp(bytes).metadata(); assert.equal(meta.width, a.frames.length * 500); assert.equal(meta.height, 500); assert.ok(meta.hasAlpha);
    const raw = await sharp(bytes).ensureAlpha().raw().toBuffer();
    for (const f of a.frames) {
      const pixels = Buffer.alloc(500 * 500 * 4);
      for (let y = 0; y < 500; y++) raw.copy(pixels, y * 500 * 4, (y * meta.width + f.index * 500) * 4, (y * meta.width + (f.index + 1) * 500) * 4);
      // RGB under fully transparent pixels is discarded by lossless WebP.
      const source = await sharp(readFileSync(new URL('production/sprites/source/chupetinha-v3/' + a.source, base)))
        .extract({ left: f.index * 500, top: 0, width: 500, height: 500 }).ensureAlpha().raw().toBuffer();
      for (let i = 0; i < pixels.length; i += 4) {
        if (!pixels[i + 3]) pixels.fill(0, i, i + 3);
        if (!source[i + 3]) source.fill(0, i, i + 3);
      }
      assert.ok(pixels.equals(source), a.name + ' lossless RGBA');
      assert.equal(f.edgePixels, 0); assert.ok(f.visiblePixels > 20);
    }
    assert.equal(new Set(a.frames.map(f => f.sha256)).size, a.frames.length);
  }
});

test('Chupetinha timing follows every real normal/turbo hit, release and recovery', () => {
  const f = fight('chupetinha', 'franco').f[0]; f.state = 'attack';
  for (const [key, m] of Object.entries(chupetinha.moves)) for (const variant of [m, m.turbo].filter(Boolean)) {
    f.moveKey = key; f.move = variant; f.sf = 0; assert.equal(frame(f), 0, key);
    const [first] = moveArtWindow(variant);
    for (let sf = 0; sf < first; sf++) { f.sf = sf; assert.ok(frame(f) < 2, key + ' anticipation'); }
    for (const h of variant.hits) for (let sf = h.from; sf <= h.to; sf++) {
      f.sf = sf; assert.ok([2, 3].includes(frame(f)), key + ' contact');
    }
    for (const [i, s] of variant.spawn.entries()) {
      f.sf = s.at; assert.equal(frame(f), key === '5S' && variant.spawn.length === 2 ? [1, 3][i] : 2 + i % 2, key + ' shot');
    }
    f.sf = variant.total - 1; assert.equal(frame(f), 5, key + ' recovery');
  }
  for (const state of ['crouch', 'guard', 'knockdown', 'ko', 'win']) {
    f.state = state; f.sf = 1000; f.y = 0; assert.equal(frame(f), 5, state + ' held');
  }
});

test('phone art follows activation, each signal loss, flash shutdown, both facings and resource reset', () => {
  const f = fight('chupetinha', 'franco').f[0]; f.x = 1000;
  let a = chupetinhaPhoneArt(f, 0); assert.equal(a.name, 'celular-sem-sinal');
  f.res.live = true; f.res.signal = 3;
  a = chupetinhaPhoneArt(f, 1, a); assert.equal(a.name, 'celular-ativacao');
  a = chupetinhaPhoneArt(f, 17, a); assert.equal(a.name, 'celular-live');
  for (const signal of [2, 1]) {
    f.res.signal = signal; a = chupetinhaPhoneArt(f, 20, a); assert.equal(a.name, 'celular-dano');
    a = chupetinhaPhoneArt(f, 36, a); assert.equal(a.name, 'celular-live-' + signal);
  }
  f.res.live = false; f.res.signal = 0;
  a = chupetinhaPhoneArt(f, 40, a); assert.equal(a.name, 'celular-dano');
  a = chupetinhaPhoneArt(f, 56, a); assert.equal(a.name, 'celular-sem-sinal');
  const right = a.box.x; f.face = -1; a = chupetinhaPhoneArt(f, 57, a); assert.equal(a.box.x - f.x, -(right - f.x));
  chupetinha.mech.init(f); a = chupetinhaPhoneArt(f, 0, a); assert.equal(a.transition, null);
  f.state = 'ko'; assert.equal(chupetinhaPhoneArt(f, 1, a), null);
});

test('every existing chupeta projectile and active flail/Birra/Sugada window has art without simulation changes', () => {
  const st = fight('chupetinha', 'franco'), f = st.f[0]; f.state = 'attack';
  for (const [key, m] of Object.entries(chupetinha.moves)) for (const variant of [m, m.turbo].filter(Boolean)) {
    f.moveKey = key; f.move = variant;
    for (const s of variant.spawn) {
      const e = spawnEntity(st, f, s), before = JSON.stringify(e), a = chupetinhaEntityArt(e, f.ch.id);
      assert.equal(a.name, 'projetil-chupeta'); assert.equal(a.box.x, e.x); assert.equal(JSON.stringify(e), before);
      assert.equal(chupetinhaEntityArt(e, 'zanata'), null);
    }
    for (let sf = 0; sf < variant.total; sf++) {
      f.sf = sf; const active = variant.hits.some(h => sf >= h.from && sf <= h.to);
      const wanted = active && (variant.weapon === 'whip' || key === '4S');
      const a = chupetinhaAttackArt(f); assert.equal(Boolean(a), wanted, key + '/' + sf);
      if (a) assert.equal(a.name, key === '6S' ? 'sugada' : 'arco-mangual');
    }
  }
});

test('runtime actually draws body, projectile, impact and engagement strips from registered packs', async () => {
  const originalImage = globalThis.Image;
  const calls = [];
  const c = new Proxy({ drawImage: (...args) => calls.push(args) }, { get: (o, k) => o[k] ?? (() => {}) });
  globalThis.Image = class { set src(url) { this.url = url; this.naturalWidth = 3000; this.naturalHeight = 500; this.width = this.naturalWidth; this.height = 500; queueMicrotask(() => this.onload()); } };
  configureFighterMaterial(false);
  try {
    await registerSprites('chupetinha', Object.fromEntries(manifest.sequences.map(a => [a.name, 'body:' + a.name])), { trueAlpha: true });
    await registerSprites('chupetinha-fx', Object.fromEntries(manifest.effects.map(a => [a.name, 'fx:' + a.name])), { trueAlpha: true });
    const st = fight('chupetinha', 'franco'), f = st.f[0]; f.state = 'attack'; f.moveKey = '6S'; f.move = chupetinha.moves['6S']; f.sf = f.move.hits[0].from;
    assert.equal(drawSprite(c, f, 0), true); assert.equal(calls.at(-1)[0].url, 'body:golpe-6S');
    assert.equal(calls.at(-1)[1], 1000); // native contact pose 3, not pose 4
    st.ents = [spawnEntity(st, f, chupetinha.moves['5S'].spawn[0])]; drawEntities(c, st);
    assert.ok(calls.some(args => args[0].url === 'fx:projetil-chupeta'));
    const fx = createFx(); st.events = [{ t: 'hit', side: 0, key: '6S', x: 1100, y: 280, power: 'S' }, { t: 'pop', str: '+ENGAJAMENTO', x: f.x }];
    fxEvents(fx, st); assert.ok(fx.parts.some(p => p.k === 'chupetinha' && p.name === 'impacto-chupeta'));
    assert.ok(fx.parts.some(p => p.k === 'chupetinha' && p.name === 'engajamento'));
    fxDrawFront(c, fx, st);
    assert.ok(calls.some(args => args[0].url === 'fx:impacto-chupeta')); assert.ok(calls.some(args => args[0].url === 'fx:engajamento'));
  } finally { globalThis.Image = originalImage; configureFighterMaterial(true); }
});


test('the live-phone renderer draws all six actual device states and both attack FX', async () => {
  const originalImage = globalThis.Image, calls = [];
  const c = new Proxy({drawImage: (...args) => calls.push(args)}, {get: (o,k) => o[k] ?? (()=>{})});
  globalThis.Image = class {set src(url){this.url=url;this.naturalWidth=3000;this.naturalHeight=500;queueMicrotask(()=>this.onload());}};
  try {
    await registerSprites('chupetinha-fx', Object.fromEntries(manifest.effects.map(a=>[a.name,a.name])), {trueAlpha:true});
    const f=fight('chupetinha','franco').f[0];
    const drawn=()=>calls.at(-1)[0].url;
    drawLivePhone(c,f,0); assert.equal(drawn(),'celular-sem-sinal');
    f.res.live=true; f.res.signal=3; drawLivePhone(c,f,1); assert.equal(drawn(),'celular-ativacao');
    drawLivePhone(c,f,17); assert.equal(drawn(),'celular-live');
    for(const [signal,at] of [[2,20],[1,40]]) {
      f.res.signal=signal; drawLivePhone(c,f,at); assert.equal(drawn(),'celular-dano');
      drawLivePhone(c,f,at+16); assert.equal(drawn(),'celular-live-'+signal);
    }
    f.res.live=false; f.res.signal=0; drawLivePhone(c,f,60); assert.equal(drawn(),'celular-dano');
    drawLivePhone(c,f,76); assert.equal(drawn(),'celular-sem-sinal');
    for(const key of ['5M','2S','4S','SA3','6S']) {
      f.state='attack';f.moveKey=key;f.move=chupetinha.moves[key];f.sf=f.move.hits[0].from;
      assert.ok(drawChupetinhaAttack(c,f));assert.equal(drawn(),key==='6S'?'sugada':'arco-mangual');
    }
    f.state='ko';const count=calls.length;drawLivePhone(c,f,77);assert.equal(calls.length,count);
  } finally {globalThis.Image=originalImage;}
});

test('wide strips preserve physical scale while crouching and prone poses remain compact', () => {
  const source=JSON.parse(readFileSync(new URL('production/sprites/source/chupetinha-v3/manifest.json',base)));
  const idle=source.animations.find(a=>a.action==='parado').frameMeta[0].body.h;
  for(const a of source.animations) {
    const compensation=chupetinha.spriteStripScale.chupetinha[a.action]||1;
    assert.ok(Math.abs(compensation*a.fitScale-1)<1e-8,a.action);
    assert.ok(a.frameMeta.every(f=>f.sourceScale<=1&&f.masterScale<=1),a.action);
  }
  const last=name=>source.animations.find(a=>a.action===name).frameMeta.at(-1).body.h;
  assert.ok(last('agachar')<idle*.85);assert.ok(last('caido')<idle*.7);
});
