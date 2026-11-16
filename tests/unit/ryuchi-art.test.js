import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import ryuchi from '../../src/data/characters/ryuchi.js';
import { STATE_ANIMS, animFor, moveArtWindow } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { ryuchiEntityArt, ryuchiAttackArt, drawRyuchiAttack, drawRyuchiEntity } from '../../src/render/ryuchi-art.js';
import { RYUCHI_ART_CROPS } from '../../src/data/ryuchi-art.js';
import { RYUCHI_LEFT_ART_CROPS } from '../../src/data/ryuchi-left-art.js';
import { spriteSetId } from '../../src/render/sprites.js';
import { createFx, fxEvents } from '../../src/render/fx.js';
import { spawnEntity } from '../../src/core/entities.js';
import { fight } from './helpers.js';

const frame = f => Math.floor(spriteProgress(f, animFor(f, 0)) * 6);
test('Ryuchi has 114 dedicated animations with complete six-frame native views', async () => {
 assert.deepEqual(ryuchi.spriteAlias,{});
 const required=[...Object.keys(STATE_ANIMS),...Object.keys(ryuchi.moves).map(k=>'golpe-'+k)].sort();
 const root=new URL('../../',import.meta.url),hashes=new Set();
 assert.equal(Object.keys(RYUCHI_ART_CROPS).length,8);assert.equal(Object.keys(RYUCHI_LEFT_ART_CROPS).length,8);
 for(const left of[false,true]){
  const id=left?'ryuchi-esquerda':'ryuchi',folder=new URL('production/sprites/final/'+id+'/',root);
  assert.deepEqual(readdirSync(folder).map(f=>f.replace('.webp','')).sort(),required);
  const m=JSON.parse(readFileSync(new URL('production/sprites/source/ryuchi-v3/'+(left?'esquerda/':'')+'manifest.json',root)));
  assert.equal(m.sequences.length,49);assert.equal(m.effects.length,8);assert.equal(m.cell,500);assert.equal(m.frames,6);assert.equal(m.upscaled,false);
  for(const s of[...m.sequences,...m.effects]){
   const bytes=readFileSync(new URL(s.file,root)),meta=await sharp(bytes).metadata();assert.equal(meta.width,3000,s.name);assert.equal(meta.height,500,s.name);assert.ok(meta.hasAlpha,s.name);
   hashes.add(createHash('sha256').update(bytes).digest('hex'));assert.equal(s.frames.length,6);assert.equal(new Set(s.frames.map(f=>f.sha256)).size,6,s.name);assert.ok(s.scale>0&&s.scale<=1,s.name);
   for(const f of s.frames){assert.equal(f.sourceEdgePixels,0,s.name);assert.equal(f.edgePixels,0,s.name);assert.equal(f.alphaMin,0,s.name);}
   const sheet=await sharp(readFileSync(new URL(s.sheet,root))).metadata();assert.equal(sheet.width,1500);assert.equal(sheet.height,1000);
  }
 }
 assert.equal(hashes.size,114,'left files must be independently drawn, never aliases');
});

test('all Ryuchi contacts including voice pulses follow actual base/turbo windows',()=>{
 for(const[key,m]of Object.entries(ryuchi.moves))for(const move of[m,m.turbo].filter(Boolean)){
  const f={ch:ryuchi,state:'attack',moveKey:key,move,sf:0};assert.equal(frame(f),0,key);
  if(key==='2S')continue;
  if(ryuchi.spriteHitFrames[key])for(const[i,h]of move.hits.entries())for(let sf=h.from;sf<=h.to;sf++){f.sf=sf;assert.equal(frame(f),ryuchi.spriteHitFrames[key][i],key);}
  else{const[first,last]=moveArtWindow(move);for(let sf=first;sf<=last;sf++){f.sf=sf;assert.equal(frame(f),3,key);}}
  f.sf=move.total-1;assert.equal(frame(f),5,key);
 }
});
test('held charge cycles only its three sheathed poses at actual frozen state frame',()=>{
 const f={ch:ryuchi,state:'attack',moveKey:'2S',move:ryuchi.moves['2S'],sf:8,holdT:0};
 for(let t=0;t<=150;t++){f.holdT=t;assert.ok([3,4,5].includes(frame(f)));assert.equal(ryuchiAttackArt(f).name,'fx-fio');}
 for(const[t,key]of[[0,'stRel0'],[25,'stRel1'],[50,'stRel2'],[75,'stRel3'],[150,'stRel3']])assert.equal(ryuchi.mech.remap({holdLevel:t},'stRel'),key);
});
test('sword waves use owner-specific art, parry and scream layers respect actual windows',()=>{
 const st=fight('ryuchi','zanata'),f=st.f[0];f.moveKey='5S';const e=spawnEntity(st,f,ryuchi.moves['5S'].spawn[0]);
 const before=JSON.stringify(e);assert.equal(ryuchiEntityArt(e,'ryuchi').name,'onda-cortante');assert.equal(ryuchiEntityArt(e,'belga'),null);assert.equal(JSON.stringify(e),before);
 f.state='attack';f.moveKey='stM';f.move=ryuchi.moves.stM;f.sf=3;assert.equal(ryuchiAttackArt(f).name,'fx-contra');f.sf=17;assert.equal(ryuchiAttackArt(f),null);
 for(const key of['SA1','SA3']){f.moveKey=key;f.move=ryuchi.moves[key];for(const h of f.move.hits){f.sf=h.from;assert.equal(ryuchiAttackArt(f).name,key==='SA3'?'fx-agudo-final':'fx-agudo');}f.sf=f.move.total-1;assert.equal(ryuchiAttackArt(f),null);}
});

test('native facing packs and FX replace legacy Ryuchi trails, rings and waves',()=>{
 assert.equal(spriteSetId({ch:ryuchi,face:1}),'ryuchi');assert.equal(spriteSetId({ch:ryuchi,face:-1}),'ryuchi-esquerda');assert.equal(spriteSetId({ch:{id:'belga'},face:-1}),'belga');
 const st=fight('ryuchi','zanata'),f=st.f[0],fx=createFx();f.face=-1;
 st.events=['hit','block','parry','perfect','armor','clash','grab','jump','land'].map(t=>({t,side:0,x:f.x,y:260,key:'5S'}));
 st.events.push({t:'wave',art:'ryuchi',side:0,x:f.x,y:380,r:800});fxEvents(fx,st);
 assert.equal(fx.parts.length,9);assert.ok(fx.parts.every(p=>p.k==='sprite'&&p.id==='ryuchi-fx'&&p.face===-1));
 f.state='attack';f.moveKey='5L';f.move=ryuchi.moves['5L'];f.sf=6;assert.equal(ryuchiAttackArt(f),null,'physical cuts must not draw a second sword-like trail');
 assert.equal(drawRyuchiAttack({},f),true,'lazy art must not expose legacy attack drawing');
 const e={kind:'slash',age:0,x:100,y:100,w:70,h:190,dir:-1};assert.equal(ryuchiEntityArt(e,'ryuchi').view,'left');assert.equal(drawRyuchiEntity({},e,'ryuchi'),true);
});
