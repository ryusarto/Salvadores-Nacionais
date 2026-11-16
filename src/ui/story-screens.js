import { ALL, HEROES } from '../data/characters/index.js';
import { CHAPTERS } from '../data/story.js';
import { COMIC as P, comicBackground, comicPanel, comicText, comicMenuItem } from '../render/comic-ui.js';
import { drawBelemPresentation } from '../render/belem-stage.js';
import { portrait, footer } from './comic-screens.js';
import { currentChapter, currentFight, talkLines } from './story.js';

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
const heroOf = (a) => HEROES[a.hero];

/** Abertura e fechamento: uma página de HQ por vez. */
function pages(c, a, closing) {
  comicBackground(c, a.frame);
  const run = a.story;
  const ch = currentChapter(run);
  banner(c, closing ? 'O EVENTO ACONTECE' : 'A TURNÊ CONTRA A FOME', `CAPÍTULO ${ch.n} • ${ch.place}`);
  const hero = heroOf(a);
  const boss = ALL[ch.boss];
  const who = closing && run.page === 0 && boss ? boss : hero;
  portrait(c, who, 20, 190, 640, 853, who === hero ? 1 : -1);
  // quadro do cenário
  comicPanel(c, 735, 190, 1110, 470, P.ink, 18, 0);
  if (!drawBelemPresentation(c, 'miniatura', 760, 205, 1060, 440)) {
    comicText(c, ch.place, 1290, 425, 60, P.paper, 'center', 1000);
  }
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
    const won = i < run.chapter || (current && run.cleared);
    const fill = won ? P.yellow : current ? P.red : ch.ready ? P.paper : P.muted;
    if (current && !run.cleared) {
      c.strokeStyle = P.yellow;
      c.lineWidth = 8 + pulse * 6;
      c.strokeRect(x - 10, y - 10, 230, 190);
    }
    const ink = current && !won ? P.paper : P.ink;
    comicPanel(c, x, y, 210, 170, fill, 12, 5);
    comicText(c, String(ch.n), x + 30, y + 32, 38, ink);
    comicText(c, ch.bossName, x + 105, y + 74, 28, ink, 'center', 180);
    comicText(c, ch.place, x + 105, y + 110, 18, ink, 'center', 180);
    const tag = won ? 'VENCIDO ✓' : ch.ready ? (current ? 'AGORA' : 'PRONTO') : 'EM BREVE';
    comicText(c, tag, x + 105, y + 146, 22, current && !won ? P.yellow : P.ink, 'center', 180);
  });
  // painel do capítulo atual
  const ch = currentChapter(run);
  comicPanel(c, 120, 690, 1680, 300, P.ink, 20, 0);
  comicText(c, `CAPÍTULO ${ch.n} — ${ch.place}`, 170, 740, 44, P.yellow, 'left', 1580);
  if (run.cleared) {
    paragraph(c, 'Capítulo vencido! O próximo capítulo da turnê chega numa próxima versão do jogo.', 170, 810, 1580, 36, P.paper);
  } else {
    run.fights.forEach((f, i) => {
      const foe = ALL[f.foe];
      const label = f.kind === 'boss' ? `CHEFE: ${foe.name}` : `BATALHA DE RIMA ${f.n}: ${shortName(foe).toUpperCase()}`;
      const mark = i < run.idx ? '✓' : i === run.idx ? '▶' : '·';
      comicText(c, `${mark}  ${label}`, 190, 810 + i * 56, 36, i < run.idx ? P.muted : i === run.idx ? P.paper : P.muted, 'left', 1560);
    });
  }
  footer(c, run.cleared ? 'LEVE / ENTER VOLTA AO MENU' : 'LEVE / ENTER SEGUE PARA A PRÓXIMA LUTA    •    ESC VOLTA AO MENU');
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
    portrait(c, ch_, x, 200, 680, 905, face);
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
  portrait(c, foe, 20, 168, 680, 907, 1);
  comicText(c, 'DERROTA', 825, 235, 133, P.ink, 'left', 1010);
  comicPanel(c, 820, 339, 995, 200, P.ink, 20, 0);
  comicText(c, 'A TURNÊ NÃO PODE PARAR.', 860, 400, 42, P.yellow, 'left', 920);
  comicText(c, `CONTINUES USADOS: ${run.continues}`, 860, 475, 32, P.paper, 'left', 920);
  ['CONTINUAR', 'DESISTIR'].forEach((label, i) => comicMenuItem(c, label, 880, 620 + i * 91, 850, a.cur === i, i));
  footer(c, 'CONTINUAR RECOMEÇA A MESMA LUTA    •    ENTER CONFIRMA');
}

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
