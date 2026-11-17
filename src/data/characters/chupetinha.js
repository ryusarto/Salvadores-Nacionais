import { mv, bx, baseNormals, proj } from '../movekit.js';
import { CHUPETINHA_SPRITES } from '../chupetinha-art.js';
import { SYS } from '../system.js';

/**
 * CHUPETINHA — chefe do Capítulo 2 (Belém, frente do palco).
 * Bate com uma chupeta gigante presa numa corrente, como um mangual, e cospe
 * chupetas. A mordida da chupeta (Sugada) rouba Ginga.
 *
 * Mecânica: ESTÃO ME CENSURANDO! Ao apanhar, ele liga uma live num celular
 * que flutua sobre a cabeça dele. Com a live no ar, 25% do dano que ele
 * recebe volta como vida (engajamento). O celular é um alvo: cada golpe que
 * o acerta derruba uma barra de sinal; sem sinal, a live cai por alguns
 * segundos. O flash da câmera do Franco derruba a live de uma vez.
 */
export const LIVE = {
  heal: 0.25, // fração do dano que volta como vida
  signal: 3, // golpes no celular para derrubar a live
  offFrames: 360, // tempo sem sinal
  suck: SYS.GINGA.pip, // Ginga roubada pela Sugada
};

// Mesmas contas de src/core/fighter.js (os dados não importam as regras).
function worldBox(f, box) {
  const l = f.face > 0 ? f.x + box.x : f.x - box.x - box.w;
  return { l, r: l + box.w, b: f.y + box.y, t: f.y + box.y + box.h };
}
const overlap = (a, b) => a.l < b.r && a.r > b.l && a.b < b.t && a.t > b.b;

/** Caixa do celular no mundo: acima da cabeça, um pouco para a frente. */
export function phoneBox(f) {
  return worldBox(f, { x: -50, y: 440, w: 120, h: 110 });
}

const flail = (o) => mv({ weapon: 'whip', ...o });
const spit = (o = {}) => proj({ kind: 'chupeta', x: 90, y: 330, w: 60, h: 50, vx: 15, life: 90, dmg: 550, color: '#ff8fc0', ...o, extra: { art: 'chupeta', ...o.extra } });

const moves = {
  ...baseNormals({ reach: 1.0, dmg: 0.95, anims: { H: 'kickHigh' } }),
  '5M': flail({ name: 'Chupetada', btn: 'M', startup: 9, active: 4, recovery: 18, box: bx(60, 250, 330, 90), dmg: 560, anim: ['whipWind', 'whipHi'], tags: ['poke', 'mid', 'far'] }),
  '5H': flail({ name: 'Mangual de Chupeta', btn: 'H', startup: 14, active: 5, recovery: 25, box: bx(60, 220, 450, 120), dmg: 880, anim: ['whipWind', 'whipHi'], tags: ['poke', 'far', 'heavy'] }),
  '2M': flail({ name: 'Chupetada Baixa', btn: 'M', startup: 10, active: 4, recovery: 19, crouch: true, guard: 'low', box: bx(60, 10, 360, 80), dmg: 500, anim: ['crouch', 'whipLow'], tags: ['poke', 'mid', 'low'] }),
  '5S': mv({ name: 'Cuspe de Chupeta', startup: 13, active: 1, recovery: 24, anim: ['castWind', 'cast'], spawn: [{ at: 13, ...spit() }], range: 1400, tags: ['zone', 'far'],
    turbo: { startup: 10, spawn: [{ at: 10, ...spit({ dmg: 450, vx: 17 }) }, { at: 16, ...spit({ dmg: 450, vx: 17, y: 230 }) }] } }),
  // Sugada: avança e morde com a chupeta. No acerto, rouba um gomo de Ginga.
  '6S': flail({ name: 'Sugada', startup: 12, active: 5, recovery: 24, box: bx(40, 220, 230, 140), dmg: 700, hitstun: 26, anim: ['whipWind', 'whipHi'], motion: [{ from: 4, to: 14, vx: 11 }], tags: ['close', 'suck'],
    turbo: { startup: 9, dmg: 900 } }),
  '2S': flail({ name: 'Chupeta Rasteira', startup: 15, active: 5, recovery: 28, crouch: true, guard: 'low', box: bx(70, 0, 520, 70), dmg: 780, launch: [6, 12], kd: 'hard', anim: ['crouch', 'whipLow'], cancel: [], tags: ['far', 'low', 'knockdown'],
    turbo: { startup: 11, dmg: 980 } }),
  // Birra: pula batendo pé e chupeta para cima. Vence pulos.
  '4S': mv({ name: 'Birra', startup: 5, active: 10, recovery: 28, box: bx(0, 180, 200, 360), dmg: 950, launch: [5, 28], anim: ['riseWind', 'kickHigh'], fx: 'rise',
    inv: [{ from: 1, to: 9, type: 'strike' }], motion: [{ from: 5, to: 10, vx: 3, vy: 24 }], flags: { landEnds: true, landRecovery: 15 }, cancel: [], tags: ['antiair', 'reversal'] }),
  SA1: mv({ name: 'Chuva de Chupetas', btn: 'X', startup: 10, active: 1, recovery: 36, anim: ['castWind', 'cast'], cost: { super: 1000 }, inv: [{ from: 1, to: 10, type: 'all' }],
    spawn: [0, 1, 2, 3, 4].map((i) => ({ at: 10 + i * 4, ...spit({ dmg: 380, vx: 15 + i, vy: 14 + i * 3, g: 0.9, y: 380, hits: 1, launch: i === 4 ? [8, 20] : null }) })),
    range: 1300, tags: ['super'] }),
  // Live Patrocinada: a live volta com sinal cheio e a corrente varre a tela.
  SA3: flail({ name: 'Live Patrocinada', btn: 'X', startup: 12, active: 30, recovery: 44, anim: ['whipWind', 'whipHi'], fx: 'crack', cost: { super: 3000 },
    hits: [0, 1, 2, 3, 4, 5].map((i) => ({ from: 13 + i * 5, to: 15 + i * 5, box: bx(40, 80 + (i % 2) * 140, 640, 220), dmg: i === 5 ? 1300 : 420, hitstun: 30, push: [10, 30], launch: i === 5 ? [13, 26] : null, kd: 'hard' })),
    inv: [{ from: 1, to: 13, type: 'all' }], tags: ['super', 'big'] }),
};

function goLive(st, f) {
  if (f.res.live || f.res.offT > 0) return;
  f.res.live = true;
  f.res.signal = LIVE.signal;
  st.events.push({ t: 'pop', str: 'ESTÃO ME CENSURANDO!', x: f.x, y: 600, color: '#ff4fa0', size: 46 });
  st.events.push({ t: 'live', side: f.side, on: true, x: f.x });
}

function dropLive(st, f, why) {
  f.res.live = false;
  f.res.signal = 0;
  f.res.offT = LIVE.offFrames;
  st.events.push({ t: 'pop', str: why === 'flash' ? 'FLASH! SEM SINAL!' : 'SEM SINAL!', x: f.x, y: 620, color: '#9ff5e8', size: 48 });
  st.events.push({ t: 'live', side: f.side, on: false, x: f.x });
}

/**
 * O golpe ou projétil do rival acertou o celular neste quadro?
 * Cada golpe e cada projétil conta uma vez só. Retorna 'flash' para o flash do Franco.
 */
function phoneStruck(st, f, o) {
  const box = phoneBox(f);
  const seen = f.res.phoneSeen;
  if (o.state === 'attack') {
    const m = o.move;
    // cada golpe ganha uma lista nova de acertos ao começar: ela identifica o golpe
    const id = o.hitDone;
    for (const h of m.hits) {
      if (seen.has(id)) break;
      if (o.sf < h.from || o.sf > h.to) continue;
      // o flash da câmera estoura a tela do celular de qualquer altura, se estiver no alcance
      if (m.fx === 'flash') {
        const wb = worldBox(o, h.box);
        if (overlap({ ...wb, b: 0, t: 9999 }, box)) return seen.add(id), 'flash';
      }
      if (overlap(worldBox(o, h.box), box)) return seen.add(id), 'hit';
    }
  }
  for (const e of st.ents) {
    if (e.owner === f.side || !e.hit || e.delay > 0 || seen.has(`e${e.id}`)) continue;
    if (overlap({ l: e.x - e.w / 2, r: e.x + e.w / 2, b: e.y, t: e.y + e.h }, box)) return seen.add(`e${e.id}`), 'hit';
  }
  return null;
}

export default {
  id: 'chupetinha',
  ...CHUPETINHA_SPRITES,
  name: 'CHUPETINHA',
  style: 'Chefe — média distância',
  mechName: 'ESTÃO ME CENSURANDO!',
  mechDesc: 'Ao apanhar, liga a live: 25% do dano volta como vida. Acerte o celular sobre a cabeça dele para derrubar o sinal.',
  colors: { skin: '#e8b894', top: '#2f5d9e', top2: '#f4f0ea', bottom: '#24304a', accent: '#ff8fc0', hair: '#3a2a1a', shoe: '#141016' },
  look: { hair: 'curly', weapon: 'chupeta', sleeves: 'long' },
  walkF: 5.6, walkB: 4.6, jumpScale: 0.95, hpScale: 1.15,
  boss: true,
  place: 'BELÉM — FRENTE DO PALCO',
  moves,
  mech: {
    init(f) {
      f.res = { live: false, signal: 0, offT: 0, lastHp: f.hp, healShown: 0, phoneSeen: new Set() };
    },
    tick(st, f, o) {
      const r = f.res;
      if (r.phoneSeen.size > 40) r.phoneSeen = new Set();
      if (r.healShown > 0) r.healShown--;
      if (r.offT > 0 && --r.offT === 0) st.events.push({ t: 'pop', str: 'SINAL VOLTOU', x: f.x, y: 600, color: '#d8d0dc', size: 34 });
      // dano recebido neste quadro
      const lost = r.lastHp - f.hp;
      if (lost > 0 && f.hp > 0) {
        if (r.live) {
          const heal = Math.max(1, Math.round(lost * LIVE.heal));
          f.hp = Math.min(f.maxHp, f.hp + heal);
          if (!r.healShown) {
            st.events.push({ t: 'pop', str: '+ENGAJAMENTO', x: f.x, y: 560, color: '#ff4fa0', size: 36 });
            r.healShown = 45;
          }
        } else goLive(st, f);
      }
      r.lastHp = f.hp;
      // golpes no celular
      if (r.live && f.hp > 0) {
        const hit = phoneStruck(st, f, o);
        if (hit === 'flash') dropLive(st, f, 'flash');
        else if (hit) {
          r.signal--;
          st.events.push({ t: 'pop', str: `SINAL ${r.signal}/${LIVE.signal}`, x: f.x, y: 640, color: '#9ff5e8', size: 34 });
          if (r.signal <= 0) dropLive(st, f, 'hit');
        }
      }
    },
    onHit(st, f, d, h, src) {
      if (src.type !== 'move' || !src.m.tags.includes('suck') || d.hp <= 0) return;
      const stolen = Math.min(LIVE.suck, Math.max(0, d.ginga));
      d.ginga -= LIVE.suck;
      d.gingaPause = SYS.GINGA.regenPause;
      if (d.ginga <= 0) {
        d.ginga = 0;
        if (!d.burnout) {
          d.burnout = true;
          st.events.push({ t: 'burnout', side: d.side });
        }
      }
      if (!f.burnout) f.ginga = Math.min(SYS.GINGA.max, f.ginga + stolen);
      st.events.push({ t: 'pop', str: 'SUGOU A GINGA!', x: d.x, y: 480, color: '#ff8fc0', size: 40 });
    },
    onMoveStart(st, f, m) {
      if (m.name === 'Live Patrocinada') {
        f.res.offT = 0;
        f.res.live = false;
        goLive(st, f);
      }
    },
    hud(f) {
      const r = f.res;
      if (r.live) return { label: 'AO VIVO', pips: LIVE.signal, value: r.signal, ready: true, readyText: 'AO VIVO', color: '#ff4fa0' };
      if (r.offT > 0) return { label: 'AO VIVO', pips: 0, value: 0, text: `SEM SINAL ${Math.ceil(r.offT / 60)}s`, ready: false, color: '#9ff5e8' };
      return { label: 'AO VIVO', pips: 0, value: 0, text: 'DESLIGADO', ready: false, color: '#ff4fa0' };
    },
    aiPlan(st, f, o, dist, rnd) {
      if (dist < 240 && rnd() < 0.22) return { key: '6S' };
      if (dist > 460 && rnd() < 0.18) return { key: '5S' };
      return null;
    },
  },
  ai: { aggression: 0.55, block: 0.5, antiAir: 0.6, range: 'mid' },
};
