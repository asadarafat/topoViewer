import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { encodeStudioProjectArchive } from '../../src/archive/projectArchive';
import { createStarterProject } from '../../src/hosts/starterProject';
import { openStudioWorkspace } from '../support/workspaceRail';
import { budgets, writeBrowserReport } from './browserBenchmark';

async function retainedHeapBytes(page: Page, cdp: CDPSession) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await cdp.send('HeapProfiler.collectGarbage');
  await page.waitForTimeout(50);
  const usage = await cdp.send('Runtime.getHeapUsage');
  return usage.usedSize;
}

async function runLifecycleCycle(page: Page, archive: Uint8Array, sampleJson: string, baselineNodeCount: number) {
  await expect(page.locator('.react-flow__node-network')).toHaveCount(baselineNodeCount);
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer.getByLabel('topology YAML editor')).toBeVisible();
  await drawer.getByRole('button', { name: 'Close', exact: true }).click();

  const mapper = await openStudioWorkspace(page, 'Mapper');
  const samples = mapper.getByRole('region', { name: 'Local telemetry samples' });
  if (!await samples.isVisible()) {
    await mapper.getByRole('textbox', { name: 'Metric' }).fill('memory_cycle_health');
    await mapper.getByRole('button', { name: 'Create rule' }).click();
  }
  await expect(samples).toBeVisible();
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(sampleJson);
  await samples.getByRole('button', { name: 'Analyze samples' }).click();
  await expect(mapper.locator('[data-analysis-mode="worker"]')).toContainText('Analyzed off the main thread');
  const palette = await openStudioWorkspace(page, 'Objects');
  await expect(page.locator('.react-flow__node-network')).toHaveCount(baselineNodeCount);

  await palette.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node-network')).toHaveCount(baselineNodeCount + 1);
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const exportPanel = page.getByRole('dialog', { name: 'Export project' });
  await exportPanel.getByRole('button', { name: 'SVG' }).click();
  const download = page.waitForEvent('download');
  await exportPanel.getByRole('button', { name: 'Export SVG' }).click();
  await download;
  await exportPanel.getByRole('button', { name: 'Close export panel' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node-network')).toHaveCount(baselineNodeCount);

  await page.getByRole('button', { name: 'Enter presentation mode' }).click();
  await expect(page.getByRole('button', { name: 'Exit presentation mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Exit presentation mode' }).click();

  await page.getByRole('button', { name: 'Project menu' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'Open archive' }).click()
  ]);
  await chooser.setFiles({ buffer: Buffer.from(archive), mimeType: 'application/zip', name: 'memory-cycle.tvstudio' });
  const projectButton = page.getByRole('button', { name: 'Project menu' });
  await expect(projectButton).toContainText('Memory cycle topology');
  await projectButton.click();
  await page.getByRole('dialog', { name: 'Project menu' }).getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog', { name: 'Delete Memory cycle topology?' })
    .getByRole('button', { name: 'Delete' }).click();
  await expect(projectButton).not.toContainText('Memory cycle topology');
  await expect(page.locator('.react-flow__renderer')).toBeVisible();
  await expect(page.locator('.react-flow__node-network')).toHaveCount(baselineNodeCount);
}

test('bounds retained heap across repeated Studio lifecycle workflows', async ({ context, page }) => {
  test.setTimeout(240_000);
  const imported = createStarterProject({ id: 'memory-cycle-project', name: 'Memory cycle topology' });
  const archive = encodeStudioProjectArchive(imported);
  const sampleJson = JSON.stringify(Array.from({ length: 300 }, (_, index) => ({
    labels: { node_id: 'node-1' }, metric: 'node_health', value: index % 2
  })));

  await page.goto('/');
  await page.getByTestId('palette-router').click();
  const baselineNodeCount = await page.locator('.react-flow__node-network').count();
  expect(baselineNodeCount).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  const cdp = await context.newCDPSession(page);

  await runLifecycleCycle(page, archive, sampleJson, baselineNodeCount);
  const baselineBytes = await retainedHeapBytes(page, cdp);
  const retainedBytes: number[] = [];
  for (let cycle = 0; cycle < budgets.budgets.browser.memory.cycles; cycle += 1) {
    await runLifecycleCycle(page, archive, sampleJson, baselineNodeCount);
    retainedBytes.push(await retainedHeapBytes(page, cdp));
  }

  const growthBytes = retainedBytes.map((value) => value - baselineBytes);
  const maximumRetainedGrowthBytes = Math.max(0, ...growthBytes);
  const finalRetainedGrowthBytes = growthBytes.at(-1) || 0;
  await writeBrowserReport('memory.json', {
    baselineBytes,
    cycles: budgets.budgets.browser.memory.cycles,
    finalRetainedGrowthBytes,
    growthBytes,
    maximumRetainedGrowthBytes,
    retainedBytes
  });
  expect(maximumRetainedGrowthBytes).toBeLessThan(budgets.budgets.browser.memory.maxRetainedGrowthBytes);
});
