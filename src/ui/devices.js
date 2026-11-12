import { EMPTY_INPUT } from '../core/input.js';

/**
 * Teclado e controle. Converte os dispositivos nos botões lógicos do jogo.
 * Teclado: WASD/setas movem · J leve · K médio · L forte · I especial ·
 * U ginga · O agarrão · P super · Enter confirma/pausa · Esc volta.
 */
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', Space: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyJ: 'L', KeyK: 'M', KeyL: 'H', KeyI: 'S', KeyU: 'G', ShiftLeft: 'G', KeyO: 'T', KeyP: 'X',
  Enter: 'start', Escape: 'back', F1: 'boxes', F2: 'dummy', F3: 'level',
};
const PAD = { 2: 'L', 3: 'M', 1: 'H', 0: 'S', 5: 'G', 4: 'T', 7: 'X', 9: 'start', 8: 'back', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export function createDevices(target = window) {
  const d = { held: {}, pressed: {}, padPrev: {} };
  target.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    if (!d.held[k]) d.pressed[k] = true;
    d.held[k] = true;
  });
  target.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code];
    if (k) d.held[k] = false;
  });
  target.addEventListener('blur', () => { d.held = {}; });
  return d;
}

/** Lê o controle (se houver) e mistura com o teclado. Chame uma vez por quadro de tela. */
export function pollPad(d) {
  const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
  const p = [...pads].find((x) => x && x.connected);
  const now = {};
  if (p) {
    p.buttons.forEach((b, i) => { if (PAD[i] && b.pressed) now[PAD[i]] = true; });
    if (p.axes[0] < -0.45) now.left = true;
    if (p.axes[0] > 0.45) now.right = true;
    if (p.axes[1] < -0.55) now.up = true;
    if (p.axes[1] > 0.55) now.down = true;
  }
  for (const k of new Set([...Object.keys(now), ...Object.keys(d.padPrev)])) {
    if (now[k] && !d.padPrev[k]) d.pressed[k] = true;
  }
  d.pad = now;
  d.padPrev = now;
}

const on = (d, k) => !!(d.held[k] || d.pad?.[k] || d.touch?.[k]);

/** Entrada do jogador para a simulação. */
export function readInput(d) {
  return {
    ...EMPTY_INPUT,
    x: (on(d, 'right') ? 1 : 0) - (on(d, 'left') ? 1 : 0),
    y: (on(d, 'up') ? 1 : 0) - (on(d, 'down') ? 1 : 0),
    L: +on(d, 'L'), M: +on(d, 'M'), H: +on(d, 'H'), S: +on(d, 'S'), G: +on(d, 'G'), T: +on(d, 'T'), X: +on(d, 'X'),
  };
}

/** Apertos novos desde a última leitura (para menus). Limpa a lista. */
export function takePressed(d) {
  const p = d.pressed;
  d.pressed = {};
  return p;
}
