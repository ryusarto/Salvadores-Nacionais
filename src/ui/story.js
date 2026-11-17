import { CHAPTERS, OPENING, BOSS_TALK, CLOSING, HERO_ENDINGS } from '../data/story.js';

/**
 * Estado de uma partida do Modo História, sem tela nem som.
 * O app chama estas funções; os testes também.
 */

const KEY = 'sn-historia';
const CHECKPOINTS = 'sn-historia-checkpoints';
const count = n => Number.isInteger(n) && n >= 0 ? Math.min(n, CHAPTERS.length) : 0;
const routeOf = () => 'bosses';

/** Começa a turnê com um herói, no primeiro capítulo pronto ainda não vencido. */
export function createRun(heroId, progress = {}, route = 'bosses') {
  const done = count(progress?.[heroId]);
  const ready = CHAPTERS.filter((ch) => ch.ready);
  return createRunAt(heroId, CHAPTERS.indexOf(ready[Math.min(done, ready.length - 1)]), done, route);
}

/** Começa a turnê num capítulo escolhido (um já vencido ou o próximo). */
export function createRunAt(heroId, chapterIndex, done = 0, route = 'bosses') {
  chapterIndex = Number.isInteger(chapterIndex) && CHAPTERS[chapterIndex]?.ready ? chapterIndex : 0;
  const chapter = CHAPTERS[chapterIndex];
  return {
    hero: heroId,
    chapter: chapterIndex,
    done: count(done), // capítulos que este herói já venceu
    intro: chapterIndex, // capítulo cuja abertura já foi mostrada
    route: routeOf(route),
    fights: buildFights(chapter),
    idx: 0,
    continues: 0,
    cleared: false,
    page: 0,
  };
}

/** Capítulos que dá para escolher no mapa: os vencidos e o próximo pronto. */
export function selectableChapters(run) {
  return CHAPTERS.map((ch, i) => i).filter((i) => CHAPTERS[i].ready && i <= run.done);
}

/** No mapa, troca o capítulo escolhido (dir = -1 ou 1). Só antes da primeira luta. */
export function moveChapter(run, dir) {
  if (run.cleared || run.idx > 0) return false;
  const list = selectableChapters(run);
  const at = list.indexOf(run.chapter);
  const next = list[at + dir];
  if (next === undefined) return false;
  const intro = run.intro;
  Object.assign(run, createRunAt(run.hero, next, run.done, run.route), { intro });
  return true;
}

function buildFights(chapter) {
  return [{ foe: chapter.boss, kind: 'boss' }];
}

export const currentChapter = (run) => CHAPTERS[run.chapter];

/** Próximo capítulo pronto depois do atual, ou null se a turnê parou aqui por enquanto. */
export const nextChapter = (run) => CHAPTERS.slice(run.chapter + 1).find((ch) => ch.ready && ch.n === CHAPTERS[run.chapter].n + 1) || null;
export const currentFight = (run) => run.fights[run.idx];

/**
 * Todos os confrontos são chefes: usa a dificuldade escolhida desde a Zanata.
 */
export function fightLevel(run, baseLevel) {
  return baseLevel;
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

export const openingPages = (run, heroName) => (OPENING[currentChapter(run).id] || []).map(s => fill(s, heroName));

export const closingPages = (run, heroName) => (CLOSING[currentChapter(run).boss] || []).map((s) => fill(s.replace('{ending}', HERO_ENDINGS[run.hero] || ''), heroName));

/** A turnê inteira terminou? (último capítulo vencido) */
export const tourComplete = (run) => run.cleared && currentChapter(run).n === CHAPTERS.length;

/** Falas antes da luta atual. '$hero' vira o herói da partida. */
export function talkLines(run) {
  const f = currentFight(run);
  const lines = BOSS_TALK[f.foe] || [];
  return lines.map((l) => ({ ...l, who: l.who === '$hero' ? run.hero : l.who }));
}

/** Progresso salvo: quantos capítulos cada herói já venceu. */
export function loadProgress(storage = globalThis.localStorage) {
  try {
    const p = JSON.parse(storage.getItem(KEY) || '{}');
    if (!p || typeof p !== 'object' || Array.isArray(p)) return {};
    return Object.fromEntries(Object.entries(p).filter(([id, n]) => Object.hasOwn(HERO_ENDINGS, id) && Number.isInteger(n) && n >= 0).map(([id, n]) => [id, count(n)]));
  } catch {
    return {};
  }
}

export function saveCleared(run, storage = globalThis.localStorage) {
  const p = loadProgress(storage);
  p[run.hero] = Math.max(p[run.hero] || 0, run.chapter + 1);
  run.done = p[run.hero];
  try {
    storage.setItem(KEY, JSON.stringify(p));
  } catch { /* sem armazenamento: o progresso vale só nesta sessão */ }
  clearCheckpoint(run.hero, storage);
  return p;
}

/** Store only validated encounter boundaries, never combat state or objects. */
export function saveCheckpoint(run, storage = globalThis.localStorage) {
  if (run.cleared) return clearCheckpoint(run.hero, storage);
  let all = {};
  try { all = JSON.parse(storage.getItem(CHECKPOINTS) || '{}'); } catch { /* replace invalid container */ }
  if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
  all[run.hero] = { version: 2, chapter: run.chapter, idx: run.idx, continues: run.continues, route: run.route };
  try { storage.setItem(CHECKPOINTS, JSON.stringify(all)); } catch { /* storage optional */ }
}
export function clearCheckpoint(hero, storage = globalThis.localStorage) {
  try { const all = JSON.parse(storage.getItem(CHECKPOINTS) || '{}'); if (all && typeof all === 'object') { delete all[hero]; storage.setItem(CHECKPOINTS, JSON.stringify(all)); } } catch { /* storage optional */ }
}
export function resumeRun(hero, progress, route = 'bosses', storage = globalThis.localStorage) {
  const fallback = createRun(hero, progress, route);
  try {
    const cp = JSON.parse(storage.getItem(CHECKPOINTS) || '{}')?.[hero];
    if (cp?.version !== 2 || cp.route !== routeOf(route) || !Number.isInteger(cp.chapter) || cp.chapter < 0 || cp.chapter > count(progress?.[hero]) || !CHAPTERS[cp.chapter]?.ready) return fallback;
    const run = createRunAt(hero, cp.chapter, count(progress?.[hero]), route);
    if (!Number.isInteger(cp.idx) || cp.idx < 0 || cp.idx >= run.fights.length) return fallback;
    run.idx = cp.idx;
    run.continues = Number.isInteger(cp.continues) && cp.continues >= 0 ? Math.min(cp.continues, 9999) : 0;
    return run;
  } catch { return fallback; }
}
