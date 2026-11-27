import { CHAPTERS } from './story.js';

export const CHAPTER_STAGES = ['belem', 'palco', 'banheiros', 'aeroporto', 'mansao', 'washington', 'inferno'];
export const STAGES = CHAPTER_STAGES.map((id, i) => ({ id, name: CHAPTERS[i].place }));
export const canChooseStage = mode => ['versus', 'vs2', 'training'].includes(mode);
export const validStage = id => CHAPTER_STAGES.includes(id);
export const stageName = id => STAGES.find(stage => stage.id === id)?.name || 'ALEATÓRIO';

export function encounterStage(app) {
  if (app.mode === 'story' && app.story) return CHAPTER_STAGES[app.story.chapter] || 'belem';
  if (canChooseStage(app.mode) && validStage(app.stageId)) return app.stageId;
  return app.foe?.stage || (app.foe?.id === 'chupetinha' ? 'palco' : app.foe?.id === 'pavanassi' ? 'banheiros' : 'belem');
}
