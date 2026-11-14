import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import mdep from '../../src/data/characters/mdep.js';
import { STATE_ANIMS } from '../../src/render/anim.js';
import { spriteProgress } from '../../src/render/sprite-timing.js';
import { drawSprite, drawSpriteEffect, registerSprites } from '../../src/render/sprites.js';
const dir=new URL('../../production/sprites/final/mdep/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('../../production/sprites/source/mdep-v3/manifest.json',import.meta.url)));

test('MDEP supplies the complete contract with ten distinct transparent 768px cells per strip',()=>{
  const expected=[...Object.keys(STATE_ANIMS),...Object.keys(mdep.moves).map(k=>'golpe-'+k)];
  assert.equal(expected.length,41);
  assert.equal(manifest.inventory.length,49);
  assert.deepEqual(manifest.pending,[]);
  assert.deepEqual(manifest.missingMovements,[]);
  assert.deepEqual(manifest.contract.foot,[384,700]);
  assert.equal(mdep.spriteAlias,undefined);
  const files=readdirSync(dir);
  assert.equal(files.filter(p=>p.endsWith('.png')).length,49);
  assert.equal(files.filter(p=>p.endsWith('.webp')).length,0,'old WEBPs must not override new PNGs');
  for(const name of expected)assert.ok(manifest.inventory.some(a=>a.name===name),name);
  for(const a of manifest.inventory){
    const data=readFileSync(new URL(a.name+'.png',dir));
    assert.equal(data.readUInt32BE(16),7680,a.name);
    assert.equal(data.readUInt32BE(20),768,a.name);
    assert.equal(data[25],6,'PNG must retain RGBA: '+a.name);
    assert.equal(createHash('sha256').update(data).digest('hex'),a.stripSha256,a.name);
    assert.equal(a.frames.length,10,a.name);
    assert.equal(new Set(a.frames.map(f=>f.sha256)).size,10,a.name);
    for(const frame of a.frames){
      assert.deepEqual(frame.canvas,[768,768]);
      assert.equal(frame.alphaRange[0],0);
      assert.ok(frame.alphaRange[1]>0);
      assert.equal(frame.touchesSourceBoundary,false);
      assert.equal(frame.upscaled,false);
    }
  }
  const short=manifest.inventory.find(a=>a.name==='golpe-SA1');
  const long=manifest.inventory.find(a=>a.name==='golpe-SA3');
  assert.equal(short.stripSha256,long.stripSha256,'the compatible rifle core is shared explicitly');
  assert.equal(long.compatibleSharedArtWith,'golpe-SA1');
});

test('the real reader selects dedicated MDEP strips for every state, move and turbo',async t=>{
  const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});
  globalThis.Image=class{
    naturalWidth=7680;naturalHeight=768;
    set src(url){this.url=url;queueMicrotask(()=>this.onload());}
  };
  await registerSprites('mdep',Object.fromEntries(manifest.inventory.map(a=>[a.name,a.name])),{trueAlpha:true});
  let drawn=[];
  const c={save(){},restore(){},translate(){},rotate(){},drawImage(...args){drawn.push(args);}};
  function verify(f,name,clock=0){
    drawn=[];assert.equal(drawSprite(c,f,clock),true,name);
    assert.equal(drawn[0][0].url,name,name);
    assert.equal(drawn[0][3],768);assert.equal(drawn[0][4],768);
    assert.equal(drawn[0][7],768*.85);assert.equal(drawn[0][8],768*.85);
  }
  for(const [name,a]of Object.entries(STATE_ANIMS)){
    const f={ch:mdep,state:a.state,sf:8,stun:12,vx:name==='andar-tras'?-5:5,face:1,vy:0,y:0,comboHits:1};
    if(name==='dano-baixo'||name==='defesa-agachado')f.crouchBlock=true;
    if(name==='defesa-no-ar')f.y=160;
    verify(f,name);
  }
  for(const [key,base]of Object.entries(mdep.moves))for(const move of [base,base.turbo].filter(Boolean)){
    for(const sf of [0,move.startup,move.hits[0]?.from??move.spawn[0]?.at??move.startup+1,move.total-1]){
      const f={ch:mdep,state:'attack',moveKey:key,move,sf};
      verify(f,'golpe-'+key);
      assert.ok(Number.isFinite(spriteProgress(f,{p:0})));
    }
  }
  for(const a of manifest.inventory.filter(a=>a.name.startsWith('fx-')))for(let frame=0;frame<10;frame++){
    drawn=[];assert.equal(drawSpriteEffect(c,'mdep',a.name,frame/10,0,0),true);
    assert.equal(drawn[0][0].url,a.name);assert.equal(drawn[0][1],frame*768);
  }
});
