import {chromium} from 'playwright-core';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname,sep,dirname} from 'node:path';
import assert from 'node:assert/strict';

// Pixel regression against the real renderer and the real SA3 entity generator.
// Runs separately from unit tests: node tests/browser/inferno-floor-fire.mjs.
const root=process.cwd(),out=process.env.INFERNO_FIRE_REPORT||'/tmp/inferno-floor-fire-browser.json';
const server=createServer((req,res)=>{try{
 const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(path==='/favicon.ico'){res.writeHead(204).end();return;}
 if(path==='/'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>Inferno fire regression</title>');return;}
 const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error('outside root');
 const data=readFileSync(file);
 res.writeHead(200,{'Content-Type':extname(file)==='.js'?'text/javascript':'application/octet-stream'}).end(data);
}catch{if(!res.headersSent)res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 const configured=process.env.BROWSER_EXECUTABLE||process.env.CHROMIUM_PATH;
 const executablePath=configured||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/chromium');
 browser=await chromium.launch({executablePath,headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 const report=await page.evaluate(async()=>{
  const {drawFloorFire}=await import('/src/render/boss-art.js');
  const {default:djabo,DJ}=await import('/src/data/characters/djabo.js');
  const {SYS}=await import('/src/data/system.js');
  const cv=document.createElement('canvas');cv.width=SYS.STAGE_W;cv.height=SYS.VIEW_H;
  const c=cv.getContext('2d',{willReadFrequently:true}),cases=[];
  const max=SYS.STAGE_W-SYS.WALL_PAD-DJ.safeW;
  for(const safeL of [1120,SYS.WALL_PAD,877.25,1723.5,max])for(const delay of [20,0])for(const frame of [0,11,37])for(const callerAlpha of [1,.5]){
   const st={ents:[],nextId:1,events:[],rng:()=>(safeL-SYS.WALL_PAD)/(max-SYS.WALL_PAD)},f={side:1,face:-1,x:1900,res:{}};
   djabo.moves.SA3.spawn[0].make(st,f);
   c.clearRect(0,0,cv.width,cv.height);c.globalAlpha=callerAlpha;
   for(const e of st.ents)drawFloorFire(c,{...e,delay},SYS.GROUND_Y,frame);
   const [left,right]=f.res.safe,data=c.getImageData(0,800,cv.width,151).data;
   let safePixels=0,firePixels=0,maxAlpha=0;
   for(let y=0;y<151;y++)for(let x=0;x<cv.width;x++){
    const a=data[(y*cv.width+x)*4+3];if(!a)continue;
    firePixels++;maxAlpha=Math.max(maxAlpha,a);
    // Count only full pixel columns inside the safe interval (fractional edges excluded).
    if(x>=Math.ceil(left)&&x+1<=Math.floor(right))safePixels++;
   }
   // The saved clip must not leak into unrelated subsequent drawing.
   c.fillStyle='#00ff00';c.fillRect(Math.ceil(left)+10,900,2,2);
   const restored=Math.abs(c.getImageData(Math.ceil(left)+10,900,1,1).data[3]-255*callerAlpha)<=1;
   const opacityRestored=c.globalAlpha===callerAlpha;
   cases.push({safe:[left,right],width:right-left,delay,frame,callerAlpha,opacityRestored,segments:st.ents.length,safePixels,firePixels,maxAlpha,clipRestored:restored});
  }
  return {safeWidth:DJ.safeW,cases};
 });
 report.errors=errors;report.passed=report.cases.every(c=>c.width===360&&c.safePixels===0&&c.firePixels>0&&c.clipRestored&&c.opacityRestored&&c.maxAlpha>0&&c.maxAlpha<=Math.ceil(255*c.callerAlpha*(c.delay>0?.4:1)))&&!errors.length;
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 const failed=report.cases.filter(c=>c.safePixels>0||!c.clipRestored||!c.opacityRestored||c.maxAlpha>Math.ceil(255*c.callerAlpha*(c.delay>0?.4:1)));
 console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,safeWidth:report.safeWidth,failed:failed.slice(0,3),report:out},null,2));
 assert.equal(report.passed,true,'rendered fire must stay outside all 360 safe pixels and preserve caller opacity in warning and active states');
}finally{await browser?.close();await new Promise(r=>server.close(r));}
