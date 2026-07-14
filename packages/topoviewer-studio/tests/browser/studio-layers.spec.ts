import { expect, test, type Page } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { expectEditorContains } from './helpers/monaco';

async function openLayers(page: Page) {
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  return page.getByRole('dialog', { name: 'Layers' });
}

async function openSource(page: Page) {
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expect(page.getByLabel('topology YAML editor')).toBeVisible();
}

test('creates, renames, reorders, filters, assigns, and safely deletes layers', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click();

  const layers = await openLayers(page);
  await layers.getByRole('button', { name: 'Add layer' }).click();
  const layerName = layers.getByRole('textbox', { name: 'Layer name new-layer' });
  await layerName.fill('Application');
  await layerName.press('Enter');
  await expect(layers.getByRole('textbox', { name: 'Layer name new-layer' })).toHaveValue('Application');

  await layers.getByRole('button', { name: 'Move Application layer up' }).click();
  const rows = layers.locator('.studio-layer-row');
  await expect(rows.nth(2)).toHaveAttribute('data-layer-id', 'new-layer');

  await layers.getByRole('checkbox', { name: 'Assign selection to Application' }).check();
  await layers.getByRole('checkbox', { name: 'Assign selection to Physical' }).uncheck();
  await layers.getByRole('checkbox', { name: 'Show Application layer' }).uncheck();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toHaveCount(0);

  await layers.getByRole('button', { name: 'Delete Application layer' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Application?' });
  await expect(confirmation).toBeVisible();
  await selectStudioOption(page, confirmation.getByRole('combobox', { name: 'Replacement layer' }), 'physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(layers.getByRole('textbox', { name: 'Layer name new-layer' })).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(layers).toBeHidden();
  await openSource(page);
  await expectEditorContains(page, 'topology', 'id: new-layer', false);
  await expectEditorContains(page, 'topology', 'id: router-2');
  await expectEditorContains(page, 'topology', '- physical');
});

test('keeps the final visible and declared layers protected', async ({ page }) => {
  await page.goto('/');
  const layers = await openLayers(page);
  await layers.getByRole('checkbox', { name: 'Show Paths layer' }).uncheck();
  await layers.getByRole('checkbox', { name: 'Show Annotations layer' }).uncheck();
  await expect(layers.getByRole('checkbox', { name: 'Show Physical layer' })).toBeDisabled();

  await layers.getByRole('button', { name: 'Delete Paths layer' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Paths?' });
  await selectStudioOption(page, confirmation.getByRole('combobox', { name: 'Replacement layer' }), 'physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await layers.getByRole('button', { name: 'Delete Annotations layer' }).click();
  await page.getByRole('alertdialog', { name: 'Delete Annotations?' }).getByRole('button', { name: 'Delete' }).click();
  await expect(layers.getByRole('button', { name: 'Delete Physical layer' })).toBeDisabled();
});
