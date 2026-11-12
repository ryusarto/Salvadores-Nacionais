import test from 'node:test';
import assert from 'node:assert/strict';
import { HEROES } from '../../src/data/characters/index.js';
import { COMBOS } from '../../src/data/combos.js';
import { tryCombo } from '../../tools/combos-check.mjs';

test('lista de combos: todo herói tem pelo menos 3 combos', () => {
  for (const h of HEROES) assert.ok((COMBOS[h.id] || []).length >= 3, `${h.id} tem poucos combos`);
});

test('lista de combos: cada combo da lista funciona de verdade no jogo', () => {
  for (const [id, list] of Object.entries(COMBOS)) {
    for (const c of list) {
      for (const s of c.steps) if (s !== 'sj') assert.ok(HEROES.find((h) => h.id === id).moves[s], `${id}: ${c.name} usa ${s}, que não existe`);
      const r = tryCombo(id, c);
      assert.ok(r.ok, `${id}: "${c.name}" parou na etapa ${r.reached} de ${r.total}`);
    }
  }
});
