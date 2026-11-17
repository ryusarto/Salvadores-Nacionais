// Validate the complete, visually approved package before replacing any runtime art.
import sharp from 'sharp';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import franco from '../src/data/characters/franco.js';
import {STATE_ANIMS} from '../src/render/anim.js';
const option=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
if(!option('source')||!option('review'))throw Error('Required: --source=candidate-folder --review=review.json [--apply]');
const source=resolve(option('source')),review=JSON.parse(readFileSync(resolve(option('review'))));
const manifest=JSON.parse(readFileSync(join(source,'manifest.json')));
const names=[...Object.keys(STATE_ANIMS),...Object.entries(franco.moves).flatMap(([k,m])=>['golpe-'+k,...(m.turbo?['golpe-'+k+'-turbo']:[])])];
const required=['right','left'].flatMap(direction=>names.map(action=>({direction,action})));
const issues=[];
if(manifest.cell?.[0]!==768||manifest.cell?.[1]!==768||manifest.foot?.[0]!==384||manifest.foot?.[1]!==700||manifest.framesPerAction!==12)issues.push('Invalid cell, foot or drawing count contract');
for(const {direction,action} of required){
 const key=direction+'/'+action,item=manifest.inventory.find(i=>i.direction===direction&&i.action===action),approval=review[key];
 if(!item||item.status!=='candidate-needs-visual-review'||item.frames?.length!==12){issues.push(key+': sequence missing or rejected');continue;}
 if(approval?.status!=='approved'||!approval.pngSha256||approval.pngSha256!==item.pngSha256)issues.push(key+': visual approval missing or stale');
}
if(manifest.inventory.length!==required.length)issues.push('Unexpected or duplicate inventory entries');
if(issues.length)throw Error('Package not ready; runtime unchanged:\n'+issues.join('\n'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const visible=b=>{for(let i=0;i<b.length;i+=4)if(b[i+3]===0)b.fill(0,i,i+3);return b;};
const validated=[];
for(const {direction,action} of required){
 const key=direction+'/'+action,item=manifest.inventory.find(i=>i.direction===direction&&i.action===action);
 const png=join(source,direction,action+'.png'),webp=join(source,direction,action+'.webp'),first=join(source,direction,'__first-'+action+'.webp');
 const bytes=readFileSync(png);
 if(sha(bytes)!==item.pngSha256)throw Error(key+': PNG changed after approval');
 for(const file of [png,webp,first]){
  const m=await sharp(file).metadata(),expectedWidth=file===first?768:9216;
  if(m.width!==expectedWidth||m.height!==768||!m.hasAlpha)throw Error(key+': invalid dimensions or alpha: '+file);
 }
 const pixels=visible(await sharp(bytes).ensureAlpha().raw().toBuffer());
 const encoded=visible(await sharp(webp).ensureAlpha().raw().toBuffer());
 if(!pixels.equals(encoded))throw Error(key+': runtime compression changed visible pixels');
 const hashes=[];
 for(let index=0;index<12;index++){
  const frame=visible(await sharp(bytes).extract({left:index*768,top:0,width:768,height:768}).ensureAlpha().raw().toBuffer());
  const hash=sha(frame);hashes.push(hash);
  if(hash!==item.frames[index].sha256)throw Error(key+': drawing hash mismatch at '+index);
  if(index===0){const poster=visible(await sharp(first).ensureAlpha().raw().toBuffer());if(!poster.equals(frame))throw Error(key+': first drawing is not exact');}
 }
 if(new Set(hashes).size!==12)throw Error(key+': duplicate drawings');
 validated.push({action,direction,frames:12,cell:[768,768],foot:[384,700],png:direction+'/'+action+'.png',pngSha256:item.pngSha256,webpSha256:sha(readFileSync(webp)),firstSha256:sha(readFileSync(first)),frameSha256:hashes,status:'approved',files:[webp,first]});
}
console.log('Validated '+validated.length+' strips / '+validated.length*12+' distinct drawings.');
if(!process.argv.includes('--apply')){console.log('Review only: runtime unchanged. Add --apply to integrate this exact package.');process.exit(0);}
const repo=fileURLToPath(new URL('..',import.meta.url));
for(const item of validated){
 const id=item.direction==='right'?'franco':'franco-esquerda',dir=join(repo,'production/sprites/final',id);mkdirSync(dir,{recursive:true});
 copyFileSync(item.files[0],join(dir,item.action+'.webp'));copyFileSync(item.files[1],join(dir,'__first-'+item.action+'.webp'));
}
const target=join(repo,'production/sprites/source/franco-v6');mkdirSync(target,{recursive:true});
writeFileSync(join(target,'manifest.json'),JSON.stringify({character:'franco',cell:[768,768],foot:[384,700],framesPerAction:12,nativeDrawings:true,upscaled:false,independentFacing:true,scale:.86,missingMovements:[],inventory:validated.map(({files,...item})=>item)},null,2)+'\n');
console.log('Complete approved package integrated. Character activation and game verification still required.');
