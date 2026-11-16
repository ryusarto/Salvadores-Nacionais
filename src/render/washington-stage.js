import { SYS } from '../data/system.js';

/**
 * Cenário provisório de Washington, D.C. (Capítulo 6), desenhado em código até
 * o cenário pintado ficar pronto. Gramado em frente a um palácio branco de
 * colunas, chafariz e bandeiras americanas rasgadas balançando no vento.
 */
const VW = SYS.VIEW_W;
const VH = SYS.VIEW_H;
const OUT = '#17131b';
const FLOOR = 826;

function sky(c) {
  const g = c.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, '#2b3a6e');
  g.addColorStop(0.6, '#7a6aa0');
  g.addColorStop(1, '#f0a070');
  c.fillStyle = g;
  c.fillRect(0, 0, VW, FLOOR);
  c.fillStyle = 'rgba(255,255,255,.12)';
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.ellipse(200 + i * 400, 160 + (i % 2) * 70, 160, 34, 0, 0, Math.PI * 2);
    c.fill();
  }
}

function obelisk(c, cam) {
  const x = 1500 - cam * 0.15;
  c.fillStyle = '#c9c2d8';
  c.beginPath();
  c.moveTo(x - 30, FLOOR - 120);
  c.lineTo(x - 18, 140);
  c.lineTo(x, 100);
  c.lineTo(x + 18, 140);
  c.lineTo(x + 30, FLOOR - 120);
  c.closePath();
  c.fill();
}

function palace(c, cam) {
  const ox = 1300 - cam * 0.45;
  const w = 1300;
  const l = ox - w / 2;
  const top = 420;
  c.save();
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  c.fillStyle = '#f2efe8';
  c.fillRect(l, top, w, FLOOR - top - 40);
  c.strokeRect(l, top, w, FLOOR - top - 40);
  // pórtico central com frontão
  c.beginPath();
  c.moveTo(ox - 260, top);
  c.lineTo(ox, top - 120);
  c.lineTo(ox + 260, top);
  c.closePath();
  c.fill();
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const cx = ox - 220 + i * 88;
    c.fillStyle = '#fbfaf6';
    c.fillRect(cx - 16, top, 32, FLOOR - top - 40);
    c.strokeRect(cx - 16, top, 32, FLOOR - top - 40);
  }
  // janelas das alas
  c.fillStyle = '#5a6a8a';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        const wx = ox + side * (330 + i * 85) - 22;
        c.fillRect(wx, top + 50 + j * 140, 44, 80);
        c.strokeRect(wx, top + 50 + j * 140, 44, 80);
      }
    }
  }
  c.fillStyle = '#e8e2d4';
  c.fillRect(l - 20, top - 20, w + 40, 24);
  c.strokeRect(l - 20, top - 20, w + 40, 24);
  c.restore();
}

/** Bandeira americana rasgada, balançando. */
function tornFlag(c, x, frame, seed) {
  c.save();
  c.fillStyle = OUT;
  c.fillRect(x - 5, 330, 10, FLOOR - 330 + 30);
  const fw = 220;
  const fh = 130;
  const top = 340;
  const wave = (k) => Math.sin(frame / 12 + k * 0.7 + seed) * 7;
  // listras
  for (let s = 0; s < 7; s++) {
    c.fillStyle = s % 2 ? '#f4f0ea' : '#c8102e';
    c.beginPath();
    const y0 = top + (s * fh) / 7;
    const y1 = top + ((s + 1) * fh) / 7;
    c.moveTo(x, y0);
    for (let k = 0; k <= 10; k++) {
      // a ponta rasgada: listras de comprimentos diferentes
      const tear = k === 10 ? ((s * 37 + seed * 13) % 60) : 0;
      c.lineTo(x + (k * fw) / 10 - tear, y0 + wave(k));
    }
    for (let k = 10; k >= 0; k--) {
      const tear = k === 10 ? ((s * 53 + seed * 7) % 70) : 0;
      c.lineTo(x + (k * fw) / 10 - tear, y1 + wave(k));
    }
    c.closePath();
    c.fill();
  }
  // cantão
  c.fillStyle = '#2b3a6e';
  c.fillRect(x, top + wave(2) * 0.3, 90, fh * 0.55);
  c.fillStyle = '#f4f0ea';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) c.fillRect(x + 10 + j * 20, top + 10 + i * 22, 6, 6);
  // rasgo no meio
  c.strokeStyle = OUT;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x + 120, top + 10);
  c.lineTo(x + 140, top + 60);
  c.lineTo(x + 118, top + 100);
  c.stroke();
  c.restore();
}

function lawn(c, cam) {
  const g = c.createLinearGradient(0, FLOOR, 0, VH);
  g.addColorStop(0, '#5a8a4a');
  g.addColorStop(1, '#3a5a30');
  c.fillStyle = g;
  c.fillRect(0, FLOOR, VW, VH - FLOOR);
  c.strokeStyle = 'rgba(20,40,14,.35)';
  c.lineWidth = 3;
  const off = -(cam % 120);
  for (let x = off - 120; x < VW + 120; x += 120) {
    c.beginPath();
    c.moveTo(x, FLOOR);
    c.lineTo(x - 140, VH);
    c.stroke();
  }
  // cerca baixa no fundo do gramado
  c.fillStyle = OUT;
  c.fillRect(0, FLOOR - 40, VW, 6);
  for (let x = -(cam * 0.9) % 40; x < VW; x += 40) c.fillRect(x, FLOOR - 70, 5, 70);
}

/** Desenha Washington para a câmera atual. */
export function drawWashingtonStage(c, cam, frame = 0) {
  sky(c);
  obelisk(c, cam);
  palace(c, cam);
  lawn(c, cam);
  c.save();
  c.translate(-cam * 0.9, 0);
  tornFlag(c, 260, frame, 1);
  tornFlag(c, 1180, frame, 2);
  tornFlag(c, 2150, frame, 3);
  c.restore();
}
