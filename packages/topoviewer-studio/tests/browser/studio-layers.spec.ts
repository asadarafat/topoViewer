import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';
import { expectEditorContains } from './helpers/monaco';

async function navigatorLayers(page: Page) {
  const project = await openStudioWorkspace(page, 'Project');
  const expand = project.getByRole('button', { name: 'Expand layers' });
  if (await expand.isVisible().catch(() => false)) {
    await expand.click();
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

async function selectNode(page: Page, nodeId: string) {
  const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`);
  await node.click({ position: { x: 8, y: 8 } });
  await expect(node).toHaveClass(/selected/);
}

test('separates layer disclosure, creation, and source navigation', async ({ page }) => {
  await page.goto('/');
  const project = await openStudioWorkspace(page, 'Project');
  const stylesheet = project.getByRole('button', { name: /stylesheet\.yaml/ });
  await stylesheet.click();
  await expect(stylesheet).toHaveAttribute('aria-current', 'page');

  await expect(project.getByRole('button', { name: 'Add layer' })).toBeVisible();
  await project.getByRole('button', { name: 'Expand layers' }).click();
  const layers = project.locator('.studio-layer-controls');
  await expect(layers).toBeVisible();
  await expect(stylesheet).toHaveAttribute('aria-current', 'page');

  await layers.getByRole('button', { name: 'View layers in topology YAML' }).click();
  await expect(project.getByRole('button', { name: /topology\.yaml/ })).toHaveAttribute('aria-current', 'page');

  await project.getByRole('button', { name: 'Add layer' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add layer' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Layer name' }).fill('Application');
  await expect(dialog.getByTestId('layer-id-preview')).toHaveText('application');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(layers.locator('[data-layer-id="application"]')).toHaveCount(0);
  await expect(project.getByRole('button', { name: 'Add layer' })).toBeFocused();

  await project.getByRole('button', { name: 'Add layer' }).click();
  await dialog.getByRole('textbox', { name: 'Layer name' }).fill('Application');
  await dialog.getByRole('button', { name: 'Create layer' }).click();
  await expect(layers.locator('[data-layer-id="application"]')).toContainText('0 objects');
  const properties = page.getByRole('complementary', { name: 'Properties workspace' });
  await expect(properties).toBeVisible();
  await expect(properties).toContainText('application');
});

test('creates, renames, reorders, filters, assigns, and safely deletes layers', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await selectNode(page, 'router-2');

  const layers = await navigatorLayers(page);
  const project = await openStudioWorkspace(page, 'Project');
  await project.getByRole('button', { name: 'Add layer' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Add layer' });
  await createDialog.getByRole('textbox', { name: 'Layer name' }).fill('Application');
  await createDialog.getByRole('button', { name: 'Create layer' }).click();
  const newRow = layers.locator('[data-layer-id="application"]');
  await selectNode(page, 'router-2');
  await newRow.getByRole('button', { name: /layer actions$/ }).click();
  await page.getByRole('menuitem', { name: 'Rename' }).click();
  const layerName = layers.getByRole('textbox', { name: 'Layer name application' });
  await layerName.fill('Application traffic');
  await layerName.press('Enter');
  await expect(newRow).toContainText('Application traffic');

  await runLayerAction(page, layers, 'Application traffic', 'Move up');
  const rows = layers.locator('.studio-layer-row');
  await expect(rows.nth(2)).toHaveAttribute('data-layer-id', 'application');

  await runLayerAction(page, layers, 'Application traffic', 'Assign selection to layer');
  await expect(newRow).toContainText('1 object');
  await runLayerAction(page, layers, 'Physical', 'Remove selection from layer');
  await layers.getByRole('checkbox', { name: 'Show Application traffic layer' }).uncheck();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toHaveCount(0);

  await runLayerAction(page, layers, 'Application traffic', 'Delete layer');
  const confirmation = page.getByRole('alertdialog', { name: 'Delete Application traffic?' });
  await expect(confirmation).toBeVisible();
  await selectStudioOption(page, confirmation.getByRole('combobox', { name: 'Replacement layer' }), 'physical');
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(layers.locator('[data-layer-id="application"]')).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toBeVisible();

  await openSource(page);
  await expectEditorContains(page, 'topology', 'id: application', false);
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

test('disables layer source mutations while an invalid topology draft is active', async ({ page }) => {
  await page.goto('/');
  const layers = await navigatorLayers(page);
  const source = page.getByTestId('studio-source-pane');
  const editor = source.locator('.monaco-editor');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await source.getByRole('button', { name: 'Apply topology' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');

  const project = await openStudioWorkspace(page, 'Project');
  await expect(project.getByRole('button', { name: 'Add layer' })).toBeDisabled();
  await expect(layers.getByRole('checkbox', { name: 'Show Physical layer' })).toBeEnabled();
  await layers.getByRole('button', { name: 'Physical layer actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Move down' })).toBeDisabled();
  await expect(page.getByRole('menuitem', { name: 'Delete layer' })).toBeDisabled();
});
