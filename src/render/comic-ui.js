import{halftone}from'./draw.js';
export const COMIC={ink:'#17131b',paper:'#f4e9c9',yellow:'#f3c426',red:'#dc3029',cyan:'#63d6d3',muted:'#a59c92'};
const images=new Map(),errors=[];let loaded=false,paperCache=null;
export function comicUiStatus(){return{loaded,images:images.size,errors:[...errors],portraits:[...images.keys()].filter(k=>k.startsWith('portrait-')).length,icons:[...images.keys()].filter(k=>k.startsWith('icon-')).length};}
export async function loadComicUi(pack){
 await Promise.all(Object.entries(pack.assets).map(async([id,a])=>{
  try{if(a.kind==='font'){const face=new FontFace('SNComic',`url(${a.url})`);await face.load();document.fonts.add(face);}else{const img=new Image();img.src=a.url;await img.decode();images.set(id,img);}}
  catch{errors.push(id);}
 }));loaded=true;paperCache=null;return comicUiStatus();
}
export function comicImage(c,id,x,y,w,h,flip=false){const img=images.get(id);if(!img)return false;c.save();if(flip){c.translate(x+w,y);c.scale(-1,1);c.drawImage(img,0,0,w,h);}else c.drawImage(img,x,y,w,h);c.restore();return true;}
export function comicPortrait(c,id,x,y,w,h,flip=false){return comicImage(c,'portrait-'+id,x,y,w,h,flip);}
export function comicIcon(c,id,x,y,w,h){return comicImage(c,'icon-'+id,x,y,w,h);}
export function comicText(c,str,x,y,size,color=COMIC.ink,align='left',maxWidth){
 c.font=`${size}px SNComic, Impact, sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;
 if(maxWidth&&c.measureText(str).width>maxWidth){c.save();c.translate(x,y);c.scale(maxWidth/c.measureText(str).width,1);c.fillText(str,0,0);c.restore();}else c.fillText(str,x,y);
}
export function comicPanel(c,x,y,w,h,fill=COMIC.paper,skew=16,line=4){c.beginPath();c.moveTo(x+skew,y);c.lineTo(x+w,y);c.lineTo(x+w-skew,y+h);c.lineTo(x,y+h);c.closePath();c.fillStyle=fill;c.fill();if(line){c.strokeStyle=COMIC.ink;c.lineWidth=line;c.stroke();}}
export function comicBackground(c,frame=0,dark=false){
 if(!paperCache){const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1920,1080):Object.assign(document.createElement('canvas'),{width:1920,height:1080});const g=cv.getContext('2d');g.fillStyle=COMIC.yellow;g.fillRect(0,0,1920,1080);comicImage(g,'paper',0,0,1920,1080);halftone(g,1100,0,820,1080,'rgba(25,16,25,.12)',20,5,'up');paperCache=cv;}
 c.drawImage(paperCache,0,0);c.fillStyle=COMIC.ink;c.beginPath();c.moveTo(1510,0);c.lineTo(1920,0);c.lineTo(1920,1080);c.lineTo(1120,1080);c.closePath();c.fill();
 c.strokeStyle=COMIC.ink;c.lineWidth=10;c.beginPath();c.moveTo(0,1015);c.lineTo(1920,1015);c.stroke();
 if(dark){c.fillStyle='rgba(23,19,27,.92)';c.fillRect(0,0,1920,1080);}
}
export function comicLogo(c,x,y,w){const img=images.get('logo');if(img)c.drawImage(img,x,y,w,w*img.height/img.width);else{comicText(c,'SALVADORES',x+w/2,y+60,w*.13,COMIC.red,'center');comicText(c,'NACIONAIS',x+w/2,y+150,w*.14,COMIC.paper,'center');}}
export function comicMenuItem(c,label,x,y,w,selected,index){
 if(selected){c.fillStyle=COMIC.ink;c.fillRect(x-6,y+7,w+12,64);}
 comicPanel(c,x,y,w,64,selected?COMIC.red:COMIC.paper,15,3);
 comicText(c,String(index+1).padStart(2,'0'),x+30,y+33,24,selected?COMIC.yellow:COMIC.red);
 comicText(c,label,x+90,y+33,37,selected?COMIC.paper:COMIC.ink,'left',w-145);
 if(selected)comicText(c,'›',x+w-35,y+30,58,COMIC.paper,'center');
}
