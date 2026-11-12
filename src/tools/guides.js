import { SYS } from '../data/system.js';
import { ALL } from '../data/characters/index.js';
import { createMatch, step } from '../core/match.js';
import { startMove, setState } from '../core/fighter.js';
import { EMPTY_INPUT } from '../core/input.js';
import { drawFighter } from '../render/mannequin.js';
import { STATE_ANIMS, movePicks, CELL, FOOT } from '../render/anim.js';

/**
 * Gera guias de pose: tiras de quadros do manequim, em células de tamanho fixo
 * com o pé sempre no mesmo ponto. Servem de referência para desenhar os sprites.
 */
const FOOT_Y = CELL * FOOT.y;
const STATES = STATE_ANIMS;

/** Lista as tiras disponíveis para um personagem. */
export function listGuides(id) {
  const ch = ALL[id];
  return [...Object.keys(STATES), ...Object.keys(ch.moves).filter((k) => k !== 'click').map((k) => `golpe-${k}`)];
}

let PLAIN = false; // sem linhas nem legendas (para testar o leitor de sprites)
function cell(c, i, label, paint) {
  c.save();
  c.translate(i * CELL, 0);
  c.fillStyle = '#8f9399';
  c.fillRect(0, 0, CELL, CELL);
  if (PLAIN) {
    paint();
    c.restore();
    return;
  }
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
export function renderGuide(canvas, id, name, plain = false) {
  PLAIN = plain;
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
  const picks = movePicks(m);
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
      const sf = f.sf;
      cell(c, i, `${ch.name} · ${m.name} · quadro ${sf}/${m.total}`, () => {
        c.translate(CELL / 2 - f.x, FOOT_Y - SYS.GROUND_Y);
        drawFighter(c, f, sf);
      });
      i++;
    }
  }
  return i;
}

if (typeof window !== 'undefined') window.__guides = { listGuides, renderGuide, CELL };
export { CELL };
