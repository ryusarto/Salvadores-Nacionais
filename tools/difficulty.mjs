// Mede cada dificuldade: um "jogador" simulado (CPU de nível médio) contra a chefe.
// Uso: node tools/difficulty.mjs [lutas]   (padrão 30)
import { SYS } from '../src/data/system.js';
import { HEROES, BOSSES } from '../src/data/characters/index.js';
import { createMatch, step } from '../src/core/match.js';
import { createBrain, aiInput } from '../src/core/ai.js';

const N = +process.argv[2] || 30;
for (const D of SYS.DIFFICULTY) {
  let wins = 0;
  let rounds = 0;
  for (let s = 0; s < N; s++) {
    const st = createMatch({ chars: [HEROES[0], BOSSES[0]], seed: 500 + s, dmgMul: D.dmg });
    const br = [createBrain(1), createBrain(D.level)];
    for (let i = 0; i < 60 * 500 && st.phase !== 'over'; i++) step(st, aiInput(st, 0, br[0]), aiInput(st, 1, br[1]));
    if (st.winner === 0) wins++;
    rounds += st.f[0].rounds;
  }
  console.log(D.name.padEnd(8), `jogador simulado vence ${Math.round((100 * wins) / N)}% das lutas, ${(rounds / N).toFixed(1)} rounds por luta`);
}
