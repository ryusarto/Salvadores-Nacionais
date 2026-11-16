// Export real poses from their atlas, including complete blades in grid gutters.
import sharp from 'sharp';
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{join}from'node:path';import{createHash}from'node:crypto';
import{splitPoses,extractPose}from'./lib/sprite-components.mjs';
const left=process.argv.includes('--left'),partial=process.argv.includes('--partial');
const root='production/sprites/source/ryuchi-v3'+(left?'/esquerda':''),config=JSON.parse(readFileSync(join(root,'PLANO.json')));
const alphaNoiseThreshold=12; // Quantized source-export noise below5% opacity; canonical RGBA outside ink.
const hash=b=>createHash('sha256').update(b).digest('hex'),size=500,foot=[250,456];
const effectsOnly=process.argv.includes('--effects-only');
const existing=effectsOnly?JSON.parse(readFileSync(join(root,'manifest.json'))):null;
const manifest={character:'ryuchi',view:left?'left':'right',version:3,frames:6,cell:size,foot,grid:[3,2],sourceCell:512,alphaNoiseThreshold,upscaled:false,calibration:'Uniform facial calibration per animation, capped to fit complete poses; separate native views. Component extraction preserves blades extending through atlas gutters.',sequences:[],effects:[],crops:{}};
if(existing)manifest.sequences=existing.sequences;
function bounds(p,w,h){let l=w,t=h,r=-1,b=-1,opaque=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>127){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);opaque++;}return{x:l,y:t,w:r-l+1,h:b-t+1,bottom:b,opaque};}
for(const job of config.animations){
 if(effectsOnly&&!job.effect)continue;
 if(!job.source){if(partial)continue;throw Error('Missing source '+job.name);}
 const source=join(root,job.source),meta=await sharp(source).metadata();if(meta.width!==1536||meta.height!==1024)throw Error('Expected native3x2 atlas1536x1024 '+job.name);
 const full=await sharp(source).ensureAlpha().raw().toBuffer();
 const split=job.effect&&!job.componentExtraction?null:splitPoses(full,1536,1024);
 const boxes=!split?Array.from({length:6},(_,i)=>({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512,clipped:false})):split.boxes;
 if(boxes.some(b=>b.clipped))throw Error('Drawing clipped at OUTER atlas boundary; regenerate '+job.name);
 const raws=[],bb=[];for(const [index,box] of boxes.entries()){const raw=split?extractPose(full,1536,1024,split,index):await sharp(source).extract({left:box.left,top:box.top,width:box.width,height:box.height}).ensureAlpha().raw().toBuffer();
  if(job.effect&&!split){let edge=0;for(let n=0;n<512;n++)for(const p of[n,511*512+n,n*512,n*512+511])if(raw[p*4+3]>127)edge++;if(edge)throw Error('Effect crosses cell boundary; regenerate '+job.name);}
  const corners=[0,box.width-1,(box.height-1)*box.width,box.width*box.height-1].map(p=>raw[p*4+3]);if(corners.some(a=>a>alphaNoiseThreshold))throw Error('Background alpha needs image_gen repair '+job.name);
  for(let p=0;p<raw.length;p+=4)if(raw[p+3]<=alphaNoiseThreshold)raw[p]=raw[p+1]=raw[p+2]=raw[p+3]=0;
  raws.push(raw);bb.push(bounds(raw,box.width,box.height));
 }
 const facialScale=job.effect?.9:Math.min(.95,config.referenceScale*Math.sqrt(config.referenceFaceArea/job.faceArea));
 const scale=Math.min(facialScale,470/Math.max(...bb.map(b=>b.w)),440/Math.max(...bb.map(b=>b.h)));
 if(!(scale>0&&scale<=1))throw Error('Invalid scale '+job.name);
 const buffers=[],records=[];
 for(let i=0;i<6;i++){
  const box=boxes[i],b=bb[i],w=Math.round(box.width*scale),h=Math.round(box.height*scale);
  const resized=await sharp(raws[i],{raw:{width:box.width,height:box.height,channels:4}}).resize(w,h).png().toBuffer();
  const nominalX=i%3*512;let dx=Math.round(foot[0]-(nominalX+256-box.left)*scale),dy=job.effect?Math.round(250-(Math.floor(i/3)*512+256-box.top)*scale):Math.round(foot[1]-(b.bottom+1)*scale);
  if(job.effect){dx=Math.round(250-(b.x+b.w/2)*scale);dy=Math.round(250-(b.y+b.h/2)*scale);}
  const rootDx=dx;dx=Math.max(Math.ceil(8-b.x*scale),Math.min(dx,Math.floor(492-(b.x+b.w)*scale)));
  dy=Math.max(Math.ceil(8-b.y*scale),Math.min(dy,Math.floor(492-(b.y+b.h)*scale)));
  const cropLeft=Math.max(0,-dx),cropTop=Math.max(0,-dy),cw=Math.min(w-cropLeft,size-Math.max(dx,0)),ch=Math.min(h-cropTop,size-Math.max(dy,0));
  const trimmed=await sharp(resized).extract({left:cropLeft,top:cropTop,width:cw,height:ch}).png().toBuffer();
  const frame=await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:trimmed,left:Math.max(dx,0),top:Math.max(dy,0)}]).png().toBuffer();
  const pixels=await sharp(frame).ensureAlpha().raw().toBuffer(),fb=bounds(pixels,size,size);let edgePixels=0;
  for(let n=0;n<size;n++)for(const p of[n,499*500+n,n*500,n*500+499])if(pixels[p*4+3]>127)edgePixels++;
  if(edgePixels)throw Error('Export clips pose '+job.name+' '+i);
  buffers.push(frame);records.push({source:[box.left,box.top,box.width,box.height],sourceEdgePixels:0,foreignPixelsRemoved:box.foreignPixels||0,scale,offset:[dx,dy],rootShiftX:dx-rootDx,bounds:fb,edgePixels,alphaMin:Math.min(pixels[3],pixels[(size*size-1)*4+3]),sha256:hash(frame)});
 }
 for(const dir of['tiras','pranchas'])mkdirSync(join(root,dir),{recursive:true});
 const strip=await sharp({create:{width:3000,height:500,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(buffers.map((input,i)=>({input,left:i*500,top:0}))).png().toBuffer();
 const png=join(root,'tiras',job.name+'.png'),sheet=join(root,'pranchas',job.name+'.png');writeFileSync(png,strip);
 await sharp({create:{width:1500,height:1000,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(buffers.map((input,i)=>({input,left:i%3*500,top:Math.floor(i/3)*500}))).png().toFile(sheet);
 const folder='production/sprites/final/'+(left?'ryuchi-esquerda':'ryuchi')+(job.effect?'-fx':'');mkdirSync(folder,{recursive:true});const file=join(folder,job.name+'.webp');await sharp(strip).webp({quality:96,alphaQuality:100,effort:5}).toFile(file);
 manifest[job.effect?'effects':'sequences'].push({name:job.name,source:job.source,sourceSha256:hash(readFileSync(source)),faceArea:job.faceArea,facialScale,scale,frames:records,file,sha256:hash(readFileSync(file)),png,pngSha256:hash(strip),sheet});
 if(job.effect){const l=Math.max(0,Math.min(...records.map(f=>f.bounds.x))-3),t=Math.max(0,Math.min(...records.map(f=>f.bounds.y))-3),r=Math.min(500,Math.max(...records.map(f=>f.bounds.x+f.bounds.w))+3),b=Math.min(500,Math.max(...records.map(f=>f.bounds.y+f.bounds.h))+3);manifest.crops[job.name]=[l,t,r-l,b-t].map(v=>v*768/500);}
 console.log((left?'left/':'right/')+job.name+' —6×500px '+scale.toFixed(3));
}
writeFileSync(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
if(!partial)writeFileSync('src/data/ryuchi'+(left?'-left':'')+'-art.js','// Native '+(left?'left':'right')+' view effect crops in768px coordinates.\nexport const RYUCHI_'+(left?'LEFT_':'')+'ART_CROPS = '+JSON.stringify(manifest.crops,null,2)+';\n');
