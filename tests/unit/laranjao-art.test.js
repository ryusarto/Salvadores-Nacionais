import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import lar from '../../src/data/characters/laranjao.js';
import { SYS } from '../../src/data/system.js';
import { animFor, STATE_ANIMS } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { spriteOptions } from '../../src/render/sprite-profiles.js';
import { registerSprites, drawSprite, spriteMappedBox } from '../../src/render/sprites.js';
import { configureFighterMaterial } from '../../src/render/fighter-material.js';
import { laranjaoClone, laranjaoEntityArt, laranjaoEventArt, laranjaoStatusArt, syncLaranjaoFx, queueLaranjaoEvent, laranjaoReturnIndex, drawLaranjaoStatus, drawLaranjaoHeadline, drawLaranjaoEntity, drawLaranjaoParticle, drawLaranjaoBanish, drawLaranjaoAttack, drawLaranjaoIdleFallback } from '../../src/render/laranjao-art.js';
import { LARANJAO_WALL_BOUNDS } from '../../src/data/laranjao-art.js';
import { createFx, fxEvents, fxUpdate, fxDrawFront } from '../../src/render/fx.js';
import { step } from '../../src/core/match.js';
import { applyHit } from '../../src/core/combat.js';
import { fight, I } from './helpers.js';
const root = new URL('../../', import.meta.url), source = 'production/sprites/source/laranjao-v1/';
const manifest = JSON.parse(readFileSync(new URL(source+'runtime-manifest.json',root)));
const all = [...manifest.sequences,...manifest.effects];
const frame = f => Math.floor(spriteProgress(f,animFor(f,0))*6);

test('Laranjão: 40 body strips, 24 effects and all 384 approved alpha drawings survive lossless import', async()=>{
 const expected=[...Object.keys(STATE_ANIMS),...Object.keys(lar.moves).map(k=>'golpe-'+k),...lar.spriteTurboMoves.map(k=>'golpe-'+k+'-turbo')].sort();
 assert.equal(expected.length,40);assert.deepEqual(readdirSync(new URL('production/sprites/final/laranjao',root)).map(n=>n.replace('.webp','')).sort(),expected);
 assert.equal(manifest.effectAnimations,24);assert.equal(manifest.bodyFrames+manifest.effectFrames,384);
 const renderSource=readFileSync(new URL('src/render/laranjao-art.js',root),'utf8');
 for(const a of all){
  if(manifest.effects.includes(a))assert.ok(renderSource.includes("'"+a.name+"'"),a.name+' wired');
  const out=readFileSync(new URL(a.file,root));assert.equal(createHash('sha256').update(out).digest('hex'),a.sha256);
  const opts={resolveWithObject:true};const input=await sharp(readFileSync(new URL(source+a.source,root))).ensureAlpha().raw().toBuffer(opts),output=await sharp(out).ensureAlpha().raw().toBuffer(opts);
  assert.equal(output.info.width,3000);assert.equal(output.info.height,500);assert.equal(output.info.channels,4);
  for(const im of [input,output])for(let i=0;i<im.data.length;i+=4)if(!im.data[i+3])im.data.fill(0,i,i+3);
  assert.ok(input.data.equals(output.data),a.name+' RGBA');
  assert.equal(new Set(a.frames.map(f=>f.sha256)).size,6);assert.ok(a.frames.every(f=>f.edgePixels===0&&f.visiblePixels>20));
 }
 assert.equal(spriteOptions('laranjao-fx',[lar]).maxDecoded,10);assert.equal(spriteOptions('laranjao',[lar]).cellSize,500);
});
test('all 21 normal/turbo move timelines use native preparation, release/contact and recovery poses',()=>{
 const f=fight('laranjao','franco').f[0];f.state='attack';let variants=0;
 for(const[key,normal]of Object.entries(lar.moves))for(const m of[normal,normal.turbo].filter(Boolean)){
  variants++;f.move=m;f.moveKey=key;
  const first=m.hits[0]?.from??m.spawn[0]?.at??m.startup+1;
  for(let sf=0;sf<first;sf++){f.sf=sf;assert.ok(frame(f)<2,key+' anticipation '+sf);}
  for(const h of m.hits)for(let sf=h.from;sf<=h.to;sf++){f.sf=sf;assert.ok([2,3].includes(frame(f)),key+' contact');}
  for(const s of m.spawn){f.sf=s.at;assert.ok([2,3].includes(frame(f)),key+' release');}
  f.sf=m.total-1;assert.equal(frame(f),5,key+' recovery');
 }assert.equal(variants,21);
});
test('clones share actual pose, clock, owner cache, armor and facing; simulation remains untouched',()=>{
 const st=fight('laranjao','franco'),f=st.f[0];Object.assign(f,{state:'attack',moveKey:'6S',move:lar.moves['6S'],sf:17,face:-1});f.res.armor=3;
 const before=JSON.stringify(st),clone=laranjaoClone(f,{x:1800},60);
 assert.equal(clone.frame,60+f.side*17);assert.equal(clone.fighter.spriteSource,f);assert.equal(clone.fighter.ghost,true);
 assert.equal(frame(clone.fighter),frame(f));assert.equal(clone.fighter.face,f.face);
 const real=laranjaoStatusArt(f,60),fake=laranjaoStatusArt(clone.fighter,60);
 assert.equal(real.length,4);assert.deepEqual(real.map(a=>({...a,box:{...a.box,x:a.box.x-f.x}})),fake.map(a=>({...a,box:{...a.box,x:a.box.x-clone.fighter.x}})));
 assert.equal(JSON.stringify(st),before);
});
test('all six wall HP states match exact 120×640 solid rectangle; destruction retains initial scale',()=>{
 const e={kind:'muralha',x:1600,y:0,w:120,h:640,age:20,hp:6};
 for(let hp=6;hp>0;hp--){const a=laranjaoEntityArt({...e,hp},'laranjao');assert.equal(a.index,hp===6?2:6-hp);assert.equal(a.name,hp===6?'muralha-erguida':'muralha-danos');
  const[x,y,w,h]=spriteMappedBox(a.solid,a.box),[rx,ry,rw,rh]=a.solid;
  assert.ok(Math.abs(x+rx*w/768-(e.x-60))<1e-8);assert.ok(Math.abs(y+ry*h/768-(SYS.GROUND_Y-640))<1e-8);
  assert.ok(Math.abs(rw*w/768-120)<1e-8);assert.ok(Math.abs(rh*h/768-640)<1e-8);
 }
 const st=fight('laranjao','franco'),fx=createFx();st.ents=[{...e,id:8,owner:0}];syncLaranjaoFx(fx,st);st.ents=[];syncLaranjaoFx(fx,st);assert.ok(fx.parts.some(p=>p.name==='muralha-destruir'));
 const bounds=LARANJAO_WALL_BOUNDS['muralha-destruir'];assert.ok(bounds.at(-1)[3]<bounds[0][3],'rubble contracts instead of stretching to collider height');
 st.round++;syncLaranjaoFx(fx,st);assert.equal(fx.parts.length,0,'new round clears observed destruction');
});
test('entity observer covers clone expiry/replacement and wall landing/damage without mutating state',()=>{
 const st=fight('laranjao','franco'),fx=createFx(),e={kind:'clone',id:1,owner:0,x:900,y:0,age:0};st.ents=[e];let before=JSON.stringify(st);syncLaranjaoFx(fx,st);assert.equal(JSON.stringify(st),before);assert.equal(fx.parts[0].name,'clone-surgir');st.ents=[];syncLaranjaoFx(fx,st);assert.ok(fx.parts.some(p=>p.name==='clone-romper'));
 const f=st.f[0];st.ents=[{...e,x:1400,id:2}];const a=laranjaoEventArt({t:'fakeNews',side:0},st);for(const x of[f.x,1400])assert.deepEqual(a.filter(p=>p.x===x).map(p=>p.name),['clone-surgir','fake-news-troca']);
 const wall={kind:'muralha',owner:0,id:3,x:1500,y:0,w:120,h:640,age:0,hp:6};st.ents=[wall];syncLaranjaoFx(fx,st);wall.age=10;wall.hp=5;syncLaranjaoFx(fx,st);assert.ok(fx.parts.some(p=>p.name==='muralha-impacto-chao'));assert.ok(fx.parts.some(p=>p.name==='impacto'));
 assert.equal(laranjaoEntityArt(wall,'franco'),null);
});
test('banishment return follows the actual airborne victim and bursts only after physical landing',()=>{
 const st=fight('trunks','laranjao',300),fx=createFx(),[h,l]=st.f,m=lar.moves.SA3;
 applyHit(st,l,h,m.hits[0],{type:'move',m});let unbanished=false,landed=false,airFrames=0;
 for(let n=0;n<300;n++){
  step(st,I(),I());fxEvents(fx,st);fxUpdate(fx);
  if(st.events.some(e=>e.t==='unbanish')){unbanished=true;assert.ok(h.y>0);}
  if(unbanished&&!landed){if(h.y>0){airFrames++;assert.ok(!fx.parts.some(p=>p.name==='banimento-retorno'&&p.landed));const p=fx.parts.find(p=>p.name==='banimento-retorno'&&p.bind===0);assert.ok(p);assert.ok(laranjaoReturnIndex(p)<=2);}
   else{landed=true;assert.ok(fx.parts.some(p=>p.landed&&laranjaoReturnIndex(p)>=3));}}
 }
 assert.ok(unbanished&&landed&&airFrames>10);
});
test('real sprite/FX paths draw native wall, projectile, all armor, headline, banish and impact without cache thrashing',async()=>{
 const old=globalThis.Image,loads=[],calls=[];globalThis.Image=class{set src(url){this.url=url;this.naturalWidth=this.width=3000;this.naturalHeight=this.height=500;loads.push(url);queueMicrotask(()=>this.onload());}};
 const c=new Proxy({drawImage:(...a)=>calls.push(a),measureText:()=>({width:100})},{get:(o,k)=>o[k]??(()=>{})});configureFighterMaterial(false);
 try{await registerSprites('laranjao',Object.fromEntries(manifest.sequences.map(a=>[a.name,'body:'+a.name])),{trueAlpha:true});await registerSprites('laranjao-fx',Object.fromEntries(manifest.effects.map(a=>[a.name,'fx:'+a.name])),{...spriteOptions('laranjao-fx',[lar]),material:false});
 const st=fight('laranjao','franco'),f=st.f[0];f.res.armor=3;
 const render=()=>{drawLaranjaoStatus(c,f,20,'back');drawLaranjaoStatus(c,f,20,'front');drawLaranjaoHeadline(c,f,'É TUDO FAKE',20);drawLaranjaoEntity(c,{kind:'muralha',age:20,hp:6,w:120,h:640,x:1500,y:0},'laranjao');drawLaranjaoEntity(c,{kind:'tuite',age:4,w:110,h:60,x:1500,y:330,dir:1},'laranjao');};
 for(let n=0;n<8;n++){render();await new Promise(r=>setImmediate(r));}let count=loads.length;
 for(let n=0;n<120;n++){render();await new Promise(r=>setImmediate(r));}assert.equal(loads.length,count,'persistent FX do not churn');
 f.state='attack';f.moveKey='6S';f.move=lar.moves['6S'];f.sf=17;assert.ok(drawSprite(c,f,0));assert.equal(calls.at(-1)[0].url,'body:golpe-6S');assert.equal(calls.at(-1)[1],1000);
 drawLaranjaoAttack(c,f);f.status.banished=100;drawLaranjaoBanish(c,f);const fx=createFx();st.events=[{t:'hit',side:0,key:'2S',x:1600,y:300,power:'S'},{t:'pop',side:0,str:'TARIFADO!'}];fxEvents(fx,st);
 for(let n=0;n<4;n++){drawLaranjaoAttack(c,f);drawLaranjaoBanish(c,f);fxDrawFront(c,fx,st);await new Promise(r=>setImmediate(r));}
 for(const name of['armadura-campo','armadura-carga','manchete-placa','muralha-erguida','tuitada-projetil','tarifaco-rastro','banimento-selo','tuitada-impacto','armadura-impacto'])assert.ok(calls.some(a=>a[0].url==='fx:'+name),name);
 }finally{globalThis.Image=old;configureFighterMaterial(true);}
});

test('Fake News and tariff acquisition captions/effects do not reveal the real candidate',()=>{
 const st=fight('laranjao','franco'),fx=createFx(),f=st.f[0];st.ents=[{kind:'clone',id:1,owner:0,x:900,y:0},{kind:'clone',id:2,owner:0,x:1500,y:0}];
 st.events=[{t:'pop',side:0,str:'FAKE NEWS!',x:f.x,y:640},{t:'pop',side:0,str:'TARIFA SUPREMA! +1 ARMADURA',x:f.x,y:620}];fxEvents(fx,st);
 assert.equal(fx.pops.length,0,'native candidate FX replace pops that would cover the dynamic headlines');
 assert.deepEqual(fx.parts.filter(p=>p.name==='tarifa-coleta').map(p=>p.x).sort(),[900,1200,1500].sort());
});

test('actual wall collision consumes exactly six distinct strikes and only one HP per strike',async()=>{
 const {spawnEntity,updateEntities}=await import('../../src/core/entities.js');
 const st=fight('franco','laranjao',500),[h,l]=st.f;const wall=spawnEntity(st,l,lar.moves.SA1.spawn[0]);const m=h.ch.moves['5M'];h.x=wall.x-150;h.face=1;h.state='attack';h.move=m;h.moveKey='5M';h.sf=m.hits[0].from;
 for(let hit=1;hit<=6;hit++){h.hitDone=[];updateEntities(st);assert.equal(wall.hp,6-hit);if(hit<6){updateEntities(st);assert.equal(wall.hp,6-hit,'same move does not consume another HP');}}
 assert.ok(!st.ents.includes(wall));assert.ok(st.events.some(e=>e.t==='barrierDown'&&e.kind==='muralha'));
});
test('blocking the banishment super preserves the defender instead of starting the banish timeline',()=>{
 const st=fight('franco','laranjao',250),[h,l]=st.f,m=lar.moves.SA3;h.buf.cur.G=1;
 const result=applyHit(st,l,h,m.hits[0],{type:'move',m});assert.notEqual(result,'hit');assert.equal(h.status.banished||0,0);assert.ok(!st.events.some(e=>e.t==='banish'));
});

test('jumping above the grounded banishment hitbox avoids the super',async()=>{
 const {resolveCombat}=await import('../../src/core/combat.js');const st=fight('franco','laranjao',250),[h,l]=st.f,m=lar.moves.SA3;
 Object.assign(l,{state:'attack',move:m,moveKey:'SA3',sf:17,hitDone:[]});Object.assign(h,{state:'air',y:400,vy:0});const hp=h.hp;resolveCombat(st);assert.equal(h.hp,hp);assert.ok(!h.status.banished);
});
