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
  if ((await checkbox.isChecked()) !== checked) {
    await checkbox.setChecked(checked);
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
  let lastSnapshot = { nodeIds: [] };
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
      `lastNodeIds=[${lastSnapshot.nodeIds.join(', ')}]`,
      String(error?.message || error)
    ].join('\n'));
  }
}

function combinations(items) {
  const states = [];
  const total = 2 ** items.length;
  for (let mask = 0; mask < total; mask += 1) {
    states.push(new Set(items.filter((_, index) => (mask & (1 << index)) !== 0)));
  }
  return states;
}

async function renderedSnapshot(page) {
  return withNavigationRetry(page, () => page.evaluate(() => {
    const hiddenEdgePaths = [...document.querySelectorAll('.react-flow__edge-path')];
    const visibleEdgePaths = [...document.querySelectorAll('.topoviewer-edge-visible-path')];
    const invalidPath = (pathElement) => {
      const d = pathElement.getAttribute('d') || '';
      return !d || /NaN|undefined|null/.test(d);
    };
    return {
      hasErrorAlert: !!document.querySelector('.MuiAlert-root'),
      nodeIds: [...document.querySelectorAll('.react-flow__node')].map((node) => node.dataset.id),
      edgeCount: document.querySelectorAll('.react-flow__edge').length,
      edgeLabelCount: document.querySelectorAll('.topoviewer-edge-label').length,
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
  test('renders every layer and display-knob permutation without invalid state', async ({ page }) => {
    test.setTimeout(240000);
    const browserErrors = await openWorkbench(page);
    const failures = [];

    for (const selectedLayers of combinations(canonicalWorkbenchLayers)) {
      for (const enabledToggles of combinations(canonicalWorkbenchToggles)) {
        await setPermutation(page, selectedLayers, enabledToggles);
        const label = `layers=[${[...selectedLayers].join(', ') || 'none'}] toggles=[${[...enabledToggles].join(', ') || 'none'}]`;
        const expectsRegions = enabledToggles.has('Show regions') && (
          selectedLayers.has('IGP') || selectedLayers.has('BGP / Controller')
        );
        await waitForRegionVisibility(page, expectsRegions, label);
        const snapshot = await renderedSnapshot(page);

        if (snapshot.hasErrorAlert) {
          failures.push(`${label}: renderer reported an alert`);
        }

        if (snapshot.invalidPathCount > 0) {
          failures.push(`${label}: ${snapshot.invalidPathCount} edge path(s) had invalid SVG data`);
        }

        const regionNodeCount = snapshot.nodeIds.filter((id) => id?.startsWith('region:')).length;
        if (!expectsRegions && regionNodeCount !== 0) {
          failures.push(`${label}: rendered ${regionNodeCount} region node(s) when regions should be hidden`);
        }

        const expectsLabels = enabledToggles.has('Show link/path labels') && snapshot.edgeCount > 0;
        if (!expectsLabels && snapshot.edgeLabelCount !== 0) {
          failures.push(`${label}: rendered ${snapshot.edgeLabelCount} edge label(s) when labels should be hidden`);
        }
      }
    }

    expect(failures).toEqual([]);
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
