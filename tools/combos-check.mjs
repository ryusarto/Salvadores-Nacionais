// Executa cada combo da lista e diz se ele funciona.
// Uso: node tools/combos-check.mjs [personagem]
import { ALL } from '../src/data/characters/index.js';
import { COMBOS } from '../src/data/combos.js';
import { createMatch, step } from '../src/core/match.js';
import { createRunner, runnerInput, createTracker, trackCombo } from '../src/core/combos.js';

/** Roda um combo contra a Zanata parada. Retorna { ok, reached, total, hits, dmg }. */
export function tryCombo(id, combo, gap = 175) {
  const st = createMatch({ chars: [ALL[id], ALL.zanata], seed: 3, training: true });
  st.phase = 'fight';
  st.f[0].x = 1200;
  st.f[1].x = 1200 + gap;
  st.f[0].super = 3000;
  const r = createRunner(combo);
  const t = createTracker(combo);
  let hits = 0;
  let dmg = 0;
  for (let i = 0; i < 600 && !t.done; i++) {
    step(st, runnerInput(r, st));
    trackCombo(t, st);
    for (const e of st.events) if (e.t === 'hit' && e.side === 0) { hits++; dmg += e.dmg; }
  }
  return { ok: t.done, reached: t.best, total: combo.steps.length, hits, dmg };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const only = process.argv[2];
  let bad = 0;
  for (const [id, list] of Object.entries(COMBOS)) {
    if (only && id !== only) continue;
    for (const c of list) {
      const r = tryCombo(id, c);
      if (!r.ok) bad++;
      console.log(`${r.ok ? 'OK  ' : 'FALHA'} ${id.padEnd(7)} ${c.name.padEnd(22)} ${c.steps.join(' ').padEnd(22)} etapas ${r.reached}/${r.total}  acertos ${r.hits}  dano ${r.dmg}`);
    }
  }
  console.log(bad ? `${bad} combo(s) falharam` : 'todos os combos funcionam');
}
