/** Validate real banner attachment geometry and decoded alpha, independently of placement helpers. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cameras=[0,340,680],alphaRadius=5,alphaThreshold=12,maxTolerance=8;
const stageArgs=process.argv.slice(2).filter(a=>!a.startsWith('--report='));
const stages=stageArgs.length?stageArgs:['belem','palco','banheiros'];
const reportPath=resolve(root,process.argv.find(a=>a.startsWith('--report='))?.slice(9)||'production/qa/stage-hangings.json');
assert.ok(stages.every(id=>['belem','palco','banheiros'].includes(id)),'Usage: node tools/check-stage-hangings.mjs [belem] [palco] [banheiros]');
const isHanging=asset=>asset.startsWith('bandeirolas-')||asset==='bandeira-trans-vento';
const finite=(v,fallback)=>Number.isFinite(v)?v:fallback;
const pair=(value,label)=>{
 assert.ok(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite),`${label}: expected two finite coordinates`);
 return value;
};
const imageCache=new Map();
async function raster(stage,pack,key){
 const cacheKey=stage+'/'+key;
 if(!imageCache.has(cacheKey))imageCache.set(cacheKey,(async()=>{
  const asset=pack.assets[key];assert.ok(asset,`${key}: missing asset metadata`);
  const {data,info}=await sharp(join(root,'production/stages',stage,asset.path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const frames=asset.frames??1,cellWidth=asset.cellWidth??info.width/frames,cellHeight=asset.cellHeight??info.height;
  assert.ok(Number.isInteger(frames)&&frames>0,`${key}: invalid frames`);
  assert.ok(Number.isInteger(cellWidth)&&cellWidth>0&&Number.isInteger(cellHeight)&&cellHeight>0,`${key}: invalid cell dimensions`);
  assert.equal(info.channels,4,`${key}: decoded RGBA required`);
  assert.equal(info.width,cellWidth*frames,`${key}: horizontal strip width differs`);
  assert.equal(info.height,cellHeight,`${key}: strip height differs`);
  const crop=asset.crop??[0,0,cellWidth,cellHeight];
  assert.ok(Array.isArray(crop)&&crop.length===4&&crop.every(Number.isFinite),`${key}: invalid crop`);
  const [sx,sy,sw,sh]=crop;
  assert.ok(sx>=0&&sy>=0&&sw>0&&sh>0&&sx+sw<=cellWidth&&sy+sh<=cellHeight,`${key}: crop exceeds the cell`);
  return {data,info,frames,cellWidth,cellHeight,crop};
 })());
 return imageCache.get(cacheKey);
}
function placement(object,image,camera){
 const [, ,sw,sh]=image.crop;
 const h=object.h??(object.w?object.w*sh/sw:sh),w=object.w??h*sw/sh;
 assert.ok([object.x,object.y,w,h].every(Number.isFinite)&&w>0&&h>0,`${object.id}: invalid placement`);
 return {x:object.x-camera*finite(object.factor,1)-w/2,y:object.y-h,w,h};
}
function sourceToScreen(object,image,source,camera){
 const box=placement(object,image,camera),[sx,sy,sw,sh]=image.crop;
 return [box.x+(source[0]-sx)*box.w/sw,box.y+(source[1]-sy)*box.h/sh];
}
function supportSource(image,uv){
 assert.ok(uv.every(v=>v>=0&&v<=1),'support uv is outside its normalized crop');
 const [sx,sy,sw,sh]=image.crop;
 return [sx+uv[0]*sw,sy+uv[1]*sh];
}
function nearestAlpha(image,source,frame){
 const [cx,cy]=source,[sx,sy,sw,sh]=image.crop;
 let nearest=null;
 // Restrict the search to pixels actually painted by the crop, not neighboring hidden pixels.
 for(let y=Math.max(0,Math.floor(cy-alphaRadius));y<=Math.min(image.cellHeight-1,Math.ceil(cy+alphaRadius));y++){
  for(let x=Math.max(0,Math.floor(cx-alphaRadius));x<=Math.min(image.cellWidth-1,Math.ceil(cx+alphaRadius));x++){
   if(x<sx||y<sy||x>=sx+sw||y>=sy+sh)continue;
   const distance=Math.hypot(x-cx,y-cy);if(distance>alphaRadius)continue;
   const alpha=image.data[(y*image.info.width+x+frame*image.cellWidth)*4+3];
   if(alpha>alphaThreshold&&(!nearest||distance<nearest.distance))nearest={x,y,alpha,distance};
  }
 }
 return nearest;
}
function checkPhysicalAnchor(image,source,label){
 const [sx,sy,sw,sh]=image.crop;
 assert.ok(source[0]>=sx&&source[0]<=sx+sw&&source[1]>=sy&&source[1]<=sy+sh,`${label}: anchor is outside its drawn crop`);
 const samples=[];
 for(let frame=0;frame<image.frames;frame++){
  const pixel=nearestAlpha(image,source,frame);
  assert.ok(pixel,`${label}: no visible alpha within ${alphaRadius}px in frame ${frame}`);
  samples.push({frame,...pixel});
 }
 return samples;
}

const report={status:'pass',cameras,worldToleranceMax:maxTolerance,alphaRadius,alphaThreshold,stages:[],errors:[]};
for(const stage of stages){
 const result={stage,hangings:[]};report.stages.push(result);
 try{
  const pack=JSON.parse(readFileSync(join(root,'production/stages',stage,'manifest.json'),'utf8'));
  assert.ok(Array.isArray(pack.objects),`${stage}: missing objects`);
  const byId=new Map();
  for(const object of pack.objects){
   assert.ok(typeof object.id==='string'&&object.id,`${stage}: object without id`);
   assert.ok(!byId.has(object.id),`${stage}: duplicate object id ${object.id}`);byId.set(object.id,object);
  }
  const hangings=pack.objects.filter(o=>isHanging(o.asset));
  assert.ok(hangings.length,`${stage}: no hanging objects to verify`);
  for(const object of hangings){
   const entry={id:object.id,asset:object.asset,anchors:[]};result.hangings.push(entry);
   try{
    const suspension=object.suspension;
    assert.ok(suspension&&Array.isArray(suspension.anchors)&&suspension.anchors.length===2,`${object.id}: exactly two suspension anchors required`);
    assert.ok(Number.isFinite(suspension.tolerance)&&suspension.tolerance>0&&suspension.tolerance<=maxTolerance,`${object.id}: tolerance must be >0 and <=${maxTolerance}px`);
    const banner=await raster(stage,pack,object.asset);
    for(const [index,anchor] of suspension.anchors.entries()){
     const support=byId.get(anchor.objectId);
     assert.ok(support,`${object.id} anchor ${index}: support id ${anchor.objectId} was not found`);
     assert.notEqual(support.id,object.id,`${object.id}: hanging cannot support itself`);
     assert.equal(finite(support.factor,1),finite(object.factor,1),`${object.id}: support parallax differs`);
     const uv=pair(anchor.uv,`${object.id} support uv`),sprite=pair(anchor.sprite,`${object.id} sprite anchor`);
     const supportImage=await raster(stage,pack,support.asset),source=supportSource(supportImage,uv);
     const spriteAlpha=checkPhysicalAnchor(banner,sprite,`${object.id} anchor ${index} banner`);
     const supportAlpha=checkPhysicalAnchor(supportImage,source,`${object.id} anchor ${index} support ${support.id}`);
     const distances=cameras.map(camera=>{
      const bannerPoint=sourceToScreen(object,banner,sprite,camera),supportPoint=sourceToScreen(support,supportImage,source,camera);
      const distance=Math.hypot(bannerPoint[0]-supportPoint[0],bannerPoint[1]-supportPoint[1]);
      assert.ok(distance<=suspension.tolerance,`${object.id} anchor ${index}: ${distance.toFixed(3)}px gap at camera ${camera} exceeds ${suspension.tolerance}px`);
      return {camera,distance,bannerPoint,supportPoint};
     });
     entry.anchors.push({objectId:support.id,supportAsset:support.asset,uv,sprite,supportSource:source,distances,spriteAlpha,supportAlpha});
    }
    entry.status='pass';
   }catch(error){entry.status='fail';entry.error=error.message;report.errors.push(`${stage}: ${error.message}`);}
  }
 }catch(error){report.errors.push(`${stage}: ${error.message}`);}
}
report.status=report.errors.length?'fail':'pass';
mkdirSync(dirname(reportPath),{recursive:true});
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,stages:report.stages.map(s=>({stage:s.stage,hangings:s.hangings.length,anchors:s.hangings.reduce((n,h)=>n+h.anchors.length,0)})),errors:report.errors}));
assert.deepEqual(report.errors,[],'Physical hanging QA failed; see production/qa/stage-hangings.json');
