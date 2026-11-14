/**
 * CONTRATO DE ANIMAÇÃO.
 *
 * Diz, para cada estado do lutador, qual tira de sprites usar e qual quadro
 * dela mostrar. É a única ponte entre as regras do combate e a arte: o gerador
 * de guias de pose e o leitor de sprites usam esta mesma tabela, então uma tira
 * desenhada por cima do guia encaixa no jogo sem ajuste.
 *
 * Cada tira é uma imagem com N células quadradas lado a lado.
 */
import { SYS } from '../data/system.js';

export const CELL = 768; // tamanho da célula do guia, em pixels
export const FOOT = { x: 0.5, y: 700 / 768 }; // ponto do pé dentro da célula

/** Tiras de estado. frames: instantes amostrados. cycle: quadros de jogo por quadro de animação. */
export const STATE_ANIMS = {
  parado: { state: 'idle', frames: [0, 20, 40, 60], cycle: 20 },
  andar: { state: 'walk', frames: [0, 7, 14, 21], cycle: 7 },
  'andar-tras': { state: 'walk', frames: [0, 7, 14, 21], cycle: 7 },
  correr: { state: 'run', frames: [0, 4, 9, 13], cycle: 4 },
  agachar: { state: 'crouch', frames: [1, 2, 4, 8], sf: true },
  pulo: { state: 'air', frames: [0, 0, 0, 0], vy: [30, 12, -6, -24], y: 180 },
  recuo: { state: 'backdash', frames: [0, 5, 11, 16], sf: true },
  'escape-agarrao': { state: 'tech', frames: [0, 5, 10, 15], sf: true },
  'recuperacao-rolamento': { state: 'techroll', frames: [0, 6, 12, 18], sf: true },
  'defesa-em-pe': { state: 'guard', frames: [6] , sf: true },
  'defesa-agachado': { state: 'guard', frames: [6], sf: true, crouchBlock: true },
  'defesa-no-ar': { state: 'blockstun', frames: [0], y: 180 },
  'dano-alto': { state: 'hitstun', frames: [0], combo: 1 },
  'dano-baixo': { state: 'hitstun', frames: [0], combo: 2 },
  'dano-no-ar': { state: 'air_hit', frames: [0, 0, 0], vy: [18, 0, -18], y: 200 },
  caido: { state: 'knockdown', frames: [0] },
  levantar: { state: 'wakeup', frames: [1, 5, 9, 13], sf: true },
  tonto: { state: 'crumple', frames: [2, 8, 14, 20], sf: true },
  vitoria: { state: 'win', frames: [2, 8, 14, 20], sf: true },
};

/** Quadros de um golpe que viram células da tira `golpe-<tecla>`. */
export function movePicks(m) {
  const last = m.hits.length ? m.hits[m.hits.length - 1].to : m.startup + m.active;
  const first = m.hits.length ? m.hits[0].from : m.startup + 1;
  return [...new Set([1, Math.max(2, Math.round(m.startup * 0.6)), first, Math.round((first + last) / 2), last, Math.round((last + m.total) / 2)])]
    .filter((n) => n < m.total)
    .sort((a, b) => a - b);
}

const bySf = (frames, sf) => {
  let i = 0;
  while (i < frames.length - 1 && sf >= frames[i + 1]) i++;
  return i;
};
const byVy = (list, vy) => {
  let i = 0;
  while (i < list.length - 1 && vy < (list[i] + list[i + 1]) / 2) i++;
  return i;
};

/**
 * Tira e quadro para o lutador neste instante.
 * @returns {{name: string, index: number}}
 */
export function animFor(f, frame) {
  const A = STATE_ANIMS;
  // p: progresso de 0 a 1 dentro da tira, para tiras com outro número de quadros
  const cyc = (name) => {
    const t = frame / (A[name].cycle * A[name].frames.length);
    return { name, index: Math.floor(frame / A[name].cycle) % A[name].frames.length, p: t - Math.floor(t), loop: true };
  };
  const one = (name, index = 0) => {
    const len = A[name] ? A[name].frames.length : 1;
    return { name, index, p: Math.min(0.999, index / len) };
  };
  const hurt = () => one(f.crouchBlock ? 'dano-baixo' : f.comboHits % 2 ? 'dano-alto' : 'dano-baixo');
  const timed = (name, duration) => {
    const p = Math.max(0, Math.min(0.999, f.sf / duration));
    return { name, p, index: Math.floor(p * 4) };
  };
  switch (f.state) {
    case 'idle': return cyc('parado');
    case 'walk': return cyc(f.vx * f.face < 0 ? 'andar-tras' : 'andar');
    case 'dash': case 'run': case 'rush': case 'runstop': return cyc('correr');
    case 'crouch': return one('agachar', bySf(A.agachar.frames, f.sf));
    case 'prejump': case 'land': return one('agachar', 1);
    case 'air': return f.airGuard ? one('defesa-no-ar') : one('pulo', byVy(A.pulo.vy, f.vy));
    case 'backdash': return timed('recuo', SYS.BACKDASH.frames);
    case 'tech': return f.ch?.spriteRecovery ? timed('escape-agarrao', 20) : one('recuo');
    case 'guard': return one(f.crouchBlock ? 'defesa-agachado' : 'defesa-em-pe');
    case 'blockstun': return one(f.y > 0 ? 'defesa-no-ar' : f.crouchBlock ? 'defesa-agachado' : 'defesa-em-pe');
    case 'dizzy': return one('tonto', Math.floor(frame / 8) % A.tonto.frames.length);
    case 'techroll': return f.ch?.spriteRecovery ? timed('recuperacao-rolamento', SYS.TECH_ROLL.frames) : one('agachar', 3);
    case 'hitstun': case 'frozen': case 'thrown': return hurt();
    case 'slip': return one('dano-alto');
    case 'air_hit': return one('dano-no-ar', byVy(A['dano-no-ar'].vy, f.vy));
    case 'ko': return f.y > 0 ? one('dano-no-ar', 1) : one('caido');
    case 'knockdown': return one('caido');
    case 'wakeup': return one('levantar', bySf(A.levantar.frames, f.sf));
    case 'crumple': return one('tonto', bySf(A.tonto.frames, f.sf));
    case 'win': return one('vitoria', bySf(A.vitoria.frames, f.sf));
    case 'throwing': case 'throwEnd': {
      if (!f.ch?.spriteRecovery) return one('golpe-throw', 99);
      // Reach is the attack's first pose; hold the grip until actual release.
      const p = f.state === 'throwing'
        ? 0.25 + Math.min(0.249, f.sf / SYS.THROW.hold * 0.25)
        : Math.min(0.999, 0.5 + f.sf / 22 * 0.5);
      return { name: 'golpe-throw', p, index: Math.floor(p * 4) };
    }
    case 'attack': {
      const m = f.move;
      if (f.ch?.spritePhasedMoves?.includes(f.moveKey)) {
        const first = m.hits.length ? m.hits[0].from : m.startup + 1;
        const last = m.hits.length ? m.hits[m.hits.length - 1].to : m.startup + m.active;
        // Four drawings: preparation, wind-up, contact, recovery. The contact
        // pose follows the actual hit window, not a quarter of total duration.
        const p = f.sf < first ? Math.min(0.499, f.sf / first * 0.5)
          : f.sf <= last ? 0.5 : Math.min(0.999, 0.75 + (f.sf - last) / Math.max(1, m.total - last) * 0.25);
        return { name: `golpe-${f.moveKey}${f.move?.isTurbo || f.res?.finale ? '-turbo' : ''}`, p, index: Math.floor(p * 4) };
      }
      return { name: `golpe-${f.moveKey}${f.move?.isTurbo || f.res?.finale ? '-turbo' : ''}`, index: bySf(movePicks(m), f.sf), p: Math.min(0.999, f.sf / m.total) };
    }
    default: return cyc('parado');
  }
}
