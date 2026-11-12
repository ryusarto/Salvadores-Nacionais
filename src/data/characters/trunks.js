import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * TRUNKS — armadilhas e agarrões.
 * Mecânica: CHAMADA. Marca o chão onde o rival está; depois de 2,5 segundos
 * um ataque cai naquele ponto. Só existe uma marca por vez: o jogo dele é
 * segurar ou empurrar o rival para dentro dela.
 */
const MARK_DELAY = 150;
const hasMark = (st, f) => st.ents.some((e) => e.owner === f.side && e.kind === 'mark');
const mark = (o = {}) => ({
  make: (st, f) => (hasMark(st, f) && !o.force ? null : proj({ kind: 'mark', behavior: 'strike', x: 0, y: 0, w: o.w || 220, h: 760, vx: 0, delay: o.delay ?? MARK_DELAY, life: 8, dmg: o.dmg ?? 1300, hitstun: 30, blockstun: 24, push: [0, 60], ginga: 1500, launch: [0, 30], kd: 'hard', stop: 14, juggle: 2, color: '#ffdf50', extra: { at_opponent: true, delay0: o.delay ?? MARK_DELAY } })),
});

const moves = {
  ...baseNormals({ reach: 1, dmg: 1.12 }),
  '2S': mv({ name: 'Chamada', startup: 16, active: 1, recovery: 18, anim: ['call', 'call'], spawn: [{ at: 16, ...mark() }], range: 1500, tags: ['zone', 'far', 'setup'],
    turbo: { spawn: [{ at: 12, ...mark({ delay: 80 }) }], startup: 12 } }),
  '5S': mv({ name: 'Mordida', startup: 8, active: 3, recovery: 30, guard: 'throw', box: bx(20, 140, 190, 260), dmg: 1600, anim: ['throwReach', 'throwReach'], cancel: [], tags: ['throw', 'close'],
    turbo: { startup: 6, dmg: 1900, box: bx(20, 140, 240, 260) } }),
  '6S': mv({ name: 'Ombrada', startup: 15, active: 5, recovery: 24, box: bx(20, 190, 190, 230), dmg: 900, hitstun: 24, push: [430, 200], anim: ['blindWind', 'blindHit'], armor: { from: 3, to: 15, hits: 1 }, motion: [{ from: 6, to: 20, vx: 14 }], tags: ['mid', 'advance', 'armor'],
    turbo: { armor: { from: 1, to: 15, hits: 2 }, dmg: 1100, launch: [17, 13], kd: 'hard' } }),
  '4S': mv({ name: 'Gancho da Rua', startup: 6, active: 6, recovery: 28, box: bx(0, 240, 190, 330), dmg: 1100, launch: [4, 29], anim: ['riseWind', 'upper'], inv: [{ from: 2, to: 12, type: 'air' }], cancel: [], tags: ['antiair'],
    turbo: { dmg: 1400, inv: [{ from: 1, to: 12, type: 'strike' }] } }),
  c1: mv({ name: 'Puxão', startup: 12, active: 4, recovery: 22, box: bx(40, 200, 340, 170), dmg: 500, hitstun: 34, pull: 380, anim: ['castWind', 'throwReach'], tags: ['mid', 'pull'] }),
  c2: mv({ name: 'Cabeçada', startup: 11, active: 4, recovery: 22, box: bx(20, 290, 205, 180), dmg: 1000, hitstun: 26, push: [260, 140], anim: ['heavyWind', 'overhead'], motion: [{ from: 5, to: 14, vx: 13 }], tags: ['close', 'advance'] }),
  SA1: mv({ name: 'Bombardeio', btn: 'X', startup: 10, active: 1, recovery: 36, anim: ['call', 'call'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [{ at: 10, ...mark({ delay: 34, dmg: 1900, force: true }) }], range: 1500, tags: ['super'] }),
  SA3: mv({ name: 'A Ligação', btn: 'X', startup: 14, active: 1, recovery: 44, anim: ['call', 'call'], cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
    spawn: [{ at: 14, ...mark({ delay: 48, dmg: 4000, w: 460, force: true }) }], range: 1500, tags: ['super', 'big'] }),
};

export default {
  id: 'trunks',
  name: 'TRUNKS',
  style: 'Armadilhas e agarrões',
  mechName: 'CHAMADA',
  mechDesc: 'Marca o chão sob o rival; segundos depois, um ataque cai ali. Segure ou empurre o rival para a marca.',
  colors: { skin: '#9a6a48', top: '#4a2a7a', bottom: '#3a3a40', accent: '#ffdf50', hair: '#6b4a2a', shoe: '#e8e8e8' },
  look: { hair: 'dreads', weapon: 'phone', sleeves: 'long' },
  walkF: 5.7, walkB: 4.5, jumpScale: 0.96, hpScale: 1.1,
  moves,
  mech: {
    init(f) {
      f.res = {};
    },
    hud(f, o, st) {
      const m = st ? st.ents.find((e) => e.owner === f.side && e.kind === 'mark') : null;
      return { label: 'CHAMADA', pips: 0, value: 0, text: m ? `CAINDO EM ${Math.ceil(m.delay / 60)}s` : 'PRONTA', ready: !m, color: '#ffdf50' };
    },
    aiPlan(st, f, o, dist, rnd) {
      return !hasMark(st, f) && rnd() < 0.3 ? { key: '2S' } : null;
    },
  },
  ai: { aggression: 0.6, block: 0.5, antiAir: 0.55, range: 'close' },
};
