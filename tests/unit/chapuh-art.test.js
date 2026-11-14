import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import chapuh from '../../src/data/characters/chapuh.js';
import franco from '../../src/data/characters/franco.js';
import { animFor } from '../../src/render/anim.js';
import { chapuhAttackArt, chapuhEntityArt } from '../../src/render/chapuh-art.js';
import { CHAPUH_ART_CROPS } from '../../src/data/chapuh-art.js';
import { fight } from './helpers.js';
import { spawnEntity } from '../../src/core/entities.js';

test('Chapuh has 40 dedicated strips and 8 separate effects, without duplicate placeholders', () => {
  for (const [id,count] of [['chapuh',40],['chapuh-fx',8]]) {
    const folder=new URL('../../production/sprites/final/'+id+'/',import.meta.url);
    const files=readdirSync(folder).filter(f=>f.endsWith('.webp'));
    assert.equal(files.length,count);
    const hashes=new Set(files.map(f=>{const b=readFileSync(new URL(f,folder));assert.equal(b.toString('ascii',0,4),'RIFF');return createHash('sha256').update(b).digest('hex')}));
    assert.equal(hashes.size,count);
  }
  assert.equal(Object.keys(chapuh.spriteAlias).length,0);
});

test('every Chapuh move holds contact at the actual hit or spawn window', () => {
  for(const key of chapuh.spritePhasedMoves){
    const move=chapuh.moves[key],first=move.hits[0]?.from??(move.spawn.length?Math.min(...move.spawn.map(s=>s.at)):move.startup+1);
    const last=move.hits.at(-1)?.to??(move.spawn.length?Math.max(...move.spawn.map(s=>s.at)):move.startup+move.active);
    const pose=sf=>animFor({ch:chapuh,state:'attack',move,moveKey:key,sf},0);
    assert.equal(pose(0).index,0,key);
    for(let sf=first;sf<=last;sf++)assert.equal(pose(sf).index,2,key);
    assert.equal(pose(move.total-1).index,3,key);
  }
});

test('Chapuh guard and damage play four local phases and hold the final pose', () => {
  for(const state of ['guard','blockstun','hitstun','knockdown']){
    const phases=new Set(Array.from({length:20},(_,sf)=>animFor({ch:chapuh,state,sf,y:0,comboHits:1},999).index));
    assert.deepEqual([...phases],[0,1,2,3]);
    assert.equal(animFor({ch:chapuh,state,sf:100,y:0,comboHits:1},0).index,3);
  }
  assert.equal(animFor({ch:franco,state:'guard',sf:15,y:0},0).index,0);
  assert.equal(animFor({ch:chapuh,state:'guard',sf:5,y:0,crouchBlock:true},0).name,'defesa-agachado');
  assert.equal(animFor({ch:chapuh,state:'blockstun',sf:5,y:10},0).name,'defesa-no-ar');
});

test('paint effects follow both regular and turbo hit windows and do not affect other characters', () => {
  for(const key of ['5M','2M','5S','c2','SA1'])for(const move of [chapuh.moves[key],chapuh.moves[key].turbo].filter(Boolean)){
    const f={ch:chapuh,state:'attack',moveKey:key,move,sf:move.hits[0].from-1};
    assert.equal(chapuhAttackArt(f),null);
    f.sf++;assert.ok(CHAPUH_ART_CROPS[chapuhAttackArt(f).name]);
    f.sf=move.hits.at(-1).to+1;assert.equal(chapuhAttackArt(f),null);
  }
  assert.equal(chapuhAttackArt({ch:franco,state:'attack',moveKey:'5M'}),null);
});

test('all spawned Chapuh objects select their own helper/effect sprite, including landed paint', () => {
  for(const key of ['2S','6S','4S','SA1','SA3']){
    const st=fight('chapuh','zanata',1200),f=st.f[0];f.moveKey=key;
    for(const spec of chapuh.moves[key].spawn){
      const e=spawnEntity(st,f,spec);assert.ok(e,key);
      assert.ok(chapuhEntityArt(e),key);
      if(e.landSpawn)assert.equal(e.landSpawn.art,'fx-poca-tinta');
    }
  }
  assert.equal(chapuhEntityArt({kind:'dog',age:5}),null,'Trunks retains its own rendering');
  const e={art:'pinscher-mordidas',travelArt:'pinscher-correr',kind:'dog',age:20,y:0,w:170,h:140,hitCD:0};
  assert.equal(chapuhEntityArt(e).name,'pinscher-correr');
  e.hitCD=5;assert.equal(chapuhEntityArt(e).name,'pinscher-mordidas');
});
