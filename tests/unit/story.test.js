import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES, ALL } from '../../src/data/characters/index.js';
import { CHAPTERS, RIVALS } from '../../src/data/story.js';
import { createRun, nextChapter, currentFight, fightLevel, winFight, continueFight, talkLines, openingPages, closingPages, loadProgress, saveCleared } from '../../src/ui/story.js';
import { createMatch, step } from '../../src/core/match.js';
import { createBrain, aiInput } from '../../src/core/ai.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

test('cada herói tem duas batalhas de rima contra outros heróis, e depois o chefe', () => {
  for (const [done, boss] of [[0, 'zanata'], [1, 'chupetinha'], [2, 'pavanassi'], [3, 'fujao'], [4, 'pai-fujao']]) for (const h of HEROES) {
    const run = createRun(h.id, { [h.id]: done });
    assert.equal(run.fights.length, 3, h.id);
    const [r1, r2, last] = run.fights;
    for (const r of [r1, r2]) {
      assert.equal(r.kind, 'rival');
      assert.notEqual(r.foe, h.id, `${h.id} não luta contra si mesmo`);
      assert.ok(HEROES.some((x) => x.id === r.foe), `${r.foe} é herói`);
    }
    assert.notEqual(r1.foe, r2.foe);
    assert.deepEqual(last, { foe: boss, kind: 'boss' });
  }
  for (const table of Object.values(RIVALS)) assert.deepEqual(Object.keys(table).sort(), HEROES.map((h) => h.id).sort());
  // nos três capítulos de Belém, ninguém repete rival
  for (const h of HEROES) assert.equal(new Set([...RIVALS['ver-o-peso'][h.id], ...RIVALS.palco[h.id], ...RIVALS.banheiros[h.id]]).size, 6, h.id);
});

test('todas as falas têm texto e um personagem que existe', () => {
  for (const done of [0, 1, 2, 3, 4]) for (const h of HEROES) {
    const run = createRun(h.id, { [h.id]: done });
    for (run.idx = 0; run.idx < run.fights.length; run.idx++) {
      for (const l of talkLines(run)) {
        assert.ok(l.say && l.say.length > 5, `${h.id}: fala vazia`);
        assert.ok(l.who === null || ALL[l.who], `${h.id}: ${l.who} não existe`);
      }
    }
  }
  const run = createRun('franco');
  assert.ok(openingPages(run, 'Franco').some((p) => p.includes('Franco')));
  assert.ok(!openingPages(run, 'Franco').some((p) => p.includes('{hero}')));
});

test('a escada: vence, vence, vence o chefe e salva o capítulo', () => {
  const store = memory();
  const run = createRun('franco', loadProgress(store));
  assert.equal(CHAPTERS[run.chapter].id, 'ver-o-peso');
  assert.equal(winFight(run), 'next');
  assert.equal(winFight(run), 'next');
  assert.equal(currentFight(run).kind, 'boss');
  assert.equal(winFight(run), 'cleared');
  assert.ok(run.cleared);
  assert.ok(closingPages(run, 'Franco').length > 0);
  saveCleared(run, store);
  assert.deepEqual(loadProgress(store), { franco: 1 });
  assert.equal(nextChapter(run).id, 'palco');
  // com o capítulo 1 vencido, a turnê segue para a frente do palco
  const run2 = createRun('franco', loadProgress(store));
  assert.equal(CHAPTERS[run2.chapter].id, 'palco');
  assert.equal(run2.fights[2].foe, 'chupetinha');
});

test('perder e continuar recomeça a mesma luta e conta o continue', () => {
  const run = createRun('belga');
  winFight(run);
  const before = currentFight(run);
  continueFight(run);
  assert.equal(currentFight(run), before);
  assert.equal(run.continues, 1);
});

test('a CPU começa um degrau abaixo na primeira batalha de rima', () => {
  const run = createRun('majis');
  assert.equal(fightLevel(run, 2), 1);
  assert.equal(fightLevel(run, 0), 0);
  winFight(run);
  assert.equal(fightLevel(run, 2), 2);
});

test('progresso estragado no armazenamento não quebra a turnê', () => {
  const store = memory();
  store.setItem('sn-historia', '{quebrado');
  assert.deepEqual(loadProgress(store), {});
  assert.ok(createRun('dney', loadProgress(store)));
});

test('as lutas dos capítulos 1 a 5 terminam com CPU contra CPU', () => {
  for (const done of [0, 1, 2, 3, 4]) for (const f of createRun('ryuchi', { ryuchi: done }).fights) {
    const st = createMatch({ chars: [ALL.ryuchi, ALL[f.foe]], seed: 7 });
    const b0 = createBrain(2);
    const b1 = createBrain(1);
    for (let i = 0; i < 60 * 60 * 6 && st.phase !== 'over'; i++) step(st, aiInput(st, 0, b0), aiInput(st, 1, b1));
    assert.equal(st.phase, 'over', `luta contra ${f.foe} terminou`);
  }
});
