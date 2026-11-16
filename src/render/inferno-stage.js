import { SYS } from '../data/system.js';

/**
 * Cenário provisório do inferno (Capítulo 7), desenhado em código até o
 * cenário pintado ficar pronto. Céu vermelho, rochas, correntes, caveiras,
 * colunas de fogo, o trono do Djabo ao fundo e o chão de pedra rachada com lava.
 */
const VW = SYS.VIEW_W;
const VH = SYS.VIEW_H;
const OUT = '#17131b';
const FLOOR = 826;

function sky(c, frame) {
  const g = c.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, '#1a0608');
  g.addColorStop(0.55, '#5a0e10');
  g.addColorStop(1, '#c8341a');
  c.fillStyle = g;
  c.fillRect(0, 0, VW, FLOOR);
  // brasas subindo
  c.fillStyle = 'rgba(255,170,60,.8)';
  for (let i = 0; i < 40; i++) {
    const x = (i * 211) % VW;
    const y = FLOOR - (((frame * (1 + (i % 3))) + i * 97) % FLOOR);
    c.fillRect(x + Math.sin(frame / 20 + i) * 10, y, 4, 4);
  }
}

function rocks(c, cam) {
  const ox = -cam * 0.3;
  c.fillStyle = '#2a0c0e';
  c.beginPath();
  c.moveTo(ox - 100, FLOOR);
  const peaks = [[0, 520], [220, 380], [420, 560], [640, 300], [900, 520], [1150, 340], [1400, 540], [1650, 280], [1900, 500], [2150, 360], [2400, 560]];
  for (const [x, y] of peaks) c.lineTo(ox + x, y);
  c.lineTo(ox + 2500, FLOOR);
  c.closePath();
  c.fill();
}

function throne(c, cam) {
  const x = 1300 - cam * 0.6;
  c.save();
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  c.fillStyle = '#3a0e12';
  c.beginPath();
  c.moveTo(x - 160, FLOOR - 20);
  c.lineTo(x - 160, 360);
  c.lineTo(x - 90, 260);
  c.lineTo(x, 330);
  c.lineTo(x + 90, 260);
  c.lineTo(x + 160, 360);
  c.lineTo(x + 160, FLOOR - 20);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#c8102e';
  c.fillRect(x - 100, 470, 200, 220);
  c.strokeRect(x - 100, 470, 200, 220);
  // chifres do trono
  c.fillStyle = '#f3c426';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 150, 370);
    c.quadraticCurveTo(x + s * 230, 300, x + s * 210, 200);
    c.quadraticCurveTo(x + s * 190, 300, x + s * 120, 360);
    c.closePath();
    c.fill();
    c.stroke();
  }
  c.restore();
}

function chains(c, cam, frame) {
  c.save();
  c.translate(-cam * 0.8, 0);
  c.strokeStyle = '#6a5a5c';
  c.lineWidth = 6;
  for (const [x, len] of [[380, 360], [900, 260], [1800, 320], [2300, 280]]) {
    const sway = Math.sin(frame / 40 + x) * 14;
    for (let k = 0; k < len; k += 26) {
      c.beginPath();
      c.ellipse(x + (sway * k) / len, k, 8, 14, 0, 0, Math.PI * 2);
      c.stroke();
    }
    // caveira na ponta
    c.fillStyle = '#e8e2d4';
    c.beginPath();
    c.arc(x + sway, len + 26, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = OUT;
    c.fillRect(x + sway - 14, len + 18, 10, 10);
    c.fillRect(x + sway + 4, len + 18, 10, 10);
  }
  c.restore();
}

function fireColumns(c, cam, frame) {
  c.save();
  c.translate(-cam, 0);
  for (const x of [160, 2440]) {
    c.fillStyle = '#2a0c0e';
    c.fillRect(x - 60, 520, 120, FLOOR - 520);
    for (let k = 0; k < 5; k++) {
      const h = 140 + Math.sin(frame / 6 + k) * 30;
      const g = c.createLinearGradient(0, 520, 0, 520 - h);
      g.addColorStop(0, '#ffd25a');
      g.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(x - 60 + k * 24, 520);
      c.quadraticCurveTo(x - 48 + k * 24, 520 - h, x - 36 + k * 24, 520);
      c.fill();
    }
  }
  c.restore();
}

function floor(c, cam, frame) {
  c.fillStyle = '#3a1a1c';
  c.fillRect(0, FLOOR, VW, VH - FLOOR);
  // rachaduras com lava
  c.save();
  c.translate(-cam, 0);
  c.strokeStyle = frame % 60 < 30 ? '#ff6a1a' : '#ff8a3a';
  c.lineWidth = 6;
  for (let x = 80; x < SYS.STAGE_W; x += 260) {
    c.beginPath();
    c.moveTo(x, FLOOR + 20);
    c.lineTo(x + 60, FLOOR + 90);
    c.lineTo(x + 30, FLOOR + 170);
    c.lineTo(x + 110, VH);
    c.stroke();
  }
  c.restore();
  c.fillStyle = 'rgba(255,90,20,.15)';
  c.fillRect(0, FLOOR, VW, 24);
}

/** Desenha o inferno para a câmera atual. */
export function drawInfernoStage(c, cam, frame = 0) {
  sky(c, frame);
  rocks(c, cam);
  throne(c, cam);
  chains(c, cam, frame);
  fireColumns(c, cam, frame);
  floor(c, cam, frame);
}
