import { expect, test, type Locator, type Page } from '@playwright/test';
import { budgets, collectBrowserGarbage, expectBrowserSeriesWithinBudget, startBrowserResponsivenessCollection, stopBrowserResponsivenessCollection, summarizeBrowserSamples, writeBrowserReport, zoomDenseCanvasAroundTarget } from './browserBenchmark';

async function stableBoundingBox(locator: Locator) {
  let current = await locator.boundingBox();
  let stableSamples = 0;
  await expect
    .poll(
      async () => {
        const next = await locator.boundingBox();
        if (!current || !next) {
          current = next;
          stableSamples = 0;
          return stableSamples;
        }
        const delta = Math.max(
          Math.abs(next.x - current.x),
          Math.abs(next.y - current.y),
          Math.abs(next.width - current.width),
          Math.abs(next.height - current.height)
        );
        current = next;
        stableSamples = delta < 0.5 ? stableSamples + 1 : 0;
        return stableSamples;
      },
      { intervals: [50], timeout: 5_000 }
    )
    .toBeGreaterThanOrEqual(2);
  if (!current) throw new Error('Drag target has no stable bounding box.');
  return current;
}

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
  if (nodes >= 100) {
    await expect(page.getByTestId('studio-canvas')).toHaveAttribute('data-viewport-culling', 'true');
  }
  return visible;
}

async function unobscuredDragNodeId(page: Page) {
  const id = await page.locator('.react-flow__node').evaluateAll((nodes) => {
    for (const candidate of nodes) {
      if (!(candidate instanceof HTMLElement)) continue;
      const surface = candidate.querySelector<HTMLElement>('.topoviewer-node-icon');
      if (!surface) continue;
      const box = surface.getBoundingClientRect();
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

const dragReport: Record<string, unknown> = {};
const dragFixtures = [
  { links: 1, nodes: 2 },
  { links: 250, nodes: 100 },
  { links: 2500, nodes: 1000 }
];

for (const fixture of dragFixtures) {
  test(`profiles the ${fixture.nodes}-node drag path with helper lines and commit snap`, async ({ page }) => {
    test.setTimeout(fixture.nodes >= 1000 ? 360_000 : 120_000);
    const failures: string[] = [];
    const renderSamples: number[] = [];
    let visibleCardinality = { edges: 0, nodes: 0 };
    const fixtureSampling = fixture.nodes >= 1000 ? budgets.sampling.denseGraph : budgets.sampling;
    const iterations = fixtureSampling.warmupIterations + fixtureSampling.sampleIterations;
    for (let index = 0; index < iterations; index += 1) {
      await page.goto(`./?__studio-test-state=performance-${fixture.nodes}`);
      visibleCardinality = await waitForFixture(page, fixture.nodes, fixture.links);
      await page.waitForFunction(() => performance.getEntriesByName('topoviewer-studio-graph-visible').length > 0);
      const renderedAt = await page.evaluate(() => performance.getEntriesByName('topoviewer-studio-graph-visible').at(-1)?.startTime || performance.now());
      if (index >= fixtureSampling.warmupIterations) renderSamples.push(renderedAt);
    }

    const frameSamples: number[] = [];
    const gestureFrameP95Samples: number[] = [];
    const commitSamples: number[] = [];
    const longTaskCounts: number[] = [];
    const longTaskDurations: number[] = [];
    const longTaskPhases: Array<{ duration: number; phase: string }> = [];
    const dragVisibleCardinality = fixture.nodes >= 100
      ? await zoomDenseCanvasAroundTarget(
          page,
          page.locator('.react-flow__node[data-id="dense-1"] .topoviewer-node-icon'),
          fixture.nodes
        )
      : visibleCardinality;
    await page.evaluate(() => {
      const benchmarkWindow = window as typeof window & {
        __topoviewerHelperLineObserved?: boolean;
        __topoviewerHelperLineObserver?: MutationObserver;
      };
      benchmarkWindow.__topoviewerHelperLineObserved = false;
      benchmarkWindow.__topoviewerHelperLineObserver?.disconnect();
      const root = document.querySelector('.topoviewer-helper-lines');
      if (!root) throw new Error('Helper-line overlay is not mounted.');
      const observe = () => {
        if (root.querySelector('.topoviewer-helper-line')) {
          benchmarkWindow.__topoviewerHelperLineObserved = true;
        }
      };
      const observer = new MutationObserver(observe);
      observer.observe(root, { attributes: true, childList: true, subtree: true });
      benchmarkWindow.__topoviewerHelperLineObserver = observer;
      observe();
    });
    await stableBoundingBox(page.locator('.react-flow__node[data-id="dense-1"]'));
    const dragTargetId = await unobscuredDragNodeId(page);
    const node = page.locator(`.react-flow__node[data-id="${dragTargetId}"]`);
    const dragSurface = node.locator('.topoviewer-node-icon');
    const dragIterations = fixtureSampling.warmupIterations + fixtureSampling.sampleIterations;
    for (let sample = 0; sample < dragIterations; sample += 1) {
      const box = await stableBoundingBox(dragSurface);
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const hitPath = await page.evaluate(({ x, y }) => {
        const path: string[] = [];
        let current = document.elementFromPoint(x, y);
        while (current && path.length < 6) {
          path.push(`${current.tagName.toLowerCase()}.${String(current.className || '').replace(/\s+/g, '.')}`);
          current = current.parentElement;
        }
        return path;
      }, center);
      const direction = sample % 2 === 0 ? 1 : -1;
      await page.evaluate(() => performance.clearMarks('topoviewer-studio-drag-commit'));
      await collectBrowserGarbage(page);
      await startBrowserResponsivenessCollection(page);
      const gestureStarted = await page.evaluate(() => performance.now());
      await page.mouse.move(center.x, center.y);
      await page.mouse.down();
      const pointerDownCompleted = await page.evaluate(() => performance.now());
      for (let step = 1; step <= 36; step += 1) {
        const alignmentStep = Math.min(step, 12);
        const releaseStep = Math.max(0, step - 12);
        const x = center.x + direction * (alignmentStep * 0.25 + releaseStep * 2.5);
        const y = center.y + direction * (alignmentStep * 0.4 + releaseStep * 3);
        await page.mouse.move(x, y);
        // Match the reference runner's 60 Hz paint cadence. Faster CDP round-trips
        // measure automation scheduling rather than a browser-renderable gesture.
        await page.waitForTimeout(16);
      }
      expect(await page.evaluate(() => performance.getEntriesByName('topoviewer-studio-drag-commit'))).toHaveLength(0);
      const previewBox = await dragSurface.boundingBox();
      const pointerUpStarted = await page.evaluate(() => performance.now());
      await page.mouse.up();
      try {
        await page.waitForFunction(() => performance.getEntriesByName('topoviewer-studio-drag-commit').length === 1, undefined, { timeout: 5_000 });
      } catch {
        const finalBox = await dragSurface.boundingBox();
        throw new Error(
          `${fixture.nodes}-node drag did not commit for ${dragTargetId}; ` +
          `start=${JSON.stringify(box)}, preview=${JSON.stringify(previewBox)}, final=${JSON.stringify(finalBox)}, ` +
          `hit=${JSON.stringify(hitPath)}`
        );
      }
      const committedAt = await page.evaluate(() => performance.getEntriesByName('topoviewer-studio-drag-commit')[0].startTime);
      const frameResult = await stopBrowserResponsivenessCollection(page);
      const gestureLongTasks = frameResult.longTasks.filter((duration) => duration > 50);
      if (sample >= fixtureSampling.warmupIterations) {
        frameSamples.push(...frameResult.frames);
        gestureFrameP95Samples.push(summarizeBrowserSamples(frameResult.frames).p95);
        commitSamples.push(committedAt - pointerUpStarted);
        longTaskCounts.push(gestureLongTasks.length);
        longTaskDurations.push(...gestureLongTasks);
        longTaskPhases.push(...frameResult.longTaskEntries
          .filter((entry) => entry.duration > 50 && entry.startTime >= gestureStarted)
          .map((entry) => ({
            duration: entry.duration,
            phase: entry.startTime < pointerDownCompleted
              ? 'pointer-down'
              : entry.startTime < pointerUpStarted
                ? 'pointer-move'
                : entry.startTime < committedAt
                  ? 'pointer-up-before-commit'
                  : 'post-commit'
          })));
      }
      await expect(node).toBeVisible();
      const finalBox = await dragSurface.boundingBox();
      if (!finalBox) throw new Error(`${fixture.nodes}-node drag target disappeared after movement.`);
      expect(Math.hypot(finalBox.x - box.x, finalBox.y - box.y)).toBeGreaterThan(2);
      await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
    }
    const helperLineObserved = await page.evaluate(() => {
      const benchmarkWindow = window as typeof window & {
        __topoviewerHelperLineObserved?: boolean;
        __topoviewerHelperLineObserver?: MutationObserver;
      };
      benchmarkWindow.__topoviewerHelperLineObserver?.disconnect();
      return benchmarkWindow.__topoviewerHelperLineObserved === true;
    });

    const render = summarizeBrowserSamples(renderSamples);
    const frames = summarizeBrowserSamples(frameSamples);
    const gestureFrameP95 = summarizeBrowserSamples(gestureFrameP95Samples);
    const commit = summarizeBrowserSamples(commitSamples);
    dragReport[String(fixture.nodes)] = {
      commit,
      frames,
      gestureFrameP95,
      helperLineObserved,
      longTaskCounts,
      longTaskDurations,
      longTaskPhases,
      render,
      sourceCardinality: fixture,
      dragTargetId,
      dragVisibleCardinality,
      visibleCardinality
    };
    await writeBrowserReport('drag.json', dragReport);
    if (!helperLineObserved) failures.push(`${fixture.nodes}-node drag did not exercise helper lines.`);
    try {
      expectBrowserSeriesWithinBudget(render, budgets.budgets.browser.denseRenderMs[String(fixture.nodes) as keyof typeof budgets.budgets.browser.denseRenderMs], `${fixture.nodes}-node render`);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    const frameBudget = budgets.budgets.browser.drag.p95FrameMs[String(fixture.nodes) as keyof typeof budgets.budgets.browser.drag.p95FrameMs];
    if (gestureFrameP95.median >= frameBudget) {
      failures.push(
        `${fixture.nodes}-node drag median gesture p95 frame ${gestureFrameP95.median.toFixed(2)} ms ` +
        `exceeds ${frameBudget} ms.`
      );
    }
    try {
      expectBrowserSeriesWithinBudget(
        commit,
        budgets.budgets.browser.drag.commitMs,
        `${fixture.nodes}-node drag commit`,
        { maximumRangeMs: budgets.budgets.browser.drag.commitRangeMs }
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    const maximumLongTasks = Math.max(...longTaskCounts);
    if (maximumLongTasks > budgets.budgets.browser.drag.longTasksAbove50Ms) {
      failures.push(`${fixture.nodes}-node drag recorded ${maximumLongTasks} long tasks; ` + `budget is ${budgets.budgets.browser.drag.longTasksAbove50Ms}.`);
    }
    const maximumLongTaskDuration = Math.max(0, ...longTaskDurations);
    if (maximumLongTaskDuration >= budgets.budgets.browser.drag.maximumLongTaskMs) {
      failures.push(`${fixture.nodes}-node drag recorded a ${maximumLongTaskDuration.toFixed(2)} ms long task; ` + `budget is ${budgets.budgets.browser.drag.maximumLongTaskMs} ms.`);
    }
    expect(failures).toEqual([]);
  });
}

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
  expectBrowserSeriesWithinBudget(dropToVisible, budgets.budgets.browser.dropToVisibleMs, 'drop-to-visible', { allowSingleBoundedOutlier: true });
});
