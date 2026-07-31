import { expect, test } from '@playwright/test';
import { activateStudioPaletteTemplate } from '../support/workbench';

async function emitExternalChange(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    const trigger = (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> }).__topoviewerStudioExternalChange;
    if (!trigger) throw new Error('External-change test host is unavailable.');
    await trigger();
  });
}

test('inspects, keeps, and safely reloads an externally changed project', async ({ page }) => {
  await page.goto('/?__studio-test-state=external-change');
  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await emitExternalChange(page);
  const dialog = page.getByRole('dialog', { name: 'Project changed outside Studio' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Conflict');
  await dialog.getByRole('button', { name: 'Inspect diff' }).click();
  await expect(dialog.getByText('topology.yaml differs')).toBeVisible();
  await expect(dialog.getByText(/external change 1/)).toBeVisible();

  await dialog.getByRole('button', { name: 'Keep Studio draft' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');

  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await emitExternalChange(page);
  await page.getByRole('dialog', { name: 'Project changed outside Studio' }).getByRole('button', { name: 'Reload disk' }).click();
  await expect(page.getByRole('dialog', { name: 'Project changed outside Studio' })).toBeHidden();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');
});
