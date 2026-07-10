import { expect, test, type Page } from '@playwright/test';

async function openWorkspace(page: Page) {
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer).toBeVisible();
  return drawer;
}

test('lazy loads the YAML editor and keeps per-document models isolated', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-future');
  await expect(page.locator('.monaco-editor')).toHaveCount(0);

  const drawer = await openWorkspace(page);
  await expect(drawer.getByTestId('studio-yaml-editor')).toBeVisible();
  await expect(drawer.locator('.monaco-editor')).toBeVisible();
  await expect(drawer.getByLabel('topology YAML editor')).toBeVisible();

  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(drawer.getByLabel('stylesheet YAML editor')).toBeVisible();
  await drawer.getByRole('tab', { name: 'mapper.yaml' }).click();
  await expect(drawer.getByLabel('mapper YAML editor')).toBeVisible();
  await expect(drawer.getByText('mapper.yaml', { exact: true }).first()).toBeVisible();
});

test('keeps invalid YAML isolated, navigates diagnostics, and reverts safely', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  await page.getByText('Future Node', { exact: true }).click();
  const beforeNodes = await page.locator('.react-flow__node').count();
  const drawer = await openWorkspace(page);
  const editor = drawer.getByLabel('topology YAML editor');

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await drawer.getByRole('button', { name: 'Apply' }).click();

  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__node')).toHaveCount(beforeNodes);
  await drawer.getByRole('tab', { name: /Diagnostics/ }).click();
  const issue = drawer.getByRole('button', { name: /invalid yaml/i }).first();
  await expect(issue).toBeVisible();
  await issue.click();
  await expect(drawer.getByLabel('topology YAML editor')).toBeVisible();
  await expect(drawer.getByText(/Line \d+, column \d+/)).toBeVisible();

  await drawer.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await expect(page.locator('.react-flow__node')).toHaveCount(beforeNodes);
});

test('reviews an unapplied source diff and preserves graph shortcuts while editing', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  const drawer = await openWorkspace(page);
  const editor = drawer.getByLabel('topology YAML editor');
  const nodeCount = await page.locator('.react-flow__node').count();

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+f');
  await page.keyboard.insertText('Future Node');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  id: changed-in-draft\n  layers: []\n  nodes: []\n  links: []\n');
  await drawer.getByRole('tab', { name: 'Diff' }).click();
  await expect(drawer.getByText('Unapplied topology.yaml changes')).toBeVisible();
  await expect(drawer.getByText('+  id: changed-in-draft', { exact: true })).toBeVisible();
  await drawer.getByRole('tab', { name: 'YAML' }).click();
  await drawer.getByRole('button', { name: 'Revert' }).click();
  await expect(drawer.getByText('No source changes')).toBeVisible();
});

test('maps schema diagnostics to source and the last valid canvas object', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  const drawer = await openWorkspace(page);
  const editor = drawer.getByLabel('topology YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(
    'graph: { layers: [{ id: physical, name: Physical }], nodes: [{ id: future-node, name: Future Node, layers: [physical], position: [120] }], links: [] }'
  );
  await drawer.getByRole('button', { name: 'Apply' }).click();
  await drawer.getByRole('tab', { name: /Diagnostics/ }).click();
  const issue = drawer.getByRole('button', { name: /invalid topoviewer document/i }).first();
  await expect(issue).toBeVisible();
  await issue.click();

  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Future Node');
  await expect(drawer.getByText(/Line \d+, column \d+/)).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
});

test('correlates canvas selection with source and exposes human-readable history', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await expect(page.getByText('New Router', { exact: true })).toBeVisible();

  const drawer = await openWorkspace(page);
  await expect(drawer.getByText(/graph\.nodes\.0/)).toBeVisible();
  await expect(drawer.getByText(/Line \d+, column \d+/)).toBeVisible();
  await drawer.getByRole('tab', { name: 'History' }).click();
  const entry = drawer.getByRole('listitem').filter({ hasText: 'Create New Router' });
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('topology.yaml');
});

test('navigates from a source cursor to the matching canvas object', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  await page.getByText('Future Node', { exact: true }).click();
  const drawer = await openWorkspace(page);
  await expect(drawer.locator('.view-line').filter({ hasText: 'id: future-node' })).toBeVisible();
  await page.locator('.react-flow__pane').click({ position: { x: 100, y: 250 } });
  await expect(page.getByText('Nothing selected')).toBeVisible();
  await drawer.locator('.view-line').filter({ hasText: 'id: future-node' }).click();

  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Future Node');
});

test('contains an optional editor failure and keeps canvas plus raw source recovery usable', async ({ page }) => {
  await page.goto('/?__studio-test-state=editor-error');
  const drawer = await openWorkspace(page);

  await expect(drawer.getByRole('alert')).toContainText('Enhanced YAML editing is unavailable');
  await expect(drawer.getByLabel('topology YAML editor')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await page.getByTestId('palette-router').click();
  await expect(page.getByText('New Router', { exact: true })).toBeVisible();
});

test('resizes the bottom drawer without covering the primary canvas', async ({ page }) => {
  await page.goto('/');
  const drawer = await openWorkspace(page);
  const separator = drawer.getByRole('separator', { name: 'Resize workspace drawer' });
  const before = await drawer.boundingBox();
  const box = await separator.boundingBox();
  if (!before || !box) throw new Error('Workspace drawer geometry is unavailable.');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 100, { steps: 4 });
  await page.mouse.up();

  const after = await drawer.boundingBox();
  expect(after?.height || 0).toBeGreaterThan(before.height + 60);
  const canvas = await page.getByTestId('studio-canvas').boundingBox();
  expect(canvas?.height || 0).toBeGreaterThan(180);
});
