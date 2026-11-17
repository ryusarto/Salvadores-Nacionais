import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES, ALL } from '../../src/data/characters/index.js';
import { createMatch, step } from '../../src/core/match.js';
import { createBrain, aiInput } from '../../src/core/ai.js';
import { SYS } from '../../src/data/system.js';

const hero = (id) => HEROES.find((h) => h.id === id);

/** Luta CPU x CPU e conta os golpes que o lado `side` soltou. */
function usage(chars, seed, side, level = 1) {
  const st = createMatch({ chars, seed });
  const br = [createBrain(level), createBrain(level)];
  const used = {};
  for (let i = 0; i < 60 * 60 * 6 && st.phase !== 'over'; i++) {
    step(st, aiInput(st, 0, br[0]), aiInput(st, 1, br[1]));
    const f = st.f[side];
    if (f.state === 'attack' && f.sf === 1) used[f.moveKey] = (used[f.moveKey] || 0) + 1;
  }
  return used;
}

test('a CPU usa golpes no ar e o Golpe Blindado', () => {
  const total = {};
  for (let seed = 1; seed <= 6; seed++) for (const [k, n] of Object.entries(usage([hero('franco'), hero('belga')], seed, 0, 2))) total[k] = (total[k] || 0) + n;
  assert.ok((total.jL || 0) + (total.jM || 0) > 0, 'Leve ou Médio no ar');
  assert.ok(total.blindado > 0, 'Golpe Blindado');
});

test('o Ryuchi da CPU entra na Postura e acerta o contra-ataque e o corte carregado', () => {
  const total = {};
  for (let seed = 1; seed <= 6; seed++) for (const [k, n] of Object.entries(usage([hero('ryuchi'), hero('franco')], seed, 0))) total[k] = (total[k] || 0) + n;
  assert.ok(total['2S'] > 0, 'entra na postura');
  assert.ok(total.stCtr > 0, 'contra-ataque');
  assert.ok((total.stRel1 || 0) + (total.stRel2 || 0) + (total.stRel3 || 0) > 0, 'corte carregado');
});

test('dentro da postura o Ryuchi decide pelo que o rival faz', () => {
  const hold = hero('ryuchi').mech.aiHold;
  const rnd = () => 0;
  const me = { holdT: 0 };
  assert.deepEqual(hold({}, me, { state: 'attack', sf: 2, move: { startup: 8, range: 300, hits: [{}] } }, 250, rnd, 1), { S: 1, M: 1 });
  assert.deepEqual(hold({}, me, { state: 'idle' }, 250, rnd, 1), { S: 1, L: 1 });
  assert.deepEqual(hold({}, { holdT: 10 }, { state: 'idle' }, 500, rnd, 1), { S: 1 }, 'ainda carregando');
  assert.deepEqual(hold({}, { holdT: 80 }, { state: 'idle' }, 500, rnd, 1), {}, 'Fio cheio: solta');
});

test('sequência do plano do personagem sai virada para o rival', () => {
  const ch = { ...hero('franco'), mech: { ...hero('franco').mech, aiPlan: () => ({ seq: [{ x: 1, M: 1, H: 1, n: 2 }] }) } };
  const st = createMatch({ chars: [ch, hero('belga')], seed: 3 });
  st.phase = 'fight';
  st.f[0].x = 1500;
  st.f[1].x = 900;
  const brain = createBrain(2);
  let mark = null;
  for (let i = 0; i < 2000 && !mark; i++) {
    const inp = aiInput(st, 0, brain);
    if (inp.M && inp.H) mark = inp;
    if (!brain.queue.length) brain.wait = 0;
  }
  assert.ok(mark, 'o passo do plano saiu');
  assert.equal(mark.x, -1, 'x = 1 no plano vira "para o rival" (à esquerda aqui)');
});

test('a dificuldade sobe nos dois sentidos: nível da CPU e dano contra heróis', () => {
  const D = SYS.DIFFICULTY;
  for (let i = 1; i < D.length; i++) assert.ok(D[i].level > D[i - 1].level);
  assert.ok(D[1].dmg[1] > D[0].dmg[1], 'Normal: CPU bate mais que no Fácil');
  for (const d of D) assert.ok(d.bossDmg, `${d.name}: dano contra chefes definido`);
  assert.ok(Object.values(ALL).filter((c) => c.boss).length === 7);
});
