import test from 'node:test';
import assert from 'node:assert/strict';
import {loadStageArt,drawStageArt,stageArtStatus,stageAnimationFrame,registerStageArt,requestStageArt} from '../../src/render/stage-packs.js';
class FakeImage {
 static loads=[];
 set src(v){this.url=v;FakeImage.loads.push(v);this.width=v==='strip'?3000:1920;this.height=v==='strip'?500:1080;}
 async decode(){if(this.url==='broken')throw Error('missing');}
}
globalThis.Image=FakeImage;
const ctx=()=>({calls:[],save(){},restore(){},drawImage(...args){this.calls.push(args);}});
test('unvisited arenas do not download; the first draw requests one complete pack',async()=>{
 FakeImage.loads=[];
 registerStageArt({lazy:{layers:[{asset:'sky',factor:0}],assets:{sky:{url:'lazy-sky'}}}});
 assert.equal(FakeImage.loads.length,0);
 assert.equal(drawStageArt(ctx(),'lazy',0),false);
 const pending=requestStageArt('lazy');
 assert.equal(requestStageArt('lazy'),pending);
 await pending;
 assert.equal(stageArtStatus('lazy').ready,true);
 assert.equal(FakeImage.loads.filter(x=>x==='lazy-sky').length,1);
});
test('six-frame ambient loop follows the game clock and wraps cleanly',()=>{
 assert.deepEqual([0,12,24,36,48,60,72].map(f=>stageAnimationFrame(f,5,6)),[0,1,2,3,4,5,0]);
 assert.equal(stageAnimationFrame(0,5,6,3),3);
 assert.equal(stageAnimationFrame(NaN),0);
});
test('empty packs cannot suppress the complete fallback',async()=>{
 await loadStageArt({empty:{assets:{},layers:[]}});
 assert.equal(drawStageArt(ctx(),'empty',0),false);
});
test('an essential decode failure invalidates the entire pack including an earlier load',async()=>{
 const p={layers:[{asset:'sky',factor:0}],essential:['sky'],assets:{sky:{url:'sky'}}};
 await loadStageArt({reload:p});assert.equal(stageArtStatus('reload').ready,true);
 await loadStageArt({reload:{...p,assets:{sky:{url:'broken'}}}});
 assert.equal(drawStageArt(ctx(),'reload',0),false);
});
test('repeated props share a decode and optional failures do not erase the scene',async()=>{
 FakeImage.loads=[];
 await loadStageArt({shared:{layers:[{asset:'sky',factor:0}],essential:['sky'],assets:{sky:{url:'sky'},person:{url:'strip',frames:6,cellWidth:500,crop:[100,20,250,450]},optional:{url:'broken'}},objects:[{asset:'person',x:500,y:820,h:225},{asset:'person',x:1000,y:820,h:225},{asset:'optional',x:0,y:0,h:10}]}});
 assert.equal(FakeImage.loads.filter(x=>x==='strip').length,1);
 assert.deepEqual(stageArtStatus('shared').errors,['optional']);
 assert.equal(drawStageArt(ctx(),'shared',0),true);
});
test('sprite crop, world parallax and reduced-effects pose are applied independently',async()=>{
 await loadStageArt({motion:{layers:[{asset:'sky',factor:0,width:1920,height:1080}],assets:{sky:{url:'sky'},person:{url:'strip',frames:6,cellWidth:500,crop:[100,20,250,450]}},objects:[{asset:'person',x:800,y:820,h:225,factor:.5,fps:5}]}});
 const c=ctx();drawStageArt(c,'motion',200,24);
 assert.deepEqual(c.calls[1].slice(1),[1100,20,250,450,637.5,595,125,225]);
 const reduced=ctx();drawStageArt(reduced,'motion',200,24,{reducedEffects:true});
 assert.equal(reduced.calls[1][1],100);
 const clamped=ctx();drawStageArt(clamped,'motion',1000,0);
 assert.equal(clamped.calls[1][5],397.5);
});
test('prepared stage keeps draw order: consecutive still props share a layer, animations stay separate', async () => {
 const {planStageObjects} = await import('../../src/render/stage-packs.js');
 const assets = {box:{}, strip:{frames:6, cellWidth:500, crop:[100,20,250,450]}};
 const sizes = new Map([['box',{width:200,height:100}],['strip',{width:3000,height:500}]]);
 const ops = planStageObjects([
  {asset:'box', x:100, y:500, factor:.5}, {asset:'box', x:400, y:520, factor:.5, opacity:.5},
  {asset:'strip', x:800, y:820, h:225, factor:.5, fps:5},
  {asset:'box', x:900, y:500, factor:.5}, {asset:'box', x:950, y:500, factor:.8},
 ], assets, sizes);
 assert.deepEqual(ops.map(o => o.type + ':' + (o.items?.length ?? o.key)), ['bake:2', 'anim:strip', 'bake:1', 'bake:1']);
 assert.deepEqual(ops[0].box, {x:0, y:400, w:500, h:120});
 assert.equal(ops[0].items[1].alpha, .5);
 assert.deepEqual([ops[1].sx, ops[1].w, ops[1].h, ops[1].x, ops[1].y], [100, 125, 225, 737.5, 595]);
});
