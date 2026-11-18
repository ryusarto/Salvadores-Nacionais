import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL} from '../../src/data/characters/index.js';
import {createMatch,step} from '../../src/core/match.js';
import {applyHit,isBlocking} from '../../src/core/combat.js';
import {createBrain,aiInput} from '../../src/core/ai.js';
import {startMove} from '../../src/core/fighter.js';
import {feed} from '../../src/core/input.js';
import {registerSprites,prepareSprites,hasSpriteStrip} from '../../src/render/sprites.js';
const fight=(a='franco',b='belga',training=false)=>{const s=createMatch({chars:[ALL[a],ALL[b]],seed:3,training});s.phase='fight';return s;};
test('treino recupera o estado e permite novos acertos depois de KO',()=>{const s=fight('franco','belga',true),m=ALL.franco.moves['5L'];s.f[1].hp=1;applyHit(s,s.f[0],s.f[1],m.hits[0],{type:'move',m});for(let i=0;i<180;i++)step(s);assert.notEqual(s.f[1].state,'ko');assert.equal(applyHit(s,s.f[0],s.f[1],m.hits[0],{type:'move',m}),'hit');});
test('paleta alternativa acompanha todos os rounds',()=>{const s=fight('franco','franco');s.f[1].alt=true;s.f[1].hp=0;for(let i=0;i<160;i++)step(s);assert.equal(s.round,2);assert.equal(s.f[1].alt,true);});
test('defesa da CPU no ar produz o botão que a guarda exige',()=>{const s=fight();s.f[0].x=1200;s.f[1].x=1380;s.f[1].state='air';s.f[1].y=120;startMove(s,s.f[0],'5H');const b=createBrain(2);b.blockT=5;const inp=aiInput(s,1,b);feed(s.f[1].buf,inp,-1);assert.equal(isBlocking(s.f[1],s.f[0].x,'mid'),true);});
test('CPU não escolhe cortes internos fora da postura',()=>{const s=fight('ryuchi','franco');s.f[0].x=1200;s.f[1].x=1380;for(let i=0;i<4000;i++){const b=createBrain(2);aiInput(s,0,b);assert.ok(!b.recent.some(k=>/^st/.test(k)),b.recent.join(','));}});
test('nova preparação recupera imagem que falhou sem repetir no render',async t=>{const previous=globalThis.Image;t.after(()=>{globalThis.Image=previous;});let calls=0;globalThis.Image=class{naturalWidth=3000;naturalHeight=500;set src(v){calls++;queueMicrotask(()=>calls===1?this.onerror():this.onload());}};await registerSprites('retry-regression',{parado:'retry'},{lazy:true,trueAlpha:true,preload:[],prefetch:false});await prepareSprites(['retry-regression']);assert.equal(hasSpriteStrip('retry-regression','parado'),false);assert.equal(calls,1);await prepareSprites(['retry-regression']);assert.equal(hasSpriteStrip('retry-regression','parado'),true);assert.equal(calls,2);});

test('paletas de roupa distinguem heróis e preservam pele',async()=>{const {recolorAlt}=await import('../../src/render/sprites.js');const px=new Uint8ClampedArray([220,20,30,255,154,98,69,255,220,220,220,255]);const a=recolorAlt(px.slice(),'franco'),b=recolorAlt(px.slice(),'mdep');assert.notDeepEqual([...a.slice(0,3)],[...b.slice(0,3)]);assert.deepEqual([...a.slice(4,8)],[...px.slice(4,8)]);});
test('erro ao preparar pixels não deixa a tela de versus esperando para sempre',async t=>{const prev={Image:globalThis.Image,document:globalThis.document};t.after(()=>Object.assign(globalThis,prev));globalThis.document={createElement(){throw Error('canvas indisponível');}};globalThis.Image=class{naturalWidth=512;naturalHeight=512;set src(v){queueMicrotask(()=>this.onload());}};await registerSprites('canvas-failure',{parado:'failed'},{lazy:true,preload:[],prefetch:false});await Promise.race([prepareSprites(['canvas-failure']),new Promise((_,reject)=>setTimeout(()=>reject(Error('carregamento travado')),500))]);assert.equal(hasSpriteStrip('canvas-failure','parado'),false);});
