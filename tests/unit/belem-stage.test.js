import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync}from'node:fs';import{createHash}from'node:crypto';import sharp from'sharp';
import{BELEM_LAYERS,BELEM_OBJECTS,stageFrame,stageLayerWidth}from'../../src/data/belem-stage.js';
import{loadBelemStage,drawBelemStage,drawBelemGround,belemStageStatus}from'../../src/render/belem-stage.js';
const root=new URL('../../production/stages/belem/',import.meta.url);
const manifest=()=>JSON.parse(readFileSync(new URL('manifest.json',root)));
test('Belém has all 36 produced groups, 45 delivered files and intact source hashes',async()=>{
 const m=manifest();assert.equal(m.groups,36);assert.equal(m.assetGroups.length,36);assert.equal(Object.keys(m.assets).length,45);
 for(const g of m.assetGroups)assert.equal(g.status,'produced',g.id);
 for(const[id,a]of Object.entries(m.assets)){
  const bytes=readFileSync(new URL(a.path,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256,id);
  if(a.kind==='audio'){assert.ok(a.seconds>=4,id);assert.ok(a.peak<.95,id);assert.ok(a.rms>0,id);continue;}
  const meta=await sharp(bytes).metadata();assert.equal(meta.width,a.width,id);assert.equal(meta.height,a.height,id);
  if(a.frames===6){assert.equal(meta.width,3000,id);assert.equal(meta.height,500,id);assert.ok(meta.hasAlpha,id);const hashes=new Set();
   for(let f=0;f<6;f++){const data=await sharp(bytes).extract({left:f*500,top:0,width:500,height:500}).ensureAlpha().raw().toBuffer();
    hashes.add(createHash('sha256').update(data).digest('hex'));
    for(let n=0;n<500;n++)for(const p of[n,499*500+n,n*500,n*500+499])assert.equal(data[p*4+3],0,id+' frame '+f+' edge');
   }assert.equal(hashes.size,6,id+' distinct frames');
  }
 }
});
test('Layer canvases cover the entire camera travel; objects stay behind the fighting floor',()=>{
 const m=manifest();for(const l of BELEM_LAYERS)assert.ok(m.assets[l.id].width>=stageLayerWidth(l.factor),l.id);
 assert.equal(new Set(BELEM_OBJECTS.map(o=>o.id)).size,BELEM_OBJECTS.length);
 for(const o of BELEM_OBJECTS){assert.ok(m.assets[o.asset],o.id);assert.ok(o.y<=826,o.id);assert.ok(o.factor>=0&&o.factor<=1.05,o.id);}
 for(const fps of[4,5,6]){const frames=Array.from({length:360},(_,i)=>stageFrame(i,fps));assert.deepEqual([...new Set(frames)].sort(),[0,1,2,3,4,5]);assert.equal(stageFrame(360,fps),0);}
});
test('Missing essential art retains the procedural stage without any duplicate draw',async()=>{
 const previous=globalThis.Image;
 globalThis.Image=class{async decode(){if(this.src==='missing')throw Error('404');}};
 try{const assets=Object.fromEntries(['ceu','horizonte','agua','arquitetura','feira','calcamento'].map(id=>[id,{kind:'layer',url:id==='arquitetura'?'missing':id}]));
  const result=await loadBelemStage({assets,groups:36});assert.equal(result.ready,false);assert.deepEqual(result.errors,['arquitetura']);
  assert.equal(drawBelemStage({drawImage(){assert.fail('must not overlay a partially loaded stage');}},340,0),false);assert.equal(belemStageStatus().loaded,5);
 }finally{globalThis.Image=previous;}
});
test('Ground covers every scanline and moves exactly with fighters at their foot plane',()=>{
 const capture=cam=>{const calls=[];drawBelemGround({drawImage(...a){calls.push(a);},createLinearGradient(){return{addColorStop(){}};},fillRect(){}},{},cam);return calls;};
 const a=capture(0),b=capture(10);
 for(let y=826;y<1080;y+=2){const row=b.filter(v=>v[6]===y);assert.ok(row.length);assert.ok(row[0][5]<=0);assert.ok(row.at(-1)[5]+row.at(-1)[7]>=1920);}
 const footA=a.find(v=>v[6]===930),footB=b.find(v=>v[6]===930);assert.equal(footA[5]-footB[5],10);
});
