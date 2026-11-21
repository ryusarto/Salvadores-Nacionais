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

// Contract checks use the committed assets, including the independently drawn sources.
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {STATE_ANIMS} from '../../src/render/anim.js';
import {registerSprites,spriteSetId} from '../../src/render/sprites.js';
import {spriteOptions} from '../../src/render/sprite-profiles.js';
import {drawFujaoLayer} from '../../src/render/fujao-art.js';

test('Fujão delivers every state, move, turbo and context pose with original sources',async()=>{
 const root=new URL('../../',import.meta.url),m=JSON.parse(readFileSync(new URL('production/sprites/source/fujao-v1/runtime-manifest.json',root)));
 const required=[...Object.keys(STATE_ANIMS),...Object.keys(fujao.moves).map(k=>'golpe-'+k),...fujao.spriteTurboMoves.map(k=>'golpe-'+k+'-turbo'),'embarcar','encurralado'].sort();
 assert.equal(required.length,42);assert.equal(m.animations.length,99);assert.equal(m.sources.length,199);assert.equal(m.totalDrawings,594);
 for(const id of ['fujao','fujao-esquerda'])assert.deepEqual(readdirSync(new URL('production/sprites/final/'+id,root)).sort(),required.map(k=>k+'.webp').sort());
 assert.equal(readdirSync(new URL('production/sprites/final/fujao-fx',root)).length,15);
 const hash=b=>createHash('sha256').update(b).digest('hex'),hashes=new Set();
 for(const a of m.animations){const bytes=readFileSync(new URL(a.file,root)),meta=await sharp(bytes).metadata();assert.equal(hash(bytes),a.sha256,a.file);assert.equal(meta.width,3000);assert.equal(meta.height,500);assert.ok(meta.hasAlpha);assert.equal(a.sourceSheets.length,2);const frames=[];for(let i=0;i<6;i++)frames.push(hash(await sharp(bytes).extract({left:i*500,top:0,width:500,height:500}).ensureAlpha().raw().toBuffer()));assert.deepEqual(frames,a.frameHashes,a.file);assert.equal(new Set(frames).size,6,a.file);hashes.add(a.sha256)}
 assert.equal(hashes.size,99,'distinct atlases across both facings and effects');
 for(const s of m.sources)assert.equal(hash(readFileSync(new URL(s.file,root))),s.sha256,s.file);
 assert.equal(spriteSetId({ch:fujao,face:1}),'fujao');assert.equal(spriteSetId({ch:fujao,face:-1}),'fujao-esquerda');
 for(const id of ['fujao','fujao-esquerda','fujao-fx']){const o=spriteOptions(id,[fujao]);assert.equal(o.frames,6);assert.equal(o.cellSize,500);assert.equal(o.trueAlpha,true)}
});
test('Fujão FX crops include the whole cart in 500px runtime cells',async(t)=>{
 const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous});
 globalThis.Image=class{naturalWidth=3000;naturalHeight=500;set src(url){queueMicrotask(()=>this.onload())}};
 await registerSprites('fujao-fx',{'carrinho-bagagem':'cart'},{trueAlpha:true,frames:6,cellSize:500,material:false});
 let draw;const c={save(){},restore(){},translate(){},scale(){},drawImage(...a){draw=a}};
 assert.ok(drawFujaoLayer(c,'carrinho-bagagem',4,{x:0,y:0,w:270,h:300,anchor:'bottom'}));
 const expected=[2046,40,408,420];for(let i=0;i<4;i++)assert.ok(Math.abs(draw[i+1]-expected[i])<1e-6,'source crop '+i);
});
