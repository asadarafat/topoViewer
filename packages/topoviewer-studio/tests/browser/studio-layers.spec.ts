import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';
import { expectEditorContains } from './helpers/monaco';

async function navigatorLayers(page: Page) {
  const project = await openStudioWorkspace(page, 'Project');
  const layersSummary = project.getByRole('button', { name: /^Layers\b/ });
  if ((await layersSummary.getAttribute('aria-expanded')) !== 'true') {
    await layersSummary.click();
  }
  const layers = project.locator('.studio-layer-controls');
  await expect(layers).toBeVisible();
  return layers;
}

async function runLayerAction(page: Page, layers: Locator, layerLabel: string, action: string) {
  await layers.getByRole('button', { name: `${layerLabel} layer actions` }).click();
  await page.getByRole('menuitem', { name: action }).click();
}

async function openSource(page: Page) {
  await openPropertiesCodeDocument(page, 'topology');
}

test('creates, renames, reorders, filters, assigns, and safely deletes layers', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await page.locator('.react-flow__node[data-id="router-2"]').click();

  const layers = await navigatorLayers(page);
  await layers.getByRole('button', { name: 'Add layer' }).click();
  const newRow = layers.locator('[data-layer-id="new-layer"]');
  await newRow.getByRole('button', { name: /layer actions$/ }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const layerName = layers.getByRole('textbox', { name: 'Layer name new-layer' });
  await layerName.fill('Application');
  await layerName.press('Enter');
  await expect(newRow).toContainText('Application');

  await runLayerAction(page, layers, 'Application', 'Move up');
  const rows = layers.locator('.studio-layer-row');
  await expect(rows.nth(2)).toHaveAttribute('data-layer-id', 'new-layer');

  await runLayerAction(page, layers, 'Application', 'Assign selection to layer');
  await runLayerAction(page, layers, 'Physical', 'Remove selection from layer');
  await layers.getByRole('checkbox', { name: 'Show Application layer' }).uncheck();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toHaveCount(0);

  await runLayerAction(page, layers, 'Application', 'Delete layer');
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Application?' });
  await expect(confirmation).toBeVisible();
  await selectStudioOption(page, confirmation.getByRole('combobox', { name: 'Replacement layer' }), 'physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(layers.locator('[data-layer-id="new-layer"]')).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toBeVisible();

  await openSource(page);
  await expectEditorContains(page, 'topology', 'id: new-layer', false);
  await expectEditorContains(page, 'topology', 'id: router-2');
  await expectEditorContains(page, 'topology', '- physical');
});

test('keeps the final visible and declared layers protected', async ({ page }) => {
  await page.goto('/');
  const layers = await navigatorLayers(page);
  await layers.getByRole('checkbox', { name: 'Show Paths layer' }).uncheck();
  await layers.getByRole('checkbox', { name: 'Show Annotations layer' }).uncheck();
  await expect(layers.getByRole('checkbox', { name: 'Show Physical layer' })).toBeDisabled();

  await runLayerAction(page, layers, 'Paths', 'Delete layer');
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Paths?' });
  await selectStudioOption(page, confirmation.getByRole('combobox', { name: 'Replacement layer' }), 'physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await runLayerAction(page, layers, 'Annotations', 'Delete layer');
  await page.getByRole('alertdialog', { name: 'Delete Annotations?' }).getByRole('button', { name: 'Delete' }).click();

  await layers.getByRole('button', { name: 'Physical layer actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Delete layer' })).toBeDisabled();
  await page.keyboard.press('Escape');
});
