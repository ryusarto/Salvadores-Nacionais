import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL } from '../../src/data/characters/index.js';
import { createMatch, step, makeRng } from '../../src/core/match.js';
import { banterEvents, brothersFight } from '../../src/ui/banter.js';
import { DOG_CALLS, DOG_BITES_FRANCO, BROTHER_INTRO } from '../../src/data/banter.js';
import { rhymeTalk } from '../../src/data/story.js';
import { fight, run, tap, I } from './helpers.js';

const pops = (ev) => ev.filter((e) => e.t === 'pop').map((e) => e.str);

test('irmãos: Franco x Chapuh têm falas próprias no começo do round', () => {
  const st = createMatch({ chars: [ALL.franco, ALL.chapuh], seed: 3 });
  assert.ok(brothersFight(st));
  const memo = {};
  const said = [];
  for (let i = 0; i < 100; i++) {
    step(st);
    said.push(...pops(banterEvents(st, memo)));
  }
  assert.deepEqual(said, BROTHER_INTRO[0].map((l) => l.str));
  // outras lutas não têm essas falas
  const other = createMatch({ chars: [ALL.franco, ALL.belga], seed: 3 });
  assert.ok(!brothersFight(other));
  step(other);
  assert.deepEqual(banterEvents(other, {}), []);
});

test('irmãos: quando o Antônio morde o Franco, ele reclama', () => {
  const st = fight('chapuh', 'franco', 400);
  const memo = {};
  const said = [];
  run(st, 1, I({ x: 1, S: 1 }));
  for (let i = 0; i < 80; i++) {
    step(st);
    said.push(...pops(banterEvents(st, memo)));
  }
  assert.ok(said.includes(DOG_BITES_FRANCO[0]), said.join(' | '));
});

test('o Chapuh às vezes chama o pinscher de Antônio, em qualquer luta', () => {
  let called = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const st = fight('chapuh', 'belga', 600);
    st.rng = makeRng(seed * 7919);
    const ev = tap(st, { x: 1, S: 1 }, 20);
    if (pops(ev).some((s) => DOG_CALLS.includes(s))) called++;
  }
  assert.ok(called > 0 && called < 10, `chamou ${called} de 10`);
});

test('irmãos: a batalha de rima entre os dois tem diálogo próprio', () => {
  const talk = rhymeTalk('franco', 'chapuh');
  assert.ok(talk[0].say.includes('Briga de irmão'));
  assert.ok(talk.some((l) => l.say.includes('Antônio')));
  assert.ok(!rhymeTalk('franco', 'belga')[0].say.includes('irmão'));
});
