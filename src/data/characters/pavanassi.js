import { mv, bx, baseNormals, proj } from '../movekit.js';
import { SYS } from '../system.js';

/**
 * PAVANASSI — chefe do Capítulo 3 (Belém, banheiros químicos).
 * Vereador com jeito de ditador, que quer separar héteros e trans. Governa
 * por decreto e carimbo: o poder dele é classificar e separar.
 *
 * - Carimbo de Decreto: o carimbo voa; no acerto, um tipo de golpe do herói
 *   fica PROIBIDO por 4 s (especiais, depois pulo, depois super).
 * - Cerca de Separação: grade no chão que o herói só passa pulando ou
 *   derrubando (3 golpes).
 * - FISCALIZAÇÃO DE MIJO SUPREMA: cabine de banheiro gigante no meio da arena.
 *   Quem encostar fica na "fila da documentação" (apertar botões solta mais rápido).
 * - Ponto fraco, A PERGUNTA: perto da cabine, Ginga + Agarrão pergunta por que
 *   um vereador gasta poderes fiscalizando privada. Ele sofre dano emocional,
 *   fica tonto e a cabine desaba.
 */
export const PAV = {
  banFrames: 240,
  fenceHp: 3,
  cabinHp: 5,
  cabinTrap: 110, // quadros presos na fila
  mash: 7, // cada botão apertado na fila adianta a saída
  askRange: 300, // distância da cabine para a pergunta
  emotional: 1300, // dano emocional
};

const stamp = (o = {}) => proj({ kind: 'carimbo', x: 100, y: 300, w: 70, h: 60, vx: 13, life: 100, dmg: 620, color: '#c8102e',
  effects: [{ t: 'ban', frames: PAV.banFrames }], ...o });

const fence = (x) => ({
  make: (st, f) => {
    const mine = st.ents.filter((e) => e.owner === f.side && e.kind === 'cerca');
    if (mine.length >= 2) mine[0].dead = true;
    return { kind: 'cerca', behavior: 'barrier', x, y: 0, w: 46, h: 200, hitH: 400, vx: 0, life: 600, hp: PAV.fenceHp, hit: null, delay: 0, breakText: 'CERCA NO CHÃO!' };
  },
});

const cabin = {
  make: (st, f) => {
    const old = st.ents.find((e) => e.owner === f.side && e.kind === 'cabine');
    if (old) old.dead = true;
    const o = st.f[1 - f.side];
    // a cabine cai no meio do caminho entre os dois
    const gap = Math.abs(o.x - f.x);
    return { kind: 'cabine', behavior: 'barrier', x: Math.max(160, Math.min(gap - 60, 360)), y: 0, w: 190, h: 420, vx: 0, life: 600, hp: PAV.cabinHp, hit: null, delay: 0,
      trap: PAV.cabinTrap, trapText: 'FILA DA DOCUMENTAÇÃO!', breakText: 'CABINE NO CHÃO!' };
  },
};

const moves = {
  ...baseNormals({ reach: 1.03, dmg: 1.1, anims: { H: 'overhead' } }),
  '5H': mv({ name: 'Carimbada', btn: 'H', startup: 13, active: 5, recovery: 24, guard: 'mid', box: bx(30, 230, 270, 150), dmg: 950, anim: ['overWind', 'overhead'], weapon: 'carimbo', tags: ['poke', 'mid', 'heavy'] }),
  '5S': mv({ name: 'Carimbo de Decreto', startup: 14, active: 1, recovery: 26, anim: ['castWind', 'cast'], spawn: [{ at: 14, ...stamp() }], range: 1400, tags: ['zone', 'far'],
    turbo: { startup: 10, spawn: [{ at: 10, ...stamp({ vx: 17, dmg: 600 }) }] } }),
  '6S': mv({ name: 'Cerca de Separação', startup: 16, active: 1, recovery: 22, anim: ['castWind', 'cast'], spawn: [{ at: 16, ...fence(170) }], range: 400, tags: ['zone'],
    turbo: { startup: 12, spawn: [{ at: 12, ...fence(150) }, { at: 14, ...fence(330) }] } }),
  '2S': mv({ name: 'Fiscalização de Mijo Suprema', startup: 20, active: 1, recovery: 30, anim: ['overWind', 'overhead'], spawn: [{ at: 20, ...cabin }], range: 600, tags: ['zone', 'far'] }),
  // Veto: sobe com o carimbo erguido. Vence pulos.
  '4S': mv({ name: 'Veto', startup: 6, active: 9, recovery: 28, box: bx(0, 200, 190, 340), dmg: 950, launch: [5, 28], anim: ['riseWind', 'upper'], fx: 'rise',
    inv: [{ from: 1, to: 9, type: 'strike' }], motion: [{ from: 6, to: 11, vx: 3, vy: 24 }], flags: { landEnds: true, landRecovery: 16 }, cancel: [], tags: ['antiair', 'reversal'] }),
  SA1: mv({ name: 'Carimbaço', btn: 'X', startup: 9, active: 22, recovery: 34, anim: ['overWind', 'overhead'], cost: { super: 1000 }, inv: [{ from: 1, to: 9, type: 'all' }],
    hits: [0, 1, 2, 3].map((i) => ({ from: 10 + i * 5, to: 12 + i * 5, box: bx(30, 120, 340, 300), dmg: i === 3 ? 900 : 360, hitstun: 26, push: [10, 24], launch: i === 3 ? [10, 22] : null, kd: 'hard',
      effects: i === 3 ? [{ t: 'ban', frames: PAV.banFrames }] : [] })),
    tags: ['super'] }),
  // Lei Seca de Gente: a cela-carimbo prende o herói e a última carimbada derruba.
  SA3: mv({ name: 'Lei Seca de Gente', btn: 'X', startup: 12, active: 40, recovery: 44, anim: ['castWind', 'overhead'], cost: { super: 3000 }, inv: [{ from: 1, to: 14, type: 'all' }],
    hits: [{ from: 13, to: 16, box: bx(40, 0, 640, 480), dmg: 700, hitstun: 70, effects: [{ t: 'trap', frames: 70 }] },
      { from: 36, to: 38, box: bx(40, 0, 680, 480), dmg: 600, hitstun: 40 },
      { from: 48, to: 51, box: bx(40, 0, 700, 480), dmg: 1500, launch: [12, 26], kd: 'hard' }],
    range: 700, tags: ['super', 'big'] }),
};

const myCabin = (st, f) => st.ents.find((e) => e.owner === f.side && e.kind === 'cabine' && !e.dead);

export default {
  id: 'pavanassi',
  name: 'PAVANASSI',
  style: 'Chefe — controle e armadilhas',
  mechName: 'DECRETO',
  mechDesc: 'O carimbo proíbe golpes; cercas e a cabine fecham o caminho. Perto da cabine, Ginga + Agarrão faz A PERGUNTA.',
  colors: { skin: '#e4b48e', top: '#4c5232', top2: '#f4f0ea', bottom: '#2c2f1e', accent: '#c8102e', hair: '#8a8a8a', shoe: '#141016' },
  look: { hair: 'spikes', weapon: 'carimbo', sleeves: 'long' },
  walkF: 5.4, walkB: 4.6, jumpScale: 0.92, hpScale: 1.22,
  boss: true,
  place: 'BELÉM — BANHEIROS QUÍMICOS',
  moves,
  mech: {
    init(f) {
      f.res = { askT: false, prevBtn: {} };
    },
    tick(st, f, o) {
      const r = f.res;
      // Fila da documentação: cada botão apertado adianta a saída
      if (o.status.queue) {
        if (o.state !== 'frozen') o.status.queue = null;
        else {
          for (const b of ['L', 'M', 'H', 'S', 'G', 'T', 'X']) if (o.buf.cur[b] && !r.prevBtn[b]) o.stun = Math.max(1, o.stun - PAV.mash);
        }
      }
      // A PERGUNTA: Ginga + Agarrão perto da cabine
      const cab = myCabin(st, f);
      const asking = !!(o.buf.cur.G && o.buf.cur.T);
      // vale em pé, andando, defendendo ou começando o agarrão (Agarrão é o mesmo botão)
      const free = o.y <= 0 && (['idle', 'walk', 'crouch', 'guard', 'run', 'runstop', 'blockstun'].includes(o.state) || (o.state === 'attack' && o.move.type === 'throw'));
      if (cab && asking && !r.askT && free && f.hp > 0 && Math.abs(o.x - cab.x) <= PAV.askRange) {
        cab.dead = true;
        f.hp = Math.max(1, f.hp - PAV.emotional);
        st.events.push({ t: 'pop', str: 'POR QUE UM VEREADOR FISCALIZA PRIVADA?', x: o.x, y: 640, color: '#fff', size: 34 });
        st.events.push({ t: 'pop', str: 'DANO EMOCIONAL!', x: f.x, y: 540, color: '#ff4fa0', size: 52 });
        st.events.push({ t: 'emotional', side: f.side, x: f.x });
        st.events.push({ t: 'barrierDown', kind: 'cabine', x: cab.x });
        if (f.y <= 0 && f.state !== 'ko') {
          f.state = 'dizzy';
          f.sf = 0;
          f.move = null;
          f.moveKey = null;
          f.stun = SYS.DIZZY;
        }
      }
      r.askT = asking;
      r.prevBtn = { ...o.buf.cur };
    },
    hud(f, o, st) {
      const cab = st && myCabin(st, f);
      if (cab) return { label: 'DECRETO', pips: 0, value: 0, text: 'CABINE: GINGA + AGARRÃO PERTO DELA', ready: true, readyText: 'PERGUNTE!', color: '#ffcf2a' };
      return { label: 'DECRETO', pips: 0, value: 0, text: 'EM VIGOR', ready: false, color: '#c8102e' };
    },
    aiPlan(st, f, o, dist, rnd) {
      // herói preso na fila: hora de castigar
      if (o.state === 'frozen') return dist < 320 ? { key: '5H' } : { key: '5S' };
      if (dist > 420 && !o.status.ban && rnd() < 0.2) return { key: '5S' };
      if (dist > 300 && dist < 700 && !myCabin(st, f) && rnd() < 0.03) return { key: '2S' };
      if (dist < 300 && rnd() < 0.03) return { key: '6S' };
      return null;
    },
  },
  ai: { aggression: 0.6, block: 0.6, antiAir: 0.7, range: 'mid' },
};
