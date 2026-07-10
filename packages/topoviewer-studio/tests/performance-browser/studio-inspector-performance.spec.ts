import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  budgets,
  expectBrowserSeriesWithinBudget,
  summarizeBrowserSamples,
  writeBrowserReport
} from './browserBenchmark';

let metricSequence = 0;

async function timed(page: Page, target: Locator, eventName: string, operation: () => Promise<void>) {
  const element = await target.elementHandle();
  if (!element) throw new Error('Inspector benchmark target is not available.');
  const key = `__topoviewerInspectorMetric${metricSequence++}`;
  await page.evaluate(({ benchmarkTarget, browserEvent, resultKey }) => {
    const metrics = window as unknown as Record<string, unknown>;
    delete metrics[resultKey];
    benchmarkTarget.addEventListener(browserEvent, () => {
      const started = performance.now();
      requestAnimationFrame(() => {
        metrics[resultKey] = performance.now() - started;
      });
    }, { capture: true, once: true });
  }, { benchmarkTarget: element, browserEvent: eventName, resultKey: key });
  await operation();
  await page.waitForFunction((resultKey) => (
    typeof (window as unknown as Record<string, unknown>)[resultKey] === 'number'
  ), key);
  return page.evaluate((resultKey) => {
    const metrics = window as unknown as Record<string, unknown>;
    const duration = Number(metrics[resultKey]);
    delete metrics[resultKey];
    return duration;
  }, key);
}

async function sampled(operation: (index: number) => Promise<number>) {
  const values: number[] = [];
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
  for (let index = 0; index < iterations; index += 1) {
    const value = await operation(index);
    if (index >= budgets.sampling.warmupIterations) values.push(value);
  }
  return summarizeBrowserSamples(values);
}

test('profiles complete Basic and All Inspector forms', async ({ page }) => {
  await page.goto('./?__studio-test-state=performance-2');
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  const nodeOne = page.locator('.react-flow__node[data-id="dense-1"]');
  const nodeTwo = page.locator('.react-flow__node[data-id="dense-2"]');
  await expect(nodeOne).toBeVisible();
  await nodeOne.click();
  await inspector.getByRole('tab', { name: 'Styles' }).click();

  const renderCount = async () => Number(await inspector.getAttribute('data-render-count'));
  const fieldContainer = inspector.locator('.studio-generated-fields');
  const profileCounts: Record<string, number> = {};
  for (const name of ['Basic', 'All'] as const) {
    await inspector.getByRole('tab', { name }).click();
    profileCounts[name.toLowerCase()] = Number(await fieldContainer.getAttribute('data-field-count'));
  }
  expect(profileCounts.basic).toBeGreaterThan(0);
  expect(profileCounts.all).toBeGreaterThanOrEqual(profileCounts.basic);

  const initialRenders = await renderCount();
  let interactionCount = 0;
  const measureTab = async (targetName: 'Basic' | 'All', resetName: 'Basic' | 'All') => {
    const target = inspector.getByRole('tab', { name: targetName });
    const reset = inspector.getByRole('tab', { name: resetName });
    return sampled(async () => {
      const duration = await timed(page, target, 'click', async () => target.click());
      interactionCount += 1;
      await reset.click();
      interactionCount += 1;
      return duration;
    });
  };

  await inspector.getByRole('tab', { name: 'All' }).click();
  interactionCount += 1;
  const basic = await measureTab('Basic', 'All');
  await inspector.getByRole('tab', { name: 'Basic' }).click();
  interactionCount += 1;
  const all = await measureTab('All', 'Basic');

  await inspector.getByRole('tab', { name: 'All' }).click();
  interactionCount += 1;
  const searchbox = inspector.getByRole('searchbox', { name: 'Search style fields' });
  const search = await sampled(async () => {
    const duration = await timed(page, searchbox, 'input', async () => searchbox.fill('background color'));
    interactionCount += 1;
    await searchbox.fill('');
    interactionCount += 1;
    return duration;
  });

  const selection = await sampled(async () => {
    const duration = await timed(page, nodeTwo, 'click', async () => nodeTwo.click());
    interactionCount += 1;
    await nodeOne.click();
    interactionCount += 1;
    return duration;
  });

  await nodeTwo.click();
  interactionCount += 1;
  await searchbox.fill('background color');
  interactionCount += 1;
  const colorInput = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await expect(colorInput).toBeVisible();
  const colors = ['#2563eb', '#0d9488', '#7c3aed', '#c2410c', '#0369a1', '#4338ca', '#047857'];
  const color = await sampled(async (index) => timed(page, colorInput, 'keydown', async () => {
    await colorInput.fill(colors[index % colors.length]);
    await colorInput.press('Enter');
    interactionCount += 1;
  }));

  const finalRenders = await renderCount();
  const renderMetrics = {
    delta: finalRenders - initialRenders,
    final: finalRenders,
    initial: initialRenders,
    interactions: interactionCount,
    perInteraction: (finalRenders - initialRenders) / interactionCount
  };
  const interactions = { all, basic, color, search, selection };
  const failures: string[] = [];
  for (const [name, series] of Object.entries(interactions)) {
    try {
      expectBrowserSeriesWithinBudget(
        series,
        budgets.budgets.browser.inspector.interactionMedianMs,
        `Inspector ${name}`
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    if (series.maximum >= budgets.budgets.browser.inspector.hardOutlierMs) {
      failures.push(
        `Inspector ${name} maximum ${series.maximum.toFixed(2)} ms exceeds `
        + `${budgets.budgets.browser.inspector.hardOutlierMs} ms.`
      );
    }
  }
  if (renderMetrics.perInteraction > budgets.budgets.browser.inspector.rendersPerInteraction) {
    failures.push(
      `Inspector rendered ${renderMetrics.perInteraction.toFixed(2)} times per interaction; `
      + `budget is ${budgets.budgets.browser.inspector.rendersPerInteraction}.`
    );
  }

  await writeBrowserReport('inspector.json', { interactions, profileCounts, renders: renderMetrics });
  expect(failures).toEqual([]);
});
