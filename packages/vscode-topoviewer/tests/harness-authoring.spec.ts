import { expect, test } from '@playwright/test';
import {
  expectCurrentHarnessServer,
  graphNodeByLabel,
  nodePosition,
  selectGraphNodes,
  selectHarnessObject,
  selectedPreviewObjectCount,
  showAllHarnessLayers,
  stylesheetText,
  topologyText,
  waitForHarnessReady,
  waitForValidatedGraphNodes,
  waitForValidatedLayers,
  waitForHarnessState,
  yamlObjectBlock,
} from './harness-helpers';

const HARNESS_ALLOWED_BROWSER_ERROR_PATTERNS = [
  /ResizeObserver loop completed with undelivered notifications/,
  /Error inlining remote css file/,
  /Error loading remote stylesheet/,
  /Error while reading CSS rules from/
];
const harnessBrowserErrors = new WeakMap<object, string[]>();

async function startNewTopology(page: Parameters<typeof topologyText>[0]) {
  await page.goto('/');
  await waitForHarnessReady(page);
  await page.getByRole('button', { name: 'New topology' }).click();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(() => topologyText(page)).toContain('mode: manual');
  await expect.poll(() => topologyText(page)).toContain('id: physical');
  await expect.poll(() => stylesheetText(page)).toContain('curveStyle: bezier');
  await waitForValidatedLayers(page, ['physical', 'service', 'operations']);
  await showAllHarnessLayers(page, ['Physical', 'Service', 'Operations']);
}

async function topologyPointForClientClick(page: Parameters<typeof topologyText>[0], clientX: number, clientY: number) {
  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const viewport = await page.locator('.react-flow__viewport').evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
    return { x: matrix.m41, y: matrix.m42, zoom: matrix.a || 1 };
  });
  return {
    x: (clientX - paneBox!.x - viewport.x) / viewport.zoom,
    y: (clientY - paneBox!.y - viewport.y) / viewport.zoom
  };
}

test.beforeEach(async ({ page }) => {
  const browserErrors: string[] = [];
  harnessBrowserErrors.set(page, browserErrors);
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await expectCurrentHarnessServer(page);
});

test.afterEach(async ({ page }) => {
  const browserErrors = harnessBrowserErrors.get(page) || [];
  const actionableErrors = browserErrors.filter((line) => (
    !HARNESS_ALLOWED_BROWSER_ERROR_PATTERNS.some((pattern) => pattern.test(line))
  ));
  expect(actionableErrors).toEqual([]);
});

test('keeps new topology insertions manual after connection creation and position update', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('button', { name: 'Insert Node' }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect(graphNodeByLabel(page, 'New Node')).toHaveCount(2);

  const firstPosition = nodePosition(await topologyText(page), 'node-1');
  const secondPosition = nodePosition(await topologyText(page), 'node-2');
  expect(firstPosition).toBeDefined();
  expect(secondPosition).toBeDefined();
  expect(firstPosition).not.toEqual(secondPosition);
  expect(Math.hypot(firstPosition!.x - secondPosition!.x, firstPosition!.y - secondPosition!.y)).toBeGreaterThanOrEqual(120);

  const build = page.locator('.topoviewer-vscode-build-pane');
  await build.getByRole('button', { name: 'Insert Connection' }).click();
  await expect(build.getByRole('combobox', { name: 'Connection source' })).toHaveText('New Node (node-1)');
  await expect(build.getByRole('combobox', { name: 'Connection target' })).toHaveText('New Node (node-2)');
  await expect(build.getByRole('button', { name: 'Create connection' })).toBeEnabled();
  await build.getByRole('button', { name: 'Create connection' }).click();
  await expect.poll(() => topologyText(page)).toContain('source: node-1');
  await expect.poll(() => topologyText(page)).toContain('target: node-2');

  await selectHarnessObject(page, 'node', 'node-1');
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await inspector.getByRole('textbox', { name: 'X', exact: true }).fill(String(firstPosition!.x + 120));
  await inspector.getByRole('textbox', { name: 'Y', exact: true }).fill(String(firstPosition!.y + 80));
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual({
    x: firstPosition!.x + 120,
    y: firstPosition!.y + 80
  });
  const movedPosition = nodePosition(await topologyText(page), 'node-1');
  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(movedPosition);
});

test('creates new objects on the currently visible authoring layer', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  const physical = page.getByRole('checkbox', { name: 'Physical' });
  const service = page.getByRole('checkbox', { name: 'Service' });
  await expect(physical).toBeChecked();
  await expect(service).toBeChecked();
  await physical.uncheck();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect(graphNodeByLabel(page, 'New Node')).toBeVisible();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).toContain('- service');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).not.toContain('- physical');
});

test('activates canvas authoring tools from toolbar buttons and keyboard shortcuts', async ({ page }) => {
  await startNewTopology(page);

  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  await expect(toolbar).toBeVisible();

  const selectTool = toolbar.getByRole('button', { name: 'Select tool' });
  const nodeTool = toolbar.getByRole('button', { name: 'Node tool' });
  const linkTool = toolbar.getByRole('button', { name: 'Link tool' });
  const shapeTool = toolbar.getByRole('button', { name: 'Shape tool' });

  await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  await nodeTool.click();
  await expect(nodeTool).toHaveAttribute('aria-pressed', 'true');
  await expect(selectTool).toHaveAttribute('aria-pressed', 'false');

  await page.keyboard.press('l');
  await expect(linkTool).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('n');
  await expect(nodeTool).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('d');
  await expect(shapeTool).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
});

test('places generic nodes from canvas clicks with stable YAML positions', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const click = {
    x: paneBox!.x + paneBox!.width * 0.63,
    y: paneBox!.y + paneBox!.height * 0.58
  };
  const expected = await topologyPointForClientClick(page, click.x, click.y);

  await page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(click.x, click.y);
  await waitForValidatedGraphNodes(page, ['node-1']);
  await expect(graphNodeByLabel(page, 'New Node')).toBeVisible();
  await expect.poll(() => selectedPreviewObjectCount(page)).toBe(1);

  const placed = nodePosition(await topologyText(page), 'node-1');
  expect(placed).toBeDefined();
  expect(Math.abs(placed!.x - expected.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(placed!.y - expected.y)).toBeLessThanOrEqual(1);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).toContain('- physical');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: node-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(placed);
  await page.reload();
  await waitForHarnessState(page);
  await waitForValidatedGraphNodes(page, ['node-1']);
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(placed);
});

test('places canvas nodes on the currently visible authoring layer', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Physical' }).uncheck();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  await page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.54, paneBox!.y + paneBox!.height * 0.52);
  await waitForValidatedGraphNodes(page, ['node-1']);
  await expect(graphNodeByLabel(page, 'New Node')).toBeVisible();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).toContain('- service');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).not.toContain('- physical');
});

test('crud covers new topology regions, callouts, and relationship objects', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('button', { name: 'Insert Router' }).click();
  await page.getByRole('button', { name: 'Insert Service' }).click();
  await waitForValidatedGraphNodes(page, ['router-1', 'service-1']);
  await expect(graphNodeByLabel(page, 'New Router')).toBeVisible();
  await expect(graphNodeByLabel(page, 'New Service')).toBeVisible();

  await selectGraphNodes(page, ['New Router', 'New Service']);
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Region' }).click();
  await page.mouse.move(1180, 820);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- service-1');

  await page.getByRole('button', { name: 'Insert Connection' }).click();
  await page.getByRole('button', { name: 'Create connection' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('target: service-1');

  await page.getByRole('button', { name: 'Insert Path' }).click();
  await page.getByRole('button', { name: 'Create path' }).click();
  await page.mouse.move(1180, 820);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- service-1');

  await selectHarnessObject(page, 'node', 'router-1');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Callout' }).click();
  await page.mouse.move(1180, 820);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('target: router-1');

  await selectHarnessObject(page, 'region', 'region-1');
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await inspector.getByLabel('Display name').fill('Edited Region');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('name: Edited Region');

  await selectHarnessObject(page, 'callout', 'callout-1');
  await inspector.getByLabel('Display name').fill('Edited Callout');
  await inspector.getByRole('textbox', { name: 'X', exact: true }).fill('210');
  await inspector.getByRole('textbox', { name: 'Y', exact: true }).fill('90');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('name: Edited Callout');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('- 210');

  await selectHarnessObject(page, 'path', 'path-1');
  await inspector.getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: path-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');
});

test('crud covers seeded diagram shapes through the inspector', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('topoviewer.vscodeHarness.customFixtures.v1', JSON.stringify([{
      id: 'shape-crud',
      name: 'Shape CRUD'
    }]));
    window.localStorage.setItem('topoviewer.vscodeHarness.activeFixture.v1', 'shape-crud');
    window.localStorage.setItem('topoviewer.vscodeHarness.fixtureState.v1:shape-crud', JSON.stringify({
      fixtureId: 'shape-crud',
      topologyText: [
        'layout:',
        '  mode: manual',
        '  width: 640',
        '  height: 360',
        'graph:',
        '  id: shape-crud',
        '  layers:',
        '    - id: annotations',
        '      name: Annotations',
        '  nodes: []',
        '  links: []',
        '  paths: []',
        '  regions: []',
        'diagram:',
        '  shapes:',
        '    - id: shape-1',
        '      name: Boundary',
        '      type: rectangle',
        '      position: [120, 90]',
        '      size: [220, 120]',
        '      layers: [annotations]',
        ''
      ].join('\n'),
      stylesheetText: [
        'stylesheet:',
        '  - selector: shape',
        '    style:',
        '      backgroundColor: "rgba(25, 118, 210, 0.12)"',
        '      borderColor: "#42a5f5"',
        '      borderWidth: 2',
        ''
      ].join('\n')
    }));
  });

  await page.goto('/');
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await selectHarnessObject(page, 'shape', 'shape-1');
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await expect(inspector.getByLabel('Object name')).toHaveValue('shape:shape-1');
  await inspector.getByLabel('Display name').fill('Edited Boundary');
  await inspector.getByRole('textbox', { name: 'X', exact: true }).fill('260');
  await inspector.getByRole('textbox', { name: 'Y', exact: true }).fill('140');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'shape-1')).toContain('name: Edited Boundary');
  await expect.poll(async () => nodePosition(await topologyText(page), 'shape-1')).toEqual({ x: 260, y: 140 });

  await inspector.getByRole('button', { name: 'Add label row' }).click();
  const labelRows = inspector.locator('[data-label-row-key]');
  await labelRows.last().getByLabel('Label key').fill('owner');
  await labelRows.last().getByLabel('Label value').fill('docs');
  await inspector.getByRole('button', { name: 'Apply labels' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'shape-1')).toContain('owner: docs');

  await inspector.getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: shape-1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).toContain('id: shape-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: shape-1');
});
