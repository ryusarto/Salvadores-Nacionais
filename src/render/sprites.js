import { ALTERNATE_PALETTES } from '../data/alternate-palettes.js';
import { animFor, CELL, FOOT } from './anim.js';
import { spriteProgress } from './sprite-timing.js';
import { paiAnimation } from './pai-fujao-timing.js';
import { applyFighterMaterial, materialStrength, noteMaterialOffThread } from './fighter-material.js';
import { keyOutPixels, recolorPixels } from './sprite-pixels.js';
import { decodeStripOffThread, recolorStripOffThread, spriteWorkerAvailable } from './sprite-worker.js';

/**
 * Leitor de sprites. Cada personagem pode registrar tiras de imagem com os
 * nomes do contrato de animação (anim.js). Para o que não tiver tira, o jogo
 * desenha o manequim: dá para aplicar a arte aos poucos, tira por tira.
 */
const REG = {}; // id do personagem → { nome da tira → { cv, n, size } }
const LIMITS = {};
let access = 0;

function trimDecoded(id, keep) {
  const set = REG[id];
  const loaded = Object.values(set).filter(s => s.lazy && s.cv);
  const limit = LIMITS[id] || Infinity;
  const oldest = loaded.filter(s => s.pinIdle === false || (s !== keep && s.name !== 'parado')).sort((a, b) => a.used - b.used);
  while (loaded.length > limit && oldest.length) {
    releaseDecoded(oldest.shift());
    loaded.pop();
  }
}

// ImageBitmaps vindos do worker liberam a memória na hora, sem esperar o coletor.
const closeBitmap = cv => { if (typeof ImageBitmap !== 'undefined' && cv instanceof ImageBitmap) cv.close(); };
function releaseDecoded(s) {
  closeBitmap(s.cv);
  if (s.cvAlt !== s.cv) closeBitmap(s.cvAlt);
  s.cv = null;
  s.cvAlt = null;
  s.cvAltOf = null;
  s.framePalettes = null;
}

function setDecoded(s, cv, w, h) {
  s.cv = cv;
  s.n = Math.max(1, Math.round(w / h));
  s.size = h;
  trimDecoded(s.id, s);
}

function loadStrip(s) {
  if (s.inactive || s.cv || s.failed) return Promise.resolve();
  if (s.loading) return s.loading;
  s.used = ++access;
  s.loading = spriteWorkerAvailable() ? loadStripOffThread(s) : loadStripOnMainThread(s);
  return s.loading;
}

// Caminho normal: decodificação, recorte e material no worker; a luta segue desenhando.
function loadStripOffThread(s) {
  const strength = s.material === false ? 0 : materialStrength(s.id);
  return decodeStripOffThread(s.url, { strength, keyOut: !s.trueAlpha }).then(r => {
    if (s.inactive) { closeBitmap(r.bitmap); return; }
    if (r.material) noteMaterialOffThread();
    setDecoded(s, r.bitmap, r.w, r.h);
  }, () => loadStripOnMainThread(s)).finally(() => { s.loading = null; });
}

function loadStripOnMainThread(s) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        if (s.inactive) return;
        const pixels = s.trueAlpha ? img : keyOut(img);
        setDecoded(s, s.material === false ? pixels : applyFighterMaterial(pixels,s.id), img.naturalWidth, img.naturalHeight);
      } catch {
        s.cv = null;
        s.failed = true;
      } finally {
        s.loading = null;
        resolve();
      }
    };
    img.onerror = () => { s.failed = true; s.loading = null; resolve(); };
    img.src = s.url;
  });
}

function readyStrip(set, name) {
  const s = set[name];
  if (!s) return null;
  s.used = ++access;
  if (!s.cv) { loadStrip(s); return null; }
  return s;
}

// Compressed cache warming is bounded and can be awaited by dense animation packs.
const cacheQueue = [];
let cacheWorkers = 0;
function cacheFiles(urls, id) {
  if (typeof fetch !== 'function') return Promise.resolve();
  const jobs = urls.map(url => new Promise(resolve => cacheQueue.push({ url, id, resolve })));
  while (cacheWorkers < 3 && cacheQueue.length) {
    cacheWorkers++;
    void (async () => {
      try {
        while (cacheQueue.length) {
          const job = cacheQueue.shift();
          try {
            const strips = Object.values(REG[job.id] || {});
            if (strips.length && strips.every(s => s.inactive)) {
              for (const s of strips) if (s.url === job.url) s.prefetched = false;
              continue;
            }
            const response = await fetch(job.url, { cache: 'force-cache' });
            if (response.ok) await response.arrayBuffer();
          } catch { /* The image loader can retry independently. */ }
          finally { job.resolve(); }
        }
      } finally { cacheWorkers--; }
    })();
  }
  return Promise.all(jobs).then(() => {});
}

function loadPoster(s) {
  if (s.inactive || !s.posterUrl || s.posterCv || s.posterFailed) return Promise.resolve();
  if (s.posterLoading) return s.posterLoading;
  s.posterLoading = new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      try {
        if (s.inactive) return;
        s.posterCv = s.material === false ? img : applyFighterMaterial(img,s.id);
        s.posterState = null;
      } catch { s.posterFailed = true; }
      finally { s.posterLoading = null; resolve(); }
    };
    img.onerror = () => { s.posterFailed = true; s.posterLoading = null; resolve(); };
    img.src = s.posterUrl;
  });
  return s.posterLoading;
}

function posterSource(s, alt) {
  if (!alt) return s.posterCv;
  s.posterState ??= { cv: s.posterCv, id: s.id, size: s.size };
  s.posterState.used = ++access;
  const output = altCanvas(s.posterState);
  const older = Object.values(REG[s.id]).filter(p => p !== s && p.posterState?.cvAlt)
    .sort((a,b) => a.posterState.used - b.posterState.used);
  while (older.length > 3) older.shift().posterState = null;
  return output;
}

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
  if (keyOutPixels(d.data, W, H)) c.putImageData(d, 0, 0);
  return cv;
}

const DEFAULT_ALT = { rotation: 150, neutralHue: 205, saturation: .42 };
const paletteFor = (id = '') => ALTERNATE_PALETTES[id] || ALTERNATE_PALETTES[id.replace(/-esquerda$/, '')] || DEFAULT_ALT;

/**
 * Paleta alternativa para a luta espelhada (mesmo personagem dos dois lados).
 * Pele e tons bege ficam; cores saturadas mudam de matiz; branco e cinza
 * ganham um tom azulado; contorno preto não muda. Feita uma vez por tira.
 */
export function recolorAlt(px, id = '') {
  return recolorPixels(px, paletteFor(id));
}

/**
 * Tira com a paleta do espelho. Bitmaps do worker são recoloridos no worker:
 * até ficar pronta, devolve null e quem desenha repete o último quadro.
 */
function altSource(s) {
  if (s.cvAlt && s.cvAltOf === s.cv) return s.cvAlt;
  const offThread = !s.altOnMainThread && typeof ImageBitmap !== 'undefined' && s.cv instanceof ImageBitmap && spriteWorkerAvailable();
  if (!offThread) return altCanvas(s);
  if (s.altFor !== s.cv) {
    const of = s.altFor = s.cv;
    recolorStripOffThread(of, paletteFor(s.id), Math.round(s.size / 36)).then(r => {
      if (s.cv === of) { if (s.cvAlt !== s.cv) closeBitmap(s.cvAlt); s.cvAlt = r.bitmap; s.cvAltOf = of; }
      else closeBitmap(r.bitmap);
    }, () => { s.altOnMainThread = true; }).finally(() => { if (s.altFor === of) s.altFor = null; });
  }
  return null;
}

function altCanvas(s) {
  if (s.cvAlt && s.cvAltOf === s.cv) return s.cvAlt;
  if (typeof document === 'undefined') return s.cv;
  const cv = document.createElement('canvas');
  cv.width = s.cv.width;
  cv.height = s.cv.height;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(s.cv, 0, 0);
  const d = c.getImageData(0, 0, cv.width, cv.height);
  recolorAlt(d.data, s.id);
  c.putImageData(d, 0, 0);
  // Contorno luminoso: distingue o lado 2 mesmo em personagens de roupa bege ou marrom.
  const out = document.createElement('canvas');
  out.width = cv.width;
  out.height = cv.height;
  const o = out.getContext('2d');
  o.shadowColor = 'rgba(70, 200, 255, 0.95)';
  o.shadowBlur = Math.round(s.size / 36);
  o.drawImage(cv, 0, 0);
  o.drawImage(cv, 0, 0);
  s.cvAlt = out;
  s.cvAltOf = s.cv;
  return out;
}

// Dense strips stay as compressed images. Recolor only a visible cell, avoiding
// a 9216-pixel canvas and a second full atlas for a mirrored costume.
function denseAltFrame(s, index) {
  s.framePalettes ??= new Map();
  const cached = s.framePalettes.get(index);
  if (cached) { cached.used = ++access; return cached.cv; }
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s.size;
  cv.getContext('2d').drawImage(s.cv, index * s.size, 0, s.size, s.size, 0, 0, s.size, s.size);
  const colored = altCanvas({ cv, id: s.id, size: s.size });
  s.framePalettes.set(index, { cv: colored, used: ++access });
  while (s.framePalettes.size > 4) {
    const oldest = [...s.framePalettes].sort((a,b) => a[1].used - b[1].used)[0][0];
    s.framePalettes.delete(oldest);
  }
  return colored;
}

/**
 * Registra as tiras de um personagem.
 * @param {string} id id do personagem
 * @param {Object<string,string>} sheets nome da tira → URL (ou data URI) da imagem
 * @returns {Promise<void>}
 */
export function registerSprites(id, sheets, options = {}) {
  REG[id] ??= {};
  LIMITS[id] = options.maxDecoded || Infinity;
  const preload = new Set(options.preload || ['parado']);
  for (const [name, url] of Object.entries(sheets)) {
    REG[id][name] = { id, name, url, n: options.frames || 1, size: options.cellSize || CELL, cv: null, lazy: !!options.lazy, trueAlpha: !!options.trueAlpha, used: 0, inactive: false, pinIdle: options.pinIdle !== false, material: options.material !== false, warmAll: !!options.warmAll, posterUrl: options.posters?.[name] };
  }
  if (options.lazy && options.prefetch !== false) {
    for (const s of Object.values(REG[id])) s.prefetched = true;
    void cacheFiles(Object.values(sheets), id);
  }
  return Promise.all(Object.values(REG[id]).filter(s => !options.lazy || preload.has(s.name)).map(loadStrip));
}

/**
 * Prepara só os pacotes que a luta vai usar: decodifica as tiras básicas e
 * baixa o resto em segundo plano. Pacotes não registrados são ignorados.
 * @param {string[]} ids pacotes de sprite (personagem, efeitos, lado esquerdo)
 * @param {string[]} names tiras que precisam estar prontas antes da luta
 * @param {{activate?:boolean}} options false for supplemental preloads in the current selection
 * @returns {Promise<void>}
 */
export function prepareSprites(ids, names = ['parado', 'andar', 'golpe-5L', 'defesa-em-pe', 'dano-alto'], { activate = true } = {}) {
  const jobs = [];
  if (activate) {
    const active = new Set(ids);
    for (const [id,set] of Object.entries(REG)) for (const s of Object.values(set)) {
      s.inactive = !active.has(id);
      if (s.inactive) {
        releaseDecoded(s);
        s.posterCv = s.posterState = null;
      }
    }
  }
  // Baixa primeiro as tiras que toda luta usa, dos dois lados, e só depois o resto.
  const later = [];
  for (const id of ids) {
    const set = REG[id];
    if (!set) continue;
    const pending = Object.values(set).filter(s => s.lazy && !s.prefetched).sort((a, b) => warmRank(a.name) - warmRank(b.name));
    const warmAll = Object.values(set).some(s => s.warmAll);
    const first = warmAll ? pending : pending.filter(s => warmRank(s.name) < WARM_FIRST.length);
    const rest = warmAll ? [] : pending.filter(s => !first.includes(s));
    for (const s of first) s.prefetched = true;
    for (const s of Object.values(set)) {
      s.posterFailed = false;
      if (s.posterUrl) jobs.push(loadPoster(s));
    }
    const warming = cacheFiles(first.map(s => s.url), id);
    if (warmAll) jobs.push(warming);
    if (rest.length && !saveData()) later.push([id, rest]);
    // Uma nova preparação permite recuperar falhas temporárias, sem repetir a cada render.
    for (const s of Object.values(set)) if (s.failed) s.failed = false;
    for (const name of names) if (set[name]) jobs.push(loadStrip(set[name]));
  }
  for (const [id, rest] of later) {
    for (const s of rest) s.prefetched = true;
    void cacheFiles(rest.map(s => s.url), id);
  }
  return Promise.all(jobs).then(() => {});
}

// Ordem de aquecimento do cache: movimentação, defesa, dano e golpes normais.
const WARM_FIRST = ['parado', 'andar', 'golpe-5L', 'defesa-em-pe', 'dano-alto', 'andar-tras', 'pulo', 'agachar',
  'golpe-5M', 'golpe-5H', 'golpe-2L', 'golpe-2M', 'golpe-2H', 'golpe-jL', 'golpe-jM', 'golpe-jH',
  'defesa-agachado', 'dano-baixo', 'dano-no-ar', 'caido', 'levantar', 'recuo'];
const warmRank = name => { const i = WARM_FIRST.indexOf(name); return i < 0 ? WARM_FIRST.length : i; };
// Modo de economia de dados: o restante é baixado só quando o golpe aparece.
const saveData = () => !!globalThis.navigator?.connection?.saveData;

/** Pacotes de sprite de um personagem: arte, efeitos e arte própria de cada lado. */
export function spritePacksFor(ch) {
  const bases = [ch.id, ...Object.values(ch.spriteFacingPacks || {})];
  return [...new Set(bases.flatMap(id => [id, id + '-fx', 'fx-' + id]))];
}

export const hasSprites = (id) => !!REG[id] && Object.keys(REG[id]).length > 0;
export const spriteNames = (id) => Object.keys(REG[id] || {});
export const hasSpriteStrip = (id, name) => !!REG[id] && !!readyStrip(REG[id], name);
export const decodedSpriteNames = id => Object.values(REG[id] || {}).filter(s => s.cv).map(s => s.name);

/** Draw an isolated effect cell. All coordinates are visual only. */
export function drawSpriteEffect(c, id, name, progress, x, y, width = 240, height = width) {
  const s = REG[id] && readyStrip(REG[id], name);
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
    if (at != null && f.sf - at < 6) drawSpriteEffect(c, f.ch.id, 'fx-ak-disparo', (f.sf - at) / 6, 205, -395, 180);
  }
  for (const h of m.hits) if (f.sf >= h.from && f.sf <= h.to + 3) {
    const stomp = m.fx === 'stomp';
    drawSpriteEffect(c, f.ch.id, stomp ? 'fx-pisao' : 'fx-chute', (f.sf - h.from) / Math.max(1, h.to - h.from + 4), h.box.x + h.box.w / 2, stomp ? -35 : -(h.box.y + h.box.h / 2), stomp ? 350 : 280);
    break;
  }
}

/** Camada independente (ajudante/efeito), com recorte único por tira e escala proporcional. */
export function drawSpriteLayer(c, id, name, index, { x, y, w, h, face = 1, anchor = 'center', crop = [0, 0, CELL, CELL] }) {
  const s = REG[id] && readyStrip(REG[id], name);
  if (!s) return false;
  const i = Math.max(0, Math.min(s.n - 1, Math.floor(index)));
  const [cx, cy, cw, ch] = crop;
  const scale = Math.min(w / cw, h / ch);
  const dw = cw * scale, dh = ch * scale, ratio = s.size / CELL;
  const dx = anchor === 'left' ? 0 : -dw / 2;
  const dy = anchor === 'bottom' ? -dh : -dh / 2;
  c.save();
  c.translate(x, y);
  c.scale(face, 1);
  c.drawImage(s.cv, i * s.size + cx * ratio, cy * ratio, cw * ratio, ch * ratio, dx, dy, dw, dh);
  c.restore();
  return true;
}

/** Draw a separate effect layer; coordinates are local to the caller. */
export function drawEffect(c, id, name, p, x, y, w, h = w) {
  const s = REG['fx-' + id] && readyStrip(REG['fx-' + id], name);
  if (!s) return false;
  const i = Math.min(s.n - 1, Math.max(0, Math.floor(p * s.n)));
  c.drawImage(s.cv, i * s.size, 0, s.size, s.size, x, y, w, h);
  return true;
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
  const aliased = alias && readyStrip(set, alias);
  if (aliased) return { s: aliased, p: a.p, fx: null };
  const exact = readyStrip(set, a.name);
  if (exact) return { s: exact, p: a.p, fx: null };
  const base = a.name.replace(/-turbo$/, '');
  const baseStrip = base !== a.name && readyStrip(set, base);
  if (baseStrip) return { s: baseStrip, p: a.p, fx: null };
  const requested = set[f.ch.spriteAlias?.[a.name]] || set[a.name] || (base !== a.name && set[base]);
  if (requested?.posterCv) return { s: requested, p: 0, i: 0, fx: null, poster: true };
  if (set[a.name]?.lazy) {
    const idle = readyStrip(set, 'parado');
    return idle ? { s: idle, p: 0, fx: null, waiting: true } : { waiting: true };
  }
  // Elenco ainda sem caminhada reversa: reproduzir o ciclo comum ao contrário.
  const walking = a.name === 'andar-tras' && readyStrip(set, 'andar');
  if (walking) {
    return { s: walking, p: Math.max(0, Math.min(0.999, 1 - a.p)), fx: null };
  }
  const fb = FALLBACK[a.name];
  const fallback = fb && readyStrip(set, fb[0]);
  if (fallback) return { s: fallback, p: fb[1] ?? a.p, fx: fb[2] };
  if (a.name.startsWith('golpe-') && f.move) {
    const m = f.move;
    const key = m.air ? 'pulo' : m.type === 'super' ? 'golpe-SA3' : m.btn === 'H' || m.type === 'special' ? 'golpe-5H' : 'golpe-5L';
    const alt = readyStrip(set, key) || readyStrip(set, 'golpe-5H') || readyStrip(set, 'golpe-5L');
    if (alt) return { s: alt, p: m.air ? 0.4 : a.p, fx: null };
  }
  const throwFallback = a.name.startsWith('golpe-throw') && readyStrip(set, 'golpe-5L');
  if (throwFallback) return { s: throwFallback, p: 0.5, fx: null };
  const idle = readyStrip(set, 'parado');
  return idle ? { s: idle, p: 0, fx: null } : null;
}

/**
 * Desenha o lutador com sprite, se o personagem tiver tiras registradas.
 * O contexto deve estar na origem do lutador (pés), já espelhado pelo lado.
 * @returns {boolean} true se desenhou
 */
export function spriteSetId(f) {
  return f.ch.spriteFacingPacks?.[f.face < 0 ? 'left' : 'right'] || f.ch.id;
}

const LAST = new WeakMap(); // lutador → último quadro desenhado (só visual)

export function drawSprite(c, f, frame) {
  const set = REG[spriteSetId(f)];
  if (!set) return false;
  const a = paiAnimation(f, frame, animFor(f, frame));
  a.p = spriteProgress(f, a);
  let pick = pickStrip(set, a, f);
  // Enquanto uma tira ainda decodifica, repete o último quadro desenhado em vez
  // de pular para a pose parada ou para o boneco desenhado em código.
  const last = LAST.get(f);
  if ((!pick || pick.waiting) && last?.set === set && last.s.cv) pick = last;
  if (!pick?.s) return false;
  let i = pick.i ?? Math.min(pick.s.n - 1, Math.max(0, Math.floor(pick.p * pick.s.n)));
  let denseAlt = !pick.poster && f.alt && pick.s.n >= 12 && pick.s.material === false && typeof document !== 'undefined';
  let source = pick.poster ? posterSource(pick.s, f.alt) : denseAlt ? denseAltFrame(pick.s, i) : f.alt ? altSource(pick.s) : pick.s.cv;
  // Paleta do espelho ainda no worker: mantém o último quadro já colorido.
  // (Um ImageBitmap liberado fica com largura 0 e não pode mais ser desenhado.)
  if (!source && last?.set === set && last.source?.width > 0) {
    pick = last; i = last.i; denseAlt = last.denseAlt; source = last.source;
  }
  if (!source) return false;
  const { s, fx } = pick;
  if (!pick.waiting && pick !== last) LAST.set(f, { set, s, i, p: pick.p, fx, poster: pick.poster, source, denseAlt });
  // correção por tira: algumas pranchas vieram desenhadas maiores ou menores
  const size = CELL * (f.ch.spriteScale || 1) * (f.ch.spriteStripScale?.[s.id]?.[s.name] || 1);
  c.save();
  if (f.ch.spriteProfile === 'ten-frame' && f.state === 'attack' && f.move?.weapon === 'ak') {
    const at = f.move.spawn.filter(shot => shot.at <= f.sf).at(-1)?.at;
    const recoil = at == null ? 0 : Math.max(0, 1 - (f.sf - at) / 4);
    c.translate(-5 * recoil, 0);
    c.rotate(-0.008 * recoil);
  }
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
  // Cancel the caller's facing mirror for independently drawn left-facing art.
  if (f.face < 0 && f.ch.spriteFacingPacks?.left) c.scale(-1, 1);
  c.drawImage(source, denseAlt ? 0 : i * s.size, 0, s.size, s.size, -size * FOOT.x, -size * FOOT.y, size, size);
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

/** Read-only diagnostics for art QA; never alters loading or simulation. */
export function spriteLoadStatus(id) { return Object.fromEntries(Object.entries(REG[id] || {}).map(([name,s]) => [name, s.failed ? 'failed' : s.cv ? 'decoded' : s.loading ? 'loading' : 'registered'])); }
