import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';
import { openStudioWorkspace } from '../support/workspaceRail';

async function selectLeaf(page: Page, id = 'leaf1') {
  await page.locator(`.react-flow__node[data-id="${id}"]`).click();
  return openStudioWorkspace(page, 'Properties');
}

async function basicField(workspace: Locator, label: string, path: string) {
  const search = workspace.getByRole('searchbox', { name: 'Search style attributes' });
  await search.fill(label);
  const field = workspace.locator(`.studio-basic-style-field[data-field-path="${path}"]`);
  await expect(field).toBeVisible();
  return field;
}

async function openStylesheetYaml(workspace: Locator) {
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();
}

async function replaceCandidateColor(page: Page, workspace: Locator, color: string) {
  await openStylesheetYaml(workspace);
  await replaceEditorMatch(page, 'stylesheet', '#44546a', color);
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveAttribute('data-status', 'valid-dirty');
}

test('shares one candidate between Visual and Code without resetting canvas state', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await selectLeaf(page);
  const viewportBefore = await page.locator('.react-flow__viewport').getAttribute('style');

  const field = await basicField(workspace, 'Background color', 'backgroundColor');
  const color = field.locator('input[type="text"]');
  await expect(color).toHaveValue('#44546a');
  await color.fill('#123456');
  await color.press('Enter');

  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveAttribute('data-status', 'valid-dirty');
  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');
  await openStylesheetYaml(workspace);
  await expectEditorContains(page, 'stylesheet', 'node[id = "leaf1"]');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');

  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Visual' }).click();
  await expect((await basicField(workspace, 'Background color', 'backgroundColor')).locator('input[type="text"]')).toHaveValue('#123456');
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toHaveClass(/selected/);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', viewportBefore || '');

  await openStylesheetYaml(workspace);
  await page.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await page.getByRole('button', { name: 'Open workspace panel' }).click();
  const reopened = await openStudioWorkspace(page, 'Properties');
  await expect(reopened.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');
});

test('applies a valid candidate as one undoable stylesheet replacement', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await selectLeaf(page);
  const color = (await basicField(workspace, 'Background color', 'backgroundColor')).locator('input[type="text"]');
  await color.fill('#456789');
  await color.press('Enter');

  await workspace.getByRole('button', { name: 'Apply' }).click();
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveCount(0);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await openStylesheetYaml(workspace);
  await expectEditorContains(page, 'stylesheet', '#456789', false);
});

test('retains invalid YAML, blocks save, previews the last valid candidate, and reverts', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await selectLeaf(page);
  await openStylesheetYaml(workspace);
  const nodeCount = await page.locator('.react-flow__node').count();
  const editor = workspace.getByLabel('stylesheet YAML editor');

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('stylesheet:\n  - selector: node\n    style: [');
  await expect(workspace.getByText(/Invalid Style draft/)).toBeVisible();
  await expect(workspace.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);

  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Style draft');
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();

  await workspace.getByRole('button', { name: 'Revert' }).click();
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveCount(0);
  await expect(workspace.getByRole('button', { name: 'Apply' })).toBeHidden();
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);
});

test('reviews required stylesheet normalization without a second source workspace', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await selectLeaf(page);
  await openStylesheetYaml(workspace);
  const editor = workspace.getByLabel('stylesheet YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('layout:\n  mode: manual\n');
  await workspace.getByRole('button', { name: 'Apply' }).click();

  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Visual' }).click();
  const width = (await basicField(workspace, 'Body width', 'width')).getByRole('spinbutton', { name: 'Body width' });
  await width.fill('112');
  await width.press('Enter');

  const review = page.getByRole('dialog', { name: 'Review stylesheet normalization' });
  await expect(review).toBeVisible();
  await expect(review.getByLabel('Normalization diff')).toContainText('stylesheet:');
  await review.getByRole('button', { name: 'Confirm normalization' }).click();
  await expect(review).toBeHidden();
  await openStylesheetYaml(workspace);
  await expectEditorContains(page, 'stylesheet', 'width: 112');
  await expect(page.getByRole('button', { name: 'Open source workspace' })).toHaveCount(0);
});

test('applies a valid candidate before project save', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await selectLeaf(page);
  const width = (await basicField(workspace, 'Body width', 'width')).getByRole('spinbutton', { name: 'Body width' });
  await width.fill('118');
  await width.press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');

  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveCount(0);
  await openStylesheetYaml(workspace);
  await expectEditorContains(page, 'stylesheet', 'width: 118');
});

test('requires candidate resolution before replacing the current project', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await openStudioWorkspace(page, 'Properties');
  await replaceCandidateColor(page, workspace, '#335577');

  await page.getByRole('button', { name: 'Project menu' }).click();
  await page.getByRole('dialog', { name: 'Projects' }).getByRole('button', { name: 'New project' }).click();
  const resolution = page.getByRole('dialog', { name: 'Resolve Style draft' });
  await expect(resolution).toBeVisible();
  await resolution.getByRole('button', { name: 'Cancel' }).click();
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveAttribute('data-status', 'valid-dirty');

  await page.getByRole('button', { name: 'Project menu' }).click();
  await page.getByRole('dialog', { name: 'Projects' }).getByRole('button', { name: 'New project' }).click();
  await page.getByRole('dialog', { name: 'Resolve Style draft' }).getByRole('button', { name: 'Apply and continue' }).click();
  await expect(page.getByRole('dialog', { name: 'Resolve Style draft' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Project menu' })).toHaveText('Untitled topology');
});

test('offers canonical Basic fields for every stylesheet target', async ({ page }) => {
  await page.goto('/?__studio-test-state=style-coverage');
  const cases = [
    { announcement: 'node Node A selected', id: 'node-a', kind: 'node', selector: '.react-flow__node[data-id="node-a"]' },
    { announcement: 'link A to B selected', id: 'link-a-b', kind: 'link', selector: '.react-flow__edge[data-id="link-a-b"] .react-flow__edge-interaction' },
    { announcement: 'path Protected path selected', id: 'path-a-c', kind: 'path', selector: '.react-flow__edge[data-id="path-a-c:0"] .react-flow__edge-interaction' },
    { announcement: 'region Edge site selected', id: 'region-edge', kind: 'region', selector: '.react-flow__node[data-id="region:region-edge"]' },
    { announcement: 'shape Boundary selected', id: 'shape-note', kind: 'shape', selector: '.react-flow__node[data-id="shape-note"]' },
    { announcement: 'callout callout-note selected', id: 'callout-note', kind: 'callout', selector: '.react-flow__node[data-id="callout-note"]' },
    { announcement: 'text text-note selected', id: 'text-note', kind: 'text', selector: '.react-flow__node[data-id="text-note"]' },
    {
      announcement: 'linkDirection link-a-b:sourceToTarget selected',
      id: 'link-a-b:sourceToTarget',
      kind: 'link direction',
      selector: '.topoviewer-edge-direction-hit-target[data-direction="sourceToTarget"]'
    }
  ];

  for (const item of cases) {
    const target = page.locator(item.selector).first();
    await expect(target).toHaveCount(1);
    await selectCanvasTarget(page, target, item.announcement);
    const workspace = await openStudioWorkspace(page, 'Properties');
    await expect(workspace.locator('.studio-edit-selection-summary')).toBeVisible();
    await expect(workspace.locator('.studio-edit-selection-summary .MuiChip-label')).toHaveText(item.kind === 'link direction' ? 'linkDirection' : item.kind);
    await expect(workspace.locator('.studio-basic-style-field').first()).toBeVisible();
  }
});

test('handles no selection, same-kind mixed values, and mixed-kind selection', async ({ page }) => {
  const updateDepthErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Maximum update depth exceeded')) {
      updateDepthErrors.push(message.text());
    }
  });
  await page.goto('/?__studio-test-state=style-coverage');
  await page.getByTestId('studio-canvas').click({ position: { x: 20, y: 20 } });
  let workspace = await openStudioWorkspace(page, 'Properties');
  await expect(workspace.getByLabel('Viewport settings')).toBeVisible();
  await expect(workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' })).toBeEnabled();

  const nodeA = page.locator('.react-flow__node[data-id="node-a"]');
  const nodeB = page.locator('.react-flow__node[data-id="node-b"]');
  await nodeA.click();
  workspace = await openStudioWorkspace(page, 'Properties');
  let background = (await basicField(workspace, 'Background color', 'backgroundColor')).locator('input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  const generationBeforeBulk = Number(await workspace.locator('.studio-style-candidate-footer').getAttribute('data-generation'));

  await nodeB.click({ modifiers: ['Control'] });
  await expect(workspace.locator('.studio-edit-selection-summary')).toContainText('2 nodes');
  const mixedField = await basicField(workspace, 'Background color', 'backgroundColor');
  await expect(mixedField).toContainText('Mixed');
  background = mixedField.locator('input[type="text"]');
  await background.fill('#abcdef');
  await background.press('Enter');
  await expect(workspace.locator('.studio-style-candidate-footer')).toHaveAttribute('data-generation', String(generationBeforeBulk + 1));
  await openStylesheetYaml(workspace);
  await expectEditorContains(page, 'stylesheet', 'node[id = "node-a"]');
  await expectEditorContains(page, 'stylesheet', 'node[id = "node-b"]');

  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Visual' }).click();
  await nodeB.click();
  await page.locator('.react-flow__edge[data-id="link-a-b"] .react-flow__edge-interaction').dispatchEvent('click', { ctrlKey: true });
  workspace = await openStudioWorkspace(page, 'Properties');
  await expect(workspace.getByText('Visual bulk editing unavailable')).toBeVisible();
  await expect(workspace.getByRole('button', { name: /YAML/ })).toHaveCount(0);
  await expect(workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' })).toBeEnabled();
  await page.waitForTimeout(500);
  expect(updateDepthErrors, 'mixed-kind selection must not trigger a React update loop').toEqual([]);
});
