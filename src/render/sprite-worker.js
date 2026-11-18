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
  // Paleta do espelho dentro do mesmo shader do material: a tira não precisa
  // voltar da GPU para a CPU (essa leitura travava o processo da GPU até 56 ms).
  const RECOLOR = 'uniform float altOn;uniform float rotation;uniform float neutralHue;uniform float neutralSat;'
    + 'vec3 hsl2rgb(float h,float s,float l){float c=(1.-abs(2.*l-1.))*s;float x=c*(1.-abs(mod(h/60.,2.)-1.));float m=l-c/2.;vec3 r;'
    + 'if(h<60.)r=vec3(c,x,0.);else if(h<120.)r=vec3(x,c,0.);else if(h<180.)r=vec3(0.,c,x);else if(h<240.)r=vec3(0.,x,c);else if(h<300.)r=vec3(x,0.,c);else r=vec3(c,0.,x);return r+m;}'
    + 'vec4 recolorAlt(vec4 p){if(altOn<.5||p.a*255.<.5)return p;vec3 q=floor(clamp(p.rgb,0.,1.)*255.+.5)/255.;'
    + 'float mx=max(q.r,max(q.g,q.b)),mn=min(q.r,min(q.g,q.b)),l=(mx+mn)*.5,d=mx-mn;if(l<.12)return vec4(q,p.a);'
    + 'float h=0.,s=0.;if(d>0.){s=d/(1.-abs(2.*l-1.));if(mx==q.r)h=mod((q.g-q.b)/d+6.,6.);else if(mx==q.g)h=(q.b-q.r)/d+2.;else h=(q.r-q.g)/d+4.;h*=60.;}'
    + 'if(s>=.15&&h>=5.&&h<=50.&&l>=.2&&l<=.88)return vec4(q,p.a);float nh=mod(h+rotation,360.),ns=s;if(s<.15){nh=neutralHue;ns=neutralSat;}'
    + 'return vec4(hsl2rgb(nh,ns,l),p.a);}';
  // Mesma precisão do material: o lado 1 e o lado 2 saem da mesma conta.
  const ALT_FS = FS.replace('void main(){', RECOLOR + 'void main(){')
    .replace('gl_FragColor=vec4(col,a);}', 'gl_FragColor=recolorAlt(vec4(col,a));}');
  let gl = null, glCanvas = null, programs = null, glBroken = false;
  function renderer() {
    if (gl || glBroken) return gl;
    try {
      if (ALT_FS === FS || !ALT_FS.includes('recolorAlt(vec4(col,a))')) throw Error('alt shader');
      glCanvas = new OffscreenCanvas(1, 1);
      gl = glCanvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false });
      if (!gl) throw Error('webgl');
      const shader = (type, source) => { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error('shader'); return s; };
      const link = fs => {
        const program = gl.createProgram();
        gl.attachShader(program, shader(gl.VERTEX_SHADER, VS));
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('link');
        return program;
      };
      programs = { base: link(FS), alt: link(ALT_FS) };
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    } catch { glBroken = true; gl = null; }
    return gl;
  }
  function material(src, w, h, strength, palette) {
    const g = renderer();
    if (!g) throw Error('nogl');
    const max = g.getParameter(g.MAX_TEXTURE_SIZE);
    if (w > max || h > max) return null;
    const program = palette ? programs.alt : programs.base;
    g.useProgram(program);
    const loc = g.getAttribLocation(program, 'position');
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
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
    if (palette) {
      g.uniform1f(g.getUniformLocation(program, 'altOn'), 1);
      g.uniform1f(g.getUniformLocation(program, 'rotation'), palette.rotation);
      g.uniform1f(g.getUniformLocation(program, 'neutralHue'), palette.neutralHue);
      g.uniform1f(g.getUniformLocation(program, 'neutralSat'), palette.saturation);
    }
    g.drawArrays(g.TRIANGLES, 0, 6);
    g.deleteTexture(texture);
    return glCanvas.transferToImageBitmap();
  }
  // Contorno luminoso do lado 2, desenhado na GPU a partir de pixels já coloridos.
  function glow(src, blur) {
    const out = new OffscreenCanvas(src.width, src.height), o = out.getContext('2d');
    o.shadowColor = 'rgba(70, 200, 255, 0.95)';
    o.shadowBlur = blur;
    o.drawImage(src, 0, 0);
    o.drawImage(src, 0, 0);
    return out.transferToImageBitmap();
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
    if (m.strength > 0) { out = material(src, w, h, m.strength, m.alt?.palette); applied = !!out; }
    if (!out) out = src instanceof ImageBitmap ? src : src.transferToImageBitmap();
    else if (src instanceof ImageBitmap) src.close();
    if (m.alt) {
      // Com material, o shader já recoloriu; sem ele, os pixels estão na CPU e o recolor é direto.
      const colored = applied ? glow(out, m.alt.blur) : alt(out, m.alt.palette, m.alt.blur);
      out.close(); out = colored;
    }
    return { bitmap: out, w, h, material: applied };
  }
  // Paleta do espelho a partir dos pixels já prontos (recorte e material aplicados).
  function alt(src, palette, blur) {
    const w = src.width, h = src.height;
    const cv = new OffscreenCanvas(w, h), c = cv.getContext('2d', { willReadFrequently: true });
    c.drawImage(src, 0, 0);
    const d = c.getImageData(0, 0, w, h);
    recolor(d.data, palette);
    c.putImageData(d, 0, 0);
    // Contorno luminoso: distingue o lado 2 mesmo em roupas bege ou marrons.
    const out = new OffscreenCanvas(w, h), o = out.getContext('2d');
    o.shadowColor = 'rgba(70, 200, 255, 0.95)';
    o.shadowBlur = blur;
    o.drawImage(cv, 0, 0);
    o.drawImage(cv, 0, 0);
    return out.transferToImageBitmap();
  }
  self.onmessage = async e => {
    const m = e.data;
    try {
      const r = await strip(m);
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

/**
 * Paleta do espelho no worker: busca a tira de novo (vem do cache HTTP), aplica
 * recorte e material e devolve só a versão recolorida. Nada é copiado na thread
 * do jogo; mandar o ImageBitmap decodificado obrigava o navegador a lê-lo da GPU.
 */
export function decodeAltStripOffThread(url, { strength = 0, keyOut = false, palette, blur }) {
  const absolute = url.startsWith('data:') ? url : new URL(url, document.baseURI).href;
  return call({ type: 'strip', url: absolute, strength, keyOut, alt: { palette, blur } });
}
