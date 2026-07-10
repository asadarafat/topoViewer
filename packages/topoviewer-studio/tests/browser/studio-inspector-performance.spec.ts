import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

async function timed(page: Page, target: Locator, eventName: string, operation: () => Promise<void>) {
  const element = await target.elementHandle();
  if (!element) throw new Error('Inspector benchmark target is not available.');
  const key = `__topoviewerInspectorMetric${Date.now()}${Math.random()}`;
  await page.evaluate(({ benchmarkTarget, browserEvent, resultKey }) => {
    const metrics = window as unknown as Record<string, unknown>;
    metrics[resultKey] = undefined;
    benchmarkTarget.addEventListener(browserEvent, () => {
      const started = performance.now();
      requestAnimationFrame(() => {
        metrics[resultKey] = performance.now() - started;
      });
    }, { capture: true, once: true });
  }, { benchmarkTarget: element, browserEvent: eventName, resultKey: key });
  await operation();
  await page.waitForFunction((resultKey) => typeof (window as unknown as Record<string, unknown>)[resultKey] === 'number', key);
  return page.evaluate((resultKey) => {
    const metrics = window as unknown as Record<string, unknown>;
    const duration = Number(metrics[resultKey]);
    delete metrics[resultKey];
    return duration;
  }, key);
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

async function samples(operation: (index: number) => Promise<number>) {
  const values: number[] = [];
  for (let index = 0; index < 3; index += 1) values.push(await operation(index));
  return values;
}

test('keeps complete Inspector interactions within the response and render budgets', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  const renderCount = async () => Number(await inspector.getAttribute('data-render-count'));
  await inspector.getByRole('tab', { name: 'All' }).click();
  await inspector.getByRole('tab', { name: 'Basic' }).click();
  const initialRenders = await renderCount();
  const allTab = inspector.getByRole('tab', { name: 'All' });
  const allFieldsSamples = await samples(async () => {
    const duration = await timed(page, allTab, 'click', async () => allTab.click());
    await inspector.getByRole('tab', { name: 'Basic' }).click();
    return duration;
  });
  await inspector.getByRole('tab', { name: 'All' }).click();
  await expect(inspector.locator('.studio-generated-fields')).toHaveAttribute('data-field-count', /[1-9]\d*/);
  const searchbox = inspector.getByRole('searchbox', { name: 'Search style fields' });
  await searchbox.fill('background color');
  await searchbox.fill('');
  const searchSamples = await samples(async () => {
    const duration = await timed(page, searchbox, 'input', async () => searchbox.fill('background color'));
    await searchbox.fill('');
    return duration;
  });
  await searchbox.fill('background color');
  await expect(inspector.locator('[data-field-path="backgroundColor"]')).toBeVisible();
  const nodeOne = page.locator('.react-flow__node[data-id="node-1"]');
  const nodeTwo = page.locator('.react-flow__node[data-id="node-2"]');
  await nodeTwo.click();
  await nodeOne.click();
  const selectionSamples = await samples(async () => {
    const duration = await timed(page, nodeTwo, 'click', async () => nodeTwo.click());
    await nodeOne.click();
    return duration;
  });
  await nodeTwo.click();
  await expect(inspector.getByRole('textbox', { name: 'ID' })).toHaveValue('node-2');
  const colors = ['#2563eb', '#0d9488', '#7c3aed'];
  const colorSamples = await samples(async (index) => {
    const input = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
    return timed(page, input, 'keydown', async () => {
      await input.fill(colors[index]);
      await input.press('Enter');
    });
  });
  await expect(inspector.locator('[data-field-path="backgroundColor"] input[type="text"]')).toHaveValue(colors.at(-1) as string);
  const finalRenders = await renderCount();
  const allSamples = [...allFieldsSamples, ...searchSamples, ...selectionSamples, ...colorSamples];
  const measuredAndResetInteractions = allSamples.length
    + allFieldsSamples.length + searchSamples.length + selectionSamples.length
    + 3;
  const metrics = {
    milliseconds: {
      allFields: { median: median(allFieldsSamples), samples: allFieldsSamples },
      color: { median: median(colorSamples), samples: colorSamples },
      search: { median: median(searchSamples), samples: searchSamples },
      selection: { median: median(selectionSamples), samples: selectionSamples }
    },
    renders: {
      delta: finalRenders - initialRenders,
      final: finalRenders,
      initial: initialRenders,
      perInteraction: (finalRenders - initialRenders) / measuredAndResetInteractions
    },
    thresholds: { hardOutlier: 200, interactionMedian: 100, rendersPerInteraction: 6 }
  };
  const output = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/inspector-benchmark.json');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(metrics, null, 2)}\n`);
  expect(metrics.milliseconds.allFields.median).toBeLessThan(metrics.thresholds.interactionMedian);
  expect(metrics.milliseconds.search.median).toBeLessThan(metrics.thresholds.interactionMedian);
  expect(metrics.milliseconds.selection.median).toBeLessThan(metrics.thresholds.interactionMedian);
  expect(metrics.milliseconds.color.median).toBeLessThan(metrics.thresholds.interactionMedian);
  expect(Math.max(...allSamples)).toBeLessThan(metrics.thresholds.hardOutlier);
  expect(metrics.renders.perInteraction).toBeLessThanOrEqual(metrics.thresholds.rendersPerInteraction);
});
