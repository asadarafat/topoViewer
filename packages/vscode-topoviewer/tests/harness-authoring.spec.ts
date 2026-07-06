import { expect, test } from '@playwright/test';
import {
  expectCurrentHarnessServer,
  graphNodeByLabel,
  nodePosition,
  stylesheetText,
  topologyText,
  waitForHarnessReady,
  waitForHarnessState,
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

test('keeps new topology insertions manual after connection creation and drag', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('button', { name: 'New topology' }).click();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(() => topologyText(page)).toContain('mode: manual');
  await expect.poll(() => topologyText(page)).toContain('id: physical');
  await expect.poll(() => stylesheetText(page)).toContain('selector: node');

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

  const firstNode = graphNodeByLabel(page, 'New Node').first();
  const beforeBox = await firstNode.boundingBox();
  expect(beforeBox).not.toBeNull();
  await page.mouse.move(beforeBox!.x + beforeBox!.width / 2, beforeBox!.y + beforeBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(beforeBox!.x + beforeBox!.width / 2 + 120, beforeBox!.y + beforeBox!.height / 2 + 80, { steps: 18 });
  await page.mouse.up();

  await expect.poll(async () => {
    const moved = nodePosition(await topologyText(page), 'node-1');
    return moved ? Math.hypot(moved.x - firstPosition!.x, moved.y - firstPosition!.y) : 0;
  }).toBeGreaterThan(40);
  const movedPosition = nodePosition(await topologyText(page), 'node-1');
  await page.reload();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await expect.poll(async () => nodePosition(await topologyText(page), 'node-1')).toEqual(movedPosition);
});
