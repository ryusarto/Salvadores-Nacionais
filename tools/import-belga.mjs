// Slice one six-frame animation per source image. No drawing is synthesized here.
// npm ci; node tools/import-belga.mjs [--partial]
import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root='production/sprites/source/belga-v2';
const config=JSON.parse(readFileSync(join(root,'PLANO.json')));
const plan=config.animations;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const size=500,foot=[250,456],N=6;
const manifest={character:'belga',version:2,frames:N,cell:size,foot,grid:[3,2],
  sourceCell:512,upscaled:false,calibration:'One uniform scale per animation, calibrated from the visible face in its first frame; no per-pose height stretching.',
  sequences:[],effects:[],crops:{}};
const bounds=(pixels,w,h)=>{let l=w,t=h,r=-1,b=-1,opaque=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>127){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);opaque++;}return{x:l,y:t,w:r-l+1,h:b-t+1,bottom:b,opaque};};
for(const job of plan){
  if(!job.source){if(process.argv.includes('--partial'))continue;throw Error('Missing source: '+job.name);}
  const source=join(root,job.source),meta=await sharp(source).metadata();
  if(meta.width!==1536||meta.height!==1024)throw Error('Source must supply six native 512px cells: '+job.name);
  const scale=job.effect?.9:Math.min(.95,config.referenceScale*Math.sqrt(config.referenceFaceArea/job.faceArea));
  if(!(scale>0&&scale<=1))throw Error('Invalid calibration: '+job.name);
  const frameBuffers=[],records=[];
  for(let i=0;i<N;i++){
    const x=(i%3)*512,y=Math.floor(i/3)*512;
    const raw=await sharp(source).extract({left:x,top:y,width:512,height:512}).ensureAlpha().raw().toBuffer();
    const sourceCorners=[0,511,511*512,512*512-1].map(p=>raw[p*4+3]);
    if(sourceCorners.some(a=>a>3))throw Error('Background alpha must be repaired with image_gen: '+job.name+' '+i+' '+sourceCorners);
    let sourceEdgePixels=0;for(let n=0;n<512;n++)for(const p of[n,511*512+n,n*512,n*512+511])if(raw[p*4+3]>127)sourceEdgePixels++;
    if(sourceEdgePixels)throw Error('Source drawing touches cell edge; regenerate: '+job.name+' '+i);
    // Canonical transparent RGB and removal of 1/255 alpha export noise.
    for(let p=0;p<raw.length;p+=4)if(raw[p+3]<=3){raw[p]=raw[p+1]=raw[p+2]=raw[p+3]=0;}
    const b=bounds(raw,512,512),width=Math.round(512*scale),height=width;
    const resized=await sharp(raw,{raw:{width:512,height:512,channels:4}}).resize(width,height).png().toBuffer();
    const dx=Math.round(foot[0]-256*scale),dy=Math.round(foot[1]-(b.bottom+1)*scale);
    if(dx<0||dy<0||dx+width>size||dy+height>size){
      // Only crop transparent padding outside the 500px destination.
      const left=Math.max(0,-dx),top=Math.max(0,-dy),cw=Math.min(width-left,size-Math.max(dx,0)),ch=Math.min(height-top,size-Math.max(dy,0));
      const trimmed=await sharp(resized).extract({left,top,width:cw,height:ch}).png().toBuffer();
      frameBuffers.push(await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:trimmed,left:Math.max(0,dx),top:Math.max(0,dy)}]).png().toBuffer());
    }else frameBuffers.push(await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:resized,left:dx,top:dy}]).png().toBuffer());
    const pixels=await sharp(frameBuffers[i]).ensureAlpha().raw().toBuffer(),bb=bounds(pixels,size,size);
    let edgePixels=0;for(let n=0;n<size;n++)for(const pos of[n,(size-1)*size+n,n*size,n*size+size-1])if(pixels[pos*4+3]>127)edgePixels++;
    if(edgePixels)throw Error('Clipped drawing '+job.name+' '+i);
    records.push({source:[x,y,512,512],sourceEdgePixels,scale,offset:[dx,dy],bounds:bb,edgePixels,alphaMin:Math.min(...[pixels[3],pixels[(size*size-1)*4+3]]),sha256:hash(frameBuffers[i])});
  }
  mkdirSync(join(root,'tiras'),{recursive:true});mkdirSync(join(root,'pranchas'),{recursive:true});
  const strip=await sharp({create:{width:size*N,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frameBuffers.map((input,i)=>({input,left:i*size,top:0}))).png().toBuffer();
  writeFileSync(join(root,'tiras',job.name+'.png'),strip);
  await sharp({create:{width:size*3,height:size*2,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frameBuffers.map((input,i)=>({input,left:i%3*size,top:Math.floor(i/3)*size}))).png().toFile(join(root,'pranchas',job.name+'.png'));
  const folder='production/sprites/final/'+(job.effect?'belga-fx':'belga');mkdirSync(folder,{recursive:true});
  const file=join(folder,job.name+'.webp');await sharp(strip).webp({quality:96,alphaQuality:100,effort:5}).toFile(file);
  const entry={name:job.name,source:job.source,sourceSha256:hash(readFileSync(source)),faceArea:job.faceArea,scale,frames:records,file,sha256:hash(readFileSync(file)),png:join(root,'tiras',job.name+'.png'),pngSha256:hash(strip),sheet:join(root,'pranchas',job.name+'.png')};
  manifest[job.effect?'effects':'sequences'].push(entry);
  if(job.effect){const l=Math.max(0,Math.min(...records.map(f=>f.bounds.x))-3),t=Math.max(0,Math.min(...records.map(f=>f.bounds.y))-3),r=Math.min(size,Math.max(...records.map(f=>f.bounds.x+f.bounds.w))+3),b=Math.min(size,Math.max(...records.map(f=>f.bounds.y+f.bounds.h))+3);manifest.crops[job.name]=[l,t,r-l,b-t].map(v=>v*768/size);}
  console.log(job.name+' — 6 × 500px, scale '+scale.toFixed(3));
}
writeFileSync(join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
if(!process.argv.includes('--partial'))writeFileSync('src/data/belga-art.js','// Six-frame effect crops in canonical 768px coordinates.\nexport const BELGA_ART_CROPS = '+JSON.stringify(manifest.crops,null,2)+';\n');
