import { ALL, HEROES } from '../data/characters/index.js';
import { CHAPTERS } from '../data/story.js';
import { COMIC as P, comicBackground, comicPanel, comicText, comicMenuItem } from '../render/comic-ui.js';
import { drawBelemPresentation } from '../render/belem-stage.js';
import { drawAirportStage } from '../render/airport-stage.js';
import { drawMansionStage } from '../render/mansion-stage.js';
import { drawWashingtonStage } from '../render/washington-stage.js';
import { drawInfernoStage } from '../render/inferno-stage.js';

/** Cenários próprios de chefes, desenhados em código: nome e função de desenho. */
export const BOSS_STAGES = { aeroporto: ['AEROPORTO', drawAirportStage], mansao: ['MANSÃO', drawMansionStage], washington: ['WASHINGTON, D.C.', drawWashingtonStage], inferno: ['INFERNO', drawInfernoStage] };
import { portrait, footer } from './comic-screens.js';
import { currentChapter, currentFight, talkLines, nextChapter, tourComplete } from './story.js';

/** Telas do Modo História, no mesmo estilo HQ do menu. */

const W = 1920;

/** Quebra o texto em linhas que cabem em `width`. */
function wrapLines(c, str, width, size) {
  c.font = `${size}px SNComic, Impact, sans-serif`;
  const out = [];
  let line = '';
  for (const word of str.split(' ')) {
    if (line && c.measureText(line + word).width > width) {
      out.push(line.trim());
      line = '';
    }
    line += word + ' ';
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function paragraph(c, str, x, y, width, size, color = P.ink, align = 'left') {
  const ls = wrapLines(c, str, width, size);
  ls.forEach((l, i) => comicText(c, l, x, y + i * size * 1.3, size, color, align));
  return ls.length;
}

function banner(c, title, sub) {
  comicPanel(c, 55, 40, 1180, 100, P.red, 22, 5);
  comicText(c, title, 100, 92, 60, P.paper, 'left', 1090);
  if (sub) comicText(c, sub, 1850, 90, 30, P.paper, 'right', 560);
}

const shortName = (ch) => ch.name.split(',')[0];

/** Retrato HQ; chefes ainda sem retrato aparecem como silhueta com o nome. */
function figure(c, ch, x, y, w, h, face) {
  if (portrait(c, ch, x, y, w, h, face)) return;
  c.save();
  c.fillStyle = P.ink;
  c.beginPath();
  c.ellipse(x + w / 2, y + h * 0.3, w * 0.2, h * 0.14, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x + w * 0.12, y + h);
  c.quadraticCurveTo(x + w * 0.16, y + h * 0.48, x + w / 2, y + h * 0.46);
  c.quadraticCurveTo(x + w * 0.84, y + h * 0.48, x + w * 0.88, y + h);
  c.fill();
  c.restore();
  comicText(c, '?', x + w / 2, y + h * 0.3, h * 0.16, P.yellow, 'center');
  comicPanel(c, x + w * 0.15, y + h * 0.66, w * 0.7, 64, P.red, 12, 4);
  comicText(c, ch.name, x + w / 2, y + h * 0.66 + 32, 34, P.paper, 'center', w * 0.62);
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
      comicPanel(c, -470, -80, 940, 160, P.red, 24, 8);
      comicText(c, 'A FOME ACABOU!', 0, 4, 110, P.paper, 'center', 880);
      c.restore();
    }
  } else if (page === 4) {
    c.fillStyle = P.yellow;
    c.fillRect(x, y, w, h);
    figure(c, hero, x + w / 2 - 170, y + 10, 340, 450, 1);
  } else {
    c.fillStyle = P.ink;
    c.fillRect(x, y, w, h);
    comicText(c, 'SALVADORES NACIONAIS', x + w / 2, y + 150, 80, P.yellow, 'center', w - 80);
    comicText(c, 'A TURNÊ CONTRA A FOME', x + w / 2, y + 240, 46, P.paper, 'center', w - 80);
    comicText(c, 'FIM', x + w / 2, y + 340, 90, P.red, 'center');
  }
  c.restore();
}

/** Abertura e fechamento: uma página de HQ por vez. */
function pages(c, a, closing) {
  comicBackground(c, a.frame);
  const run = a.story;
  const ch = currentChapter(run);
  banner(c, closing ? (ch.boss === 'djabo' ? 'O FIM DA FOME' : 'O EVENTO ACONTECE') : 'A TURNÊ CONTRA A FOME', `CAPÍTULO ${ch.n} • ${ch.place}`);
  const hero = heroOf(a);
  const boss = ALL[ch.boss];
  const who = closing && run.page === 0 && boss ? boss : hero;
  figure(c, who, 20, 190, 640, 853, who === hero ? 1 : -1);
  // quadro do cenário
  comicPanel(c, 735, 190, 1110, 470, P.ink, 18, 0);
  if (!drawStageThumb(c, boss, 760, 205, 1060, 440) && !drawBelemPresentation(c, 'miniatura', 760, 205, 1060, 440)) {
    comicText(c, ch.place, 1290, 425, 60, P.paper, 'center', 1000);
  }
  if (closing && ch.boss === 'pavanassi' && run.page >= 1) drawPrideBunting(c, 760, 205, 1060, a.frame);
  if (closing && ch.boss === 'djabo' && run.page >= 1) drawFinale(c, run.page, 760, 205, 1060, 440, a.frame, hero);
  // legenda
  const text = a.storyPages[run.page] || '';
  comicPanel(c, 700, 690, 1150, 290, P.yellow, 20, 6);
  paragraph(c, text, 750, 750, 1060, 40);
  comicText(c, `${run.page + 1} / ${a.storyPages.length}`, 1800, 950, 26, P.ink, 'right');
  footer(c, 'LEVE / ENTER AVANÇA    •    MÉDIO / ESC VOLTA UMA PÁGINA');
}

/** Mapa da turnê: as sete paradas, com a atual em destaque. */
function map(c, a) {
  comicBackground(c, a.frame);
  const run = a.story;
  banner(c, 'MAPA DA TURNÊ', shortName(heroOf(a)).toUpperCase());
  const pulse = 0.5 + 0.5 * Math.sin(a.frame / 12);
  const pos = CHAPTERS.map((_, i) => [120 + i * 245, i % 2 ? 440 : 210]);
  // trilha
  c.strokeStyle = P.ink;
  c.lineWidth = 10;
  c.setLineDash([24, 18]);
  c.beginPath();
  pos.forEach(([x, y], i) => (i ? c.lineTo(x + 105, y + 85) : c.moveTo(x + 105, y + 85)));
  c.stroke();
  c.setLineDash([]);
  CHAPTERS.forEach((ch, i) => {
    const [x, y] = pos[i];
    const current = i === run.chapter;
    const won = i < run.done || (current && run.cleared);
    const picked = current && !run.cleared; // capítulo escolhido no mapa
    const fill = picked ? P.red : won ? P.yellow : ch.ready && i <= run.done ? P.paper : P.muted;
    if (current && !run.cleared) {
      c.strokeStyle = P.yellow;
      c.lineWidth = 8 + pulse * 6;
      c.strokeRect(x - 10, y - 10, 230, 190);
    }
    const ink = picked ? P.paper : P.ink;
    comicPanel(c, x, y, 210, 170, fill, 12, 5);
    comicText(c, String(ch.n), x + 30, y + 32, 38, ink);
    comicText(c, ch.bossName, x + 105, y + 74, 28, ink, 'center', 180);
    comicText(c, ch.place, x + 105, y + 110, 18, ink, 'center', 180);
    const tag = current && !run.cleared ? (won ? 'JOGAR DE NOVO' : 'AGORA') : won ? 'VENCIDO ✓' : ch.ready && i <= run.done ? 'PRONTO' : ch.ready ? 'TRANCADO' : 'EM BREVE';
    comicText(c, tag, x + 105, y + 146, 22, picked ? P.yellow : P.ink, 'center', 180);
  });
  // painel do capítulo atual
  const ch = currentChapter(run);
  comicPanel(c, 120, 690, 1680, 300, P.ink, 20, 0);
  comicText(c, `CAPÍTULO ${ch.n} — ${ch.place}`, 170, 740, 44, P.yellow, 'left', 1580);
  if (run.cleared) {
    const next = nextChapter(run);
    const msg = tourComplete(run) ? 'TURNÊ COMPLETA! A fome acabou no mundo. Jogue com outro Salvador para ver o final dele.'
      : next ? `Capítulo vencido! Próxima parada: ${next.place}, contra ${next.bossName}.` : 'Capítulo vencido! O próximo capítulo da turnê chega numa próxima versão do jogo.';
    paragraph(c, msg, 170, 810, 1580, 36, P.paper);
  } else {
    run.fights.forEach((f, i) => {
      const foe = ALL[f.foe];
      const label = f.kind === 'boss' ? `CHEFE: ${foe.name}` : `BATALHA DE RIMA ${f.n}: ${shortName(foe).toUpperCase()}`;
      const mark = i < run.idx ? '✓' : i === run.idx ? '▶' : '·';
      comicText(c, `${mark}  ${label}`, 190, 810 + i * 56, 36, i < run.idx ? P.muted : i === run.idx ? P.paper : P.muted, 'left', 1560);
    });
  }
  footer(c, run.cleared ? (nextChapter(run) ? 'LEVE / ENTER SEGUE A TURNÊ    •    ESC VOLTA AO MENU' : 'LEVE / ENTER VOLTA AO MENU') : run.idx === 0 && run.done > 0 ? '← → ESCOLHE O CAPÍTULO    •    LEVE / ENTER COMEÇA    •    ESC VOLTA AO MENU' : 'LEVE / ENTER SEGUE PARA A PRÓXIMA LUTA    •    ESC VOLTA AO MENU');
}

/** Diálogo antes da luta: o herói à esquerda, o rival à direita, quem fala em destaque. */
function talk(c, a) {
  comicBackground(c, a.frame);
  const run = a.story;
  const f = currentFight(run);
  const lines = talkLines(run);
  const line = lines[Math.min(run.page, lines.length - 1)];
  const hero = heroOf(a);
  const foe = ALL[f.foe];
  const ch = currentChapter(run);
  if (f.kind === 'boss') banner(c, `CHEFE — ${foe.name}`, ch.place);
  else banner(c, `BATALHA DE RIMA ${f.n} / ${run.fights.length - 1}`, ch.place);
  const speaking = (ch_) => line.who === ch_.id;
  for (const [ch_, x, face] of [[hero, -20, 1], [foe, 1260, -1]]) {
    c.save();
    if (line.who && !speaking(ch_)) c.globalAlpha = 0.45;
    figure(c, ch_, x, 200, 680, 905, face);
    c.restore();
  }
  // balão de fala ou legenda do narrador
  const narrator = !line.who;
  const bx = 560;
  const by = narrator ? 200 : 640;
  comicPanel(c, bx, by, 800, narrator ? 260 : 330, narrator ? P.yellow : P.paper, 18, 6);
  if (!narrator) {
    const sp = ALL[line.who];
    comicPanel(c, bx + 30, by - 34, 360, 60, line.who === hero.id ? P.red : P.ink, 12, 4);
    comicText(c, shortName(sp).toUpperCase(), bx + 210, by - 4, 32, P.paper, 'center', 320);
    // rabinho do balão apontando para quem fala
    const left = line.who === hero.id;
    c.fillStyle = P.paper;
    c.strokeStyle = P.ink;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(left ? bx + 60 : bx + 740, by + 330);
    c.lineTo(left ? bx - 60 : bx + 860, by + 400);
    c.lineTo(left ? bx + 150 : bx + 650, by + 330);
    c.fill();
    c.stroke();
  }
  paragraph(c, line.say, bx + 50, by + (narrator ? 70 : 80), 700, 42);
  comicText(c, `${run.page + 1} / ${lines.length}`, bx + 760, by + (narrator ? 235 : 305), 24, P.ink, 'right');
  footer(c, 'LEVE / ENTER AVANÇA    •    MÉDIO / ESC VOLTA UMA FALA');
}

/** Derrota na turnê: continuar a mesma luta ou desistir. */
function lose(c, a) {
  comicBackground(c, a.frame);
  const run = a.story;
  const foe = ALL[currentFight(run).foe];
  figure(c, foe, 20, 168, 680, 907, 1);
  comicText(c, 'DERROTA', 825, 235, 133, P.ink, 'left', 1010);
  comicPanel(c, 820, 339, 995, 200, P.ink, 20, 0);
  comicText(c, 'A TURNÊ NÃO PODE PARAR.', 860, 400, 42, P.yellow, 'left', 920);
  comicText(c, `CONTINUES USADOS: ${run.continues}`, 860, 475, 32, P.paper, 'left', 920);
  ['CONTINUAR', 'DESISTIR'].forEach((label, i) => comicMenuItem(c, label, 880, 620 + i * 91, 850, a.cur === i, i));
  footer(c, 'CONTINUAR RECOMEÇA A MESMA LUTA    •    ENTER CONFIRMA');
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
  stage[1](c, 680, 0);
  c.restore();
  return true;
}

/** Nome do lugar do capítulo atual, para a tela de versus. */
export const storyPlace = (a) => currentChapter(a.story).place;

/** Selo na tela de versus mostrando em que ponto da turnê a luta está. */
export function drawStoryVsTag(c, a) {
  const f = currentFight(a.story);
  const label = f.kind === 'boss' ? 'CHEFE DA TURNÊ' : `BATALHA DE RIMA ${f.n}`;
  c.save();
  c.translate(W / 2, 640);
  c.rotate(-0.05);
  comicPanel(c, -260, -42, 520, 84, f.kind === 'boss' ? P.red : P.yellow, 14, 5);
  comicText(c, label, 0, 0, 40, f.kind === 'boss' ? P.paper : P.ink, 'center', 470);
  c.restore();
}

/** Desenha a tela do Modo História atual. Retorna false se não for uma delas. */
export function drawStoryScreen(c, a) {
  if (!a.story) return false;
  switch (a.screen) {
    case 'storyIntro': pages(c, a, false); return true;
    case 'storyEnd': pages(c, a, true); return true;
    case 'storyMap': map(c, a); return true;
    case 'storyTalk': talk(c, a); return true;
    case 'storyLose': lose(c, a); return true;
    default: return false;
  }
}
