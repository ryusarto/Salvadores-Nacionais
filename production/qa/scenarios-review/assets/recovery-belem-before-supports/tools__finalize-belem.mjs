import sharp from 'sharp';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='production/stages/belem',plan=JSON.parse(readFileSync(root+'/PLANO.json'));
const uiFrom=process.argv.find(a=>a.startsWith('--ui-from='))?.slice(10);
if(uiFrom){await sharp(uiFrom).resize(1920,1080).webp({quality:95}).toFile(root+'/ui/carregamento.webp');await sharp(uiFrom).resize(960,540).webp({quality:93}).toFile(root+'/ui/miniatura.webp');}
writeFileSync(root+'/ui/titulo.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="840" height="210" viewBox="0 0 840 210"><path fill="#162f37" stroke="#dfb46b" stroke-width="3" d="M34 12H838L804 198H2Z"/><text x="420" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="26" letter-spacing="7" fill="#efce94">BELÉM • PARÁ</text><text x="420" y="137" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="74" fill="#fff3d6">VER-O-PESO</text><path d="M260 165H580" stroke="#dfb46b" stroke-width="3"/></svg>`);
function bounds(data,w,h,threshold=12){let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>threshold){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}return[l,t,r-l+1,b-t+1];}
const assets={},groups=[];
for(const group of plan.assetGroups){const files=[];
 for(let n=1;n<=group.variants;n++){const path=group.path.replace('{variant}',String(n)),file=root+'/'+path;if(!existsSync(file))continue;
  const id=group.variants>1||group.path.includes('{variant}')?group.id+'-'+n:group.id;
  const bytes=readFileSync(file),a={path,kind:group.group,frames:group.frames,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
  if(group.group!=='audio'){
   const meta=await sharp(file).metadata();a.width=meta.width;a.height=meta.height;a.alpha=!!meta.hasAlpha;
   if(group.group==='prop') {const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});a.crop=bounds(data,info.width,info.height);}
   if(group.frames===6){const bb=[];for(let i=0;i<6;i++){const raw=await sharp(file).extract({left:i*500,top:0,width:500,height:500}).ensureAlpha().raw().toBuffer();bb.push(bounds(raw,500,500));}const l=Math.min(...bb.map(b=>b[0])),t=Math.min(...bb.map(b=>b[1])),r=Math.max(...bb.map(b=>b[0]+b[2])),b=Math.max(...bb.map(b=>b[1]+b[3]));a.crop=[l,t,r-l,b-t];}
  }else Object.assign(a,JSON.parse(readFileSync(root+'/audio/manifest.json'))[group.id]);
  assets[id]=a;files.push(path);
 }
 group.files=files;group.status=files.length===group.variants?'produced':'pending-export';groups.push({id:group.id,kind:group.group,status:group.status,files});
}
const complete=groups.every(g=>g.status==='produced');
plan.status=complete?'produced-and-integrated':'exporting';plan.basis='Original game art inspired by the three user-provided Belém photographs: Ver-o-Peso market, fishing boats, Sé cathedral. Warm dusk palette; 2.5D side view.';
writeFileSync(root+'/PLANO.json',JSON.stringify(plan,null,2)+'\n');
writeFileSync(root+'/manifest.json',JSON.stringify({id:'belem-ver-o-peso',version:1,groups:36,status:plan.status,world:plan.world,palette:['#39365b','#bb7d97','#f2b275','#245e68','#bb794e','#ece0b6'],assetGroups:groups,assets},null,2)+'\n');
console.log(Object.keys(assets).length+' files; '+groups.filter(g=>g.status==='produced').length+'/36 groups complete.');
