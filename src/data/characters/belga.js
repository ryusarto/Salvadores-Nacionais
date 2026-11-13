import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * BELGA — boxeador de curta distância.
 * Mecânica: BPM. Cada golpe que acerta sobe o ritmo (até 4). Cada nível tira
 * 1 quadro da recuperação dos golpes normais e soma 3% de dano. Levar golpe
 * derruba o ritmo.
 */
const BPM_MAX = 4;
const BPM_DECAY = 150;
const BPM_DMG = 0.03;
const cache = new Map();

const vinyl = (o = {}) => proj({ kind: 'vinyl', x: 100, y: 240, w: 96, h: 96, vx: 8, life: 220, dmg: 600, color: '#ffa828', ...o });

const moves = {
  ...baseNormals({ reach: 0.86, speed: -1 }),
  '5S': mv({ name: 'Vinil', startup: 14, active: 1, recovery: 26, anim: ['castWind', 'cast'], spawn: [{ at: 14, ...vinyl() }], tags: ['zone'],
    turbo: { spawn: [{ at: 12, ...vinyl({ vx: 11, hits: 2, dmg: 450 }) }], recovery: 22 } }),
  '6S': mv({ name: 'Direto de Esquerda', startup: 14, active: 4, recovery: 20, box: bx(30, 250, 210, 130), dmg: 900, push: [220, 120], anim: ['heavyWind', 'punchH'], motion: [{ from: 4, to: 17, vx: 16 }], tags: ['mid', 'advance'],
    turbo: { startup: 11, dmg: 1100, launch: [11, 17] } }),
  '2S': mv({ name: 'Pêndulo', startup: 11, active: 1, recovery: 14, anim: ['crouch', 'blockLo'], inv: [{ from: 3, to: 18, type: 'upper' }], motion: [{ from: 3, to: 16, vx: 10 }], cancel: ['special', 'super'], flags: { freeCancel: true, followNormals: true }, tags: ['close', 'evade'],
    turbo: { inv: [{ from: 1, to: 20, type: 'upper' }], startup: 8, recovery: 12 } }),
  '4S': mv({ name: 'Gancho de Vinil', startup: 4, active: 9, recovery: 30, box: bx(0, 220, 170, 330), dmg: 1200, launch: [4, 30], anim: ['riseWind', 'rise'], inv: [{ from: 1, to: 7, type: 'strike' }], motion: [{ from: 4, to: 8, vx: 5, vy: 26 }], flags: { landEnds: true, landRecovery: 15 }, cancel: [], tags: ['antiair', 'reversal'],
    turbo: { dmg: 1500, inv: [{ from: 1, to: 11, type: 'all' }] } }),
  c1: mv({ name: 'Um-Dois', startup: 6, active: 9, recovery: 16, anim: ['punchWind', 'flurry'], motion: [{ from: 3, to: 14, vx: 6 }],
    hits: [{ from: 7, to: 8, box: bx(30, 270, 190, 100), dmg: 350, hitstun: 18, push: [20, 20] }, { from: 13, to: 15, box: bx(30, 260, 220, 120), dmg: 550, hitstun: 22 }], tags: ['close', 'pressure'] }),
  c2: mv({ name: 'Bate-Estaca', startup: 13, active: 4, recovery: 22, box: bx(30, 150, 215, 170), dmg: 900, hitstun: 30, push: [40, 90], anim: ['heavyWind', 'overhead'], motion: [{ from: 5, to: 14, vx: 8 }], tags: ['close'] }),
  SA1: mv({ name: 'Disco Duplo', btn: 'X', startup: 6, active: 14, recovery: 30, anim: ['overWind', 'cast'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [0, 1, 2].map((i) => ({ at: 6 + i * 5, ...vinyl({ vx: 19, w: 120, h: 120, y: 180 + i * 70, dmg: i === 2 ? 900 : 550, hitstun: 28, push: [20, 30], launch: i === 2 ? [12, 22] : null, kd: 'hard', chip: 0.3 }) })), range: 1500, tags: ['super'] }),
  // Arremessa vários discos de vinil cortantes.
  SA3: mv({ name: 'Vinil Fatal', btn: 'X', startup: 12, active: 44, recovery: 30, anim: ['overWind', 'cast'], cost: { super: 3000 }, inv: [{ from: 1, to: 16, type: 'all' }], motion: [{ from: 1, to: 11, vx: -17 }], // pula para trás e arremessa
    spawn: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ at: 14 + i * 6, ...vinyl({ vx: 19, y: 120 + ((i * 3) % 7) * 44, w: 120, h: 120, dmg: i === 6 ? 1300 : 520, hitstun: 30, push: [20, 30], launch: i === 6 ? [14, 26] : null, kd: 'hard', chip: 0.3 }) })), range: 1500, tags: ['super', 'big'] }),
};

export default {
  id: 'belga',
  name: 'BELGA',
  style: 'Boxeador de curta distância',
  mechName: 'BPM',
  mechDesc: 'Cada golpe que acerta sobe o ritmo: socos mais rápidos e mais fortes. Levar golpe derruba o ritmo.',
  colors: { skin: '#c68a5e', top: '#d99a2b', bottom: '#2a2a30', accent: '#ffa828', hair: '#17141a', hat: '#17141a', shoe: '#f0f0f0' },
  look: { hair: 'beanie', weapon: 'knuckle', sleeves: 'none' },
  walkF: 6.8, walkB: 5.2, jumpScale: 1, hpScale: 1.05,
  moves,
  // Qual tira do kit de sprites cada animação usa (production/sprites/final/belga)
  spriteAlias: { 'golpe-SA1': 'golpe-SA3', 'golpe-5S': 'golpe-SA3' },
  mech: {
    init(f) {
      f.res = { bpm: 0, t: 0 };
    },
    tick(st, f) {
      if (f.res.t > 0 && --f.res.t === 0 && f.res.bpm > 0) {
        f.res.bpm--;
        f.res.t = f.res.bpm ? BPM_DECAY : 0;
      }
    },
    onHit(st, f, d, h, src) {
      if (src.type !== 'move' && src.type !== 'throw') return;
      f.res.bpm = Math.min(BPM_MAX, f.res.bpm + 1);
      f.res.t = BPM_DECAY;
    },
    onGotHit(st, f) {
      f.res.bpm = Math.max(0, f.res.bpm - 2);
    },
    modifyMove(f, m) {
      const n = f.res.bpm;
      if (!n || m.type !== 'normal' || m.air) return m;
      const k = `${m.name}:${n}`;
      if (!cache.has(k)) cache.set(k, { ...m, recovery: m.recovery - n, total: m.total - n });
      return cache.get(k);
    },
    dmgMul(f) {
      return 1 + BPM_DMG * f.res.bpm;
    },
    hud(f) {
      return { label: 'BPM', pips: BPM_MAX, value: f.res.bpm, ready: f.res.bpm >= BPM_MAX, readyText: 'NO RITMO!', color: '#ffa828' };
    },
  },
  ai: { aggression: 0.75, block: 0.45, antiAir: 0.6, range: 'close' },
};
