import { EMPTY_INPUT } from '../core/input.js';

/**
 * Teclado e controle. Converte os dispositivos nos botões lógicos do jogo.
 * Teclado: WASD/setas movem · J leve · K médio · L forte · I especial ·
 * U ginga · O agarrão · P super · Enter confirma/pausa · Esc volta.
 *
 * Controle (mapeamento padrão do navegador; DualSense/PS5, DualShock, Xbox):
 * □ leve · △ médio · ○ forte · ✕ especial · R1/L2 defesa (ginga) · L1 agarrão ·
 * R2 super · direcional ou analógico esquerdo movem · Options pausa · Create volta.
 * Nos menus: ✕ confirma, ○ volta.
 */
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', Space: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyJ: 'L', KeyK: 'M', KeyL: 'H', KeyI: 'S', KeyU: 'G', ShiftLeft: 'G', KeyO: 'T', KeyP: 'X',
  Enter: 'start', Escape: 'back', F1: 'boxes', F2: 'dummy', F3: 'level',
};
export const DEFAULT_PAD = { 2: 'L', 3: 'M', 1: 'H', 0: 'S', 5: 'G', 6: 'G', 4: 'T', 7: 'X', 9: 'start', 8: 'back', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };
const PAD_STORE = 'sn-controle';
/** Nome de cada botão do controle no padrão PlayStation (índices do mapeamento padrão). */
export const PS_NAMES = { 0: '✕', 1: '○', 2: '□', 3: '△', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'Create', 9: 'Options', 10: 'L3', 11: 'R3', 12: '↑', 13: '↓', 14: '←', 15: '→', 16: 'PS', 17: 'Touchpad' };
const loadPad = () => {
  try {
    const m = JSON.parse(localStorage.getItem(PAD_STORE) || 'null');
    return m && typeof m === 'object' ? m : { ...DEFAULT_PAD };
  } catch {
    return { ...DEFAULT_PAD };
  }
};

/** Troca o botão do controle de uma ação e salva no navegador. */
export function remapPad(d, action, button) {
  for (const [b, a] of Object.entries(d.padMap)) if (a === action && !['up', 'down', 'left', 'right'].includes(a)) delete d.padMap[b];
  d.padMap[button] = action;
  try {
    localStorage.setItem(PAD_STORE, JSON.stringify(d.padMap));
  } catch { /* sem armazenamento: vale só nesta sessão */ }
}

/** Volta o controle ao mapeamento padrão. */
export function resetPad(d) {
  d.padMap = { ...DEFAULT_PAD };
  try {
    localStorage.removeItem(PAD_STORE);
  } catch { /* nada a apagar */ }
}

/** Vibração do controle (DualSense e outros que aceitam). */
export function rumble(d, strong = 0.6, weak = 0.4, ms = 90) {
  const p = d.gamepad;
  try {
    p?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
  } catch { /* controle sem vibração */ }
}

export function createDevices(target = window) {
  const d = { held: {}, pressed: {}, padPrev: {}, padMap: loadPad(), padName: null, rawPrev: [], lastRaw: null, notice: null, kind: 'teclado', kbPressed: {}, pads: {} };
  target.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    d.kind = 'teclado';
    e.preventDefault();
    if (!d.held[k]) {
      d.pressed[k] = true;
      d.kbPressed[k] = true;
    }
    d.held[k] = true;
  });
  target.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code];
    if (k) d.held[k] = false;
  });
  target.addEventListener('blur', () => { d.held = {}; });
  return d;
}

/**
 * Lê todos os controles conectados. Cada controle tem seu próprio estado em
 * `d.pads[índice]` (usado no versus de dois jogadores); a soma de todos vai
 * para `d.pad`, que serve os menus e o jogo de um jogador.
 * Chame uma vez por quadro de tela.
 */
export function pollPad(d) {
  const list = typeof navigator !== 'undefined' && navigator.getGamepads ? [...navigator.getGamepads()].filter((x) => x && x.connected) : [];
  const first = list[0] || null;
  const name = first ? first.id : null;
  const seen = new Set();
  for (const p of list) {
    seen.add(p.index);
    if (!d.pads[p.index]) {
      d.pads[p.index] = { id: p.id, now: {}, prev: {}, pressed: {}, raw: [] };
      d.notice = { text: `CONTROLE ${p.index + 1} CONECTADO: ${padLabel(p.id)}`, t: 240 };
    }
  }
  for (const idx of Object.keys(d.pads)) {
    if (!seen.has(+idx)) {
      delete d.pads[idx];
      d.notice = { text: `CONTROLE ${+idx + 1} DESCONECTADO`, t: 180 };
    }
  }
  d.padName = name;
  d.gamepad = first;
  d.gamepads = list;
  const union = {};
  for (const p of list) {
    const s = d.pads[p.index];
    const now = {};
    const raw = p.buttons.map((b) => b.pressed || b.value > 0.5);
    raw.forEach((on, i) => {
      if (on && !s.raw[i]) {
        d.lastRaw = i;
        d.kind = 'controle';
        if (i === 0) {
          d.pressed.ok = true;
          s.pressed.ok = true;
        }
        if (i === 1) {
          d.pressed.cancel = true;
          s.pressed.cancel = true;
        }
      }
      const act = d.padMap[i];
      if (on && act) now[act] = true;
    });
    s.raw = raw;
    if (p.axes[0] < -0.45) now.left = true;
    if (p.axes[0] > 0.45) now.right = true;
    if (p.axes[1] < -0.55) now.up = true;
    if (p.axes[1] > 0.55) now.down = true;
    for (const k of Object.keys(now)) {
      if (!s.prev[k]) s.pressed[k] = true;
      union[k] = true;
    }
    s.now = now;
    s.prev = now;
  }
  for (const k of Object.keys(union)) if (!d.padPrev[k]) d.pressed[k] = true;
  d.pad = union;
  d.padPrev = union;
}

/**
 * Fontes de entrada para o versus: 'kb' (teclado) ou o índice de um controle.
 */
export function readInputFrom(d, src) {
  if (src == null) return { ...EMPTY_INPUT };
  const has = src === 'kb' ? (k) => !!(d.held[k] || d.touch?.[k]) : (k) => !!d.pads[src]?.now[k];
  return {
    ...EMPTY_INPUT,
    x: (has('right') ? 1 : 0) - (has('left') ? 1 : 0),
    y: (has('up') ? 1 : 0) - (has('down') ? 1 : 0),
    L: +has('L'), M: +has('M'), H: +has('H'), S: +has('S'), G: +has('G'), T: +has('T'), X: +has('X'),
  };
}

/** Apertos novos de uma fonte (teclado ou um controle), para menus por jogador. Limpa a lista. */
export function takePressedFrom(d, src) {
  if (src === 'kb') {
    const p = d.kbPressed;
    d.kbPressed = {};
    return p;
  }
  const s = d.pads[src];
  if (!s) return {};
  const p = s.pressed;
  s.pressed = {};
  return p;
}

/** Limpa os apertos guardados de todas as fontes (ao trocar de tela). */
export function clearPressed(d) {
  d.kbPressed = {};
  for (const s of Object.values(d.pads)) s.pressed = {};
}

/** Vibração de um controle específico. */
export function rumbleOn(d, src, strong, weak, ms) {
  const p = (d.gamepads || []).find((g) => g.index === src);
  try {
    p?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
  } catch { /* controle sem vibração */ }
}

/** Nome curto do controle a partir do identificador do navegador. */
export function padLabel(id) {
  if (/dualsense|0ce6|0df2/i.test(id)) return 'DUALSENSE (PS5)';
  if (/dualshock|054c/i.test(id)) return 'DUALSHOCK (PS4)';
  if (/xbox|xinput|045e/i.test(id)) return 'XBOX';
  if (/switch|057e/i.test(id)) return 'SWITCH';
  return id.replace(/\(.*?\)/g, '').trim().slice(0, 28).toUpperCase() || 'CONTROLE';
}

/** Rótulos dos botões do jogo no dispositivo em uso (para listas de golpes e combos). */
export function glyphs(d) {
  if (d.kind === 'controle' && d.padName) {
    const g = {};
    for (const [b, a] of Object.entries(d.padMap)) if (!g[a]) g[a] = PS_NAMES[b] || `B${b}`;
    return g;
  }
  return { L: 'J', M: 'K', H: 'L', S: 'I', G: 'U', T: 'O', X: 'P', start: 'ENTER', back: 'ESC' };
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
