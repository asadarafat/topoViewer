const { test, expect } = require('@playwright/test');
const {
  canonicalFooterText,
  canonicalServicesToggleName,
  canonicalWorkbenchLayers,
  canonicalWorkbenchToggles
} = require('./workbench-helpers');

async function openWorkbench(page) {
  const browserErrors = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto('/');
  await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
  await expect(page.locator('footer')).toContainText(canonicalFooterText(), { timeout: 10000 });

  return browserErrors;
}

function actionableErrors(browserErrors) {
  return browserErrors.filter((line) => !line.includes('Download the React DevTools'));
}

async function setCheckboxByLabel(page, name, checked) {
  const checkbox = page.getByRole('checkbox', { name, exact: true });
  if (checked) {
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  } else {
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  }
}

function isNavigationRace(error) {
  const message = String(error?.message || error);
  return message.includes('Execution context was destroyed')
    || message.includes('Cannot find context')
    || message.includes('navigation');
}

async function waitForWorkbenchReady(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
}

async function withNavigationRetry(page, action) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (!isNavigationRace(error)) throw error;

      await waitForWorkbenchReady(page);
    }
  }

  return action();
}

async function settleReact(page) {
  await withNavigationRetry(page, () => page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  })));
}

async function setPermutation(page, selectedLayers, enabledToggles) {
  for (const name of canonicalWorkbenchLayers) {
    await setCheckboxByLabel(page, name, selectedLayers.has(name));
  }

  for (const name of canonicalWorkbenchToggles) {
    await setCheckboxByLabel(page, name, enabledToggles.has(name));
  }

  await settleReact(page);
}

async function waitForRegionVisibility(page, expectsRegions, label) {
  let lastSnapshot = { nodeIds: [], allNodeIds: [] };
  try {
    await expect.poll(async () => {
      lastSnapshot = await renderedSnapshot(page);
      const regionNodeCount = lastSnapshot.nodeIds.filter((id) => id?.startsWith('region:')).length;
      return expectsRegions ? regionNodeCount > 0 : regionNodeCount === 0;
    }, {
      intervals: [100, 250, 500, 1000],
      timeout: 15000
    }).toBe(true);
  } catch (error) {
    const regionNodeCount = lastSnapshot.nodeIds.filter((id) => id?.startsWith('region:')).length;
    throw new Error([
      `${label}: region visibility did not settle`,
      `expected=${expectsRegions ? 'visible' : 'hidden'}`,
      `lastRegionNodeCount=${regionNodeCount}`,
      `lastVisibleNodeIds=[${lastSnapshot.nodeIds.join(', ')}]`,
      `lastAllNodeIds=[${lastSnapshot.allNodeIds.join(', ')}]`,
      String(error?.message || error)
    ].join('\n'));
  }
}

async function waitForEdgeLabelVisibility(page, expectsLabels, label) {
  let lastSnapshot = { edgeCount: 0, edgeLabelCount: 0 };
  try {
    await expect.poll(async () => {
      lastSnapshot = await renderedSnapshot(page);
      return expectsLabels ? lastSnapshot.edgeLabelCount > 0 : lastSnapshot.edgeLabelCount === 0;
    }, {
      intervals: [100, 250, 500, 1000],
      timeout: 15000
    }).toBe(true);
  } catch (error) {
    throw new Error([
      `${label}: edge label visibility did not settle`,
      `expected=${expectsLabels ? 'visible' : 'hidden'}`,
      `lastEdgeCount=${lastSnapshot.edgeCount}`,
      `lastEdgeLabelCount=${lastSnapshot.edgeLabelCount}`,
      String(error?.message || error)
    ].join('\n'));
  }
}

async function expectRenderableState(page, label) {
  const snapshot = await renderedSnapshot(page);
  expect(snapshot.hasErrorAlert, `${label}: renderer reported an alert`).toBe(false);
  expect(snapshot.invalidPathCount, `${label}: edge path(s) had invalid SVG data`).toBe(0);
  return snapshot;
}

async function renderedSnapshot(page) {
  return withNavigationRetry(page, () => page.evaluate(() => {
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const nodeElements = [...document.querySelectorAll('.react-flow__node')];
    const edgeLabelElements = [...document.querySelectorAll('.topoviewer-edge-label')];
    const hiddenEdgePaths = [...document.querySelectorAll('.react-flow__edge-path')];
    const visibleEdgePaths = [...document.querySelectorAll('.topoviewer-edge-visible-path')];
    const invalidPath = (pathElement) => {
      const d = pathElement.getAttribute('d') || '';
      return !d || /NaN|undefined|null/.test(d);
    };
    return {
      hasErrorAlert: !!document.querySelector('.MuiAlert-root'),
      nodeIds: nodeElements.filter(isVisible).map((node) => node.dataset.id),
      allNodeIds: nodeElements.map((node) => node.dataset.id),
      edgeCount: document.querySelectorAll('.react-flow__edge').length,
      edgeLabelCount: edgeLabelElements.filter(isVisible).length,
      invalidPathCount: hiddenEdgePaths.filter(invalidPath).length + visibleEdgePaths.filter(invalidPath).length
    };
  }));
}

async function nodeBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"]`);
  await expect(locator, `Expected node ${id} to exist`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `Expected node ${id} to have a rendered box`).toBeTruthy();
  return box;
}

async function nodeLabelBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"] .topoviewer-node-label`);
  await expect(locator, `Expected node ${id} label to exist`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `Expected node ${id} label to have a rendered box`).toBeTruthy();
  return box;
}

function assertInside(outer, inner, tolerance = 3) {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - tolerance);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - tolerance);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + tolerance);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + tolerance);
}

function center(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

function movedBy(before, after) {
  return {
    dx: after.x - before.x,
    dy: after.y - before.y
  };
}

async function dragBox(page, box, dx, dy, offset = { x: 48, y: 28 }) {
  await page.mouse.move(box.x + offset.x, box.y + offset.y);
  await page.mouse.down();
  await page.mouse.move(box.x + offset.x + dx, box.y + offset.y + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

test.describe('TopoViewer package interactions', () => {
  test('renders layer and display controls without invalid visible state', async ({ page }) => {
    const browserErrors = await openWorkbench(page);

    await setPermutation(
      page,
      new Set(['IGP', 'BGP / Controller', 'Transport']),
      new Set(['Show regions', 'Show services inside nodes'])
    );
    await waitForRegionVisibility(page, true, 'IGP/BGP/Transport with regions enabled');
    await waitForEdgeLabelVisibility(page, false, 'IGP/BGP/Transport with labels disabled');
    await expectRenderableState(page, 'IGP/BGP/Transport baseline');

    await setCheckboxByLabel(page, 'Show regions', false);
    await settleReact(page);
    await waitForRegionVisibility(page, false, 'IGP/BGP/Transport with regions disabled');
    await expectRenderableState(page, 'regions disabled');

    await setCheckboxByLabel(page, 'Show link/path labels', true);
    await settleReact(page);
    await waitForEdgeLabelVisibility(page, true, 'IGP/BGP/Transport with labels enabled');
    await expectRenderableState(page, 'labels enabled');

    await setCheckboxByLabel(page, 'Show link/path labels', false);
    await settleReact(page);
    await waitForEdgeLabelVisibility(page, false, 'IGP/BGP/Transport with labels disabled again');
    await expectRenderableState(page, 'labels disabled again');

    await setPermutation(page, new Set(['Service']), new Set(['Show services inside nodes']));
    await waitForRegionVisibility(page, false, 'Service-only layer');
    await waitForEdgeLabelVisibility(page, false, 'Service-only layer');
    await expectRenderableState(page, 'Service-only layer');

    expect(actionableErrors(browserErrors)).toEqual([]);
  });

  test('nests child nodes inside their parent and drags them with the parent', async ({ page }) => {
    await openWorkbench(page);

    await page.getByLabel(canonicalServicesToggleName, { exact: true }).check();
    await page.waitForTimeout(400);

    const parentBefore = await nodeBox(page, 'R01');
    const childBefore = await nodeBox(page, 'svc-1321-r01');
    const parentLabelBefore = await nodeLabelBox(page, 'R01');
    const childLabelBefore = await nodeLabelBox(page, 'svc-1321-r01');

    assertInside(parentBefore, childBefore, 1);
    expect(childLabelBefore.y).toBeGreaterThan(parentLabelBefore.y + parentLabelBefore.height + 18);
    await expect(page.locator('.react-flow__node[data-id="svc-1321-r01"] .topoviewer-node-label')).toContainText('L3VPN 1321');
    await expect(page.locator('.react-flow__node[data-id="svc-1321-r09"] .topoviewer-node-label')).toContainText('L3VPN 1321');

    await dragBox(page, parentBefore, 95, 45);

    const parentAfter = await nodeBox(page, 'R01');
    const childAfter = await nodeBox(page, 'svc-1321-r01');
    const parentDelta = movedBy(parentBefore, parentAfter);
    const childDelta = movedBy(childBefore, childAfter);

    expect(childDelta.dx).toBeCloseTo(parentDelta.dx, 0);
    expect(childDelta.dy).toBeCloseTo(parentDelta.dy, 0);
  });

  test('drags an overlapping IS-IS L1 region and recomputes dependent hulls', async ({ page }) => {
    await openWorkbench(page);
    await page.getByRole('button', { name: 'No layers' }).click();
    await page.getByLabel('IGP').check();
    await page.waitForTimeout(400);

    const r05Before = await nodeBox(page, 'R05');
    const l1Before = await nodeBox(page, 'region:isis-l1');
    const l2Before = await nodeBox(page, 'region:isis-l2');
    const asBefore = await nodeBox(page, 'region:as65000');

    await dragBox(page, l1Before, 80, 35, { x: 320, y: 44 });

    const r05After = await nodeBox(page, 'R05');
    const l1After = await nodeBox(page, 'region:isis-l1');
    const l2After = await nodeBox(page, 'region:isis-l2');
    const asAfter = await nodeBox(page, 'region:as65000');
    const r05Delta = movedBy(r05Before, r05After);

    expect(Math.abs(r05Delta.dx)).toBeGreaterThan(50);
    expect(Math.abs(r05Delta.dy)).toBeGreaterThan(20);

    assertInside(l1After, r05After);
    assertInside(l2After, r05After);
    assertInside(asAfter, r05After);

    expect(Math.abs(l2After.x - l2Before.x) + Math.abs(l2After.width - l2Before.width)).toBeGreaterThan(20);
    expect(Math.abs(asAfter.x - asBefore.x) + Math.abs(asAfter.width - asBefore.width)).toBeGreaterThan(20);
  });

  test('drags the AS region and moves routers while child region hulls follow', async ({ page }) => {
    await openWorkbench(page);
    await page.getByRole('button', { name: 'No layers' }).click();
    await page.getByLabel('IGP').check();
    await page.waitForTimeout(400);

    const r01Before = await nodeBox(page, 'R01');
    const l1Before = await nodeBox(page, 'region:isis-l1');
    const asBefore = await nodeBox(page, 'region:as65000');

    await dragBox(page, asBefore, 70, 50, { x: 360, y: 44 });

    const r01After = await nodeBox(page, 'R01');
    const l1After = await nodeBox(page, 'region:isis-l1');
    const asAfter = await nodeBox(page, 'region:as65000');
    const r01CenterBefore = center(r01Before);
    const r01CenterAfter = center(r01After);

    expect(r01CenterAfter.x - r01CenterBefore.x).toBeGreaterThan(50);
    expect(r01CenterAfter.y - r01CenterBefore.y).toBeGreaterThan(35);
    assertInside(l1After, r01After);
    assertInside(asAfter, r01After);

    expect(l1After.x - l1Before.x).toBeCloseTo(r01After.x - r01Before.x, 0);
    expect(asAfter.x - asBefore.x).toBeCloseTo(r01After.x - r01Before.x, 0);
  });
});
