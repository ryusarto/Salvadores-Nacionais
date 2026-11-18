import { ALL } from '../data/characters/index.js';
import { spriteOptions } from './sprite-profiles.js';
/** Convenience entry for callers using the game's full character registry. */
export const spriteLoadOptions = (id, metadata = {}) => spriteOptions(id, Object.values(ALL), metadata);
