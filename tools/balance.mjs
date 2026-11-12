// Mede o equilíbrio com CPU contra CPU: todos contra todos, dos dois lados.
// Uso: node tools/balance.mjs [lutas por par]   (padrão 4)
import { HEROES, BOSSES } from '../src/data/characters/index.js';
import { createMatch, step } from '../src/core/match.js';
import { createBrain, aiInput } from '../src/core/ai.js';

const N = +process.argv[2] || 4;
const all = [...HEROES, ...BOSSES];
const wins = Object.fromEntries(all.map((c) => [c.id, 0]));
const games = Object.fromEntries(all.map((c) => [c.id, 0]));
for (const a of all) for (const b of all) {
  if (a === b) continue;
  for (let s = 0; s < N; s++) {
    const st = createMatch({ chars: [a, b], seed: 1000 + s * 31 + all.indexOf(a) * 7 + all.indexOf(b) * 13 });
    const br = [createBrain(1), createBrain(1)];
    for (let i = 0; i < 60 * 500 && st.phase !== 'over'; i++) step(st, aiInput(st, 0, br[0]), aiInput(st, 1, br[1]));
    games[a.id]++;
    games[b.id]++;
    if (st.winner != null) wins[st.f[st.winner].ch.id]++;
  }
}
for (const c of all.sort((x, y) => wins[y.id] / games[y.id] - wins[x.id] / games[x.id])) console.log(c.id.padEnd(8), `${Math.round((100 * wins[c.id]) / games[c.id])}%`.padStart(4), `(${wins[c.id]}/${games[c.id]})`);
