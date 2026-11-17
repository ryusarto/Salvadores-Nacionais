import test from 'node:test';
import assert from 'node:assert/strict';
import {registerStageArt,requestStageArt,loadStageArt,stageArtStatus,drawStageProp} from '../../src/render/stage-packs.js';
import {drawCabin,drawFence,drawStamp} from '../../src/render/boss-art.js';

class FakeImage {
  static loads=[];
  set src(url){this.url=url;this.width=url==='strip'?3000:512;this.height=512;FakeImage.loads.push(url);}
  async decode(){if(this.url==='broken')throw Error('decode failed');}
}
globalThis.Image=FakeImage;
const context=()=>{
  const c={calls:[],imageAlpha:[],globalAlpha:1}, stack=[];
  for(const name of ['save','restore','translate','scale','beginPath','closePath','moveTo','lineTo','quadraticCurveTo','fill','stroke','fillRect','strokeRect','roundRect','drawImage','fillText'])c[name]=(...args)=>c.calls.push([name,...args]);
  c.save=()=>stack.push(c.globalAlpha);
  c.restore=()=>{c.globalAlpha=stack.pop();};
  c.drawImage=(...args)=>{c.calls.push(['drawImage',...args]);c.imageAlpha.push(c.globalAlpha);};
  return c;
};
const pack=()=>({
  layers:[{asset:'sky',factor:0}],essential:['sky'],
  interactive:['cabine-fiscal','cerca-fiscal','carimbo-fiscal'],
  assets:{sky:{url:'sky'},'cabine-fiscal':{url:'cabin',crop:[20,10,230,490]},'cerca-fiscal':{url:'fence'},'carimbo-fiscal':{url:'stamp'}},
});

test('a gameplay entity requests the unvisited arena once and keeps its fallback until ready',async()=>{
  FakeImage.loads=[];
  registerStageArt({banheiros:pack()});
  assert.deepEqual(FakeImage.loads,[]);
  const fallback=context();drawStamp(fallback,0,0,1.2);
  assert.ok(fallback.calls.some(([name])=>name==='fillRect'));
  assert.ok(!fallback.calls.some(([name])=>name==='drawImage'));
  const pending=requestStageArt('banheiros');
  assert.equal(requestStageArt('banheiros'),pending);
  await pending;
  assert.deepEqual(FakeImage.loads.sort(),['cabin','fence','sky','stamp']);
  const painted=context();drawStamp(painted,0,0,1.2);
  const image=painted.calls.find(([name])=>name==='drawImage');
  assert.equal(image[1].url,'stamp');
  assert.deepEqual(image.slice(6),[-30,-40,60,60]);
  assert.ok(!painted.calls.some(([name])=>name==='fillRect'));
});

test('interactive prop failure leaves scenery ready and restores the procedural entity',async()=>{
  const p=pack();p.assets['cabine-fiscal'].url='broken';
  await loadStageArt({banheiros:p});
  assert.equal(stageArtStatus('banheiros').ready,true);
  assert.deepEqual(stageArtStatus('banheiros').errors,['cabine-fiscal']);
  assert.equal(drawStageProp(context(),'banheiros','cabine-fiscal',{x:500,y:930,w:190,h:420}),false);
  const fallback=context();drawCabin(fallback,{x:500,w:190,h:420,age:20,hp:5},930,0);
  assert.ok(fallback.calls.some(([name])=>name==='quadraticCurveTo'),'fallback roof remains visible');
  assert.ok(fallback.calls.some(([name,text])=>name==='fillText'&&text==='FISCALIZAÇÃO'));
});

test('painted barriers retain world placement, live labels, lock and damage overlays',async()=>{
  await loadStageArt({banheiros:pack()});
  const c=context();drawCabin(c,{x:2500,w:190,h:420,age:20,hp:3},930,0);
  const image=c.calls.find(([name])=>name==='drawImage');
  assert.equal(image[1].url,'cabin');
  assert.deepEqual(image.slice(2),[20,10,230,490,2405,510,190,420],'caller owns camera transform even beyond viewport');
  assert.deepEqual(c.calls.filter(([name])=>name==='fillText').map(([,s])=>s),['FISCALIZAÇÃO','SÓ ENTRA COM','DOCUMENTO']);
  assert.ok(c.calls.some(([name,x,y,w,h])=>name==='fillRect'&&x===2555&&y===670&&w===14&&h===26),'lock pulse stays live');
  assert.equal(c.calls.filter(([name])=>name==='lineTo').length,4,'two cracks reflect lost hp');
  const fence=context();drawFence(fence,{x:2500,h:200,hp:2},930);
  assert.deepEqual(fence.calls.find(([name])=>name==='drawImage').slice(6),[2470,730,60,200]);
  assert.deepEqual(fence.calls.filter(([name])=>name==='fillText').map(([,s])=>s),['DECRETO','CADA UM NO SEU LUGAR']);
  assert.equal(fence.calls.filter(([name])=>name==='lineTo').length,2);
});

test('prop strips honor a shared crop, the simulation clock, and caller opacity',async()=>{
  await loadStageArt({interactiveMotion:{layers:[{asset:'sky'}],interactive:['prop'],assets:{sky:{url:'sky'},prop:{url:'strip',frames:6,cellWidth:500,crop:[100,20,200,450]}}}});
  const c=context();c.globalAlpha=.5;
  assert.equal(drawStageProp(c,'interactiveMotion','prop',{x:0,y:0,h:450,frame:24,fps:5,opacity:.6}),true);
  assert.deepEqual(c.calls.find(([name])=>name==='drawImage').slice(2),[1100,20,200,450,-100,-450,200,450]);
  assert.deepEqual(c.imageAlpha,[.3]);
  assert.equal(c.globalAlpha,.5,'caller alpha is restored');
  const reduced=context();drawStageProp(reduced,'interactiveMotion','prop',{x:0,y:0,h:450,frame:24,fps:5,reducedEffects:true});
  assert.equal(reduced.calls.find(([name])=>name==='drawImage')[2],100);
});
