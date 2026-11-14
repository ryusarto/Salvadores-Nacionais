import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import majis from '../../src/data/characters/majis.js';
import franco from '../../src/data/characters/franco.js';
import {animFor,moveArtWindow} from '../../src/render/anim.js';
import {majisAttackArt,majisEntityArt,majisStatusArt} from '../../src/render/majis-art.js';
import {MAJIS_ART_CROPS} from '../../src/data/majis-art.js';

test('Majis supplies 40 dedicated animations and eight distinct FX with 768px cells',()=>{
 for(const [id,n]of [['majis',40],['majis-fx',8]]){
  const dir=new URL('../../production/sprites/final/'+id+'/',import.meta.url),files=readdirSync(dir).filter(f=>f.endsWith('.webp'));
  assert.equal(files.length,n);assert.equal(new Set(files.map(f=>createHash('sha256').update(readFileSync(new URL(f,dir))).digest('hex'))).size,n);
 }
 const m=JSON.parse(readFileSync(new URL('../../production/sprites/source/majis-v2/manifest.json',import.meta.url)));
 assert.equal(m.completed,48);assert.deepEqual(m.foot,[384,700]);
 for(const s of m.sequences){const p=readFileSync(new URL('../../production/sprites/source/majis-v2/'+s.strip,import.meta.url));assert.equal(p.readUInt32BE(16),3072);assert.equal(p.readUInt32BE(20),768);assert.equal(s.uniqueFrames,4);}
 assert.deepEqual(majis.spriteAlias,{});
});

test('every Majis move, including turbo versions, shows contact at real hit/spawn time',()=>{
 for(const [key,base]of Object.entries(majis.moves))for(const move of [base,base.turbo].filter(Boolean)){
  const [first,last]=moveArtWindow(move),pose=sf=>animFor({ch:majis,state:'attack',moveKey:key,move,sf},0);
  assert.equal(pose(0).index,0,key);for(let sf=first;sf<=last;sf++)assert.equal(pose(sf).index,2,key);assert.equal(pose(move.total-1).index,3,key);
 }
});

test('sonic projectiles and traps keep their art through normal/turbo lifetime',()=>{
 for(const key of ['5S','c1','2S','SA1'])for(const m of [majis.moves[key],majis.moves[key].turbo].filter(Boolean))for(const s of m.spawn){
  assert.ok(MAJIS_ART_CROPS[s.art],key);const e={...s,age:0,x:0,y:0};
  if(e.behavior==='trap'){assert.equal(majisEntityArt(e).index,0);e.delay=0;e.age=e.artDelay+30;assert.equal(majisEntityArt(e).index,2);e.life=8;assert.equal(majisEntityArt(e).index,3);}else assert.ok(majisEntityArt(e));
 }
 assert.equal(majisEntityArt({kind:'note',age:0}),null);
});

test('quake pulses respect gaps and final hit; tremor overlay is conditional',()=>{
 const m=majis.moves.SA3,f={ch:majis,state:'attack',moveKey:'SA3',move:m,sf:16};
 assert.deepEqual(majisAttackArt(f),[]);f.sf=17;assert.equal(majisAttackArt(f).length,16);f.sf=24;assert.deepEqual(majisAttackArt(f),[]);f.sf=60;assert.equal(majisAttackArt(f)[0].index,2);
 assert.deepEqual(majisAttackArt({ch:franco,state:'attack'}),[]);assert.equal(majisStatusArt({status:{frost:0},state:'idle'},0),null);assert.equal(majisStatusArt({status:{frost:0},state:'frozen'},0).index,2);
 for(const key of ['6S','4S'])for(const move of [majis.moves[key],majis.moves[key].turbo].filter(Boolean)){const h=move.hits[0];assert.equal(majisAttackArt({ch:majis,state:'attack',moveKey:key,move,sf:h.from}).length,1);assert.equal(majisAttackArt({ch:majis,state:'attack',moveKey:key,move,sf:h.to+1}).length,0);}
});
