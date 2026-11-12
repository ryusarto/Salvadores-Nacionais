import { mv, bx, baseNormals } from '../movekit.js';

/**
 * CAPETA ZANATA — chefe de Belém. Domina a distância com o chicote.
 * Mecânica: FÚRIA. Abaixo de 40% de vida, os golpes de chicote recuperam
 * mais rápido e ela anda mais depressa.
 */
const FURY_HP = 0.4;
const FURY_RECOVERY = 5;
const furyCache = new Map();

const whip = (o) => mv({ weapon: 'whip', ...o });

const moves = {
  ...baseNormals({ reach: 1.05, anims: { H: 'kickHigh' } }),
  '5M': whip({ name: 'Estalo', btn: 'M', startup: 10, active: 4, recovery: 19, box: bx(60, 250, 400, 90), dmg: 550, anim: ['whipWind', 'whipHi'], tags: ['poke', 'far'] }),
  '5H': whip({ name: 'Chibatada', btn: 'H', startup: 15, active: 4, recovery: 27, box: bx(60, 230, 540, 110), dmg: 850, anim: ['whipWind', 'whipHi'], tags: ['poke', 'far', 'heavy'] }),
  '2M': whip({ name: 'Estalo Baixo', btn: 'M', startup: 11, active: 4, recovery: 20, crouch: true, guard: 'low', box: bx(60, 10, 420, 80), dmg: 500, anim: ['crouch', 'whipLow'], tags: ['poke', 'far', 'low'] }),
  '5S': whip({ name: 'Chicotada', startup: 18, active: 5, recovery: 30, box: bx(80, 220, 700, 120), dmg: 950, push: [170, 140], anim: ['whipWind', 'whipHi'], fx: 'crack', tags: ['far', 'zone'],
    turbo: { startup: 14, hits: [{ from: 15, to: 18, box: bx(80, 220, 700, 120), dmg: 600, hitstun: 26 }, { from: 27, to: 30, box: bx(80, 200, 720, 160), dmg: 700, launch: [9, 20] }], recovery: 34 } }),
  '6S': whip({ name: 'Laço', startup: 20, active: 4, recovery: 26, box: bx(80, 240, 640, 100), dmg: 400, hitstun: 38, pull: 520, anim: ['whipWind', 'whipHi'], fx: 'lasso', tags: ['far', 'pull'],
    turbo: { startup: 15, dmg: 600, hitstun: 44 } }),
  '2S': whip({ name: 'Chicote Rasteiro', startup: 16, active: 5, recovery: 30, crouch: true, guard: 'low', box: bx(80, 0, 580, 70), dmg: 800, launch: [6, 12], kd: 'hard', anim: ['crouch', 'whipLow'], cancel: [], tags: ['far', 'low', 'knockdown'],
    turbo: { startup: 12, dmg: 1000 } }),
  '4S': mv({ name: 'Salto Agulha', startup: 5, active: 9, recovery: 30, box: bx(0, 180, 180, 340), dmg: 1000, launch: [5, 29], anim: ['riseWind', 'kickHigh'], fx: 'rise',
    inv: [{ from: 1, to: 8, type: 'strike' }], motion: [{ from: 5, to: 9, vx: 4, vy: 26 }], flags: { landEnds: true, landRecovery: 15 }, cancel: [], tags: ['antiair', 'reversal'] }),
  SA1: whip({ name: 'Tempestade de Chicote', btn: 'X', startup: 9, active: 26, recovery: 34, anim: ['whipWind', 'whipHi'], fx: 'crack', cost: { super: 1000 },
    hits: [0, 1, 2, 3, 4].map((i) => ({ from: 10 + i * 5, to: 12 + i * 5, box: bx(60, 60 + (i % 2) * 150, 620, 200), dmg: i === 4 ? 800 : 380, hitstun: 28, push: [10, 30], launch: i === 4 ? [12, 22] : null, kd: 'hard' })),
    inv: [{ from: 1, to: 10, type: 'all' }], tags: ['super'] }),
  SA3: whip({ name: 'Intimação', btn: 'X', startup: 12, active: 4, recovery: 50, anim: ['whipWind', 'whipHi'], fx: 'lasso', cost: { super: 3000 },
    hits: [{ from: 13, to: 16, box: bx(60, 100, 760, 320), dmg: 1200, hitstun: 60, pull: 640 }, { from: 40, to: 44, box: bx(0, 0, 320, 520), dmg: 2800, launch: [14, 32], kd: 'hard' }],
    inv: [{ from: 1, to: 16, type: 'all' }], tags: ['super', 'big'] }),
};

export default {
  id: 'zanata',
  name: 'CAPETA ZANATA',
  style: 'Chefe — longa distância',
  mechName: 'FÚRIA',
  mechDesc: 'Com pouca vida, o chicote fica mais rápido.',
  colors: { skin: '#ebc4a4', top: '#3a2d3d', top2: '#f4f0ea', bottom: '#3a2d3d', accent: '#d3b377', hair: '#e6c46a', shoe: '#1c1418' },
  look: { hair: 'long', weapon: 'whip' },
  walkF: 5.2, walkB: 4.4, jumpScale: 0.95, hpScale: 1.1,
  boss: true,
  place: 'BELÉM — PA',
  moves,
  mech: {
    init(f) {
      f.res = { fury: false };
    },
    tick(st, f) {
      if (!f.res.fury && f.hp > 0 && f.hp / f.maxHp <= FURY_HP) {
        f.res.fury = true;
        st.events.push({ t: 'fury', side: f.side, x: f.x });
      }
    },
    modifyMove(f, m) {
      if (!f.res.fury || m.weapon !== 'whip' || m.type === 'super') return m;
      if (!furyCache.has(m)) furyCache.set(m, { ...m, total: m.total - FURY_RECOVERY, recovery: m.recovery - FURY_RECOVERY });
      return furyCache.get(m);
    },
    hud(f) {
      return { label: 'FÚRIA', pips: 1, value: f.res.fury ? 1 : 0, ready: f.res.fury, readyText: 'ATIVA' };
    },
  },
  ai: { aggression: 0.45, block: 0.55, antiAir: 0.7, range: 'far' },
};
