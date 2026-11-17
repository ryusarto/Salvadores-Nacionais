export const CHAPTER_STAGES = ['belem', 'palco', 'banheiros', 'aeroporto', 'mansao', 'washington', 'inferno'];
export function encounterStage(app) {
  if (app.mode === 'story' && app.story) return CHAPTER_STAGES[app.story.chapter] || 'belem';
  return app.foe?.stage || (app.foe?.id === 'chupetinha' ? 'palco' : app.foe?.id === 'pavanassi' ? 'banheiros' : 'belem');
}
