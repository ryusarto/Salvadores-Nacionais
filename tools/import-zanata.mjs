/** Export generated six-pose atlases without painting, mirroring or duplicating poses. */
import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {splitPoses,extractPose} from './lib/sprite-components.mjs';
const root='production/sprites/source/zanata-v1',plan=JSON.parse(readFileSync(join(root,'PLANO.json'))),partial=process.argv.includes('--partial');
const sha=b=>createHash('sha256').update(b).digest('hex');
const cell=500,foot=[250,456],noise=12;
function bounds(raw,w,h,threshold=127){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(raw[(y*w+x)*4+3]>threshold){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return {x:l,y:t,w:r-l+1,h:b-t+1,bottom:b};}
function grip(raw,w,h,b,left) {
 const seen=new Uint8Array(w*h),parts=[];
 const skin=i=>{const r=raw[i*4],g=raw[i*4+1],v=raw[i*4+2];return raw[i*4+3]>180&&r>115&&g>70&&v>40&&r>g*1.08&&r<g*1.95&&g>v*1.08;};
 for(let seed=0;seed<w*h;seed++){
  if(seen[seed]||!skin(seed))continue;seen[seed]=1;const q=[seed];let sx=0,sy=0;
  for(let j=0;j<q.length;j++){const i=q[j],x=i%w,y=Math.floor(i/w);sx+=x;sy+=y;for(const [nx,ny]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(nx<0||nx>=w||ny<0||ny>=h)continue;const n=ny*w+nx;if(!seen[n]&&skin(n)){seen[n]=1;q.push(n);}}}
  // Contact poses raise the leading hand above the chest; the former 32%
  // cutoff selected the rear hand and detached the live strand from its grip.
  const x=sx/q.length,y=sy/q.length;if(q.length>=20&&y>b.y+b.h*.18&&y<b.bottom-25)parts.push({x,y,area:q.length});
 }
 parts.sort((a,b)=>left?a.x-b.x:b.x-a.x);
 return parts[0]?[Math.round(parts[0].x),Math.round(parts[0].y)]:[left?180:320,260];
}
const manifests={},issues=[];
for(const view of plan.views){
 const left=view==='esquerda',id=left?'zanata-esquerda':'zanata';
 const manifest={character:'zanata',view,version:1,frames:6,cell,foot,alphaNoiseThreshold:noise,upscaled:false,sequences:[],effects:[],crops:{}};
 for(const job of plan.animations){
  try {
  const source=join(root,'originais',view,job.name+'.png');
  if(!existsSync(source)){if(partial)continue;throw Error('Missing source '+source);}
  const meta=await sharp(source).metadata();if(meta.width!==1536||meta.height!==1024||!meta.hasAlpha)throw Error('Expected transparent native 1536×1024 atlas: '+source);
  const full=await sharp(source).ensureAlpha().raw().toBuffer();
  let gridSafe=true;
  if(!job.effect) for(let i=0;i<6;i++){
    const raw=await sharp(source).extract({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512}).ensureAlpha().raw().toBuffer();
    const b=bounds(raw,512,512);let opaque=0;for(let p=3;p<raw.length;p+=4)if(raw[p]>127)opaque++;
    if(opaque<3000||b.x<=0||b.y<=0||b.x+b.w>=512||b.y+b.h>=512)gridSafe=false;
  }
  let split=null;
  if(!job.effect&&!gridSafe){try{split=splitPoses(full,1536,1024);}catch(e){throw Error(source+': '+e.message);}}

  const boxes=split?split.boxes:Array.from({length:6},(_,i)=>({left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512,clipped:false}));
  if(boxes.some(b=>b.clipped))throw Error('Source touches outer atlas edge; regenerate '+source);
  const raws=[],bb=[];
  for(let i=0;i<6;i++){
   const box=boxes[i],raw=split?extractPose(full,1536,1024,split,i):await sharp(source).extract({left:box.left,top:box.top,width:box.width,height:box.height}).ensureAlpha().raw().toBuffer();
   for(let n=0;n<raw.length;n+=4)if(raw[n+3]<=noise)raw.fill(0,n,n+4);
   const b=bounds(raw,box.width,box.height,job.effect?noise:127);if(b.w<=0||b.h<=0)throw Error('Empty frame '+source+' '+i);
   if(job.effect){for(let n=0;n<512;n++)for(const p of[n,511*512+n,n*512,n*512+511])if(raw[p*4+3]>noise)throw Error('Effect clipped at cell edge '+source+' '+i);}
   raws.push(raw);bb.push(b);
  }
  // One scale for the WHOLE sequence, never enlarge low poses or copy frames.
  const scale=Math.min(.9,470/Math.max(...bb.map(b=>b.w)),440/Math.max(...bb.map(b=>b.h)));
  const frames=[],records=[];
  for(let i=0;i<6;i++){
   const box=boxes[i],b=bb[i],w=Math.round(box.width*scale),h=Math.round(box.height*scale);
   const resized=await sharp(raws[i],{raw:{width:box.width,height:box.height,channels:4}}).resize(w,h).png().toBuffer();
   const nominalX=i%3*512;
   let dx=Math.round(foot[0]-(nominalX+256-box.left)*scale),dy=Math.round(foot[1]-(b.bottom+1)*scale);
   if(job.effect){dx=Math.round(250-(b.x+b.w/2)*scale);dy=Math.round(250-(b.y+b.h/2)*scale);}
   dx=Math.max(Math.ceil(8-b.x*scale),Math.min(dx,Math.floor(492-(b.x+b.w)*scale)));
   dy=Math.max(Math.ceil(8-b.y*scale),Math.min(dy,Math.floor(492-(b.y+b.h)*scale)));
   const cl=Math.max(0,-dx),ct=Math.max(0,-dy),cw=Math.min(w-cl,cell-Math.max(dx,0)),ch=Math.min(h-ct,cell-Math.max(dy,0));
   const crop=await sharp(resized).extract({left:cl,top:ct,width:cw,height:ch}).png().toBuffer();
   const png=await sharp({create:{width:cell,height:cell,channels:4,background:'#00000000'}}).composite([{input:crop,left:Math.max(0,dx),top:Math.max(0,dy)}]).png().toBuffer();
   const px=await sharp(png).ensureAlpha().raw().toBuffer(),fb=bounds(px,cell,cell,job.effect?noise:127);let edges=0;
   for(let n=0;n<cell;n++)for(const p of[n,499*500+n,n*500,n*500+499])if(px[p*4+3]>127)edges++;
   if(edges)throw Error('Export clips frame '+source+' '+i);
   frames.push(png);records.push({source:[box.left,box.top,box.width,box.height],sourceSeparation:split?'components':'grid',sourceEdgePixels:0,edgePixels:edges,bounds:fb,grip:job.effect?null:grip(px,cell,cell,fb,left),offset:[dx,dy],sha256:sha(png)});
  }
  if(new Set(records.map(r=>r.sha256)).size!==6)throw Error('Repeated frame '+source);
  const dest=join('production/sprites/final',id+(job.effect?'-fx':''));mkdirSync(dest,{recursive:true});
  const masters=join(root,'tiras',view);mkdirSync(masters,{recursive:true});
  const strip=await sharp({create:{width:3000,height:500,channels:4,background:'#00000000'}}).composite(frames.map((input,i)=>({input,left:i*500,top:0}))).png().toBuffer();
  const png=join(masters,job.name+'.png'),file=join(dest,job.name+'.webp');writeFileSync(png,strip);await sharp(strip).webp({quality:96,alphaQuality:100,effort:5}).toFile(file);
  manifest[job.effect?'effects':'sequences'].push({name:job.name,source,sourceSha256:sha(readFileSync(source)),file,png,sha256:sha(readFileSync(file)),scale,frames:records});
  if(job.effect){const l=Math.max(0,Math.min(...records.map(r=>r.bounds.x))-3),t=Math.max(0,Math.min(...records.map(r=>r.bounds.y))-3),r=Math.min(500,Math.max(...records.map(r=>r.bounds.x+r.bounds.w))+3),b=Math.min(500,Math.max(...records.map(r=>r.bounds.y+r.bounds.h))+3);manifest.crops[job.name]=[l,t,r-l,b-t].map(v=>v*768/500);}
  console.log(view+'/'+job.name+' — 6 unique poses; scale '+scale.toFixed(3));
  } catch(error) { issues.push({view,name:job.name,error:error.message});console.error(error.message);if(!partial)throw error; }
 }
 manifests[view]=manifest;writeFileSync(join(root,'manifest-'+view+'.json'),JSON.stringify(manifest,null,2)+'\n');
}
writeFileSync('src/data/zanata-art.js','// Generated frame bounds for separately drawn native directions.\nexport const ZANATA_ART = '+JSON.stringify(Object.fromEntries(Object.entries(manifests).map(([k,m])=>[k,{crops:m.crops,frames:Object.fromEntries(m.sequences.map(s=>[s.name,s.frames.map(f=>({bounds:f.bounds,grip:f.grip}))]))}])),null,2)+';\n');

writeFileSync(join(root,'validation-issues.json'),JSON.stringify(issues,null,2)+'\n');if(issues.length)process.exitCode=1;
