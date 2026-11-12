import { animFor, CELL, FOOT } from './anim.js';

/**
 * Leitor de sprites. Cada personagem pode registrar tiras de imagem com os
 * nomes do contrato de animação (anim.js). Para o que não tiver tira, o jogo
 * desenha o manequim: dá para aplicar a arte aos poucos, tira por tira.
 */
const REG = {}; // id do personagem → { nome da tira → { cv, n, size } }

/** Remove o fundo liso de uma tira: apaga, a partir das bordas, a cor do canto. */
function keyOut(img) {
  const cv = document.createElement('canvas');
  cv.width = img.naturalWidth || img.width;
  cv.height = img.naturalHeight || img.height;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(img, 0, 0);
  const W = cv.width;
  const H = cv.height;
  const d = c.getImageData(0, 0, W, H);
  const p = d.data;
  const k = (H - 3) * W * 4 + 3 * 4; // canto de baixo à esquerda
  if (p[k + 3] < 250) return cv; // já é transparente
  const [r0, g0, b0] = [p[k], p[k + 1], p[k + 2]];
  const TOL = 46;
  const near = (i) => Math.abs(p[i] - r0) + Math.abs(p[i + 1] - g0) + Math.abs(p[i + 2] - b0) < TOL;
  const seen = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    const n = y * W + x;
    if (x < 0 || y < 0 || x >= W || y >= H || seen[n]) return;
    seen[n] = 1;
    if (near(n * 4)) stack.push(n);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  const cell = H;
  for (let x = cell; x < W; x += cell) for (let y = 0; y < H; y++) { push(x - 1, y); push(x, y); }
  while (stack.length) {
    const n = stack.pop();
    p[n * 4 + 3] = 0;
    const x = n % W;
    const y = (n / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  c.putImageData(d, 0, 0);
  return cv;
}

/**
 * Registra as tiras de um personagem.
 * @param {string} id id do personagem
 * @param {Object<string,string>} sheets nome da tira → URL (ou data URI) da imagem
 * @returns {Promise<void>}
 */
export function registerSprites(id, sheets) {
  REG[id] ??= {};
  return Promise.all(Object.entries(sheets).map(([name, url]) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const cv = keyOut(img);
      REG[id][name] = { cv, n: Math.max(1, Math.round(cv.width / cv.height)), size: cv.height };
      res();
    };
    img.onerror = () => res();
    img.src = url;
  })));
}

export const hasSprites = (id) => !!REG[id] && Object.keys(REG[id]).length > 0;
export const spriteNames = (id) => Object.keys(REG[id] || {});

/**
 * Desenha o lutador com sprite, se houver tira para a animação atual.
 * O contexto deve estar na origem do lutador (pés), já espelhado pelo lado.
 * @returns {boolean} true se desenhou
 */
export function drawSprite(c, f, frame) {
  const set = REG[f.ch.id];
  if (!set) return false;
  const a = animFor(f, frame);
  const s = set[a.name];
  if (!s) return false;
  const i = Math.min(a.index, s.n - 1);
  const scale = (CELL / s.size) * (f.ch.spriteScale || 1);
  const size = s.size * scale;
  c.drawImage(s.cv, i * s.size, 0, s.size, s.size, -size * FOOT.x, -size * FOOT.y, size, size);
  return true;
}
