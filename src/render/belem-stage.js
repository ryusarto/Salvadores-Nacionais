import {BELEM_LAYERS,BELEM_OBJECTS,BELEM_BANDS,stageFrame} from '../data/belem-stage.js';
const state={pack:null,images:new Map(),errors:[],ready:false};
const cache={background:null,backgroundCam:null,ground:null,groundCam:null};
const canvas=(w,h)=>typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});
export function belemStageStatus(){return{ready:state.ready,loaded:state.images.size,errors:[...state.errors],groups:state.pack?.groups??0};}
export async function loadBelemStage(pack){
 state.pack=pack;state.images.clear();state.errors=[];state.ready=false;
 cache.backgroundCam=cache.groundCam=null;
 await Promise.all(Object.entries(pack.assets).filter(([,a])=>a.kind!=='audio').map(async([id,a])=>{
  try{const img=new Image();img.decoding='async';img.src=a.url;await img.decode();state.images.set(id,img);}
  catch{state.errors.push(id);}
 }));
 state.ready=['ceu','horizonte','agua','arquitetura','feira','calcamento'].every(id=>state.images.has(id));
 return belemStageStatus();
}
function image(id){return state.images.get(id);}
function layer(c,id,cam,factor){const img=image(id);if(!img)return;const top=id==='feira'?747:id==='primeiro-plano'?980:0,height=id==='feira'?79:id==='primeiro-plano'?100:1080;c.drawImage(img,Math.round(cam*factor),top,1920,height,0,top,1920,height);}
function object(c,o,cam,frame){
 const img=image(o.asset),a=state.pack.assets[o.asset];if(!img||!a)return;
 const [sx,sy,sw,sh]=a.crop??[0,0,a.frames===6?500:img.width,a.frames===6?500:img.height];
 const w=o.w??o.h*sw/sh,h=o.h??o.w*sh/sw,x=o.x-cam*o.factor-w/2,y=o.y-h;
 if(x+w<0||x>1920)return;
 c.save();c.globalAlpha=o.opacity??1;
 c.drawImage(img,sx+(a.frames===6?stageFrame(frame,o.fps,o.phase)*500:0),sy,sw,sh,x,y,w,h);c.restore();
}
export function drawBelemGround(c,texture,cam){
 const top=826;
 // Each scanline samples the same tiled plane in world coordinates.
 for(let y=top;y<1080;y+=2){const q=(y-top)/(1080-top),scale=1+(y-930)/260,tile=1024*scale;
  const row=Math.floor(1024*(1-1/(1+q*2)))%1024;
  const offset=((cam*scale+960*(scale-1))%tile+tile)%tile;
  for(let x=-offset;x<1920;x+=tile)c.drawImage(texture,0,row,1024,2,x,y,tile,2);
 }
 const shade=c.createLinearGradient(0,top,0,1080);shade.addColorStop(0,'rgba(27,17,43,.25)');shade.addColorStop(1,'rgba(27,17,43,.12)');c.fillStyle=shade;c.fillRect(0,top,1920,254);
 c.fillStyle='#353139';c.fillRect(0,top-2,1920,3);
}
export function drawBelemStage(c,cam,frame=0){
 if(!state.ready)return false;
 const safeCam=Math.max(0,Math.min(680,cam));
 const pixelCam=Math.round(safeCam);
 cache.background??=canvas(1920,1080);
 if(cache.backgroundCam!==pixelCam){const bg=cache.background.getContext('2d');bg.clearRect(0,0,1920,1080);for(const L of BELEM_LAYERS.slice(0,5))layer(bg,L.id,pixelCam,L.factor);cache.backgroundCam=pixelCam;}
 c.drawImage(cache.background,0,0);
 for(const band of['water','boats'])for(const o of BELEM_OBJECTS)if(o.band===band)object(c,o,safeCam,frame);
 layer(c,'feira',safeCam,.78);
 for(const band of BELEM_BANDS.slice(2))for(const o of BELEM_OBJECTS)if(o.band===band)object(c,o,safeCam,frame);
 cache.ground??=canvas(1920,254);
 if(cache.groundCam!==pixelCam){const floor=cache.ground.getContext('2d');floor.setTransform(1,0,0,1,0,-826);drawBelemGround(floor,image('calcamento'),pixelCam);cache.groundCam=pixelCam;}
 c.drawImage(cache.ground,0,826);
 layer(c,'primeiro-plano',safeCam,1.05);
 return true;
}
export function drawBelemPresentation(c,id,x,y,w,h){const img=image(id);if(!img)return false;c.drawImage(img,x,y,w,h);return true;}
