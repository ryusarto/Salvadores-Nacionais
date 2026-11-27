// Explicit completed-story save fixture for art tests, not proof of unlocking.
export const completedStoryFixture = page => page.addInitScript(() => {
  localStorage.setItem('sn-historia', JSON.stringify({ franco: 7 }));
});
export async function confirmMap(page, id = 'belem') {
  await page.waitForFunction(() => window.__app.screen === 'selectStage');
  await page.locator(`[data-action="stage-${id}"]`).click();
  await page.locator('[data-action="confirm-stage"]').click();
}
