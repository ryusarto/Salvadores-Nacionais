import franco from './franco.js';
import belga from './belga.js';
import majis from './majis.js';
import trunks from './trunks.js';
import ryuchi from './ryuchi.js';
import mdep from './mdep.js';
import chapuh from './chapuh.js';
import dney from './dney.js';
import zanata from './zanata.js';

/** Heróis jogáveis, na ordem do seletor. */
export const HEROES = [franco, belga, majis, trunks, ryuchi, mdep, chapuh, dney];
/** Chefes do Modo História, na ordem da turnê. */
export const BOSSES = [zanata];
export const ALL = Object.fromEntries([...HEROES, ...BOSSES].map((c) => [c.id, c]));
