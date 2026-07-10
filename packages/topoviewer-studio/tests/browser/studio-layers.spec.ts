import { expect, test, type Page } from '@playwright/test';
import { expectEditorContains } from './helpers/monaco';

async function openSettings(page: Page) {
  await page.getByRole('button', { name: 'Viewport settings' }).click();
  return page.getByRole('dialog', { name: 'Viewport settings' });
}

async function openSource(page: Page) {
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expect(page.getByLabel('topology YAML editor')).toBeVisible();
}

test('creates, renames, reorders, filters, assigns, and safely deletes layers', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click();

  const settings = await openSettings(page);
  await settings.getByRole('button', { name: 'Add layer' }).click();
  const layerName = settings.getByRole('textbox', { name: 'Layer name new-layer' });
  await layerName.fill('Application');
  await layerName.press('Enter');
  await expect(settings.getByRole('textbox', { name: 'Layer name new-layer' })).toHaveValue('Application');

  await settings.getByRole('button', { name: 'Move Application layer up' }).click();
  const rows = settings.locator('.studio-layer-row');
  await expect(rows.nth(2)).toHaveAttribute('data-layer-id', 'new-layer');

  await settings.getByRole('checkbox', { name: 'Assign selection to Application' }).check();
  await settings.getByRole('checkbox', { name: 'Assign selection to Physical' }).uncheck();
  await settings.getByRole('checkbox', { name: 'Show Application layer' }).uncheck();
  await expect(page.locator('.react-flow__node[data-id="node-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="node-2"]')).toHaveCount(0);

  await settings.getByRole('button', { name: 'Delete Application layer' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Application?' });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('combobox', { name: 'Replacement layer' }).selectOption('physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(settings.getByRole('textbox', { name: 'Layer name new-layer' })).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="node-2"]')).toBeVisible();

  await page.getByRole('button', { name: 'Viewport settings' }).click();
  await openSource(page);
  await expectEditorContains(page, 'topology', 'id: new-layer', false);
  await expectEditorContains(page, 'topology', 'id: node-2');
  await expectEditorContains(page, 'topology', '- physical');
});

test('keeps the final visible and declared layers protected', async ({ page }) => {
  await page.goto('/');
  const settings = await openSettings(page);
  await settings.getByRole('checkbox', { name: 'Show Paths layer' }).uncheck();
  await settings.getByRole('checkbox', { name: 'Show Annotations layer' }).uncheck();
  await expect(settings.getByRole('checkbox', { name: 'Show Physical layer' })).toBeDisabled();

  await settings.getByRole('button', { name: 'Delete Paths layer' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Paths?' });
  await confirmation.getByRole('combobox', { name: 'Replacement layer' }).selectOption('physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await settings.getByRole('button', { name: 'Delete Annotations layer' }).click();
  await page.getByRole('alertdialog', { name: 'Delete Annotations?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(settings.getByRole('button', { name: 'Delete Physical layer' })).toBeDisabled();
});
