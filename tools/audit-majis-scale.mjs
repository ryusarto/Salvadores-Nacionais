import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readRgbaPng, alphaBounds, upperSkinLandmark } from './lib/png-rgba.js';

const root='production/sprites/source/majis-v2/';
const file=root+'manifest.json',manifest=JSON.parse(fs.readFileSync(file));
const baseline='1ada7ceb9af48c644202224d519bdff8af9b173f';
const hash=data=>createHash('sha256').update(data).digest('hex');
const checks=[];
for(const action of manifest.sequences){
  const frames=[],hashes=[];let transparentCorners=true;
  for(let i=1;i<=4;i++){
    const image=readRgbaPng(fs.readFileSync(`${root}quadros-768/${action.name}-${i}.png`));
    frames.push(alphaBounds(image));hashes.push(hash(image.pixels));
    const {width:w,height:h,pixels:p}=image;
    transparentCorners&&=[3,(w-1)*4+3,(h-1)*w*4+3,(w*h-1)*4+3].every(index=>p[index]===0);
  }
  action.hashes=hashes;action.uniqueFrames=new Set(hashes).size;
  action.runtimeSha256=hash(fs.readFileSync(`production/sprites/final/${action.extra?'majis-fx':'majis'}/${action.name}.webp`));
  checks.push({name:action.name,size:[3072,768],frames,uniqueFrames:action.uniqueFrames,inside:frames.every(b=>b.x>0&&b.y>0&&b.x+b.w<768&&b.bottom<767),transparentCorners});
}
manifest.frameHashAlgorithm='sha256-rgba8';
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
const standing=checks.find(a=>a.name==='parado').frames[0];
const corrected=manifest.sequences.filter(a=>a.scaleCorrection).map(action=>{
  const file=`${root}quadros-768/${action.name}-1.png`;
  const old=readRgbaPng(execFileSync('git',['show',baseline+':'+file],{maxBuffer:10*1024*1024}));
  return {name:action.name,factor:action.scaleCorrection.factor,scale:action.scale,beforeHeight:alphaBounds(old).h,afterHeight:checks.find(c=>c.name===action.name).frames[0].h,headLandmark:upperSkinLandmark(readRgbaPng(fs.readFileSync(file)))};
});
const report={character:'majis',cell:[768,768],foot:[384,700],strips:48,frames:192,passed:checks.every(c=>c.uniqueFrames===4&&c.inside&&c.transparentCorners),standing,checks,scaleReview:{reference:'parado',baselineCommit:baseline,alphaThreshold:127,corrected,method:'One uniform scale per complete four-frame sequence, re-exported from preserved source boards around (384,700). No runtime per-action scaling.'}};
fs.writeFileSync('production/qa/majis-validacao.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,standingHeight:standing.h,corrected:corrected.map(c=>({name:c.name,before:c.beforeHeight,after:c.afterHeight}))},null,2));
if(!report.passed)process.exitCode=1;
