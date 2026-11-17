// Build candidates from generated matrices. Never writes production assets automatically.
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { splitPosesGrid, extractPose } from './lib/sprite-components.mjs';
const arg=(name)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
if(!arg('source')||!arg('out'))throw Error('Required: --source=production-folder --out=candidate-folder');
const source=resolve(arg('source')),out=resolve(arg('out')),scale=.86;
const inventory=JSON.parse(readFileSync(join(source,'inventory.json')));
const results=[];
for(const item of inventory.inventory){
 const {action,direction}=item;
 const paths=[1,2,3].map(i=>join(source,'matrizes',direction,action,'grupo-'+i+'.png'));
 if(action==='parado'&&direction==='left'&&!existsSync(paths[0]))paths[0]=join(source,'left-master.png');
 if(!paths.every(existsSync)){results.push({...item,status:'pending'});continue;}
 try{
  const frames=[],metadata=[];let index=0;
  for(const path of paths){
   const {data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const split=splitPosesGrid(data,info.width,info.height,4,1);
   const baseline=info.height-6,cell=info.width/4;
   for(let k=0;k<4;k++){
    const box=split.boxes[k];if(box.clipped)throw Error('source-boundary clipping in group '+(index/4+1));
    const pixels=extractPose(data,info.width,info.height,split,k);
    const width=Math.round(box.width*scale),height=Math.round(box.height*scale);
    const left=Math.round(384+(box.left-(k+.5)*cell)*scale),top=Math.round(700+(box.top-baseline)*scale);
    if(left<0||top<0||left+width>768||top+height>768)throw Error('pose does not fit fixed-scale cell: frame '+index);
    const cut=await sharp(pixels,{raw:{width:box.width,height:box.height,channels:4}}).resize(width,height,{kernel:'lanczos3'}).png().toBuffer();
    const frame=await sharp({create:{width:768,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:cut,left,top}]).png().toBuffer();
    const visible=await sharp(frame).raw().toBuffer();for(let i=0;i<visible.length;i+=4)if(visible[i+3]===0)visible.fill(0,i,i+3);
    metadata.push({index,sha256:createHash('sha256').update(visible).digest('hex'),source:box,scale,placement:[left,top,width,height]});frames.push(frame);index++;
   }
  }
  if(new Set(metadata.map(f=>f.sha256)).size!==12)throw Error('duplicate visible drawings');
  const dir=join(out,direction);mkdirSync(dir,{recursive:true});
  const strip=await sharp({create:{width:9216,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames.map((input,i)=>({input,left:i*768,top:0}))).png().toBuffer();
  writeFileSync(join(dir,action+'.png'),strip);
  await sharp(strip).webp({lossless:true,effort:5}).toFile(join(dir,action+'.webp'));
  results.push({...item,status:'candidate-needs-visual-review',frames:metadata});
 }catch(error){results.push({...item,status:'rejected',reason:error.message});}
 mkdirSync(out,{recursive:true});writeFileSync(join(out,'manifest.json'),JSON.stringify({...inventory,inventory:results},null,2));
}
mkdirSync(out,{recursive:true});writeFileSync(join(out,'manifest.json'),JSON.stringify({...inventory,inventory:results},null,2));
console.log(JSON.stringify(results.reduce((a,x)=>(a[x.status]=(a[x.status]||0)+1,a),{})));
