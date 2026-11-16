import sharp from 'sharp';import{readFileSync,writeFileSync,mkdirSync,copyFileSync}from'node:fs';import{createHash}from'node:crypto';
const root='production/ui/comic-v1',input=process.argv.find(a=>a.startsWith('--sources='))?.slice(10);
for(const d of['source','portraits','icons','brand'])mkdirSync(root+'/'+d,{recursive:true});
if(input)for(const[id,file]of Object.entries(JSON.parse(readFileSync(input))))copyFileSync(file,root+'/source/'+id+'.png');
const ids=['franco','belga','majis','trunks','ryuchi','mdep','chapuh','dney','zanata'],assets={};
async function save(id,path,im){await im.webp({quality:96,alphaQuality:100,effort:5}).toFile(root+'/'+path);const b=readFileSync(root+'/'+path),m=await sharp(b).metadata();assets[id]={path,width:m.width,height:m.height,alpha:!!m.hasAlpha,sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length};}
for(const id of ids){const file=root+'/source/'+id+'.png',m=await sharp(file).metadata();
 await save('portrait-'+id,'portraits/'+id+'.webp',sharp(file).resize(768,1024,{fit:'fill'}));
 const size=Math.min(m.width,m.height);await save('icon-'+id,'icons/'+id+'.webp',sharp(file).extract({left:Math.floor((m.width-size)/2),top:0,width:size,height:size}).resize(256,256));
}
await save('logo','brand/logo.webp',sharp(root+'/source/logo.png').trim({threshold:8}).resize({width:1800,withoutEnlargement:true}));
await save('paper','brand/paper.webp',sharp(root+'/source/paper.png').resize(1024,1024));
assets.font={path:'fonts/Bangers-Regular.ttf',kind:'font'};
writeFileSync(root+'/manifest.json',JSON.stringify({version:1,palette:{ink:'#17131b',paper:'#f4e9c9',yellow:'#f3c426',red:'#dc3029',cyan:'#63d6d3'},characters:ids,assets},null,2)+'\n');
console.log('Nine dedicated portraits + nine HUD icons + logo, paper and comic font.');
