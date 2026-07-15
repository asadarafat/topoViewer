import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  budgets,
  expectBrowserSeriesWithinBudget,
  summarizeBrowserSamples,
  writeBrowserReport
} from './browserBenchmark';
import { openStyleWorkspace } from '../support/basicStyle';

let metricSequence = 0;

async function timed(page: Page, target: Locator, eventName: string, operation: () => Promise<void>) {
  const element = await target.elementHandle();
  if (!element) throw new Error('Basic style benchmark target is not available.');
  const key = `__topoviewerBasicStyleMetric${metricSequence++}`;
  await page.evaluate(({ benchmarkTarget, browserEvent, resultKey }) => {
    const metrics = window as unknown as Record<string, unknown>;
    delete metrics[resultKey];
    benchmarkTarget.addEventListener(browserEvent, () => {
      const started = performance.now();
      requestAnimationFrame(() => { metrics[resultKey] = performance.now() - started; });
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

async function sampledCandidateCommit(
  page: Page,
  footer: Locator,
  operation: (index: number) => Promise<number>
) {
  const interactionValues: number[] = [];
  const settlementValues: number[] = [];
  const iterations = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
  for (let index = 0; index < iterations; index += 1) {
    const started = await page.evaluate(() => performance.now());
    const interaction = await operation(index);
    await expect(footer).not.toHaveAttribute('data-status', 'validating', { timeout: 10_000 });
    const settled = await page.evaluate((start) => performance.now() - start, started);
    if (index >= budgets.sampling.warmupIterations) {
      interactionValues.push(interaction);
      settlementValues.push(settled);
    }
  }
  return {
    interaction: summarizeBrowserSamples(interactionValues),
    settlement: summarizeBrowserSamples(settlementValues)
  };
}

test('profiles Basic grouping, search, selection, and candidate commits', async ({ page }) => {
  await page.goto('./?__studio-test-state=performance-1000');
  const nodeOne = page.locator('.react-flow__node[data-id="dense-1"]');
  const nodeTwo = page.locator('.react-flow__node[data-id="dense-2"]');
  await expect(nodeOne).toBeVisible();
  await nodeOne.click();
  const workspace = await openStyleWorkspace(page);
  const basic = workspace.locator('.studio-basic-style-editor');
  await expect(basic).toBeVisible();

  const renderCount = async () => Number(await basic.getAttribute('data-render-count'));
  const fieldCounts = {
    available: Number(await basic.getAttribute('data-field-count')),
    rendered: Number(await basic.getAttribute('data-rendered-field-count'))
  };
  expect(fieldCounts.available).toBeGreaterThan(0);
  expect(fieldCounts.rendered).toBeGreaterThan(0);
  expect(fieldCounts.rendered).toBeLessThanOrEqual(fieldCounts.available);

  const initialRenders = await renderCount();
  let interactionCount = 0;
  const firstGroup = basic.locator('.MuiAccordionSummary-root').first();
  const group = await sampled(async () => {
    const duration = await timed(page, firstGroup, 'click', async () => firstGroup.click());
    interactionCount += 1;
    await firstGroup.click();
    interactionCount += 1;
    return duration;
  });

  const searchbox = basic.getByRole('searchbox', { name: 'Search Basic style fields' });
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

  await searchbox.fill('background color');
  interactionCount += 1;
  const colorInput = basic.locator('[data-field-path="backgroundColor"] input[type="text"]');
  const footer = workspace.locator('.studio-style-candidate-footer');
  const colors = ['#2563eb', '#0d9488', '#7c3aed', '#c2410c', '#0369a1', '#4338ca', '#047857'];
  const candidateCommit = await sampledCandidateCommit(page, footer, async (index) => timed(page, colorInput, 'keydown', async () => {
    await colorInput.fill(colors[index % colors.length]);
    await colorInput.press('Enter');
    interactionCount += 1;
  }));
  const color = candidateCommit.interaction;

  const finalRenders = await renderCount();
  const renderMetrics = {
    delta: finalRenders - initialRenders,
    final: finalRenders,
    initial: initialRenders,
    interactions: interactionCount,
    perInteraction: (finalRenders - initialRenders) / interactionCount
  };
  const interactions = { color, group, search, selection };
  const failures: string[] = [];
  for (const [name, series] of Object.entries(interactions)) {
    try {
      expectBrowserSeriesWithinBudget(
        series,
        budgets.budgets.browser.inspector.interactionMedianMs,
        `Basic style ${name}`,
        { allowSingleBoundedOutlier: true }
      );
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
    if (series.maximum >= budgets.budgets.browser.inspector.hardOutlierMs) {
      failures.push(
        `Basic style ${name} maximum ${series.maximum.toFixed(2)} ms exceeds `
        + `${budgets.budgets.browser.inspector.hardOutlierMs} ms.`
      );
    }
  }
  try {
    expectBrowserSeriesWithinBudget(
      candidateCommit.settlement,
      budgets.budgets.browser.inspector.candidateSettleMedianMs,
      'Basic style candidate settlement'
    );
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  if (candidateCommit.settlement.maximum >= budgets.budgets.browser.inspector.candidateSettleHardOutlierMs) {
    failures.push(
      `Basic style candidate settlement maximum ${candidateCommit.settlement.maximum.toFixed(2)} ms exceeds `
      + `${budgets.budgets.browser.inspector.candidateSettleHardOutlierMs} ms.`
    );
  }
  if (renderMetrics.perInteraction > budgets.budgets.browser.inspector.rendersPerInteraction) {
    failures.push(
      `Basic style rendered ${renderMetrics.perInteraction.toFixed(2)} times per interaction; `
      + `budget is ${budgets.budgets.browser.inspector.rendersPerInteraction}.`
    );
  }

  await writeBrowserReport('inspector.json', {
    candidateSettlement: candidateCommit.settlement,
    fieldCounts,
    interactions,
    renders: renderMetrics
  });
  expect(failures).toEqual([]);
});
