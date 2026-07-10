import { expect, test } from '@playwright/test';
import {
  expectCurrentHarnessServer,
  graphNodeByLabel,
  nodePosition,
  topologyText
} from './harness-helpers';

const HARNESS_ALLOWED_BROWSER_ERROR_PATTERNS = [
  /ResizeObserver loop completed with undelivered notifications/,
  /Error inlining remote css file/,
  /Error loading remote stylesheet/,
  /Error while reading CSS rules from/
];
const harnessBrowserErrors = new WeakMap<object, string[]>();

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

function dragMotionIssues(samples: Array<{ pointerX: number; pointerY: number; nodeX: number; nodeY: number }>) {
  const maximumFunctionalTrackingError = 40;
  if (samples.length < 2) return [];
  const origin = samples[0];
  const issues: string[] = [];
  let stationaryPointerTravel = 0;
  let trackingErrorReported = false;
  let stationaryReported = false;

  samples.slice(1).forEach((sample, index) => {
    const previous = samples[index];
    const pointerDelta = Math.hypot(sample.pointerX - previous.pointerX, sample.pointerY - previous.pointerY);
    const nodeDelta = Math.hypot(sample.nodeX - previous.nodeX, sample.nodeY - previous.nodeY);
    stationaryPointerTravel = pointerDelta > 2 && nodeDelta < 0.5
      ? stationaryPointerTravel + pointerDelta
      : 0;
    if (!stationaryReported && stationaryPointerTravel > 24) {
      issues.push(`held across ${stationaryPointerTravel.toFixed(2)}px of pointer travel at step ${index + 2}`);
      stationaryReported = true;
    }

    const pointerTravel = {
      x: sample.pointerX - origin.pointerX,
      y: sample.pointerY - origin.pointerY
    };
    const nodeTravel = {
      x: sample.nodeX - origin.nodeX,
      y: sample.nodeY - origin.nodeY
    };
    const trackingError = Math.hypot(nodeTravel.x - pointerTravel.x, nodeTravel.y - pointerTravel.y);
    if (!trackingErrorReported && trackingError > maximumFunctionalTrackingError) {
      issues.push(`diverged from pointer by ${trackingError.toFixed(2)}px at step ${index + 2}`);
      trackingErrorReported = true;
    }

    const pointerDistance = Math.hypot(pointerTravel.x, pointerTravel.y);
    if (pointerDistance > 4) {
      const nodeStep = {
        x: sample.nodeX - previous.nodeX,
        y: sample.nodeY - previous.nodeY
      };
      const forwardStep = ((nodeStep.x * pointerTravel.x) + (nodeStep.y * pointerTravel.y)) / pointerDistance;
      if (forwardStep < -4) issues.push(`reversed against pointer direction at step ${index + 2}`);
    }
  });
  return issues;
}

const seededStylesheet = [
  'stylesheet:',
  '  - selector: node',
  '    style:',
  '      shape: roundRectangle',
  '      width: 92',
  '      height: 56',
  '      borderWidth: 2',
  '      backgroundColor: "#0f172a"',
  '      borderColor: "#60a5fa"',
  '      labelColor: "#f8fafc"',
  ''
].join('\n');

test('shows alignment helper lines while dragging nodes in the browser harness preview', async ({ page }) => {
  const seededTopology = [
    'layout:',
    '  mode: manual',
    '  width: 640',
    '  height: 360',
    'graph:',
    '  id: helper-lines-harness',
    '  layers:',
    '    - id: physical',
    '      name: Physical',
    '  nodes:',
    '    - id: drag-me',
    '      name: Drag Me',
    '      layers: [physical]',
    '      position: [90, 140]',
    '    - id: align-peer',
    '      name: Peer',
    '      layers: [physical]',
    '      position: [300, 140]',
    ''
  ].join('\n');
  await page.addInitScript(({ topologyText: topologySeed, stylesheetText: stylesheetSeed }) => {
    window.localStorage.clear();
    window.localStorage.setItem('topoviewer.vscodeHarness.customFixtures.v1', JSON.stringify([{
      id: 'helper-lines-harness',
      name: 'Helper lines harness'
    }]));
    window.localStorage.setItem('topoviewer.vscodeHarness.activeFixture.v1', 'helper-lines-harness');
    window.localStorage.setItem('topoviewer.vscodeHarness.fixtureState.v1:helper-lines-harness', JSON.stringify({
      fixtureId: 'helper-lines-harness',
      topologyText: topologySeed,
      stylesheetText: stylesheetSeed
    }));
  }, { topologyText: seededTopology, stylesheetText: seededStylesheet });

  await page.goto('/');
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect(graphNodeByLabel(page, 'Drag Me')).toBeVisible();
  await expect(graphNodeByLabel(page, 'Peer')).toBeVisible();

  await page.getByRole('button', { name: 'Show topology controls' }).click();
  const settings = page.locator('.topoviewer-vscode-controls-overlay');
  await expect(settings).toBeVisible();
  await expect(settings.getByRole('checkbox', { name: 'Physical' })).toBeChecked();
  await settings.getByRole('checkbox', { name: 'Physical' }).uncheck();
  await expect(graphNodeByLabel(page, 'Drag Me')).toBeHidden();
  await settings.getByRole('checkbox', { name: 'Physical' }).check();
  await expect(graphNodeByLabel(page, 'Drag Me')).toBeVisible();
  await expect(settings.getByRole('checkbox', { name: 'Helper lines' })).toBeChecked();
  await settings.getByRole('checkbox', { name: 'Helper lines' }).uncheck();
  await expect(settings.getByRole('checkbox', { name: 'Helper lines' })).not.toBeChecked();
  await settings.getByRole('checkbox', { name: 'Helper lines' }).check();
  await expect(settings.getByRole('checkbox', { name: 'Helper lines' })).toBeChecked();

  const dragNode = graphNodeByLabel(page, 'Drag Me').first();
  const peerNode = graphNodeByLabel(page, 'Peer').first();
  const dragBox = await dragNode.boundingBox();
  const peerBox = await peerNode.boundingBox();
  expect(dragBox).not.toBeNull();
  expect(peerBox).not.toBeNull();

  const pointerOffset = {
    x: dragBox!.width / 2,
    y: dragBox!.height / 2
  };
  const from = {
    x: dragBox!.x + pointerOffset.x,
    y: dragBox!.y + pointerOffset.y
  };
  const to = {
    x: peerBox!.x + pointerOffset.x + 2,
    y: peerBox!.y + pointerOffset.y + 2
  };
  const samples: Array<{ pointerX: number; pointerY: number; nodeX: number; nodeY: number }> = [];
  const helperVisibility: boolean[] = [];
  let helperLineVisible = false;

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  samples.push({ pointerX: from.x, pointerY: from.y, nodeX: dragBox!.x, nodeY: dragBox!.y });
  for (let step = 1; step <= 48; step += 1) {
    const pointerX = from.x + ((to.x - from.x) * step) / 48;
    const pointerY = from.y + ((to.y - from.y) * step) / 48;
    await page.mouse.move(pointerX, pointerY);
    await page.waitForTimeout(16);
    const lineVisible = await page.locator('.topoviewer-helper-line').first().isVisible();
    helperLineVisible ||= lineVisible;
    helperVisibility.push(lineVisible);
    const currentBox = await dragNode.boundingBox();
    expect(currentBox).not.toBeNull();
    samples.push({
      pointerX,
      pointerY,
      nodeX: currentBox!.x,
      nodeY: currentBox!.y
    });
  }
  expect(helperLineVisible).toBe(true);
  const firstVisibleIndex = helperVisibility.indexOf(true);
  expect(helperVisibility.slice(firstVisibleIndex)).not.toContain(false);
  expect(dragMotionIssues(samples)).toEqual([]);
  const beforeReleaseBox = await dragNode.boundingBox();
  await page.mouse.up();
  await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
  const afterReleaseBox = await dragNode.boundingBox();
  expect(beforeReleaseBox).not.toBeNull();
  expect(afterReleaseBox).not.toBeNull();
  expect(Math.hypot(afterReleaseBox!.x - beforeReleaseBox!.x, afterReleaseBox!.y - beforeReleaseBox!.y)).toBeLessThan(8);
  await expect.poll(async () => nodePosition(await topologyText(page), 'drag-me')).toEqual({ x: 300, y: 140 });
});

test('keeps helper-line snapping stable across repeated staggered drags', async ({ page }) => {
  const seededTopology = [
    'layout:',
    '  mode: manual',
    '  width: 640',
    '  height: 360',
    'graph:',
    '  id: helper-lines-staggered-drag',
    '  layers:',
    '    - id: physical',
    '      name: Physical',
    '  nodes:',
    '    - id: drag-me',
    '      name: Drag Me',
    '      layers: [physical]',
    '      position: [180, 170]',
    '    - id: guide-y',
    '      name: Guide Y',
    '      layers: [physical]',
    '      position: [320, 290]',
    ''
  ].join('\n');
  await page.addInitScript(({ topologyText: topologySeed, stylesheetText: stylesheetSeed }) => {
    window.localStorage.clear();
    window.localStorage.setItem('topoviewer.vscodeHarness.customFixtures.v1', JSON.stringify([{
      id: 'helper-lines-staggered-drag',
      name: 'Helper lines staggered drag'
    }]));
    window.localStorage.setItem('topoviewer.vscodeHarness.activeFixture.v1', 'helper-lines-staggered-drag');
    window.localStorage.setItem('topoviewer.vscodeHarness.fixtureState.v1:helper-lines-staggered-drag', JSON.stringify({
      fixtureId: 'helper-lines-staggered-drag',
      topologyText: topologySeed,
      stylesheetText: stylesheetSeed
    }));
  }, { topologyText: seededTopology, stylesheetText: seededStylesheet });

  await page.goto('/');
  await expect(page.getByText('No diagnostics')).toBeVisible();
  const dragNode = graphNodeByLabel(page, 'Drag Me').first();
  const guideYNode = graphNodeByLabel(page, 'Guide Y').first();
  await expect(dragNode).toBeVisible();
  await expect(guideYNode).toBeVisible();

  await page.getByRole('button', { name: 'Show topology controls' }).click();
  const settings = page.locator('.topoviewer-vscode-controls-overlay');
  await expect(settings.getByRole('checkbox', { name: 'Helper lines' })).toBeChecked();

  const dragBy = async (deltaX: number, deltaY: number) => {
    const box = await dragNode.boundingBox();
    expect(box).not.toBeNull();
    const from = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    const samples: Array<{ pointerX: number; pointerY: number; nodeX: number; nodeY: number }> = [];
    let helperLineVisible = false;

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    samples.push({ pointerX: from.x, pointerY: from.y, nodeX: box!.x, nodeY: box!.y });
    for (let step = 1; step <= 24; step += 1) {
      const pointerX = from.x + (deltaX * step) / 24;
      const pointerY = from.y + (deltaY * step) / 24;
      await page.mouse.move(pointerX, pointerY);
      await page.waitForTimeout(16);
      helperLineVisible ||= await page.locator('.topoviewer-helper-line').first().isVisible();
      const currentBox = await dragNode.boundingBox();
      expect(currentBox).not.toBeNull();
      samples.push({ pointerX, pointerY, nodeX: currentBox!.x, nodeY: currentBox!.y });
    }
    expect(dragMotionIssues(samples), JSON.stringify(samples, null, 2)).toEqual([]);
    await page.mouse.up();
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
    return helperLineVisible;
  };

  expect(await dragBy(136, 0)).toBe(true);
  expect(await dragBy(0, 70)).toBe(true);
  expect(await dragBy(0, -90)).toBe(true);

  await expect(dragNode).toBeVisible();
  await expect(guideYNode).toBeVisible();
  await expect(page.locator('.topoviewer')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'drag-me')).not.toEqual({ x: 180, y: 170 });
});
