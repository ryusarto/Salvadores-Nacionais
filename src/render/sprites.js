import { animFor, CELL, FOOT } from './anim.js';
import { spriteProgress } from './sprite-timing.js';

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
export const hasSpriteStrip = (id, name) => !!REG[id]?.[name];

/** Draw an isolated effect cell. All coordinates are visual only. */
export function drawSpriteEffect(c, id, name, progress, x, y, width = 240, height = width) {
  const s = REG[id]?.[name];
  if (!s) return false;
  const i = Math.max(0, Math.min(s.n - 1, Math.floor(progress * s.n)));
  c.drawImage(s.cv, i * s.size, 0, s.size, s.size, x - width / 2, y - height / 2, width, height);
  return true;
}

function attackEffects(c, f) {
  if (f.ch.spriteProfile !== 'ten-frame' || f.state !== 'attack') return;
  const m = f.move;
  if (m.weapon === 'ak') {
    const at = m.spawn.map(s => s.at).filter(at => at <= f.sf).at(-1);
    if (at != null && f.sf - at < 6) drawSpriteEffect(c, f.ch.id, 'fx-ak-disparo', (f.sf - at) / 6, 195, -325, 180);
  }
  for (const h of m.hits) if (f.sf >= h.from && f.sf <= h.to + 3) {
    const stomp = m.fx === 'stomp';
    drawSpriteEffect(c, f.ch.id, stomp ? 'fx-pisao' : 'fx-chute', (f.sf - h.from) / Math.max(1, h.to - h.from + 4), h.box.x + h.box.w / 2, stomp ? -35 : -(h.box.y + h.box.h / 2), stomp ? 350 : 280);
    break;
  }
}

/**
 * Substitutos para as animações que a prancheta ainda não tem: usa uma tira
 * parecida do mesmo personagem, com um ajuste de pose (inclinar, deitar,
 * girar). Assim o personagem nunca vira manequim no meio da luta.
 */
const FALLBACK = {
  'defesa-em-pe': ['parado', 0.1, 'guard'], 'defesa-agachado': ['agachar', 0.6, 'guard'], 'defesa-no-ar': ['pulo', 0.3, 'guard'],
  'dano-alto': ['parado', 0.1, 'hurt'], 'dano-baixo': ['agachar', 0.3, 'hurt'], 'dano-no-ar': ['pulo', 0.6, 'spin'],
  caido: ['parado', 0.1, 'lie'], levantar: ['agachar', 0.5, null], tonto: ['parado', 0.1, 'dizzy'],
  vitoria: ['parado', 0.5, null], recuo: ['andar', null, 'back'],
};

function pickStrip(set, a, f) {
  // a ficha do personagem pode dizer qual tira do kit cada animação usa
  const alias = f.ch.spriteAlias?.[a.name];
  if (alias && set[alias]) return { s: set[alias], p: a.p, fx: null };
  if (set[a.name]) return { s: set[a.name], p: a.p, fx: null };
  // Elenco ainda sem caminhada reversa: reproduzir o ciclo comum ao contrário.
  if (a.name === 'andar-tras' && set.andar) {
    return { s: set.andar, p: Math.max(0, Math.min(0.999, 1 - a.p)), fx: null };
  }
  const fb = FALLBACK[a.name];
  if (fb && set[fb[0]]) return { s: set[fb[0]], p: fb[1] ?? a.p, fx: fb[2] };
  if (a.name.startsWith('golpe-') && f.move) {
    const m = f.move;
    const key = m.air ? 'pulo' : m.type === 'super' ? 'golpe-SA3' : m.btn === 'H' || m.type === 'special' ? 'golpe-5H' : 'golpe-5L';
    const alt = set[key] || set['golpe-5H'] || set['golpe-5L'];
    if (alt) return { s: alt, p: m.air ? 0.4 : a.p, fx: null };
  }
  if (a.name.startsWith('golpe-throw') && set['golpe-5L']) return { s: set['golpe-5L'], p: 0.5, fx: null };
  return set.parado ? { s: set.parado, p: 0, fx: null } : null;
}

/**
 * Desenha o lutador com sprite, se o personagem tiver tiras registradas.
 * O contexto deve estar na origem do lutador (pés), já espelhado pelo lado.
 * @returns {boolean} true se desenhou
 */
export function drawSprite(c, f, frame) {
  const set = REG[f.ch.id];
  if (!set) return false;
  const a = animFor(f, frame);
  a.p = spriteProgress(f, a);
  const pick = pickStrip(set, a, f);
  if (!pick) return false;
  const { s, p, fx } = pick;
  const i = Math.min(s.n - 1, Math.max(0, Math.floor(p * s.n)));
  const size = CELL * (f.ch.spriteScale || 1);
  c.save();
  if (fx === 'hurt' || fx === 'dizzy') {
    c.translate(-14, 0);
    c.rotate(-0.16 + (fx === 'dizzy' ? Math.sin(frame * 0.2) * 0.06 : 0));
  } else if (fx === 'guard') {
    c.translate(-8, 0);
    c.rotate(-0.05);
  } else if (fx === 'lie') {
    // deitado: o corpo fica centrado sobre o lutador, com a cabeça para trás
    c.translate(230, -70);
    c.rotate(-Math.PI / 2);
  } else if (fx === 'spin') {
    c.translate(0, -220);
    c.rotate(-0.9 - Math.max(-0.6, Math.min(0.6, -f.vy * 0.03)));
    c.translate(0, 220);
  }
  c.drawImage(s.cv, i * s.size, 0, s.size, s.size, -size * FOOT.x, -size * FOOT.y, size, size);
  attackEffects(c, f);
  if (fx === 'guard') {
    // escudo de defesa desenhado pelo jogo
    c.globalAlpha = 0.5;
    c.strokeStyle = '#7fd4ff';
    c.lineWidth = 10;
    c.beginPath();
    c.arc(60, -260, 170, -1.1, 1.1);
    c.stroke();
    c.globalAlpha = 1;
  }
  c.restore();
  return true;
}
