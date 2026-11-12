import { EMPTY_INPUT } from './input.js';

/**
 * LISTA DE COMBOS.
 *
 * Um combo é uma lista de etapas. Cada etapa é a tecla de um golpe da ficha
 * ('5L', '2H', '6S', 'c1', 'SA3'...) ou 'sj' (pulo alto depois do Gancho).
 * Este módulo sabe:
 *  - acompanhar um combo durante a luta (modo desafio do Treino);
 *  - executar um combo sozinho, quadro a quadro (testes e demonstração).
 * Os combos de cada personagem ficam na ficha, em `combos`, e um teste
 * automático executa todos: um combo que não funciona não entra no jogo.
 */

/** Entrada (sequência de quadros) que solta uma etapa. `toward` = 1 se o rival está à direita. */
export function stepInputs(step, toward) {
  const f = (o) => ({ ...EMPTY_INPUT, ...o });
  const hold = (o, n) => Array.from({ length: n }, () => f(o));
  if (step === 'sj') return hold({ y: 1, x: toward }, 6);
  if (step === 'c1') return [...hold({ x: toward }, 2), ...hold({ x: -toward }, 2), f({ x: -toward, L: 1 }), f({ x: -toward, L: 1 })];
  if (step === 'c2') return [...hold({ y: -1 }, 2), ...hold({ x: toward }, 2), f({ x: toward, M: 1 }), f({ x: toward, M: 1 })];
  if (step === 'SA3') return [f({ X: 1 }), f({ X: 1 })];
  if (step === 'SA1') return [f({ y: -1 }), f({ y: -1, X: 1 }), f({ y: -1, X: 1 })];
  if (step === '5LL' || step === '5LLL') return [f({ L: 1 })];
  const air = step[0] === 'j';
  const d = air ? '5' : step[0];
  const btn = step[step.length - 1];
  const dir = {};
  if (d === '2' || d === '3') dir.y = -1;
  if (d === '6' || d === '3') dir.x = toward;
  if (d === '4') dir.x = -toward;
  return [f(dir), f({ ...dir, [btn]: 1 }), f({ ...dir, [btn]: 1 })];
}

/** Rótulo de uma etapa para a tela. `glyph` traduz botões (teclado ou controle). */
export function stepLabel(step, glyph) {
  const g = (b) => glyph[b] || b;
  if (step === 'sj') return '↑ (pulo alto)';
  if (step === 'c1') return `→ ← + ${g('L')}`;
  if (step === 'c2') return `↓ → + ${g('M')}`;
  if (step === 'SA3') return `${g('X')} (3 barras)`;
  if (step === 'SA1') return `↓ + ${g('X')}`;
  if (step === '5LL' || step === '5LLL') return g('L');
  const air = step[0] === 'j';
  const d = air ? '5' : step[0];
  const arrow = { 2: '↓ + ', 3: '↘ + ', 4: '← + ', 6: '→ + ' }[d] || '';
  return `${air ? 'no ar: ' : ''}${arrow}${g(step[step.length - 1])}`;
}

/** Cria o acompanhamento de um combo para o lutador `side`. */
export function createTracker(combo, side = 0) {
  return { combo, side, idx: 0, done: false, best: 0, fails: 0, doneT: 0 };
}

/** Atualiza o acompanhamento com os eventos do quadro. Retorna o próprio tracker. */
export function trackCombo(t, st) {
  if (!t) return t;
  const me = st.f[t.side];
  const foe = st.f[1 - t.side];
  const steps = t.combo.steps;
  if (t.done) {
    if (++t.doneT > 150 && foe.comboHits === 0) Object.assign(t, { idx: 0, done: false, doneT: 0 });
    return t;
  }
  if (t.idx > 0 && foe.comboHits === 0 && !['hitstun', 'air_hit', 'crumple', 'dizzy'].includes(foe.state)) {
    t.fails++;
    t.idx = 0; // o combo caiu: recomeça
  }
  const want = steps[t.idx];
  if (want === 'sj') {
    if (me.sj && t.idx > 0) t.idx++;
  } else {
    for (const e of st.events) {
      if (e.t !== 'hit' || e.side !== t.side || e.key !== want) continue;
      if (t.idx === 0 && e.combo !== 1) continue; // precisa começar o combo
      t.idx++;
      break;
    }
  }
  t.best = Math.max(t.best, t.idx);
  if (t.idx >= steps.length) {
    t.done = true;
    t.doneT = 0;
    st.events.push({ t: 'pop', str: 'COMBO COMPLETO!', x: me.x, y: 600, color: '#7dff8a', size: 60 });
  }
  return t;
}

/**
 * Executor: produz, quadro a quadro, a entrada que solta o combo.
 * Use `next(st)` a cada quadro e passe o resultado como entrada do lutador.
 */
export function createRunner(combo, side = 0) {
  return { combo, side, idx: 0, queue: [], wait: 0, sent: false };
}

export function runnerInput(r, st) {
  const me = st.f[r.side];
  const foe = st.f[1 - r.side];
  const toward = Math.sign(foe.x - me.x) || me.face;
  const steps = r.combo.steps;
  if (r.queue.length) return r.queue.shift();
  if (r.idx >= steps.length) return EMPTY_INPUT;
  const step = steps[r.idx];
  const prev = steps[r.idx - 1];
  if (r.sent) {
    // espera o golpe enviado sair (ou o pulo alto começar)
    const started = step === 'sj' ? me.sj : me.moveKey === step || (step.startsWith('5L') && me.moveKey?.startsWith('5L'));
    if (started) {
      r.idx++;
      r.sent = false;
      r.wait = 0;
    } else if (++r.wait > 45) {
      r.idx = steps.length + 1; // falhou
    }
    return EMPTY_INPUT;
  }
  let ready;
  if (r.idx === 0) ready = ['idle', 'crouch', 'walk'].includes(me.state);
  else if (prev === 'sj') ready = me.state === 'air' && me.y > 40 && Math.abs(me.y - foe.y) < 260;
  else ready = me.state === 'attack' && me.connected === 'hit' && me.sf > me.move.startup + 1 && me.hitstop === 0;
  if (step[0] === 'j' && prev !== 'sj') ready = ready && me.state === 'attack';
  if (!ready) return EMPTY_INPUT;
  r.queue = stepInputs(step, toward);
  r.sent = true;
  return r.queue.shift();
}

/** O executor terminou? ok = todas as etapas saíram. */
export const runnerDone = (r) => ({ finished: r.idx >= r.combo.steps.length, ok: r.idx === r.combo.steps.length });
