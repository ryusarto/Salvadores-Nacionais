import sharp from 'sharp';
import {spriteColumns,atlasHashes} from './grade.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(path.dirname(new URL(import.meta.url).pathname),'..'));
const plan=JSON.parse(await fs.readFile(root+'/producao/plano-efeitos.json','utf8'));
const has=async p=>{try{await fs.access(p);return true}catch{return false}};
const bound=(data,w,h)=>{let l=w,t=h,r=-1,b=-1,count=0,zero=0,edge=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const a=data[(y*w+x)*4+3];if(!a)zero++;if(a>24){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);count++;if(!x||!y||x===w-1||y===h-1)edge++}}return{l,t,w:r-l+1,h:b-t+1,b,count,edge,zeroFraction:zero/(w*h)}};
const union=bb=>{const l=Math.min(...bb.map(b=>b.l)),t=Math.min(...bb.map(b=>b.t)),r=Math.max(...bb.map(b=>b.l+b.w)),b=Math.max(...bb.map(b=>b.t+b.h));return{l,t,w:r-l,h:b-t,b}};
const prev=await has(root+'/effects-manifest.json')?JSON.parse(await fs.readFile(root+'/effects-manifest.json','utf8')):null;
const manifest={character:'pavanassi',frames:6,cell:[500,500],expectedEffects:plan.effects.length,effects:[],missing:[]};
for(const a of plan.effects){
 const files=[1,2].map(g=>root+'/originais/fx/'+a.action+'/grupo-'+g+'.png');
 if(!(await has(files[0]))||!(await has(files[1]))){manifest.missing.push(a.action);continue}
 const stamp=(await Promise.all(files.map(async f=>(await fs.stat(f)).mtimeMs))).join(':');
 const old=prev?.effects.find(e=>e.action===a.action);if(old?.sourceStamp===stamp&&!process.argv.includes('--force')){manifest.effects.push(old);continue}
 const ff=[],warnings=[];
 for(const file of files){const m=await sharp(file).metadata(),full=await sharp(file).ensureAlpha().raw().toBuffer(),cuts=spriteColumns(full,m.width,m.height),pad=Math.round(m.width/12);if(Math.abs(m.width/m.height-3)>.1)warnings.push('source-grid');for(let i=0;i<3;i++){const l=cuts[i],r=cuts[i+1],piece=await sharp(file).extract({left:l,top:0,width:r-l,height:m.height}).ensureAlpha().png().toBuffer(),raw=await sharp({create:{width:Math.round(m.width/3)+pad*2,height:m.height,channels:4,background:'#00000000'}}).composite([{input:piece,left:pad+l-Math.round(i*m.width/3),top:0}]).raw().toBuffer({resolveWithObject:true}),b=bound(raw.data,raw.info.width,raw.info.height);if(b.zeroFraction<.1)throw Error('Opaque FX '+file);if(b.count<30)throw Error('Empty FX cell '+file);if(b.edge>5)warnings.push('source-edge-'+(ff.length+1));ff.push({...raw,b})}}
 const u=union(ff.map(f=>f.b)),scale=Math.min(1,420/u.w,420/u.h),ground=/^(cerca|cabine|cela)/.test(a.action);
 const cells=[],meta=[];
 const dir=root+'/quadros/fx/'+a.action;for(const d of [dir,root+'/tiras/fx',root+'/pranchas/fx',root+'/mestres-768/fx',root+'/runtime/pavanassi-fx'])await fs.mkdir(d,{recursive:true});
 for(let i=0;i<6;i++){const f=ff[i],w=Math.round(u.w*scale),h=Math.round(u.h*scale),piece=await sharp(f.data,{raw:f.info}).extract({left:u.l,top:u.t,width:u.w,height:u.h}).resize(w,h).png().toBuffer(),x=Math.round(250-w/2),y=Math.round(ground?456-h:250-h/2),cell=await sharp({create:{width:500,height:500,channels:4,background:'#00000000'}}).composite([{input:piece,left:x,top:y}]).png().toBuffer();await fs.writeFile(dir+'/'+String(i+1).padStart(2,'0')+'.png',cell);cells.push(cell);const raw=await sharp(cell).raw().toBuffer();meta.push({frame:i+1,sha256:crypto.createHash('sha256').update(raw).digest('hex'),bounds:bound(raw,500,500)})}
 const strip=await sharp({create:{width:3000,height:500,channels:4,background:'#00000000'}}).composite(cells.map((input,i)=>({input,left:500*i,top:0}))).png().toBuffer();
 await atlasHashes(sharp,strip,meta);await fs.writeFile(root+'/tiras/fx/'+a.action+'.png',strip);await sharp(strip).webp({lossless:true,effort:4}).toFile(root+'/runtime/pavanassi-fx/'+a.action+'.webp');
 await sharp({create:{width:1500,height:1000,channels:4,background:'#00000000'}}).composite(cells.map((input,i)=>({input,left:i%3*500,top:Math.floor(i/3)*500}))).png().toFile(root+'/pranchas/fx/'+a.action+'.png');
 const masterCells=await Promise.all(ff.map(async f=>{const ms=scale*768/500,w=Math.round(u.w*ms),h=Math.round(u.h*ms),piece=await sharp(f.data,{raw:f.info}).extract({left:u.l,top:u.t,width:u.w,height:u.h}).resize(w,h).png().toBuffer(),x=Math.round(384-w/2),y=Math.round(ground?700-h:384-h/2);return sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite([{input:piece,left:x,top:y}]).png().toBuffer()}));
 await sharp({create:{width:4608,height:768,channels:4,background:'#00000000'}}).composite(masterCells.map((input,i)=>({input,left:i*768,top:0}))).png().toFile(root+'/mestres-768/fx/'+a.action+'.png');
 const unique=new Set(meta.map(f=>f.sha256)).size;if(unique!==6)warnings.push('duplicate-frame');
 const crop=union(meta.map(f=>f.bounds));
 manifest.effects.push({action:a.action,name:a.name,loop:a.loop,frames:6,file:'tiras/fx/'+a.action+'.png',board:'pranchas/fx/'+a.action+'.png',runtime:'runtime/pavanassi-fx/'+a.action+'.webp',master:'mestres-768/fx/'+a.action+'.png',anchor:ground?'bottom':'center',crop:[crop.l,crop.t,crop.w,crop.h],sourceStamp:stamp,sourceSheets:files.map(f=>f.slice(root.length+1)),uniqueFrames:unique,warnings,frameMeta:meta});console.log(a.action+': '+warnings.join(', '));
}
manifest.complete=manifest.missing.length===0;manifest.generatedEffects=manifest.effects.length;manifest.generatedDrawings=manifest.effects.length*6;
await fs.writeFile(root+'/effects-manifest.json',JSON.stringify(manifest,null,2));
await fs.mkdir(root+'/integracao/src/data',{recursive:true});
await fs.writeFile(root+'/integracao/src/data/pavanassi-art.js','// Crops in 500px atlas coordinates. Generated from actual alpha bounds.\nexport const PAVANASSI_FX_BOUNDS = '+JSON.stringify(Object.fromEntries(manifest.effects.map(a=>[a.action,a.crop])),null,2)+';\n');
const body={generatedAnimations:manifest.generatedEffects,expectedAnimations:manifest.expectedEffects,generatedDrawings:manifest.generatedDrawings,complete:manifest.complete,animations:manifest.effects.map(a=>({...a,side:'fx'}))};
const html=(await fs.readFile(root+'/producao/previa-template.html','utf8')).replace('__DATA__',JSON.stringify(body)).replaceAll('PAVANASSI · seis quadros · dois sentidos','PAVANASSI · efeitos e objetos · seis quadros').replaceAll('Ambos os sentidos','Efeitos').replaceAll('corpo completo','efeitos completos');
await fs.writeFile(root+'/efeitos-previa.html',html);
console.log(JSON.stringify({effects:manifest.generatedEffects,expected:manifest.expectedEffects,drawings:manifest.generatedDrawings,missing:manifest.missing.length}));
