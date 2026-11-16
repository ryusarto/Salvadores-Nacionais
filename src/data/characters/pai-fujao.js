import { mv, bx, baseNormals, proj } from '../movekit.js';
import { SYS } from '../system.js';

/**
 * PAI DO FUJÃO — chefe do Capítulo 5 (sala da mansão).
 * Em prisão domiciliar, comanda tudo de dentro de casa, pelo telefone.
 *
 * - TORNOZELEIRA: marca no chão a área onde ele pode ficar. Andando, ele não
 *   sai dela. Empurrado para fora (apanhando), a tornozeleira apita e dá
 *   choque: dano e tontura.
 * - FORO PRIVILEGIADO: os 3 primeiros golpes de cada combo não fazem dano.
 *   Combos longos, agarrões e supers furam a imunidade. Depois de segurar 6
 *   golpes, o foro é cassado por 8 s e tudo faz dano.
 * - COMANDO À DISTÂNCIA: uma ligação e um capanga entra correndo.
 * - VINGANÇA PATERNA: abaixo de metade da vida, vê o retrato do filho na
 *   parede e fica furioso: bate mais forte e anda mais rápido.
 */
export const PAI = {
  zoneX: SYS.STAGE_W / 2 + 260, // centro da área da tornozeleira
  zoneR: 420,
  shockDmg: 900,
  shockStun: 80,
  shockCD: 240,
  immuneHits: 3,
  foroCharges: 6, // golpes imunes antes de o foro cair
  foroDown: 480, // tempo com o foro cassado
  callCD: 360,
  furyHp: 0.5,
  furyDmg: 1.2,
};

const PUSHED = new Set(['hitstun', 'air_hit', 'blockstun', 'crumple', 'knockdown']);
const outOfZone = (f) => Math.abs(f.x - PAI.zoneX) > PAI.zoneR;

const henchman = (o = {}) => ({
  make: (st, f) => {
    if (f.res.callT > 0 && !o.force) {
      st.events.push({ t: 'pop', str: 'LINHA OCUPADA', x: f.x, y: 560, color: '#d8d0dc', size: 36 });
      return null;
    }
    if (!o.force) f.res.callT = PAI.callCD;
    st.events.push({ t: 'pop', str: 'ALÔ? MANDA ALGUÉM!', x: f.x, y: 600, color: '#ffcf2a', size: 36 });
    return proj({ kind: 'capanga', x: -60, y: 0, w: 120, h: 300, vx: 16, life: 110, dmg: 750, hitstun: 26, guard: 'mid', color: '#2a2a32', ...o });
  },
});
const cash = (o = {}) => proj({ kind: 'dinheiro', x: 80, y: 280, w: 70, h: 44, vx: 16, life: 90, dmg: 300, hitstun: 24, color: '#5aa05a', ...o });

const moves = {
  ...baseNormals({ reach: 1.05, dmg: 1.15, speed: 1, anims: { L: 'punchM', H: 'punchH' } }),
  '5H': mv({ name: 'Bengalada', btn: 'H', startup: 13, active: 5, recovery: 24, box: bx(30, 230, 290, 140), dmg: 1050, anim: ['heavyWind', 'punchH'], weapon: 'bengala', tags: ['poke', 'mid', 'heavy'] }),
  '5S': mv({ name: 'Comando à Distância', startup: 16, active: 1, recovery: 22, anim: ['call', 'call'], spawn: [{ at: 16, ...henchman() }], range: 1300, tags: ['zone', 'far'] }),
  '6S': mv({ name: 'Peso da Família', startup: 14, active: 6, recovery: 26, box: bx(20, 80, 240, 340), dmg: 1100, crumple: true, anim: ['blindWind', 'blindHit'], motion: [{ from: 6, to: 16, vx: 12 }],
    armor: { from: 1, to: 14, hits: 1 }, tags: ['close', 'armor'], turbo: { armor: { from: 1, to: 14, hits: 2 }, dmg: 1300 } }),
  '4S': mv({ name: 'Recurso Negado', startup: 6, active: 9, recovery: 28, box: bx(0, 200, 200, 340), dmg: 1000, launch: [5, 28], anim: ['riseWind', 'upper'], fx: 'rise',
    inv: [{ from: 1, to: 9, type: 'strike' }], motion: [{ from: 6, to: 11, vx: 3, vy: 22 }], flags: { landEnds: true, landRecovery: 16 }, cancel: [], tags: ['antiair', 'reversal'] }),
  // Rachadinha: maços de dinheiro voando; parte do dano volta como vida.
  SA1: mv({ name: 'Rachadinha', btn: 'X', startup: 10, active: 1, recovery: 34, anim: ['castWind', 'cast'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [0, 1, 2, 3, 4].map((i) => ({ at: 10 + i * 4, ...cash({ y: 180 + (i % 3) * 90, vx: 15 + i, launch: i === 4 ? [8, 20] : null }) })), range: 1300, tags: ['super'] }),
  // Prisão Domiciliar Pra Você: prende o herói com uma tornozeleira e dá choque.
  SA3: mv({ name: 'Prisão Domiciliar Pra Você', btn: 'X', startup: 12, active: 40, recovery: 44, anim: ['throwReach', 'throwHold'], cost: { super: 3000 }, inv: [{ from: 1, to: 14, type: 'all' }],
    hits: [{ from: 13, to: 16, box: bx(30, 0, 360, 480), dmg: 600, hitstun: 70, effects: [{ t: 'trap', frames: 70 }] },
      { from: 30, to: 32, box: bx(0, 0, 420, 480), dmg: 500, hitstun: 40 },
      { from: 48, to: 51, box: bx(0, 0, 440, 480), dmg: 1700, launch: [12, 26], kd: 'hard' }],
    range: 380, tags: ['super', 'big'] }),
};

export default {
  id: 'pai-fujao',
  name: 'PAI DO FUJÃO',
  style: 'Chefe — pesado, comanda de casa',
  mechName: 'FORO PRIVILEGIADO',
  mechDesc: 'Os 3 primeiros golpes de cada combo não fazem dano, até o foro ser cassado. Empurre-o para fora da área da tornozeleira: ela dá choque.',
  colors: { skin: '#e2b08a', top: '#3a2f2a', top2: '#f4f0ea', bottom: '#2a2420', accent: '#d8b25a', hair: '#d8d0c8', shoe: '#1c1418' },
  look: { hair: 'curly', weapon: 'bengala', sleeves: 'long' },
  walkF: 4.6, walkB: 4.0, jumpScale: 0.85, hpScale: 1.3,
  boss: true,
  place: 'MANSÃO',
  stage: 'mansao', // cenário próprio (src/render/mansion-stage.js)
  moves,
  mech: {
    init(f) {
      f.res = { shockT: 0, callT: 0, fury: false, foro: PAI.foroCharges, foroT: 0 };
    },
    tick(st, f) {
      const r = f.res;
      if (r.shockT > 0) r.shockT--;
      if (r.callT > 0) r.callT--;
      if (r.foroT > 0 && --r.foroT === 0) {
        r.foro = PAI.foroCharges;
        st.events.push({ t: 'pop', str: 'FORO DE VOLTA', x: f.x, y: 600, color: '#d8b25a', size: 34 });
      }
      if (f.hp <= 0) return;
      // Tornozeleira: andando, não sai da área; empurrado para fora, leva choque
      if (outOfZone(f)) {
        const edge = PAI.zoneX + Math.sign(f.x - PAI.zoneX) * PAI.zoneR;
        if (PUSHED.has(f.state) || f.y > 0) {
          if (!r.shockT && f.y <= 0) {
            r.shockT = PAI.shockCD;
            f.hp = Math.max(1, f.hp - PAI.shockDmg);
            st.events.push({ t: 'pop', str: 'BIP! BIP! TORNOZELEIRA!', x: f.x, y: 600, color: '#9ff5e8', size: 44 });
            st.events.push({ t: 'shock', side: f.side, x: f.x });
            if (f.state !== 'knockdown') {
              f.state = 'dizzy';
              f.sf = 0;
              f.move = null;
              f.moveKey = null;
              f.stun = PAI.shockStun;
            }
          }
        } else f.x = edge;
      }
      // Vingança Paterna
      if (!r.fury && f.hp / f.maxHp <= PAI.furyHp) {
        r.fury = true;
        st.events.push({ t: 'pop', str: 'MEU FILHO! VOCÊS VÃO PAGAR!', x: f.x, y: 620, color: '#ff5a4a', size: 44 });
        st.events.push({ t: 'fury', side: f.side, x: f.x });
      }
    },
    dmgTakenMul(st, f, att, h, src) {
      if (src.m?.type === 'super') return 1;
      if (f.comboHits >= PAI.immuneHits || f.res.foro <= 0) return 1;
      if (f.comboHits === 0) st.events.push({ t: 'pop', str: 'FORO PRIVILEGIADO!', x: f.x, y: 560, color: '#d8b25a', size: 40 });
      if (--f.res.foro <= 0) {
        f.res.foroT = PAI.foroDown;
        st.events.push({ t: 'pop', str: 'FORO CASSADO!', x: f.x, y: 640, color: '#ff5a4a', size: 48 });
      }
      return 0;
    },
    dmgMul(f) {
      return f.res.fury ? PAI.furyDmg : 1;
    },
    onHit(st, f, d, h, src) {
      // Rachadinha: 30% do dano dos maços volta como vida
      if (src.type === 'proj' && src.ent.kind === 'dinheiro') f.hp = Math.min(f.maxHp, f.hp + Math.round(h.dmg * 0.3));
    },
    hud(f) {
      const r = f.res;
      if (r.foro <= 0) return { label: 'FORO', pips: 0, value: 0, ready: false, text: `CASSADO ${Math.ceil(r.foroT / 60)}s`, color: '#ff5a4a' };
      if (r.fury) return { label: 'FORO', pips: PAI.foroCharges, value: r.foro, ready: true, readyText: 'FURIOSO', color: '#ff5a4a' };
      return { label: 'FORO', pips: PAI.foroCharges, value: r.foro, ready: r.callT <= 0, readyText: 'LINHA LIVRE', text: `TELEFONE ${Math.ceil(r.callT / 60)}s`, color: '#d8b25a' };
    },
    aiPlan(st, f, o, dist, rnd) {
      if (f.res.callT <= 0 && dist > 380 && rnd() < 0.25) return { key: '5S' };
      if (dist < 260 && rnd() < 0.07) return { key: '6S' };
      return null;
    },
  },
  ai: { aggression: 0.6, block: 0.6, antiAir: 0.7, range: 'close' },
};
