import sharp from 'sharp';
import {readFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'.'),out=join(root,'previas');mkdirSync(out,{recursive:true});
const m=JSON.parse(readFileSync(join(root,'manifest.json')));
for(const item of m.inventory.filter(i=>i.status==='candidate-needs-visual-review')){
 const source=join(root,item.direction,item.action+'.png'),layers=[];
 for(let index=0;index<12;index++){
  const input=await sharp(source).extract({left:index*768,top:0,width:768,height:768}).png().toBuffer();
  layers.push({input,left:index%4*768,top:Math.floor(index/4)*800+32});
  layers.push({input:Buffer.from('<svg width="768" height="32"><text x="12" y="24" font-family="sans-serif" font-size="22" fill="#111">'+(index+1)+'</text></svg>'),left:index%4*768,top:Math.floor(index/4)*800});
 }
 await sharp({create:{width:3072,height:2400,channels:3,background:'#c6c9ce'}}).composite(layers).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(join(out,item.direction+'-'+item.action+'.jpg'));
}
console.log('Previews only: no runtime assets changed.');
