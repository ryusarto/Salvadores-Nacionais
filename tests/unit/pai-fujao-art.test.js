import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import pai, {PAI} from '../../src/data/characters/pai-fujao.js';
import {STATE_ANIMS,animFor} from '../../src/render/anim.js';
import {spriteProgress} from '../../src/render/sprite-timing.js';
import {paiAnimation} from '../../src/render/pai-fujao-timing.js';
import {paiEntityArt,paiStatusArt,paiEventArt,paiZoneIndex,drawPaiStatus,drawPaiZone} from '../../src/render/pai-fujao-art.js';
import {registerSprites,drawSprite,spritePacksFor} from '../../src/render/sprites.js';
import {spriteOptions} from '../../src/render/sprite-profiles.js';
import {configureFighterMaterial} from '../../src/render/fighter-material.js';
import {drawEntities,fxDrawFront,createFx,fxEvents} from '../../src/render/fx.js';
import {drawAnkleZone} from '../../src/render/boss-art.js';
import {spawnEntity} from '../../src/core/entities.js';
import {fight} from './helpers.js';
const frame=f=>Math.floor(spriteProgress(f,animFor(f,0))*6);
const base=new URL('../../',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('production/sprites/source/pai-fujao-v1/runtime-manifest.json',base)));
test('Pai has 40 complete six-frame strips and 20 separate alpha FX, without aliases', async () => {
  const required = [...Object.keys(STATE_ANIMS), 'reacao-tornozeleira', 'furia-paterna', ...Object.keys(pai.moves).map(k => 'golpe-' + k), ...pai.spriteTurboMoves.map(k => 'golpe-' + k + '-turbo')].sort();
  const files = readdirSync(new URL('production/sprites/final/pai-fujao', base)).map(f => f.replace('.webp', '')).sort();
  assert.deepEqual(files, required); assert.equal(files.length, 40); assert.equal(pai.spriteAlias, undefined);
  assert.deepEqual(readdirSync(new URL('production/sprites/final/pai-fujao-fx', base)).map(f=>f.replace('.webp','')).sort(), manifest.effects.map(a=>a.name).sort());
  assert.ok([...manifest.sequences,...manifest.effects].every(a=>a.frames.length===6));
  assert.equal(manifest.bodyFrames, 240); assert.equal(manifest.effectAnimations, 20); assert.equal(manifest.effectFrames, 120);
  assert.deepEqual(spritePacksFor(pai), ['pai-fujao', 'pai-fujao-fx', 'fx-pai-fujao']);
  for (const pack of ['pai-fujao', 'pai-fujao-fx']) assert.equal(spriteOptions(pack, [pai]).trueAlpha, true);
  for (const a of [...manifest.sequences, ...manifest.effects]) {
    const bytes = readFileSync(new URL(a.file, base));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), a.sha256, a.name);
    const meta = await sharp(bytes).metadata(); assert.equal(meta.width, a.frames.length * 500); assert.equal(meta.height, 500); assert.ok(meta.hasAlpha);
    const raw = await sharp(bytes).ensureAlpha().raw().toBuffer();
    for (const f of a.frames) {
      const pixels = Buffer.alloc(500 * 500 * 4);
      for (let y = 0; y < 500; y++) raw.copy(pixels, y * 500 * 4, (y * meta.width + f.index * 500) * 4, (y * meta.width + (f.index + 1) * 500) * 4);
      // RGB under fully transparent pixels is discarded by lossless WebP.
      const source = await sharp(readFileSync(new URL('production/sprites/source/pai-fujao-v1/' + a.source, base)))
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


test('Pai normal/turbo contacts, all releases, SA3 three phases and held states follow native poses',()=>{
 const f=fight('pai-fujao','franco').f[0];f.state='attack';
 for(const [key,m] of Object.entries(pai.moves))for(const variant of [m,m.turbo].filter(Boolean)){
  f.moveKey=key;f.move=variant;f.sf=0;assert.equal(frame(f),0,key);
  const first=variant.hits[0]?.from??variant.spawn[0]?.at??variant.startup+1;
  for(let sf=0;sf<first;sf++){f.sf=sf;assert.ok(frame(f)<2,key+' anticipation');}
  for(const [i,h] of variant.hits.entries())for(let sf=h.from;sf<=h.to;sf++){
   f.sf=sf;assert.ok((key==='SA3'?[2+i]:[2,3]).includes(frame(f)),key+' active '+sf);
  }
  for(const [i,s] of variant.spawn.entries()){f.sf=s.at;assert.equal(frame(f),2+i%2,key+' release');}
  f.sf=variant.total-1;assert.equal(frame(f),5,key+' recovery');
 }
 for(const state of ['crouch','guard','knockdown','ko','win']){f.state=state;f.sf=1000;f.y=0;assert.equal(frame(f),5,state);}
});

test('ankle alert colors reflect live position on both sides instead of cycling through conditions',()=>{
 const f=fight('pai-fujao','franco').f[0];
 for(const sign of [-1,1])for(const [d,band] of [[0,0],[PAI.zoneR-80,2],[PAI.zoneR+1,4]]){
  f.x=PAI.zoneX+sign*d;
  for(let n=0;n<48;n++){assert.ok([band,band+1].includes(paiZoneIndex(f,n)));
   assert.equal(paiStatusArt(f,n).find(a=>a.name==='tornozeleira-monitor').index,paiZoneIndex(f,n));}
 }
});

test('shock and fury use visual-only reactions, queue fury safely and reset with a new resource',()=>{
 const f=fight('pai-fujao','franco').f[0],base={name:'parado',p:.2};
 f.state='attack';f.res.fury=true;const snapshot=JSON.stringify(f.res);
 assert.equal(paiAnimation(f,0,base),base);assert.equal(JSON.stringify(f.res),snapshot);
 f.state='idle';assert.equal(paiAnimation(f,1,base).name,'furia-paterna');
 assert.equal(paiAnimation(f,37,base),base);
 f.state='dizzy';f.res.shockT=PAI.shockCD;let a=paiAnimation(f,40,base);
 assert.equal(a.name,'reacao-tornozeleira');assert.equal(spriteProgress(f,a),0);
 f.res.shockT=PAI.shockCD-35;a=paiAnimation(f,75,base);assert.equal(Math.floor(a.p*6),5);
 f.res.shockT=PAI.shockCD-36;assert.equal(paiAnimation(f,76,base),base);
 pai.mech.init(f);f.state='idle';assert.equal(paiAnimation(f,0,base),base);
});

test('helper reaches contact pose before actual removal; cash/entity selectors preserve simulation',()=>{
 const st=fight('pai-fujao','franco'),f=st.f[0];f.res.callT=0;
 const e=spawnEntity(st,f,pai.moves['5S'].spawn[0]);
 for(const dist of [160,144]){const target={x:e.x+dist},before=JSON.stringify(e);const a=paiEntityArt(e,f.ch.id,target);assert.equal(a.name,'capanga-ataque');assert.equal(a.index,2);assert.equal(JSON.stringify(e),before);}
 assert.equal(paiEntityArt(e,'franco',{x:e.x+144}),null);
 assert.equal(paiEntityArt({...e,kind:'dinheiro'},f.ch.id).name,'dinheiro-girar');
});

test('Pai all five persistent FX stay decoded; real renderer draws body, summon, cash, alert and impact',async()=>{
 const old=globalThis.Image,calls=[],loads=[];let rects=0;
 const c=new Proxy({drawImage:(...a)=>calls.push(a),fillRect:()=>rects++,measureText:()=>({width:10})},{get:(o,k)=>o[k]??(()=>{})});
 globalThis.Image=class{set src(url){this.url=url;this.naturalWidth=3000;this.naturalHeight=500;this.width=3000;this.height=500;loads.push(url);queueMicrotask(()=>this.onload());}};
 configureFighterMaterial(false);
 try{
  await registerSprites('pai-fujao',Object.fromEntries(manifest.sequences.map(a=>[a.name,'body:'+a.name])),{trueAlpha:true});
  await registerSprites('pai-fujao-fx',Object.fromEntries(manifest.effects.map(a=>[a.name,'fx:'+a.name])),{...spriteOptions('pai-fujao-fx',[pai]),material:false});
  const st=fight('pai-fujao','franco'),f=st.f[0];f.x=PAI.zoneX;f.res.fury=true;
  for(let i=0;i<8;i++){drawPaiZone(c,f,PAI.zoneX,PAI.zoneR,i);drawPaiStatus(c,f,i);await new Promise(r=>setImmediate(r));}
  const n=loads.length;
  for(let i=8;i<16;i++){const before=calls.length;drawPaiZone(c,f,PAI.zoneX,PAI.zoneR,i);drawPaiStatus(c,f,i);assert.equal(calls.length-before,5);await new Promise(r=>setImmediate(r));}
  assert.equal(loads.length,n,'no persistent cache thrashing');
  drawAnkleZone(c,f,PAI.zoneX,PAI.zoneR,0);assert.equal(rects,0,'no second tracker proxy');
  f.res.fury=false;f.state='attack';f.moveKey='6S';f.move=pai.moves['6S'];f.sf=f.move.hits[0].from;
  assert.ok(drawSprite(c,f,0));assert.equal(calls.at(-1)[0].url,'body:golpe-6S');assert.equal(calls.at(-1)[1],1000);
  f.res.callT=0;st.ents=[spawnEntity(st,f,pai.moves['5S'].spawn[0]),spawnEntity(st,f,pai.moves.SA1.spawn[0])];
  drawEntities(c,st);await new Promise(r=>setImmediate(r));drawEntities(c,st);
  assert.ok(calls.some(a=>a[0].url.includes('capanga-')));assert.ok(calls.some(a=>a[0].url==='fx:dinheiro-girar'));
  const fx=createFx();st.events=[{t:'shock',side:0,x:f.x},{t:'hit',side:0,key:'SA1',x:1300,y:280,power:'S'}];fxEvents(fx,st);
  for(let i=0;i<3;i++){fxDrawFront(c,fx,st);await new Promise(r=>setImmediate(r));}
  for(const n of ['tornozeleira-choque','dinheiro-impacto','dinheiro-cura'])assert.ok(calls.some(a=>a[0].url==='fx:'+n),n);
  const effects=paiEventArt({t:'trap',side:1},st);assert.equal(effects[0].bind,1);
 }finally{globalThis.Image=old;configureFighterMaterial(true);}
});
