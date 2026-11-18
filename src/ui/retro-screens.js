/**
 * Menus no estilo clássico de 16 bits: tela de título, seleção de lutador
 * (individual, rival da CPU e 2 jogadores) e Modo História com mapa-múndi.
 *
 * As posições ficam nas funções de layout exportadas, que o app.js usa para
 * os botões acessíveis/de toque, assim o clique cai exatamente no desenho.
 */
import { HEROES, ALL } from '../data/characters/index.js';
import { CHAPTERS } from '../data/story.js';
import { currentChapter, nextChapter, tourComplete } from './story.js';
import {
  RETRO as R, ptext, ptextWidth, pwrap, pixelIcon, pixelPortrait, navyBackground, pixelBox, playerTag, fighterCard,
  drawLaurels, statPanel, drawWorldMap, paraFlag, mapPin, goldLogo, fireSwoosh, backdropSN,
} from '../render/retro-ui.js';

const W = 1920, H = 1080;
const blink = (a, on = 40, period = 60) => a.frame % period < on;
const touch = () => typeof document !== 'undefined' && document.documentElement.classList.contains('touch');
/** Para onde cada retrato olha por natureza (-1 = esquerda); o grande da História vira para o centro. */
const NATURAL = { franco: -1, belga: 1, majis: -1, dney: -1, ryuchi: 1, trunks: 1, mdep: -1, chapuh: -1 };
const MODE_LABEL = { versus: 'VERSUS CPU', training: 'TREINO', tutorial: 'APRENDER A LUTAR', story: 'MODO HISTÓRIA', vs2: '2 JOGADORES' };

// ───────────────────────────── layouts ─────────────────────────────
export const TITLE_MENU = { x: 560, y: 610, w: 800, step: 74 };
export const titleItem = (i) => ({ x: TITLE_MENU.x, y: TITLE_MENU.y + i * TITLE_MENU.step - 37, w: TITLE_MENU.w, h: TITLE_MENU.step });
export const optionItem = (i) => ({ x: 360, y: 250 + i * 92 - 40, w: 1200, h: 80 });
/** Molduras da grade de heróis: clássica (4×2 grande) ou do Modo História (menor, embaixo do mapa). */
export function heroCards(story) {
  return HEROES.map((_, i) => story
    ? { x: 560 + (i % 4) * 205, y: 505 + Math.floor(i / 4) * 228, w: 190, h: 172 }
    : { x: 430 + (i % 4) * 270, y: 150 + Math.floor(i / 4) * 326, w: 250, h: 290 });
}
export const FOE_GRID = 8;
export const foeCards = (n) => Array.from({ length: n }, (_, i) => ({ x: 325 + (i % FOE_GRID) * 160, y: 160 + Math.floor(i / FOE_GRID) * 292, w: 150, h: 240 }));
export const chapterBox = (i) => ({ x: 22 + i * 265, y: 682, w: 255, h: 188 });

// ───────────────────────────── peças ─────────────────────────────
/** Dica de controles do rodapé: setas, confirmar e voltar (A/B no controle, ENTER/ESC no teclado). */
function controlsHint(c, y, keys, okLabel = 'CONFIRMAR', backLabel = 'VOLTAR') {
  if (touch()) { ptext(c, 'TOQUE PARA ESCOLHER  •  VOLTAR PARA RETORNAR', W / 2, y, 4, 'silver'); return; }
  const pad = keys?.pad;
  const parts = [['arrows'], ['sep'], ['key', pad ? 'A' : 'ENTER', okLabel], ['sep'], ['key', pad ? 'B' : 'ESC', backLabel]];
  const u = 5;
  const widthOf = (p) => p[0] === 'arrows' ? ptextWidth('←→↑↓', u) + 18 : p[0] === 'sep' ? 60 : (pad ? 56 : ptextWidth(p[1], 3) + 26) + 18 + ptextWidth(p[2], u);
  let x = W / 2 - parts.reduce((s, p) => s + widthOf(p), 0) / 2;
  for (const p of parts) {
    if (p[0] === 'arrows') ptext(c, '← → ↑ ↓', x, y, u, 'cream', 'left');
    else if (p[0] === 'sep') { c.fillStyle = R.cream; c.fillRect(x + 28, y - 22, 5, 44); }
    else {
      const kw = pad ? 56 : ptextWidth(p[1], 3) + 26;
      if (pad) { c.fillStyle = R.yellow; c.beginPath(); c.arc(x + 28, y, 26, 0, Math.PI * 2); c.fill(); c.fillStyle = '#000'; c.beginPath(); c.arc(x + 28, y, 20, 0, Math.PI * 2); c.fill(); ptext(c, p[1], x + 28, y, 4, 'yellow'); }
      else { pixelBox(c, x, y - 22, kw, 44, '#000', R.yellow, 4); ptext(c, p[1], x + kw / 2, y, 3, 'yellow'); }
      ptext(c, p[2], x + kw + 18, y, u, 'cream', 'left');
    }
    x += widthOf(p);
  }
}

/** Faixa "1P FRANCO" com o painel de atributos embaixo (lado esquerdo ou direito). */
function playerPanel(c, side, label, ch, color, extra) {
  const right = side === 1;
  const x = right ? 1565 : 15;
  const y = 712;
  const tagW = ptextWidth(label, 5) + 40;
  const bx = right ? 1905 - 340 : 15;
  // faixa do nome
  const name = ch ? ch.name.split(',')[0] : 'ALEATÓRIO';
  const nameW = Math.min(300, ptextWidth(name, 5) + 40);
  const total = tagW + nameW - 6;
  const tx = right ? 1905 - total : x + 4;
  c.fillStyle = R.yellow; c.fillRect(tx + tagW - 14, y + 4, nameW + 8, 54);
  c.fillStyle = color; c.fillRect(tx + tagW - 10, y + 8, nameW, 46);
  ptext(c, name, tx + tagW - 10 + nameW / 2, y + 31, 5, 'gold', 'center', nameW - 20);
  playerTag(c, label, tx, y, color);
  statPanel(c, ch, bx, y + 72, color);
  if (extra) ptext(c, extra, right ? 1905 : 15, y - 22, 3, 'dim', right ? 'right' : 'left', 600);
}

/** Painel de informação do lutador (modos de um jogador, lado direito). */
function infoPanel(c, ch, label) {
  const x = 1565, y = 712;
  playerTag(c, label, 1905 - (ptextWidth(label, 5) + 40), y, '#8a5a00', 5);
  pixelBox(c, x, y + 72, 340, 156, '#000', R.yellow, 6);
  pixelBox(c, x + 6, y + 78, 328, 144, '#000', '#3a2a00', 2);
  ptext(c, ch.style.toUpperCase(), x + 22, y + 104, 3, 'gold', 'left', 296);
  ptext(c, ch.mechName, x + 22, y + 136, 3, 'cyan', 'left', 296);
  ptext(c, 'SUPER:', x + 22, y + 168, 3, 'cream', 'left');
  ptext(c, ch.moves.SA3?.name || '', x + 22, y + 198, 3, 'yellow', 'left', 296);
}

// ───────────────────────────── título ─────────────────────────────
function title(c, a, menu, keys) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.drawImage(backdropSN(), 0, 0);
  const sw = fireSwoosh();
  const s = 3;
  // rastro de fogo e "THE GAME" atrás/embaixo do logo
  const blitPx = (img, x, y, w, h) => { const k = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false; c.drawImage(img, x, y, w, h); c.imageSmoothingEnabled = k; };
  blitPx(sw, 510, 372, sw.width * s, sw.height * s);
  const logo = goldLogo();
  if (logo) blitPx(logo, (W - logo.width * 3.6) / 2, 36, logo.width * 3.6, logo.height * 3.6);
  else { ptext(c, 'SALVADORES', W / 2, 150, 16, 'gold'); ptext(c, 'NACIONAIS', W / 2, 330, 16, 'gold'); }
  ptext(c, 'THE GAME', W / 2 - 40, 486, 8, 'silver');
  menu.forEach(([, name], i) => {
    const sel = a.cur === i;
    const y = TITLE_MENU.y + i * TITLE_MENU.step;
    const w = ptext(c, name, W / 2, y, sel ? 8 : 7, sel ? 'gold' : 'silver');
    if (sel && blink(a, 20, 30)) ptext(c, '▶', W / 2 - w / 2 - 50, y, 7, 'gold');
  });
  if (blink(a)) ptext(c, touch() ? 'TOQUE PARA COMEÇAR' : 'APERTE START', W / 2, 935, 6, 'blue');
  ptext(c, 'BELÉM • PARÁ', W / 2, 995, 5, 'yellow');
  c.fillStyle = R.yellow; c.fillRect(W / 2 - 300, 993, 110, 5); c.fillRect(W / 2 + 190, 993, 110, 5);
  ptext(c, '©SALVADORES NACIONAIS PROJETO', W / 2, 1045, 4, 'blue');
  void keys;
}

// ──────────────────── seleção clássica (fundo preto) ────────────────────
function classicFrame(c, heading) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  drawLaurels(c, 110, 1590, 200);
  ptext(c, heading, W / 2, 66, 6, 'gold');
}

/** Convite para o segundo jogador entrar no VS. */
function joinHint(c, a, y) {
  if (!blink(a, 45, 70)) return;
  const label = touch() ? '2P: CONECTE UM CONTROLE E APERTE START' : '2P: APERTE START NO OUTRO CONTROLE';
  const w = ptextWidth(label, 4);
  playerTag(c, '2P', W / 2 - w / 2 - 110, y - 31, R.blue, 5);
  ptext(c, label.slice(4), W / 2 + 10, y, 4, 'blue');
}

/** Um jogador escolhendo (Versus CPU, Treino, Aprender a lutar). */
function selectClassic(c, a, keys) {
  classicFrame(c, 'ESCOLHA SEU LUTADOR');
  const cards = heroCards(false);
  HEROES.forEach((ch, i) => { const sel = i === a.hero; fighterCard(c, ch, cards[i].x, cards[i].y, cards[i].w, cards[i].h, { cursor: sel ? R.red : null, nameU: 5 }); });
  const cur = cards[a.hero];
  if (blink(a, 50)) playerTag(c, '1P', cur.x - 14, cur.y - 34, R.red, 6);
  const ch = HEROES[a.hero];
  playerPanel(c, 0, '1P', ch, R.red);
  infoPanel(c, ch, MODE_LABEL[a.mode] || 'VERSUS');
  if (a.mode === 'versus') joinHint(c, a, 880);
  controlsHint(c, 1010, keys);
}

/** Escolha do rival da CPU: heróis, chefes e o aleatório numa grade 8×2. */
function selectFoe(c, a, keys, foes) {
  classicFrame(c, 'ESCOLHA O RIVAL');
  const cards = foeCards(foes.length);
  foes.forEach((ch, i) => { const sel = i === a.foeCur; fighterCard(c, ch, cards[i].x, cards[i].y, cards[i].w, cards[i].h, { cursor: sel ? R.blue : null, nameU: 3, plate: true }); if (ch?.boss) ptext(c, 'CHEFE', cards[i].x + cards[i].w / 2, cards[i].y + 26, 2, 'red'); });
  const cur = cards[a.foeCur];
  if (blink(a, 50)) playerTag(c, 'CPU', cur.x + cur.w - 120, cur.y - 34, R.blue, 5);
  playerPanel(c, 0, '1P', HEROES[a.hero], R.red);
  playerPanel(c, 1, 'CPU', foes[a.foeCur], R.blue);
  const rival = foes[a.foeCur];
  ptext(c, rival ? `${rival.style.toUpperCase()} • ${rival.mechName}` : 'O RIVAL É SORTEADO ENTRE HERÓIS E CHEFES', W / 2, 735, 4, 'silver', 'center', 1100);
  if (rival) pwrap(rival.mechDesc.toUpperCase(), 1080, 3).slice(0, 3).forEach((l, i) => ptext(c, l, W / 2, 790 + i * 36, 3, 'cream'));
  joinHint(c, a, 940);
  controlsHint(c, 1010, keys);
}

/** Dois jogadores, cada um com o seu cursor. */
function select2(c, a, keys, srcName) {
  classicFrame(c, 'ESCOLHAM SEUS LUTADORES');
  const cards = heroCards(false);
  HEROES.forEach((ch, i) => {
    const p1 = i === a.hero, p2 = i === a.hero2;
    fighterCard(c, ch, cards[i].x, cards[i].y, cards[i].w, cards[i].h, { cursor: p1 ? R.red : p2 ? R.blue : null, nameU: 5 });
  });
  const c1 = cards[a.hero], c2 = cards[a.hero2];
  if (!a.ready[0] || blink(a, 50)) playerTag(c, '1P', c1.x - 14, c1.y - 34, R.red, 6);
  if (!a.ready[1] || blink(a, 50)) playerTag(c, '2P', c2.x + c2.w - 120, c2.y - 34, R.blue, 6);
  playerPanel(c, 0, '1P', HEROES[a.hero], R.red, srcName(a.slots[0]));
  playerPanel(c, 1, '2P', HEROES[a.hero2], R.blue, srcName(a.slots[1]));
  for (const side of [0, 1]) if (a.ready[side]) ptext(c, 'PRONTO!', side ? 1735 : 185, 640, 6, side ? 'cyan' : 'gold');
  controlsHint(c, 1010, keys, 'CONFIRMAR', 'DESFAZER');
}

// ─────────────────── Modo História (fundo azul + mapa) ───────────────────
function storyTitle(c, x) { ptext(c, 'MODO HISTÓRIA', x, 52, 8, 'gold'); }

/** Escolha do herói da turnê: mapa com Belém marcado, retrato grande e grade. */
function selectStory(c, a, keys) {
  navyBackground(c);
  storyTitle(c, 1000);
  const map = drawWorldMap(c, 380, 95, 1000, 8);
  const [bx, by] = map.project(-48.5, -1.45);
  mapPin(c, bx, by, R.red, 4, 0.5 + 0.5 * Math.sin(a.frame / 10));
  ptext(c, 'BELÉM', bx + 14, by - 46, 4, 'white', 'left');
  paraFlag(c, bx + 24, by - 24, 4);
  ptext(c, 'BRASIL', bx + 30, by + 40, 4, 'white', 'left');
  const ch = HEROES[a.hero];
  ptext(c, '1P', 60, 452, 7, 'cyan', 'left');
  ptext(c, ch.name.split(',')[0], 60, 525, 9, 'gold', 'left', 470);
  c.save(); c.beginPath(); c.rect(0, 570, 540, 510); c.clip();
  if (!pixelPortrait(c, ch.id, 20, 575, 480, 640, NATURAL[ch.id] === -1)) pixelIcon(c, ch.id, 40, 600, 440, 440);
  c.restore();
  const cards = heroCards(true);
  HEROES.forEach((h, i) => {
    const r = cards[i], sel = i === a.hero;
    fighterCard(c, h, r.x, r.y, r.w, r.h, { cursor: sel ? R.red : null, plate: false });
    ptext(c, h.name.split(',')[0], r.x + r.w / 2, r.y + r.h + 24, 4, sel ? 'gold' : 'creamOut', 'center', r.w);
  });
  // a turnê: missão do capítulo 1 ao lado da grade
  pixelBox(c, 1400, 505, 500, 400, 'rgba(0,4,40,.85)', '#5878ff', 6);
  ptext(c, 'A TURNÊ CONTRA A FOME', 1650, 545, 4, 'yellow', 'center', 460);
  pwrap('RAP, COMIDA E PALCO ABERTO. OS POLÍTICOS VILÕES QUEREM ACABAR COM O PROJETO. 7 CHEFES NO CAMINHO.', 440, 3).forEach((l, i) => ptext(c, l, 1650, 600 + i * 34, 3, 'cream'));
  ptext(c, ch.style.toUpperCase(), 1650, 800, 3, 'gold', 'center', 440);
  ptext(c, ch.mechName, 1650, 840, 3, 'cyan', 'center', 440);
  controlsHint(c, 1045, keys);
}

/** Onde cada capítulo acontece no mapa. Os três primeiros são em Belém. */
const SPOTS = [
  { lon: -48.5, lat: -1.45, label: 'BELÉM', chapters: [0, 1, 2], flag: true },
  { lon: -47.9, lat: -15.8, label: 'AEROPORTO', chapters: [3], left: true },
  { lon: -45.5, lat: -24, label: 'MANSÃO', chapters: [4], left: true },
  { lon: -77, lat: 38.9, label: 'WASHINGTON', chapters: [5] },
  { lon: 18, lat: -50, label: 'INFERNO', chapters: [6], hell: true },
];

function chapterState(run, i) {
  const ch = CHAPTERS[i];
  const current = i === run.chapter;
  const won = i < run.done || (current && run.cleared);
  const picked = current && !run.cleared;
  const tag = picked ? (won ? 'DE NOVO' : 'AGORA') : won ? 'VENCIDO ✓' : ch.ready && i <= run.done ? 'PRONTO' : ch.ready ? 'TRANCADO' : 'EM BREVE';
  const locked = !(ch.ready && i <= run.done) && !won && !current;
  return { current, won, picked, tag, locked };
}

/** Mapa da turnê: paradas no mundo, capítulos numa faixa e o painel do atual. */
function storyMap(c, a, keys) {
  navyBackground(c);
  const run = a.story;
  storyTitle(c, 1150);
  const map = drawWorldMap(c, 420, 95, 1460, 8);
  const pts = SPOTS.map((s) => map.project(s.lon, s.lat));
  // rota tracejada entre as paradas
  c.fillStyle = R.yellow;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 18);
    for (let t = 1; t < n; t += 2) c.fillRect(Math.round(x0 + ((x1 - x0) * t) / n) - 3, Math.round(y0 + ((y1 - y0) * t) / n) - 3, 6, 6);
  }
  const pulse = 0.5 + 0.5 * Math.sin(a.frame / 10);
  SPOTS.forEach((s, k) => {
    const [x, y] = pts[k];
    const states = s.chapters.map((i) => chapterState(run, i));
    const here = states.some((st) => st.current);
    const allWon = states.every((st) => st.won);
    const locked = states.every((st) => st.locked);
    if (s.hell) { c.fillStyle = here ? '#ff5020' : '#a02010'; for (let f = 0; f < 5; f++) c.fillRect(x - 20 + f * 8, y - 10 - ((f * 7 + a.frame / 4) % 14), 6, 14); }
    mapPin(c, x, y, here ? R.red : allWon ? R.yellow : locked ? '#7a7a8a' : '#ff8c20', 4, here ? pulse : 0);
    ptext(c, s.label, s.left ? x - 16 : x + 16, s.left ? y - 14 : y - 44, 3, locked ? 'dim' : 'white', s.left ? 'right' : 'left');
    if (s.flag) paraFlag(c, x + 18, y - 26, 3);
  });
  // herói da turnê
  const hero = HEROES[a.hero];
  ptext(c, '1P', 40, 130, 6, 'cyan', 'left');
  ptext(c, hero.name.split(',')[0], 40, 190, 7, 'gold', 'left', 360);
  c.save(); c.beginPath(); c.rect(0, 225, 410, 445); c.clip();
  if (!pixelPortrait(c, hero.id, 30, 235, 330, 440, NATURAL[hero.id] === -1)) pixelIcon(c, hero.id, 40, 240, 320, 320);
  c.restore();
  // faixa dos capítulos
  CHAPTERS.forEach((ch, i) => {
    const b = chapterBox(i), st = chapterState(run, i);
    const border = st.picked ? R.red : st.won ? R.yellow : st.locked ? '#4a4a66' : R.cream;
    pixelBox(c, b.x, b.y, b.w, b.h, st.picked ? '#3a0a10' : '#000428', border, 6);
    if (st.picked && blink(a, 20, 30)) { c.strokeStyle = R.yellow; c.lineWidth = 4; c.strokeRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8); }
    c.save(); if (st.locked) c.globalAlpha = 0.45;
    pixelIcon(c, ch.boss, b.x + 70, b.y + 12, 116, 108);
    c.restore();
    ptext(c, String(ch.n), b.x + 26, b.y + 30, 5, st.picked ? 'gold' : 'creamOut');
    ptext(c, ch.bossName, b.x + b.w / 2, b.y + 140, 3, st.locked ? 'dim' : 'creamOut', 'center', b.w - 20);
    ptext(c, st.tag, b.x + b.w / 2, b.y + 170, 2, st.picked ? 'yellow' : st.won ? 'gold' : 'dim', 'center', b.w - 20);
  });
  // painel do capítulo atual
  const ch = currentChapter(run);
  pixelBox(c, 22, 884, 1875, 122, '#000428', '#5878ff', 6);
  ptext(c, `CAPÍTULO ${ch.n} — ${ch.place}`, 52, 918, 4, 'gold', 'left', 1800);
  let msg;
  if (run.cleared) {
    const next = nextChapter(run);
    msg = tourComplete(run) ? 'TURNÊ COMPLETA! A FOME ACABOU NO MUNDO. JOGUE COM OUTRO SALVADOR PARA VER O FINAL DELE.'
      : next ? `CAPÍTULO VENCIDO! PRÓXIMA PARADA: ${next.place}, CONTRA ${next.bossName}.` : 'CAPÍTULO VENCIDO! O PRÓXIMO CHEGA NUMA PRÓXIMA VERSÃO.';
  } else msg = run.fights.map((f, i) => `${i < run.idx ? '✓' : i === run.idx ? '▶' : '•'} CHEFE: ${ALL[f.foe].name}`).join('   ');
  pwrap(msg, 1800, 3).slice(0, 2).forEach((l, i) => ptext(c, l, 52, 958 + i * 30, 3, 'cream', 'left'));
  const chooser = !run.cleared && run.idx === 0 && run.done > 0;
  if (touch()) ptext(c, 'TOQUE NO CAPÍTULO PARA ESCOLHER', W / 2, 1045, 4, 'silver');
  else controlsHint(c, 1045, keys, run.cleared ? (nextChapter(run) ? 'SEGUIR' : 'MENU') : 'LUTAR', 'MENU');
  if (chooser) ptext(c, '← → CAPÍTULO', 1890, 1045, 3, 'yellow', 'right');
}

// ───────────────────────────── opções ─────────────────────────────
function optionsScreen(c, a, options, keys) {
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.45; c.drawImage(backdropSN(), 0, 220); c.globalAlpha = 1;
  ptext(c, 'OPÇÕES', W / 2, 105, 10, 'gold');
  options.forEach(([id, label], i) => {
    const sel = a.kcur === i;
    const y = optionItem(i).y + 40;
    const [name, value] = label.split(': ');
    const u = sel ? 6 : 5;
    if (value) {
      ptext(c, name, 420, y, u, sel ? 'gold' : 'silver', 'left', 880);
      const v = id === 'diff' && sel ? `◀ ${value} ▶` : value;
      ptext(c, v, 1500, y, u, sel ? 'gold' : value === 'NÃO' ? 'dim' : 'cyan', 'right');
    } else ptext(c, name, 420, y, u, sel ? 'gold' : 'silver', 'left');
    if (sel && blink(a, 20, 30)) ptext(c, '▶', 370, y, 6, 'gold');
  });
  controlsHint(c, 1010, keys, 'ALTERAR');
}

/** Desenha a tela clássica correspondente. Retorna false se a tela não é uma delas. */
export function drawRetroScreen(c, a, { menu, options, srcName, keys, foes }) {
  switch (a.screen) {
    case 'title': title(c, a, menu, keys); return true;
    case 'settings': optionsScreen(c, a, options, keys); return true;
    case 'select': (a.mode === 'story' ? selectStory : selectClassic)(c, a, keys); return true;
    case 'selectFoe': selectFoe(c, a, keys, foes); return true;
    case 'select2': select2(c, a, keys, srcName); return true;
    case 'storyMap': if (!a.story) return false; storyMap(c, a, keys); return true;
    default: return false;
  }
}
