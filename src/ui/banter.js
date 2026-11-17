import { BROTHERS, BROTHER_INTRO, DOG_BITES_FRANCO, FRANCO_HITS_DOG, BROTHER_WIN } from '../data/banter.js';

/**
 * Falas especiais quando os irmãos Franco e Chapuh se enfrentam.
 * Lê os eventos do quadro e devolve eventos 'pop' extras para os efeitos.
 * `memo` guarda o que já foi dito (um objeto vazio por luta).
 */
export function brothersFight(st) {
  const ids = st.f.map((f) => f.ch.id);
  return BROTHERS.every((id) => ids.includes(id));
}

export function banterEvents(st, memo) {
  if (!brothersFight(st)) return [];
  const out = [];
  const side = (id) => st.f.findIndex((f) => f.ch.id === id);
  const say = (id, str, extra = {}) => {
    const f = st.f[side(id)];
    out.push({ t: 'pop', str, x: f.x, y: 640, color: id === 'franco' ? '#ffcf2a' : '#9ff5e8', size: 34, dur: 110, ...extra });
  };
  // começo do round: uma fala de cada irmão
  if (st.phase === 'intro') {
    const lines = BROTHER_INTRO[(st.round - 1) % BROTHER_INTRO.length];
    if (st.pf === 8) say(lines[0].who, lines[0].str);
    if (st.pf === 58) say(lines[1].who, lines[1].str);
  }
  const ch = side('chapuh');
  const fr = side('franco');
  for (const e of st.events) {
    // o Antônio (o pinscher) mordeu o Franco
    if (e.t === 'hit' && e.side === ch && ['6S', '4S', 'SA3'].includes(e.key) && !(memo.bite > st.frame)) {
      memo.bite = st.frame + 240;
      memo.biteN = (memo.biteN || 0) + 1;
      say('franco', DOG_BITES_FRANCO[(memo.biteN - 1) % DOG_BITES_FRANCO.length], { y: 700 });
    }
    // o Franco acertou o Antônio no caminho (projéteis se anulando)
    if (e.t === 'clash' && !(memo.clash > st.frame) && st.ents.some((en) => en.kind === 'dog')) {
      memo.clash = st.frame + 240;
      say('franco', FRANCO_HITS_DOG);
    }
    if (e.t === 'ko' && !memo['ko' + st.round]) {
      memo['ko' + st.round] = true;
      const winner = e.side === fr ? 'chapuh' : 'franco';
      say(winner, BROTHER_WIN[winner], { size: 40 });
    }
  }
  return out;
}
