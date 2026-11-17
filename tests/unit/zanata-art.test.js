import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import zanata from '../../src/data/characters/zanata.js';
import {STATE_ANIMS,animFor,moveArtWindow} from '../../src/render/anim.js';
import {spriteProgress} from '../../src/render/sprite-timing.js';
import {spriteSetId} from '../../src/render/sprites.js';
import {zanataAttackArt} from '../../src/render/zanata-art.js';
const sha=b=>createHash('sha256').update(b).digest('hex');
const index=f=>Math.floor(spriteProgress(f,animFor(f,0))*6);

test('Zanata tem todos os estados, golpes, turbos e efeitos nos dois sentidos com seis poses únicas',async()=>{
 const root=new URL('../../',import.meta.url),base='production/sprites/source/zanata-v1/';
 const required=[...Object.keys(STATE_ANIMS),...Object.keys(zanata.moves).map(k=>'golpe-'+k),...zanata.spriteTurboMoves.map(k=>'golpe-'+k+'-turbo')].sort();
 assert.equal(required.length,41);assert.deepEqual(zanata.spriteAlias,{});
 const globalHashes=new Set();
 for(const [view,id]of[['direita','zanata'],['esquerda','zanata-esquerda']]){
  const m=JSON.parse(readFileSync(new URL(base+'manifest-'+view+'.json',root)));
  assert.equal(m.sequences.length,41);assert.equal(m.effects.length,12);assert.equal(m.upscaled,false);
  assert.deepEqual(readdirSync(new URL('production/sprites/final/'+id+'/',root)).map(f=>f.replace('.webp','')).sort(),required);
  for(const s of [...m.sequences,...m.effects]){
   const bytes=readFileSync(new URL(s.file,root)),meta=await sharp(bytes).metadata();
   assert.equal(meta.width,3000,s.name);assert.equal(meta.height,500,s.name);assert.ok(meta.hasAlpha,s.name);
   assert.equal(sha(bytes),s.sha256);assert.equal(sha(readFileSync(new URL(s.source,root))),s.sourceSha256);
   assert.ok(s.scale>0&&s.scale<=1,s.name);assert.equal(new Set(s.frames.map(f=>f.sha256)).size,6,s.name);
   assert.ok(s.frames.every(f=>f.edgePixels===0&&f.sourceEdgePixels===0),s.name);
   globalHashes.add(s.sha256);
  }
 }
 assert.equal(globalHashes.size,106,'nenhuma tira duplicada ou alias entre os sentidos');
 assert.equal(spriteSetId({ch:zanata,face:1}),'zanata');assert.equal(spriteSetId({ch:zanata,face:-1}),'zanata-esquerda');
});

test('poses de contato seguem as janelas reais, inclusive dois contatos do turbo e supers',()=>{
 for(const[key,base]of Object.entries(zanata.moves))for(const m of [base,base.turbo].filter(Boolean)){
  const f={ch:zanata,state:'attack',moveKey:key,move:m,sf:0};assert.equal(index(f),0,key);
  const contacts=zanata.spriteHitFrames[key];
  if(contacts&&contacts.length===m.hits.length)for(const[i,h]of m.hits.entries())for(let sf=h.from;sf<=h.to;sf++){f.sf=sf;assert.equal(index(f),contacts[i],key);}
  else{const[first,last]=moveArtWindow(m);for(let sf=first;sf<=last;sf++){f.sf=sf;assert.equal(index(f),3,key);}}
  f.sf=m.total-1;assert.equal(index(f),5,key);
 }
});

test('FX de chicote, laço, varredura, salto e supers correspondem às caixas ativas',()=>{
 for(const[key,name]of[['5S','fx-estalo'],['6S','fx-laco'],['2S','fx-varredura'],['4S','fx-agulha'],['SA1','fx-tempestade'],['SA3','fx-intimacao']]){
  const move=zanata.moves[key],f={ch:zanata,state:'attack',moveKey:key,move,sf:0};assert.equal(zanataAttackArt(f),null);
  for(const h of move.hits){f.sf=h.from;const a=zanataAttackArt(f);assert.equal(a.name,name);assert.equal(a.hit,h);assert.ok(a.box.w>0&&a.box.h>0);}
  f.sf=move.total-1;assert.equal(zanataAttackArt(f),null);
 }
});
