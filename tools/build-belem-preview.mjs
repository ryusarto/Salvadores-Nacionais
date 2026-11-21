/** Preserve the original editable preview; bundle an autonomous copy of its real renderer. */
import{build}from'esbuild';import{readFileSync,writeFileSync}from'node:fs';
const pack=JSON.parse(readFileSync('production/stages/belem/manifest.json')),offline=process.argv.includes('--offline');
const data=(p,mime)=>'data:'+mime+';base64,'+readFileSync(p).toString('base64');
const html=readFileSync('production/qa/belem-cenario.html','utf8');
if(offline){
 for(const a of Object.values(pack.assets))a.url=data('production/stages/belem/'+a.path,a.kind==='audio'?'audio/ogg':a.path.endsWith('.svg')?'image/svg+xml':'image/webp');
 const actors=Object.fromEntries(['ryuchi','belga'].map(k=>[k,data('production/sprites/final/'+k+'/parado.webp','image/webp')]));
 let code=readFileSync('production/qa/belem-preview.js','utf8').replace("pack=await(await fetch(new URL('manifest.json',root))).json()",'pack='+JSON.stringify(pack));
 code=code.replace("for(const a of Object.values(pack.assets))a.url=new URL(a.path,root).href;",'');
 code=code.replace("img.src=new URL('../../sprites/final/'+name+'/parado.webp',root).href",'img.src='+JSON.stringify(actors)+'[name]');
 const result=await build({stdin:{contents:code,resolveDir:process.cwd()+'/production/qa',sourcefile:'belem-preview.js'},bundle:true,format:'esm',write:false,target:'es2022'});
 writeFileSync('production/qa/belem-cenario-offline.html',html.replace('<script type="module" src="./belem-preview.js"></script>','<script type="module">'+result.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script>'));
 console.log('production/qa/belem-cenario-offline.html');
}else console.log('production/qa/belem-cenario.html (uses current data/renderer directly)');
