import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

type PerformanceBudgets = typeof import('../../performance-budgets.json');

const budgets = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../performance-budgets.json', import.meta.url)),
  'utf8'
)) as PerformanceBudgets;
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
  frames: number[];
  longTasks: number[];
}

export async function collectBrowserGarbage(page: Page) {
  await page.evaluate(() => {
    const collect = (globalThis as typeof globalThis & { gc?: () => void }).gc;
    collect?.();
  });
  await page.waitForTimeout(0);
}

export async function startBrowserResponsivenessCollection(page: Page) {
  await page.evaluate(() => {
    const state = {
      active: true,
      frames: [] as number[],
      lastFrame: 0,
      longTasks: [] as number[],
      observer: undefined as PerformanceObserver | undefined
    };
    try {
      state.observer = new PerformanceObserver((list) => {
        state.longTasks.push(...list.getEntries().map((entry) => entry.duration));
      });
      state.observer.observe({ entryTypes: ['longtask'] });
    } catch {
      // Frame timing remains authoritative when Long Task observation is unavailable.
    }
    const tick = (time: number) => {
      if (state.lastFrame > 0) state.frames.push(time - state.lastFrame);
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
    const state = (window as typeof window & {
      __topoviewerResponsiveness?: {
        active: boolean;
        frames: number[];
        longTasks: number[];
        observer?: PerformanceObserver;
      };
    }).__topoviewerResponsiveness;
    if (!state) return { frames: [], longTasks: [] };
    state.active = false;
    state.observer?.disconnect();
    return { frames: state.frames, longTasks: state.longTasks };
  });
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

export function summarizeBrowserSamples(samples: number[]): BrowserBenchmarkSeries {
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance = samples.reduce((total, value) => total + ((value - mean) ** 2), 0) / samples.length;
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
  options: { allowSingleBoundedOutlier?: boolean } = {}
): void {
  if (series.median >= limitMs) throw new Error(`${label} median ${series.median.toFixed(2)} ms exceeds ${limitMs} ms.`);
  if (series.median < budgets.sampling.fastMetricFloorMs) {
    const range = series.maximum - series.minimum;
    if (range > budgets.sampling.maxFastMetricRangeMs) {
      throw new Error(`${label} range ${range.toFixed(2)} ms exceeds the fast-metric variance budget.`);
    }
    return;
  }
  if (series.coefficientOfVariation > budgets.sampling.maxCoefficientOfVariation) {
    if (options.allowSingleBoundedOutlier && series.maximum < limitMs && series.samples.length >= 5) {
      const maximumIndex = series.samples.indexOf(series.maximum);
      const trimmed = summarizeBrowserSamples(series.samples.filter((_, index) => index !== maximumIndex));
      if (trimmed.coefficientOfVariation <= budgets.sampling.maxCoefficientOfVariation) return;
    }
    throw new Error(
      `${label} coefficient of variation ${series.coefficientOfVariation.toFixed(3)} exceeds `
      + `${budgets.sampling.maxCoefficientOfVariation}.`
    );
  }
}

export async function writeBrowserReport(
  fileName: string,
  metrics: Record<string, unknown>
): Promise<void> {
  const configuredRoot = process.env.TOPOVIEWER_PERFORMANCE_OUTPUT;
  const outputRoot = configuredRoot
    ? path.resolve(repoRoot, configuredRoot)
    : path.join(repoRoot, '.artifacts/topoviewer-studio/performance/current');
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, fileName), `${JSON.stringify({
    budgetVersion: budgets.schemaVersion,
    capturedAt: new Date().toISOString(),
    metrics,
    sampling: budgets.sampling
  }, null, 2)}\n`);
}

export { budgets };
