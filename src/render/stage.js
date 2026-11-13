import { SYS } from '../data/system.js';
import { halftone } from './draw.js';

/**
 * Cenário de Belém (Ver-o-Peso), desenhado por código em camadas com
 * profundidade (parallax). Provisório: cada camada pode ser trocada por uma
 * imagem pintada do mesmo tamanho.
 */
const VW = SYS.VIEW_W;
const VH = SYS.VIEW_H;
const SCROLL = SYS.STAGE_W - VW;
const OUT = '#16101c';

function layer(factor, paint) {
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(VW + SCROLL * factor, VH) : Object.assign(document.createElement('canvas'), { width: VW + SCROLL * factor, height: VH });
  paint(cv.getContext('2d'), cv.width);
  return { cv, factor };
}

function tower(c, x, base, w, h, body, roof) {
  c.fillStyle = body;
  c.strokeStyle = OUT;
  c.lineWidth = 4;
  c.fillRect(x - w / 2, base - h, w, h);
  c.strokeRect(x - w / 2, base - h, w, h);
  c.beginPath();
  c.moveTo(x - w / 2 - 8, base - h);
  c.lineTo(x, base - h - w * 1.5);
  c.lineTo(x + w / 2 + 8, base - h);
  c.closePath();
  c.fillStyle = roof;
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(x, base - h - w * 1.5);
  c.lineTo(x, base - h - w * 1.5 - 40);
  c.stroke();
  c.fillStyle = '#2a2238';
  for (let i = 0; i < 2; i++) c.fillRect(x - 8, base - h + 20 + i * 56, 16, 30);
}

function tent(c, x, base, w, color) {
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  for (const px of [x - w / 2 + 14, x + w / 2 - 14]) {
    c.beginPath();
    c.moveTo(px, base);
    c.lineTo(px, base - 190);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(x - w / 2 - 20, base - 180);
  c.lineTo(x - w / 4, base - 262);
  c.lineTo(x + w / 4, base - 262);
  c.lineTo(x + w / 2 + 20, base - 180);
  c.closePath();
  c.fillStyle = color;
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,.22)';
  for (let i = 0; i < 4; i++) c.fillRect(x - w / 2 + i * (w / 4) + 10, base - 200, w / 10, 22);
  // banca de frutas
  c.fillStyle = '#6b4a36';
  c.fillRect(x - w / 2 + 26, base - 74, w - 52, 74);
  c.strokeRect(x - w / 2 + 26, base - 74, w - 52, 74);
  const fruit = ['#f29b2e', '#e2483d', '#f5d547', '#7cc04a'];
  for (let i = 0; i * 26 < w - 80; i++) {
    c.beginPath();
    c.arc(x - w / 2 + 46 + i * 26, base - 82 - (i % 2) * 8, 13, 0, Math.PI * 2);
    c.fillStyle = fruit[i % 4];
    c.fill();
    c.lineWidth = 3;
    c.stroke();
  }
}

/** Monta as camadas do cenário. Chame uma vez. */
export function buildStage() {
  const sky = layer(0, (c, w) => {
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#2d2360');
    g.addColorStop(0.45, '#a8528c');
    g.addColorStop(0.8, '#f08a5a');
    g.addColorStop(1, '#f9c66a');
    c.fillStyle = g;
    c.fillRect(0, 0, w, VH);
    halftone(c, 0, 0, w, 330, 'rgba(20,10,50,.35)', 16, 5);
    c.fillStyle = 'rgba(255,225,210,.75)';
    for (const [x, y, r] of [[240, 190, 90], [330, 210, 70], [980, 130, 110], [1110, 160, 80], [1560, 240, 95], [1680, 255, 60]]) {
      c.beginPath();
      c.ellipse(x, y, r * 1.5, r * 0.42, 0, 0, Math.PI * 2);
      c.fill();
    }
  });
  const far = layer(0.18, (c, w) => {
    c.fillStyle = '#4a3f78';
    c.beginPath();
    c.moveTo(0, 600);
    for (let x = 0; x <= w; x += 60) c.lineTo(x, 560 - Math.sin(x * 0.011) * 22 - (x % 180 === 0 ? 30 : 0));
    c.lineTo(w, 640);
    c.lineTo(0, 640);
    c.fill();
    const g = c.createLinearGradient(0, 600, 0, 760);
    g.addColorStop(0, '#f2a868');
    g.addColorStop(1, '#3f6f8f');
    c.fillStyle = g;
    c.fillRect(0, 600, w, 200);
    c.strokeStyle = 'rgba(255,240,210,.55)';
    c.lineWidth = 3;
    for (let i = 0; i < 46; i++) {
      const x = (i * 197) % w;
      const y = 620 + ((i * 53) % 130);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 50 + (i % 3) * 20, y);
      c.stroke();
    }
    // barcos e guindastes
    c.strokeStyle = OUT;
    c.lineWidth = 4;
    for (const [x, s] of [[w * 0.62, 1], [w * 0.78, 0.8], [w * 0.2, 0.7]]) {
      c.fillStyle = '#e8e2d6';
      c.beginPath();
      c.moveTo(x - 110 * s, 650);
      c.lineTo(x + 120 * s, 650);
      c.lineTo(x + 90 * s, 690);
      c.lineTo(x - 90 * s, 690);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#3d6a9c';
      c.fillRect(x - 60 * s, 612, 110 * s, 38);
      c.strokeRect(x - 60 * s, 612, 110 * s, 38);
    }
    c.lineWidth = 6;
    c.strokeStyle = '#3a3352';
    for (const x of [w * 0.86, w * 0.93]) {
      c.beginPath();
      c.moveTo(x, 640);
      c.lineTo(x, 470);
      c.lineTo(x + 90, 500);
      c.moveTo(x, 470);
      c.lineTo(x - 40, 520);
      c.stroke();
    }
  });
  const mid = layer(0.42, (c, w) => {
    const base = 790;
    // igreja
    c.fillStyle = '#e9dcc6';
    c.strokeStyle = OUT;
    c.lineWidth = 4;
    c.fillRect(w * 0.1, base - 250, 300, 250);
    c.strokeRect(w * 0.1, base - 250, 300, 250);
    tower(c, w * 0.1 + 40, base, 70, 330, '#efe4cf', '#7a4b3c');
    tower(c, w * 0.1 + 260, base, 70, 330, '#efe4cf', '#7a4b3c');
    // Mercado de Ferro (Ver-o-Peso)
    const mx = w * 0.5;
    c.fillStyle = '#8fa3b5';
    c.fillRect(mx - 330, base - 200, 660, 200);
    c.strokeRect(mx - 330, base - 200, 660, 200);
    c.fillStyle = '#5d7388';
    c.beginPath();
    c.moveTo(mx - 350, base - 200);
    c.lineTo(mx, base - 290);
    c.lineTo(mx + 350, base - 200);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#2a2238';
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.roundRect(mx - 300 + i * 70, base - 150, 40, 110, [20, 20, 0, 0]);
      c.fill();
    }
    for (const dx of [-330, -110, 110, 330]) tower(c, mx + dx, base, 64, 290, '#9fb2c4', '#3f5468');
    // casario
    const cols = ['#e8a35c', '#d96b6b', '#7fb0c9', '#e6d27a', '#b98ad0'];
    for (let i = 0; i < 9; i++) {
      const x = w * 0.72 + i * 92;
      const h = 150 + ((i * 37) % 70);
      c.fillStyle = cols[i % 5];
      c.fillRect(x, base - h, 88, h);
      c.strokeRect(x, base - h, 88, h);
      c.fillStyle = '#2a2238';
      c.fillRect(x + 14, base - h + 24, 22, 34);
      c.fillRect(x + 52, base - h + 24, 22, 34);
    }
    // árvores
    for (const x of [w * 0.03, w * 0.34, w * 0.68]) {
      c.fillStyle = '#4a3528';
      c.fillRect(x - 12, base - 170, 24, 170);
      c.fillStyle = '#2f6b4a';
      for (const [dx, dy, r] of [[0, -230, 90], [-70, -190, 66], [70, -195, 70]]) {
        c.beginPath();
        c.arc(x + dx, base + dy, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }
    halftone(c, 0, base - 120, w, 120, 'rgba(30,15,45,.28)', 14, 4, 'up');
  });
  const near = layer(0.78, (c, w) => {
    const base = 826;
    const cols = ['#f2c12e', '#d8392f', '#2f6fc0', '#f08a2e'];
    let i = 0;
    for (let x = 120; x < w; x += 360) {
      if (i % 4 !== 3) tent(c, x, base, 250, cols[i % 4]);
      i++;
    }
    // público
    for (let k = 0; k < 40; k++) {
      const x = (k * 137) % w;
      const y = base - 6;
      c.fillStyle = ['#2b2238', '#3a2a40', '#4a3144'][k % 3];
      c.beginPath();
      c.arc(x, y - 96, 18, 0, Math.PI * 2);
      c.fill();
      c.fillRect(x - 20, y - 80, 40, 82);
    }
    // postes
    for (const x of [w * 0.36, w * 0.82]) {
      c.strokeStyle = OUT;
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(x, base + 4);
      c.lineTo(x, base - 330);
      c.stroke();
      c.fillStyle = '#ffe9a8';
      c.beginPath();
      c.arc(x, base - 350, 24, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = 4;
      c.stroke();
    }
  });
  return [sky, far, mid, near];
}

/**
 * Cenário pintado (opcional). Quando existe uma imagem para a fase, ela
 * substitui o cenário desenhado por código. A imagem é ampliada para ficar
 * um pouco mais larga que a tela e desliza devagar com a câmera.
 * `horizon` é a altura do encontro do chão com o fundo, de 0 (topo) a 1 (base).
 */
const PAINTED = { img: null, horizon: 0.65, parallax: 0.35 };
export function setStageImage(img, opts = {}) {
  PAINTED.img = img;
  Object.assign(PAINTED, opts);
}

function drawPainted(c, cam) {
  const img = PAINTED.img;
  const wantW = VW + SCROLL * PAINTED.parallax;
  const s = Math.max(wantW / img.width, VH / img.height);
  const dh = img.height * s;
  // o horizonte da pintura fica um pouco acima dos pés dos lutadores
  const top = Math.min(0, Math.max(VH - dh, SYS.GROUND_Y - 250 - PAINTED.horizon * dh));
  const sx = (cam * PAINTED.parallax) / s;
  c.drawImage(img, sx, -top / s, VW / s, VH / s, 0, 0, VW, VH);
}

/** Desenha o cenário para a posição de câmera `cam` (0 até STAGE_W - VIEW_W). */
export function drawStage(c, layers, cam) {
  if (PAINTED.img && PAINTED.img.complete !== false && PAINTED.img.width) return drawPainted(c, cam);
  for (const L of layers) c.drawImage(L.cv, Math.round(cam * L.factor), 0, VW, VH, 0, 0, VW, VH);
  // chão em perspectiva
  const top = 826;
  const g = c.createLinearGradient(0, top, 0, VH);
  g.addColorStop(0, '#9a6f78');
  g.addColorStop(1, '#5c3f52');
  c.fillStyle = g;
  c.fillRect(0, top, VW, VH - top);
  c.strokeStyle = 'rgba(30,14,34,.5)';
  c.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const y = top + (i / 8) ** 1.7 * (VH - top);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(VW, y);
    c.stroke();
  }
  const vpx = VW / 2;
  for (let wx = 0; wx <= SYS.STAGE_W; wx += 130) {
    const sx = wx - cam;
    const fx = vpx + (sx - vpx) * 1.55;
    if (fx < -400 || fx > VW + 400) continue;
    c.beginPath();
    c.moveTo(vpx + (sx - vpx) * 0.9, top);
    c.lineTo(fx, VH);
    c.stroke();
  }
  c.fillStyle = '#12080c';
  c.fillRect(0, top - 5, VW, 7);
  halftone(c, 0, VH - 150, VW, 150, 'rgba(20,8,24,.35)', 16, 5, 'up');
}
