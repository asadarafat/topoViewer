import { expect, test } from '@playwright/test';

const allowedBrowserErrorPatterns = [
  /ResizeObserver loop completed with undelivered notifications/,
  /Error inlining remote css file/,
  /Error loading remote stylesheet/,
  /Error while reading CSS rules from/
];
const browserErrors = new WeakMap<object, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  const actionable = (browserErrors.get(page) || []).filter((line) => (
    !allowedBrowserErrorPatterns.some((pattern) => pattern.test(line))
  ));
  expect(actionable).toEqual([]);
});

test('records keyboard and mouse interactions on the harness debug route', async ({ page }) => {
  const seededTopology = [
    'layout:',
    '  mode: manual',
    '  width: 640',
    '  height: 360',
    'graph:',
    '  id: debug-input-harness',
    '  layers:',
    '    - id: physical',
    '      name: Physical',
    '  nodes:',
    '    - id: debug-a',
    '      name: Debug A',
    '      layers: [physical]',
    '      position: [120, 140]',
    '    - id: debug-b',
    '      name: Debug B',
    '      layers: [physical]',
    '      position: [320, 140]',
    ''
  ].join('\n');
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
  await page.addInitScript(({ topologyText, stylesheetText }) => {
    window.localStorage.clear();
    window.localStorage.setItem('topoviewer.vscodeHarness.customFixtures.v1', JSON.stringify([{
      id: 'debug-input-harness',
      name: 'Debug input harness'
    }]));
    window.localStorage.setItem('topoviewer.vscodeHarness.activeFixture.v1', 'debug-input-harness');
    window.localStorage.setItem('topoviewer.vscodeHarness.fixtureState.v1:debug-input-harness', JSON.stringify({
      fixtureId: 'debug-input-harness',
      topologyText,
      stylesheetText
    }));
  }, { topologyText: seededTopology, stylesheetText: seededStylesheet });

  await page.goto('/debug');
  await expect(page.getByText('Browser harness')).toBeVisible();
  await expect(page.getByLabel('Live input debug overlay')).toBeVisible();
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect(page.locator('.topoviewer')).toBeVisible();

  await page.keyboard.down('A');
  await expect(page.locator('.topoviewer-debug-overlay-last strong')).toHaveText('Key down');
  await expect(page.locator('.topoviewer-debug-overlay-meta')).toContainText('A');
  await page.keyboard.up('A');

  await page.mouse.click(420, 360);
  await expect(page.locator('.topoviewer-debug-overlay-last strong')).toHaveText('Click');
  await expect(page.locator('.topoviewer-debug-overlay-last p')).toContainText('mouse Left at 420, 360');

  const node = page.locator('.react-flow__node').first();
  const nodeBox = await node.boundingBox();
  expect(nodeBox).not.toBeNull();
  const start = { x: nodeBox!.x + nodeBox!.width / 2, y: nodeBox!.y + nodeBox!.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 80, start.y + 30, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.topoviewer-debug-overlay-log')).toContainText('Drag move');
  await expect(page.locator('.topoviewer-debug-overlay-log')).toContainText('Pointer up');

  await page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Link tool' }).click();
  const sourceHandle = page.locator('.react-flow__node[data-id="debug-a"] .react-flow__handle.source').first();
  const targetHandle = page.locator('.react-flow__node[data-id="debug-b"] .react-flow__handle.source').first();
  await expect(sourceHandle).toBeVisible();
  await expect(targetHandle).toBeVisible();
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  expect(sourceBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  const source = { x: sourceBox!.x + sourceBox!.width / 2, y: sourceBox!.y + sourceBox!.height / 2 };
  const target = { x: targetBox!.x + targetBox!.width / 2, y: targetBox!.y + targetBox!.height / 2 };
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await expect(page.locator('.topoviewer-debug-overlay-log')).toContainText('Edge drag start');
  await page.mouse.move(target.x, target.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('.topoviewer-debug-overlay-log')).toContainText('Edge created');

  await expect(page.locator('.topoviewer-debug-overlay-meta')).toContainText('A');
});
