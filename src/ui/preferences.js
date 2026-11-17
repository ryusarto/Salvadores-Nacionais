export const DEFAULTS = Object.freeze({ reducedEffects: false, leftHanded: false, largeButtons: false });
export function loadPreferences(storage = globalThis.localStorage) {
  let raw;
  try { raw = JSON.parse(storage.getItem('sn-opcoes') || '{}'); } catch { raw = {}; }
  const p = { ...DEFAULTS };
  for (const key of ['reducedEffects', 'leftHanded', 'largeButtons']) if (typeof raw?.[key] === 'boolean') p[key] = raw[key];
  return p;
}
export function savePreferences(p, storage = globalThis.localStorage) {
  try { storage.setItem('sn-opcoes', JSON.stringify(p)); } catch { /* session preferences remain usable */ }
}
