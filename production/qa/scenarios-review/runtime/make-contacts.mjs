import{createRequire}from'node:module';const require=createRequire(process.cwd()+'/package.json'),sharp=require('sharp'),dir='production/qa/scenarios-review/runtime/';
async function grid(name,files,cols=3,w=640){const h=Math.round(w*1080/1920),items=await Promise.all(files.map(async(f,i)=>({input:await sharp(dir+f+'.png').resize(w,h,{fit:'contain',background:'#100a16'}).toBuffer(),left:i%cols*w,top:Math.floor(i/cols)*h})));await sharp({create:{width:w*cols,height:h*Math.ceil(files.length/cols),channels:3,background:'#100a16'}}).composite(items).jpeg({quality:94}).toFile(dir+name+'.jpg');}
await grid('cameras-01-04',['belem','palco','banheiros','aeroporto'].flatMap(s=>[0,340,680].map(c=>s+'-camera-'+c)));
await grid('cameras-05-07',['mansao','washington','inferno'].flatMap(s=>[0,340,680].map(c=>s+'-camera-'+c)));
await grid('mechanics-01',['belem-mechanic-fury','palco-mechanic-live-phone','banheiros-mechanic-fence','banheiros-mechanic-cabin'],2,960);
await grid('mechanics-02',['aeroporto-mechanic-boarding','mansao-mechanic-ankle-zone','washington-mechanic-clones-shadow','washington-mechanic-wall'],2,960);
await grid('mobile-01-04',['belem','palco','banheiros','aeroporto'].map(x=>x+'-mobile'),2,844);
await grid('mobile-05-07',['mansao','washington','inferno'].map(x=>x+'-mobile'),2,844);
console.log('six review contacts written');
