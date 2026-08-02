import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { openStudioWorkspace } from '../support/workbench';
import { expectEditorContains } from './helpers/monaco';

async function attentionManager(page: Page): Promise<Locator> {
  const project = await openStudioWorkspace(page, 'Project');
  const expand = project.getByRole('button', { name: 'Expand attention' });
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const manager = project.locator('.studio-attention-controls');
  await expect(manager).toBeVisible();
  return manager;
}

async function enableSourceControlledSwitch(control: Locator) {
  if (!(await control.isChecked())) await control.click();
  await expect(control).toBeChecked();
}

test('discovers attention and focuses the compatible canvas selection with undo and redo', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.click();
  await expect(leaf).toHaveClass(/selected/);

  const manager = await attentionManager(page);
  await expect(manager).toContainText('Attention is not configured');
  await manager.getByRole('button', { name: 'Focus canvas selection' }).click();

  await expect(leaf.getByRole('group', { name: /attention focused/ })).toBeVisible();
  await expect(manager).toContainText('leaf1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(leaf.getByRole('group', { name: /attention focused/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(leaf.getByRole('group', { name: /attention focused/ })).toBeVisible();

  await manager.getByRole('button', { name: 'View attention YAML' }).click();
  await expectEditorContains(page, 'topology', 'attention:');
  await expectEditorContains(page, 'topology', '- leaf1');
});

test('keeps the full policy project-level and exposes contextual selection shortcuts', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1600 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.click();

  const properties = await openStudioWorkspace(page, 'Properties');
  const contextual = properties.locator('#studio-edit-attention-content');
  await expect(contextual).toContainText('project-wide Attention policy');
  await expect(contextual.getByRole('button', { name: 'Focus selection' })).toBeVisible();
  await expect(contextual.getByRole('switch', { name: 'Interactive click focus' })).toHaveCount(0);
  await expect(contextual.getByRole('switch', { name: 'Group parallel links' })).toHaveCount(0);

  await contextual.getByRole('button', { name: 'Focus selection' }).click();
  await expect(leaf.getByRole('group', { name: /attention focused/ })).toBeVisible();

  const leaf2 = page.locator('.react-flow__node[data-id="leaf2"]');
  await leaf2.click({ modifiers: ['Control'] });
  await contextual.getByRole('button', { name: 'Add selection to focus' }).click();
  await expect(leaf2.getByRole('group', { name: /attention focused/ })).toBeVisible();
  await leaf2.click({ modifiers: ['Control'] });
  await expect(leaf).toHaveClass(/selected/);
  await expect(leaf2).not.toHaveClass(/selected/);
  await contextual.getByRole('button', { name: 'Remove selection from focus' }).click();
  await expect(leaf.getByRole('group', { name: /attention focused/ })).toHaveCount(0);
  await expect(leaf2.getByRole('group', { name: /attention focused/ })).toBeVisible();

  await contextual.getByRole('button', { name: 'Open Attention policy' }).click();

  const project = page.getByRole('navigation', { name: 'Project source' });
  await expect(project).toBeVisible();
  const viewPolicies = project.getByRole('region', { name: 'View policies' });
  await expect(viewPolicies.getByRole('button', { name: /Attention/ })).toBeVisible();
  await expect(viewPolicies.locator('.studio-attention-controls')).toBeVisible();
  const outline = project.getByRole('region', { name: 'Topology outline' });
  await expect(outline.getByText('Attention', { exact: true })).toHaveCount(0);
  await expect(properties).toBeVisible();
});

test('hands contextual Attention off to Project Source on a compact viewport', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 760 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();

  const properties = await openStudioWorkspace(page, 'Properties');
  const openPolicy = properties
    .locator('#studio-edit-attention-content')
    .getByRole('button', { name: 'Open Attention policy' });
  await openPolicy.scrollIntoViewIfNeeded();
  await openPolicy.click();

  await expect(properties).toBeHidden();
  const project = page.getByRole('navigation', { name: 'Project source' });
  await expect(project).toBeVisible();
  await expect(project.getByRole('region', { name: 'View policies' }).locator('.studio-attention-controls')).toBeVisible();
});

test('authors a region aggregate and its expansion behavior from selection', async ({ page }) => {
  await page.goto('/?__studio-test-state=region-move');
  const region = page.locator('.react-flow__node[data-id="region:tactical"]');
  await region.click({ position: { x: 20, y: 112 } });
  await expect(region).toHaveClass(/selected/);

  const properties = await openStudioWorkspace(page, 'Properties');
  await properties
    .locator('#studio-edit-attention-content')
    .getByRole('button', { name: 'Aggregate selected structure' })
    .click();
  const manager = await attentionManager(page);
  const group = manager.locator('[data-attention-group-id="aggregate-tactical"]');
  await expect(group).toContainText('tactical');
  await enableSourceControlledSwitch(group.getByRole('switch', { name: 'Start aggregate-tactical expanded' }));
  await enableSourceControlledSwitch(manager.getByRole('switch', { name: 'Expand aggregates on click' }));

  await manager.getByRole('button', { name: 'View attention YAML' }).click();
  await expectEditorContains(page, 'topology', 'id: aggregate-tactical');
  await expectEditorContains(page, 'topology', 'regionId: tactical');
  await expectEditorContains(page, 'topology', 'expandedGroupIds:');
});

test('configures parallel-link grouping and protects an invalid topology draft', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const manager = await attentionManager(page);
  await enableSourceControlledSwitch(manager.getByRole('switch', { name: 'Group parallel links' }));
  const threshold = manager.getByRole('spinbutton', { name: 'Minimum parallel links' });
  await threshold.fill('3');
  await threshold.blur();
  await selectStudioOption(page, manager.getByRole('combobox', { name: 'Grouping keys' }), 'Endpoints and layer');
  await enableSourceControlledSwitch(manager.getByRole('switch', { name: 'Expand grouped links on click' }));

  await manager.getByRole('button', { name: 'View attention YAML' }).click();
  await expectEditorContains(page, 'topology', 'threshold: 3');
  const source = page.getByTestId('studio-source-pane');
  const editor = source.locator('.monaco-editor');
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await source.getByRole('button', { name: 'Apply topology' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');

  await expect(manager.getByRole('switch', { name: 'Group parallel links' })).toBeDisabled();
  await expect(manager.getByRole('button', { name: 'Remove attention' })).toBeDisabled();
  await expect(manager.getByRole('button', { name: 'View attention YAML' })).toBeEnabled();
});

test('requires confirmation before removing the complete attention policy', async ({ page }) => {
  await page.goto('/?__studio-test-state=dense');
  const manager = await attentionManager(page);
  await manager.getByRole('button', { name: 'Remove attention' }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Remove Attention?' });
  await expect(dialog).toBeVisible();
  const cancel = dialog.getByRole('button', { name: 'Cancel' });
  await expect(cancel).toBeFocused();
  await cancel.click();
  await expect(manager.getByRole('switch', { name: 'Group parallel links' })).toBeChecked();

  await manager.getByRole('button', { name: 'Remove attention' }).click();
  await dialog.getByRole('button', { name: 'Remove' }).click();
  await expect(manager).toContainText('Attention is not configured');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
});

test('supports the primary attention workflow without pointer input', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.focus();
  await page.keyboard.press('Enter');

  const project = await openStudioWorkspace(page, 'Project');
  const disclosure = project.getByRole('button', { name: 'Expand attention' });
  await disclosure.focus();
  await page.keyboard.press('Enter');
  const manager = project.locator('.studio-attention-controls');
  await expect(manager).toBeVisible();

  const focusSelection = manager.getByRole('button', { name: 'Focus canvas selection' });
  await focusSelection.focus();
  await page.keyboard.press('Enter');
  await expect(leaf.getByRole('group', { name: /attention focused/ })).toBeVisible();

  const interactiveFocus = manager.getByRole('switch', { name: 'Interactive click focus' });
  await interactiveFocus.focus();
  await page.keyboard.press('Space');
  await expect(interactiveFocus).toBeChecked();

  const viewSource = manager.getByRole('button', { name: 'View attention YAML' });
  await viewSource.focus();
  await page.keyboard.press('Enter');
  await expectEditorContains(page, 'topology', 'attention:');
});
