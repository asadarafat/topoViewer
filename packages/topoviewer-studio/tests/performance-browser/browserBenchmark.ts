import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Locator, type Page } from '@playwright/test';

type PerformanceBudgets = typeof import('../../performance-budgets.json');

const budgets = JSON.parse(readFileSync(fileURLToPath(new URL('../../performance-budgets.json', import.meta.url)), 'utf8')) as PerformanceBudgets;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export interface BrowserBenchmarkSeries {
  coefficientOfVariation: number;
  maximum: number;
  median: number;
  minimum: number;
  p95: number;
  samples: number[];
}

export interface BrowserResponsivenessResult {
  frameEntries: Array<{ duration: number; startTime: number }>;
  frames: number[];
  longTasks: number[];
  longTaskEntries: Array<{ duration: number; startTime: number }>;
}

export async function zoomDenseCanvasAroundTarget(page: Page, target: Locator, sourceNodeCount: number) {
  const box = await target.boundingBox();
  if (!box) throw new Error('Dense canvas zoom target has no bounding box.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -1200);
  await expect
    .poll(() => page.locator('.react-flow__node').count(), { timeout: 10_000 })
    .toBeLessThan(sourceNodeCount);
  return {
    edges: await page.locator('.react-flow__edge').count(),
    labels: await page.locator('.topoviewer-label-overlay').count(),
    nodes: await page.locator('.react-flow__node').count()
  };
}

export async function collectBrowserGarbage(page: Page) {
  await page.evaluate(() => {
    const collect = (globalThis as typeof globalThis & { gc?: () => void }).gc;
    collect?.();
  });
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

export async function startBrowserResponsivenessCollection(page: Page) {
  await page.evaluate(() => {
    const state = {
      active: true,
      frameEntries: [] as Array<{ duration: number; startTime: number }>,
      frames: [] as number[],
      lastFrame: 0,
      longTasks: [] as number[],
      longTaskEntries: [] as Array<{ duration: number; startTime: number }>,
      observer: undefined as PerformanceObserver | undefined
    };
    try {
      state.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          state.longTasks.push(entry.duration);
          state.longTaskEntries.push({ duration: entry.duration, startTime: entry.startTime });
        });
      });
      state.observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Frame timing remains authoritative when Long Task observation is unavailable.
    }
    const tick = (time: number) => {
      if (state.lastFrame > 0) {
        const duration = time - state.lastFrame;
        state.frames.push(duration);
        state.frameEntries.push({ duration, startTime: state.lastFrame });
      }
      state.lastFrame = time;
      if (state.active) requestAnimationFrame(tick);
    };
    (window as typeof window & { __topoviewerResponsiveness?: typeof state }).__topoviewerResponsiveness = state;
    requestAnimationFrame(tick);
  });
}

export async function stopBrowserResponsivenessCollection(page: Page): Promise<BrowserResponsivenessResult> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  return page.evaluate(() => {
    const state = (
      window as typeof window & {
        __topoviewerResponsiveness?: {
          active: boolean;
          frameEntries: Array<{ duration: number; startTime: number }>;
          frames: number[];
          longTasks: number[];
          longTaskEntries: Array<{ duration: number; startTime: number }>;
          observer?: PerformanceObserver;
        };
      }
    ).__topoviewerResponsiveness;
    if (!state) return { frameEntries: [], frames: [], longTaskEntries: [], longTasks: [] };
    state.active = false;
    state.observer?.disconnect();
    return {
      frameEntries: state.frameEntries,
      frames: state.frames,
      longTaskEntries: state.longTaskEntries,
      longTasks: state.longTasks
    };
  });
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

export function summarizeBrowserSamples(samples: number[]): BrowserBenchmarkSeries {
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance = samples.reduce((total, value) => total + (value - mean) ** 2, 0) / samples.length;
  return {
    coefficientOfVariation: mean === 0 ? 0 : Math.sqrt(variance) / mean,
    maximum: Math.max(...samples),
    median: percentile(samples, 0.5),
    minimum: Math.min(...samples),
    p95: percentile(samples, 0.95),
    samples
  };
}

export function expectBrowserSeriesWithinBudget(
  series: BrowserBenchmarkSeries,
  limitMs: number,
  label: string,
  options: {
    allowSingleBoundedOutlier?: boolean;
    boundedOutlierLimitMs?: number;
    maximumRangeMs?: number;
  } = {}
): void {
  if (series.median >= limitMs) throw new Error(`${label} median ${series.median.toFixed(2)} ms exceeds ${limitMs} ms.`);
  if (options.maximumRangeMs !== undefined) {
    const range = series.maximum - series.minimum;
    if (range > options.maximumRangeMs) {
      throw new Error(`${label} range ${range.toFixed(2)} ms exceeds ${options.maximumRangeMs} ms.`);
    }
    return;
  }
  if (series.median < budgets.sampling.fastMetricFloorMs) {
    const range = series.maximum - series.minimum;
    if (range > budgets.sampling.maxFastMetricRangeMs) {
      throw new Error(`${label} range ${range.toFixed(2)} ms exceeds the fast-metric variance budget.`);
    }
    return;
  }
  if (series.coefficientOfVariation > budgets.sampling.maxCoefficientOfVariation) {
    const boundedOutlierLimit = options.boundedOutlierLimitMs ?? limitMs;
    if (
      options.allowSingleBoundedOutlier &&
      series.maximum < boundedOutlierLimit &&
      series.samples.length >= 5
    ) {
      const maximumIndex = series.samples.indexOf(series.maximum);
      const trimmed = summarizeBrowserSamples(series.samples.filter((_, index) => index !== maximumIndex));
      if (trimmed.coefficientOfVariation <= budgets.sampling.maxCoefficientOfVariation) return;
    }
    throw new Error(`${label} coefficient of variation ${series.coefficientOfVariation.toFixed(3)} exceeds ` + `${budgets.sampling.maxCoefficientOfVariation}.`);
  }
}

export async function writeBrowserReport(fileName: string, metrics: Record<string, unknown>): Promise<void> {
  const configuredRoot = process.env.TOPOVIEWER_PERFORMANCE_OUTPUT;
  const outputRoot = configuredRoot ? path.resolve(repoRoot, configuredRoot) : path.join(repoRoot, '.artifacts/topoviewer-studio/performance/current');
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, fileName),
    `${JSON.stringify(
      {
        budgetVersion: budgets.schemaVersion,
        capturedAt: new Date().toISOString(),
        metrics,
        sampling: budgets.sampling
      },
      null,
      2
    )}\n`
  );
}

export { budgets };
