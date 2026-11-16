import { SYS } from '../data/system.js';
import { PAI } from '../data/characters/pai-fujao.js';

/**
 * Cenário provisório da sala da mansão (Capítulo 5), desenhado em código até o
 * cenário pintado ficar pronto. Papel de parede escuro, janelão com a fachada e
 * o jardim, lustre, sofá, a porta por onde entram os capangas e, na parede, o
 * retrato do filho (o Fujão) acima da área da tornozeleira.
 */
const VW = SYS.VIEW_W;
const VH = SYS.VIEW_H;
const OUT = '#17131b';
const FLOOR = 826;

function wall(c) {
  c.fillStyle = '#3d1f2a';
  c.fillRect(0, 0, SYS.STAGE_W, FLOOR);
  // listras do papel de parede
  c.fillStyle = 'rgba(216,178,90,.12)';
  for (let x = 0; x < SYS.STAGE_W; x += 80) c.fillRect(x, 0, 30, FLOOR);
  // lambri
  c.fillStyle = '#2a1418';
  c.fillRect(0, 640, SYS.STAGE_W, FLOOR - 640);
  c.strokeStyle = 'rgba(216,178,90,.5)';
  c.lineWidth = 4;
  c.strokeRect(-10, 640, SYS.STAGE_W + 20, FLOOR - 640);
  for (let x = 40; x < SYS.STAGE_W; x += 200) c.strokeRect(x, 665, 160, 130);
  // rodateto
  c.fillStyle = '#d8b25a';
  c.fillRect(0, 0, SYS.STAGE_W, 24);
}

function windowView(c, x, y, w, h, frame) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#1d2350');
  g.addColorStop(1, '#4a3a6e');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // jardim e fachada vistos de dentro
  c.fillStyle = '#e8e2d4';
  c.fillRect(x + 60, y + 150, w - 120, 200);
  c.fillStyle = '#c9c2b2';
  for (let i = 0; i < 6; i++) c.fillRect(x + 90 + i * ((w - 180) / 5), y + 150, 20, 200);
  c.fillStyle = 'rgba(255,214,120,.8)';
  for (let i = 0; i < 5; i++) c.fillRect(x + 120 + i * ((w - 180) / 5), y + 190, 40, 60);
  c.fillStyle = '#2f5a3a';
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.arc(x + 20 + i * (w / 8), y + h - 30, 46, 0, Math.PI * 2);
    c.fill();
  }
  // estrelas
  c.fillStyle = '#fff';
  for (let i = 0; i < 12; i++) if ((frame + i * 17) % 90 < 70) c.fillRect(x + ((i * 97) % w), y + 20 + ((i * 41) % 110), 3, 3);
  c.restore();
  // moldura, cortinas
  c.lineWidth = 12;
  c.strokeStyle = '#d8b25a';
  c.strokeRect(x, y, w, h);
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x + w / 2, y);
  c.lineTo(x + w / 2, y + h);
  c.moveTo(x, y + h / 2);
  c.lineTo(x + w, y + h / 2);
  c.stroke();
  c.fillStyle = '#8e1f2c';
  for (const [cx, dir] of [[x - 30, 1], [x + w + 30, -1]]) {
    c.beginPath();
    c.moveTo(cx - 60 * dir, y - 40);
    c.lineTo(cx + 70 * dir, y - 40);
    c.quadraticCurveTo(cx + 10 * dir, y + h / 2, cx + 50 * dir, y + h + 40);
    c.lineTo(cx - 60 * dir, y + h + 40);
    c.closePath();
    c.fill();
    c.strokeStyle = OUT;
    c.lineWidth = 4;
    c.stroke();
  }
}

function sonPortrait(c, x, y) {
  c.fillStyle = '#d8b25a';
  c.fillRect(x - 130, y - 160, 260, 320);
  c.strokeStyle = OUT;
  c.lineWidth = 6;
  c.strokeRect(x - 130, y - 160, 260, 320);
  c.fillStyle = '#5a7a9a';
  c.fillRect(x - 105, y - 135, 210, 270);
  // o Fujão, sorrindo, de óculos escuros, com a mala
  c.fillStyle = '#e8e2d4';
  c.beginPath();
  c.moveTo(x - 90, y + 135);
  c.quadraticCurveTo(x - 80, y + 10, x, y + 5);
  c.quadraticCurveTo(x + 80, y + 10, x + 90, y + 135);
  c.closePath();
  c.fill();
  c.fillStyle = '#e6b892';
  c.beginPath();
  c.arc(x, y - 45, 52, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#5a3a1e';
  c.beginPath();
  c.arc(x, y - 80, 50, Math.PI, 0);
  c.fill();
  c.fillStyle = OUT;
  c.fillRect(x - 40, y - 58, 80, 18);
  c.lineWidth = 4;
  c.beginPath();
  c.arc(x, y - 22, 20, 0.2, Math.PI - 0.2);
  c.stroke();
  c.fillStyle = '#8a5a2a';
  c.fillRect(x + 40, y + 70, 60, 46);
  c.strokeRect(x + 40, y + 70, 60, 46);
  // placa
  c.fillStyle = OUT;
  c.fillRect(x - 70, y + 170, 140, 34);
  c.fillStyle = '#d8b25a';
  c.font = "bold 20px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('MEU FILHO', x, y + 188);
}

function chandelier(c, x, frame) {
  const sway = Math.sin(frame / 50) * 0.04;
  c.save();
  c.translate(x, 24);
  c.rotate(sway);
  c.strokeStyle = '#d8b25a';
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 120);
  c.stroke();
  c.fillStyle = '#d8b25a';
  c.beginPath();
  c.ellipse(0, 150, 150, 34, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = OUT;
  c.stroke();
  for (let i = -3; i <= 3; i++) {
    c.fillStyle = 'rgba(255,236,170,.95)';
    c.beginPath();
    c.arc(i * 42, 132, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(200,230,255,.8)';
    c.beginPath();
    c.moveTo(i * 42 - 7, 180);
    c.lineTo(i * 42, 210);
    c.lineTo(i * 42 + 7, 180);
    c.fill();
  }
  c.restore();
}

function sofa(c, x) {
  c.fillStyle = '#8e1f2c';
  c.strokeStyle = OUT;
  c.lineWidth = 6;
  c.beginPath();
  c.roundRect(x, 640, 420, 150, 24);
  c.fill();
  c.stroke();
  c.beginPath();
  c.roundRect(x + 20, 700, 380, 110, 16);
  c.fill();
  c.stroke();
  c.fillStyle = '#d8b25a';
  c.fillRect(x + 20, 810, 16, 20);
  c.fillRect(x + 384, 810, 16, 20);
}

function door(c, x) {
  c.fillStyle = '#5a3a1e';
  c.strokeStyle = OUT;
  c.lineWidth = 6;
  c.fillRect(x, 400, 180, FLOOR - 400);
  c.strokeRect(x, 400, 180, FLOOR - 400);
  c.strokeRect(x + 20, 420, 140, 170);
  c.strokeRect(x + 20, 610, 140, 190);
  c.fillStyle = '#d8b25a';
  c.beginPath();
  c.arc(x + 150, 620, 10, 0, Math.PI * 2);
  c.fill();
}

function floor(c, cam) {
  c.fillStyle = '#e8e2d4';
  c.fillRect(0, FLOOR, VW, VH - FLOOR);
  // xadrez de mármore em perspectiva
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    const y0 = FLOOR + (r / rows) ** 1.5 * (VH - FLOOR);
    const y1 = FLOOR + ((r + 1) / rows) ** 1.5 * (VH - FLOOR);
    const size = 120 + r * 30;
    const off = -((cam * (1 + r * 0.08)) % (size * 2));
    c.fillStyle = '#2a2430';
    for (let x = off - size * 2 + (r % 2) * size; x < VW + size; x += size * 2) c.fillRect(x, y0, size, y1 - y0);
  }
  c.fillStyle = 'rgba(255,255,255,.06)';
  c.fillRect(0, FLOOR, VW, 20);
}

/** Desenha a sala inteira para a câmera atual. */
export function drawMansionStage(c, cam, frame = 0) {
  c.save();
  c.translate(-cam, 0);
  wall(c);
  windowView(c, 700, 150, 640, 440, frame);
  door(c, 160);
  sonPortrait(c, PAI.zoneX + 300, 330);
  sofa(c, 1420);
  chandelier(c, 1300, frame);
  c.restore();
  floor(c, cam);
}
