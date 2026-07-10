import { expect, test } from '@playwright/test';
import {
  budgets,
  expectBrowserSeriesWithinBudget,
  startBrowserResponsivenessCollection,
  stopBrowserResponsivenessCollection,
  summarizeBrowserSamples,
  writeBrowserReport
} from './browserBenchmark';

test('keeps maximum-cardinality mapper analysis in a responsive worker path', async ({ page }) => {
  const samples = Array.from(
    { length: budgets.budgets.browser.mapper.maximumCardinalitySamples },
    (_, index) => ({
      labels: { node_id: index % 2 === 0 ? 'leaf1' : 'leaf2' },
      metric: 'health',
      value: index % 2
    })
  );
  const json = JSON.stringify(samples);
  const completionSamples: number[] = [];
  const frameSamples: number[] = [];
  const longTaskDurations: number[] = [];
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;

  for (let index = 0; index < iterations; index += 1) {
    await page.goto('./?__studio-test-state=mapper-coverage');
    await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
    const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
    const sampleWorkspace = workspace.getByRole('region', { name: 'Local telemetry samples' });
    await sampleWorkspace.getByRole('textbox', { name: 'Sample JSON' }).fill(json);
    await startBrowserResponsivenessCollection(page);
    const started = await page.evaluate(() => performance.now());
    await sampleWorkspace.getByRole('button', { name: 'Analyze samples' }).click();
    const workerStatus = workspace.locator('[data-analysis-mode="worker"]');
    await expect(workerStatus).toContainText('Analyzed off the main thread', { timeout: 10_000 });
    const completed = await page.evaluate(() => performance.now());
    const responsiveness = await stopBrowserResponsivenessCollection(page);
    await expect(sampleWorkspace).toContainText(`${samples.length} samples`);
    if (index >= budgets.sampling.warmupIterations) {
      completionSamples.push(completed - started);
      frameSamples.push(...responsiveness.frames);
      longTaskDurations.push(...responsiveness.longTasks);
    }
  }

  const completion = summarizeBrowserSamples(completionSamples);
  const frames = summarizeBrowserSamples(frameSamples);
  const maximumLongTask = Math.max(0, ...longTaskDurations);
  const failures: string[] = [];
  try {
    expectBrowserSeriesWithinBudget(
      completion,
      budgets.budgets.browser.mapper.workerCompletionMs,
      'maximum-cardinality mapper worker completion'
    );
    expectBrowserSeriesWithinBudget(
      frames,
      budgets.budgets.browser.mapper.p95FrameMs,
      'maximum-cardinality mapper frames'
    );
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  if (frames.p95 >= budgets.budgets.browser.mapper.p95FrameMs) {
    failures.push(
      `Mapper p95 frame ${frames.p95.toFixed(2)} ms exceeds ${budgets.budgets.browser.mapper.p95FrameMs} ms.`
    );
  }
  if (maximumLongTask >= budgets.budgets.browser.mapper.maximumLongTaskMs) {
    failures.push(
      `Mapper maximum long task ${maximumLongTask.toFixed(2)} ms exceeds `
      + `${budgets.budgets.browser.mapper.maximumLongTaskMs} ms.`
    );
  }

  await writeBrowserReport('mapper-worker.json', {
    completion,
    frames,
    longTaskDurations,
    maximumLongTask,
    sampleCount: samples.length
  });
  expect(failures).toEqual([]);
});
