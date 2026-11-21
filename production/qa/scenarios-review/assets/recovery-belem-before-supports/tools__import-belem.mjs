// Technical export/layout of generated originals. No painted source is overwritten.
import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const root='production/stages/belem', source=join(root,'source');
const input=process.argv.find(a=>a.startsWith('--sources='))?.slice(10);
if(input){const records=JSON.parse(readFileSync(input));mkdirSync(source,{recursive:true});for(const[id,path]of Object.entries(records))copyFileSync(path,join(source,id+'.png'));}
for(const dir of['layers','ground','props','animations','fx','ui','source/pranchas'])mkdirSync(join(root,dir),{recursive:true});
const blank=(w,h)=>sharp({create:{width:w,height:h,channels:4,background:'#00000000'}});
const hash=b=>createHash('sha256').update(b).digest('hex');
function bounds(data,w,h,threshold=24){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>threshold){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}if(r<l)throw Error('Empty asset');return{left:l,top:t,width:r-l+1,height:b-t+1};}
async function normalized(path,box){let im=sharp(path);if(box)im=im.extract(box);const {data,info}=await im.ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<data.length;i+=4)if(data[i+3]<=12)data.fill(0,i,i+4);return{data,info};}
async function cut(id,box){const {data,info}=await normalized(join(source,id+'.png'),box);const b=bounds(data,info.width,info.height);return sharp(data,{raw:info}).extract(b).png().toBuffer();}
async function put(path,buffer){await sharp(buffer).webp({quality:94,alphaQuality:100,effort:5}).toFile(join(root,path));}
async function place(buffer,w,h,x,y,dw,dh){return{input:await sharp(buffer).resize(Math.round(dw),Math.round(dh),{fit:'fill'}).png().toBuffer(),left:Math.round(x),top:Math.round(y)};}
const props={};
const sheets=[['props-feira',['barraca-1','barraca-2','barraca-3','banca-frutas-1','banca-frutas-2','poste-1'],512],['props-cais',['caixas-1','caixas-2','caixas-3','cestos-1','cestos-2','barco-1'],512],['props-ambiente',['barco-2','folhagem-1','folhagem-2','bandeirolas-1','bandeirolas-2','parapeito'],640]];
for(const[id,names,split]of sheets){const m=await sharp(join(source,id+'.png')).metadata();for(const[i,name]of names.entries()){
 const box={left:i%3*(m.width/3),top:i<3?0:split,width:m.width/3,height:i<3?split:m.height-split};
 const art=await cut(id,box);props[name]=art;
 const frame=await blank(512,512).composite([{input:await sharp(art).resize(480,480,{fit:'inside'}).png().toBuffer(),gravity:'centre'}]).png().toBuffer();
 await put('props/'+name+'.webp',frame);
}}
await put('layers/ceu.webp',await sharp(join(source,'ceu.png')).resize(1920,1080,{fit:'fill'}).toBuffer());
const clouds=await cut('nuvens');await put('layers/nuvens.webp',await blank(1975,1080).composite([await place(clouds,1975,1080,0,28,1975,420)]).png().toBuffer());
const shore=await cut('horizonte');await put('layers/horizonte.webp',await blank(2043,1080).composite([await place(shore,2043,1080,0,490,2043,110)]).png().toBuffer());
await put('layers/agua.webp',await blank(2043,1080).composite([{input:await sharp(join(source,'agua.png')).resize(2043,250,{fit:'fill'}).png().toBuffer(),left:0,top:590}]).png().toBuffer());
// Isolated white export fleck below the buildings is outside the architecture.
const arch=await cut('architecture',{left:0,top:280,width:1536,height:600});const am=await sharp(arch).metadata(),aw=1740,ah=Math.round(aw*am.height/am.width);
await put('layers/arquitetura.webp',await blank(2206,1080).composite([await place(arch,2206,1080,(2206-aw)/2,700-ah,aw,ah)]).png().toBuffer());
// Quay belongs to the fair layer. Tents, people and tables remain independent.
const rails=[];for(let x=0;x<2451;x+=490){const w=Math.min(490,2451-x);rails.push(await place(props.parapeito,2451,1080,x,747,w,79));}
await put('layers/feira.webp',await blank(2451,1080).composite(rails).png().toBuffer());
const foreground=[];foreground.push(await place(props['cestos-1'],2634,1080,0,988,110,78));foreground.push(await place(props['caixas-1'],2634,1080,2540,1000,94,78));
await put('layers/primeiro-plano.webp',await blank(2634,1080).composite(foreground).png().toBuffer());
// Mirrored two-by-two layout closes both texture seams without painting over source.
const tile=await sharp(join(source,'calcamento.png')).resize(512,512,{fit:'fill'}).toBuffer();
await put('ground/calcamento.webp',await blank(1024,1024).composite([{input:tile,left:0,top:0},{input:await sharp(tile).flop().toBuffer(),left:512,top:0},{input:await sharp(tile).flip().toBuffer(),left:0,top:512},{input:await sharp(tile).flip().flop().toBuffer(),left:512,top:512}]).png().toBuffer());
const animationNames=['agua-ondulacao','barco-balanco','toldo-vento','bandeirolas-vento','folhagem-vento','npc-feirante','npc-cliente','npc-torcedor','poeira-ambiente','luz-poste','reflexos-agua'];
const exports=[];
for(const name of animationNames){const m=await sharp(join(source,name+'.png')).metadata();if(m.width!==1536||m.height!==1024)throw Error('Expected 3x2 '+name);const cells=[],boxes=[];
 for(let i=0;i<6;i++){const raw=await normalized(join(source,name+'.png'),{left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512});cells.push(raw);boxes.push(bounds(raw.data,512,512,name==='luz-poste'?8:24));}
 const isFx=['agua-ondulacao','poeira-ambiente','luz-poste','reflexos-agua'].includes(name);
 // One scale and fixed root per sequence. Only non-positional NPC baseline jitter is removed.
 const scale=Math.min(.94,456/Math.max(...boxes.map(b=>b.width)),456/Math.max(...boxes.map(b=>b.height)));
 const meanX=boxes.reduce((s,b)=>s+b.left+b.width/2,0)/6,meanBottom=boxes.reduce((s,b)=>s+b.top+b.height,0)/6;
 const frames=[],record=[];
 for(let i=0;i<6;i++){const b=boxes[i],crop=await sharp(cells[i].data,{raw:cells[i].info}).extract(b).resize(Math.max(1,Math.round(b.width*scale)),Math.max(1,Math.round(b.height*scale))).png().toBuffer();
  const cm=await sharp(crop).metadata();const npc=name.startsWith('npc-');
  const left=Math.max(12,Math.min(488-cm.width,Math.round(250+(b.left-meanX)*scale)));
  const top=Math.max(12,Math.min(488-cm.height,Math.round((isFx?250:474)+(b.top-(isFx?256:npc?b.top+b.height:meanBottom))*scale)));
  const f=await blank(500,500).composite([{input:crop,left,top}]).png().toBuffer();frames.push(f);record.push({sourceCell:[i%3*512,Math.floor(i/3)*512,512,512],bounds:b,scale,offset:[left,top],sha256:hash(f)});
 }
 const folder=['poeira-ambiente','luz-poste','reflexos-agua'].includes(name)?'fx':'animations';
 await put(folder+'/'+name+'.webp',await blank(3000,500).composite(frames.map((input,i)=>({input,left:i*500,top:0}))).png().toBuffer());
 await blank(1500,1000).composite(frames.map((input,i)=>({input,left:i%3*500,top:Math.floor(i/3)*500}))).png().toFile(join(source,'pranchas',name+'.png'));
 exports.push({id:name,path:folder+'/'+name+'.webp',frames:record});
}
writeFileSync(join(source,'exports.json'),JSON.stringify({alphaNoiseThreshold:12,cell:500,frames:6,animations:exports},null,2)+'\n');
console.log('Exported eight bases, seventeen prop variants, eleven six-frame animations.');
