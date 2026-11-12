import { mv, bx, baseNormals, proj } from '../movekit.js';

/**
 * DNEY — atirador.
 * Mecânica: MUNIÇÃO. Tem 6 balas. Cada tiro gasta uma; a última do tambor é o
 * Tiro Certeiro (50% mais dano e derruba). Sem bala, o tiro falha. Recarregue
 * com ↓+Especial (segure para recarregar tudo).
 */
const AMMO = 6;
const RELOAD_EVERY = 8;
const LAST_MUL = 1.5;
const SHOTS = ['5S', '6S', '4S', 'jS'];

const shot = (o = {}) => ({
  make: (st, f) => {
    if (o.spend) {
      if (f.res.ammo <= 0) return null;
      f.res.ammo--;
    }
    const last = f.res.ammo === 0 && !o.noLast;
    if (last) st.events.push({ t: 'pop', str: 'TIRO CERTEIRO!', x: f.x, color: '#ff5a4a', size: 44 });
    return proj({ kind: 'shot', x: 110, y: 330, w: 56, h: 30, vx: 46, life: 60, hitstun: 18, push: [130, 100], color: last ? '#ff5a4a' : '#ffe39d', ...o, dmg: Math.round((o.dmg ?? 480) * (last ? LAST_MUL : 1)), launch: last ? [10, 15] : o.launch || null, kd: last ? 'hard' : null });
  },
});

const moves = {
  ...baseNormals({ reach: 0.86, dmg: 0.86 }),
  '5S': mv({ name: 'Tiro', startup: 11, active: 1, recovery: 25, anim: ['castWind', 'shoot'], spawn: [{ at: 10, ...shot({ spend: true }) }], range: 1400, tags: ['zone', 'far'],
    turbo: { name: 'Tiro Duplo', spawn: [{ at: 9, ...shot({ spend: true }) }, { at: 15, ...shot({ spend: true }) }], recovery: 24 } }),
  '6S': mv({ name: 'Tiro Baixo', startup: 12, active: 1, recovery: 24, crouch: true, anim: ['crouch', 'shootLow'], spawn: [{ at: 12, ...shot({ spend: true, y: 60, guard: 'low', dmg: 500 }) }], range: 1400, tags: ['zone', 'far', 'low'],
    turbo: { startup: 9, spawn: [{ at: 9, ...shot({ spend: true, y: 60, guard: 'low', dmg: 650, hitstun: 26 }) }] } }),
  '4S': mv({ name: 'Tiro pro Alto', startup: 8, active: 1, recovery: 26, anim: ['castWind', 'shootUp'], spawn: [{ at: 8, ...shot({ spend: true, y: 400, vx: 30, vy: 30, dmg: 700, launch: [4, 22] }) }], range: 420, cancel: [], tags: ['antiair'],
    turbo: { startup: 6, spawn: [{ at: 6, ...shot({ spend: true, y: 400, vx: 30, vy: 30, dmg: 950, launch: [4, 26] }) }] } }),
  jS: mv({ name: 'Tiro Mergulho', air: true, startup: 8, active: 1, recovery: 14, anim: ['jumpUp', 'jPunch'], spawn: [{ at: 8, ...shot({ spend: true, y: 200, vx: 30, vy: -26, dmg: 500 }) }], cancel: [], tags: ['air'] }),
  '2S': mv({ name: 'Recarga', startup: 12, active: 1, recovery: 12, anim: ['reload', 'reload'], cancel: [], hold: { at: 13, btn: 'S', max: 60 }, tags: ['setup'] }),
  click: mv({ name: 'Sem Bala!', startup: 8, active: 1, recovery: 16, anim: ['castWind', 'shoot'], cancel: [], tags: [] }),
  SA1: mv({ name: 'Descarrega', btn: 'X', startup: 8, active: 24, recovery: 30, anim: ['castWind', 'shoot'], cost: { super: 1000 }, inv: [{ from: 1, to: 8, type: 'all' }],
    spawn: [0, 1, 2, 3, 4, 5].map((i) => ({ at: 9 + i * 4, ...shot({ spend: true, dmg: 520, hitstun: 26, y: 300 + (i % 3) * 30 }) })), range: 1400, tags: ['super'] }),
  SA3: mv({ name: 'DNEEEEEY!', btn: 'X', startup: 14, active: 1, recovery: 46, anim: ['superWind', 'shoot'], cost: { super: 3000 }, inv: [{ from: 1, to: 20, type: 'all' }],
    spawn: [{ at: 14, ...shot({ noLast: true, w: 220, h: 220, y: 200, vx: 40, hits: 5, dmg: 850, hitstun: 34, launch: [8, 16], life: 80 }) }], range: 1400, tags: ['super', 'big'] }),
};

export default {
  id: 'dney',
  name: 'DNEY',
  style: 'Atirador',
  mechName: 'MUNIÇÃO',
  mechDesc: '6 balas. A última é o Tiro Certeiro: mais dano e derruba. Recarregue com ↓+Especial (segure para recarregar tudo).',
  colors: { skin: '#d2a074', top: '#4a4658', bottom: '#26262c', accent: '#f7dd83', hair: '#1a1418', hat: '#d42a2a', shoe: '#e0e0e0' },
  look: { hair: 'cap', weapon: 'gun', sleeves: 'long', glasses: true },
  walkF: 6.7, walkB: 5.3, jumpScale: 1, hpScale: 0.94,
  moves,
  mech: {
    init(f) {
      f.res = { ammo: AMMO };
    },
    remap(f, key) {
      return SHOTS.includes(key) && f.res.ammo <= 0 ? 'click' : key;
    },
    onMoveStart(st, f, m, key) {
      if (key === 'click') st.events.push({ t: 'pop', str: 'SEM BALA!', x: f.x, color: '#b0b0b8' });
      if (key === 'SA3') f.res.ammo = AMMO;
    },
    onMoveFrame(st, f, o, m) {
      if (f.moveKey === '2S' && f.sf === 12 && f.holdT === 0) f.res.ammo = Math.min(AMMO, f.res.ammo + 1);
    },
    onHold(st, f) {
      if (f.holdT % RELOAD_EVERY === 0) f.res.ammo = Math.min(AMMO, f.res.ammo + 1);
    },
    hud(f) {
      return { label: 'MUNIÇÃO', pips: AMMO, value: f.res.ammo, ready: f.res.ammo === 1, readyText: 'TIRO CERTEIRO', color: '#f7dd83' };
    },
    aiPlan(st, f, o, dist, rnd) {
      if (f.res.ammo === 0 && dist > 300) return { key: '2S', extra: {} };
      if (f.res.ammo > 0 && dist > 420 && rnd() < 0.5) return { key: rnd() < 0.3 ? '6S' : '5S' };
      return null;
    },
  },
  ai: { aggression: 0.5, block: 0.5, antiAir: 0.6, range: 'far' },
};
