import { MAJIS_ART_CROPS } from '../data/majis-art.js';
import { drawSpriteLayer } from './sprites.js';
import { SYS } from '../data/system.js';

const phase=(age,duration)=>Math.max(0,Math.min(3,Math.floor(age/Math.max(1,duration)*4)));
const draw=(c,a)=>drawSpriteLayer(c,'majis-fx',a.name,a.index,{...a.box,crop:MAJIS_ART_CROPS[a.name]});

/** Pure visual descriptors; contact follows normal/turbo hit windows. */
export function majisAttackArt(f){
  if(f.ch.id!=='majis'||f.state!=='attack')return [];
  const m=f.move,key=f.moveKey;
  if(key==='c2'){
    const motion=m.motion[0];
    if(!motion||f.sf<motion.from||f.sf>motion.to)return [];
    return [{name:'fx-slide-palco',index:Math.floor((f.sf-motion.from)/4)%4,box:{x:-110,y:0,w:250,h:95,anchor:'bottom'}}];
  }
  const h=m.hits.find(h=>f.sf>=h.from&&f.sf<=h.to);
  if(!h)return [];
  const b=h.box,index=phase(f.sf-h.from,h.to-h.from+1);
  if(key==='SA3'){
    const final=h.dmg>=2000,frames=final?(f.sf-h.from<2?2:3):Math.min(1,index);
    return Array.from({length:16},(_,i)=>({name:'fx-terremoto',index:frames,box:{x:b.x+170+i*325,y:0,w:360,h:final?260:140,anchor:'bottom'}}));
  }
  const ascending=['4S','2H'].includes(key);
  if(!ascending&&!['5L','5M','5H','6M','6S','jH','blindado'].includes(key))return [];
  return [{name:ascending?'fx-solo-ascendente':'fx-power-chord',index,box:ascending
    ?{x:b.x+b.w/2,y:-b.y,w:b.w,h:b.h,anchor:'bottom'}
    :{x:b.x+b.w/2,y:-(b.y+b.h/2),w:b.w,h:b.h}}];
}

export function drawMajisAttack(c,f){
  const art=majisAttackArt(f);let loaded=false;
  for(const a of art)loaded=draw(c,a)||loaded;
  return loaded;
}

/** Only projectiles explicitly tagged by Majis receive these sprites. */
export function majisEntityArt(e){
  if(!MAJIS_ART_CROPS[e.art])return null;
  const trap=e.behavior==='trap';
  const index=trap?(e.delay>0?0:e.age<e.artDelay+8?1:e.life<=12?3:2):Math.floor(e.age/4)%4;
  return {name:e.art,index,box:{x:e.x,y:SYS.GROUND_Y-e.y-(trap?0:e.h/2),w:e.w,h:e.h,face:e.dir||1,anchor:trap?'bottom':'center'}};
}
export const drawMajisEntity=(c,e)=>{const a=majisEntityArt(e);return a?draw(c,a):false;};

export function majisStatusArt(f,frame){
  const n=f.status?.frost||0;
  if(!n&&f.state!=='frozen')return null;
  return {name:'fx-tremor',index:f.state==='frozen'?2:Math.floor(frame/(n>1?4:8))%4,box:{x:0,y:-240,w:250,h:500}};
}
export function drawMajisStatus(c,f,frame){const a=majisStatusArt(f,frame);return a?draw(c,a):false;}
