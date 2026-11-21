import test from 'node:test';
import assert from 'node:assert/strict';
import {registerStageArt,requestStageArt,loadStageArt,stageArtStatus} from '../../src/render/stage-packs.js';
import {drawGoldWall} from '../../src/render/boss-art.js';

class FakeImage {
 static loads=[];
 set src(url){this.url=url;this.width=500;this.height=500;FakeImage.loads.push(url);}
 async decode(){if(this.url==='broken')throw Error('decode failed');}
}
globalThis.Image=FakeImage;
const drawing=()=>{
 const c={calls:[],globalAlpha:1},stack=[];
 for(const name of ['translate','rotate','beginPath','moveTo','lineTo','fill','stroke','fillRect','strokeRect','fillText'])c[name]=(...args)=>c.calls.push([name,...args]);
 c.save=()=>stack.push(c.globalAlpha);c.restore=()=>{c.globalAlpha=stack.pop();};
 c.createLinearGradient=()=>({addColorStop(){}});
 c.drawImage=(...args)=>c.calls.push(['drawImage',...args,c.globalAlpha]);
 return c;
};
const pack=(url='gold-wall')=>({
 layers:[{asset:'sky',factor:0}],essential:['sky'],interactive:['muralha-interativa'],
 assets:{sky:{url:'sky'},'muralha-interativa':{url,crop:[100,10,120,480]}},
});
const wall=(hp=6,age=20)=>({x:1500,w:120,h:640,age,hp});

test('an unvisited wall requests its arena once and retains the procedural fallback until ready',async()=>{
 FakeImage.loads=[];registerStageArt({washington:pack()});
 const fallback=drawing();drawGoldWall(fallback,wall(),930);
 assert.ok(fallback.calls.some(([name])=>name==='fillRect'));
 assert.ok(!fallback.calls.some(([name])=>name==='drawImage'));
 const pending=requestStageArt('washington');assert.equal(requestStageArt('washington'),pending);await pending;
 assert.deepEqual(FakeImage.loads.sort(),['gold-wall','sky']);
 const painted=drawing();drawGoldWall(painted,wall(),930);
 const image=painted.calls.find(([name])=>name==='drawImage');
 assert.equal(image[1].url,'gold-wall');
 assert.deepEqual(image.slice(2,-1),[100,10,120,480,1440,290,120,640]);
 assert.ok(!painted.calls.some(([name])=>name==='fillRect'));
});

test('painted wall keeps rise, caller opacity, live label and cracks for each remaining HP',async()=>{
 await loadStageArt({washington:pack()});
 for(const hp of [6,3,1]){
  const c=drawing();c.globalAlpha=.5;drawGoldWall(c,wall(hp,5),930);
  assert.deepEqual(c.calls.find(([name])=>name==='translate').slice(1),[0,320]);
  assert.equal(c.calls.find(([name])=>name==='drawImage').at(-1),.5);
  assert.equal(c.globalAlpha,.5);
  assert.deepEqual(c.calls.filter(([name])=>name==='fillText').map(([,text])=>text),['THE WALL']);
  assert.equal(c.calls.filter(([name])=>name==='lineTo').length,(6-hp)*2,'two edges per damage crack');
 }
});

test('optional painted-wall failure keeps the scenery usable and the full gameplay fallback',async()=>{
 await loadStageArt({washington:pack('broken')});
 assert.equal(stageArtStatus('washington').ready,true);
 assert.deepEqual(stageArtStatus('washington').errors,['muralha-interativa']);
 const c=drawing();drawGoldWall(c,wall(1),930);
 assert.ok(!c.calls.some(([name])=>name==='drawImage'));
 assert.ok(c.calls.some(([name,x,y,w,h])=>name==='fillRect'&&x===1440&&y===290&&w===120&&h===640));
 assert.ok(c.calls.some(([name,text])=>name==='fillText'&&text==='THE WALL'));
});
