import { SYS } from '../data/system.js';
import { FUGA } from '../data/characters/fujao.js';

/**
 * Cenário provisório do aeroporto (Capítulo 4), desenhado em código até o
 * cenário pintado ficar pronto. Pista ao entardecer, terminal ao fundo e o
 * avião do Fujão com a escada encostada no ponto de embarque (FUGA.stairsX).
 */
const VW = SYS.VIEW_W;
const VH = SYS.VIEW_H;
const OUT = '#17131b';
const FLOOR = 826;

let sky = null;
function skyLayer() {
  if (sky) return sky;
  const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(VW, VH) : Object.assign(document.createElement('canvas'), { width: VW, height: VH });
  const g = cv.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, FLOOR);
  grad.addColorStop(0, '#3b2a5e');
  grad.addColorStop(0.55, '#c8577a');
  grad.addColorStop(1, '#f6b26b');
  g.fillStyle = grad;
  g.fillRect(0, 0, VW, VH);
  g.fillStyle = 'rgba(255,240,200,.85)';
  g.beginPath();
  g.arc(1500, 560, 90, 0, Math.PI * 2);
  g.fill();
  sky = cv;
  return sky;
}

function terminal(c, cam) {
  const ox = -cam * 0.25;
  c.fillStyle = '#4a3a5c';
  c.fillRect(ox - 100, 600, 2400, FLOOR - 600);
  c.fillStyle = '#5c4a70';
  for (let i = 0; i < 26; i++) c.fillRect(ox - 60 + i * 90, 640, 60, 120);
  c.fillStyle = 'rgba(255,214,120,.55)';
  for (let i = 0; i < 26; i++) c.fillRect(ox - 54 + i * 90, 650, 48, 40);
  // torre de controle
  c.fillStyle = '#3b2f4c';
  c.fillRect(ox + 300, 380, 60, 260);
  c.beginPath();
  c.moveTo(ox + 250, 380);
  c.lineTo(ox + 410, 380);
  c.lineTo(ox + 390, 320);
  c.lineTo(ox + 270, 320);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(160,230,255,.7)';
  c.fillRect(ox + 272, 330, 116, 36);
  c.fillStyle = 'rgba(255,255,255,.9)';
  c.font = "bold 44px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('AEROPORTO', ox + 700, 620);
}

function airplane(c, cam, frame) {
  // no mesmo plano dos lutadores, atrás deles
  const ox = -cam;
  const door = FUGA.stairsX + 120;
  const x0 = door - 1150;
  const yTop = 470;
  const yBot = 700;
  c.save();
  c.translate(ox, 0);
  c.lineWidth = 7;
  c.strokeStyle = OUT;
  // cauda
  c.fillStyle = '#f2efe8';
  c.beginPath();
  c.moveTo(x0 + 40, yTop + 30);
  c.lineTo(x0 - 120, yTop - 230);
  c.lineTo(x0 + 40, yTop - 230);
  c.lineTo(x0 + 220, yTop + 10);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#2f5d9e';
  c.fillRect(x0 - 70, yTop - 200, 100, 50);
  // fuselagem
  c.fillStyle = '#f7f5f0';
  c.beginPath();
  c.moveTo(x0, yTop + 40);
  c.lineTo(x0 + 1350, yTop);
  c.quadraticCurveTo(x0 + 1560, yTop + 20, x0 + 1600, (yTop + yBot) / 2);
  c.quadraticCurveTo(x0 + 1560, yBot, x0 + 1350, yBot);
  c.lineTo(x0 + 120, yBot);
  c.quadraticCurveTo(x0, yBot - 40, x0, yTop + 40);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#2f5d9e';
  c.fillRect(x0 + 60, yBot - 70, 1420, 22);
  // janelas
  c.fillStyle = '#7fb6e0';
  for (let i = 0; i < 26; i++) {
    c.beginPath();
    c.roundRect(x0 + 160 + i * 44, yTop + 52, 24, 34, 8);
    c.fill();
  }
  // porta aberta no alto da escada
  c.fillStyle = '#2a2230';
  c.fillRect(door - 40, yTop + 30, 80, 150);
  c.strokeRect(door - 40, yTop + 30, 80, 150);
  c.fillStyle = 'rgba(255,214,120,.8)';
  c.fillRect(door - 30, yTop + 40, 60, 130);
  // asa e motor
  c.fillStyle = '#dcd8d0';
  c.beginPath();
  c.moveTo(x0 + 520, yBot - 40);
  c.lineTo(x0 + 860, yBot - 40);
  c.lineTo(x0 + 640, yBot + 70);
  c.lineTo(x0 + 420, yBot + 70);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#b8b4ae';
  c.beginPath();
  c.roundRect(x0 + 520, yBot + 50, 200, 76, 30);
  c.fill();
  c.stroke();
  // trem de pouso
  c.fillStyle = OUT;
  for (const wx of [x0 + 300, x0 + 1250]) {
    c.fillRect(wx, yBot, 14, FLOOR - yBot + 40);
    c.beginPath();
    c.arc(wx + 7, FLOOR + 50, 26, 0, Math.PI * 2);
    c.fill();
  }
  // luz piscando na ponta da asa
  if (frame % 60 < 30) {
    c.fillStyle = '#ff3b30';
    c.beginPath();
    c.arc(x0 + 430, yBot + 70, 9, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function stairs(c, cam) {
  const ox = -cam;
  const top = 500;
  const x = FUGA.stairsX;
  c.save();
  c.translate(ox, 0);
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  // corpo da escada: rampa do chão até a porta
  c.fillStyle = '#e8e2d4';
  c.beginPath();
  c.moveTo(x - 160, SYS.GROUND_Y);
  c.lineTo(x + 70, top + 30);
  c.lineTo(x + 110, top + 30);
  c.lineTo(x + 110, SYS.GROUND_Y);
  c.closePath();
  c.fill();
  c.stroke();
  c.strokeStyle = '#8a8590';
  c.lineWidth = 4;
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    const sx = x - 160 + 230 * t;
    const sy = SYS.GROUND_Y - (SYS.GROUND_Y - top - 30) * t;
    c.beginPath();
    c.moveTo(sx, sy);
    c.lineTo(sx + 40, sy);
    c.stroke();
  }
  // corrimão
  c.strokeStyle = OUT;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x - 170, SYS.GROUND_Y - 110);
  c.lineTo(x + 60, top - 70);
  c.stroke();
  c.fillStyle = '#ffcf2a';
  c.font = "bold 26px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.fillText('EMBARQUE', x + 10, SYS.GROUND_Y - 300);
  c.restore();
}

function tarmac(c, cam) {
  const g = c.createLinearGradient(0, FLOOR, 0, VH);
  g.addColorStop(0, '#5a5560');
  g.addColorStop(1, '#3a3640');
  c.fillStyle = g;
  c.fillRect(0, FLOOR, VW, VH - FLOOR);
  c.strokeStyle = 'rgba(20,14,24,.45)';
  c.lineWidth = 3;
  for (let i = 1; i < 8; i++) {
    const y = FLOOR + (i / 7) ** 1.6 * (VH - FLOOR);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(VW, y);
    c.stroke();
  }
  // faixas amarelas da pista
  c.fillStyle = '#f3c426';
  const off = -(cam % 260);
  for (let x = off - 260; x < VW + 260; x += 260) c.fillRect(x, 1010, 150, 14);
}

/** Desenha o aeroporto inteiro (fundo, avião e escada) para a câmera atual. */
export function drawAirportStage(c, cam, frame = 0) {
  c.drawImage(skyLayer(), 0, 0);
  terminal(c, cam);
  tarmac(c, cam);
  airplane(c, cam, frame);
  stairs(c, cam);
}
