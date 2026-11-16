import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES, ALL } from '../../src/data/characters/index.js';
import { CHAPTERS, RIVALS } from '../../src/data/story.js';
import { createRun, currentFight, fightLevel, winFight, continueFight, talkLines, openingPages, closingPages, loadProgress, saveCleared } from '../../src/ui/story.js';
import { createMatch, step } from '../../src/core/match.js';
import { createBrain, aiInput } from '../../src/core/ai.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
};

test('cada herói tem duas batalhas de rima contra outros heróis, e depois a Zanata', () => {
  for (const h of HEROES) {
    const run = createRun(h.id);
    assert.equal(run.fights.length, 3, h.id);
    const [r1, r2, boss] = run.fights;
    for (const r of [r1, r2]) {
      assert.equal(r.kind, 'rival');
      assert.notEqual(r.foe, h.id, `${h.id} não luta contra si mesmo`);
      assert.ok(HEROES.some((x) => x.id === r.foe), `${r.foe} é herói`);
    }
    assert.notEqual(r1.foe, r2.foe);
    assert.deepEqual(boss, { foe: 'zanata', kind: 'boss' });
  }
  assert.deepEqual(Object.keys(RIVALS).sort(), HEROES.map((h) => h.id).sort());
});

test('todas as falas têm texto e um personagem que existe', () => {
  for (const h of HEROES) {
    const run = createRun(h.id);
    for (run.idx = 0; run.idx < run.fights.length; run.idx++) {
      for (const l of talkLines(run)) {
        assert.ok(l.say && l.say.length > 5, `${h.id}: fala vazia`);
        assert.ok(l.who === null || ALL[l.who], `${h.id}: ${l.who} não existe`);
      }
    }
  }
  assert.ok(openingPages('Franco').some((p) => p.includes('Franco')));
  assert.ok(!openingPages('Franco').some((p) => p.includes('{hero}')));
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
  // sem outro capítulo pronto, a turnê recomeça pelo último pronto
  assert.equal(CHAPTERS[createRun('franco', loadProgress(store)).chapter].id, 'ver-o-peso');
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

test('as três lutas do capítulo 1 terminam com CPU contra CPU', () => {
  const run = createRun('ryuchi');
  for (const f of run.fights) {
    const st = createMatch({ chars: [ALL.ryuchi, ALL[f.foe]], seed: 7 });
    const b0 = createBrain(2);
    const b1 = createBrain(1);
    for (let i = 0; i < 60 * 60 * 6 && st.phase !== 'over'; i++) step(st, aiInput(st, 0, b0), aiInput(st, 1, b1));
    assert.equal(st.phase, 'over', `luta contra ${f.foe} terminou`);
  }
});
