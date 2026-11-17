import { SYS } from '../data/system.js';
import { PAVANASSI_FX_BOUNDS } from '../data/pavanassi-art.js';
import { drawSpriteEffect } from './sprites.js';

const phase=(t,n)=>Math.max(0,Math.min(5,Math.floor(t/Math.max(1,n)*6)));
export function drawPavanassiLayer(c,name,index,box){
 const crop=PAVANASSI_FX_BOUNDS[name];if(!crop)return false;
 const [l,t,w,h]=crop,scale=Math.min(box.w/w,box.h/h);
 const dw=box.stretch?box.w:w*scale,dh=box.stretch?box.h:h*scale;
 const fw=dw*500/w,fh=dh*500/h;
 const x=(250-l-w/2)*fw/500,y=(box.anchor==='bottom'?-dh/2:0)+(250-t-h/2)*fh/500;
 c.save();c.translate(box.x,box.y);c.scale(box.face||1,1);
 const drawn=drawSpriteEffect(c,'pavanassi-fx',name,index/6,x,y,fw,fh);c.restore();return drawn;
}
// Artwork boxes only. The simulation owns collision dimensions and barrier HP.
export function pavanassiEntityArt(e,owner){
 if(owner!=='pavanassi')return null;
 const ground=SYS.GROUND_Y;
 if(e.kind==='carimbo')return{name:'carimbo-voador',index:Math.floor(e.age/3)%6,box:{x:e.x,y:ground-e.y-e.h/2,w:e.w*1.35,h:e.h*1.5,face:e.dir}};
 if(e.kind==='cerca')return{name:e.age<12?'cerca-erguer':'cerca-integridade',index:e.age<12?phase(e.age,12):Math.max(0,Math.min(4,(3-e.hp)*2)),box:{x:e.x,y:ground,w:150,h:e.h+190,anchor:'bottom',stretch:true}};
 if(e.kind==='cabine')return{name:e.age<12?'cabine-queda':'cabine-integridade',index:e.age<12?phase(e.age,12):Math.max(0,Math.min(5,5-e.hp)),box:{x:e.x,y:ground,w:e.w+20,h:e.h+10,anchor:'bottom',stretch:true}};
 return null;
}
export function drawPavanassiEntity(c,e,owner){
 const a=pavanassiEntityArt(e,owner);if(!a||!drawPavanassiLayer(c,a.name,a.index,a.box))return false;
 if(e.age>=12&&e.kind==='cerca')label(c,'DECRETO',e.x,SYS.GROUND_Y-e.h-166,15);
 if(e.age>=12&&e.kind==='cabine'){label(c,'FISCALIZAÇÃO',e.x+e.w*.17,SYS.GROUND_Y-e.h+132,11);label(c,'DOCUMENTO',e.x+e.w*.17,SYS.GROUND_Y-e.h+154,10);}
 return true;
}
function label(c,str,x,y,size){c.save();c.fillStyle='#291521';c.font=`bold ${size}px Impact, sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(str,x,y);c.restore();}
export function drawPavanassiAttack(c,f){
 if(f.ch.id!=='pavanassi'||f.state!=='attack'||!f.move)return false;
 const m=f.move,key=f.moveKey;
 if(key==='4S'&&f.sf>=m.startup&&f.sf<m.startup+m.active+6)drawPavanassiLayer(c,'veto-arco',phase(f.sf-m.startup,m.active+6),{x:120,y:-300,w:300,h:440});
 if(key==='SA3'&&f.sf>=13&&f.sf<=55)drawPavanassiLayer(c,'cela-carimbo',phase(f.sf-13,43),{x:300,y:0,w:420,h:510,anchor:'bottom'});
 return true;
}
export function drawPavanassiStatus(c,f,frame){if(f.status.queue&&f.state==='frozen')drawPavanassiLayer(c,'fila-documentacao',Math.floor(frame/5)%6,{x:f.x,y:SYS.GROUND_Y-f.y-330,w:250,h:280});}
export function drawPavanassiParticle(c,p){return drawPavanassiLayer(c,p.name,phase(p.t,p.dur),{x:p.x,y:p.y,w:p.w,h:p.h,face:p.face||1,anchor:p.anchor||'center'});}
