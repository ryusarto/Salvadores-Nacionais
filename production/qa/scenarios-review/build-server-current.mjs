// From repository root: node production/qa/scenarios-review/build-server-current.mjs
// Serves the frozen local build. Only absent runtime sprites are fetched, from its immutable Git base.
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),report=JSON.parse(readFileSync('production/qa/scenarios-review/build-release-current.json'));
const sha=data=>createHash('sha256').update(data).digest('hex');
assert.ok(!report.status?.startsWith('temporary'),'QA build is on hold');
assert.match(report.baseMain,/^[0-9a-f]{40}$/);
assert.equal(sha(readFileSync('dist/salvadores-nacionais.html')),report.htmlSHA256,'build differs from its frozen report');
assert.equal(report.spriteIndexAudit.__SPRITES.missing,0);
const cache=new Map(),queue=[],remotePaths=new Set();let active=0,cachedBytes=0,downloadedBytes=0;
const cacheLimit=192*1024*1024;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.ogg':'audio/ogg','.ttf':'font/ttf','.css':'text/css'};
const metrics=()=>({baseMain:report.baseMain,buildSHA256:report.htmlSHA256,verifiedRemoteSprites:remotePaths.size,downloadedBytes,cachedBytes,cacheLimit,cacheEntries:cache.size,active});
function trimCache(){
 for(const [key,entry]of cache){
  if(cachedBytes<=cacheLimit)break;
  if(entry.data){cachedBytes-=entry.data.length;cache.delete(key);}
 }
}
async function download(path,hash){
 assert.match(hash||'',/^[0-9a-f]{12}$/,'sprite hash is required');
 if(active>=4)await new Promise(r=>queue.push(r));active++;
 try{
  const response=await fetch('https://raw.githubusercontent.com/ryusarto/Salvadores-Nacionais/'+report.baseMain+path,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('immutable official sprite '+response.status+' '+path);
  const data=Buffer.from(await response.arrayBuffer());
  assert.ok(sha(data).startsWith(hash),'official sprite SHA mismatch '+path);
  downloadedBytes+=data.length;remotePaths.add(path);return data;
 }finally{active--;queue.shift()?.();}
}
function sprite(path,hash){
 const key=path+'?v='+hash;
 if(cache.has(key)){const entry=cache.get(key);cache.delete(key);cache.set(key,entry);return entry.promise;}
 const entry={data:null,promise:null};cache.set(key,entry);
 entry.promise=download(path,hash).then(data=>{entry.data=data;cachedBytes+=data.length;trimCache();return data;}).catch(error=>{cache.delete(key);throw error;});
 return entry.promise;
}
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return;}
 if(url.pathname==='/__review_status'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify(metrics()));return;}
 const path=decodeURIComponent(url.pathname==='/'?'/dist/salvadores-nacionais.html':url.pathname),file=resolve(root,'.'+path);
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 const isSprite=path.startsWith('/production/sprites/final/')&&/\.(png|webp)$/.test(path);
 let data;
 if(existsSync(file)&&statSync(file).isFile()){
  data=readFileSync(file);
  if(isSprite&&url.searchParams.has('v')){const hash=url.searchParams.get('v');assert.match(hash,/^[0-9a-f]{12}$/);assert.ok(sha(data).startsWith(hash),'local sprite SHA mismatch '+path);}
 }else if(isSprite)data=await sprite(path,url.searchParams.get('v'));
 else{res.writeHead(404).end('not found');return;}
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(data);
}catch(error){if(!res.headersSent)res.writeHead(500);res.end(String(error));}});
server.listen(0,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:'+server.address().port,port:server.address().port,pid:process.pid,root,...metrics()})));
let closing=false;const close=()=>{if(closing)return;closing=true;server.closeAllConnections();server.close(()=>{console.log(JSON.stringify({closed:true,...metrics()}));process.exit(0);});};
process.on('SIGTERM',close);process.on('SIGINT',close);
