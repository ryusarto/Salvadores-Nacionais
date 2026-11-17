import test from 'node:test';import assert from 'node:assert/strict';
import pav from '../../src/data/characters/pavanassi.js';
import {animFor} from '../../src/render/anim.js';import {spriteProgress} from '../../src/render/sprite-timing.js';
import {spriteSetId} from '../../src/render/sprites.js';import {spriteOptions} from '../../src/render/sprite-profiles.js';
import {pavanassiEntityArt} from '../../src/render/pavanassi-art.js';import {spawnEntity} from '../../src/core/entities.js';
import {fight,run,I} from './helpers.js';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {STATE_ANIMS} from '../../src/render/anim.js';
const attack=(key,sf,turbo=false)=>({ch:pav,state:'attack',move:turbo?pav.moves[key].turbo:pav.moves[key],moveKey:key,sf,res:{},y:0,face:1});
const frame=f=>Math.floor(spriteProgress(f,animFor(f,0))*6);
test('Carimbaço: four distinct contacts never appear during preparation',()=>{
 for(let sf=0;sf<10;sf++)assert.equal(frame(attack('SA1',sf)),0);
 pav.moves.SA1.hits.forEach((h,i)=>{for(let sf=h.from;sf<=h.to;sf++)assert.equal(frame(attack('SA1',sf)),i+1)});
 assert.equal(frame(attack('SA1',pav.moves.SA1.hits.at(-1).to+1)),5);
});
test('Lei Seca: three actual contacts select their own drawings',()=>{
 pav.moves.SA3.hits.forEach((h,i)=>{for(let sf=h.from;sf<=h.to;sf++)assert.equal(frame(attack('SA3',sf)),i+2)});
 assert.equal(frame(attack('SA3',52)),5);
});
test('double fence: two spawn gestures and both recovery drawings',()=>{
 assert.equal(frame(attack('6S',12,true)),2);assert.equal(frame(attack('6S',14,true)),3);
 assert.equal(frame(attack('6S',18,true)),4);assert.equal(frame(attack('6S',34,true)),5);
 assert.equal(frame(attack('6S',16)),3,'normal fence keeps its regular contact');
});
test('A Pergunta: emotional reaction holds its last drawing, then clears',()=>{
 const st=fight('trunks','pavanassi',700),hero=st.f[0],boss=st.f[1];
 spawnEntity(st,boss,{kind:'cabine',behavior:'barrier',x:300,y:0,w:190,h:420,vx:0,life:900,hp:5,hit:null,delay:0});
 hero.x=st.ents.find(e=>e.kind==='cabine').x-200;run(st,10);run(st,2,I({G:1,T:1}));
 assert.equal(boss.res.emotionalArt,true);assert.equal(animFor(boss,0).name,'dano-emocional');
 boss.sf=48;assert.equal(frame(boss),5);boss.sf=96;assert.equal(frame(boss),5);
 boss.state='idle';run(st,1);assert.equal(boss.res.emotionalArt,false);
});
test('independent facing packs and FX use the six-frame alpha profile',()=>{
 assert.equal(spriteSetId({ch:pav,face:1}),'pavanassi');assert.equal(spriteSetId({ch:pav,face:-1}),'pavanassi-esquerda');
 for(const id of ['pavanassi','pavanassi-esquerda','pavanassi-fx']){const o=spriteOptions(id,[pav]);assert.equal(o.frames,6);assert.equal(o.cellSize,500);assert.equal(o.trueAlpha,true)}
});
test('barrier art follows real HP without changing the entity',()=>{
 for(const [kind,key,maxHp]of [['cerca','6S',3],['cabine','2S',5]]){
  const st=fight('trunks','pavanassi',700),f=st.f[1];f.moveKey=key;const e=spawnEntity(st,f,pav.moves[key].spawn[0]);
  assert.equal(pavanassiEntityArt(e,'trunks'),null);assert.equal(pavanassiEntityArt(e,'pavanassi').name,kind==='cerca'?'cerca-erguer':'cabine-queda');e.age=20;
  for(let hp=maxHp;hp>0;hp--){e.hp=hp;const before=JSON.stringify(e),a=pavanassiEntityArt(e,'pavanassi');assert.equal(a.name,kind+'-integridade');assert.equal(a.index,(maxHp-hp)*(kind==='cerca'?2:1));assert.equal(JSON.stringify(e),before)}
 }
});
test('Pavanassi delivers every state, move, turbo and FX with intact original sources',async()=>{
 const root=new URL('../../',import.meta.url),m=JSON.parse(readFileSync(new URL('production/sprites/source/pavanassi-v1/runtime-manifest.json',root)));
 const required=[...Object.keys(STATE_ANIMS),...Object.keys(pav.moves).map(k=>'golpe-'+k),...pav.spriteTurboMoves.map(k=>'golpe-'+k+'-turbo'),'dano-emocional'].sort();
 assert.equal(required.length,41);assert.equal(m.animations.length,98);assert.equal(m.sources.length,197);assert.equal(m.totalDrawings,588);
 for(const id of ['pavanassi','pavanassi-esquerda'])assert.deepEqual(readdirSync(new URL('production/sprites/final/'+id,root)).sort(),required.map(k=>k+'.webp').sort());
 assert.equal(readdirSync(new URL('production/sprites/final/pavanassi-fx',root)).length,16);
 const hashes=new Set();
 for(const a of m.animations){const bytes=readFileSync(new URL(a.file,root)),meta=await sharp(bytes).metadata();assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,a.file);assert.equal(meta.width,3000);assert.equal(meta.height,500);assert.ok(meta.hasAlpha);assert.equal(a.frames,6);assert.equal(new Set(a.frameHashes).size,6,a.name);assert.equal(a.sourceSheets.length,2);hashes.add(a.sha256)}
 assert.equal(hashes.size,98,'no repeated atlases across either facing or effect');
 for(const source of m.sources)assert.equal(createHash('sha256').update(readFileSync(new URL(source.file,root))).digest('hex'),source.sha256,source.file);
});
