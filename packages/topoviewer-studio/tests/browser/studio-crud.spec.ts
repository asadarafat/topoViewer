import { expect, test } from '@playwright/test';
import type { TopoDocument } from 'topoviewer';
import { parse } from 'yaml';
import { createStarterProject } from '../../src/hosts/starterProject';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import {
  invokeCanvasSelectionAction,
  openCanvasSelectionActions
} from '../support/canvasActions';
import { exportGoldenArchive, openProjectManager, readStudioProjectArchive } from '../support/goldenAuthoringJourney';
import { selectStudioOption } from '../support/mui';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument, openStudioWorkspace, waitForStudioCanvasGeometry } from '../support/workbench';

async function openSource(page: import('@playwright/test').Page) {
  return openPropertiesCodeDocument(page, 'topology');
}

async function expectSourceContains(page: import('@playwright/test').Page, query: string, present = true, document: 'stylesheet' | 'topology' = 'topology') {
  await page.getByLabel(`${document} YAML editor`).focus();
  await page.keyboard.press('Control+f');
  const find = page.getByRole('textbox', { name: 'Find', exact: true });
  await find.fill(query);
  await expect(find).toHaveValue(query);
  await find.press('Enter');
  const count = page.locator('.find-widget .matchesCount');
  if (present) await expect(count).toHaveText(/\d+ of \d+/);
  else await expect(count).toHaveText('No results');
  await page.keyboard.press('Escape');
}

async function selectNodes(page: import('@playwright/test').Page, ids: string[]) {
  for (const [index, id] of ids.entries()) {
    await page.locator(`.react-flow__node[data-id="${id}"]`).click({
      modifiers: index === 0 ? [] : ['Control']
    });
  }
}

async function expandPaletteGroup(page: import('@playwright/test').Page, name: string) {
  const add = await openStudioWorkspace(page, 'Add');
  const group = add.getByRole('button', { name: `${name} palette group` });
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
}

function nodeConnectionPort(page: import('@playwright/test').Page, nodeId: string, side: 'top' | 'right' | 'bottom' | 'left' = 'right') {
  const index = { top: 0, right: 1, bottom: 2, left: 3 }[side];
  return page.locator(`.react-flow__node[data-id="${nodeId}"] .topoviewer-node-shape-handle.source[data-shape-active="true"]`).nth(index);
}

async function dragTemplate(page: import('@playwright/test').Page, id: string, position: { x: number; y: number }) {
  await openStudioWorkspace(page, 'Add');
  await waitForStudioCanvasGeometry(page);
  if (['callout', 'region', 'shape', 'text'].includes(id)) await expandPaletteGroup(page, 'Annotations');
  const source = page.getByTestId(`palette-${id}`);
  const canvas = page.getByTestId('studio-canvas');
  await source.scrollIntoViewIfNeeded();
  const drawerBox = await page.getByRole('complementary', { name: 'Add' }).boundingBox();
  const canvasBox = await canvas.boundingBox();
  if (!canvasBox) throw new Error('Studio canvas is not measurable.');
  const dockBox = await page.getByRole('region', { name: 'Project session details' }).boundingBox();
  const visibleLeft = drawerBox
    ? Math.max(0, Math.ceil(drawerBox.x + drawerBox.width - canvasBox.x + 24))
    : 0;
  const visibleBottom =
    dockBox && dockBox.y > canvasBox.y && dockBox.y < canvasBox.y + canvasBox.height
      ? Math.floor(dockBox.y - canvasBox.y - 24)
      : canvasBox.height - 24;
  await source.dragTo(canvas, {
    targetPosition: {
      x: Math.min(canvasBox.width - 24, Math.max(position.x, visibleLeft)),
      y: Math.max(24, Math.min(position.y, visibleBottom))
    }
  });
  await waitForStudioCanvasGeometry(page);
}

async function drawEdgeTemplate(page: import('@playwright/test').Page, templateId: string, sourceId: string, targetId: string) {
  await activateStudioPaletteTemplate(page, templateId);
  const source = nodeConnectionPort(page, sourceId, 'right');
  const target = nodeConnectionPort(page, targetId, 'left');
  await expect(source).toBeVisible();
  await expect(target).toBeVisible();
  await source.hover();
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();
  if (!sourceBox || !targetBox) throw new Error(`${templateId} connection handles are not measurable.`);
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId('studio-canvas')).not.toHaveAttribute('data-edge-authoring-mode');
  await waitForStudioCanvasGeometry(page);
}

async function nodeAppearance(page: import('@playwright/test').Page, nodeId: string) {
  return page.locator(`.react-flow__node[data-id="${nodeId}"] .topoviewer-node`).evaluate((node) => {
    const surface = node.querySelector<HTMLElement>('.topoviewer-node-icon');
    const image = node.querySelector<HTMLImageElement>('.topoviewer-node-icon-image');
    if (!surface) throw new Error('Rendered node has no visual surface.');
    const bounds = surface.getBoundingClientRect();
    const style = getComputedStyle(surface);
    return {
      fill: style.getPropertyValue('--topoviewer-node-fill'),
      height: Math.round(bounds.height),
      iconAlt: image?.alt,
      iconSource: image?.src,
      shape: [...node.classList].find((className) => className.startsWith('topoviewer-node-shape-')),
      stroke: style.getPropertyValue('--topoviewer-node-stroke'),
      width: Math.round(bounds.width)
    };
  });
}

test('creates node, annotation, structure, and user-preset objects', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  await dragTemplate(page, 'service', { x: 120, y: 160 });
  await dragTemplate(page, 'shape', { x: 280, y: 160 });
  await dragTemplate(page, 'callout', { x: 440, y: 160 });
  await dragTemplate(page, 'router', { x: 600, y: 160 });
  await expect(page.locator('.react-flow__node')).toHaveCount(4);

  await invokeCanvasSelectionAction(page, 'Save to Object Palette');
  await expect((await openStudioWorkspace(page, 'Add')).getByTestId('palette-preset:preset-1')).toBeVisible();
  await dragTemplate(page, 'preset:preset-1', { x: 600, y: 340 });
  await expect(page.locator('.react-flow__node')).toHaveCount(5);

  await selectNodes(page, ['service-1', 'router-1']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  const physicalLink = page.locator('.react-flow__edge[data-id="link-1"]');
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);
  await selectNodes(page, ['service-1', 'router-1']);
  await openStudioWorkspace(page, 'Add');
  await page.getByTestId('palette-path').click();
  await expect(physicalLink).toHaveCount(1);
  await expect(physicalLink.locator('path').first()).toHaveAttribute('d', /\S+/);

  await dragTemplate(page, 'region', { x: 500, y: 460 });
  await expect(page.locator('.react-flow__node[data-id="region:region-1"]').getByText('region-1', { exact: true })).toBeVisible();

  await openSource(page);
  for (const query of ['shapes:', 'callouts:', 'paths:', '- paths', '- physical', 'layers:', '- annotations']) {
    await expectSourceContains(page, query);
  }
  await expectSourceContains(page, 'icon: nokia.router', false);
});

test('preserves effective appearance through duplicate and Object Palette reuse', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-icon-image')).toHaveAttribute('alt', 'Nokia router');

  const sourceAppearance = await nodeAppearance(page, 'router-1');
  await invokeCanvasSelectionAction(page, 'Duplicate');
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toBeVisible();
  expect(await nodeAppearance(page, 'router-2')).toEqual(sourceAppearance);

  await page.locator('.react-flow__node[data-id="router-2"]').click();
  await invokeCanvasSelectionAction(page, 'Save to Object Palette');
  await openStudioWorkspace(page, 'Add');
  await expect(page.getByTestId('palette-preset:preset-1')).toBeVisible();
  await dragTemplate(page, 'preset:preset-1', { x: 560, y: 340 });
  await expect(page.locator('.react-flow__node[data-id="node-1"]')).toBeVisible();
  expect(await nodeAppearance(page, 'node-1')).toEqual(sourceAppearance);

  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectSourceContains(page, 'node[id = "router-2"]', true, 'stylesheet');
  await expectSourceContains(page, 'node[id = "node-1"]', true, 'stylesheet');
});

test('saves a styled link as an endpoint-driven Object Palette preset', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await drawEdgeTemplate(page, 'link', 'router-1', 'router-2');

  const style = await openStyleWorkspace(page);
  const distance = await editStyleAttribute(style, 'Control point distance');
  await distance.getByRole('spinbutton', { name: 'Control point distance' }).fill('100');
  await distance.getByRole('spinbutton', { name: 'Control point distance' }).press('Enter');
  await style.getByRole('button', { name: 'Apply' }).click();

  await invokeCanvasSelectionAction(page, 'Save to Object Palette');
  await openStudioWorkspace(page, 'Add');
  const preset = page.getByTestId('palette-preset:preset-1');
  await expect(preset).toContainText('link-1 preset');
  await expect(preset).toContainText('Saved link appearance');
  await drawEdgeTemplate(page, 'preset:preset-1', 'router-2', 'router-3');

  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectSourceContains(page, 'link[id = "link-2"]', true, 'stylesheet');
  await expectSourceContains(page, 'controlPointDistance: 100', true, 'stylesheet');
});

test('copies visible appearance to a compatible object with Format Painter', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  const style = await openStyleWorkspace(page);
  const shape = await editStyleAttribute(style, 'Shape');
  await selectStudioOption(page, shape.getByRole('combobox', { name: 'Shape' }), 'hexagon');
  await expect(page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node')).toHaveClass(/topoviewer-node-shape-hexagon/);

  await invokeCanvasSelectionAction(page, 'Copy formatting');
  await expect(page.getByTestId('studio-canvas')).toHaveAttribute('data-format-painter', 'true');
  await page.locator('.react-flow__node[data-id="router-2"]').click();
  await expect(page.getByTestId('studio-canvas')).not.toHaveAttribute('data-format-painter');
  await expect(page.locator('.react-flow__node[data-id="router-2"] .topoviewer-node')).toHaveClass(/topoviewer-node-shape-hexagon/);
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toContainText('router-2');
});

test('connects through native handles but stores normalized floating endpoints', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);

  // Draw from the outer ports. The saved link must still float to the nearest
  // boundaries once React Flow finishes the authoring gesture.
  const sourceHandle = nodeConnectionPort(page, 'router-2', 'right');
  const targetHandle = nodeConnectionPort(page, 'router-1', 'left');
  await activateStudioPaletteTemplate(page, 'link');
  await expect(sourceHandle).toBeVisible();
  await expect(targetHandle).toBeVisible();
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  const geometry = await page.locator('.react-flow__edge path.react-flow__edge-path').evaluate((path) => {
    const sourceBody = document.querySelector<HTMLElement>('.react-flow__node[data-id="router-1"] .topoviewer-node-icon');
    const targetBody = document.querySelector<HTMLElement>('.react-flow__node[data-id="router-2"] .topoviewer-node-icon');
    const edgePath = path as SVGPathElement;
    const matrix = edgePath.getScreenCTM();
    if (!sourceBody || !targetBody || !matrix) return undefined;
    const startPoint = edgePath.getPointAtLength(0);
    const endPoint = edgePath.getPointAtLength(edgePath.getTotalLength());
    const start = new DOMPoint(startPoint.x, startPoint.y).matrixTransform(matrix);
    const end = new DOMPoint(endPoint.x, endPoint.y).matrixTransform(matrix);
    return {
      endX: end.x,
      sourceRight: sourceBody.getBoundingClientRect().right,
      startX: start.x,
      targetLeft: targetBody.getBoundingClientRect().left
    };
  });
  expect(geometry?.startX).toBeCloseTo(geometry?.sourceRight || 0, 0);
  expect(geometry?.endX).toBeCloseTo(geometry?.targetLeft || 0, 0);
  await openSource(page);
  await expectSourceContains(page, 'source: router-1');
  await expectSourceContains(page, 'target: router-2');
  await expectSourceContains(page, 'sourceHandle:', false);
  await expectSourceContains(page, 'targetHandle:', false);
});

test('rejects self-links while keeping repeated Bezier links on stable endpoints', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  const nodeOneSource = nodeConnectionPort(page, 'router-1', 'right');
  const nodeOneTarget = nodeConnectionPort(page, 'router-1', 'left');
  const nodeTwoTarget = nodeConnectionPort(page, 'router-2', 'left');
  await expect(nodeOneSource).toHaveAttribute('data-handlepos', 'right');
  await expect(nodeOneTarget).toHaveAttribute('data-handlepos', 'left');
  await expect(nodeOneTarget).toHaveAttribute('title', /Connection point/);

  async function connect(source: import('@playwright/test').Locator, target: import('@playwright/test').Locator) {
    if ((await page.getByTestId('studio-canvas').getAttribute('data-edge-authoring-mode')) !== 'link') {
      await openStudioWorkspace(page, 'Add');
      await activateStudioPaletteTemplate(page, 'link');
    }
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
    await source.hover();
    await page.mouse.down();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 8, sourceBox.y + sourceBox.height / 2, { steps: 2 });
    await expect(page.locator('svg.react-flow__connectionline')).toBeVisible();
    const targetX = targetBox.x + targetBox.width / 2;
    const targetY = targetBox.y + targetBox.height / 2;
    await page.mouse.move(targetX, targetY, { steps: 8 });
    await page.mouse.move(targetX + 2, targetY + 2);
    await page.mouse.move(targetX, targetY);
    await expect(target).toHaveClass(/connectingto/);
    return () => page.mouse.up();
  }

  let release = await connect(nodeOneSource, nodeOneTarget);
  await expect(nodeOneTarget).not.toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);

  release = await connect(nodeOneSource, nodeTwoTarget);
  await expect(nodeTwoTarget).toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  release = await connect(nodeOneSource, nodeTwoTarget);
  await expect(nodeTwoTarget).toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(2);

  release = await connect(nodeOneSource, nodeTwoTarget);
  await expect(nodeTwoTarget).toHaveClass(/\bvalid\b/);
  await release();
  await expect(page.locator('.react-flow__edge')).toHaveCount(3);

  const parallelPaths = await page.locator('.react-flow__edge path.react-flow__edge-path').evaluateAll((paths) => paths.map((path) => path.getAttribute('d')));
  expect(new Set(parallelPaths).size).toBe(3);
  const endpoints = await page.locator('.react-flow__edge path.react-flow__edge-path').evaluateAll((paths) =>
    paths.map((path) => {
      const edgePath = path as SVGPathElement;
      const matrix = edgePath.getScreenCTM();
      if (!matrix) return undefined;
      const startPoint = edgePath.getPointAtLength(0);
      const endPoint = edgePath.getPointAtLength(edgePath.getTotalLength());
      const start = new DOMPoint(startPoint.x, startPoint.y).matrixTransform(matrix);
      const end = new DOMPoint(endPoint.x, endPoint.y).matrixTransform(matrix);
      return {
        endX: Number(end.x.toFixed(2)),
        endY: Number(end.y.toFixed(2)),
        startX: Number(start.x.toFixed(2)),
        startY: Number(start.y.toFixed(2))
      };
    })
  );
  expect(endpoints).not.toContain(undefined);
  expect(new Set(endpoints.map((endpoint) => JSON.stringify(endpoint))).size).toBe(1);
  await openSource(page);
  await expectSourceContains(page, 'id: link-3');
  await expectSourceContains(page, 'curveStyle: bezier', false);
});

test('authors grouped parallel links and reads expansion from topology YAML', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  const styleWorkspace = await openPropertiesCodeDocument(page, 'stylesheet');
  const styleEditor = styleWorkspace.getByLabel('stylesheet YAML editor');
  await styleEditor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  const starterStylesheet = createStarterProject().documents.stylesheet.text.replace(
    '      lineWidth: 2',
    '      lineWidth: 2\n      controlPointDistance: 100\n      controlPointStepSize: 34'
  );
  await styleEditor.evaluate((element, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
  }, starterStylesheet);
  await styleWorkspace.getByRole('button', { name: 'Apply' }).click();

  await drawEdgeTemplate(page, 'parallel-link', 'router-1', 'router-2');

  const aggregate = page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]');
  await expect(aggregate).toHaveCount(1);
  await expect(aggregate).toHaveAttribute('data-link-count', '3');
  await expect(page.getByRole('button', { name: 'Expand 3 parallel links' })).toHaveCount(0);
  await aggregate.click({ force: true });
  await expect(aggregate).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id^="link-"]')).toHaveCount(0);

  const drawer = await openSource(page);
  await expectSourceContains(page, 'expandedGroupIds:', false);
  const editor = drawer.getByLabel('topology YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.insertText('\n      expandedGroupIds:\n        - endpoints-router-1-router-2-layer-physical');
  await drawer.getByRole('button', { name: 'Apply' }).click();
  await expect(aggregate).toHaveCount(0);
  await expect(page.locator('.react-flow__edge[data-id^="link-"]')).toHaveCount(3);

  const parallelPaths = await page.locator('.react-flow__edge[data-id^="link-"] path.react-flow__edge-path').evaluateAll((paths) => paths.map((path) => path.getAttribute('d')));
  expect(parallelPaths.every((path) => path?.includes(' Q '))).toBe(true);
  expect(new Set(parallelPaths).size).toBe(3);

  for (const query of ['grouping:', 'selector: link[labels.link = "parallel"]', 'expandOnClick: true', 'expandedGroupIds:', 'endpoints-router-1-router-2-layer-physical']) {
    await expectSourceContains(page, query);
  }
});

test('selects each visible straight parallel lane independently', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  const styleWorkspace = await openPropertiesCodeDocument(page, 'stylesheet');
  const styleEditor = styleWorkspace.getByLabel('stylesheet YAML editor');
  await styleEditor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  const straightStylesheet = createStarterProject().documents.stylesheet.text.replace(
    '      curveStyle: bezier',
    '      curveStyle: straight\n      controlPointStepSize: 34'
  );
  await styleEditor.evaluate((element, value) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', value);
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData }));
  }, straightStylesheet);
  await styleWorkspace.getByRole('button', { name: 'Apply' }).click();

  for (let index = 0; index < 3; index += 1) {
    await drawEdgeTemplate(page, 'link', 'router-1', 'router-2');
  }

  const sourceBounds = await page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node').boundingBox();
  const targetBounds = await page.locator('.react-flow__node[data-id="router-2"] .topoviewer-node').boundingBox();
  if (!sourceBounds || !targetBounds) throw new Error('Parallel-link endpoint nodes are not measurable.');
  const laneEndpoints = await page.locator('.react-flow__edge[data-id^="link-"] .topoviewer-edge-visible-path').evaluateAll((paths) => paths.map((path) => {
    const edgePath = path as SVGPathElement;
    const matrix = edgePath.getScreenCTM();
    if (!matrix) throw new Error('Parallel lane has no screen transform.');
    const startPoint = edgePath.getPointAtLength(0);
    const endPoint = edgePath.getPointAtLength(edgePath.getTotalLength());
    const start = new DOMPoint(startPoint.x, startPoint.y).matrixTransform(matrix);
    const end = new DOMPoint(endPoint.x, endPoint.y).matrixTransform(matrix);
    return {
      end: { x: end.x, y: end.y },
      start: { x: start.x, y: start.y },
      transform: path.getAttribute('transform')
    };
  }));
  const attached = (point: { x: number; y: number }, bounds: NonNullable<typeof sourceBounds>) => {
    const dx = Math.max(bounds.x - point.x, 0, point.x - (bounds.x + bounds.width));
    const dy = Math.max(bounds.y - point.y, 0, point.y - (bounds.y + bounds.height));
    return Math.hypot(dx, dy) <= 4;
  };
  laneEndpoints.forEach(({ start, end, transform }) => {
    expect(transform).toBeNull();
    expect(attached(start, sourceBounds), `lane start ${JSON.stringify(start)} must attach to ${JSON.stringify(sourceBounds)}`).toBe(true);
    expect(attached(end, targetBounds), `lane end ${JSON.stringify(end)} must attach to ${JSON.stringify(targetBounds)}`).toBe(true);
  });

  for (let index = 1; index <= 3; index += 1) {
    const point = await page.locator(`.react-flow__edge[data-id="link-${index}"] .topoviewer-edge-visible-path`).evaluate((path) => {
      const edgePath = path as SVGPathElement;
      const matrix = edgePath.getScreenCTM();
      if (!matrix) throw new Error('Parallel lane has no screen transform.');
      const local = edgePath.getPointAtLength(edgePath.getTotalLength() * 0.35);
      const screen = new DOMPoint(local.x, local.y).matrixTransform(matrix);
      return { x: screen.x, y: screen.y };
    });
    await page.mouse.click(point.x, point.y);
    await expect(page.locator(`.react-flow__edge[data-id="link-${index}"]`)).toHaveClass(/\bselected\b/);
    await expect(page.locator('.react-flow__edge.selected')).toHaveCount(1);
  }
});

test('authors a parent link pipe independently from parallel grouping', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  await drawEdgeTemplate(page, 'parallel-link', 'router-1', 'router-2');
  await expect(page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]')).toHaveCount(1);
  await drawEdgeTemplate(page, 'parent-link-pipe', 'edge-01', 'noc-controller');

  await expect(page.locator('.topoviewer-edge-aggregate[data-link-aggregate="true"]')).toHaveCount(1);
  await expect(page.locator('.topoviewer-edge-pipe-fill')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-4"]')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-5"]')).toHaveCount(1);
  await openSource(page);
  for (const query of ['name: Parent Link Pipe', 'name: Child Link Lane', 'parent: link-4']) {
    await expectSourceContains(page, query);
  }
  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectSourceContains(page, 'pipe: true', true, 'stylesheet');
});

test('connects a callout to a node through the canonical leader target', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'callout', { x: 140, y: 180 });
  await dragTemplate(page, 'router', { x: 500, y: 180 });
  await dragTemplate(page, 'callout', { x: 500, y: 380 });

  const calloutSource = page.locator('.react-flow__node[data-id="callout-1"] .react-flow__handle-right');
  const nodeTarget = nodeConnectionPort(page, 'router-1', 'left');
  await activateStudioPaletteTemplate(page, 'link');
  const sourceBox = await calloutSource.boundingBox();
  const targetBox = await nodeTarget.boundingBox();
  if (!sourceBox || !targetBox) throw new Error('Callout connection handles are not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('.react-flow__edge[data-id="callout-1:leader"]')).toHaveCount(1);
  const nodeSource = nodeConnectionPort(page, 'router-1', 'right');
  const secondCalloutTarget = page.locator('.react-flow__node[data-id="callout-2"] .react-flow__handle-left');
  await activateStudioPaletteTemplate(page, 'link');
  const nodeSourceBox = await nodeSource.boundingBox();
  const secondCalloutTargetBox = await secondCalloutTarget.boundingBox();
  if (!nodeSourceBox || !secondCalloutTargetBox) throw new Error('Reverse callout connection handles are not measurable.');
  await page.mouse.move(nodeSourceBox.x + nodeSourceBox.width / 2, nodeSourceBox.y + nodeSourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondCalloutTargetBox.x + secondCalloutTargetBox.width / 2, secondCalloutTargetBox.y + secondCalloutTargetBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__edge[data-id="callout-2:leader"]')).toHaveCount(1);

  await openSource(page);
  await expectSourceContains(page, 'target: router-1');
  await expectSourceContains(page, 'id: link-1', false);
});

test('supports selection CRUD, clipboard, layout actions, history, and scoped shortcuts', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await selectNodes(page, ['router-1', 'router-2', 'router-3']);

  await (await openCanvasSelectionActions(page)).getByRole('menuitem', { name: 'Align and distribute' }).click();
  await page.getByRole('menu', { name: 'Align and distribute selection' }).getByRole('menuitem', { name: 'Distribute horizontally' }).click();
  await expect(page.getByRole('button', { name: 'Copy selection' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cut selection' })).toHaveCount(0);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+c');
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+x');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+v');
  await expect(page.locator('.react-flow__node')).toHaveCount(6);

  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  const properties = await openStudioWorkspace(page, 'Properties');
  const name = properties.getByRole('textbox', { name: 'Visible label' });
  await name.fill('Editable Name');
  await name.press('Backspace');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
  const viewport = await openStudioWorkspace(page, 'Properties');
  const alignment = viewport.getByRole('switch', { name: /Alignment assistance/ });
  await alignment.uncheck();
  await alignment.focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  const box = await node.locator('.topoviewer-node-icon').boundingBox();
  if (!box) throw new Error('Node is not measurable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 8 });
  await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText('Move');
});

test('deletes a node and dependent link atomically', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge')).toHaveCount(0);
  await expect(page.locator('[role="alert"]:visible')).toHaveCount(0);
});

test('resizes a selected node through the native resize handles', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');

  const handle = page.locator('.react-flow__node[data-id="router-1"] .topoviewer-resize-handle.bottom.right');
  await expect(handle).toBeVisible();
  const inspector = await openStyleWorkspace(page);
  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Shape' }), 'rectangle');
  await inspector.getByRole('button', { name: 'Apply' }).click();
  await expect(inspector.locator('.studio-style-candidate-footer')).toHaveCount(0);
  await editStyleAttribute(inspector, 'Body width');
  const before = await page.getByRole('spinbutton', { name: 'Body width' }).inputValue();
  const box = await handle.boundingBox();
  if (!box) throw new Error('Resize handle is not measurable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 44, box.y + box.height / 2 + 24, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => Number(await page.getByRole('spinbutton', { name: 'Body width' }).inputValue())).toBeGreaterThan(Number(before));
  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectSourceContains(page, 'node[id = "router-1"]', true, 'stylesheet');
  await expectSourceContains(page, 'width:', true, 'stylesheet');
  await expectSourceContains(page, 'height:', true, 'stylesheet');
});

test('uses context actions and native lasso selection', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'router', { x: 180, y: 120 });
  await dragTemplate(page, 'service', { x: 340, y: 300 });
  await dragTemplate(page, 'controller', { x: 500, y: 480 });

  await page.locator('.react-flow__node[data-id="router-1"]').click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  await expect(menu.locator('..')).toHaveClass(/MuiPaper-root/);
  await expect(menu.locator('.MuiMenuItem-root')).toHaveCount(4);
  await expect(menu.locator('.MuiListItemIcon-root')).toHaveCount(4);
  await expect(menu.getByRole('menuitem', { exact: true, name: 'Copy' })).toHaveCount(0);
  await expect(menu.getByRole('menuitem', { exact: true, name: 'Cut' })).toHaveCount(0);
  await menu.getByRole('menuitem', { name: 'Save to Object Palette' }).click();
  const add = await openStudioWorkspace(page, 'Add');
  await expect(add.getByTestId('palette-preset:preset-1')).toBeVisible();
  await add.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await waitForStudioCanvasGeometry(page);

  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
  const first = await page.locator('.react-flow__node[data-id="router-1"]').boundingBox();
  const last = await page.locator('.react-flow__node[data-id="controller-1"]').boundingBox();
  if (!first || !last) throw new Error('Nodes are not measurable for marquee selection.');
  await page.mouse.move(first.x - 20, first.y - 20);
  await page.mouse.down();
  await page.mouse.move(last.x + last.width + 20, last.y + last.height + 20, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Selection actions' })).toBeEnabled();

  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu.getByRole('menuitem', { name: 'Duplicate 3 objects' })).toBeVisible();
  const contextAlignmentMenu = page.getByRole('menu', { name: 'Align and distribute selection' });
  const contextAlignmentItem = menu.getByRole('menuitem', { name: 'Align and distribute' });
  await contextAlignmentItem.focus();
  await page.keyboard.press('ArrowRight');
  await expect(contextAlignmentMenu).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(contextAlignmentMenu).toBeHidden();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');

  await page.locator('.react-flow__nodesselection-rect').click({ button: 'right' });
  await expect(menu.getByRole('menuitem', { name: 'Duplicate 3 objects' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Delete 3 objects' })).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Align and distribute' }).click();
  await expect(contextAlignmentMenu.getByRole('menuitem', { name: 'Align top' })).toBeVisible();
  await expect(contextAlignmentMenu.getByRole('menuitem', { name: 'Distribute horizontally' })).toBeVisible();
  await contextAlignmentMenu.getByRole('menuitem', { name: 'Align top' }).click();
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(3);
  await expect(menu).toBeHidden();

  await page.locator('.react-flow__nodesselection-rect').click({ button: 'right' });
  await menu.getByRole('menuitem', { name: 'Duplicate 3 objects' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(6);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(3);

  await page.locator('.react-flow__nodesselection-rect').click({ button: 'right' });
  await menu.getByRole('menuitem', { name: 'Delete 3 objects' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
});

test('moves and aligns a lasso selection as one persistent group', async ({ page }) => {
  await page.goto('/');
  const projectManager = await openProjectManager(page);
  await projectManager.getByRole('button', { name: 'New project' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(0);
  await dragTemplate(page, 'router', { x: 180, y: 180 });
  await dragTemplate(page, 'router', { x: 360, y: 260 });
  await dragTemplate(page, 'router', { x: 540, y: 340 });
  await dragTemplate(page, 'router', { x: 180, y: 460 });
  await dragTemplate(page, 'router', { x: 360, y: 540 });
  await dragTemplate(page, 'router', { x: 540, y: 620 });

  const selectTool = page.getByRole('button', { name: 'Select and lasso' });
  await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
  const nodes = ['router-1', 'router-2', 'router-3', 'router-4', 'router-5', 'router-6'].map((id) =>
    page.locator(`.react-flow__node[data-id="${id}"]`)
  );
  const before = await Promise.all(nodes.map((node) => node.boundingBox()));
  if (before.some((box) => !box)) throw new Error('Lasso fixture nodes are not measurable.');
  const measuredBefore = before as Array<NonNullable<(typeof before)[number]>>;
  const left = Math.min(...measuredBefore.map((box) => box.x)) - 20;
  const top = Math.min(...measuredBefore.map((box) => box.y)) - 20;
  const right = Math.max(...measuredBefore.map((box) => box.x + box.width)) + 20;
  const bottom = Math.max(...measuredBefore.map((box) => box.y + box.height)) + 20;
  await page.locator('.react-flow__pane').click({ position: { x: 12, y: 12 } });
  await page.mouse.move(left, top);
  await page.mouse.down();
  await page.mouse.move(right, bottom, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(6);

  const dragStart = measuredBefore[0];
  await page.mouse.move(dragStart.x + dragStart.width / 2, dragStart.y + dragStart.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragStart.x + dragStart.width / 2 + 86, dragStart.y + dragStart.height / 2 + 54, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(6);
  const moved = await Promise.all(nodes.map((node) => node.boundingBox()));
  if (moved.some((box) => !box)) throw new Error('Moved lasso fixture nodes are not measurable.');
  const measuredMoved = moved as Array<NonNullable<(typeof moved)[number]>>;
  const deltas = measuredMoved.map((box, index) => ({
    x: box.x - measuredBefore[index].x,
    y: box.y - measuredBefore[index].y
  }));
  deltas.slice(1).forEach((delta) => {
    expect(delta.x).toBeCloseTo(deltas[0].x, 0);
    expect(delta.y).toBeCloseTo(deltas[0].y, 0);
  });

  await (await openCanvasSelectionActions(page)).getByRole('menuitem', { name: 'Align and distribute' }).click();
  const alignmentMenu = page.getByRole('menu', { name: 'Align and distribute selection' });
  await expect(alignmentMenu).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(6);
  await expect(alignmentMenu).toBeVisible();
  await alignmentMenu.getByRole('menuitem', { name: 'Align top' }).click();

  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');
  const archive = await readStudioProjectArchive(await exportGoldenArchive(page));
  const topology = parse(archive.project.documents.topology.text) as TopoDocument;
  const authoredNodes = topology.graph?.nodes?.filter((node) => /^router-[1-6]$/.test(node.id)) || [];
  expect(authoredNodes).toHaveLength(6);
  const authoredYPositions = authoredNodes.map((node) => (Array.isArray(node.position) ? node.position[1] : node.position?.y));
  expect(new Set(authoredYPositions).size).toBe(1);

  await expect.poll(async () => {
    const aligned = await Promise.all(nodes.map((node) => node.boundingBox()));
    if (aligned.some((box) => !box)) return Number.POSITIVE_INFINITY;
    const yPositions = aligned.map((box) => (box as NonNullable<(typeof aligned)[number]>).y);
    return Math.max(...yPositions) - Math.min(...yPositions);
  }).toBeLessThan(0.5);
});

test('persists, renames, and deletes saved Object Palette items', async ({ page }) => {
  await page.goto('/');
  await dragTemplate(page, 'router', { x: 180, y: 180 });
  await invokeCanvasSelectionAction(page, 'Save to Object Palette');
  await openStudioWorkspace(page, 'Add');
  await expect(page.getByTestId('palette-preset:preset-1')).toContainText('router-1 preset');

  await page.getByRole('button', { name: 'Manage router-1 preset' }).click();
  await page.getByRole('menu', { name: 'router-1 preset actions' }).getByRole('menuitem', { name: 'Rename' }).click();
  const rename = page.getByRole('dialog', { name: 'Rename Object Palette item' });
  await rename.getByRole('textbox', { name: 'Name' }).fill('Core Router');
  await rename.getByRole('button', { name: 'Rename' }).click();
  await expect(page.getByTestId('palette-preset:preset-1')).toContainText('Core Router');

  await page.reload();
  await openStudioWorkspace(page, 'Add');
  await expandPaletteGroup(page, 'Presets');
  await expect(page.getByTestId('palette-preset:preset-1')).toContainText('Core Router');
  await page.getByRole('button', { name: 'Manage Core Router' }).click();
  await page.getByRole('menu', { name: 'Core Router actions' }).getByRole('menuitem', { name: 'Delete' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete Core Router?' });
  await confirmation.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('palette-preset:preset-1')).toHaveCount(0);
});

test('creates a reachable path over existing graph connectivity', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await selectNodes(page, ['router-1', 'router-2']);
  await openStudioWorkspace(page, 'Add');
  await activateStudioPaletteTemplate(page, 'path');

  await openSource(page);
  await expectSourceContains(page, 'id: path-1');
  await expectSourceContains(page, '- paths');
  await expectSourceContains(page, '- router-1');
  await expectSourceContains(page, '- router-2');
});

test('creates a deterministic shortest path when that authoring mode is selected', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await selectNodes(page, ['router-2', 'router-3']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');

  await selectNodes(page, ['router-1', 'router-3']);
  const palette = await openStudioWorkspace(page, 'Add');
  await selectStudioOption(page, palette.getByRole('combobox', { name: 'Path route' }), 'shortest');
  await palette.getByTestId('palette-path').click();

  await openSource(page);
  await expectSourceContains(page, 'sequence:');
  await expectSourceContains(page, '- router-1');
  await expectSourceContains(page, '- router-2');
  await expectSourceContains(page, '- router-3');
  await expect(page.locator('.react-flow__edge[data-id="link-1"]')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge[data-id="link-2"]')).toHaveCount(1);
});
