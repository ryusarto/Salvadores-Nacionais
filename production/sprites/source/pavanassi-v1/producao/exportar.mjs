import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spriteColumns,atlasHashes} from './grade.mjs';
const root=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const plan=JSON.parse(await fs.readFile(root+'/producao/plano.json','utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function bounds(data,w,h){
 let l=w,t=h,r=-1,b=-1,count=0,edge=0,zero=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=data[(y*w+x)*4+3];if(!a)zero++;if(a>24){count++;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);if(!x||!y||x===w-1||y===h-1)edge++}}
 return {l,t,w:r-l+1,h:b-t+1,b,count,edge,zeroFraction:zero/(w*h)};
}
const partitions=new Map();
async function frame(file,i){
 const m=await sharp(file).metadata();
 if(!partitions.has(file)){const raw=await sharp(file).ensureAlpha().raw().toBuffer();partitions.set(file,spriteColumns(raw,m.width,m.height));}
 const cuts=partitions.get(file),l=cuts[i],r=cuts[i+1];
 const out=await sharp(file).extract({left:l,top:0,width:r-l,height:m.height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 return {...out,b:bounds(out.data,out.info.width,out.info.height),file,index:i,centerX:m.width*(i+.5)/3-l,sourceCut:[l,r],sourceSize:[m.width,m.height],sourceAspect:m.width/m.height};
}
async function exists(file){try{await fs.access(file);return true}catch{return false}}
const previous=await exists(root+'/manifest.json')?JSON.parse(await fs.readFile(root+'/manifest.json','utf8')):null;
const manifest={...plan,tool:'built-in image_gen',status:'production',animations:[],effects:previous?.effects||[],missing:[],warnings:[],expectedAnimations:plan.actions.length*2,expectedDrawings:plan.actions.length*12,standingHeight:400,mirroring:false};
for(const side of plan.sides){
 const idle=await frame(root+'/originais/'+side+'/parado/grupo-1.png',0),bodyRatio=idle.b.h/idle.info.height;
 for(const a of plan.actions){
  const files=[1,2].map(g=>root+'/originais/'+side+'/'+a.action+'/grupo-'+g+'.png');
  if(!(await exists(files[0]))||!(await exists(files[1]))){manifest.missing.push(side+'/'+a.action);continue}
  const stamp=(await Promise.all(files.map(async p=>(await fs.stat(p)).mtimeMs))).join(':');
  const old=previous?.animations.find(o=>o.side===side&&o.action===a.action);
  if(old?.sourceStamp===stamp&&!process.argv.includes('--force')){manifest.animations.push(old);continue}
  const frames=[];for(const file of files)for(let i=0;i<3;i++)frames.push(await frame(file,i));
  const warnings=[];
  for(let i=0;i<6;i++){const f=frames[i];if(Math.abs(f.sourceAspect-3)>.1)warnings.push('source-grid-'+(i+1));if(f.b.zeroFraction<.1)throw Error('Opaque source '+f.file);if(f.b.count<1000)throw Error('Empty frame '+f.file);if(f.b.edge>5)warnings.push('source-edge-'+(i+1))}
  const fit=Math.min(1,...frames.map(f=>Math.min(460/(f.b.w*400/(bodyRatio*f.info.height)),416/(f.b.h*400/(bodyRatio*f.info.height)))));
  if(fit<.98)warnings.push('action-fit-'+fit.toFixed(4));
  const dir=root+'/quadros/'+side+'/'+a.action;
  for(const d of [dir,root+'/tiras/'+side,root+'/mestres-768/'+side,root+'/pranchas/'+side,root+'/runtime/'+(side==='right'?'pavanassi':'pavanassi-esquerda')])await fs.mkdir(d,{recursive:true});
  const cells=[],masters=[],meta=[];
  for(let i=0;i<6;i++){
   const f=frames[i],scale=400/(bodyRatio*f.info.height)*fit;
   if(scale>1.001)warnings.push('insufficient-native-resolution-'+(i+1));
   const crop=sharp(f.data,{raw:f.info}).extract({left:f.b.l,top:f.b.t,width:f.b.w,height:f.b.h});
   const w=Math.max(1,Math.round(f.b.w*scale)),h=Math.max(1,Math.round(f.b.h*scale));
   const piece=await crop.clone().resize(w,h).png().toBuffer(),x=Math.max(10,Math.min(490-w,Math.round(250+(f.b.l-f.centerX)*scale)));
   const cell=await sharp({create:{width:500,height:500,channels:4,background:'#00000000'}}).composite([{input:piece,left:x,top:456-h}]).png().toBuffer();
   await fs.writeFile(dir+'/'+String(i+1).padStart(2,'0')+'.png',cell);cells.push(cell);
   const mw=Math.round(f.b.w*scale*768/500),mh=Math.round(f.b.h*scale*768/500),masterPiece=await crop.clone().resize(mw,mh).png().toBuffer();
   const mx=Math.max(15,Math.min(753-mw,Math.round(384+(f.b.l-f.centerX)*scale*768/500)));
   masters.push(await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite([{input:masterPiece,left:mx,top:700-mh}]).png().toBuffer());
   const qraw=await sharp(cell).raw().toBuffer();meta.push({frame:i+1,source:files[Math.floor(i/3)].slice(root.length+1),sourceCell:i%3,sourceCut:f.sourceCut,sourceBounds:f.b,physicalScale:scale,sha256:hash(qraw),bounds:bounds(qraw,500,500)});
  }
  const strip=await sharp({create:{width:3000,height:500,channels:4,background:'#00000000'}}).composite(cells.map((input,i)=>({input,left:i*500,top:0}))).png().toBuffer();
  await atlasHashes(sharp,strip,meta);await fs.writeFile(root+'/tiras/'+side+'/'+a.action+'.png',strip);
  await sharp({create:{width:4608,height:768,channels:4,background:'#00000000'}}).composite(masters.map((input,i)=>({input,left:i*768,top:0}))).png().toFile(root+'/mestres-768/'+side+'/'+a.action+'.png');
  await sharp({create:{width:1500,height:1000,channels:4,background:'#00000000'}}).composite(cells.map((input,i)=>({input,left:i%3*500,top:Math.floor(i/3)*500}))).png().toFile(root+'/pranchas/'+side+'/'+a.action+'.png');
  const runtime='runtime/'+(side==='right'?'pavanassi':'pavanassi-esquerda')+'/'+a.action+'.webp';
  await sharp(strip).webp({lossless:true,effort:4}).toFile(root+'/'+runtime);
  const unique=new Set(meta.map(m=>m.sha256)).size;if(unique!==6)warnings.push('duplicate-frame');
  manifest.animations.push({side,action:a.action,name:a.name,loop:a.loop,frames:6,cell:[500,500],foot:[250,456],file:'tiras/'+side+'/'+a.action+'.png',runtime,board:'pranchas/'+side+'/'+a.action+'.png',master:'mestres-768/'+side+'/'+a.action+'.png',sourceStamp:stamp,sourceSheets:files.map(f=>f.slice(root.length+1)),uniqueFrames:unique,warnings,frameMeta:meta});
  console.log(side+'/'+a.action+' — 6 frames'+(warnings.length?' — '+warnings.join(', '):''));
 }
}
manifest.generatedAnimations=manifest.animations.length;manifest.generatedDrawings=manifest.animations.length*6;
manifest.complete=manifest.missing.length===0;manifest.status=manifest.complete?'art-review':'in-progress';
manifest.warnings=manifest.animations.filter(a=>a.warnings.length).map(a=>({side:a.side,action:a.action,warnings:a.warnings}));
await fs.writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2));
const gallery=await fs.readFile(root+'/producao/previa-template.html','utf8');
await fs.writeFile(root+'/previa.html',gallery.replace('__DATA__',JSON.stringify(manifest)));
console.log(JSON.stringify({animations:manifest.generatedAnimations,expected:manifest.expectedAnimations,drawings:manifest.generatedDrawings,missing:manifest.missing.length,warnings:manifest.warnings.length}));
