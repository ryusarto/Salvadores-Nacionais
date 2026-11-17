import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL, HEROES } from '../../src/data/characters/index.js';
import { createMatch, step, resetTraining } from '../../src/core/match.js';
import { applyHit } from '../../src/core/combat.js';
import { encounterStage, CHAPTER_STAGES } from '../../src/data/stages.js';
import { spriteOptions } from '../../src/render/sprite-profiles.js';
import { createLesson, advanceLesson, skipLesson } from '../../src/ui/lessons.js';
import {loadPreferences} from '../../src/ui/preferences.js';
const lethal = st => { const m=st.f[0].ch.moves['5L'];applyHit(st,st.f[0],st.f[1],{...m.hits[0],dmg:999999},{type:'move',m}); };

test('KO no Treino restaura postura, entidades, buffers e permite outro acerto',()=>{
 const st=createMatch({chars:[ALL.franco,ALL.zanata],training:true});st.phase='fight';st.f[0].alt=true;
 lethal(st);assert.equal(st.f[1].state,'ko');step(st);
 assert.equal(st.f[1].state,'idle');assert.equal(st.f[1].hp,st.f[1].maxHp);assert.equal(st.freeze,0);assert.equal(st.ents.length,0);assert.ok(st.f[0].alt);
 const hp=st.f[1].hp,m=st.f[0].ch.moves['5L'];applyHit(st,st.f[0],st.f[1],m.hits[0],{type:'move',m});assert.ok(st.f[1].hp<hp);
});

test('reset manual do Treino não altera partidas normais',()=>{
 const st=createMatch({chars:[ALL.franco,ALL.zanata]});assert.equal(resetTraining(st),false);assert.equal(st.phase,'intro');
});

test('Djabo reinicia na forma política a cada round e preserva a pontuação',()=>{
 const st=createMatch({chars:[ALL.franco,ALL.djabo]});st.phase='fight';lethal(st);assert.equal(st.f[1].ch.form,2);
 for(let i=0;i<110;i++)step(st);lethal(st);for(let i=0;i<160;i++)step(st);
 assert.equal(st.round,2);assert.equal(st.f[1].ch.form,1);assert.equal(st.f[0].rounds,1);assert.equal(st.f[1].hp,9000);
});

test('a arena segue o capítulo e os chefes de Belém têm variantes próprias',()=>{
 for(let chapter=0;chapter<7;chapter++)assert.equal(encounterStage({mode:'story',story:{chapter},foe:ALL.franco}),CHAPTER_STAGES[chapter]);
 assert.equal(encounterStage({mode:'versus',foe:ALL.chupetinha}),'palco');assert.equal(encounterStage({mode:'versus',foe:ALL.pavanassi}),'banheiros');
});

test('perfis de sprite seguem a ficha, inclusive lados independentes e efeitos',()=>{
 assert.equal(spriteOptions('ryuchi-esquerda-fx',HEROES).frames,6);
 assert.equal(spriteOptions('mdep',HEROES).frames,10);
 const boss={id:'novo',spriteProfile:'six-frame'};assert.equal(spriteOptions('novo',[boss]).cellSize,500);
});

test('tutorial distingue etapa cumprida de etapa pulada',()=>{
 const lesson=createLesson(0),st={f:[{x:121,y:0}],events:[]};assert.ok(advanceLesson(lesson,st));assert.deepEqual(lesson.passed,[0]);
 st.events=[{t:'block',side:0}];advanceLesson(lesson,st);
 st.events=[{t:'hit',side:0,combo:4}];advanceLesson(lesson,st);
 st.events=[{t:'hit',side:0,launch:true}];advanceLesson(lesson,st);assert.ok(!lesson.complete);
 st.f[0].y=100;advanceLesson(lesson,st);assert.ok(lesson.complete);assert.equal(lesson.passed.length,4);
 const skipped=createLesson(0);skipLesson(skipped);assert.deepEqual(skipped.skipped,[0]);assert.equal(skipped.passed.length,0);
});

test('opções rejeitam tipos inválidos vindos do armazenamento',()=>{
 assert.deepEqual(loadPreferences({getItem:()=>'{"leftHanded":"false","largeButtons":1,"reducedEffects":true}'}),{leftHanded:false,largeButtons:false,reducedEffects:true});
});
