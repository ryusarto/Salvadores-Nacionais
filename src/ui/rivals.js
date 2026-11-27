import { HEROES, BOSSES } from '../data/characters/index.js';
import { CHAPTERS } from '../data/story.js';
import { loadProgress } from './story.js';

/** A victory with any Salvador unlocks that boss on this player's saved game. */
export function availableRivals(progress = loadProgress()) {
  const cleared = Math.max(0, ...HEROES.map(hero => {
    const value = progress?.[hero.id];
    return Number.isInteger(value) && value >= 0 ? Math.min(value, CHAPTERS.length) : 0;
  }));
  const unlocked = new Set(CHAPTERS.slice(0, cleared).map(chapter => chapter.boss));
  return [...HEROES, ...BOSSES.filter(boss => unlocked.has(boss.id)), null];
}
