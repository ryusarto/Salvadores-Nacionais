// Builds a stage integration from a sparse checkout without publishing a partial sprite index.
// node tools/build-stage-release.mjs --stage=washington --base=origin/main
// Requires unchanged character artwork relative to the chosen official base release.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import assert from 'node:assert/strict';

const arg=(name,fallback)=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)||fallback;
const stage=arg('stage','washington'),base=arg('base','origin/main');
const output='dist/salvadores-nacionais.html',reportFile=arg('report','production/qa/'+stage+'-build.json');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024});
const sha=data=>createHash('sha256').update(data).digest('hex');
const baseSHA=git('rev-parse',base).trim();
const official=git('show',base+':'+output);
function readGlobal(html,name){
 const prefix='window.'+name+'=',start=html.indexOf(prefix),end=html.indexOf(';window.',start);
 assert.ok(start>=0&&end>start,'official global '+name);
 return JSON.parse(html.slice(start+prefix.length,end));
}
const indexes={__SPRITES:readGlobal(official,'__SPRITES'),__SPRITEPOSTERS:readGlobal(official,'__SPRITEPOSTERS')};
const tree=new Set(git('ls-tree','-r','--name-only',base,'production/sprites/final').trim().split('\n'));
assert.equal(git('diff','--name-only',base,'--','production/sprites/final').trim(),'','character artwork must remain unchanged from the official base');
for(const index of Object.values(indexes))for(const sheets of Object.values(index))for(const url of Object.values(sheets)){
 const path=decodeURIComponent(new URL(url,'https://release.invalid/dist/game.html').pathname).replace(/^\//,'');
 assert.ok(tree.has(path),'sprite URL exists in official Git tree: '+path);
 assert.match(new URL(url,'https://release.invalid').searchParams.get('v')||'',/^[0-9a-f]{12}$/,'official sprite cache hash');
}
const manifestPath='production/stages/'+stage+'/manifest.json',manifest=JSON.parse(readFileSync(manifestPath));
assert.equal(manifest.id,stage);assert.deepEqual(manifest.missing||[],[],'finish the asset manifest before building');
let runtimeBytes=0;
for(const [id,a]of Object.entries(manifest.assets)){
 const data=readFileSync('production/stages/'+stage+'/'+a.path);
 assert.equal(data.length,a.bytes,id+' bytes');assert.equal(sha(data),a.sha256,id+' hash');runtimeBytes+=data.length;
}
console.log(execFileSync(process.execPath,['tools/build.mjs','--external-assets','--min'],{encoding:'utf8'}).trim());
let html=readFileSync(output,'utf8');
for(const [name,value]of Object.entries(indexes)){
 const prefix='window.'+name+'=',start=html.indexOf(prefix),end=html.indexOf(';window.',start);
 assert.ok(start>=0&&end>start,'built global '+name);
 html=html.slice(0,start+prefix.length)+JSON.stringify(value)+html.slice(end);
 assert.deepEqual(readGlobal(html,name),value,'full official index preserved');
}
const stages=readGlobal(html,'__STAGEPACKS');
assert.equal(Object.keys(stages[stage].assets).length,Object.keys(manifest.assets).length);
writeFileSync(output,html);
const count=index=>Object.values(index).reduce((n,sheets)=>n+Object.keys(sheets).length,0);
const report={stage,baseMain:baseSHA,spritePacks:Object.keys(indexes.__SPRITES).length,spriteReferences:count(indexes.__SPRITES),spritePosters:count(indexes.__SPRITEPOSTERS),characterArt:'official index preserved exactly; all URLs checked against the official Git tree and character artwork unchanged',assets:Object.keys(manifest.assets).length,runtimeBytes,ground:manifest.ground,manifestSHA256:sha(readFileSync(manifestPath)),htmlSHA256:sha(html),reproduction:'node tools/build-stage-release.mjs --stage='+stage+' --base='+baseSHA+' --report='+reportFile,limits:['stage assets and required UI packs must be present locally','full character artwork was not downloaded by this sparse-checkout build; official URLs are preserved']};
mkdirSync(dirname(reportFile),{recursive:true});writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
