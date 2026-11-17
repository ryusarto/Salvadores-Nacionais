/** Local, checksummed deliverable; GitHub is the primary remote backup. */
import {readFileSync,readdirSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve('.'),source='production/sprites/source/zanata-v1';
const output=resolve(process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'/workspace/backups/Salvadores-Nacionais/Capeta-Zanata/v1');mkdirSync(output,{recursive:true});
const files=[];const add=(path,target)=>{if(!existsSync(path))throw Error('Missing backup file: '+path);const bytes=readFileSync(path);files.push({source:resolve(path),path:target,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});};
for(const view of ['direita','esquerda']){
 const m=JSON.parse(readFileSync(source+'/manifest-'+view+'.json'));
 if(m.sequences.length!==41||m.effects.length!==12)throw Error('Incomplete package: '+view);
 for(const s of [...m.sequences,...m.effects]){const group=m.effects.includes(s)?'03-Efeitos':'02-Sprites';add(s.source,`01-Originais/${view}/${s.name}.png`);add(s.png,`${group}/${view}/${s.name}.png`);add(s.file,`${group}/${view}/${s.name}.webp`);}
 add(source+'/manifest-'+view+'.json','04-Manifestos/manifest-'+view+'.json');
}
for(const file of readdirSync(source+'/prompts'))add(source+'/prompts/'+file,'04-Manifestos/Prompts/'+file);
for(const file of ['PLANO.json','README.md','validation-issues.json'])add(source+'/'+file,'04-Manifestos/'+file);
add(source+'/referencias/retrato-gerado.png','05-Retrato/retrato-gerado.png');
add('production/ui/comic-v1/portraits/zanata.webp','05-Retrato/retrato.webp');add('production/ui/comic-v1/icons/zanata.webp','05-Retrato/icone.webp');
const preview=readFileSync('production/qa/zanata-sprites.html','utf8').replace("im.src='../sprites/final/'+id+(a.effect?'-fx':'')+'/'+a.name+'.webp'","im.src='../'+(a.effect?'03-Efeitos':'02-Sprites')+'/'+(id==='zanata'?'direita':'esquerda')+'/'+a.name+'.webp'");
const previewPath=join(output,'zanata-sprites.html');writeFileSync(previewPath,preview);add(previewPath,'06-Previa/zanata-sprites.html');
add('production/qa/zanata-demonstracao.webp','06-Previa/zanata-demonstracao.webp');
for(const file of ['src/data/characters/zanata.js','src/data/zanata-art.js','src/render/zanata-art.js','src/render/fx.js','src/render/mannequin.js','src/render/sprites.js','src/render/fighter-material.js','src/main.js','src/ui/app.js','tools/import-zanata.mjs','tools/zanata-preview.mjs','tools/backup-zanata.mjs','tools/smoke-zanata.mjs','tools/lib/sprite-components.mjs','tests/unit/zanata-art.test.js','production/qa/zanata-validacao.json'])add(file,'07-Integracao/'+file);
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const manifest={project:'Salvadores Nacionais',character:'Capeta Zanata',version:1,commit,primaryRemote:'https://github.com/ryusarto/Salvadores-Nacionais',generatedViews:2,bodyAnimationsPerView:41,effectsPerView:12,framesPerAnimation:6,frameCount:636,secondaryCloudUploadConfirmed:false,files:files.map(({source,...rest})=>rest)};
const manifestPath=join(output,'MANIFESTO-SHA256.json');writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const list=join(output,'arquivo-lista.json');writeFileSync(list,JSON.stringify(files));
execFileSync('python3',['-c',`import json,zipfile,sys\nfrom pathlib import Path\nitems=json.load(open(sys.argv[1]))\nwith zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:\n for f in items:z.write(f['source'],'Salvadores Nacionais/Personagens/Capeta Zanata/v1/'+f['path'])\n z.write(sys.argv[3],'Salvadores Nacionais/Personagens/Capeta Zanata/v1/MANIFESTO-SHA256.json')\nprint(str(Path(sys.argv[2]).stat().st_size)+' bytes')`,list,join(output,'Capeta-Zanata-v1.zip'),manifestPath],{stdio:'inherit'});
console.log('Backup local organizado: '+output+' · '+files.length+' arquivos. Não implica envio a Drive ou Dropbox.');
