import { expect, test } from '@playwright/test';
import { budgets, collectBrowserGarbage, expectBrowserSeriesWithinBudget, startBrowserResponsivenessCollection, stopBrowserResponsivenessCollection, summarizeBrowserSamples, writeBrowserReport } from './browserBenchmark';
import { openStudioWorkspace } from '../support/workbench';

test('keeps maximum-cardinality mapper analysis in a responsive worker path', async ({ page }) => {
  const samples = Array.from({ length: budgets.budgets.browser.mapper.maximumCardinalitySamples }, (_, index) => ({
    labels: { node_id: index % 2 === 0 ? 'leaf1' : 'leaf2' },
    metric: 'health',
    value: index % 2
  }));
  const json = JSON.stringify(samples);
  const completionSamples: number[] = [];
  const frameSamples: number[] = [];
  const frameP95Samples: number[] = [];
  const longTaskDurations: number[] = [];
  const longTaskPhases: Array<{ duration: number; phase: string }> = [];
  const preActionOverlapLongTasks: number[] = [];
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;

  for (let index = 0; index < iterations; index += 1) {
    await page.goto('./?__studio-test-state=mapper-coverage');
    const workspace = await openStudioWorkspace(page, 'Mapper');
    await workspace.getByRole('tablist', { name: 'Mapper visual sections' }).getByRole('tab', { name: 'Coverage' }).click();
    const sampleWorkspace = workspace.getByRole('region', { name: 'Local telemetry samples' });
    await sampleWorkspace.getByRole('textbox', { name: 'Sample JSON' }).fill(json);
    // Keep this interaction benchmark independent from garbage left by prior
    // dense fixtures. The lifecycle memory gate owns retained-heap detection.
    await collectBrowserGarbage(page);
    await page.evaluate(() => {
      performance.clearMarks('topoviewer-studio-mapper-action');
      performance.clearMarks('topoviewer-studio-mapper-analysis-scheduled');
      performance.clearMarks('topoviewer-studio-mapper-analysis-posted');
      performance.clearMarks('topoviewer-studio-mapper-worker-response');
    });
    await startBrowserResponsivenessCollection(page);
    const analyzeButton = sampleWorkspace.getByRole('button', { name: 'Analyze samples' });
    const button = await analyzeButton.elementHandle();
    if (!button) throw new Error('Mapper analysis button is unavailable.');
    await page.evaluate((target) => {
      target.addEventListener('click', () => performance.mark('topoviewer-studio-mapper-action'), {
        capture: true,
        once: true
      });
    }, button);
    await analyzeButton.click();
    const workerStatus = workspace.locator('[data-analysis-mode="worker"]');
    await expect(workerStatus).toContainText('Analyzed off the main thread', { timeout: 10_000 });
    const completed = await page.evaluate(() => performance.now());
    const responsiveness = await stopBrowserResponsivenessCollection(page);
    const phases = await page.evaluate(() => ({
      action: performance.getEntriesByName('topoviewer-studio-mapper-action').at(-1)?.startTime,
      posted: performance.getEntriesByName('topoviewer-studio-mapper-analysis-posted').at(-1)?.startTime,
      response: performance.getEntriesByName('topoviewer-studio-mapper-worker-response').at(-1)?.startTime,
      scheduled: performance.getEntriesByName('topoviewer-studio-mapper-analysis-scheduled').at(-1)?.startTime
    }));
    if (phases.action === undefined) throw new Error('Mapper analysis action mark was not recorded.');
    const action = phases.action;
    const interactionFrames = responsiveness.frameEntries
      .filter((entry) => entry.startTime >= action)
      .map((entry) => entry.duration);
    const interactionLongTasks = responsiveness.longTaskEntries.filter(
      (entry) => entry.startTime >= action
    );
    const overlappingLongTasks = responsiveness.longTaskEntries.filter(
      (entry) => entry.startTime < action && entry.startTime + entry.duration >= action
    );
    await expect(sampleWorkspace).toContainText(`${samples.length} samples`);
    if (index >= budgets.sampling.warmupIterations) {
      completionSamples.push(completed - action);
      frameSamples.push(...interactionFrames);
      frameP95Samples.push(summarizeBrowserSamples(interactionFrames).p95);
      longTaskDurations.push(...interactionLongTasks.map((entry) => entry.duration));
      preActionOverlapLongTasks.push(...overlappingLongTasks.map((entry) => entry.duration));
      longTaskPhases.push(...interactionLongTasks.map((entry) => ({
        duration: entry.duration,
        phase: entry.startTime < (phases.scheduled || completed)
            ? 'event-dispatch'
            : entry.startTime < (phases.posted || completed)
              ? 'request-scheduling'
              : entry.startTime < (phases.response || completed)
                ? 'worker-wait'
                : 'result-render'
      })));
    }
  }

  const completion = summarizeBrowserSamples(completionSamples);
  const frames = summarizeBrowserSamples(frameSamples);
  const frameP95 = summarizeBrowserSamples(frameP95Samples);
  const frameBudgetExceedanceCount = frameP95.samples.filter(
    (value) => value >= budgets.budgets.browser.mapper.p95FrameMs
  ).length;
  const maximumLongTask = Math.max(0, ...longTaskDurations);
  const failures: string[] = [];
  try {
    expectBrowserSeriesWithinBudget(completion, budgets.budgets.browser.mapper.workerCompletionMs, 'maximum-cardinality mapper worker completion');
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  if (frames.p95 >= budgets.budgets.browser.mapper.p95FrameMs) {
    failures.push(`Mapper pooled p95 frame ${frames.p95.toFixed(2)} ms exceeds ${budgets.budgets.browser.mapper.p95FrameMs} ms.`);
  }
  if (frameP95.median >= budgets.budgets.browser.mapper.p95FrameMs) {
    failures.push(`Mapper median p95 frame ${frameP95.median.toFixed(2)} ms exceeds ${budgets.budgets.browser.mapper.p95FrameMs} ms.`);
  }
  if (frameBudgetExceedanceCount > 1) {
    failures.push(`Mapper recorded ${frameBudgetExceedanceCount} per-run p95 frame budget exceedances; budget permits one.`);
  }
  if (maximumLongTask >= budgets.budgets.browser.mapper.maximumLongTaskMs) {
    failures.push(`Mapper maximum long task ${maximumLongTask.toFixed(2)} ms exceeds ` + `${budgets.budgets.browser.mapper.maximumLongTaskMs} ms.`);
  }

  await writeBrowserReport('mapper-worker.json', {
    completion,
    frameBudgetExceedanceCount,
    frameP95,
    frames,
    longTaskDurations,
    longTaskPhases,
    maximumLongTask,
    preActionOverlapLongTasks,
    sampleCount: samples.length
  });
  expect(failures).toEqual([]);
});
