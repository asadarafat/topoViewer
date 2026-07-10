import { expect, test } from '@playwright/test';
import {
  budgets,
  expectBrowserSeriesWithinBudget,
  summarizeBrowserSamples,
  writeBrowserReport
} from './browserBenchmark';

test('keeps startup bounded and heavy workspaces outside the initial request path', async ({ page }) => {
  const samples: number[] = [];
  const resourceNames = new Set<string>();
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
  for (let index = 0; index < iterations; index += 1) {
    await page.goto('./');
    await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
    const result = await page.evaluate(() => ({
      ready: performance.getEntriesByName('topoviewer-studio-canvas-ready').at(-1)?.startTime || performance.now(),
      resources: performance.getEntriesByType('resource').map((entry) => entry.name)
    }));
    if (index >= budgets.sampling.warmupIterations) samples.push(result.ready);
    result.resources.forEach((name) => resourceNames.add(name));
  }
  const startup = summarizeBrowserSamples(samples);
  const forbiddenInitialResources = [...resourceNames].filter((name) => (
    /MonacoYamlEditor|editor\.api|MapperWorkspace|ExportPanel|html2canvas|projectArchive/.test(name)
  ));
  expect(forbiddenInitialResources).toEqual([]);
  expectBrowserSeriesWithinBudget(startup, budgets.budgets.browser.startupMs, 'startup');
  await writeBrowserReport('startup.json', {
    forbiddenInitialResources,
    initialResourceCount: resourceNames.size,
    startup
  });
});
