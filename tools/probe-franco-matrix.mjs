import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {splitPosesGrid,extractPose} from './lib/sprite-components.mjs';
/** Mechanical checks only; anatomy and continuity still require visual review. */
export async function probeFrancoMatrix(path){
 const input=readFileSync(path),{data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.height<600)throw Error('Native matrix is too small for the HD contract');
 let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]===0)transparent++;
 if(transparent<info.width*info.height*.05)throw Error('Background is opaque; actual alpha0 required');
 const split=splitPosesGrid(data,info.width,info.height,4,1);
 if(split.boxes.some(box=>box.clipped))throw Error('Drawing clipped at source edge');
 const hashes=split.boxes.map((_,index)=>{
  const pixels=extractPose(data,info.width,info.height,split,index);
  for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]===0)pixels.fill(0,i,i+3);
  return createHash('sha256').update(pixels).digest('hex');
 });
 if(new Set(hashes).size!==4)throw Error('Duplicate drawings');
 return {width:info.width,height:info.height,transparentFraction:transparent/(info.width*info.height),drawings:4,sourceSha256:createHash('sha256').update(input).digest('hex'),boxes:split.boxes};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const path=process.argv.find(v=>v.startsWith('--source='))?.slice(9);if(!path)throw Error('Required: --source=matrix.png');console.log(JSON.stringify(await probeFrancoMatrix(path)));}
 catch(error){console.error(JSON.stringify({ok:false,reason:error.message}));process.exitCode=1;}
}
