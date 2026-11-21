// Sparse-checkout release build: preserve only an official index proven complete against Git.
// node tools/build-stage-release.mjs --stage=inferno --base=origin/main
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const git=(...args)=>execFileSync('git',['-c','fetch.negotiationAlgorithm=noop',...args],{encoding:'utf8',maxBuffer:32*1024*1024});
const sha=data=>createHash('sha256').update(data).digest('hex');
export function readReleaseGlobal(html,name){
 const prefix='window.'+name+'=',start=html.indexOf(prefix),end=html.indexOf(';window.',start);
 assert.ok(start>=0&&end>start,'release global '+name);
 return JSON.parse(html.slice(start+prefix.length,end));
}

/** Reject omissions, wrong slots, duplicate references and stale/non-runtime paths before building. */
export function assertCompleteSpriteIndexes(indexes,gitPaths){
 const files=[...new Set(gitPaths)].filter(path=>/\.(png|webp)$/.test(path));
 const audit={};
 for(const [name,posters]of [['__SPRITES',false],['__SPRITEPOSTERS',true]]){
  const expected=new Set(files.filter(path=>path.split('/').at(-1).startsWith('__first-')===posters));
  const index=indexes[name];
  assert.ok(index&&typeof index==='object'&&!Array.isArray(index),name+' must be an index');
  const used=new Set();let refs=0;
  for(const [id,sheets]of Object.entries(index)){
   assert.ok(sheets&&typeof sheets==='object'&&!Array.isArray(sheets),name+'/'+id+' must be a strip map');
   for(const [key,url]of Object.entries(sheets)){
    assert.equal(typeof url,'string',name+'/'+id+'/'+key+' URL');
    const parsed=new URL(url,'https://release.invalid/dist/game.html');
    const path=decodeURIComponent(parsed.pathname).replace(/^\//,'');
    assert.ok(expected.has(path),name+' references a missing file or wrong asset type: '+path);
    assert.ok(!used.has(path),name+' duplicates '+path);used.add(path);refs++;
    const parts=path.split('/'),filename=parts.at(-1);
    assert.equal(parts.length,5,'runtime sprite path '+path);
    assert.equal(parts[3],id,'sprite pack must match its Git directory: '+path);
    assert.equal(filename.replace(/^__first-/,'').replace(/\.(png|webp)$/,''),key,'sprite key must match its Git filename: '+path);
    assert.match(parsed.searchParams.get('v')||'',/^[0-9a-f]{12}$/,'official sprite cache hash '+path);
   }
  }
  const missing=[...expected].filter(path=>!used.has(path));
  assert.equal(missing.length,0,name+' omits '+missing.length+' Git runtime file(s): '+missing.slice(0,8).join(', '));
  audit[name]={packs:Object.keys(index).length,references:refs,gitFiles:expected.size,missing:0,extra:0,duplicates:0};
 }
 return audit;
}

export function buildStageRelease(argv=process.argv.slice(2)){
 const arg=(name,fallback)=>argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3)||fallback;
 const stage=arg('stage','washington'),base=arg('base','origin/main');
 const output='dist/salvadores-nacionais.html',reportFile=arg('report','production/qa/'+stage+'-build.json');
 const baseSHA=git('rev-parse',base).trim(),official=git('show',base+':'+output);
 const indexes={__SPRITES:readReleaseGlobal(official,'__SPRITES'),__SPRITEPOSTERS:readReleaseGlobal(official,'__SPRITEPOSTERS')};
 const tree=git('ls-tree','-r','--name-only',base,'production/sprites/final').trim().split('\n');
 // This reverse check is essential: an official HTML from a sparse build can contain valid URLs yet omit most artwork.
 const spriteIndexAudit=assertCompleteSpriteIndexes(indexes,tree);
 assert.equal(git('diff','--name-only',base,'--','production/sprites/final').trim(),'','character artwork must remain unchanged from the official base');
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
  assert.deepEqual(readReleaseGlobal(html,name),value,'complete official index preserved');
 }
 const stages=readReleaseGlobal(html,'__STAGEPACKS');
 assert.equal(Object.keys(stages[stage].assets).length,Object.keys(manifest.assets).length);
 const preservedIndexes={__SPRITES:readReleaseGlobal(html,'__SPRITES'),__SPRITEPOSTERS:readReleaseGlobal(html,'__SPRITEPOSTERS')};
 assert.deepEqual(assertCompleteSpriteIndexes(preservedIndexes,tree),spriteIndexAudit);
 writeFileSync(output,html);
 const report={stage,baseMain:baseSHA,officialReleaseSHA256:sha(official),spritePacks:spriteIndexAudit.__SPRITES.packs,spriteReferences:spriteIndexAudit.__SPRITES.references,spritePosters:spriteIndexAudit.__SPRITEPOSTERS.references,spriteIndexAudit,characterArt:'official index is complete in both directions against the current Git tree, preserved without changes; no character artwork changed',assets:Object.keys(manifest.assets).length,runtimeBytes,ground:manifest.ground,manifestSHA256:sha(readFileSync(manifestPath)),stageAssets:Object.fromEntries(Object.entries(stages).map(([id,pack])=>[id,Object.keys(pack.assets).length])),htmlSHA256:sha(html),reproduction:'node tools/build-stage-release.mjs --stage='+stage+' --base='+baseSHA+' --report='+reportFile,limits:['stage assets and required UI packs must be present locally','full character artwork is not downloaded by this sparse-checkout build; every official strip/poster URL is checked for exact Git-tree coverage']};
 mkdirSync(dirname(reportFile),{recursive:true});writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 return report;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)buildStageRelease();
