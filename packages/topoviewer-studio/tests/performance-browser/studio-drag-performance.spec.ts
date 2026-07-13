import { expect, test, type Page } from '@playwright/test';
import {
  budgets,
  collectBrowserGarbage,
  expectBrowserSeriesWithinBudget,
  startBrowserResponsivenessCollection,
  stopBrowserResponsivenessCollection,
  summarizeBrowserSamples,
  writeBrowserReport
} from './browserBenchmark';

async function waitForFixture(page: Page, nodes: number, links: number) {
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByText(`Dense topology (${nodes} nodes, ${links} links)`)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.react-flow__node[data-id="dense-1"]')).toBeVisible({ timeout: 30_000 });
  const visible = {
    edges: await page.locator('.react-flow__edge').count(),
    labels: await page.locator('.topoviewer-label-overlay').count(),
    nodes: await page.locator('.react-flow__node').count()
  };
  expect(visible.nodes).toBeGreaterThan(0);
  expect(visible.nodes).toBeLessThanOrEqual(nodes);
  expect(visible.edges).toBeLessThanOrEqual(links);
  if (nodes >= 500) {
    expect(visible.nodes, 'dense projects must retain viewport culling at startup').toBeLessThan(nodes);
    expect(visible.edges, 'dense projects must retain viewport culling at startup').toBeLessThan(links);
  }
  return visible;
}

async function unobscuredDragNodeId(page: Page) {
  const id = await page.locator('.react-flow__node').evaluateAll((nodes) => {
    for (const candidate of nodes) {
      if (!(candidate instanceof HTMLElement)) continue;
      const box = candidate.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) continue;
      const center = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const hit = document.elementFromPoint(center.x, center.y);
      if (hit && candidate.contains(hit)) return candidate.dataset.id;
    }
    return undefined;
  });
  if (!id) throw new Error('Dense fixture has no unobscured drag target.');
  return id;
}

test('profiles 2, 100, and 1,000 node drag paths with helper lines and commit snap', async ({ page }) => {
  const report: Record<string, unknown> = {};
  const failures: string[] = [];
  const fixtures = [
    { links: 1, nodes: 2 },
    { links: 250, nodes: 100 },
    { links: 2500, nodes: 1000 }
  ];

  for (const fixture of fixtures) {
    const renderSamples: number[] = [];
    let visibleCardinality = { edges: 0, nodes: 0 };
    const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
    for (let index = 0; index < iterations; index += 1) {
      await page.goto(`./?__studio-test-state=performance-${fixture.nodes}`);
      visibleCardinality = await waitForFixture(page, fixture.nodes, fixture.links);
      await page.waitForFunction(() => performance.getEntriesByName('topoviewer-studio-graph-visible').length > 0);
      const renderedAt = await page.evaluate(() => (
        performance.getEntriesByName('topoviewer-studio-graph-visible').at(-1)?.startTime || performance.now()
      ));
      if (index >= budgets.sampling.warmupIterations) renderSamples.push(renderedAt);
    }

    const frameSamples: number[] = [];
    const commitSamples: number[] = [];
    const longTaskCounts: number[] = [];
    const longTaskDurations: number[] = [];
    let helperLineObserved = false;
    const dragTargetId = await unobscuredDragNodeId(page);
    const node = page.locator(`.react-flow__node[data-id="${dragTargetId}"]`);
    const dragIterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
    for (let sample = 0; sample < dragIterations; sample += 1) {
      const box = await node.boundingBox();
      if (!box) throw new Error(`${fixture.nodes}-node drag target is not measurable.`);
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const direction = sample % 2 === 0 ? 1 : -1;
      await page.evaluate(() => performance.clearMarks('topoviewer-studio-drag-commit'));
      await collectBrowserGarbage(page);
      await startBrowserResponsivenessCollection(page);
      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      for (let step = 1; step <= 36; step += 1) {
        const alignmentStep = Math.min(step, 12);
        const releaseStep = Math.max(0, step - 12);
        const x = center.x + direction * (alignmentStep * 0.25 + releaseStep * 2.5);
        const y = center.y + direction * (alignmentStep * 0.4 + releaseStep * 3);
        await page.mouse.move(x, y);
        if (step === 2 || step === 12 || step === 24) {
          helperLineObserved ||= await page.locator('.topoviewer-helper-line').count() > 0;
        }
        await page.waitForTimeout(8);
      }
      expect(await page.evaluate(() => performance.getEntriesByName('topoviewer-studio-drag-commit'))).toHaveLength(0);
      const pointerUpStarted = await page.evaluate(() => performance.now());
      await page.mouse.up();
      await page.waitForFunction(() => performance.getEntriesByName('topoviewer-studio-drag-commit').length === 1);
      const committedAt = await page.evaluate(() => (
        performance.getEntriesByName('topoviewer-studio-drag-commit')[0].startTime
      ));
      const frameResult = await stopBrowserResponsivenessCollection(page);
      const gestureLongTasks = frameResult.longTasks.filter((duration) => duration > 50);
      if (sample >= budgets.sampling.warmupIterations) {
        frameSamples.push(...frameResult.frames);
        commitSamples.push(committedAt - pointerUpStarted);
        longTaskCounts.push(gestureLongTasks.length);
        longTaskDurations.push(...gestureLongTasks);
      }
      await expect(node).toBeVisible();
      const finalBox = await node.boundingBox();
      if (!finalBox) throw new Error(`${fixture.nodes}-node drag target disappeared after movement.`);
      expect(Math.hypot(finalBox.x - box.x, finalBox.y - box.y)).toBeGreaterThan(2);
      await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
    }

    const render = summarizeBrowserSamples(renderSamples);
    const frames = summarizeBrowserSamples(frameSamples);
    const commit = summarizeBrowserSamples(commitSamples);
    report[String(fixture.nodes)] = {
      commit,
      frames,
      helperLineObserved,
      longTaskCounts,
      longTaskDurations,
      render,
      sourceCardinality: fixture,
      dragTargetId,
      visibleCardinality
    };
    if (!helperLineObserved) failures.push(`${fixture.nodes}-node drag did not exercise helper lines.`);
    try {
      expectBrowserSeriesWithinBudget(
        render,
        budgets.budgets.browser.denseRenderMs[String(fixture.nodes) as keyof typeof budgets.budgets.browser.denseRenderMs],
        `${fixture.nodes}-node render`
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    const frameBudget = budgets.budgets.browser.drag.p95FrameMs[
      String(fixture.nodes) as keyof typeof budgets.budgets.browser.drag.p95FrameMs
    ];
    if (frames.p95 >= frameBudget) {
      failures.push(`${fixture.nodes}-node drag p95 frame ${frames.p95.toFixed(2)} ms exceeds ${frameBudget} ms.`);
    }
    try {
      expectBrowserSeriesWithinBudget(commit, budgets.budgets.browser.drag.commitMs, `${fixture.nodes}-node drag commit`);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    const maximumLongTasks = Math.max(...longTaskCounts);
    if (maximumLongTasks > budgets.budgets.browser.drag.longTasksAbove50Ms) {
      failures.push(
        `${fixture.nodes}-node drag recorded ${maximumLongTasks} long tasks; `
        + `budget is ${budgets.budgets.browser.drag.longTasksAbove50Ms}.`
      );
    }
    const maximumLongTaskDuration = Math.max(0, ...longTaskDurations);
    if (maximumLongTaskDuration >= budgets.budgets.browser.drag.maximumLongTaskMs) {
      failures.push(
        `${fixture.nodes}-node drag recorded a ${maximumLongTaskDuration.toFixed(2)} ms long task; `
        + `budget is ${budgets.budgets.browser.drag.maximumLongTaskMs} ms.`
      );
    }
  }

  await writeBrowserReport('drag.json', report);
  expect(failures).toEqual([]);
});

test('keeps palette drop-to-visible within the interaction budget', async ({ page }) => {
  const samples: number[] = [];
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
  for (let index = 0; index < iterations; index += 1) {
    await page.goto('./');
    await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
    await collectBrowserGarbage(page);
    await page.getByTestId('palette-router').dragTo(page.getByTestId('studio-canvas'), {
      targetPosition: { x: 320, y: 240 }
    });
    await page.waitForFunction(() => performance.getEntriesByName('topoviewer-studio-drop-visible').length === 1);
    const duration = await page.evaluate(() => {
      const start = performance.getEntriesByName('topoviewer-studio-drop-start')[0].startTime;
      const visible = performance.getEntriesByName('topoviewer-studio-drop-visible')[0].startTime;
      return visible - start;
    });
    if (index >= budgets.sampling.warmupIterations) samples.push(duration);
  }
  const dropToVisible = summarizeBrowserSamples(samples);
  await writeBrowserReport('drop.json', { dropToVisible });
  expectBrowserSeriesWithinBudget(
    dropToVisible,
    budgets.budgets.browser.dropToVisibleMs,
    'drop-to-visible',
    { allowSingleBoundedOutlier: true }
  );
});
