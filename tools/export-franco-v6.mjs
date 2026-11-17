// Build candidates from generated matrices. Never writes production assets automatically.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, rmSync, statfsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { splitPosesGrid, extractPose } from './lib/sprite-components.mjs';
sharp.cache({memory:8,items:20,files:8});sharp.concurrency(1);
function atomic(path,bytes){const temp=path+'.incoming-'+process.pid;try{writeFileSync(temp,bytes);renameSync(temp,path);}finally{rmSync(temp,{force:true});}}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function requireSpace(path,minimum){
 const stats=statfsSync(path),available=stats.bavail*stats.bsize;
 if(available<minimum){const error=new Error('Export paused: '+Math.floor(available/1024/1024)+' MiB free; keep at least '+minimum/1024/1024+' MiB available. Existing assets are preserved.');error.code='ENOSPC';throw error;}
}
function cachedFilesValid(dir,action,item){
 try{return [[action+'.png',item.pngSha256],[action+'.webp',item.webpSha256],['__first-'+action+'.webp',item.firstSha256]].every(([file,hash])=>hash&&sha(readFileSync(join(dir,file)))===hash);}catch{return false;}
}
const arg=(name)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
if(!arg('source')||!arg('out'))throw Error('Required: --source=production-folder --out=candidate-folder');
const source=resolve(arg('source')),out=resolve(arg('out')),scale=.86;
requireSpace(source,2*1024**3);
const inventory=JSON.parse(readFileSync(join(source,'inventory.json')));
const reviews=existsSync(join(source,'review.json'))?JSON.parse(readFileSync(join(source,'review.json'))):{};
const previous=existsSync(join(out,'manifest.json'))?JSON.parse(readFileSync(join(out,'manifest.json'))).inventory:[];
const results=[];
const same=(a,b)=>a.action===b.action&&a.direction===b.direction;
const checkpoint=()=>{mkdirSync(out,{recursive:true});atomic(join(out,'manifest.json'),JSON.stringify({...inventory,inventory:inventory.inventory.map(item=>results.find(r=>same(r,item))||previous.find(r=>same(r,item))||{...item,status:'pending'})},null,2));};
for(const item of inventory.inventory){
 const {action,direction}=item;
 if((arg('action')&&arg('action')!==action)||(arg('direction')&&arg('direction')!==direction)){
  results.push(previous.find(p=>p.action===action&&p.direction===direction)||item);continue;
 }
 const paths=[1,2,3].map(i=>join(source,'matrizes',direction,action,'grupo-'+i+'.png'));
 if(action==='parado'&&direction==='left'&&!existsSync(paths[0]))paths[0]=join(source,'left-master.png');
 if(!paths.every(existsSync)){results.push({...item,status:'pending'});continue;}
 try{
  const inputs=paths.map(path=>readFileSync(path));
  const review=reviews[direction+'/'+action]||{};
  const sourceHash=createHash('sha256').update('franco-export-v4').update(JSON.stringify({order:review.frameOrder||[],offsets:review.offsets||{}}));
  for(const input of inputs)sourceHash.update(input);
  const sourceSha256=sourceHash.digest('hex'),old=previous.find(p=>p.action===action&&p.direction===direction);
  if(old?.sourceSha256===sourceSha256&&old.status==='candidate-needs-visual-review'&&cachedFilesValid(join(out,direction),action,old)){results.push(old);continue;}
  requireSpace(source,1024**3);
  const frames=[],metadata=[];let index=0;
  for(const input of inputs){
   const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;
   if(transparent<info.width*info.height*.05)throw Error('source background is opaque; regenerate group '+(index/4+1)+' with true alpha');
   const split=splitPosesGrid(data,info.width,info.height,4,1);
   const baseline=info.height-6,cell=info.width/4;
   for(let k=0;k<4;k++){
    const box=split.boxes[k];if(box.clipped)throw Error('source-boundary clipping in group '+(Math.floor(index/4)+1)+', drawing '+(k+1));
    const pixels=extractPose(data,info.width,info.height,split,k);
    const width=Math.round(box.width*scale),height=Math.round(box.height*scale);
    if(action==='parado'&&height<500)throw Error('standing drawing below minimum native resolution');
    const shift=review.offsets?.[index]||[0,0];
    const left=Math.round(384+(box.left-(k+.5)*cell)*scale+shift[0]),top=Math.round(700+(box.top-baseline)*scale+shift[1]);
    if(left<0||top<0||left+width>768||top+height>768)throw Error('pose does not fit fixed-scale cell: frame '+index);
    const cut=await sharp(pixels,{raw:{width:box.width,height:box.height,channels:4}}).resize(width,height,{kernel:'lanczos3'}).png().toBuffer();
    const frame=await sharp({create:{width:768,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left,top}]).png().toBuffer();
    const visible=await sharp(frame).raw().toBuffer();for(let i=0;i<visible.length;i+=4)if(visible[i+3]===0)visible.fill(0,i,i+3);
    metadata.push({index,sha256:createHash('sha256').update(visible).digest('hex'),source:box,scale,placement:[left,top,width,height]});frames.push(frame);index++;
   }
  }
  if(new Set(metadata.map(f=>f.sha256)).size!==12)throw Error('duplicate visible drawings');
  const order=reviews[direction+'/'+action]?.frameOrder;
  if(order){
   if(order.length!==12||new Set(order).size!==12||order.some(i=>!Number.isInteger(i)||i<0||i>=12))throw Error('invalid reviewed frame order');
   const orderedFrames=order.map(i=>frames[i]),orderedMetadata=order.map((i,index)=>({...metadata[i],sourceFrame:i,index}));
   frames.splice(0,12,...orderedFrames);metadata.splice(0,12,...orderedMetadata);
  }
  const dir=join(out,direction);mkdirSync(dir,{recursive:true});
  const strip=await sharp({create:{width:9216,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames.map((input,i)=>({input,left:i*768,top:0}))).png().toBuffer();
  const first=await sharp(frames[0]).webp({lossless:true,effort:5}).toBuffer();
  const encoded=await sharp(strip).webp({lossless:true,effort:5}).toBuffer();
  requireSpace(source,1024**3);
  atomic(join(dir,action+'.png'),strip);atomic(join(dir,'__first-'+action+'.webp'),first);atomic(join(dir,action+'.webp'),encoded);
  results.push({...item,status:'candidate-needs-visual-review',sourceSha256,pngSha256:sha(strip),webpSha256:sha(encoded),firstSha256:sha(first),frames:metadata});
 }catch(error){if(['ENOSPC','EDQUOT','EIO'].includes(error.code))throw error;results.push({...item,status:'rejected',reason:error.message});}
 checkpoint();
}
checkpoint();
console.log(JSON.stringify(results.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{})));
