import test from 'node:test';import assert from 'node:assert/strict';
import franco from '../../src/data/characters/franco.js';import{spriteProgress}from'../../src/render/sprite-timing.js';import{spriteLoadOptions}from'../../src/render/sprite-profile.js';
const ch={...franco,spriteProfile:'twelve-frame'};
test('dense timelines remain monotonic and put real attack contacts in the contact drawings',()=>{for(const m of Object.values(ch.moves).flatMap(m=>[m,m.turbo].filter(Boolean))){let prev=-1;for(let sf=0;sf<m.total;sf++){const p=spriteProgress({ch,state:'attack',move:m,sf},{p:0});assert.ok(Number.isFinite(p)&&p>=prev&&p>=0&&p<1);prev=p;}const first=m.hits[0]?.from??m.startup+1,last=m.hits.at(-1)?.to??m.startup+m.active;assert.ok(spriteProgress({ch,state:'attack',move:m,sf:first},{p:0})>=1/3);assert.ok(spriteProgress({ch,state:'attack',move:m,sf:last},{p:0})<.75);}});
test('held crouch finishes its twelve drawings and stays low',()=>assert.equal(Math.floor(spriteProgress({ch,state:'crouch',sf:100},{p:0})*12),11));
test('walking enters the first drawing and plays all twelve using local state time',()=>{assert.equal(spriteProgress({ch,state:'walk',sf:0},{name:'andar',loop:true,p:.8}),0);const seen=new Set(Array.from({length:28},(_,sf)=>Math.floor(spriteProgress({ch,state:'walk',sf},{name:'andar',loop:true,p:0})*12)));assert.equal(seen.size,12);});
test('profile-driven reader preserves legacy, ten-frame and independent six-frame packs',()=>{assert.equal(spriteLoadOptions('franco').frames,4);assert.equal(spriteLoadOptions('fx-franco').frames,4);assert.equal(spriteLoadOptions('mdep').frames,10);assert.equal(spriteLoadOptions('ryuchi-esquerda-fx').frames,6);assert.equal(spriteLoadOptions('ryuchi-esquerda').cellSize,500);});

test('jump drawings follow takeoff, airborne motion and forward landing recovery',async()=>{
 const {animFor}=await import('../../src/render/anim.js');
 const index=f=>{const a=animFor({...f,ch},0);assert.equal(a.name,'pulo');return Math.floor(spriteProgress({...f,ch},a)*12);};
 assert.equal(index({state:'prejump',sf:0}),0);
 const ascent=index({state:'air',sf:0,vy:30}),apex=index({state:'air',sf:20,vy:0}),descent=index({state:'air',sf:40,vy:-30});
 assert.ok(ascent>=4&&ascent<apex&&apex<descent&&descent<=8);
 assert.equal(index({state:'land',sf:0}),9);
 assert.equal(index({state:'land',sf:20}),11);
});
