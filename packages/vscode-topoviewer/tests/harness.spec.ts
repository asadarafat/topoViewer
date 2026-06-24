import { expect, test } from '@playwright/test';
import {
  chooseOption,
  expectActivePanelBeforePreview,
  expectSameVisualRow,
  graphNodeByLabel,
  nodePosition,
  panelOverflowIssues,
  railWidth,
  revertTemplateState,
  selectHarnessObject,
  selectGraphNodes,
  setTopologyText,
  showAllHarnessLayers,
  stylesheetText,
  topologyText,
  waitForHarnessReady,
  waitForHarnessState,
  waitForValidatedGraphObject,
  yamlCompletions,
  yamlHover,
  yamlObjectBlock,
  yamlStyleMetadata,
  type StyleValueDataType
} from './harness-helpers';

function matchingGeneratedObjectId(text: string, prefix: 'link' | 'path', requiredLines: string[]) {
  const idPattern = new RegExp(`(?:^|\\n)\\s*- id: (${prefix}-\\d+)`, 'g');
  const ids = [...text.matchAll(idPattern)].map((match) => match[1]).filter(Boolean);
  return ids.find((id) => requiredLines.every((line) => yamlObjectBlock(text, id).includes(line))) || '';
}

test('renders the browser harness with fixtures, diagnostics, layers, preview, and export wiring', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('TopoViewer')).toBeVisible();
  await expect(page.getByText('Browser harness')).toBeVisible();
  await expect(page.getByLabel('Template')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-controls', 'topoviewer-authoring-tabpanel-0');
  await expect(page.locator('#topoviewer-authoring-tabpanel-0')).toBeVisible();
  await expect(page.locator('#topoviewer-authoring-tabpanel-4')).toBeHidden();
  await expect(page.locator('.topoviewer-vscode-mode-tabs')).toBeVisible();
  for (const tabName of ['Build', 'Inspect', 'YAML', 'Attention', 'Layers']) {
    await expect(page.getByRole('tab', { name: tabName, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Primitives')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Insert Node' })).toBeVisible();
  await expect(page.getByText('Presets')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Insert Router' })).toBeVisible();
  await expect(page.locator('.topoviewer-vscode-editor .monaco-editor')).toBeHidden();
  await expect(page.locator('.topoviewer')).toBeVisible();
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  const editorBox = await page.locator('.topoviewer-vscode-editor').boundingBox();
  const copyBox = await page.locator('.topoviewer-vscode-yaml-copy').boundingBox();
  expect(editorBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(copyBox!.x).toBeGreaterThan(editorBox!.x + editorBox!.width * 0.82);
  expect(copyBox!.y).toBeGreaterThan(editorBox!.y);
  expect(copyBox!.x + copyBox!.width).toBeLessThan(editorBox!.x + editorBox!.width);
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await expect(page.getByLabel('Underlay')).toBeChecked();
  const layerList = page.locator('.topoviewer-vscode-layer-list');
  await expect(layerList.getByText('BGP', { exact: true })).toBeVisible();
  await expect(layerList.getByText('Service', { exact: true })).toBeVisible();
  await expect(layerList.getByText('Operations', { exact: true })).toBeVisible();
  await expect(layerList.locator('.topoviewer-vscode-layer-count').first()).not.toHaveText('0');

  const previewBox = await page.locator('.topoviewer-vscode-preview').boundingBox();
  const actionsBox = await page.locator('.topoviewer-vscode-preview-actions').boundingBox();
  expect(previewBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(actionsBox!.x - previewBox!.x).toBeLessThan(32);

  const layerOverflow = await page.locator('.topoviewer-vscode-layer-list')
    .evaluate((element) => window.getComputedStyle(element).overflowY);
  expect(layerOverflow).toBe('auto');

  await page.getByLabel('Underlay').uncheck();
  await expect(page.getByLabel('Underlay')).not.toBeChecked();

  const exportPromise = page.evaluate(() => new Promise((resolve) => {
    window.addEventListener('topoviewer-export-mock', () => resolve(true), { once: true });
  }));
  await page.getByRole('button', { name: /export/i }).click();
  await expect(exportPromise).resolves.toBeTruthy();
});

test('defaults to a one-third authoring rail and supports resize, reset, and persistence', async ({ page }) => {
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('topoviewer.split.initCleared')) {
      window.localStorage.removeItem('topoviewer.vscodeHarness.splitPercent.v2');
      window.sessionStorage.setItem('topoviewer.split.initCleared', 'true');
    }
  });
  await page.goto('/');

  const workspaceBox = await page.locator('.topoviewer-vscode-workspace').boundingBox();
  const railBox = await page.locator('.topoviewer-vscode-rail').boundingBox();
  expect(workspaceBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  const defaultRatio = railBox!.width / workspaceBox!.width;
  expect(defaultRatio).toBeGreaterThan(0.29);
  expect(defaultRatio).toBeLessThan(0.37);

  const divider = page.getByRole('separator', { name: /resize authoring column and canvas/i });
  await expect(divider).toBeVisible();
  const beforeKeyboard = await railWidth(page);
  await divider.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeKeyboard);
  await expect.poll(() => page.evaluate(() => Number(window.localStorage.getItem('topoviewer.vscodeHarness.splitPercent.v2') || 0)))
    .toBeGreaterThan(33.333);

  await page.reload();
  await page.waitForSelector('.topoviewer-vscode-workspace');
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeKeyboard);

  const beforeDrag = await railWidth(page);
  const dividerBox = await divider.boundingBox();
  expect(dividerBox).not.toBeNull();
  await page.mouse.move(dividerBox!.x + dividerBox!.width / 2, dividerBox!.y + dividerBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(dividerBox!.x + dividerBox!.width / 2 + 110, dividerBox!.y + dividerBox!.height / 2);
  await page.mouse.up();
  await expect.poll(() => railWidth(page)).toBeGreaterThan(beforeDrag + 60);

  await divider.focus();
  await page.keyboard.press('Home');
  await expect.poll(async () => {
    const workspace = await page.locator('.topoviewer-vscode-workspace').boundingBox();
    return (await railWidth(page)) / workspace!.width;
  }).toBeLessThan(0.37);
  await expect.poll(async () => {
    const workspace = await page.locator('.topoviewer-vscode-workspace').boundingBox();
    return (await railWidth(page)) / workspace!.width;
  }).toBeGreaterThan(0.29);
});

test('uses a stacked narrow viewport fallback without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 820 });
  await page.goto('/');

  await expect(page.getByRole('separator', { name: /resize authoring column and canvas/i })).toBeHidden();
  await expect(page.locator('.topoviewer-vscode-preview')).toBeVisible();
  await expect(page.getByText('Primitives')).toBeVisible();
  await expectActivePanelBeforePreview(page, '.topoviewer-vscode-build-pane');

  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await expect(page.getByText('Select a canvas object')).toBeVisible();
  await expectActivePanelBeforePreview(page, '.topoviewer-vscode-inspector-pane');

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await expect(page.locator('.topoviewer-vscode-editor .monaco-editor')).toBeVisible();
  await expectActivePanelBeforePreview(page, '.topoviewer-vscode-yaml-pane');

  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  await expect(page.getByText('Object focus')).toBeVisible();
  await expectActivePanelBeforePreview(page, '.topoviewer-vscode-attention-pane');

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(hasHorizontalOverflow).toBeFalsy();
});

test('wraps attention controls without clipping at the minimum authoring rail width', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('topoviewer.vscodeHarness.splitPercent.v2', '24');
  });
  await page.goto('/');

  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  await expect(page.locator('.topoviewer-vscode-attention-pane')).toBeVisible();
  const attentionPane = page.locator('.topoviewer-vscode-attention-pane');
  for (const sectionName of ['Match by metadata', 'Click behavior', 'Dense summaries']) {
    await attentionPane.getByRole('button', { name: new RegExp(sectionName, 'i') }).click();
  }

  const clippedControls = await attentionPane.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll')?.getBoundingClientRect();
    if (!scroll) return ['attention scroll container missing'];
    const controls = Array.from(pane.querySelectorAll('.MuiFormControl-root, .MuiTextField-root')).filter((control) => {
      const rect = control.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return controls.flatMap((control) => {
      const rect = control.getBoundingClientRect();
      const label = control.querySelector('.MuiInputLabel-root')?.getBoundingClientRect();
      const isFullyVisibleVertically = rect.top >= scroll.top - 1 && rect.bottom <= scroll.bottom + 1;
      const failures: string[] = [];
      if (rect.left < scroll.left - 1 || rect.right > scroll.right + 1) {
        failures.push(`field clipped: ${control.textContent?.trim()}`);
      }
      if (isFullyVisibleVertically && label && label.top < scroll.top - 1) {
        failures.push(`label clipped: ${control.textContent?.trim()}`);
      }
      return failures;
    });
  });
  expect(clippedControls).toEqual([]);

  const inputHeightDelta = await page.evaluate(() => {
    const roots = [
      ...Array.from(document.querySelectorAll('.topoviewer-vscode-fixture .MuiInputBase-root')),
      ...Array.from(document.querySelectorAll('.topoviewer-vscode-attention-pane .MuiInputBase-root'))
    ];
    const heights = roots
      .map((input) => input.getBoundingClientRect().height)
      .filter((height) => height > 0);
    return Math.max(...heights) - Math.min(...heights);
  });
  expect(inputHeightDelta).toBeLessThanOrEqual(1);
});

test('keeps relationship composer controls compact at the minimum authoring rail width', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('topoviewer.vscodeHarness.splitPercent.v2', '24');
  });
  await page.goto('/');

  const build = page.locator('.topoviewer-vscode-build-pane');
  await build.getByRole('button', { name: 'Insert Path' }).click();
  await expect(build.getByText('Path sequence')).toBeVisible();

  const clippedControls = await build.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll')?.getBoundingClientRect();
    if (!scroll) return ['build scroll container missing'];
    const controls = Array.from(pane.querySelectorAll('.topoviewer-vscode-relationship-composer .MuiFormControl-root, .topoviewer-vscode-relationship-composer .MuiTextField-root')).filter((control) => {
      const rect = control.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return controls.flatMap((control) => {
      const rect = control.getBoundingClientRect();
      const label = control.querySelector('.MuiInputLabel-root')?.getBoundingClientRect();
      const isFullyVisibleVertically = rect.top >= scroll.top - 1 && rect.bottom <= scroll.bottom + 1;
      const failures: string[] = [];
      if (rect.left < scroll.left - 1 || rect.right > scroll.right + 1) {
        failures.push(`field clipped: ${control.textContent?.trim()}`);
      }
      if (isFullyVisibleVertically && label && label.top < scroll.top - 1) {
        failures.push(`label clipped: ${control.textContent?.trim()}`);
      }
      return failures;
    });
  });
  expect(clippedControls).toEqual([]);
});

test('keeps Inspect semantic key/value rows aligned at the default authoring rail width', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('node:fra-pe');
  await inspector.getByText('Labels', { exact: true }).scrollIntoViewIfNeeded();
  expect(await panelOverflowIssues(inspector)).toEqual([]);
  await expect(inspector.locator('.topoviewer-vscode-style-row')).toHaveCount(0);
  await expect(inspector.getByRole('button', { name: 'Apply styles' })).toHaveCount(0);

  const labelRow = inspector.locator('[data-label-row-key="role"]');
  await expectSameVisualRow(labelRow, [
    labelRow.locator('.MuiTextField-root').nth(0),
    labelRow.locator('.MuiTextField-root').nth(1),
    labelRow.getByRole('button', { name: 'Remove' })
  ]);
});

test('keeps Inspect semantic key/value rows aligned at the minimum authoring rail width', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('topoviewer.vscodeHarness.splitPercent.v2', '24');
  });
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('node:fra-pe');
  await inspector.getByText('Labels', { exact: true }).scrollIntoViewIfNeeded();
  expect(await panelOverflowIssues(inspector)).toEqual([]);
  await inspector.getByText('Data', { exact: true }).scrollIntoViewIfNeeded();
  expect(await panelOverflowIssues(inspector)).toEqual([]);
  await expect(inspector.locator('.topoviewer-vscode-style-row')).toHaveCount(0);
});

test('prefills relationship composers from selected nodes', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await selectGraphNodes(page, ['FRA-PE', 'AMS-P', 'LON-PE']);
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('3 node selected');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  const build = page.locator('.topoviewer-vscode-build-pane');
  await build.getByRole('button', { name: 'Insert Connection' }).click();
  await expect(build.getByRole('combobox', { name: 'Connection source' })).toHaveText('FRA-PE');
  await expect(build.getByRole('combobox', { name: 'Connection target' })).toHaveText('AMS-P');

  await build.getByRole('button', { name: 'Insert Path' }).click();
  await expect(build.getByRole('combobox', { name: 'Path source' })).toHaveText('FRA-PE');
  await expect(build.getByText('AMS-P')).toBeVisible();
  await expect(build.getByRole('combobox', { name: 'Path target' })).toHaveText('LON-PE');
});

test('supports authoring modes, selection, multi-select, and blank-canvas clear', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await expect(page.getByRole('tab', { name: 'Build', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'YAML', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Attention', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Layers', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  await graphNodeByLabel(page, 'FRA-PE').click();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('1 node selected');
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute('aria-selected', 'true');
  await graphNodeByLabel(page, 'AMS-P').click({ modifiers: ['Shift'] });
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('2 node selected');
  await page.locator('.react-flow__pane').click({ position: { x: 24, y: 120 } });
  await expect(page.getByText('Select a canvas object')).toBeVisible();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).not.toContainText('selected');
});

test('inserts objects into structured topology YAML and supports undo and redo', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await expect(page.getByText('New Node')).toHaveCount(0);
  const undoButton = page.getByRole('button', { name: 'Undo' });
  const redoButton = page.getByRole('button', { name: 'Redo' });
  await expect(undoButton).toBeDisabled();
  await expect(redoButton).toBeDisabled();

  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'New Node' })).toBeVisible();
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await expect.poll(() => topologyText(page)).toContain('layers:');
  await expect(undoButton).toBeEnabled();
  await expect(redoButton).toBeDisabled();

  await undoButton.click();
  await expect.poll(() => topologyText(page)).not.toContain('id: node-1');
  await expect(undoButton).toBeDisabled();
  await expect(redoButton).toBeEnabled();

  await redoButton.click();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await expect(undoButton).toBeEnabled();
  await expect(redoButton).toBeDisabled();
});

test('creates saved topologies, reverts templates, and copies YAML', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('button', { name: 'New topology' }).click();
  await waitForHarnessState(page);
  await expect(page.getByLabel('Template')).toHaveText('Custom topology 1');
  await expect.poll(() => topologyText(page)).toContain('id: custom-topology');

  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect(page.locator('.react-flow__node').filter({ hasText: 'New Node' })).toBeVisible();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('Saved topology');

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByLabel('Template')).toHaveText('Custom topology 1');
  await expect.poll(() => topologyText(page)).toContain('id: node-1');

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await page.getByRole('button', { name: 'Copy Topology YAML' }).click();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('Copied Topology YAML');

  await page.getByRole('button', { name: 'Remove saved' }).click();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect(page.getByLabel('Template')).toHaveText('Layered network authoring');
  await expect.poll(() => topologyText(page)).not.toContain('id: node-1');

  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await waitForHarnessReady(page);
  await expect.poll(() => topologyText(page)).toContain('id: node-1');
  await page.getByRole('button', { name: 'Revert template' }).click();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(() => topologyText(page)).not.toContain('id: node-1');
});

test('undoes and redoes created connection YAML', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);
  const build = page.locator('.topoviewer-vscode-build-pane');

  await build.getByRole('button', { name: 'Insert Connection' }).click();
  await chooseOption(page, build.getByRole('combobox', { name: 'Connection source' }), 'FRA-PE');
  await chooseOption(page, build.getByRole('combobox', { name: 'Connection target' }), 'LON-PE');
  await build.getByRole('button', { name: 'Create connection' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: link-1');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: link-1');

  await page.reload();
  await waitForHarnessReady(page);
  await expect.poll(() => topologyText(page)).toContain('id: link-1');
  await revertTemplateState(page);
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');
});

test('authors and edits explicit connections and path sequences', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await waitForHarnessReady(page);
  if (/\bid: link-\d+\b/.test(await topologyText(page))) {
    await revertTemplateState(page);
    await waitForHarnessReady(page);
  }
  await showAllHarnessLayers(page);
  const build = page.locator('.topoviewer-vscode-build-pane');

  await build.getByRole('button', { name: 'Insert Connection' }).click();
  await expect(build.getByLabel('Connection source')).toBeVisible();
  await chooseOption(page, build.getByRole('combobox', { name: 'Connection source' }), 'FRA-PE');
  await chooseOption(page, build.getByRole('combobox', { name: 'Connection target' }), 'LON-PE');
  await build.getByRole('button', { name: 'Create connection' }).click();
  let createdLinkId = '';
  await expect.poll(async () => {
    createdLinkId = matchingGeneratedObjectId(await topologyText(page), 'link', ['source: fra-pe', 'target: lon-pe']);
    return createdLinkId;
  }).toMatch(/^link-\d+$/);
  await expect.poll(() => topologyText(page)).toContain('source: fra-pe');
  await expect.poll(() => topologyText(page)).toContain('target: lon-pe');
  await waitForValidatedGraphObject(page, 'links', createdLinkId);
  await showAllHarnessLayers(page);
  await selectHarnessObject(page, 'link', createdLinkId);
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue(`link:${createdLinkId}`);
  await chooseOption(page, inspector.getByRole('combobox', { name: 'Link target' }), 'AMS-P');
  await inspector.getByRole('button', { name: 'Apply relationship' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), createdLinkId);
  }).toContain('target: ams-p');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), createdLinkId);
  }).toContain('target: lon-pe');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), createdLinkId);
  }).toContain('target: ams-p');

  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await build.getByRole('button', { name: 'Insert Path' }).click();
  await chooseOption(page, build.getByRole('combobox', { name: 'Path source' }), 'FRA-PE');
  await chooseOption(page, build.getByRole('combobox', { name: 'Path target' }), 'NOC');
  await chooseOption(page, build.getByRole('combobox', { name: 'Add transit node' }), 'AMS-P');
  await build.getByRole('button', { name: 'Add' }).click();
  await expect(build.getByText('AMS-P')).toBeVisible();
  await chooseOption(page, build.getByRole('combobox', { name: 'Add transit node' }), 'LON-PE');
  await build.getByRole('button', { name: 'Add' }).click();
  await build.locator('.topoviewer-vscode-transit-row').filter({ hasText: 'AMS-P' }).getByRole('button', { name: 'Down' }).click();
  await build.getByRole('button', { name: 'Create path' }).click();
  let createdPathId = '';
  await expect.poll(async () => {
    createdPathId = matchingGeneratedObjectId(await topologyText(page), 'path', ['- fra-pe', '- lon-pe', '- ams-p', '- noc']);
    return createdPathId;
  }).toMatch(/^path-\d+$/);
  await waitForValidatedGraphObject(page, 'paths', createdPathId);
  await expect.poll(() => topologyText(page)).toContain('sequence:');
  await expect.poll(() => topologyText(page)).toContain('- fra-pe');
  await expect.poll(() => topologyText(page)).toContain('- lon-pe');
  await expect.poll(() => topologyText(page)).toContain('- ams-p');
  await expect.poll(() => topologyText(page)).toContain('- noc');
  await expect.poll(async () => {
    const block = yamlObjectBlock(await topologyText(page), createdPathId);
    return block.indexOf('- lon-pe') < block.indexOf('- ams-p');
  }).toBeTruthy();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain(`id: ${createdPathId}`);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).toContain(`id: ${createdPathId}`);
});

test('edits existing path sequences in Inspector with undo and redo', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await selectHarnessObject(page, 'path', 'payments-path');
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('path:payments-path');
  await chooseOption(page, inspector.getByRole('combobox', { name: 'Path target' }), 'NOC');
  await inspector.locator('.topoviewer-vscode-transit-row').filter({ hasText: 'AMS-P' }).getByRole('button', { name: 'Remove' }).click();
  await inspector.getByRole('button', { name: 'Apply relationship' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), 'payments-path');
  }).toContain('- noc');
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), 'payments-path');
  }).not.toContain('- ams-p');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), 'payments-path');
  }).toContain('- lon-pe');
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), 'payments-path');
  }).toContain('- ams-p');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => {
    return yamlObjectBlock(await topologyText(page), 'payments-path');
  }).toContain('- noc');
});

test('persists dragged node positions into topology YAML with undo and redo', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);
  const before = nodePosition(await topologyText(page), 'fra-pe');
  expect(before).toEqual({ x: 150, y: 260 });

  const node = page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).first();
  const box = await node.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 90, box!.y + box!.height / 2 + 30, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => {
    const next = nodePosition(await topologyText(page), 'fra-pe');
    return next ? `${next.x},${next.y}` : '';
  }).not.toBe('150,260');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => nodePosition(await topologyText(page), 'fra-pe')).toEqual({ x: 150, y: 260 });

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => {
    const next = nodePosition(await topologyText(page), 'fra-pe');
    return next ? `${next.x},${next.y}` : '';
  }).not.toBe('150,260');

  const moved = nodePosition(await topologyText(page), 'fra-pe');
  expect(moved).toBeDefined();
  await page.reload();
  await waitForHarnessReady(page);
  await expect.poll(async () => nodePosition(await topologyText(page), 'fra-pe')).toEqual(moved);
});

test('updates selected object properties and deletes with reversible YAML mutations', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('node:fra-pe');
  await expect(inspector.getByLabel('Display name')).toHaveValue('FRA-PE');
  const clippedInspectorLabels = await inspector.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll')?.getBoundingClientRect();
    if (!scroll) return ['inspector scroll container missing'];
    return Array.from(pane.querySelectorAll('.MuiInputLabel-root')).flatMap((label) => {
      const rect = label.getBoundingClientRect();
      return rect.top < scroll.top - 1 ? [`label clipped: ${label.textContent?.trim()}`] : [];
    });
  });
  expect(clippedInspectorLabels).toEqual([]);
  await inspector.getByLabel('Display name').fill('FRA-PE Edited');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(() => topologyText(page)).toContain('name: FRA-PE Edited');

  await expect(inspector.locator('[data-label-row-key="role"]').getByLabel('Label value')).toHaveValue('pe');
  await expect(inspector.locator('[data-data-row-key="status"]').getByLabel('Data value')).toHaveValue('ok');
  await inspector.getByRole('button', { name: 'Add label row' }).click();
  const labelRows = inspector.locator('[data-label-row-key]');
  await labelRows.last().getByLabel('Label key').fill('owner');
  await labelRows.last().getByLabel('Label value').fill('core');
  await inspector.getByRole('button', { name: 'Apply labels' }).click();
  await inspector.getByRole('button', { name: 'Add data row' }).click();
  const dataRows = inspector.locator('[data-data-row-key]');
  await dataRows.last().getByLabel('Data key').fill('ticket');
  await dataRows.last().getByLabel('Data value').fill('INC-1');
  await inspector.getByRole('button', { name: 'Apply data' }).click();
  await expect(inspector.locator('.topoviewer-vscode-style-row')).toHaveCount(0);
  await expect(inspector.getByRole('button', { name: 'Apply styles' })).toHaveCount(0);

  await expect.poll(() => topologyText(page)).toContain('owner: core');
  await expect.poll(() => topologyText(page)).toContain('ticket: INC-1');

  await inspector.getByLabel('Preset name').fill('Edited PE');
  await inspector.getByRole('button', { name: 'Save as preset' }).click();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Insert Edited PE' })).toBeVisible();
  await page.getByRole('button', { name: 'Insert Edited PE' }).click();
  await expect.poll(() => topologyText(page)).toContain('name: Edited PE');

  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await inspector.getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: fra-pe');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: fra-pe');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: fra-pe');
});

test('preserves invalid Monaco content when a structured mutation cannot be applied', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await setTopologyText(page, 'graph: [');
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('invalid-topoviewer-document');
  await expect.poll(() => page.evaluate(() => {
    const markers = (window as any).monaco?.editor?.getModelMarkers?.({ owner: 'topoviewer' }) || [];
    return markers.map((marker: { message: string; startLineNumber: number }) => `${marker.startLineNumber}:${marker.message}`).join('\n');
  })).toContain('2:');
  await expect(page.locator('.topoviewer-vscode-diagnostic-line--error').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect.poll(() => topologyText(page)).toBe('graph: [');
});

test('suggests topology keys and node references in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const nodeKeySuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - ',
    lineNumber: 3,
    column: 7
  });
  expect(nodeKeySuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'id',
    'name',
    'labels',
    'data',
    'layers',
    'position'
  ]));

  const sourceSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  links:\n    - source: ',
    lineNumber: 3,
    column: 15
  });
  expect(sourceSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'fra-pe',
    'ams-p',
    'lon-pe'
  ]));

  const hover = await yamlHover(page, {
    document: 'topology',
    text: 'graph:\n  links:\n    - source: fra-pe',
    lineNumber: 3,
    column: 8
  });
  expect(hover?.contents).toContain('Source graph node ID');
});

test('suggests stylesheet selectors, style keys, and typed values in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const selectorSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: ',
    lineNumber: 2,
    column: 15
  });
  expect(selectorSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'node',
    'node[id = "fra-pe"]',
    'node[labels.role = "pe"]',
    'node[data.status = "ok"]'
  ]));

  const styleKeySuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      ',
    lineNumber: 4,
    column: 7
  });
  expect(styleKeySuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'shape',
    'borderColor',
    'labelPosition'
  ]));

  const enumSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      shape: ',
    lineNumber: 4,
    column: 14
  });
  expect(enumSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'ellipse',
    'hexagon',
    'diamond'
  ]));

  const colorSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      borderColor: ',
    lineNumber: 4,
    column: 20
  });
  expect(colorSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    '#1976d2',
    '#42a5f5',
    '#d32f2f',
    '#2e7d32'
  ]));

  const integerSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      width: ',
    lineNumber: 4,
    column: 14
  });
  expect(integerSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    '0',
    '16',
    '96'
  ]));
  expect(integerSuggestions.map((suggestion) => suggestion.label)).not.toContain('#1976d2');

  const hover = await yamlHover(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      borderColor: "#1976d2"',
    lineNumber: 4,
    column: 12
  });
  expect(hover?.contents).toContain('Border color');
});

test('covers every stylesheet style key and value type in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const metadata = await yamlStyleMetadata(page);
  const seenDataTypes = new Set<StyleValueDataType>();

  for (const [kind, options] of Object.entries(metadata.optionsByKind)) {
    const suggestions = await yamlCompletions(page, {
      document: 'stylesheet',
      text: `stylesheet:\n  - selector: ${kind}\n    style:\n      `,
      lineNumber: 4,
      column: 7
    });
    const suggestionsByLabel = new Map(suggestions.map((suggestion) => [suggestion.label, suggestion]));

    for (const option of options) {
      const suggestion = suggestionsByLabel.get(option.key);
      expect(suggestion, `${kind}.${option.key} should be suggested`).toBeTruthy();
      expect(suggestion?.detail, `${kind}.${option.key} should include a grouping detail`).toBeTruthy();
      expect(suggestion?.documentation, `${kind}.${option.key} should document its value type`).toContain('Value type:');
    }
  }

  for (const [kind, definitions] of Object.entries(metadata.valueTypesByKind)) {
    for (const [key, definition] of Object.entries(definitions)) {
      seenDataTypes.add(definition.dataType);
      const valueLine = `      ${key}: `;
      const suggestions = await yamlCompletions(page, {
        document: 'stylesheet',
        text: `stylesheet:\n  - selector: ${kind}\n    style:\n${valueLine}`,
        lineNumber: 4,
        column: valueLine.length + 1
      });
      const labels = suggestions.map((suggestion) => suggestion.label);

      if (definition.dataType === 'enum') {
        expect(labels, `${kind}.${key} should suggest every enum value`).toEqual(expect.arrayContaining(definition.options || []));
        continue;
      }
      if (definition.dataType === 'boolean') {
        expect(labels, `${kind}.${key} should suggest boolean values`).toEqual(expect.arrayContaining(['true', 'false']));
        continue;
      }
      if (definition.dataType === 'color') {
        expect(labels, `${kind}.${key} should suggest palette colors`).toEqual(expect.arrayContaining(['#1976d2', '#42a5f5', '#d32f2f', '#2e7d32']));
        continue;
      }
      if (definition.dataType === 'integer') {
        expect(labels, `${kind}.${key} should suggest integer values`).toEqual(expect.arrayContaining(['0', '16', '96']));
        expect(labels, `${kind}.${key} should not suggest color values`).not.toContain('#1976d2');
        continue;
      }
      if (definition.dataType === 'number') {
        expect(labels, `${kind}.${key} should suggest numeric values`).toEqual(expect.arrayContaining(['0', '0.5', '1']));
        expect(labels, `${kind}.${key} should not suggest color values`).not.toContain('#1976d2');
        continue;
      }
      expect(labels, `${kind}.${key} text values should stay free-form`).toHaveLength(0);
    }
  }

  expect([...seenDataTypes].sort()).toEqual(['boolean', 'color', 'enum', 'integer', 'number', 'text']);
});

test('creates a selected node style rule and opens YAML suggestions', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).click();
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect(page.getByRole('tab', { name: 'Stylesheet YAML' })).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => stylesheetText(page)).toContain('selector: node[id = "fra-pe"]');
  await expect.poll(() => stylesheetText(page)).toContain('opacity: 1');
  await expect(page.locator('.suggest-widget')).toBeVisible();
  await expect(page.locator('.monaco-list-row').filter({ hasText: 'backgroundColor' }).first()).toBeVisible();

  await page.keyboard.press('Escape');
  const beforeHelp = await stylesheetText(page);
  await page.keyboard.type('?');
  await expect(page.locator('.suggest-widget')).toBeVisible();
  await expect.poll(() => stylesheetText(page)).toBe(beforeHelp);
  await page.keyboard.press('Escape');
  await revertTemplateState(page);
});

test('creates selected link and path style rules with object-specific selectors', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);
  await showAllHarnessLayers(page);

  await selectHarnessObject(page, 'link', 'underlay-fra-ams');
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect.poll(() => stylesheetText(page)).toContain('selector: link[id = "underlay-fra-ams"]');

  await selectHarnessObject(page, 'path', 'payments-path');
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect.poll(() => stylesheetText(page)).toContain('selector: path[id = "payments-path"]');
  await revertTemplateState(page);
});

test('authors attention focus, interaction, aggregation, and link grouping YAML', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('tab', { name: 'Attention', exact: true }).click();
  const attention = page.locator('.topoviewer-vscode-attention-pane');
  await page.locator('.react-flow__node').filter({ hasText: 'LON-PE' }).click();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('1 node selected');
  await expect(attention.getByRole('combobox', { name: 'Focus' })).toHaveText('Nodes');
  await expect(attention.getByRole('combobox', { name: 'Object' })).toHaveText('lon-pe');
  await expect(attention.getByText('Dim keeps context visible. Hide removes non-matching objects.')).toBeVisible();
  await expect.poll(() => topologyText(page)).toContain('ids:');
  await expect.poll(() => topologyText(page)).toContain('- lon-pe');
  await page.locator('.react-flow__node').filter({ hasText: 'FRA-PE' }).dispatchEvent('click');
  await expect(attention.getByRole('combobox', { name: 'Object' })).toHaveText('fra-pe');
  await expect.poll(() => topologyText(page)).toContain('- fra-pe');

  await attention.getByRole('button', { name: /Match by metadata/i }).click();
  const metadata = attention.locator('.MuiAccordion-root').filter({ hasText: 'Match by metadata' });
  await expect(metadata.getByText('Focus every object with a matching label or data value.')).toBeVisible();
  await metadata.getByLabel('Label key').fill('role');
  await metadata.getByLabel('Value').first().fill('pe');
  await metadata.getByRole('button', { name: 'Apply attention label focus' }).click();
  await expect.poll(() => topologyText(page)).toContain('labels:');
  await expect.poll(() => topologyText(page)).toContain('role: pe');

  await metadata.getByLabel('Data key').fill('severity');
  await metadata.getByLabel('Value').last().fill('major');
  await metadata.getByRole('button', { name: 'Apply attention data focus' }).click();
  await expect.poll(() => topologyText(page)).toContain('data:');
  await expect.poll(() => topologyText(page)).toContain('severity: major');

  await attention.getByRole('button', { name: /Click behavior/i }).click();
  const clickBehavior = attention.locator('.MuiAccordion-root').filter({ hasText: 'Click behavior' });
  await clickBehavior.getByLabel('Interactive').check();
  await clickBehavior.getByRole('button', { name: 'Apply click behavior' }).click();
  await expect.poll(() => topologyText(page)).toContain('interactive: true');

  await attention.getByRole('button', { name: /Dense summaries/i }).click();
  const denseSummaries = attention.locator('.MuiAccordion-root').filter({ hasText: 'Dense summaries' });
  await denseSummaries.getByRole('button', { name: 'Aggregate region' }).click();
  await expect.poll(() => topologyText(page)).toContain('by: region');
  await expect.poll(() => topologyText(page)).toContain('expandOnClick: true');

  await denseSummaries.getByLabel('Link threshold').fill('3');
  await denseSummaries.getByRole('button', { name: 'Group links' }).click();
  await expect.poll(() => topologyText(page)).toContain('threshold: 3');
});

test('serves validation through the local fixture API', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const stylesheet = await (await request.get('/fixtures/layered-network/stylesheet.yaml')).text();
  const response = await request.post('/validate', {
    data: { topologyText: topology, stylesheetText: stylesheet }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toEqual([]);
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('underlay');
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('operations');
  expect(body.layers.every((layer: { objectCount: number }) => layer.objectCount > 0)).toBeTruthy();
});

test('reports missing companion files through validation diagnostics', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const response = await request.post('/validate', {
    data: {
      topologyText: topology,
      stylesheetText: '',
      stylesheetPath: '/workspace/stylesheet.yaml',
      stylesheetMissing: true
    }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'warning',
    source: 'host',
    code: 'missing-stylesheet-yaml'
  }));
});

test('harness fixtures do not expose empty layers', async ({ request }) => {
  const fixtures = await (await request.get('/fixtures')).json() as Array<{ id: string }>;
  expect(fixtures.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
    'clos-2spine-4leaf',
    'insert-workflow',
    'attention-workflow',
    'inspector-workflow',
    'dense-links'
  ]));

  for (const fixture of fixtures) {
    const topology = await (await request.get(`/fixtures/${fixture.id}/topology.yaml`)).text();
    const stylesheet = await (await request.get(`/fixtures/${fixture.id}/stylesheet.yaml`)).text();
    const response = await request.post('/validate', {
      data: { topologyText: topology, stylesheetText: stylesheet }
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { layers: Array<{ id: string; objectCount: number }> };
    expect(body.layers.length, `${fixture.id} should declare at least one layer`).toBeGreaterThan(0);
    for (const layer of body.layers) {
      expect(layer.objectCount, `${fixture.id}:${layer.id} should have objects`).toBeGreaterThan(0);
    }
  }
});

test.describe('browser harness theme mode', () => {
  test.use({ colorScheme: 'dark' });

  test('starts from browser system color scheme and toggles light and dark', async ({ page }) => {
    await page.goto('/');
    const shell = page.locator('.topoviewer-vscode-shell');

    await expect(shell).toHaveAttribute('data-color-mode', 'dark');
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(shell).toHaveAttribute('data-color-mode', 'light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(shell).toHaveAttribute('data-color-mode', 'dark');
  });
});
