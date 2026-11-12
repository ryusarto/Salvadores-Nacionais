import { ALL } from '../../src/data/characters/index.js';
import { createMatch, step } from '../../src/core/match.js';
import { EMPTY_INPUT } from '../../src/core/input.js';

/** Cria uma luta já na fase de combate, com os lutadores a `gap` pixels. */
export function fight(a = 'franco', b = 'zanata', gap = 180) {
  const st = createMatch({ chars: [ALL[a], ALL[b]], seed: 1 });
  st.phase = 'fight';
  st.f[0].x = 1200;
  st.f[1].x = 1200 + gap;
  return st;
}
export const I = (o = {}) => ({ ...EMPTY_INPUT, ...o });
/** Avança n quadros com entradas fixas. Junta os eventos. */
export function run(st, n, in0 = EMPTY_INPUT, in1 = EMPTY_INPUT) {
  const ev = [];
  for (let i = 0; i < n; i++) {
    step(st, in0, in1);
    ev.push(...st.events);
  }
  return ev;
}
/** Aperta por 1 quadro e depois solta por `after` quadros. */
export function tap(st, in0, after = 0, in1 = EMPTY_INPUT, hold0 = EMPTY_INPUT) {
  const ev = run(st, 1, I(in0), in1);
  if (after) ev.push(...run(st, after, hold0, in1));
  return ev;
}
export const has = (ev, t) => ev.some((e) => e.t === t);
export const BACK2 = I({ x: 1 }); // jogador 2 olha para a esquerda: "para trás" é x = +1
