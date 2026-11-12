import { SYS } from '../data/system.js';
import { EMPTY_INPUT } from './input.js';
import { isNeutral } from './fighter.js';

/**
 * Adversário controlado pelo jogo. Produz a mesma entrada que um jogador,
 * então qualquer personagem pode ser controlado por ele. As decisões usam as
 * etiquetas (tags) e o alcance de cada golpe da ficha.
 *
 * level: 0 fácil, 1 normal, 2 difícil.
 */
export function createBrain(level = 1) {
  return { level, queue: [], wait: 0, blockT: 0, blockLow: true };
}

const LEVELS = [
  { react: 16, block: 0.3, punish: 0.25, combo: 0.35, idle: 0.35 },
  { react: 10, block: 0.55, punish: 0.55, combo: 0.7, idle: 0.18 },
  { react: 6, block: 0.8, punish: 0.85, combo: 0.95, idle: 0.06 },
];

function keyInput(key, toward, extra = {}) {
  const i = { ...EMPTY_INPUT, ...extra };
  if (key === 'throw') return { ...i, T: 1 };
  if (key === 'SA1') return { ...i, X: 1 };
  if (key === 'SA3') return { ...i, y: -1, X: 1 };
  if (key === 'blindado') return { ...i, G: 1, H: 1 };
  const d = key[0];
  const btn = key[key.length - 1];
  if (d === '2' || d === '3') i.y = -1;
  if (d === '6' || d === '3') i.x = toward;
  if (d === '4') i.x = -toward;
  i[btn] = 1;
  return i;
}

function pressKey(brain, key, toward, extra) {
  const hold = keyInput(key, toward, extra);
  const pre = { ...hold, L: 0, M: 0, H: 0, S: 0, T: 0, X: 0 };
  if (key === 'blindado') brain.queue.push({ ...pre, G: 1 }, hold, hold);
  else brain.queue.push(pre, hold, hold);
}

/** Decide a entrada do quadro para o lutador `side`. */
export function aiInput(st, side, brain) {
  const me = st.f[side];
  const op = st.f[1 - side];
  const rnd = st.rng;
  const L = LEVELS[brain.level] || LEVELS[1];
  const P = me.ch.ai || {};
  const toward = Math.sign(op.x - me.x) || me.face;
  const dist = Math.abs(op.x - me.x);
  const moves = me.ch.moves;
  const fury = me.res?.fury ? 0.25 : 0;
  const aggr = Math.min(0.95, (P.aggression ?? 0.5) + fury + (brain.level - 1) * 0.1);

  if (st.phase !== 'fight') return EMPTY_INPUT;
  if (brain.queue.length) return brain.queue.shift();

  // Escapar de agarrão
  if (me.state === 'thrown' && me.sf <= 2 && rnd() < L.block * 0.6) return { ...EMPTY_INPUT, T: 1 };

  // Continuar defendendo
  const threat = op.state === 'attack' && op.move.hits.length && op.sf <= op.move.hits[op.move.hits.length - 1].to && dist < op.move.range + 170;
  const projNear = st.ents.some((e) => e.owner !== side && e.hit && !e.delay && Math.abs(e.x - me.x) < 330 && Math.sign(e.vx || toward * -1) === -toward);
  const markNear = st.ents.some((e) => e.owner !== side && e.behavior === 'strike' && e.delay < 26 && Math.abs(e.x - me.x) < 170);
  if (me.state === 'blockstun' || brain.blockT > 0) {
    brain.blockT = Math.max(0, brain.blockT - 1);
    const g = op.state === 'attack' ? op.move.hits[0]?.guard : 'mid';
    const low = op.y > 0 || g === 'high' ? false : g === 'low' ? true : brain.blockLow;
    if (threat || projNear || me.state === 'blockstun') return { ...EMPTY_INPUT, x: -toward, y: low ? -1 : 0 };
  }

  // Combo: se o golpe conectou, emenda o próximo
  if (me.state === 'attack' && me.connected && me.move.type !== 'super') {
    if (brain.comboRoll == null) brain.comboRoll = rnd();
    if (brain.comboRoll < L.combo && me.sf > me.move.startup + 1) {
      const hit = me.connected === 'hit';
      const b = me.move.btn;
      brain.comboRoll = null;
      if (me.move.type === 'normal') {
        if (b === 'L' && moves['5M']) return pressKey(brain, dist < moves['5M'].range ? '5M' : '2M', toward), brain.queue.shift();
        if (b === 'M' && moves['5H'] && dist < moves['5H'].range + 20) return pressKey(brain, '5H', toward), brain.queue.shift();
        const sp = ['6S', '2S', '5S'].filter((k) => moves[k] && moves[k].range + 60 > dist);
        if (sp.length && (hit || rnd() < 0.4)) return pressKey(brain, sp[Math.floor(rnd() * sp.length)], toward), brain.queue.shift();
      } else if (hit && me.move.type === 'special' && me.super >= SYS.SUPER.stock && rnd() < 0.6) {
        return pressKey(brain, me.super >= 3 * SYS.SUPER.stock && moves.SA3 ? 'SA3' : 'SA1', toward), brain.queue.shift();
      }
    }
    return EMPTY_INPUT;
  }
  if (me.state !== 'attack') brain.comboRoll = null;

  if (!isNeutral(me)) return EMPTY_INPUT;
  if (brain.wait > 0) {
    brain.wait--;
    return brain.hold || EMPTY_INPUT;
  }
  brain.wait = L.react + Math.floor(rnd() * 5);
  brain.hold = EMPTY_INPUT;

  // Reagir a ataques
  if ((threat || projNear || markNear) && op.move?.type !== 'throw') {
    const r = rnd();
    if (markNear) {
      brain.hold = { ...EMPTY_INPUT, x: toward };
      brain.wait = 10;
      return brain.hold;
    }
    if (op.y > 0 && r < (P.antiAir ?? 0.5) * (0.5 + brain.level * 0.25)) {
      const aa = moves['4S'] && rnd() < 0.5 ? '4S' : '2H';
      return pressKey(brain, aa, toward), brain.queue.shift();
    }
    if (r < L.block) {
      brain.blockT = 22;
      brain.blockLow = rnd() < 0.6;
      brain.wait = 0;
      return { ...EMPTY_INPUT, x: -toward, y: brain.blockLow && op.y <= 0 ? -1 : 0 };
    }
    if (r < L.block + 0.12 && !me.burnout && me.ginga > 1500) {
      brain.queue.push(...Array(12).fill({ ...EMPTY_INPUT, G: 1 }));
      return brain.queue.shift();
    }
  }

  // Punir recuperação do adversário
  const opRec = (op.state === 'attack' && op.sf > op.move.startup + op.move.active) || op.state === 'parryRec' || op.state === 'land';
  if (opRec && rnd() < L.punish) {
    const order = ['5H', '5M', '2M', '5S', '6S', '5L'].filter((k) => moves[k] && moves[k].range + 30 > dist);
    if (order.length) return pressKey(brain, order[0], toward), brain.queue.shift();
  }

  // Super quando o adversário está vulnerável
  if ((op.state === 'hitstun' || op.state === 'crumple' || op.state === 'frozen' || op.state === 'slip') && me.super >= SYS.SUPER.stock && rnd() < 0.5) {
    const k = me.super >= 3 * SYS.SUPER.stock && moves.SA3 ? 'SA3' : 'SA1';
    if (moves[k] && moves[k].range + 40 > dist) return pressKey(brain, k, toward), brain.queue.shift();
  }

  if (rnd() < L.idle) return EMPTY_INPUT;

  // Ações próprias do personagem (recarregar, postura, armadilha)
  const custom = me.ch.mech?.aiPlan?.(st, me, op, dist, rnd);
  if (custom) return pressKey(brain, custom.key, toward, custom.extra), brain.queue.shift();

  // Ataques por distância
  const opts = [];
  for (const [key, m] of Object.entries(moves)) {
    if (m.air || m.type === 'super' || m.type === 'utility' || !m.hits.length && !m.spawn.length) continue;
    if (m.tags.includes('antiair') || m.tags.includes('reversal')) continue;
    const reach = m.spawn.length ? 1500 : m.range;
    if (dist > reach + 30) continue;
    if (key === 'throw' && (dist > 190 || op.state === 'attack')) continue;
    let w = 1;
    if (dist > reach * 0.45) w += 2;
    if (m.tags.includes('far') || m.tags.includes('zone')) w += dist > 380 ? 3 : 0;
    if (m.tags.includes('low') || m.tags.includes('overhead')) w += 0.6;
    if (key === 'throw') w = op.state === 'blockstun' || op.buf.back ? 3 : 0.8;
    if (m.type === 'special') w *= 0.8;
    opts.push([key, w]);
  }
  const far = (P.range === 'far' ? 620 : P.range === 'mid' ? 330 : 210);
  const attackChance = opts.length ? aggr * (dist < far + 80 ? 1 : 0.55) : 0;
  if (rnd() < attackChance) {
    let tot = opts.reduce((s, o) => s + o[1], 0) * rnd();
    for (const [key, w] of opts) {
      tot -= w;
      if (tot <= 0) {
        const turbo = moves[key].turbo && !me.burnout && me.ginga > 4000 && rnd() < 0.2;
        if (turbo) brain.queue.push({ ...EMPTY_INPUT, G: 1 });
        return pressKey(brain, key, toward, turbo ? { G: 1 } : {}), brain.queue.shift();
      }
    }
  }

  // Movimento
  const r = rnd();
  if (dist > far + 60) {
    if (r < 0.14 * aggr && dist > 600 && !me.burnout && me.ginga > 3000) return { ...EMPTY_INPUT, x: toward, G: 1 };
    if (r < 0.3 * aggr && dist < 760) {
      brain.queue.push(...Array(3).fill({ ...EMPTY_INPUT, x: toward, y: 1 }), ...Array(15).fill(EMPTY_INPUT));
      pressKey(brain, moves.jH ? 'jH' : 'jM', toward);
      return brain.queue.shift();
    }
    brain.hold = { ...EMPTY_INPUT, x: toward };
    brain.wait = 8 + Math.floor(rnd() * 10);
  } else if (dist < far * 0.45 && P.range !== 'close') {
    if (r < 0.25) {
      brain.queue.push({ ...EMPTY_INPUT, x: -toward }, EMPTY_INPUT, { ...EMPTY_INPUT, x: -toward });
      return brain.queue.shift();
    }
    brain.hold = { ...EMPTY_INPUT, x: -toward };
    brain.wait = 10;
  } else if (r < 0.5) {
    brain.hold = { ...EMPTY_INPUT, x: r < 0.3 ? toward : -toward };
    brain.wait = 6 + Math.floor(rnd() * 8);
  }
  return brain.hold;
}
