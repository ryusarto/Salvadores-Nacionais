import { ZANATA_ART } from '../data/zanata-art.js';
import { animFor } from './anim.js';
import { spriteProgress } from './sprite-timing.js';
import { drawSpriteLayer } from './sprites.js';
const phase=(t,n)=>Math.max(0,Math.min(5,Math.floor(t/Math.max(1,n)*6)));

function layer(c,f,name,index,box,local=true){
 const left=f.face<0,view=left?'esquerda':'direita',crop=ZANATA_ART[view]?.crops[name];
 if(!crop)return false;
 return drawSpriteLayer(c,left?'zanata-esquerda-fx':'zanata-fx',name,index,{...box,face:left&&local?-1:1,crop});
}
export function zanataAttackArt(f){
 if(f.ch.id!=='zanata'||f.state!=='attack'||!f.move)return null;
 const h=f.move.hits.find(h=>f.sf>=h.from&&f.sf<=h.to);if(!h)return null;
 const name=f.moveKey==='SA3'?'fx-intimacao':f.moveKey==='SA1'?'fx-tempestade':f.moveKey==='6S'?'fx-laco':['2M','2S'].includes(f.moveKey)?'fx-varredura':f.moveKey==='4S'?'fx-agulha':f.move.weapon==='whip'?'fx-estalo':null;
 return name?{name,index:phase(f.sf-h.from,h.to-h.from+1),box:{x:name==='fx-estalo'?h.box.x+h.box.w:h.box.x+h.box.w*.5,y:-(h.box.y+h.box.h/2),w:h.box.w*(name==='fx-estalo'?.3:1),h:Math.max(90,h.box.h),anchor:'center'},hit:h}:null;
}
/** Independent native-facing FX plus a flexible leather strand to the actual hitbox. */
export function drawZanataAttack(c,f){
 if(f.ch.id!=='zanata'||f.state!=='attack')return false;
 const a=zanataAttackArt(f);if(!a)return true;
 const m=f.move,h=a.hit;
 if(m.weapon==='whip'&&!(f.moveKey==='SA3'&&h===m.hits[1])){
  const animation=animFor(f,0),i=Math.min(5,Math.floor(spriteProgress(f,animation)*6));
  const row=ZANATA_ART[f.face<0?'esquerda':'direita']?.frames[animation.name]?.[i];
  const grip=row?.grip||[f.face<0?180:320,260],u=768/500*f.ch.spriteScale;
  const hand=[(grip[0]-250)*u*(f.face<0?-1:1),(grip[1]-456)*u];
  const tip=[h.box.x+h.box.w,-(h.box.y+h.box.h/2)],bend=hand[1]-70-Math.sin(f.sf*.9)*25;
  for(const [width,color]of[[8,'#1a1015'],[4,'#94603d'],[1,'#e6b978']]){
   c.beginPath();c.moveTo(...hand);c.quadraticCurveTo((hand[0]+tip[0])*.5,bend,...tip);c.lineWidth=width;c.strokeStyle=color;c.stroke();
  }
 }
 layer(c,f,a.name,a.index,a.box);
 if(f.moveKey==='6S'&&f.sf>m.hits[0].from+1)layer(c,f,'fx-puxao',a.index,{x:a.box.x,y:a.box.y,w:Math.min(420,h.box.w),h:120,anchor:'center'});
 return true;
}
export function drawZanataStatus(c,f,frame){
 if(f.ch.id!=='zanata'||!f.res.fury)return;
 layer(c,f,'fx-furia',Math.floor(frame/6)%6,{x:0,y:-240,w:660,h:640,anchor:'center'});
}
export function drawZanataParticle(c,p){
 const f={face:p.face};c.save();c.globalAlpha=1;layer(c,f,p.name,phase(p.t,p.dur),{x:p.x,y:p.y,w:p.w,h:p.h,anchor:'center'},false);c.restore();
}
