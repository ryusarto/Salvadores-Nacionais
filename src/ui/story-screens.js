import {drawEventStage} from '../render/event-stage.js';
import {buildStage} from '../render/stage.js';
import {drawStageArt} from '../render/stage-packs.js';
import {encounterStage} from '../data/stages.js';
import { ALL, HEROES } from '../data/characters/index.js';
import { COMIC as P } from '../render/comic-ui.js';
import { RETRO as R, ptext, pwrap, pixelPortrait, navyBackground, pixelBox, playerTag } from '../render/retro-ui.js';
import { controlsHint, faceFlip } from './retro-screens.js';
import { drawBelemPresentation } from '../render/belem-stage.js';
import { drawAirportStage } from '../render/airport-stage.js';
import { drawMansionStage } from '../render/mansion-stage.js';
import { drawWashingtonStage } from '../render/washington-stage.js';
import { drawInfernoStage } from '../render/inferno-stage.js';

/** Cenários próprios de chefes, desenhados em código: nome e função de desenho. */
let eventLayers;
export const BOSS_STAGES = { palco: ['BELÉM — FRENTE DO PALCO', (c, cam, f) => drawEventStage(c, eventLayers ??= buildStage(), cam, f, 'palco')], banheiros: ['BELÉM — BANHEIROS QUÍMICOS', (c, cam, f) => drawEventStage(c, eventLayers ??= buildStage(), cam, f, 'banheiros')], aeroporto: ['AEROPORTO', drawAirportStage], mansao: ['MANSÃO', drawMansionStage], washington: ['WASHINGTON, D.C.', drawWashingtonStage], inferno: ['INFERNO', drawInfernoStage] };
import { currentChapter, currentFight, talkLines } from './story.js';

/** Telas de texto do Modo História, no mesmo visual clássico do menu e do mapa. */

const W = 1920;

/** Título da tela à esquerda e local/capítulo à direita, sobre um filete dourado. */
function banner(c, title, sub) {
  ptext(c, title, 60, 72, 7, 'gold', 'left', sub ? 1150 : 1800);
  if (sub) ptext(c, sub, 1860, 72, 4, 'cyan', 'right', 620);
  c.fillStyle = R.yellow; c.fillRect(40, 118, 1840, 4);
  c.fillStyle = '#d84010'; c.fillRect(40, 122, 1840, 4);
}

/** Texto corrido dentro de uma caixa; reduz a letra quando a fala é longa. */
function caption(c, text, x, y, width, height, style = 'cream') {
  let u = 4;
  let lines = pwrap(text, width, u);
  if (lines.length * u * 11.5 > height) { u = 3; lines = pwrap(text, width, u); }
  lines.forEach((l, i) => ptext(c, l, x, y + i * u * 11.5, u, style, 'left'));
}

const shortName = (ch) => ch.name.split(',')[0];

/** Retrato pixelado; sem arte ainda, uma silhueta azul com o nome. */
function figure(c, ch, x, y, w, h, face) {
  if (pixelPortrait(c, ch.id, x, y, w, h, faceFlip(ch.id, face))) return;
  c.save();
  c.fillStyle = '#060c50';
  c.beginPath();
  c.ellipse(x + w / 2, y + h * 0.3, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x + w * 0.12, y + h);
  c.quadraticCurveTo(x + w * 0.16, y + h * 0.48, x + w / 2, y + h * 0.46);
  c.quadraticCurveTo(x + w * 0.84, y + h * 0.48, x + w * 0.88, y + h);
  c.fill();
  c.restore();
  ptext(c, '?', x + w / 2, y + h * 0.3, Math.max(4, Math.round(h / 60)), 'gold');
  ptext(c, ch.name, x + w / 2, y + h * 0.7, 4, 'creamOut', 'center', w * 0.8);
}
const heroOf = (a) => HEROES[a.hero];

/** Bandeirolas e bandeira com as cores da bandeira trans sobre o quadro do cenário. */
const TRANS = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'];
function drawPrideBunting(c, x, y, w, frame) {
  c.save();
  c.strokeStyle = P.ink;
  c.lineWidth = 4;
  for (const [row, sag] of [[40, 50], [110, 40]]) {
    c.beginPath();
    c.moveTo(x, y + row);
    c.quadraticCurveTo(x + w / 2, y + row + sag * 2, x + w, y + row);
    c.stroke();
    for (let i = 0; i < 18; i++) {
      const t = (i + 0.5) / 18;
      const px = x + t * w;
      const py = y + row + sag * 4 * t * (1 - t);
      c.fillStyle = TRANS[i % TRANS.length];
      c.beginPath();
      c.moveTo(px - 22, py);
      c.lineTo(px + 22, py);
      c.lineTo(px, py + 48 + Math.sin(frame / 10 + i) * 4);
      c.closePath();
      c.fill();
      c.stroke();
    }
  }
  // bandeira grande no mastro, à direita
  const fx = x + w - 230;
  const fy = y + 170;
  c.fillStyle = P.ink;
  c.fillRect(fx - 8, fy - 10, 8, 270);
  TRANS.forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    const y0 = fy + i * 30;
    c.moveTo(fx, y0);
    for (let k = 0; k <= 10; k++) c.lineTo(fx + k * 20, y0 + Math.sin(frame / 9 + k * 0.6) * 6);
    for (let k = 10; k >= 0; k--) c.lineTo(fx + k * 20, y0 + 30 + Math.sin(frame / 9 + k * 0.6) * 6);
    c.closePath();
    c.fill();
  });
  c.strokeRect(fx, fy, 200, 150);
  c.restore();
}

/** Quadros do final da turnê, desenhados sobre o quadro do cenário. */
function drawFinale(c, page, x, y, w, h, frame, hero) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  if (page === 1) {
    // o grande show: todos os Salvadores no palco
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#2b1a4e');
    g.addColorStop(1, '#c8577a');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = `rgba(255,236,170,${0.25 + 0.15 * Math.sin(frame / 10 + i)})`;
      c.beginPath();
      c.moveTo(x + 100 + i * 180, y);
      c.lineTo(x + 40 + i * 180, y + h);
      c.lineTo(x + 180 + i * 180, y + h);
      c.closePath();
      c.fill();
    }
    c.fillStyle = P.ink;
    c.fillRect(x, y + h - 90, w, 90);
    HEROES.forEach((ch, i) => {
      const bob = Math.sin(frame / 7 + i) * 6;
      figure(c, ch, x + 10 + i * 130, y + 130 + bob, 150, 200, i % 2 ? -1 : 1);
    });
  } else if (page === 2 || page === 3) {
    // mesas cheias pelo mundo
    c.fillStyle = page === 3 ? '#f3c426' : '#f4e9c9';
    c.fillRect(x, y, w, h);
    const flags = [['#009c3b', '#ffdf00'], ['#2b3a6e', '#c8102e'], ['#ce1126', '#ffffff'], ['#000000', '#dd0000'], ['#ff9933', '#138808'], ['#de2910', '#ffde00']];
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 4; i++) {
        const tx = x + 60 + i * 255;
        const ty = y + 120 + r * 170;
        c.fillStyle = '#8a5a2a';
        c.fillRect(tx, ty + 40, 200, 18);
        c.fillRect(tx + 10, ty + 58, 12, 50);
        c.fillRect(tx + 178, ty + 58, 12, 50);
        for (let k = 0; k < 4; k++) {
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.ellipse(tx + 30 + k * 46, ty + 34, 20, 9, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = ['#e0662a', '#5aa05a', '#d8b25a', '#c8342a'][(k + i + r) % 4];
          c.beginPath();
          c.arc(tx + 30 + k * 46, ty + 28 + Math.sin(frame / 9 + k) * 2, 10, 0, Math.PI * 2);
          c.fill();
        }
        const [f1, f2] = flags[(i + r * 4) % flags.length];
        c.fillStyle = f1;
        c.fillRect(tx + 70, ty - 50, 60, 20);
        c.fillStyle = f2;
        c.fillRect(tx + 70, ty - 30, 60, 20);
        c.strokeStyle = P.ink;
        c.lineWidth = 3;
        c.strokeRect(tx + 70, ty - 50, 60, 40);
      }
    }
    if (page === 3) {
      c.save();
      c.translate(x + w / 2, y + h / 2);
      c.rotate(-0.06);
      pixelBox(c, -470, -80, 940, 160, R.red, R.yellow, 8);
      ptext(c, 'A FOME ACABOU!', 0, 0, 12, 'creamOut', 'center', 880);
      c.restore();
    }
  } else if (page === 4) {
    c.fillStyle = P.yellow;
    c.fillRect(x, y, w, h);
    figure(c, hero, x + w / 2 - 170, y + 10, 340, 450, 1);
  } else {
    c.fillStyle = P.ink;
    c.fillRect(x, y, w, h);
    ptext(c, 'SALVADORES NACIONAIS', x + w / 2, y + 150, 8, 'gold', 'center', w - 80);
    ptext(c, 'A TURNÊ CONTRA A FOME', x + w / 2, y + 240, 5, 'creamOut', 'center', w - 80);
    ptext(c, 'FIM', x + w / 2, y + 340, 12, 'red', 'center');
  }
  c.restore();
}

/** Abertura e fechamento: uma página por vez, com o quadro do cenário e a legenda. */
function pages(c, a, closing, keys) {
  navyBackground(c);
  const run = a.story;
  const ch = currentChapter(run);
  banner(c, closing ? (ch.boss === 'djabo' ? 'O FIM DA FOME' : 'O EVENTO ACONTECE') : 'A TURNÊ CONTRA A FOME', `CAPÍTULO ${ch.n} • ${ch.place}`);
  const hero = heroOf(a);
  const boss = ALL[ch.boss];
  const who = closing && run.page === 0 && boss ? boss : hero;
  c.save(); c.beginPath(); c.rect(0, 140, 690, 940); c.clip();
  figure(c, who, 20, 190, 640, 853, who === hero ? 1 : -1);
  c.restore();
  ptext(c, who === hero ? '1P' : 'CHEFE', 40, 175, 5, who === hero ? 'cyan' : 'red', 'left');
  // quadro do cenário
  pixelBox(c, 745, 160, 1100, 480, '#000', R.cream, 6);
  if (!drawStageThumb(c, {stage:encounterStage(a)}, 765, 180, 1060, 440) && !drawBelemPresentation(c, 'miniatura', 765, 180, 1060, 440)) {
    ptext(c, ch.place, 1295, 400, 6, 'gold', 'center', 1000);
  }
  if (closing && ch.boss === 'pavanassi' && run.page >= 1) drawPrideBunting(c, 765, 180, 1060, a.frame);
  if (closing && ch.boss === 'djabo' && run.page >= 1) drawFinale(c, run.page, 765, 180, 1060, 440, a.frame, hero);
  // legenda
  pixelBox(c, 700, 665, 1190, 330, '#000428', '#5878ff', 6);
  caption(c, a.storyPages[run.page] || '', 745, 715, 1100, 230);
  ptext(c, `${run.page + 1} / ${a.storyPages.length}`, 1855, 965, 3, 'gold', 'right');
  controlsHint(c, 1045, keys, 'AVANÇAR', 'VOLTAR');
}

/** Diálogo antes da luta: o herói à esquerda, o rival à direita, quem fala em destaque. */
function talk(c, a, keys) {
  navyBackground(c);
  const run = a.story;
  const f = currentFight(run);
  const lines = talkLines(run);
  const line = lines[Math.min(run.page, lines.length - 1)];
  const hero = heroOf(a);
  const foe = ALL[f.foe];
  const ch = currentChapter(run);
  banner(c, `CHEFE — ${foe.name}`, ch.place);
  const speaking = (ch_) => line.who === ch_.id;
  c.save(); c.beginPath(); c.rect(0, 140, W, 940); c.clip();
  for (const [ch_, x, face] of [[hero, -40, 1], [foe, 1360, -1]]) {
    c.save();
    if (line.who && !speaking(ch_)) c.globalAlpha = 0.35;
    figure(c, ch_, x, 200, 600, 800, face);
    c.restore();
  }
  c.restore();
  ptext(c, '1P', 40, 175, 5, 'cyan', 'left');
  ptext(c, 'CHEFE', 1880, 175, 5, 'red', 'right');
  // caixa do narrador (em cima) ou de fala (embaixo, com o nome de quem fala)
  const narrator = !line.who;
  const bx = 520, bw = 880;
  const by = narrator ? 180 : 690;
  const bh = narrator ? 280 : 290;
  pixelBox(c, bx, by, bw, bh, narrator ? '#000428' : '#000', narrator ? R.yellow : R.cream, 6);
  if (!narrator) {
    const left = line.who === hero.id;
    playerTag(c, shortName(ALL[line.who]).toUpperCase(), bx + 26, by - 40, left ? R.red : R.blue, 5);
  } else ptext(c, 'NARRADOR', bx + 30, by + 34, 3, 'yellow', 'left');
  caption(c, line.say, bx + 40, by + (narrator ? 84 : 66), bw - 80, bh - 110, narrator ? 'cream' : 'creamOut');
  ptext(c, `${run.page + 1} / ${lines.length}`, bx + bw - 26, by + bh - 28, 3, 'gold', 'right');
  controlsHint(c, 1045, keys, 'AVANÇAR', 'VOLTAR');
}

/** Derrota na turnê: continuar a mesma luta ou desistir. */
function lose(c, a, keys) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 1080);
  const run = a.story;
  const foe = ALL[currentFight(run).foe];
  c.save(); c.beginPath(); c.rect(0, 0, 760, 1080); c.clip();
  figure(c, foe, 20, 168, 680, 907, 1);
  c.restore();
  ptext(c, 'DERROTA', 1305, 225, 16, 'red');
  pixelBox(c, 820, 339, 995, 200, '#000', R.yellow, 6);
  ptext(c, 'A TURNÊ NÃO PODE PARAR.', 1317, 405, 5, 'gold', 'center', 920);
  ptext(c, `CONTINUES USADOS: ${run.continues}`, 1317, 475, 4, 'cream', 'center', 920);
  ['CONTINUAR', 'DESISTIR'].forEach((label, i) => {
    const sel = a.cur === i;
    const y = 652 + i * 91;
    const w = ptext(c, label, 1305, y, sel ? 8 : 7, sel ? 'gold' : 'silver');
    if (sel && a.frame % 30 < 20) ptext(c, '▶', 1305 - w / 2 - 50, y, 7, 'gold');
  });
  ptext(c, 'CONTINUAR RECOMEÇA A MESMA LUTA', 1305, 900, 3, 'dim');
  controlsHint(c, 1045, keys, 'CONFIRMAR', null);
}

/** Miniatura do cenário próprio de um chefe (aeroporto). Retorna false para usar a de Belém. */
export function drawStageThumb(c, ch, x, y, w, h) {
  const stage = BOSS_STAGES[ch?.stage];
  if (!stage) return false;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.translate(x, y);
  c.scale(w / 1920, h / 1080);
  if (!drawStageArt(c, ch.stage, 680)) stage[1](c, 680, 0);
  c.restore();
  return true;
}

/** Nome do lugar do capítulo atual, para a tela de versus. */
export const storyPlace = (a) => currentChapter(a.story).place;

/** Selo na tela de versus mostrando em que ponto da turnê a luta está. */
export function drawStoryVsTag(c, a) {
  const f = currentFight(a.story);
  const label = 'CHEFE DA TURNÊ';
  c.save();
  c.translate(W / 2, 660);
  pixelBox(c, -260, -42, 520, 84, f.kind === 'boss' ? R.red : R.yellow, R.yellow, 6);
  ptext(c, label, 0, 0, 5, 'creamOut', 'center', 470);
  c.restore();
}

/** Desenha a tela do Modo História atual. Retorna false se não for uma delas. */
export function drawStoryScreen(c, a, keys) {
  if (!a.story) return false;
  switch (a.screen) {
    case 'storyIntro': pages(c, a, false, keys); return true;
    case 'storyEnd': pages(c, a, true, keys); return true;
    case 'storyTalk': talk(c, a, keys); return true;
    case 'storyLose': lose(c, a, keys); return true;
    default: return false;
  }
}
