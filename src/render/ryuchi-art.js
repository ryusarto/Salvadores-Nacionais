import { SYS } from '../data/system.js';
import { RYUCHI_ART_CROPS } from '../data/ryuchi-art.js';
import { RYUCHI_LEFT_ART_CROPS } from '../data/ryuchi-left-art.js';
import { drawSpriteLayer } from './sprites.js';
const phase=(t,n)=>Math.max(0,Math.min(5,Math.floor(t/Math.max(1,n)*6)));
function draw(c,a,left=false,local=false){
 const crops=left?RYUCHI_LEFT_ART_CROPS:RYUCHI_ART_CROPS;
 return drawSpriteLayer(c,left?'ryuchi-esquerda-fx':'ryuchi-fx',a.name,a.index,{...a.box,face:left&&local?-1:1,crop:crops[a.name]});
}
export function ryuchiEntityArt(e,owner){
 if(owner!=='ryuchi'||e.kind!=='slash')return null;
 return{name:'onda-cortante',index:Math.floor(e.age/3)%6,view:e.dir<0?'left':'right',box:{x:e.x,y:SYS.GROUND_Y-e.y-e.h/2,w:e.w*1.6,h:e.h,anchor:'center'}};
}
export function drawRyuchiEntity(c,e,owner){const a=ryuchiEntityArt(e,owner);if(!a)return false;draw(c,a,a.view==='left');return true;}
export function ryuchiAttackArt(f){
 if(f.ch.id!=='ryuchi'||f.state!=='attack'||!f.move)return null;
 const m=f.move,key=f.moveKey;
 if(key==='2S'&&f.sf>=m.hold.at)return{name:'fx-fio',index:Math.min(5,Math.floor((f.holdT||0)/15)),box:{x:-30,y:-230,w:130+Math.min(3,Math.floor((f.holdT||0)/25))*40,h:240,anchor:'center'}};
 if(key==='stM'){const w=m.flags.counter;if(f.sf<w.from||f.sf>w.to)return null;return{name:'fx-contra',index:phase(f.sf-w.from,w.to-w.from+1),box:{x:80,y:-300,w:190,h:190,anchor:'center'}};}
 const h=m.hits.find(h=>f.sf>=h.from&&f.sf<=h.to);if(!h)return null;
 if(['5L','5M','5H','2L','2M','2H','3H','6M','jL','jM','jH','5LL','5LLL','stL','c1','c2','throw','blindado'].includes(key))return null;
 const scream=key==='SA1'||key==='SA3';
 const name=scream?(key==='SA3'?'fx-agudo-final':'fx-agudo'):key==='c2'?'fx-estocada':['2H','4S'].includes(key)?'fx-lua':'fx-corte';
 return{name,index:phase(f.sf-h.from,h.to-h.from+1),box:{x:scream?0:h.box.x+h.box.w/2,y:scream?-h.box.h/2:-(h.box.y+h.box.h/2),w:h.box.w,h:h.box.h,anchor:'center'}};
}
export function drawRyuchiAttack(c,f){
 if(f.ch.id!=='ryuchi'||f.state!=='attack')return false;
 const a=ryuchiAttackArt(f);if(a)draw(c,a,f.face<0,true);
 return true; // Own the layer even while lazy art loads; never add legacy trails.
}
export function drawRyuchiParticle(c,p){return draw(c,{name:p.name,index:phase(p.t,p.dur),box:{x:p.x,y:p.y,w:p.w,h:p.h,anchor:'center'}},p.face<0);}
