import { SYS } from '../data/system.js';
import { text, burst, slab } from './draw.js';
import { drawSpriteEffect, hasSpriteStrip } from './sprites.js';
import { drawChapuhEntity } from './chapuh-art.js';

/**
 * Efeitos visuais. Lê os eventos que a simulação emite a cada quadro e cria
 * faíscas, poeira, onomatopeias e avisos. Não altera as regras do jogo.
 */
const GY = SYS.GROUND_Y;
const WORDS = ['POW!', 'PAH!', 'TUM!', 'CRÁS!', 'BAM!'];
const POWER = { L: 34, M: 50, H: 74, S: 70, X: 100 };

export function createFx() {
  return { parts: [], pops: [], shake: 0, flash: 0, dark: 0, banner: null, big: null, ghosts: [], n: 0 };
}

const pop = (fx, str, x, y, color, size = 54, dur = 48) => fx.pops.push({ str, x, y, color, size, t: 0, dur });
function dust(fx, x, n = 6, pow = 1) {
  for (let i = 0; i < n; i++) fx.parts.push({ k: 'dust', x: x + (Math.random() - 0.5) * 60, y: GY - 6, vx: (Math.random() - 0.5) * 9 * pow, vy: -Math.random() * 4 * pow, r: 14 + Math.random() * 18, t: 0, dur: 22 + Math.random() * 14 });
}

/** Consome os eventos do quadro. `names` traz os nomes dos lutadores para os avisos. */
export function fxEvents(fx, st) {
  for (const e of st.events) {
    const sy = GY - (e.y || 0);
    const actor = st.f[e.side];
    if (actor?.ch?.spriteProfile === 'ten-frame') {
      const name = ({ hit: 'fx-impacto', block: 'fx-defesa', land: 'fx-poeira', jump: 'fx-poeira' })[e.t]
        || (e.t === 'pop' && e.str === 'RAJADA!' ? 'fx-embalo' : null);
      if (name && hasSpriteStrip(actor.ch.id, name)) fx.parts.push({ k: 'sprite', id: actor.ch.id, name, x: e.x, y: name === 'fx-poeira' ? GY - 35 : e.t === 'pop' ? GY - 350 : sy, r: name === 'fx-poeira' ? 320 : 240, t: 0, dur: 20 });
    }
    switch (e.t) {
      case 'hit': {
        const r = POWER[e.power] || 50;
        fx.parts.push({ k: 'spark', x: e.x, y: sy, r: e.super ? 130 : r, t: 0, dur: 14, color: e.super ? '#fff' : e.power === 'L' ? '#ffe98a' : '#ffb13d', rot: Math.random() * 3 });
        fx.shake = Math.max(fx.shake, e.super ? 22 : r / 5);
        if (e.ctr) pop(fx, e.ctr === 'punish' ? 'PUNIÇÃO!' : 'CONTRA!', e.x, sy - 120, '#ff5a4a', 50);
        else if (e.power !== 'L' && e.power !== 'M' && !e.super) pop(fx, WORDS[fx.n++ % WORDS.length], e.x + 40, sy - 90, '#ffe14a', 58, 30);
        for (let i = 0; i < 5; i++) fx.parts.push({ k: 'line', x: e.x, y: sy, a: Math.random() * 6.28, r: r, t: 0, dur: 12 });
        break;
      }
      case 'block': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 46, t: 0, dur: 12, color: '#bfe6ff' }); fx.shake = Math.max(fx.shake, 3); break;
      case 'parry': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 70, t: 0, dur: 16, color: '#58d6ff' }); pop(fx, 'APAROU!', e.x, sy - 110, '#58d6ff', 44); break;
      case 'perfect': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 150, t: 0, dur: 26, color: '#aef4ff' }); fx.flash = 0.6; pop(fx, 'DEFESA PERFEITA!', e.x, sy - 150, '#aef4ff', 62, 70); break;
      case 'armor': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 80, t: 0, dur: 14, color: '#ffb347' }); break;
      case 'land': dust(fx, e.x, e.hard ? 12 : 5, e.hard ? 1.5 : 0.8); if (e.hard) fx.shake = Math.max(fx.shake, 9); break;
      case 'jump': dust(fx, e.x, 5, 0.8); break;
      case 'rush': pop(fx, 'ARRANCADA!', st.f[e.side].x, GY - 520, '#7dff8a', 44); break;
      case 'burnout': pop(fx, 'SEM FÔLEGO!', st.f[e.side].x, GY - 540, '#b0b0b8', 56, 80); break;
      case 'finale': pop(fx, 'FINAL!', e.x, GY - 540, '#ffe14a', 70, 60); break;
      case 'fury': pop(fx, 'FÚRIA!', e.x, GY - 560, '#ff3b3b', 80, 90); fx.flash = 0.4; break;
      case 'freeze': pop(fx, 'ATORDOADO!', e.x, GY - 540, '#ffe14a', 60, 70); break;
      case 'shake': fx.shake = Math.max(fx.shake, e.n || 10); if (e.x != null) dust(fx, e.x + (Math.random() - 0.5) * 1600, 2, 1.2); break;
      case 'wave': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: e.r || 200, t: 0, dur: 18, color: e.color || '#fff' }); break;
      case 'splat': for (let i = 0; i < 7; i++) fx.parts.push({ k: 'paint', x: e.x + (Math.random() - 0.5) * 180, y: sy + (Math.random() - 0.5) * 240, r: 18 + Math.random() * 34, t: 0, dur: 40, color: ['#e2483d', '#f2c318', '#2a4fb8', '#2f8a3a', '#b16afc'][i % 5] }); break;
      case 'canvas': fx.parts.push({ k: 'canvas', x: e.x, t: 0, dur: 70 }); fx.flash = 0.5; break;
      case 'slip': pop(fx, 'ESCORREGOU!', e.x, GY - 500, '#ffd24a', 50, 60); dust(fx, e.x, 6); break;
      case 'dazzle': fx.parts.push({ k: 'spark', x: e.x, y: GY - 400, r: 60, t: 0, dur: 20, color: '#fff', rot: 0 }); break;
      case 'pop': pop(fx, e.str, e.x, GY - (e.y || 520), e.color || '#fff', e.size || 50, 60); break;
      case 'dizzy': pop(fx, 'TONTO!', e.x, GY - 560, '#ffe14a', 70, 80); break;
      case 'pushblock': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 120, t: 0, dur: 16, color: '#35d6c0' }); pop(fx, 'EMPURRÃO!', e.x, sy - 130, '#35d6c0', 44); break;
      case 'grab': fx.parts.push({ k: 'ring', x: e.x, y: sy, r: 50, t: 0, dur: 10, color: '#fff' }); break;
      case 'tech': pop(fx, 'ESCAPOU!', e.x, sy - 140, '#fff', 46); break;
      case 'clash': fx.parts.push({ k: 'spark', x: e.x, y: sy, r: 60, t: 0, dur: 12, color: '#fff', rot: 0 }); break;
      case 'strike':
        if (e.kind === 'ambulance') {
          // explosão da ambulância
          fx.parts.push({ k: 'spark', x: e.x, y: GY - 120, r: 340, t: 0, dur: 26, color: '#ffb13d', rot: 0 }, { k: 'spark', x: e.x, y: GY - 160, r: 220, t: 0, dur: 20, color: '#fff3b0', rot: 0.4 });
          for (let i = 0; i < 18; i++) fx.parts.push({ k: 'dust', x: e.x + (Math.random() - 0.5) * 260, y: GY - Math.random() * 200, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 12, r: 30 + Math.random() * 40, t: 0, dur: 40 + Math.random() * 20 });
          pop(fx, 'KABUM!', e.x, GY - 420, '#ff3b30', 120, 70);
          fx.shake = Math.max(fx.shake, 30);
          fx.flash = 0.7;
        } else {
          fx.parts.push({ k: 'column', x: e.x, t: 0, dur: 18 });
          fx.shake = Math.max(fx.shake, 16);
          fx.flash = 0.35;
        }
        break;
      case 'splash': dust(fx, e.x, 4, 0.6); break;
      case 'super': fx.dark = st.freeze + 14; fx.banner = { name: e.name, side: e.side, level: e.level, t: 0, dur: st.freeze + 30 }; break;
      case 'ko': fx.big = { str: 'K.O.', t: 0, dur: 130, color: '#ff2f2f' }; fx.flash = 1; fx.shake = 26; break;
      case 'timeup': fx.big = { str: 'TEMPO!', t: 0, dur: 120, color: '#ffe14a' }; break;
      case 'fight': fx.big = { str: 'LUTEM!', t: 0, dur: 50, color: '#ff2f2f' }; break;
      default: break;
    }
  }
  // rastro da Arrancada
  for (const f of st.f) if (f.state === 'rush' && st.frame % 3 === 0) fx.ghosts.push({ x: f.x, y: f.y, t: 0, dur: 14, color: '#7dff8a' });
}

/** Avança os efeitos um quadro. */
export function fxUpdate(fx) {
  for (const p of fx.parts) {
    p.t++;
    if (p.k === 'dust') {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.9;
    }
  }
  for (const p of fx.pops) p.t++;
  for (const g of fx.ghosts) g.t++;
  fx.parts = fx.parts.filter((p) => p.t < p.dur);
  fx.pops = fx.pops.filter((p) => p.t < p.dur);
  fx.ghosts = fx.ghosts.filter((g) => g.t < g.dur);
  fx.shake *= 0.82;
  if (fx.shake < 0.5) fx.shake = 0;
  fx.flash *= 0.85;
  if (fx.dark > 0) fx.dark--;
  if (fx.banner && ++fx.banner.t >= fx.banner.dur) fx.banner = null;
  if (fx.big && ++fx.big.t >= fx.big.dur) fx.big = null;
}

/** Efeitos atrás dos lutadores (mundo). */
export function fxDrawBack(c, fx) {
  for (const g of fx.ghosts) {
    c.globalAlpha = 0.35 * (1 - g.t / g.dur);
    c.fillStyle = g.color;
    c.beginPath();
    c.ellipse(g.x, GY - g.y - 240, 70, 240, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
}

/** Entidades (projéteis, marcas, poças). */
export function drawEntities(c, st) {
  for (const e of st.ents) {
    const x = e.x;
    const y = GY - e.y - e.h / 2;
    const owner = st.f[e.owner];
    if (e.kind === 'shot' && owner?.ch?.spriteProfile === 'ten-frame' && hasSpriteStrip(owner.ch.id, 'fx-ak-projetil')) {
      c.save();
      c.translate(x, y);
      c.scale(e.dir, 1);
      drawSpriteEffect(c, owner.ch.id, 'fx-ak-projetil', (e.age % 20) / 20, 0, 0, Math.max(100, e.w * 2), 80);
      c.restore();
      continue;
    }
    c.save();
    c.lineWidth = 5;
    c.strokeStyle = '#12080c';
    if (drawChapuhEntity(c, e)) { c.restore(); continue; }
    if (e.kind === 'ambulance') {
      // ambulância despencando do céu até o chão, girando, com a sirene piscando
      const t = e.delay > 0 ? 1 - e.delay / (e.delay0 || 26) : 1;
      const ay = -220 + (GY - 120 + 220) * t * t;
      c.translate(x, ay);
      c.rotate(-0.5 + t * 0.35);
      c.lineWidth = 6;
      c.fillStyle = '#f4f2ee';
      c.beginPath();
      c.roundRect(-170, -80, 340, 160, 16);
      c.fill();
      c.stroke();
      c.fillStyle = '#ff3b30';
      c.fillRect(-170, 10, 340, 26);
      c.fillRect(-28, -60, 56, 18);
      c.fillRect(-9, -79, 18, 56);
      c.fillStyle = '#7fd4ff';
      c.fillRect(90, -60, 60, 50);
      c.strokeRect(90, -60, 60, 50);
      c.fillStyle = Math.floor(st.frame / 4) % 2 ? '#ff3b30' : '#3b82ff';
      c.fillRect(-60, -104, 120, 24);
      c.strokeRect(-60, -104, 120, 24);
      c.fillStyle = '#1a1418';
      for (const wx of [-100, 100]) {
        c.beginPath();
        c.arc(wx, 84, 32, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
      if (e.delay > 0) {
        // alvo no chão
        c.save();
        c.strokeStyle = '#ff3b30';
        c.lineWidth = 6;
        c.globalAlpha = 0.5 + 0.5 * Math.sin(st.frame * 0.5);
        c.beginPath();
        c.ellipse(x, GY, e.w / 2, 26, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      continue;
    }
    if (e.behavior === 'strike') {
      const t = e.delay > 0 ? 1 - e.delay / (e.delay0 || 150) : 1;
      c.globalAlpha = e.delay > 0 ? 0.5 + 0.5 * Math.sin(st.frame * (0.2 + t * 0.6)) : 1;
      c.strokeStyle = e.color;
      c.lineWidth = 7;
      c.beginPath();
      c.ellipse(x, GY, e.w / 2, 22, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(x, GY, (e.w / 2) * (1 - t) + 10, 22 * (1 - t) + 4, 0, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(x - e.w / 2 - 16, GY);
      c.lineTo(x + e.w / 2 + 16, GY);
      c.stroke();
    } else if (e.behavior === 'puddle') {
      c.fillStyle = e.color;
      c.globalAlpha = 0.85;
      c.beginPath();
      c.ellipse(x, GY + 4, e.w / 2, 16, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    } else if (e.kind === 'vinyl') {
      // disco de vinil cortante: borda serrilhada girando
      const r = e.w / 2;
      c.translate(x, y);
      c.rotate(st.frame * 0.6);
      c.fillStyle = '#dfe6ee';
      c.beginPath();
      for (let k = 0; k < 24; k++) {
        const a = (k * Math.PI) / 12;
        const rr = k % 2 ? r * 1.22 : r * 0.98;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = '#17131c';
      c.beginPath();
      c.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#3a3344';
      c.lineWidth = 2;
      for (const q of [0.75, 0.6, 0.45]) {
        c.beginPath();
        c.arc(0, 0, r * q, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = e.color;
      c.beginPath();
      c.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      c.fill();
    } else if (e.kind === 'note') {
      text(c, '♪', x, y, e.h * 1.3, e.color);
    } else if (e.kind === 'shot') {
      c.fillStyle = e.color;
      c.beginPath();
      c.ellipse(x, y, e.w / 2 + 12, 9, Math.atan2(-e.vy, e.vx), 0, Math.PI * 2);
      c.fill();
      c.stroke();
    } else if (e.kind === 'dog') {
      c.fillStyle = '#7a4a2c';
      c.beginPath();
      c.ellipse(x, y + 8, e.w / 2, e.h / 3, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(x + e.dir * e.w * 0.42, y - 8, 18, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(x + e.dir * e.w * 0.36, y - 22);
      c.lineTo(x + e.dir * e.w * 0.44, y - 46);
      c.lineTo(x + e.dir * e.w * 0.52, y - 22);
      c.fill();
      c.stroke();
    } else if (e.kind === 'slash') {
      c.fillStyle = e.color;
      c.beginPath();
      c.ellipse(x, y, 34, e.h / 2, 0, -Math.PI / 2, Math.PI / 2);
      c.ellipse(x - 26 * e.dir, y, 30, e.h / 2.4, 0, Math.PI / 2, -Math.PI / 2, true);
      c.fill();
      c.stroke();
    } else if (e.kind === 'ice') {
      c.fillStyle = e.color;
      c.globalAlpha = 0.85;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(x + i * (e.w / 5) - 16, GY);
        c.lineTo(x + i * (e.w / 5), GY - e.h * (0.6 + 0.4 * ((i + 5) % 2)));
        c.lineTo(x + i * (e.w / 5) + 16, GY);
        c.closePath();
        c.fill();
        c.stroke();
      }
    } else {
      c.fillStyle = e.color;
      c.shadowColor = e.color;
      c.shadowBlur = 24;
      c.beginPath();
      c.ellipse(x, y, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.stroke();
    }
    c.restore();
  }
}

/** Efeitos na frente dos lutadores (mundo). */
export function fxDrawFront(c, fx) {
  for (const p of fx.parts) {
    const t = p.t / p.dur;
    c.globalAlpha = 1 - t * t;
    if (p.k === 'sprite') drawSpriteEffect(c, p.id, p.name, t, p.x, p.y, p.r);
    else if (p.k === 'spark') burst(c, p.x, p.y, p.r * (0.6 + t * 0.9), 8, p.color, 0.42, p.rot);
    else if (p.k === 'ring') {
      c.strokeStyle = p.color;
      c.lineWidth = 10 * (1 - t) + 2;
      c.beginPath();
      c.arc(p.x, p.y, p.r * (0.4 + t), 0, Math.PI * 2);
      c.stroke();
    } else if (p.k === 'line') {
      c.strokeStyle = '#fff6d0';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(p.x + Math.cos(p.a) * p.r * (0.6 + t), p.y + Math.sin(p.a) * p.r * (0.6 + t));
      c.lineTo(p.x + Math.cos(p.a) * p.r * (1.3 + t * 1.6), p.y + Math.sin(p.a) * p.r * (1.3 + t * 1.6));
      c.stroke();
    } else if (p.k === 'dust') {
      c.fillStyle = '#e8d2c0';
      c.strokeStyle = '#12080c';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(p.x, p.y, p.r * (0.5 + t * 0.7), 0, Math.PI * 2);
      c.fill();
      c.stroke();
    } else if (p.k === 'paint') {
      c.fillStyle = p.color;
      c.strokeStyle = '#12080c';
      c.lineWidth = 4;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    } else if (p.k === 'canvas') {
      // a tela de pintura onde o rival é jogado
      const s = Math.min(1, t * 5);
      c.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
      c.save();
      c.translate(p.x, GY - 330);
      c.rotate(-0.06);
      c.scale(s, s);
      c.fillStyle = '#7a4a22';
      c.strokeStyle = '#12080c';
      c.lineWidth = 8;
      c.fillRect(-230, -300, 460, 600);
      c.strokeRect(-230, -300, 460, 600);
      c.fillStyle = '#f4ecd8';
      c.fillRect(-196, -266, 392, 532);
      ['#e2483d', '#f2c318', '#2a4fb8', '#2f8a3a', '#b16afc'].forEach((col, i) => {
        c.fillStyle = col;
        c.beginPath();
        c.ellipse(-110 + i * 55, -120 + ((i * 97) % 260), 70, 46, i, 0, Math.PI * 2);
        c.fill();
      });
      c.restore();
    } else if (p.k === 'column') {
      c.fillStyle = '#fff3b0';
      c.fillRect(p.x - 110 * (1 - t), 0, 220 * (1 - t), GY);
      burst(c, p.x, GY - 40, 220 * (0.5 + t), 10, '#ffb13d', 0.5, t * 2);
    }
  }
  c.globalAlpha = 1;
  for (const p of fx.pops) {
    const t = p.t / p.dur;
    const s = t < 0.15 ? 0.5 + (t / 0.15) * 0.7 : 1.2 - Math.min(0.2, (t - 0.15) * 0.8);
    c.globalAlpha = t > 0.75 ? (1 - t) / 0.25 : 1;
    c.save();
    c.translate(p.x, p.y - t * 30);
    c.rotate(-0.1);
    text(c, p.str, 0, 0, p.size * s, p.color);
    c.restore();
  }
  c.globalAlpha = 1;
}

/** Camadas de tela cheia: escurecer no super, clarão, faixa do super, textos grandes. */
export function fxDrawScreen(c, fx, when) {
  const W = SYS.VIEW_W;
  const H = SYS.VIEW_H;
  if (when === 'under') {
    if (fx.dark > 0) {
      c.fillStyle = `rgba(8,4,18,${Math.min(0.72, fx.dark / 14)})`;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,255,255,.16)';
      c.lineWidth = 5;
      for (let i = 0; i < 26; i++) {
        const y = (i * 97 + fx.dark * 40) % H;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y - 60);
        c.stroke();
      }
    }
    return;
  }
  if (fx.flash > 0.02) {
    c.fillStyle = `rgba(255,255,255,${fx.flash})`;
    c.fillRect(0, 0, W, H);
  }
  if (fx.banner) {
    const b = fx.banner;
    const t = Math.min(1, b.t / 8);
    const x = b.side === 0 ? -900 + 960 * t : W + 60 - 960 * t;
    slab(c, x, 300, 840, 120, b.level === 3 ? '#ffcf2a' : '#e02b2b', 40);
    text(c, b.name.toUpperCase(), x + 420, 362, 82, '#fff');
  }
  if (fx.big) {
    const b = fx.big;
    const t = b.t / b.dur;
    const s = t < 0.12 ? 2.4 - (t / 0.12) * 1.4 : 1 + t * 0.12;
    c.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 1;
    c.save();
    c.translate(W / 2, H * 0.44);
    c.rotate(-0.07);
    text(c, b.str, 0, 0, 230 * s, b.color, 'center', '#12080c', 26);
    c.restore();
    c.globalAlpha = 1;
  }
}
