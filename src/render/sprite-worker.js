import { keyOutPixels, recolorPixels } from './sprite-pixels.js';
import { MATERIAL_VS, MATERIAL_FS } from './fighter-material.js';

/**
 * Worker de sprites: baixa, decodifica, recorta o fundo, aplica o material e
 * monta a paleta do espelho fora da thread do jogo. Uma tira de 7680x768 levava
 * de 150 a 350 ms na thread principal a cada golpe novo; aqui a luta não para.
 * O resultado é um ImageBitmap com os mesmos pixels do caminho antigo, que fica
 * como reserva quando o navegador não oferece OffscreenCanvas em worker.
 */

// Corpo do worker. Roda isolado: só usa os próprios parâmetros e APIs do worker.
function workerMain(keyOut, recolor, VS, FS) {
  let gl = null, glCanvas = null, program = null, glBroken = false;
  function renderer() {
    if (gl || glBroken) return gl;
    try {
      glCanvas = new OffscreenCanvas(1, 1);
      gl = glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw Error('webgl');
      const shader = (type, source) => { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('shader'); return s; };
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, VS));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('link');
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    } catch { glBroken = true; gl = null; }
    return gl;
  }
  function material(src, w, h, strength) {
    const g = renderer();
    if (!g) throw Error('nogl');
    const max = g.getParameter(g.MAX_TEXTURE_SIZE);
    if (w > max || h > max) return null;
    glCanvas.width = w; glCanvas.height = h;
    g.viewport(0, 0, w, h);
    const texture = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, texture);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.NEAREST);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
    g.uniform2f(g.getUniformLocation(program, 'pixel'), 1 / w, 1 / h);
    g.uniform1f(g.getUniformLocation(program, 'strength'), strength);
    g.drawArrays(g.TRIANGLES, 0, 6);
    g.deleteTexture(texture);
    return glCanvas.transferToImageBitmap();
  }
  async function strip(m) {
    const response = await fetch(m.url, { cache: 'force-cache' });
    if (!response.ok) throw Error('http ' + response.status);
    let src = await createImageBitmap(await response.blob(), { premultiplyAlpha: 'none' });
    const w = src.width, h = src.height;
    if (m.keyOut) {
      const cv = new OffscreenCanvas(w, h), c = cv.getContext('2d', { willReadFrequently: true });
      c.drawImage(src, 0, 0);
      const d = c.getImageData(0, 0, w, h);
      if (keyOut(d.data, w, h)) c.putImageData(d, 0, 0);
      src.close();
      src = cv;
    }
    let out = null, applied = false;
    if (m.strength > 0) { out = material(src, w, h, m.strength); applied = !!out; }
    if (!out) out = src instanceof ImageBitmap ? src : src.transferToImageBitmap();
    else if (src instanceof ImageBitmap) src.close();
    return { bitmap: out, w, h, material: applied };
  }
  function alt(m) {
    const w = m.bitmap.width, h = m.bitmap.height;
    const cv = new OffscreenCanvas(w, h), c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(m.bitmap, 0, 0);
    m.bitmap.close();
    const d = c.getImageData(0, 0, w, h);
    recolor(d.data, m.palette);
    c.putImageData(d, 0, 0);
    // Contorno luminoso: distingue o lado 2 mesmo em roupas bege ou marrons.
    const out = new OffscreenCanvas(w, h), o = out.getContext('2d');
    o.shadowColor = 'rgba(70, 200, 255, 0.95)';
    o.shadowBlur = m.blur;
    o.drawImage(cv, 0, 0);
    o.drawImage(cv, 0, 0);
    return { bitmap: out.transferToImageBitmap(), w, h };
  }
  self.onmessage = async e => {
    const m = e.data;
    try {
      const r = m.type === 'alt' ? alt(m) : await strip(m);
      self.postMessage({ id: m.id, ...r }, [r.bitmap]);
    } catch (err) {
      self.postMessage({ id: m.id, error: String(err && err.message || err) });
    }
  };
}

/** Código-fonte do worker, montado a partir das funções compartilhadas. */
export function spriteWorkerSource() {
  return `(${workerMain})((${keyOutPixels}),(${recolorPixels}),${JSON.stringify(MATERIAL_VS)},${JSON.stringify(MATERIAL_FS)});`;
}

let worker = null, disabled = false, seq = 0, done = 0;
const pending = new Map();

export function spriteWorkerAvailable() {
  return !disabled && typeof Worker === 'function' && typeof OffscreenCanvas === 'function'
    && typeof createImageBitmap === 'function' && typeof Blob === 'function' && typeof URL?.createObjectURL === 'function'
    && typeof document !== 'undefined';
}

export function spriteWorkerStatus() { return { enabled: spriteWorkerAvailable(), disabled, started: !!worker, pending: pending.size, done }; }

/** Desliga o worker (erro do navegador): as tiras voltam ao caminho antigo. */
export function disableSpriteWorker() {
  disabled = true;
  worker?.terminate();
  worker = null;
  for (const job of pending.values()) job.reject(Error('worker'));
  pending.clear();
}

function spawn() {
  if (worker) return worker;
  try {
    const url = URL.createObjectURL(new Blob([spriteWorkerSource()], { type: 'text/javascript' }));
    worker = new Worker(url);
    worker.onmessage = e => {
      const job = pending.get(e.data.id);
      if (!job) return;
      pending.delete(e.data.id);
      done++;
      if (e.data.error) job.reject(Object.assign(Error(e.data.error), { code: e.data.error }));
      else job.resolve(e.data);
    };
    worker.onerror = () => disableSpriteWorker();
  } catch { disableSpriteWorker(); }
  return worker;
}

function call(message, transfer = []) {
  const w = spriteWorkerAvailable() && spawn();
  if (!w) return Promise.reject(Error('worker'));
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    w.postMessage({ ...message, id }, transfer);
  });
}

/**
 * Prepara uma tira no worker.
 * @returns {Promise<{bitmap: ImageBitmap, w: number, h: number, material: boolean}>}
 */
export function decodeStripOffThread(url, { strength = 0, keyOut = false } = {}) {
  const absolute = url.startsWith('data:') ? url : new URL(url, document.baseURI).href;
  return call({ type: 'strip', url: absolute, strength, keyOut }).catch(err => {
    // Sem WebGL dentro do worker: nada de material fora da thread neste navegador.
    if (err.code === 'nogl') disableSpriteWorker();
    throw err;
  });
}

/** Paleta do espelho no worker. O bitmap de entrada é copiado, não transferido. */
export function recolorStripOffThread(bitmap, palette, blur) {
  return call({ type: 'alt', bitmap, palette, blur });
}
