import { SYS } from '../data/system.js';

/** Botões lógicos: L leve, M médio, H forte, S especial, G ginga, T agarrão, X super. */
export const BUTTONS = ['L', 'M', 'H', 'S', 'G', 'T', 'X'];

/** Entrada "vazia" de um quadro. x: -1 esquerda, 1 direita. y: 1 cima, -1 baixo. */
export const EMPTY_INPUT = Object.freeze({ x: 0, y: 0, L: 0, M: 0, H: 0, S: 0, G: 0, T: 0, X: 0 });

/** Cria a memória de comandos de um lutador. */
export function newBuffer() {
  const press = {};
  for (const b of BUTTONS) press[b] = 99;
  return {
    cur: { ...EMPTY_INPUT },
    prev: { ...EMPTY_INPUT },
    press, // quadros desde que cada botão foi apertado (99 = não vale mais)
    dirAt: {}, // direção que estava segurada no momento do aperto de cada botão
    fwd: false,
    back: false,
    up: false,
    down: false,
    upPress: 99,
    tapF: 99,
    tapB: 99,
    dashF: 99,
    dashB: 99,
    cmdAt: {}, // comando de sequência reconhecido no aperto de cada botão ('c1', 'c2')
    downEdge: 99, // quadros desde que ↓ começou a ser segurado
    sinceDown: 99, // quadros desde o último quadro com ↓
    gHeld: 0, // quadros com o botão de Ginga segurado (defesa perfeita)
  };
}

/**
 * Alimenta a memória com a entrada do quadro.
 * @param {object} buf memória do lutador
 * @param {object} raw entrada bruta do quadro
 * @param {number} face 1 olhando para a direita, -1 para a esquerda
 * @param {boolean} frozen true durante a pausa de impacto (o tempo dos botões não corre)
 */
export function feed(buf, raw, face, frozen = false) {
  buf.prev = buf.cur;
  buf.cur = raw;
  const rel = raw.x * face;
  const wasF = buf.fwd;
  const wasB = buf.back;
  const wasUp = buf.up;
  buf.fwd = rel > 0;
  buf.back = rel < 0;
  buf.up = raw.y > 0;
  buf.down = raw.y < 0;

  if (!frozen) {
    for (const b of BUTTONS) if (buf.press[b] < 99) buf.press[b]++;
    for (const k of ['upPress', 'tapF', 'tapB', 'dashF', 'dashB', 'downEdge', 'sinceDown']) if (buf[k] < 99) buf[k]++;
  }
  buf.gHeld = raw.G ? buf.gHeld + 1 : 0;
  // Direções primeiro, para o botão do mesmo quadro já enxergar a sequência
  const wasDown = buf.prev.y < 0;
  if (buf.down && !wasDown) buf.downEdge = 0;
  if (buf.down) buf.sinceDown = 0;
  if (buf.up && !wasUp) buf.upPress = 0;
  if (buf.fwd && !wasF) {
    if (buf.tapF <= SYS.DASH.tapWindow) buf.dashF = 0;
    buf.tapF = 0;
  }
  if (buf.back && !wasB) {
    if (buf.tapB <= SYS.DASH.tapWindow) buf.dashB = 0;
    buf.tapB = 0;
  }
  // Sequências: c1 = → ← + botão · c2 = ↓ → + botão
  const M = SYS.MOTION;
  const cmd = buf.tapB <= M.last && buf.tapF <= M.first && buf.tapF > buf.tapB ? 'c1'
    : buf.tapF <= M.last && buf.sinceDown <= M.last + 2 && buf.downEdge <= M.first && buf.downEdge >= buf.tapF ? 'c2' : null;
  const snap = { down: buf.down, fwd: buf.fwd, back: buf.back };
  for (const b of BUTTONS) {
    if (raw[b] && !buf.prev[b]) {
      buf.press[b] = 0;
      buf.dirAt[b] = snap;
      buf.cmdAt[b] = cmd;
    }
  }

  // Atalhos: Leve+Médio = agarrão, Forte+Especial = super.
  if (buf.press.L <= SYS.SIMUL && buf.press.M <= SYS.SIMUL && raw.L && raw.M) {
    buf.press.T = 0;
    buf.dirAt.T = snap;
    buf.press.L = buf.press.M = 99;
  }
  if (buf.press.H <= SYS.SIMUL && buf.press.S <= SYS.SIMUL && raw.H && raw.S) {
    buf.press.X = 0;
    buf.dirAt.X = snap;
    buf.press.H = buf.press.S = 99;
  }

}

/** O botão foi apertado há pouco? Consome o aperto. */
export function take(buf, b, window = SYS.BUFFER) {
  if (buf.press[b] <= window) {
    buf.press[b] = 99;
    return true;
  }
  return false;
}

/** Igual a take, sem consumir. */
export function peek(buf, b, window = SYS.BUFFER) {
  return buf.press[b] <= window;
}

/** Consome um comando de corrida (dois toques). dir: 'F' ou 'B'. */
export function takeDash(buf, dir) {
  const k = dir === 'F' ? 'dashF' : 'dashB';
  if (buf[k] <= SYS.BUFFER) {
    buf[k] = 99;
    return true;
  }
  return false;
}
