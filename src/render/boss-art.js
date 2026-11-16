import { SYS } from '../data/system.js';
import { phoneBox, LIVE } from '../data/characters/chupetinha.js';

const OUT = '#12080c';
const GY = SYS.GROUND_Y;

/** Chupeta gigante: escudo rosa, argola e bico. */
export function drawPacifier(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 5;
  c.strokeStyle = OUT;
  c.fillStyle = '#ffe9a8';
  c.beginPath();
  c.ellipse(26, 0, 22, 16, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = '#ff8fc0';
  c.beginPath();
  c.ellipse(0, 0, 16, 34, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.lineWidth = 7;
  c.arc(-22, 0, 18, Math.PI * 0.5, Math.PI * 1.5);
  c.stroke();
  c.lineWidth = 3;
  c.strokeStyle = '#ff8fc0';
  c.stroke();
  c.restore();
}

/**
 * Celular da live do Chupetinha, preso num pau de selfie sobre a cabeça.
 * A posição vem de phoneBox, a mesma caixa que o combate usa.
 */
export function drawLivePhone(c, f, frame) {
  const r = f.res;
  if (!r || f.state === 'ko') return;
  const b = phoneBox(f);
  const cx = (b.l + b.r) / 2;
  const cy = GY - (b.b + b.t) / 2 + Math.sin(frame / 14) * 6;
  c.save();
  // pau de selfie saindo das costas
  c.strokeStyle = OUT;
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(f.x - f.face * 40, GY - f.y - 300);
  c.lineTo(cx, cy + 40);
  c.stroke();
  c.strokeStyle = '#8a8590';
  c.lineWidth = 4;
  c.stroke();
  // aparelho
  c.translate(cx, cy);
  c.rotate(Math.sin(frame / 22) * 0.06);
  c.fillStyle = '#1c1820';
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  c.beginPath();
  c.roundRect(-34, -50, 68, 100, 10);
  c.fill();
  c.stroke();
  const live = r.live;
  c.fillStyle = live ? '#ffd6ea' : '#4a4652';
  c.fillRect(-26, -40, 52, 78);
  if (live) {
    // selo AO VIVO e barras de sinal
    c.fillStyle = '#e8243c';
    c.fillRect(-46, -86, 92, 28);
    c.strokeRect(-46, -86, 92, 28);
    c.fillStyle = '#fff';
    c.font = "bold 18px Impact, 'Arial Black', sans-serif";
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(frame % 40 < 28 ? '● AO VIVO' : 'AO VIVO', 0, -72);
    for (let i = 0; i < LIVE.signal; i++) {
      c.fillStyle = i < r.signal ? '#2a9d4a' : '#a59c92';
      c.fillRect(-20 + i * 14, 24 - i * 9, 10, 10 + i * 9);
    }
    // corações subindo
    for (let k = 0; k < 3; k++) {
      const t = ((frame + k * 23) % 70) / 70;
      c.globalAlpha = 1 - t;
      c.fillStyle = '#ff4fa0';
      c.font = "bold 22px Impact, sans-serif";
      c.fillText('♥', 34 + k * 8, -40 - t * 90);
    }
    c.globalAlpha = 1;
  } else {
    // tela rachada
    c.strokeStyle = '#d8d0dc';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-20, -30); c.lineTo(4, -2); c.lineTo(-10, 18); c.moveTo(4, -2); c.lineTo(22, 10);
    c.stroke();
    if (r.offT > 0) {
      c.fillStyle = '#9ff5e8';
      c.font = "bold 16px Impact, 'Arial Black', sans-serif";
      c.textAlign = 'center';
      c.fillText('SEM SINAL', 0, -66);
    }
  }
  c.restore();
}

/** Carimbo de decreto voando: base escura, tinta vermelha e a palavra DECRETO. */
export function drawStamp(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineWidth = 4;
  c.strokeStyle = OUT;
  c.fillStyle = '#6b4a2a';
  c.fillRect(-7, -38, 14, 26);
  c.strokeRect(-7, -38, 14, 26);
  c.fillStyle = '#3a3036';
  c.beginPath();
  c.roundRect(-30, -14, 60, 26, 5);
  c.fill();
  c.stroke();
  c.fillStyle = '#c8102e';
  c.fillRect(-28, 10, 56, 10);
  c.restore();
}

/** Cerca de Separação: grade de ferro com placa de decreto; racha conforme apanha. */
export function drawFence(c, e, gy) {
  const top = gy - e.h;
  c.save();
  c.lineWidth = 5;
  c.strokeStyle = OUT;
  c.fillStyle = '#7a7f86';
  for (let i = -1; i <= 1; i++) {
    c.fillRect(e.x + i * 16 - 4, top, 8, e.h);
    c.strokeRect(e.x + i * 16 - 4, top, 8, e.h);
  }
  for (const yy of [top + 30, gy - 40]) {
    c.fillRect(e.x - 30, yy, 60, 10);
    c.strokeRect(e.x - 30, yy, 60, 10);
  }
  // poste com a placa do decreto, acima da grade
  c.fillStyle = '#7a7f86';
  c.fillRect(e.x - 4, top - 150, 8, 150);
  c.strokeRect(e.x - 4, top - 150, 8, 150);
  c.fillStyle = '#f4e9c9';
  c.fillRect(e.x - 60, top - 190, 120, 56);
  c.strokeRect(e.x - 60, top - 190, 120, 56);
  c.fillStyle = '#c8102e';
  c.font = "bold 18px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('DECRETO', e.x, top - 172);
  c.fillStyle = OUT;
  c.font = "bold 13px Impact, 'Arial Black', sans-serif";
  c.fillText('CADA UM NO SEU LUGAR', e.x, top - 150);
  if (e.hp < 3) {
    c.strokeStyle = '#f4e9c9';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(e.x - 20, top + 120); c.lineTo(e.x + 6, top + 150); c.lineTo(e.x - 8, top + 175);
    c.stroke();
  }
  c.restore();
}

/** Cabine de banheiro químico gigante da Fiscalização, com a placa de exigência de documento. */
export function drawCabin(c, e, gy, frame) {
  const w = e.w;
  const h = e.h;
  const l = e.x - w / 2;
  const top = gy - h;
  const wob = e.age < 12 ? (12 - e.age) * 1.5 * Math.sin(e.age * 2) : 0;
  c.save();
  c.translate(wob, 0);
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  // corpo azul e telhado
  c.fillStyle = '#2f7fd1';
  c.fillRect(l, top + 24, w, h - 24);
  c.strokeRect(l, top + 24, w, h - 24);
  c.fillStyle = '#f4f2ee';
  c.beginPath();
  c.moveTo(l - 8, top + 28);
  c.quadraticCurveTo(e.x, top - 10, l + w + 8, top + 28);
  c.closePath();
  c.fill();
  c.stroke();
  // porta
  c.fillStyle = '#2768b0';
  c.fillRect(l + 18, top + 52, w - 36, h - 62);
  c.strokeRect(l + 18, top + 52, w - 36, h - 62);
  c.fillStyle = frame % 50 < 25 ? '#e8243c' : '#9a1424';
  c.fillRect(l + w - 40, top + 160, 14, 26);
  // placa
  c.fillStyle = '#f4e9c9';
  c.fillRect(l + 10, top + 70, w - 20, 74);
  c.strokeRect(l + 10, top + 70, w - 20, 74);
  c.fillStyle = '#c8102e';
  c.font = "bold 17px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('FISCALIZAÇÃO', e.x, top + 88);
  c.fillStyle = OUT;
  c.font = "bold 14px Impact, 'Arial Black', sans-serif";
  c.fillText('SÓ ENTRA COM', e.x, top + 110);
  c.fillText('DOCUMENTO', e.x, top + 128);
  // rachaduras conforme apanha
  if (e.hp < 5) {
    c.strokeStyle = '#d8eaff';
    c.lineWidth = 3;
    c.beginPath();
    for (let k = 0; k < 5 - e.hp; k++) {
      const cx = l + 30 + ((k * 47) % (w - 50));
      c.moveTo(cx, top + 170 + k * 22);
      c.lineTo(cx + 18, top + 196 + k * 22);
      c.lineTo(cx + 4, top + 220 + k * 22);
    }
    c.stroke();
  }
  c.restore();
}

/** Selo PROIBIDO sobre a cabeça de quem levou o Carimbo de Decreto. */
export function drawBanStamp(c, f, labels) {
  const ban = f.status.ban;
  if (!ban || f.state === 'ko') return;
  const x = f.x;
  const y = GY - f.y - 560;
  c.save();
  c.translate(x, y);
  c.rotate(-0.12);
  c.strokeStyle = '#c8102e';
  c.lineWidth = 6;
  c.fillStyle = 'rgba(244,233,201,.92)';
  c.beginPath();
  c.roundRect(-120, -34, 240, 68, 8);
  c.fill();
  c.stroke();
  c.fillStyle = '#c8102e';
  c.font = "bold 22px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`PROIBIDO: ${labels[ban.what] || ban.what}`, 0, -8);
  c.font = "bold 18px Impact, 'Arial Black', sans-serif";
  c.fillText(`${Math.ceil(ban.t / 60)} s`, 0, 18);
  c.restore();
}

function suitcase(c, w, h) {
  c.lineWidth = 5;
  c.strokeStyle = OUT;
  c.fillStyle = '#8a5a2a';
  c.beginPath();
  c.roundRect(-w / 2, -h / 2, w, h, 8);
  c.fill();
  c.stroke();
  c.fillStyle = '#d8b25a';
  c.fillRect(-w / 2, -5, w, 10);
  c.strokeRect(-w / 2, -5, w, 10);
  c.beginPath();
  c.moveTo(-14, -h / 2);
  c.lineTo(-14, -h / 2 - 12);
  c.lineTo(14, -h / 2 - 12);
  c.lineTo(14, -h / 2);
  c.stroke();
  // etiqueta de bagagem
  c.fillStyle = '#f4e9c9';
  c.fillRect(w / 2 - 26, -h / 2 + 6, 20, 14);
}

/** Malas do Fujão: esquecida no chão, voando ou despencando do céu. */
export function drawBag(c, e, x, y, gy, frame) {
  c.save();
  if (e.kind === 'mala') {
    c.translate(x, gy - 22);
    suitcase(c, e.w, 44);
  } else if (e.kind === 'mala-voando') {
    c.translate(x, y);
    c.rotate(frame * 0.3 * e.dir);
    suitcase(c, e.w, e.h);
  } else {
    // aviso no chão e a mala caindo até o fim da espera
    const t = e.delay > 0 ? 1 - e.delay / (e.delay0 || 20) : 1;
    c.strokeStyle = 'rgba(200,16,46,.85)';
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(x, gy, (e.w / 2) * (0.5 + t * 0.5), 18, 0, 0, Math.PI * 2);
    c.stroke();
    c.translate(x, -120 + (gy - 60 + 120) * t * t);
    c.rotate(t * 2.4);
    suitcase(c, 130, 90);
  }
  c.restore();
}

/** Capanga do Pai do Fujão: terno preto, óculos escuros, correndo. */
export function drawHenchman(c, e, gy, frame) {
  c.save();
  c.translate(e.x, gy);
  c.scale(e.dir, 1);
  const step = Math.sin(frame * 0.6) * 18;
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  c.lineCap = 'round';
  // pernas
  c.strokeStyle = '#1c1820';
  c.lineWidth = 22;
  c.beginPath();
  c.moveTo(0, -120); c.lineTo(-20 + step, 0);
  c.moveTo(0, -120); c.lineTo(20 - step, 0);
  c.stroke();
  // corpo
  c.fillStyle = '#26222c';
  c.strokeStyle = OUT;
  c.lineWidth = 5;
  c.beginPath();
  c.roundRect(-38, -250, 76, 140, 14);
  c.fill();
  c.stroke();
  c.fillStyle = '#f4f0ea';
  c.beginPath();
  c.moveTo(-10, -250); c.lineTo(0, -200); c.lineTo(10, -250);
  c.fill();
  // cabeça e óculos
  c.fillStyle = '#c9946c';
  c.beginPath();
  c.arc(4, -282, 30, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = OUT;
  c.fillRect(-6, -292, 40, 12);
  c.restore();
}

/** Maço de dinheiro voando (Rachadinha). */
export function drawCash(c, x, y, frame, dir) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(frame * 0.5) * 0.25 * dir);
  c.lineWidth = 4;
  c.strokeStyle = OUT;
  c.fillStyle = '#6fbf6a';
  c.fillRect(-34, -20, 68, 40);
  c.strokeRect(-34, -20, 68, 40);
  c.fillStyle = '#d8b25a';
  c.fillRect(-8, -20, 16, 40);
  c.fillStyle = '#2f6a2c';
  c.font = "bold 18px Impact, sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('$', -20, 0);
  c.fillText('$', 20, 0);
  c.restore();
}

/** Área da tornozeleira no chão, com o aviso; pisca quando ele está quase saindo. */
export function drawAnkleZone(c, f, zoneX, zoneR, frame) {
  if (f.state === 'ko') return;
  const near = Math.abs(f.x - zoneX) > zoneR - 90;
  c.save();
  c.setLineDash([22, 14]);
  c.lineWidth = 6;
  c.strokeStyle = near && frame % 20 < 10 ? 'rgba(255,90,74,.95)' : 'rgba(159,245,232,.75)';
  c.beginPath();
  c.ellipse(zoneX, GY + 10, zoneR, 34, 0, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = 'rgba(159,245,232,.9)';
  c.font = "bold 22px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.fillText('ÁREA DA TORNOZELEIRA', zoneX, GY + 72);
  // a própria tornozeleira no pé dele
  c.fillStyle = '#1c1820';
  c.fillRect(f.x - 22, GY - f.y - 34, 44, 18);
  c.fillStyle = frame % 40 < 20 ? '#7dff8a' : '#2a6a30';
  c.beginPath();
  c.arc(f.x + 12, GY - f.y - 25, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Manchete em balão sobre o Laranjão e as cópias dele. */
export function drawHeadline(c, x, y, text) {
  c.save();
  c.font = "bold 22px Impact, 'Arial Black', sans-serif";
  const w = Math.max(160, c.measureText(text).width + 30);
  c.fillStyle = '#f4f0ea';
  c.strokeStyle = OUT;
  c.lineWidth = 4;
  c.beginPath();
  c.roundRect(x - w / 2, y - 26, w, 44, 6);
  c.fill();
  c.stroke();
  c.fillStyle = '#c8102e';
  c.fillRect(x - w / 2, y - 26, w, 8);
  c.fillStyle = OUT;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x, y + 2);
  c.restore();
}

/** Tuíte voando: balão azul com um passarinho e texto em caixa alta. */
export function drawTweet(c, x, y, dir, frame) {
  c.save();
  c.translate(x, y + Math.sin(frame * 0.4) * 4);
  c.lineWidth = 4;
  c.strokeStyle = OUT;
  c.fillStyle = '#5ab0f0';
  c.beginPath();
  c.roundRect(-58, -30, 116, 60, 14);
  c.fill();
  c.stroke();
  c.fillStyle = '#fff';
  c.font = "bold 18px Impact, sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('URGENTE!!!', 8 * dir, 0);
  c.beginPath();
  c.arc(-40 * dir, -12, 8, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Muralha dourada do THE WALL, com rachaduras conforme apanha. */
export function drawGoldWall(c, e, gy) {
  const l = e.x - e.w / 2;
  const top = gy - e.h;
  const rise = Math.min(1, e.age / 10);
  c.save();
  c.translate(0, (1 - rise) * e.h);
  c.lineWidth = 6;
  c.strokeStyle = OUT;
  const g = c.createLinearGradient(l, 0, l + e.w, 0);
  g.addColorStop(0, '#b8862a');
  g.addColorStop(0.5, '#f3d26a');
  g.addColorStop(1, '#b8862a');
  c.fillStyle = g;
  c.fillRect(l, top, e.w, e.h);
  c.strokeRect(l, top, e.w, e.h);
  c.strokeStyle = 'rgba(90,60,10,.6)';
  c.lineWidth = 3;
  for (let y = top + 50; y < gy; y += 50) {
    c.beginPath();
    c.moveTo(l, y);
    c.lineTo(l + e.w, y);
    c.stroke();
  }
  c.fillStyle = OUT;
  c.font = "bold 30px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.save();
  c.translate(e.x, top + e.h / 2);
  c.rotate(-Math.PI / 2);
  c.fillText('THE WALL', 0, 10);
  c.restore();
  if (e.hp < 6) {
    c.strokeStyle = '#fff6d0';
    c.lineWidth = 4;
    c.beginPath();
    for (let k = 0; k < 6 - e.hp; k++) {
      const y = top + 80 + k * 90;
      c.moveTo(l + 10, y);
      c.lineTo(e.x, y + 30);
      c.lineTo(l + e.w - 10, y + 10);
    }
    c.stroke();
  }
  c.restore();
}

/** Carimbo DEMITIDO no lugar de quem foi banido da realidade. */
export function drawFired(c, f, frame) {
  const x = f.x;
  const y = GY - 260;
  c.save();
  c.globalAlpha = 0.35 + 0.25 * Math.sin(frame / 5);
  c.strokeStyle = '#f4f0ea';
  c.setLineDash([12, 10]);
  c.lineWidth = 4;
  c.strokeRect(x - 80, GY - 480, 160, 480);
  c.restore();
  c.save();
  c.translate(x, y);
  c.rotate(-0.2);
  c.strokeStyle = '#c8102e';
  c.lineWidth = 8;
  c.strokeRect(-150, -46, 300, 92);
  c.fillStyle = '#c8102e';
  c.font = "bold 58px Impact, 'Arial Black', sans-serif";
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('DEMITIDO', 0, 4);
  c.restore();
}

/** Brilho dourado em volta do Laranjão enquanto tem armadura da Tarifa. */
export function drawGoldArmor(c, f, frame) {
  if (!f.res?.armor || f.state === 'ko') return;
  c.save();
  c.strokeStyle = `rgba(243,210,106,${0.5 + 0.3 * Math.sin(frame / 6)})`;
  c.lineWidth = 8;
  c.beginPath();
  c.ellipse(f.x, GY - f.y - 240, 110, 270, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

/** Bola de fogo do Djabo. */
export function drawFireball(c, x, y, frame) {
  c.save();
  c.translate(x, y);
  for (const [r, col] of [[48, 'rgba(255,90,20,.45)'], [34, '#ff6a1a'], [20, '#ffd25a']]) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(Math.sin(frame * 0.7) * 3, 0, r + Math.sin(frame * 0.9) * 3, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Coluna do Inferno: aviso no chão e, no fim da espera, uma coluna de fogo subindo. */
export function drawFireColumn(c, e, gy, frame) {
  c.save();
  if (e.delay > 0) {
    const t = 1 - e.delay / (e.delay0 || 30);
    c.strokeStyle = frame % 8 < 4 ? '#ff6a1a' : '#ffd25a';
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(e.x, gy, (e.w / 2) * (0.4 + 0.6 * t), 20, 0, 0, Math.PI * 2);
    c.stroke();
  } else {
    const h = Math.min(e.h, 120 + e.age * 60);
    const g = c.createLinearGradient(0, gy, 0, gy - h);
    g.addColorStop(0, '#ffd25a');
    g.addColorStop(0.5, '#ff6a1a');
    g.addColorStop(1, 'rgba(200,30,10,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(e.x - e.w / 2, gy);
    for (let k = 0; k <= 8; k++) c.lineTo(e.x - e.w / 2 + (k * e.w) / 8 + Math.sin(frame + k) * 10, gy - h * (k % 2 ? 1 : 0.85));
    c.lineTo(e.x + e.w / 2, gy);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** Tridente arremessado, em brasa. */
export function drawThrownTrident(c, x, y, dir) {
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.strokeStyle = '#3a0e0e';
  c.lineWidth = 10;
  c.beginPath();
  c.moveTo(-80, 0);
  c.lineTo(40, 0);
  c.stroke();
  c.strokeStyle = '#ff6a1a';
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(40, -24); c.lineTo(40, 24);
  c.moveTo(40, -24); c.lineTo(80, -24);
  c.moveTo(40, 0); c.lineTo(90, 0);
  c.moveTo(40, 24); c.lineTo(80, 24);
  c.stroke();
  c.restore();
}

/** Chão em chamas do Inferno Nacional (o trecho seguro fica sem fogo). */
export function drawFloorFire(c, e, gy, frame) {
  const l = e.x - e.w / 2;
  c.save();
  c.globalAlpha = e.delay > 0 ? 0.4 : 1;
  for (let x = l; x < l + e.w; x += 28) {
    const h = 50 + Math.sin(frame * 0.4 + x * 0.05) * 22 + ((x * 7) % 30);
    const g = c.createLinearGradient(0, gy, 0, gy - h);
    g.addColorStop(0, '#ffd25a');
    g.addColorStop(1, 'rgba(255,90,20,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, gy + 6);
    c.quadraticCurveTo(x + 14, gy - h, x + 28, gy + 6);
    c.fill();
  }
  c.restore();
}

/** Asas de demônio atrás do Djabo na segunda fase. */
export function drawWings(c, f, frame) {
  const flap = Math.sin(frame / 8) * 0.18;
  c.save();
  c.translate(f.x, GY - f.y - 330);
  for (const s of [-1, 1]) {
    c.save();
    c.scale(s, 1);
    c.rotate(-0.2 + flap);
    c.fillStyle = '#3a0e12';
    c.strokeStyle = OUT;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(170, -120);
    c.lineTo(150, -20);
    c.lineTo(200, 10);
    c.lineTo(140, 40);
    c.lineTo(160, 90);
    c.lineTo(40, 60);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }
  c.restore();
}
