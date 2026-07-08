import { expect, test, type Locator } from '@playwright/test';
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
  waitForValidatedGraphObject,
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
  await waitForValidatedLayers(page, ['physical', 'paths', 'annotations']);
  await showAllHarnessLayers(page, ['Physical', 'Paths', 'Annotations']);
}

async function topologyPointForClientClick(page: Parameters<typeof topologyText>[0], clientX: number, clientY: number) {
  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const viewport = await reactFlowViewport(page);
  return {
    x: (clientX - paneBox!.x - viewport.x) / viewport.zoom,
    y: (clientY - paneBox!.y - viewport.y) / viewport.zoom
  };
}

async function clientPointForTopologyPoint(page: Parameters<typeof topologyText>[0], point: { x: number; y: number }) {
  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const viewport = await reactFlowViewport(page);
  return {
    x: paneBox!.x + viewport.x + point.x * viewport.zoom,
    y: paneBox!.y + viewport.y + point.y * viewport.zoom
  };
}

async function reactFlowViewport(page: Parameters<typeof topologyText>[0]) {
  return page.locator('.react-flow__viewport').evaluate((element) => {
    const transform = getComputedStyle(element).transform;
    const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
    return { x: matrix.m41, y: matrix.m42, zoom: matrix.a || 1 };
  });
}

function yamlTuple(block: string, key: string): number[] | undefined {
  const inline = block.match(new RegExp(`${key}:\\s*\\[\\s*(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)\\s*\\]`));
  if (inline) return [Number(inline[1]), Number(inline[2])];
  const lines = block.split('\n');
  const keyIndex = lines.findIndex((line) => line.trim() === `${key}:`);
  if (keyIndex < 0) return undefined;
  const first = lines[keyIndex + 1]?.trim().match(/^-\s*(-?\d+(?:\.\d+)?)/);
  const second = lines[keyIndex + 2]?.trim().match(/^-\s*(-?\d+(?:\.\d+)?)/);
  return first && second ? [Number(first[1]), Number(second[1])] : undefined;
}

function nodeEndpoint(page: Parameters<typeof topologyText>[0], nodeId: string) {
  return page.locator(`.react-flow__node[data-id="${nodeId}"] .topoviewer-node-handle-default.source`).first();
}

async function endpointCenter(endpoint: Locator) {
  await expect(endpoint).toBeVisible();
  const box = await endpoint.boundingBox();
  expect(box).not.toBeNull();
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
}

async function drawConnectionBetween(
  page: Parameters<typeof topologyText>[0],
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 6 });
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
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

test('creates new graph objects on semantic authoring layers even when visibility changes', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  const physical = page.getByRole('checkbox', { name: 'Physical' });
  const paths = page.getByRole('checkbox', { name: 'Paths' });
  await expect(physical).toBeChecked();
  await expect(paths).toBeChecked();
  await physical.uncheck();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  await page.getByRole('button', { name: 'Insert Node' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).toContain('- physical');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).not.toContain('- paths');
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

test('places canvas nodes on the physical authoring layer regardless of visible layers', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Physical' }).uncheck();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  await page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.54, paneBox!.y + paneBox!.height * 0.52);
  await waitForValidatedGraphNodes(page, ['node-1']);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).toContain('- physical');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'node-1')).not.toContain('- paths');
});

test('draws canvas links between nodes and cancels invalid drops safely', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  const nodeTool = toolbar.getByRole('button', { name: 'Node tool' });
  const linkTool = toolbar.getByRole('button', { name: 'Link tool' });
  await nodeTool.click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.38, paneBox!.y + paneBox!.height * 0.5);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.62, paneBox!.y + paneBox!.height * 0.5);
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);
  await expect(nodeEndpoint(page, 'node-1')).toHaveCount(1);
  await expect(nodeEndpoint(page, 'node-2')).toHaveCount(1);

  await linkTool.click();
  await expect(linkTool).toHaveAttribute('aria-pressed', 'true');
  const linkPill = page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-link-authoring-pill');
  await expect(linkPill).toHaveText('LINK');
  await expect(linkPill).toBeVisible();
  const linkPillBox = await linkPill.boundingBox();
  const iconBox = await page.locator('.react-flow__node[data-id="node-1"] .topoviewer-node-icon').boundingBox();
  expect(linkPillBox).not.toBeNull();
  expect(iconBox).not.toBeNull();
  expect(linkPillBox!.x).toBeGreaterThanOrEqual(iconBox!.x);
  expect(linkPillBox!.x + linkPillBox!.width).toBeLessThanOrEqual(iconBox!.x + iconBox!.width);
  expect(linkPillBox!.y).toBeGreaterThanOrEqual(iconBox!.y);
  expect(linkPillBox!.y + linkPillBox!.height).toBeLessThanOrEqual(iconBox!.y + iconBox!.height);
  const endpointBox = await nodeEndpoint(page, 'node-1').boundingBox();
  const nodeBox = await page.locator('.react-flow__node[data-id="node-1"]').boundingBox();
  expect(endpointBox).not.toBeNull();
  expect(nodeBox).not.toBeNull();
  expect(endpointBox!.width).toBeGreaterThanOrEqual(nodeBox!.width - 2);
  expect(endpointBox!.height).toBeGreaterThanOrEqual(nodeBox!.height - 2);
  await page.mouse.move(nodeBox!.x + nodeBox!.width / 2, nodeBox!.y + nodeBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(nodeBox!.x + nodeBox!.width / 2, nodeBox!.y + nodeBox!.height / 2 + 60, { steps: 8 });
  await expect(linkTool).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.up();
  await expect(linkTool).toHaveAttribute('aria-pressed', 'true');

  const source = await endpointCenter(nodeEndpoint(page, 'node-1'));
  const target = await endpointCenter(nodeEndpoint(page, 'node-2'));
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move((source.x + target.x) / 2, (source.y + target.y) / 2, { steps: 6 });
  await expect(page.locator('.react-flow__connection, .react-flow__connection-path').first()).toHaveCount(1);
  await page.mouse.move(paneBox!.x + paneBox!.width * 0.86, paneBox!.y + paneBox!.height * 0.82, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');

  await drawConnectionBetween(page, source, target);
  await waitForValidatedGraphObject(page, 'links', 'link-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).not.toContain('sourceHandle:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('target: node-2');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).not.toContain('targetHandle:');
  await expect.poll(async () => topologyText(page)).not.toContain('handles:');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await waitForValidatedGraphObject(page, 'links', 'link-1');
  await page.reload();
  await waitForHarnessState(page);
  await waitForValidatedGraphObject(page, 'links', 'link-1');

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.getByRole('tab', { name: 'Inspect', exact: true }).click();
  await page.locator('.topoviewer-vscode-inspector-pane').getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');
  await expect(page.getByText('No diagnostics')).toBeVisible();
});

test('normalizes reverse default canvas links to stable node order', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  await toolbar.getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.38, paneBox!.y + paneBox!.height * 0.5);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.62, paneBox!.y + paneBox!.height * 0.5);
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);

  await toolbar.getByRole('button', { name: 'Link tool' }).click();
  const source = await endpointCenter(nodeEndpoint(page, 'node-2'));
  const target = await endpointCenter(nodeEndpoint(page, 'node-1'));
  await drawConnectionBetween(page, source, target);
  await waitForValidatedGraphObject(page, 'links', 'link-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('target: node-2');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).not.toContain('sourceHandle:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).not.toContain('targetHandle:');
  await expect(page.getByText('No diagnostics')).toBeVisible();
});

test('creates canvas paths from clicked node sequences with preview, commit, cancel, and recovery', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  await toolbar.getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.34, paneBox!.y + paneBox!.height * 0.48);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.50, paneBox!.y + paneBox!.height * 0.62);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.66, paneBox!.y + paneBox!.height * 0.48);
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2', 'node-3']);

  const pathTool = toolbar.getByRole('button', { name: 'Path tool' });
  await pathTool.click();
  await expect(pathTool).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status', { name: 'Path authoring sequence' })).toContainText('Click nodes to build a path');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('status', { name: 'Path authoring sequence' })).toContainText('Path requires at least two nodes');
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await expect(page.getByRole('status', { name: 'Path authoring sequence' })).toContainText('New Node');
  await page.locator('.react-flow__node[data-id="node-2"]').click();
  await expect(page.getByRole('status', { name: 'Path authoring sequence' })).toContainText('Path requires graph reachability');
  await expect(page.locator('.react-flow__edge[data-id^="__pending-canvas-path"]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect.poll(() => topologyText(page)).not.toContain('id: link-1');
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');

  const linkTool = toolbar.getByRole('button', { name: 'Link tool' });
  await linkTool.click();
  await drawConnectionBetween(page, await endpointCenter(nodeEndpoint(page, 'node-1')), await endpointCenter(nodeEndpoint(page, 'node-2')));
  await waitForValidatedGraphObject(page, 'links', 'link-1');
  await linkTool.click();
  await drawConnectionBetween(page, await endpointCenter(nodeEndpoint(page, 'node-2')), await endpointCenter(nodeEndpoint(page, 'node-3')));
  await waitForValidatedGraphObject(page, 'links', 'link-2');

  await pathTool.click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-3"]').click();
  await expect(page.getByRole('status', { name: 'Path authoring sequence' })).toContainText('Loose tunnel segment');
  await expect(page.locator('.react-flow__edge[data-id^="__pending-canvas-path"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Create path' }).click();
  await waitForValidatedGraphObject(page, 'paths', 'path-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-3');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-2')).toContain('source: node-2');
  await expect.poll(() => topologyText(page)).not.toContain('id: link-3');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');

  await pathTool.click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click();
  await expect(page.locator('.react-flow__edge[data-id^="__pending-canvas-path"]')).toHaveCount(1);
  await page.locator('.react-flow__node[data-id="node-3"]').click();
  await expect(page.locator('.react-flow__edge[data-id^="__pending-canvas-path"]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Create path' }).click();
  await waitForValidatedGraphObject(page, 'paths', 'path-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-2');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-3');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-2')).toContain('source: node-2');
  await expect(page.locator('.react-flow__edge[data-id="link-1"] .topoviewer-edge-visible-path')).toBeVisible();
  await expect(page.locator('.react-flow__edge[data-id="link-2"] .topoviewer-edge-visible-path')).toBeVisible();
  await expect(page.locator('.react-flow__edge[data-id^="path-1:"] .topoviewer-edge-visible-path')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge[data-id^="path-1:"] .topoviewer-edge-lane')).toHaveCount(2);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('target: node-2');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-2')).toContain('target: node-3');
  await page.getByRole('button', { name: 'Redo' }).click();
  await waitForValidatedGraphObject(page, 'paths', 'path-1');

  await selectHarnessObject(page, 'path', 'path-1');
  await page.locator('.topoviewer-vscode-inspector-pane').getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');
  await page.getByRole('button', { name: 'Undo' }).click();
  await waitForValidatedGraphObject(page, 'paths', 'path-1');

  await selectHarnessObject(page, 'path', 'path-1');
  await page.locator('.topoviewer-vscode-inspector-pane').getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: path-1');
  await pathTool.click();
  await page.locator('.react-flow__node[data-id="node-2"]').click();
  await page.locator('.react-flow__node[data-id="node-3"]').click();
  await page.keyboard.press('Enter');
  await waitForValidatedGraphObject(page, 'paths', 'path-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-2');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- node-3');
  await page.reload();
  await waitForHarnessState(page);
  await waitForValidatedGraphObject(page, 'paths', 'path-1');
});

test('creates canvas regions from the current node selection', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  await toolbar.getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.40, paneBox!.y + paneBox!.height * 0.48);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.58, paneBox!.y + paneBox!.height * 0.54);
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);

  await toolbar.getByRole('button', { name: 'Select tool' }).click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click({ modifiers: ['Shift'] });
  await expect.poll(() => selectedPreviewObjectCount(page)).toBe(2);

  const regionTool = toolbar.getByRole('button', { name: 'Region tool' });
  await regionTool.click();
  await expect(regionTool).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status', { name: 'Region authoring selection' })).toContainText('New Node');
  await page.getByRole('button', { name: 'Create region' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-2');
  await selectHarnessObject(page, 'region', 'region-1');
  await expect(page.locator('.topoviewer-vscode-inspector-pane').getByLabel('Object name')).toHaveValue('region:region-1');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: region-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-2');
});

test('creates canvas regions from deterministic drag bounds', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);

  const node1 = nodePosition(await topologyText(page), 'node-1');
  const node2 = nodePosition(await topologyText(page), 'node-2');
  expect(node1).toBeDefined();
  expect(node2).toBeDefined();

  const start = await clientPointForTopologyPoint(page, {
    x: Math.min(node1!.x, node2!.x) - 24,
    y: Math.min(node1!.y, node2!.y) - 24
  });
  const end = await clientPointForTopologyPoint(page, {
    x: Math.max(node1!.x, node2!.x) + 24,
    y: Math.max(node1!.y, node2!.y) + 24
  });

  const regionTool = page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Region tool' });
  await regionTool.click();
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move((start.x + end.x) / 2, (start.y + end.y) / 2, { steps: 4 });
  await expect(page.locator('.topoviewer-vscode-region-marquee')).toBeVisible();
  await page.mouse.move(end.x, end.y, { steps: 4 });
  await page.mouse.up();

  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-2');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(() => topologyText(page)).not.toContain('id: region-1');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-2');
  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');
});

test('creates region containers and releases dragged-in nodes explicitly', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });
  await toolbar.getByRole('button', { name: 'Region tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.55, paneBox!.y + paneBox!.height * 0.5);

  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members: []');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('position:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('size:');
  const region = page.locator('.react-flow__node[data-id="region:region-1"] .topoviewer-region-drag');
  await expect(region).toBeVisible();
  await selectHarnessObject(page, 'region', 'region-1');
  const beforeRegionSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'region-1'), 'size');
  expect(beforeRegionSize).toBeDefined();
  const regionResizeHandle = page.locator('.react-flow__node[data-id="region:region-1"] .react-flow__resize-control.handle.bottom.right');
  await expect(regionResizeHandle).toBeVisible();
  const regionHandleBox = await regionResizeHandle.boundingBox();
  expect(regionHandleBox).not.toBeNull();
  await page.mouse.move(regionHandleBox!.x + regionHandleBox!.width / 2, regionHandleBox!.y + regionHandleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(regionHandleBox!.x + regionHandleBox!.width / 2 + 72, regionHandleBox!.y + regionHandleBox!.height / 2 + 44, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const nextSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'region-1'), 'size');
    return nextSize && beforeRegionSize ? `${nextSize[0] - beforeRegionSize[0]},${nextSize[1] - beforeRegionSize[1]}` : 'missing';
  }).not.toBe('0,0');

  await toolbar.getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.22, paneBox!.y + paneBox!.height * 0.5);
  await waitForValidatedGraphNodes(page, ['node-1']);
  const node = page.locator('.react-flow__node[data-id="node-1"]');
  await expect(node).toBeVisible();

  const nodeBox = await node.boundingBox();
  const regionBox = await region.boundingBox();
  expect(nodeBox).not.toBeNull();
  expect(regionBox).not.toBeNull();
  const from = { x: nodeBox!.x + nodeBox!.width / 2, y: nodeBox!.y + nodeBox!.height / 2 };
  const intoRegion = { x: regionBox!.x + regionBox!.width / 2, y: regionBox!.y + regionBox!.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + intoRegion.x) / 2, (from.y + intoRegion.y) / 2, { steps: 8 });
  await page.mouse.move(intoRegion.x, intoRegion.y, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');

  await page.locator('.react-flow__node[data-id="region:region-1"] .topoviewer-region-collapse-button').click();
  await expect(page.locator('.react-flow__node[data-id="aggregate:summary-region-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="region:region-1"]')).toHaveCount(0);
  await expect.poll(() => topologyText(page)).toContain('id: summary-region-1');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node[data-id="region:region-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="aggregate:summary-region-1"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node[data-id="aggregate:summary-region-1"]')).toBeVisible();

  await page.locator('.react-flow__node[data-id="aggregate:summary-region-1"] .topoviewer-aggregate-expand-button').click();
  await expect(page.locator('.react-flow__node[data-id="region:region-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="aggregate:summary-region-1"]')).toHaveCount(0);
  await expect.poll(() => topologyText(page)).toContain('- summary-region-1');

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="region:region-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="node-1"]')).toBeVisible();

  const nodeAfterDrop = await node.boundingBox();
  expect(nodeAfterDrop).not.toBeNull();
  const outside = { x: paneBox!.x + paneBox!.width * 0.15, y: paneBox!.y + paneBox!.height * 0.18 };
  await page.mouse.move(nodeAfterDrop!.x + nodeAfterDrop!.width / 2, nodeAfterDrop!.y + nodeAfterDrop!.height / 2);
  await page.mouse.down();
  await page.mouse.move(outside.x, outside.y, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- node-1');

  const nodeAfterOutsideDrag = await node.boundingBox();
  expect(nodeAfterOutsideDrag).not.toBeNull();
  await page.mouse.click(
    nodeAfterOutsideDrag!.x + nodeAfterOutsideDrag!.width / 2,
    nodeAfterOutsideDrag!.y + nodeAfterOutsideDrag!.height / 2,
    { button: 'right' }
  );
  await page.getByRole('menuitem', { name: /Release from/ }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).not.toContain('- node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members: []');

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members: []');
});

test('moves canvas region groups by translating member nodes with helper lines disabled', async ({ page }) => {
  await startNewTopology(page);

  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await page.getByRole('button', { name: 'Insert Node' }).click();
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click({ modifiers: ['Shift'] });
  await expect.poll(() => selectedPreviewObjectCount(page)).toBe(2);
  const regionTool = page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Region tool' });
  await regionTool.click();
  await page.getByRole('button', { name: 'Create region' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('members:');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('draggable: true');
  const beforeNode1 = nodePosition(await topologyText(page), 'node-1');
  const beforeNode2 = nodePosition(await topologyText(page), 'node-2');
  expect(beforeNode1).toBeDefined();
  expect(beforeNode2).toBeDefined();

  const settings = page.locator('.topoviewer-vscode-controls-overlay');
  const helperLinesToggle = settings.getByRole('checkbox', { name: 'Helper lines' });
  if (await helperLinesToggle.count() === 0) {
    await page.getByRole('button', { name: 'Show topology controls' }).click();
  }
  await expect(helperLinesToggle).toBeChecked();
  await helperLinesToggle.uncheck();
  await expect(helperLinesToggle).not.toBeChecked();

  const region = page.locator('.react-flow__node[data-id="region:region-1"] .topoviewer-region-drag');
  await expect(region).toBeVisible();
  const regionBox = await region.boundingBox();
  expect(regionBox).not.toBeNull();
  const from = { x: regionBox!.x + 18, y: regionBox!.y + 18 };
  const to = { x: from.x + 92, y: from.y + 54 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 6 });
  await page.mouse.move(to.x, to.y, { steps: 6 });
  await page.mouse.up();

  let afterNode1 = beforeNode1;
  let afterNode2 = beforeNode2;
  await expect.poll(async () => {
    afterNode1 = nodePosition(await topologyText(page), 'node-1');
    afterNode2 = nodePosition(await topologyText(page), 'node-2');
    return afterNode1 && afterNode2
      ? `${afterNode1.x - beforeNode1!.x},${afterNode1.y - beforeNode1!.y},${afterNode2.x - beforeNode2!.x},${afterNode2.y - beforeNode2!.y}`
      : 'missing';
  }).not.toBe('0,0,0,0');

  const delta1 = { x: afterNode1!.x - beforeNode1!.x, y: afterNode1!.y - beforeNode1!.y };
  const delta2 = { x: afterNode2!.x - beforeNode2!.x, y: afterNode2!.y - beforeNode2!.y };
  expect(delta1.x).toBe(delta2.x);
  expect(delta1.y).toBe(delta2.y);
  expect(delta1.x).toBeGreaterThan(0);
  expect(delta1.y).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(beforeNode1);
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-2')).toEqual(beforeNode2);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(afterNode1);
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-2')).toEqual(afterNode2);

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(afterNode1);
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-2')).toEqual(afterNode2);
});

test('keeps click-created linked nodes stable during staggered vertical drags', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const nodeTool = page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Node tool' });
  await nodeTool.click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.44, paneBox!.y + paneBox!.height * 0.5);
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.62, paneBox!.y + paneBox!.height * 0.5);
  await waitForValidatedGraphNodes(page, ['node-1', 'node-2']);
  await expect(page.locator('.react-flow__node[data-id="node-1"]')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="node-2"]')).toBeVisible();

  const build = page.locator('.topoviewer-vscode-build-pane');
  await build.getByRole('button', { name: 'Insert Connection' }).click();
  await build.getByRole('button', { name: 'Create connection' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('node-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('node-2');

  const draggedNode = page.locator('.react-flow__node[data-id="node-1"]');
  const startPosition = nodePosition(await topologyText(page), 'node-1');
  expect(startPosition).toBeDefined();
  const deltas = [90, -55, 115, -70, 45];

  for (const deltaY of deltas) {
    const before = nodePosition(await topologyText(page), 'node-1');
    const box = await draggedNode.boundingBox();
    expect(before).toBeDefined();
    expect(box).not.toBeNull();
    const from = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, from.y + deltaY, { steps: 12 });
    await page.mouse.up();
    await expect(draggedNode).toBeVisible();
    await expect(page.locator('.react-flow__node[data-id="node-2"]')).toBeVisible();
    await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    let observedDelta = 0;
    await expect.poll(async () => {
      const next = nodePosition(await topologyText(page), 'node-1');
      observedDelta = next ? Math.round(next.y - before!.y) : Number.NaN;
      return observedDelta;
    }).not.toBe(0);
    expect(Math.sign(observedDelta)).toBe(Math.sign(deltaY));
    expect(Math.abs(observedDelta)).toBeGreaterThanOrEqual(Math.abs(deltaY) * 0.3);
  }

  const finalPosition = nodePosition(await topologyText(page), 'node-1');
  expect(finalPosition).toBeDefined();
  expect(finalPosition).not.toEqual(startPosition);
  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(finalPosition);
});

test('places and moves canvas shapes and callouts from toolbar tools', async ({ page }) => {
  await startNewTopology(page);

  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  const toolbar = page.getByRole('toolbar', { name: 'Canvas authoring tools' });

  await toolbar.getByRole('button', { name: 'Shape tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.40, paneBox!.y + paneBox!.height * 0.55);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'shape-1')).toContain('type: rectangle');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'shape-1')).toContain('- annotations');
  await expect(page.locator('.react-flow__node[data-id="shape-1"]')).toBeVisible();

  await toolbar.getByRole('button', { name: 'Callout tool' }).click();
  await page.mouse.click(paneBox!.x + paneBox!.width * 0.62, paneBox!.y + paneBox!.height * 0.42);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('title: New Callout');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('- annotations');
  await expect(page.locator('.react-flow__node[data-id="callout-1"]')).toBeVisible();

  const beforeShape = nodePosition(await topologyText(page), 'shape-1');
  const beforeCallout = nodePosition(await topologyText(page), 'callout-1');
  expect(beforeShape).toBeDefined();
  expect(beforeCallout).toBeDefined();

  const shape = page.locator('.react-flow__node[data-id="shape-1"]');
  const shapeBox = await shape.boundingBox();
  expect(shapeBox).not.toBeNull();
  await page.mouse.move(shapeBox!.x + shapeBox!.width / 2, shapeBox!.y + shapeBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(shapeBox!.x + shapeBox!.width / 2 + 70, shapeBox!.y + shapeBox!.height / 2 + 45, { steps: 8 });
  await page.mouse.up();

  const callout = page.locator('.react-flow__node[data-id="callout-1"]');
  const calloutBox = await callout.boundingBox();
  expect(calloutBox).not.toBeNull();
  await page.mouse.move(calloutBox!.x + calloutBox!.width / 2, calloutBox!.y + calloutBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(calloutBox!.x + calloutBox!.width / 2 - 60, calloutBox!.y + calloutBox!.height / 2 + 55, { steps: 8 });
  await page.mouse.up();

  let afterShape = beforeShape;
  let afterCallout = beforeCallout;
  await expect.poll(async () => {
    afterShape = nodePosition(await topologyText(page), 'shape-1');
    return afterShape && beforeShape ? `${afterShape.x - beforeShape.x},${afterShape.y - beforeShape.y}` : 'missing';
  }).not.toBe('0,0');
  await expect.poll(async () => {
    afterCallout = nodePosition(await topologyText(page), 'callout-1');
    return afterCallout && beforeCallout ? `${afterCallout.x - beforeCallout.x},${afterCallout.y - beforeCallout.y}` : 'missing';
  }).not.toBe('0,0');

  await selectHarnessObject(page, 'shape', 'shape-1');
  const shapeResizeHandle = shape.locator('.react-flow__resize-control.handle.bottom.right');
  await expect(shapeResizeHandle).toBeVisible();
  const beforeShapeSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'shape-1'), 'size');
  expect(beforeShapeSize).toBeDefined();
  const shapeHandleBox = await shapeResizeHandle.boundingBox();
  expect(shapeHandleBox).not.toBeNull();
  await page.mouse.move(shapeHandleBox!.x + shapeHandleBox!.width / 2, shapeHandleBox!.y + shapeHandleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(shapeHandleBox!.x + shapeHandleBox!.width / 2 + 64, shapeHandleBox!.y + shapeHandleBox!.height / 2 + 36, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const nextSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'shape-1'), 'size');
    return nextSize && beforeShapeSize ? `${nextSize[0] - beforeShapeSize[0]},${nextSize[1] - beforeShapeSize[1]}` : 'missing';
  }).not.toBe('0,0');

  await selectHarnessObject(page, 'callout', 'callout-1');
  const calloutResizeHandle = callout.locator('.react-flow__resize-control.handle.bottom.right');
  await expect(calloutResizeHandle).toBeVisible();
  const beforeCalloutSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'callout-1'), 'size');
  expect(beforeCalloutSize).toBeDefined();
  const calloutHandleBox = await calloutResizeHandle.boundingBox();
  expect(calloutHandleBox).not.toBeNull();
  await page.mouse.move(calloutHandleBox!.x + calloutHandleBox!.width / 2, calloutHandleBox!.y + calloutHandleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(calloutHandleBox!.x + calloutHandleBox!.width / 2 + 48, calloutHandleBox!.y + calloutHandleBox!.height / 2 + 28, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => {
    const nextSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'callout-1'), 'size');
    return nextSize && beforeCalloutSize ? `${nextSize[0] - beforeCalloutSize[0]},${nextSize[1] - beforeCalloutSize[1]}` : 'missing';
  }).not.toBe('0,0');

  const afterShapeSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'shape-1'), 'size');
  const afterCalloutSize = yamlTuple(yamlObjectBlock(await topologyText(page), 'callout-1'), 'size');
  expect(afterShapeSize).toBeDefined();
  expect(afterCalloutSize).toBeDefined();

  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'shape-1')).toEqual(afterShape);
  await expect.poll(async () => nodePosition(await topologyText(page), 'callout-1')).toEqual(afterCallout);
  await expect.poll(async () => yamlTuple(yamlObjectBlock(await topologyText(page), 'shape-1'), 'size')).toEqual(afterShapeSize);
  await expect.poll(async () => yamlTuple(yamlObjectBlock(await topologyText(page), 'callout-1'), 'size')).toEqual(afterCalloutSize);
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
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- physical');

  await page.getByRole('button', { name: 'Insert Connection' }).click();
  await page.getByRole('button', { name: 'Create connection' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('source: router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('target: service-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'link-1')).toContain('- physical');

  await page.getByRole('button', { name: 'Insert Path' }).click();
  await page.getByRole('button', { name: 'Create path' }).click();
  await page.mouse.move(1180, 820);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- service-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'path-1')).toContain('- paths');

  await selectHarnessObject(page, 'node', 'router-1');
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
  await page.getByRole('button', { name: 'Insert Callout' }).click();
  await page.mouse.move(1180, 820);
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('target: router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'callout-1')).toContain('- annotations');

  await selectHarnessObject(page, 'region', 'region-1');
  const inspector = page.locator('.topoviewer-vscode-inspector-pane');
  await inspector.getByLabel('Display name').fill('Edited Region');
  await inspector.getByLabel('Members').click();
  await page.getByRole('option', { name: 'New Service' }).click();
  await page.keyboard.press('Escape');
  await inspector.getByRole('button', { name: 'Apply properties' }).click();
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('name: Edited Region');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).toContain('- router-1');
  await expect.poll(async () => yamlObjectBlock(await topologyText(page), 'region-1')).not.toContain('- service-1');

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
