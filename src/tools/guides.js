import { SYS } from '../data/system.js';
import { ALL } from '../data/characters/index.js';
import { createMatch, step } from '../core/match.js';
import { startMove, setState } from '../core/fighter.js';
import { EMPTY_INPUT } from '../core/input.js';
import { drawFighter } from '../render/mannequin.js';

/**
 * Gera guias de pose: tiras de quadros do manequim, em células de tamanho fixo
 * com o pé sempre no mesmo ponto. Servem de referência para desenhar os sprites.
 */
export const CELL = 768;
const FOOT_Y = 700; // linha do chão dentro da célula
const STATES = {
  parado: { state: 'idle', frames: [0, 20, 40, 60] },
  andar: { state: 'walk', frames: [0, 7, 14, 21] },
  correr: { state: 'run', frames: [0, 4, 9, 13] },
  agachar: { state: 'crouch', frames: [1, 2, 4, 8], sf: true },
  pulo: { state: 'air', frames: [0, 0, 0, 0], vy: [30, 12, -6, -24], y: 180 },
  recuo: { state: 'backdash', frames: [0] },
  'defesa-em-pe': { state: 'blockstun', frames: [0] },
  'defesa-agachado': { state: 'blockstun', frames: [0], crouchBlock: true },
  'defesa-no-ar': { state: 'blockstun', frames: [0], y: 180 },
  'dano-alto': { state: 'hitstun', frames: [0], combo: 1 },
  'dano-baixo': { state: 'hitstun', frames: [0], combo: 2 },
  'dano-no-ar': { state: 'air_hit', frames: [0, 0, 0], vy: [18, 0, -18], y: 200 },
  caido: { state: 'knockdown', frames: [0] },
  levantar: { state: 'wakeup', frames: [1, 5, 9, 13], sf: true },
  tonto: { state: 'crumple', frames: [2, 8, 14, 20], sf: true },
  vitoria: { state: 'win', frames: [2, 8, 14, 20], sf: true },
};

/** Lista as tiras disponíveis para um personagem. */
export function listGuides(id) {
  const ch = ALL[id];
  return [...Object.keys(STATES), ...Object.keys(ch.moves).filter((k) => k !== 'click').map((k) => `golpe-${k}`)];
}

function cell(c, i, label, paint) {
  c.save();
  c.translate(i * CELL, 0);
  c.fillStyle = '#8f9399';
  c.fillRect(0, 0, CELL, CELL);
  c.strokeStyle = '#5a5d63';
  c.lineWidth = 2;
  c.strokeRect(1, 1, CELL - 2, CELL - 2);
  c.beginPath();
  c.moveTo(0, FOOT_Y);
  c.lineTo(CELL, FOOT_Y);
  c.moveTo(CELL / 2, FOOT_Y - 14);
  c.lineTo(CELL / 2, FOOT_Y + 14);
  c.stroke();
  c.save();
  c.beginPath();
  c.rect(0, 0, CELL, CELL);
  c.clip();
  paint();
  c.restore();
  c.fillStyle = '#1c1c20';
  c.font = 'bold 22px Arial';
  c.fillText(label, 12, 28);
  c.restore();
}

/** Desenha a tira `name` do personagem `id` no canvas. Retorna o número de quadros. */
export function renderGuide(canvas, id, name) {
  const ch = ALL[id];
  const st = createMatch({ chars: [ch, ch], seed: 1, training: true });
  st.phase = 'fight';
  const f = st.f[0];
  st.f[1].x = f.x + 1400;
  const c = canvas.getContext('2d');
  const draw = (frame) => {
    c.translate(CELL / 2 - f.x, FOOT_Y - SYS.GROUND_Y);
    drawFighter(c, f, frame);
  };
  const x0 = f.x;
  if (STATES[name]) {
    const S = STATES[name];
    canvas.width = CELL * S.frames.length;
    canvas.height = CELL;
    S.frames.forEach((fr, i) => {
      setState(f, S.state);
      f.sf = S.sf ? fr : 0;
      f.y = S.y || 0;
      f.vy = S.vy ? S.vy[i] : 0;
      f.crouchBlock = !!S.crouchBlock;
      f.comboHits = S.combo || 0;
      f.landFrames = 4;
      cell(c, i, `${ch.name} · ${name} · ${i + 1}/${S.frames.length}`, () => draw(fr));
    });
    return S.frames.length;
  }
  const key = name.replace('golpe-', '');
  const m = ch.moves[key];
  const last = m.hits.length ? m.hits[m.hits.length - 1].to : m.startup + m.active;
  const first = m.hits.length ? m.hits[0].from : m.startup + 1;
  const picks = [...new Set([1, Math.max(2, Math.round(m.startup * 0.6)), first, Math.round((first + last) / 2), last, Math.round((last + m.total) / 2)])].filter((n) => n < m.total).sort((a, b) => a - b);
  canvas.width = CELL * picks.length;
  canvas.height = CELL;
  if (m.air) {
    f.y = 200;
    f.vy = 0;
    setState(f, 'air');
  }
  f.super = 3000;
  startMove(st, f, key);
  let i = 0;
  for (let n = 0; n < m.total + 2 && i < picks.length; n++) {
    step(st, EMPTY_INPUT, EMPTY_INPUT);
    st.freeze = 0;
    if (f.state !== 'attack') break;
    if (m.air) {
      f.y = 200;
      f.vy = 0;
    }
    if (f.sf >= picks[i]) {
      const dx = f.x - x0;
      const sf = f.sf;
      cell(c, i, `${ch.name} · ${m.name} · quadro ${sf}/${m.total}`, () => {
        c.translate(CELL / 2 - f.x + Math.max(-160, Math.min(160, dx * 0.5)), FOOT_Y - SYS.GROUND_Y);
        drawFighter(c, f, sf);
      });
      i++;
    }
  }
  return i;
}

if (typeof window !== 'undefined') window.__guides = { listGuides, renderGuide, CELL };
