import { CHAPTERS, RIVALS, OPENING, BOSS_TALK, CLOSING, HERO_ENDINGS, rhymeTalk } from '../data/story.js';

/**
 * Estado de uma partida do Modo História, sem tela nem som.
 * O app chama estas funções; os testes também.
 */

const KEY = 'sn-historia';

/** Começa a turnê com um herói, no primeiro capítulo pronto ainda não vencido. */
export function createRun(heroId, progress = {}) {
  const done = progress[heroId] || 0;
  const ready = CHAPTERS.filter((ch) => ch.ready);
  const chapter = ready[Math.min(done, ready.length - 1)];
  return {
    hero: heroId,
    chapter: CHAPTERS.indexOf(chapter),
    fights: buildFights(heroId, chapter),
    idx: 0,
    continues: 0,
    cleared: false,
    page: 0,
  };
}

function buildFights(heroId, chapter) {
  const rivals = ((RIVALS[chapter.id] || {})[heroId] || []).map((id, i) => ({ foe: id, kind: 'rival', n: i + 1 }));
  return [...rivals, { foe: chapter.boss, kind: 'boss' }];
}

export const currentChapter = (run) => CHAPTERS[run.chapter];

/** Próximo capítulo pronto depois do atual, ou null se a turnê parou aqui por enquanto. */
export const nextChapter = (run) => CHAPTERS.slice(run.chapter + 1).find((ch) => ch.ready && ch.n === CHAPTERS[run.chapter].n + 1) || null;
export const currentFight = (run) => run.fights[run.idx];

/**
 * Nível da CPU na luta atual: a escada sobe até o nível da dificuldade
 * escolhida. A primeira batalha de rima é um degrau mais fácil.
 */
export function fightLevel(run, baseLevel) {
  return run.idx === 0 ? Math.max(0, baseLevel - 1) : baseLevel;
}

/** Venceu a luta atual. Retorna 'next' (há outra luta) ou 'cleared' (capítulo vencido). */
export function winFight(run) {
  if (run.idx < run.fights.length - 1) {
    run.idx++;
    run.page = 0;
    return 'next';
  }
  run.cleared = true;
  run.page = 0;
  return 'cleared';
}

/** Perdeu e escolheu continuar: a mesma luta recomeça. */
export function continueFight(run) {
  run.continues++;
}

/** Troca {hero} pelo nome curto do herói. */
const fill = (s, heroName) => s.replaceAll('{hero}', heroName);

export const openingPages = (run, heroName) => (OPENING[currentChapter(run).id] || []).map((s) => fill(s, heroName));
export const closingPages = (run, heroName) => (CLOSING[currentChapter(run).boss] || []).map((s) => fill(s.replace('{ending}', HERO_ENDINGS[run.hero] || ''), heroName));

/** A turnê inteira terminou? (último capítulo vencido) */
export const tourComplete = (run) => run.cleared && currentChapter(run).n === CHAPTERS.length;

/** Falas antes da luta atual. '$hero' vira o herói da partida. */
export function talkLines(run) {
  const f = currentFight(run);
  const lines = f.kind === 'rival' ? rhymeTalk(run.hero, f.foe, currentChapter(run).id) : BOSS_TALK[f.foe] || [];
  return lines.map((l) => ({ ...l, who: l.who === '$hero' ? run.hero : l.who }));
}

/** Progresso salvo: quantos capítulos cada herói já venceu. */
export function loadProgress(storage = globalThis.localStorage) {
  try {
    const p = JSON.parse(storage.getItem(KEY) || '{}');
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

export function saveCleared(run, storage = globalThis.localStorage) {
  const p = loadProgress(storage);
  p[run.hero] = Math.max(p[run.hero] || 0, run.chapter + 1);
  try {
    storage.setItem(KEY, JSON.stringify(p));
  } catch { /* sem armazenamento: o progresso vale só nesta sessão */ }
  return p;
}
