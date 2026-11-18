/**
 * Visual "clássico" dos menus (título, seleção e Modo História), no espírito
 * dos jogos de luta de 16 bits: fundo preto ou azul, fonte de pixel com
 * degradê em faixas, retratos pixelados e mapa-múndi em blocos.
 *
 * Tudo é desenhado em código a partir do que o jogo já tem (logo, retratos e
 * ícones do pacote comic-v1); nenhuma imagem nova é baixada. Cada desenho caro
 * vai para um canvas guardado em cache e só é refeito quando a arte chega.
 */
import { comicImageEl } from './comic-ui.js';
import { ALL } from '../data/characters/index.js';

const makeCanvas = (w, h) => typeof OffscreenCanvas !== 'undefined'
  ? new OffscreenCanvas(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)))
  : Object.assign(document.createElement('canvas'), { width: Math.max(1, Math.ceil(w)), height: Math.max(1, Math.ceil(h)) });

/** Desenha um canvas de cache sem suavizar, para os pixels ficarem nítidos. */
function blit(c, img, x, y, w = img.width, h = img.height) {
  const s = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  c.imageSmoothingEnabled = s;
}

export const RETRO = {
  black: '#000000', navy: '#0c1a96', navyDot: '#0a157e', cream: '#f2e6c4', yellow: '#f8c820',
  red: '#e0221c', blue: '#1c48f0', purple: '#7048d8', ink: '#0a0710',
};

// ───────────────────────── fonte de pixel 5×7 ─────────────────────────
// Cada glifo: linhas de '#' e '.', 7 de altura (corpo). Acentos usam duas
// linhas acima do corpo e o Ç uma abaixo, como nas fontes de cartucho.
const G = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '###|.#.|.#.|.#.|.#.|.#.|###', J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  ' ': '...|...|...|...|...|...|...', '.': '.|.|.|.|.|.|#', ',': '..|..|..|..|..|.#|#.',
  ':': '.|#|.|.|.|#|.', '!': '#|#|#|#|#|.|#', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '-': '....|....|....|####|....|....|....', '—': '.....|.....|.....|#####|.....|.....|.....',
  '•': '...|...|.#.|###|.#.|...|...', "'": '#|#|.|.|.|.|.', '/': '.....|....#|...#.|..#..|.#...|#....|.....',
  '(': '.#|#.|#.|#.|#.|#.|.#', ')': '#.|.#|.#|.#|.#|.#|#.', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....', '✓': '.....|.....|....#|...#.|#.#..|.#...|.....',
  '©': '..###..|.#...#.|#..##.#|#.#...#|#..##.#|.#...#.|..###..',
  '▶': '#...|##..|###.|####|###.|##..|#...', '◀': '...#|..##|.###|####|.###|..##|...#',
  '←': '..#....|.#.....|#######|.#.....|..#....|.......|.......', '→': '....#..|.....#.|#######|.....#.|....#..|.......|.......',
  '↑': '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..', '↓': '..#..|..#..|..#..|..#..|#.#.#|.###.|..#..',
  '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##', '&': '.##..|#..#.|.##..|.#...|#.#.#|#..#.|.##.#',
  '"': '#.#|#.#|...|...|...|...|...', ';': '..|.#|..|..|..|.#|#.', '$': '..#..|.####|#.#..|.###.|..#.#|####.|..#..',
  '…': '.....|.....|.....|.....|.....|.....|#.#.#', '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
};
/** Sinais tipográficos que viram o equivalente simples da fonte. */
const ALIAS = { '“': '"', '”': '"', '’': "'", '‘': "'", '–': '-' };
const ACCENT = {
  acute: ['...#.', '..#..'], grave: ['.#...', '..#..'], circ: ['..#..', '.#.#.'], tilde: ['.##.#', '#..#.'], uml: ['.#.#.', '.....'],
};
const ACCENTED = {
  'Á': ['A', 'acute'], 'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ã': ['A', 'tilde'], 'É': ['E', 'acute'], 'Ê': ['E', 'circ'],
  'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ô': ['O', 'circ'], 'Õ': ['O', 'tilde'], 'Ú': ['U', 'acute'], 'Ü': ['U', 'uml'], 'Ç': ['C', 'cedil'],
};
const glyphCache = new Map();
/** Pixels de um caractere: lista de [x, y] (y de -2 a 8) e largura. */
function glyph(ch) {
  if (glyphCache.has(ch)) return glyphCache.get(ch);
  const up = ALIAS[ch] ?? ch.toLocaleUpperCase('pt-BR');
  let base = up, mark = null;
  if (ACCENTED[up]) [base, mark] = ACCENTED[up];
  const src = G[base] ?? G['?'];
  const rows = src.split('|');
  const w = rows[0].length;
  const px = [];
  rows.forEach((r, y) => [...r].forEach((v, x) => { if (v === '#') px.push([x, y]); }));
  if (mark === 'cedil') px.push([Math.floor(w / 2), 7], [Math.floor(w / 2) - 1, 8], [Math.floor(w / 2), 8]);
  else if (mark) {
    const off = Math.floor((w - 5) / 2);
    ACCENT[mark].forEach((r, i) => [...r].forEach((v, x) => { if (v === '#' && x + off >= 0 && x + off < w) px.push([x + off, i - 2]); }));
  }
  const g = { px, w };
  glyphCache.set(ch, g);
  return g;
}

/** Faixas de cor por linha do corpo (0 = topo); fora do corpo usa a ponta mais próxima. */
const STYLES = {
  gold: { rows: ['#fffbe0', '#fff090', '#ffd848', '#ffb428', '#ff8c18', '#f06414', '#d84010'], outline: '#1a0600', shadow: '#5a1000' },
  silver: { rows: ['#ffffff', '#f0f0f8', '#d8d8e8', '#b8bccc', '#9aa0b8', '#c4c8d8', '#e8e8f0'], outline: '#0a0a14', shadow: '#2a2a3a' },
  blue: { rows: ['#f0f8ff', '#b8d8ff', '#80b4ff', '#5890ff', '#3c70f0', '#2c58d8', '#2448c0'], outline: '#000428', shadow: null },
  cyan: { rows: ['#f0ffff', '#a8f4ff', '#60e0ff', '#30c0ff', '#1898f0', '#1078d8', '#0860c0'], outline: '#000428', shadow: '#000a40' },
  cream: { rows: ['#fff8e4', '#f6ecd0', '#f0e2c0', '#ead8b0', '#e4d0a4', '#dccaa0', '#d4c098'], outline: null, shadow: null },
  creamOut: { rows: ['#fff8e4', '#f6ecd0', '#f0e2c0', '#ead8b0', '#e4d0a4', '#dccaa0', '#d4c098'], outline: '#0a0710', shadow: null },
  yellow: { rows: ['#fff6a0', '#ffe860', '#ffd830', '#f8c820', '#f0b818', '#e8a810', '#e09c08'], outline: '#1a0e00', shadow: null },
  white: { rows: ['#ffffff'], outline: '#000000', shadow: null },
  dim: { rows: ['#8088b0'], outline: null, shadow: null },
  red: { rows: ['#ffd0c0', '#ff8070', '#ff4838', '#f02818', '#d81c10', '#c01408', '#a81000'], outline: '#1a0000', shadow: null },
  ink: { rows: ['#0a0710'], outline: null, shadow: null },
};

/** Largura do texto em unidades de pixel (antes da escala). */
function measure(str) {
  let w = 0;
  for (const ch of str) w += glyph(ch).w + 1;
  return Math.max(0, w - 1);
}

const textCache = new Map();
function renderText(str, u, style) {
  const key = `${style}|${u}|${str}`;
  let cv = textCache.get(key);
  if (cv) return cv;
  const S = STYLES[style] ?? STYLES.cream;
  const pad = 2;
  const w = measure(str);
  cv = makeCanvas((w + pad * 2) * u, (11 + pad * 2) * u);
  const g = cv.getContext('2d');
  const pts = [];
  let x = 0;
  for (const ch of str) { const gl = glyph(ch); for (const [px, py] of gl.px) pts.push([x + px, py]); x += gl.w + 1; }
  const at = (px, py) => [(px + pad) * u, (py + 2 + pad) * u];
  if (S.shadow) { g.fillStyle = S.shadow; for (const [px, py] of pts) { const [X, Y] = at(px + 1, py + 1); g.fillRect(X - u, Y - u, u * 3, u * 3); } }
  if (S.outline) { g.fillStyle = S.outline; for (const [px, py] of pts) { const [X, Y] = at(px, py); g.fillRect(X - u, Y - u, u * 3, u * 3); } }
  for (const [px, py] of pts) {
    g.fillStyle = S.rows[Math.max(0, Math.min(S.rows.length - 1, Math.round(py * (S.rows.length - 1) / 6)))];
    const [X, Y] = at(px, py);
    g.fillRect(X, Y, u, u);
  }
  if (textCache.size > 600) textCache.clear();
  textCache.set(key, cv);
  return cv;
}

/** Largura na tela de um texto em fonte de pixel com unidade `u`. */
export const ptextWidth = (str, u) => measure(String(str)) * u;

/**
 * Escreve na fonte de pixel. `y` é o centro vertical do corpo das letras.
 * `maxW` comprime na horizontal quando não cabe (como os nomes longos do jogo).
 */
export function ptext(c, str, x, y, u, style = 'cream', align = 'center', maxW = 0) {
  str = String(str);
  if (!str) return 0;
  const cv = renderText(str, u, style);
  const pad = 2 * u;
  const real = measure(str) * u;
  const k = maxW && real > maxW ? maxW / real : 1;
  const w = real * k;
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  blit(c, cv, left - pad * k, y - 3.5 * u - (2 * u + pad), cv.width * k, cv.height);
  return w;
}

/** Quebra o texto em linhas que cabem em `width` pixels na unidade `u`. */
export function pwrap(str, width, u) {
  const out = [];
  let line = '';
  for (const word of String(str).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) * u > width) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

// ───────────────────── retratos e ícones pixelados ─────────────────────
const pixCache = new Map();
/**
 * Versão pixelada de uma arte do pacote comic-v1 (reduzida para `cols` colunas
 * e com cores limitadas), como os retratos de cartucho da referência.
 */
function pixelated(id, cols) {
  const key = `${id}|${cols}`;
  if (pixCache.has(key)) return pixCache.get(key);
  const img = comicImageEl(id);
  if (!img) return null; // ainda carregando: não guarda, tenta de novo no próximo quadro
  const rows = Math.round(cols * img.height / img.width);
  const cv = makeCanvas(cols, rows);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, cols, rows);
  try {
    // Posteriza (5 níveis por canal) e corta o alfa: borda dura de sprite.
    const d = g.getImageData(0, 0, cols, rows);
    const q = (v) => Math.round(v / 51) * 51;
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i] = q(d.data[i]); d.data[i + 1] = q(d.data[i + 1]); d.data[i + 2] = q(d.data[i + 2]);
      d.data[i + 3] = d.data[i + 3] > 110 ? 255 : 0;
    }
    g.putImageData(d, 0, 0);
  } catch { /* canvas contaminado: fica só reduzido */ }
  pixCache.set(key, cv);
  return cv;
}

/** Ícone pixelado (rosto) recortado para caber em w×h, ancorado embaixo. */
export function pixelIcon(c, id, x, y, w, h, flip = false) {
  const cv = pixelated('icon-' + id, 64) || pixelated('portrait-' + id, 96);
  if (!cv) return false;
  const s = Math.max(w / cv.width, h / cv.height);
  const dw = cv.width * s, dh = cv.height * s;
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (flip) { c.translate(x * 2 + w, 0); c.scale(-1, 1); }
  blit(c, cv, x + (w - dw) / 2, y + h - dh, dw, dh);
  c.restore();
  return true;
}

/** Retrato grande pixelado (busto inteiro). */
export function pixelPortrait(c, id, x, y, w, h, flip = false) {
  const cv = pixelated('portrait-' + id, 112);
  if (!cv) return false;
  c.save();
  if (flip) { c.translate(x * 2 + w, 0); c.scale(-1, 1); }
  blit(c, cv, x, y, w, h);
  c.restore();
  return true;
}

// ───────────────────────── fundos e molduras ─────────────────────────
let navyCache = null;
/** Fundo azul do Modo História, com pontilhado de 4 px. */
export function navyBackground(c) {
  if (!navyCache) {
    navyCache = makeCanvas(1920, 1080);
    const g = navyCache.getContext('2d');
    g.fillStyle = RETRO.navy; g.fillRect(0, 0, 1920, 1080);
    g.fillStyle = RETRO.navyDot;
    for (let y = 0; y < 1080; y += 8) for (let x = (y / 8) % 2 * 4; x < 1920; x += 8) g.fillRect(x, y, 4, 4);
  }
  c.drawImage(navyCache, 0, 0);
}

const hatchCache = new Map();
/** Fundo hachurado das molduras de personagem (azul-escuro ou vermelho no cursor). */
function hatch(w, h, base, line) {
  const key = `${w}|${h}|${base}`;
  if (hatchCache.has(key)) return hatchCache.get(key);
  const cv = makeCanvas(w, h);
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.fillStyle = line;
  for (let y = 0; y < h; y += 3) for (let x = (y % 6 ? 3 : 0); x < w; x += 6) g.fillRect(x, y, 3, 3);
  hatchCache.set(key, cv);
  return cv;
}

/** Retângulo com borda em degraus (cantos chanfrados de 1 bloco). */
export function pixelBox(c, x, y, w, h, fill, border, b = 4) {
  c.fillStyle = border;
  c.fillRect(x + b, y, w - b * 2, h);
  c.fillRect(x, y + b, w, h - b * 2);
  if (fill) { c.fillStyle = fill; c.fillRect(x + b, y + b, w - b * 2, h - b * 2); }
}

/** Etiqueta inclinada "1P" / "2P" / "CPU" da referência. */
export function playerTag(c, label, x, y, color, u = 5) {
  const w = ptextWidth(label, u) + 40;
  const h = 62;
  c.save();
  c.fillStyle = RETRO.yellow;
  c.beginPath(); c.moveTo(x + 14, y - 5); c.lineTo(x + w + 12, y - 5); c.lineTo(x + w - 8, y + h + 5); c.lineTo(x - 10, y + h + 5); c.closePath(); c.fill();
  c.fillStyle = color;
  c.beginPath(); c.moveTo(x + 16, y); c.lineTo(x + w + 4, y); c.lineTo(x + w - 12, y + h); c.lineTo(x - 2, y + h); c.closePath(); c.fill();
  c.restore();
  ptext(c, label, x + w / 2, y + h / 2, u, 'creamOut');
  return w;
}

/**
 * Moldura de personagem da seleção: borda creme, fundo hachurado, rosto
 * pixelado e placa com o nome. `cursor` = cor do jogador que está em cima.
 */
export function fighterCard(c, ch, x, y, w, h, { cursor = null, plate = true, nameU = 4, dim = false } = {}) {
  const plateH = plate ? Math.round(h * 0.18) : 0;
  pixelBox(c, x, y, w, h, null, cursor || RETRO.cream, 6);
  pixelBox(c, x + 6, y + 6, w - 12, h - 12, null, RETRO.ink, 4);
  const ix = x + 10, iy = y + 10, iw = w - 20, ih = h - 20 - plateH;
  const bg = cursor === RETRO.red ? hatch(iw, ih, '#a01814', '#c82a1c') : cursor === RETRO.blue ? hatch(iw, ih, '#142c9c', '#2448c8') : hatch(iw, ih, '#1c1c66', '#2a2a86');
  blit(c, bg, ix, iy);
  if (ch && !pixelIcon(c, ch.id, ix, iy, iw, ih)) ptext(c, '?', ix + iw / 2, iy + ih / 2, 10, 'silver');
  if (!ch) ptext(c, '?', ix + iw / 2, iy + ih / 2, Math.max(6, Math.round(ih / 14)), 'gold');
  if (dim) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(ix, iy, iw, ih); }
  if (plate) {
    c.fillStyle = RETRO.cream; c.fillRect(x + 6, y + h - plateH - 10, w - 12, 4);
    c.fillStyle = RETRO.ink; c.fillRect(ix, y + h - plateH - 6, iw, plateH - 4);
    ptext(c, ch ? ch.name.split(',')[0] : 'ALEATÓRIO', x + w / 2, y + h - plateH / 2 - 8, nameU, 'creamOut', 'center', iw - 16);
  }
  if (cursor) {
    c.strokeStyle = RETRO.yellow; c.lineWidth = 4;
    c.strokeRect(x - 3, y - 3, w + 6, h + 6);
  }
}

// ───────────────────────────── louros ─────────────────────────────
let laurelCache = null;
/** Ramo de louro roxo em pixels (lado esquerdo; o direito é espelhado). */
function laurel() {
  if (laurelCache) return laurelCache;
  const U = 5, W = 44, H = 90;
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const stem = (t) => [30 - Math.sin(t * Math.PI * 0.9) * 22, 6 + t * 80]; // curva aberta para fora
  g.fillStyle = '#4a2ca0';
  for (let t = 0; t <= 1; t += 0.01) { const [x, y] = stem(t); g.fillRect(Math.round(x), Math.round(y), 2, 2); }
  for (let i = 0; i < 9; i++) {
    const t = 0.06 + i * 0.105;
    const [x, y] = stem(t);
    for (const side of [-1, 1]) {
      const ang = side < 0 ? -2.3 + t * 0.6 : -0.9 + t * 0.4;
      const len = 11 - i * 0.35;
      for (let k = 0; k < len; k++) {
        const wid = Math.sin((k / len) * Math.PI) * 2.6;
        for (let s = -wid; s <= wid; s += 0.5) {
          const px = x + Math.cos(ang) * k - Math.sin(ang) * s;
          const py = y + Math.sin(ang) * k + Math.cos(ang) * s;
          g.fillStyle = s < -wid * 0.3 ? '#9c78ff' : s > wid * 0.4 ? '#4a2ca0' : '#7050d8';
          g.fillRect(Math.round(px), Math.round(py), 1, 1);
        }
      }
    }
  }
  laurelCache = { cv, U };
  return laurelCache;
}
export function drawLaurels(c, leftX, rightX, y) {
  const { cv, U } = laurel();
  blit(c, cv, leftX, y, cv.width * U, cv.height * U);
  c.save(); c.translate(rightX + cv.width * U, 0); c.scale(-1, 1); blit(c, cv, 0, y, cv.width * U, cv.height * U); c.restore();
}

// ─────────────────────── atributos dos lutadores ───────────────────────
/**
 * PODER / VELOCIDADE / ALCANCE / TÉCNICA de 1 a 6, calculados das fichas de
 * combate (dano, velocidade de andar e preparo, alcance dos golpes normais e
 * quantidade de recursos especiais), para não inventar números à parte.
 */
let statCache = null;
export function fighterStats(id) {
  if (!statCache) {
    const raw = {};
    for (const ch of Object.values(ALL)) {
      const m = ch.moves;
      const dmgOf = (k) => (m[k]?.hits || []).reduce((s, h) => s + (h.dmg || 0), 0);
      const normals = ['5L', '5M', '5H'].filter((k) => m[k]);
      const power = (dmgOf('5H') + dmgOf('5S') + dmgOf('6S') + dmgOf('SA3') * 0.5) * (ch.hpScale || 1);
      const startup = normals.reduce((s, k) => s + m[k].startup, 0) / Math.max(1, normals.length);
      const speed = (ch.walkF || 6) * 2 - startup;
      const reach = normals.reduce((s, k) => s + Math.max(0, ...(m[k].hits || []).map((h) => h.box.x + h.box.w)), 0) / Math.max(1, normals.length);
      const tech = Object.values(m).filter((v) => v.type === 'special').length + Object.values(m).filter((v) => v.hold || v.flags?.mash || v.spawn).length * 1.5 + (ch.mechName ? 1 : 0);
      raw[ch.id] = { power, speed, reach, tech };
    }
    statCache = {};
    const keys = ['power', 'speed', 'reach', 'tech'];
    const span = Object.fromEntries(keys.map((k) => { const v = Object.values(raw).map((r) => r[k]); return [k, [Math.min(...v), Math.max(...v)]]; }));
    for (const [cid, r] of Object.entries(raw)) statCache[cid] = keys.map((k) => { const [a, b] = span[k]; return b > a ? 1 + Math.round(((r[k] - a) / (b - a)) * 5) : 3; });
  }
  return statCache[id] || [3, 3, 3, 3];
}

/** Painel de atributos com barras em gomos (cor do jogador). */
export function statPanel(c, ch, x, y, color, rightAlign = false) {
  const w = 340, h = 156;
  pixelBox(c, x, y, w, h, '#000000', RETRO.yellow, 6);
  pixelBox(c, x + 6, y + 6, w - 12, h - 12, '#000000', '#3a2a00', 2);
  if (!ch) { ptext(c, 'SORTEIO', x + w / 2, y + h / 2, 5, 'gold'); return; }
  const stats = fighterStats(ch.id);
  ['PODER', 'VELOCIDADE', 'ALCANCE', 'TÉCNICA'].forEach((label, i) => {
    const ry = y + 32 + i * 32;
    ptext(c, label, x + 22, ry, 3, 'cream', 'left', 150);
    for (let k = 0; k < 6; k++) {
      c.fillStyle = k < stats[i] ? color : '#8a8a96';
      c.fillRect(x + 182 + k * 24, ry - 10, 20, 20);
      c.fillStyle = k < stats[i] ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.25)';
      c.fillRect(x + 182 + k * 24, ry - 10, 20, 5);
    }
  });
  void rightAlign;
}

// ───────────────────────────── mapa-múndi ─────────────────────────────
// Contornos simplificados (longitude, latitude) dos continentes, rasterizados
// em blocos. LAKES são recortes de água dentro da terra.
const LAND = [
  // América do Norte
  [-166, 68, -156, 71, -141, 70, -128, 70, -115, 68, -100, 68, -94, 72, -82, 69, -70, 67, -64, 60, -56, 52, -60, 47, -66, 45, -70, 42, -74, 40, -76, 35, -81, 31, -80, 26, -81, 25, -83, 29, -89, 30, -95, 29, -97, 26, -97, 22, -94, 18.5, -91, 19, -90, 21.5, -87, 21.5, -88, 16, -84, 15, -83, 11, -79, 9, -77, 8, -80, 7.5, -84, 9, -86, 11, -88, 13, -92, 14.5, -96, 16, -105, 20, -109, 24, -112, 28, -115, 30, -117, 32.5, -121, 35, -124, 40, -124, 46, -125, 49, -131, 54, -136, 58, -142, 60, -148, 60, -154, 58, -158, 57, -164, 55, -161, 58, -165, 61, -166, 64, -163, 65.5],
  [-90, 73, -85, 70, -78, 64, -73, 64, -66, 62, -62, 66, -70, 70, -80, 73.5], // Baffin
  [-92, 77, -80, 76, -64, 79, -62, 82, -80, 83, -92, 81], // Ellesmere
  [-118, 69, -100, 68.5, -100, 73, -118, 73], // Victoria
  [-73, 78, -60, 82, -30, 83, -20, 80, -18, 76, -22, 70, -32, 68, -40, 65, -43, 60, -48, 61, -52, 65, -54, 69, -58, 75, -68, 77], // Groenlândia
  [-24, 64, -22, 66.4, -14, 66.4, -13.5, 64.5, -18, 63.4], // Islândia
  [-85, 21.8, -80, 23.1, -74.2, 20.2, -77.5, 19.9, -80, 21.7], // Cuba
  [-74.5, 18, -74, 19.9, -68.4, 19.6, -68.4, 18.2], // Hispaniola
  // América do Sul
  [-80, 9, -75, 11, -72, 12, -64, 10.5, -60, 8.5, -52, 5, -50, 0, -44, -2.5, -35, -5, -35, -9, -39, -13, -39, -18, -41, -22, -48, -26, -48.5, -28, -53, -34, -58, -35, -57, -38, -62, -39, -65, -41, -64, -43, -67, -46, -66, -48, -69, -51, -68, -55, -72, -54, -75, -50, -73, -44, -73, -38, -71.5, -30, -70, -18, -76, -14, -81, -5, -80, -1, -78, 2, -77, 7],
  // Eurásia
  [-9, 43, -9, 37, -6, 36, -2, 36.7, 0, 38.7, 3, 42, 3, 43.5, 7.5, 43.7, 9, 44.4, 12.5, 44, 15, 41, 16, 38, 18.5, 40, 16, 42, 13.5, 45.5, 19, 42, 20, 40, 23, 37, 24, 40, 26, 40.5, 29, 41, 26, 38, 28, 36.5, 36, 36.5, 35, 33, 34, 31.5, 35, 28, 39, 22, 43, 13, 45, 12.8, 52, 16, 56, 18, 59, 22, 56.5, 24.5, 56, 26, 52, 24, 51, 26, 48, 29.5, 50, 30, 56, 27, 57, 25.5, 62, 25, 67, 24.5, 70, 21, 73, 17, 77, 8, 80, 10, 80, 15, 87, 21, 91, 22.5, 94, 18, 98, 16, 98, 9, 100.5, 7, 103, 1.5, 104, 1.3, 103, 5, 100.5, 13, 105, 9, 107, 11, 109, 12, 106, 20, 108, 21.5, 112, 21.7, 117, 23, 121, 28, 122, 31, 120, 35, 122, 37, 119, 39, 121, 41, 125, 40, 126, 37, 129, 35, 129, 38, 130, 42.5, 135, 43.5, 140, 48, 141, 53, 137, 54, 141, 59, 149, 59.5, 155, 59, 156, 52, 162, 56, 163, 60, 170, 60, 180, 65, 180, 69, 170, 70, 160, 70, 150, 71.5, 140, 72.5, 130, 71, 113, 73.5, 105, 77.5, 98, 76, 88, 75.5, 80, 73, 72, 72.5, 68, 68.5, 60, 69, 55, 68, 44, 68, 41, 67, 33, 69, 25, 71, 16, 69, 10, 63.5, 5, 62, 5, 58.5, 8, 58, 11, 58.5, 13, 55.5, 17, 57, 19, 63, 22, 65.5, 25, 65, 21, 61, 23, 60, 30, 60, 23, 59.4, 24, 57.5, 21, 57, 21, 55, 14, 54, 10, 54.5, 8.5, 57, 8, 55, 8.5, 53.5, 5, 53, 3, 51, -1.5, 49.5, -4.5, 48.5, -1.5, 46, -1.8, 43.4, -8, 43.7],
  [-5.5, 50, 1.5, 51, 1.8, 52.8, 0, 53.5, -2, 55.5, -1.8, 57.5, -4, 58.6, -5, 58.6, -6.2, 56.5, -5, 55, -3, 54.5, -4.7, 52.8, -5.2, 51.7, -3, 51.4, -5.7, 50], // Grã-Bretanha
  [-6, 52, -6, 54.5, -8, 55.2, -10, 54, -10, 51.6], // Irlanda
  [130, 31, 132, 34, 135, 34.5, 140, 35, 141, 38, 141.5, 41.5, 140, 40, 139, 38, 136, 37, 133, 35.5, 130, 34], // Japão
  [140, 42, 145.5, 43.3, 142, 45.5], // Hokkaido
  [120, 18.5, 122.5, 18.5, 124, 13, 126, 9, 126, 6, 122, 7, 121, 12, 120, 15], // Filipinas
  [95, 5.5, 98, 4, 104, 0, 106, -6, 102, -4, 97, 1], // Sumatra
  [109, 1.5, 111, -3, 116, -4, 118, 1, 117, 7, 115.5, 5, 110, 1.5], // Bornéu
  [105, -6, 114.5, -7.5, 114.5, -8.7, 106, -7.5], // Java
  [119, -5.5, 120.5, 1, 125, 1.5, 122, -1, 123, -5], // Celebes
  [131, -1, 138, -1.5, 141, -2.6, 147, -6, 150.5, -10.6, 147, -10, 143, -9, 138, -8.3, 137, -5, 133, -4], // Nova Guiné
  [80, 6, 79.8, 9.8, 82, 7.5, 81.5, 6], // Sri Lanka
  [44, -25, 43.3, -22, 44.4, -16, 47, -15.5, 49.3, -12, 50.5, -15.5, 47, -25], // Madagascar
  // África
  [-17, 21, -17, 15, -16.5, 12, -13, 8, -8, 4.5, -2, 5, 4, 6.3, 9, 4, 9.5, 1, 12, -5, 13, -11, 11.8, -17, 15, -27, 18, -33, 20, -34.8, 25, -34, 30, -31, 33, -26, 35.5, -24, 35, -20, 40.5, -15, 40, -10, 39, -5, 42, -0.5, 46, 2, 51, 11.8, 44, 10.5, 43, 12, 39, 16, 37, 21, 35.5, 23.5, 33, 28, 32.3, 31.3, 29, 31, 25, 31.7, 20, 30.5, 19, 32, 15, 32.5, 10, 34, 11, 37, 8, 37, 1, 36.5, -2, 35, -6, 35.8, -10, 30, -13, 27.5],
  // Austrália e Nova Zelândia
  [114, -22, 114, -26, 115, -34, 118, -35, 124, -34, 129, -31.5, 134, -32.5, 137, -35.5, 138, -34, 140, -38, 146, -39, 150, -37.5, 153, -31, 153, -25, 150, -22, 146, -19, 145.5, -14.5, 142.5, -10.7, 141.5, -13, 141, -17, 139.5, -17.5, 136, -15, 137, -12, 132, -11.5, 129.5, -15, 126, -14, 122, -17.5, 121, -19.5],
  [145, -40.5, 148.3, -41, 147.5, -43.5, 145.5, -43], // Tasmânia
  [172.6, -34.4, 175, -37, 178.5, -37.7, 177, -39, 175, -41.5, 174, -39.5],
  [172.7, -40.5, 174.3, -41.7, 171, -44.5, 169, -46.6, 166.5, -46, 168, -44, 171, -42],
];
const LAKES = [
  [-95, 60, -94, 58, -88, 56, -82, 55, -79, 52, -79, 57, -77, 61, -80, 63, -87, 64, -90, 63, -94, 61], // Baía de Hudson
  [28, 41.5, 28, 44, 30, 46, 33, 44.5, 36, 45.3, 39, 47, 41.5, 42, 36, 41.5], // Mar Negro
  [47, 44, 49, 46.5, 53, 47, 54, 42, 54, 37.5, 50, 37, 49, 40], // Cáspio
];
const LON0 = -170, LON1 = 190, LAT0 = 82, LAT1 = -56;

function inside(poly, x, y) {
  let hit = false;
  for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
    const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const sm = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c2 = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * sm(xf) + (c2 - a) * sm(yf) + (a - b - c2 + d) * sm(xf) * sm(yf);
}

const mapCache = new Map();
/** Mapa-múndi em blocos de `cell` px, com litoral brilhante como na referência. */
function worldMap(w, h, cell) {
  const key = `${w}|${h}|${cell}`;
  if (mapCache.has(key)) return mapCache.get(key);
  const cols = Math.floor(w / cell), rows = Math.floor(h / cell);
  const land = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const lon = LON0 + ((q + 0.5) / cols) * (LON1 - LON0);
    const lat = LAT0 + ((r + 0.5) / rows) * (LAT1 - LAT0);
    const ll = lon > 180 ? lon - 360 : lon;
    if (LAND.some((p) => inside(p, ll, lat)) && !LAKES.some((p) => inside(p, ll, lat))) land[r * cols + q] = 1;
  }
  const at = (q, r) => (q < 0 || r < 0 || q >= cols || r >= rows ? 0 : land[r * cols + q]);
  const near = (q, r, d) => { for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) if (at(q + dx, r + dy)) return true; return false; };
  const cv = makeCanvas(cols * cell, rows * cell);
  const g = cv.getContext('2d');
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    let col = null;
    if (at(q, r)) {
      const edge = !at(q - 1, r) || !at(q + 1, r) || !at(q, r - 1) || !at(q, r + 1);
      const n = noise(q / 6, r / 6) * 0.7 + noise(q / 2.5, r / 2.5) * 0.3;
      const lat = LAT0 + (r / rows) * (LAT1 - LAT0);
      col = edge ? '#e6f458' : n > 0.66 ? '#9a8a34' : n > 0.56 ? '#a8b82c' : n < 0.22 ? '#7aa83a' : '#c8e030';
      if (Math.abs(lat) > 62 && !edge) col = n > 0.5 ? '#d8e8a0' : '#c8dc70';
    } else if (near(q, r, 1)) col = '#58d0ff';
    else if (near(q, r, 2)) col = '#2a78e8';
    if (col) { g.fillStyle = col; g.fillRect(q * cell, r * cell, cell, cell); }
  }
  const out = { cv, cols, rows, cell };
  mapCache.set(key, out);
  return out;
}

/**
 * Desenha o mapa em (x, y) com largura `w`. Retorna `project(lon, lat)` para
 * posicionar marcadores na mesma escala.
 */
export function drawWorldMap(c, x, y, w, cell = 8) {
  const h = Math.round(w * (LAT0 - LAT1) / (LON1 - LON0));
  const m = worldMap(w, h, cell);
  blit(c, m.cv, x, y);
  const mw = m.cols * cell, mh = m.rows * cell;
  return {
    h: mh,
    project: (lon, lat) => [x + ((lon - LON0) / (LON1 - LON0)) * mw, y + ((LAT0 - lat) / (LAT0 - LAT1)) * mh],
  };
}

/** Bandeira do Pará em pixels (vermelho, faixa branca diagonal, estrela azul). */
export function paraFlag(c, x, y, u = 4) {
  const W = 18, H = 12;
  c.fillStyle = '#ffffff'; c.fillRect(x - u, y - u, (W + 2) * u, (H + 2) * u);
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
    const d = Math.abs((H - 1 - r) - (q * (H - 1)) / (W - 1));
    c.fillStyle = d < 2.4 ? '#ffffff' : '#e0221c';
    c.fillRect(x + q * u, y + r * u, u, u);
  }
  c.fillStyle = '#1c3cd0';
  const cx = x + 9 * u, cy = y + 6 * u;
  c.fillRect(cx - u, cy - u * 2, u * 2, u * 4); c.fillRect(cx - u * 2, cy - u, u * 4, u * 2);
}

/** Alfinete vermelho de mapa. */
export function mapPin(c, x, y, color = '#e0221c', u = 4, glow = 0) {
  if (glow) { c.fillStyle = `rgba(255,240,120,${0.25 + glow * 0.35})`; c.fillRect(x - u * 4, y - u * 9, u * 8, u * 8); }
  c.fillStyle = '#d8d8e0'; c.fillRect(x - u / 2, y - u * 4, u, u * 4);
  c.fillStyle = '#000'; c.fillRect(x - u * 3, y - u * 9, u * 6, u * 6);
  c.fillStyle = color; c.fillRect(x - u * 2, y - u * 8, u * 4, u * 4);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(x - u * 1.5, y - u * 7.5, u, u);
}

// ─────────────────────────── logo dourado ───────────────────────────
let logoCache = null;
/** O logo do jogo em dourado e pixelado, como na tela de título da referência. */
export function goldLogo() {
  if (logoCache) return logoCache;
  const img = comicImageEl('logo');
  if (!img) return null;
  const w = 330, h = Math.round((w * img.height) / img.width);
  const cv = makeCanvas(w, h);
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(0, 0, 0, h);
  [[0, '#fff8c8'], [0.22, '#ffe070'], [0.45, '#ffb020'], [0.5, '#fff0a0'], [0.72, '#ffc030'], [1, '#ff6418']].forEach(([s, col]) => gr.addColorStop(s, col));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = 'source-over';
  try {
    const d = g.getImageData(0, 0, w, h);
    for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 100 ? 255 : 0;
    g.putImageData(d, 0, 0);
  } catch { /* sem leitura de pixels: fica com a borda suave */ }
  logoCache = cv;
  return cv;
}

let swooshCache = null;
/** Rastro de fogo atrás do "THE GAME". */
export function fireSwoosh() {
  if (swooshCache) return swooshCache;
  const cv = makeCanvas(300, 60);
  const g = cv.getContext('2d');
  const arc = (y0, y1, wdt, col) => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); g.moveTo(10, y0); g.quadraticCurveTo(150, y1, 292, y0 - 14); g.stroke(); };
  arc(40, 64, 9, '#e04010'); arc(38, 60, 6, '#ff9020'); arc(36, 56, 3, '#ffe060');
  arc(22, 0, 5, '#e04010'); arc(21, 2, 3, '#ffb030');
  try {
    const d = g.getImageData(0, 0, 300, 60);
    for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 90 ? 255 : 0;
    g.putImageData(d, 0, 0);
  } catch { /* idem */ }
  swooshCache = cv;
  return cv;
}

let bigSN = null;
/** "S" e "N" gigantes em retícula vermelho-escura no fundo do título. */
export function backdropSN() {
  if (bigSN) return bigSN;
  const u = 62, cv = makeCanvas(1920, 640);
  const g = cv.getContext('2d');
  const draw = (ch, ox) => {
    for (const [px, py] of glyph(ch).px) {
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) {
        const rad = 6.5 + ((dx + dy) % 2) * 1.5;
        g.fillStyle = (dx + dy) % 3 ? '#4a0c12' : '#6a1018';
        g.beginPath(); g.arc(ox + px * u + dx * (u / 4) + u / 8, 40 + py * (u + 18) + dy * ((u + 18) / 4) + u / 8, rad, 0, Math.PI * 2); g.fill();
      }
    }
  };
  draw('S', 90); draw('N', 1520);
  bigSN = cv;
  return cv;
}
