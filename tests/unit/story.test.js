import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES, BOSSES, ALL } from '../../src/data/characters/index.js';
import { CHAPTERS } from '../../src/data/story.js';
import { createRun, createRunAt, nextChapter, tourComplete, selectableChapters, moveChapter, currentFight, fightLevel, winFight, continueFight, talkLines, openingPages, closingPages, loadProgress, saveCleared, saveCheckpoint, resumeRun } from '../../src/ui/story.js';
import { createMatch, step } from '../../src/core/match.js';
import { createBrain, aiInput } from '../../src/core/ai.js';
const memory = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))}; };

test('a História começa na Zanata e enfrenta somente os sete chefes, com todos os heróis',()=>{
 for(const h of HEROES) {
  assert.equal(currentFight(createRun(h.id)).foe,'zanata');
  for(let done=0;done<CHAPTERS.length;done++) {
   const run=createRun(h.id,{[h.id]:done});
   assert.deepEqual(run.fights,[{foe:BOSSES[done].id,kind:'boss'}]);
   assert.ok(!HEROES.some(hero=>hero.id===currentFight(run).foe));
   assert.equal(fightLevel(run,2),2,'chefe não recebe redução reservada a antigos duelos de rima');
  }
 }
});

test('cada abertura apresenta colaboração, e cada diálogo apresenta o chefe do capítulo',()=>{
 for(let chapter=0;chapter<7;chapter++)for(const hero of HEROES) {
  const run=createRunAt(hero.id,chapter,chapter);
  const pages=openingPages(run,hero.name);
  assert.ok(pages.some(p=>p.includes(hero.name)));
  assert.ok(!pages.some(p=>/quem vencer|batalha de rima|antes, a roda/i.test(p)));
  for(const line of talkLines(run)) {assert.ok(line.say.length>5);assert.ok(line.who===null||line.who===hero.id||line.who===CHAPTERS[chapter].boss);}
 }
});

test('vencer um chefe salva o capítulo e desbloqueia o próximo, preservando outros heróis',()=>{
 const storage=memory();storage.setItem('sn-historia',JSON.stringify({belga:3}));
 const run=createRun('franco');assert.equal(winFight(run),'cleared');saveCleared(run,storage);
 assert.deepEqual(loadProgress(storage),{belga:3,franco:1});assert.equal(nextChapter(run).boss,'chupetinha');
 assert.equal(currentFight(createRun('franco',loadProgress(storage))).foe,'chupetinha');
});

test('continuar repete o chefe atual sem introduzir aliados',()=>{
 const run=createRun('belga',{belga:3});const before=currentFight(run);continueFight(run);
 assert.equal(currentFight(run),before);assert.equal(run.continues,1);assert.equal(before.foe,'fujao');
});

test('JSON inválido e valores inválidos de progresso não quebram a campanha',()=>{
 for(const raw of ['{quebrado','null','[]','{"franco":-1}','{"franco":2.5}','{"franco":"abc"}','{"franco":{}}']) {
  const storage=memory();storage.setItem('sn-historia',raw);
  assert.equal(currentFight(createRun('franco',loadProgress(storage))).foe,'zanata');
 }
 assert.equal(createRun('franco',{franco:99}).chapter,6);
 assert.equal(createRunAt('franco',-1).chapter,0);
});

test('checkpoint retoma o chefe e os continues, e salva progresso separado por herói',()=>{
 const storage=memory(),progress={franco:3};
 const run=createRun('franco',progress);continueFight(run);saveCheckpoint(run,storage);
 const resumed=resumeRun('franco',progress,'bosses',storage);
 assert.equal(resumed.chapter,3);assert.equal(resumed.idx,0);assert.equal(resumed.continues,1);
 assert.equal(resumeRun('belga',{},'bosses',storage).chapter,0);
 winFight(resumed);saveCleared(resumed,storage);
 assert.equal(resumeRun('franco',loadProgress(storage),'bosses',storage).chapter,4);
});

test('checkpoints antigos de duelos, bloqueados ou fora do intervalo são descartados sem apagar capítulos',()=>{
 const storage=memory();
 for(const cp of [{version:1,chapter:2,idx:2,route:'classic'},{version:2,chapter:6,idx:0,route:'bosses'},{version:2,chapter:2,idx:2,route:'bosses'},{version:2,chapter:-1,idx:0,route:'bosses'}]) {
  storage.setItem('sn-historia-checkpoints',JSON.stringify({franco:cp}));
  const run=resumeRun('franco',{franco:2},'bosses',storage);assert.equal(run.chapter,2);assert.equal(run.idx,0);assert.equal(run.fights.length,1);
 }
});

test('todas as lutas da campanha terminam no motor',()=>{
 for(const boss of BOSSES){const st=createMatch({chars:[ALL.ryuchi,boss],seed:7});const brains=[createBrain(2),createBrain(1)];
  for(let i=0;i<21600&&st.phase!=='over';i++)step(st,aiInput(st,0,brains[0]),aiInput(st,1,brains[1]));
  assert.equal(st.phase,'over',boss.id);
 }
});

test('o final de cada herói encerra a fome e libera a galeria pelo progresso',()=>{
 for(const hero of HEROES){const run=createRun(hero.id,{[hero.id]:6});assert.equal(currentFight(run).foe,'djabo');winFight(run);
  assert.ok(tourComplete(run));assert.equal(nextChapter(run),null);const pages=closingPages(run,hero.name);
  assert.ok(pages.some(p=>p.startsWith('A FOME ACABOU.')));assert.ok(!pages.some(p=>p.includes('{ending}')||p.includes('{hero}')));
 }
});

test('mapa permite revisitar apenas capítulos concluídos ou o próximo chefe',()=>{
 const run=createRun('franco',{franco:2});assert.deepEqual(selectableChapters(run),[0,1,2]);assert.equal(moveChapter(run,1),false);
 assert.ok(moveChapter(run,-1));assert.equal(currentFight(run).foe,'chupetinha');moveChapter(run,-1);assert.equal(currentFight(run).foe,'zanata');assert.equal(moveChapter(run,-1),false);
 const storage=memory();storage.setItem('sn-historia','{"franco":2}');winFight(run);saveCleared(run,storage);assert.deepEqual(loadProgress(storage),{franco:2});
});
