import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import budgets from '../../performance-budgets.json';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export interface BenchmarkSeries {
  coefficientOfVariation: number;
  maximum: number;
  median: number;
  minimum: number;
  p95: number;
  samples: number[];
}

export interface BenchmarkReport {
  budgetVersion: number;
  capturedAt: string;
  environment: {
    architecture: string;
    node: string;
    platform: string;
  };
  metrics: Record<string, BenchmarkSeries>;
  sampling: typeof budgets.sampling;
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

function summarize(samples: number[]): BenchmarkSeries {
  const median = percentile(samples, 0.5);
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance = samples.reduce((total, value) => total + (value - mean) ** 2, 0) / samples.length;
  return {
    coefficientOfVariation: mean === 0 ? 0 : Math.sqrt(variance) / mean,
    maximum: Math.max(...samples),
    median,
    minimum: Math.min(...samples),
    p95: percentile(samples, 0.95),
    samples
  };
}

export function benchmark(operation: () => unknown, operationsPerSample = 1): BenchmarkSeries {
  if (!Number.isInteger(operationsPerSample) || operationsPerSample < 1) {
    throw new Error('operationsPerSample must be a positive integer.');
  }
  for (let index = 0; index < budgets.sampling.warmupIterations; index += 1) operation();
  const samples = Array.from({ length: budgets.sampling.sampleIterations }, () => {
    const started = performance.now();
    operation();
    return (performance.now() - started) / operationsPerSample;
  });
  return summarize(samples);
}

export function expectSeriesWithinBudget(series: BenchmarkSeries, limitMs: number, label: string, options: { allowSingleBoundedOutlier?: boolean } = {}): void {
  if (series.median >= limitMs) {
    throw new Error(`${label} median ${series.median.toFixed(2)} ms exceeds ${limitMs} ms.`);
  }
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
      const trimmed = summarize(series.samples.filter((_, index) => index !== maximumIndex));
      if (trimmed.coefficientOfVariation <= budgets.sampling.maxCoefficientOfVariation) return;
    }
    throw new Error(`${label} coefficient of variation ${series.coefficientOfVariation.toFixed(3)} exceeds ` + `${budgets.sampling.maxCoefficientOfVariation}.`);
  }
}

export function writeBenchmarkReport(fileName: string, metrics: Record<string, BenchmarkSeries>): void {
  const configuredRoot = process.env.TOPOVIEWER_PERFORMANCE_OUTPUT;
  const outputRoot = configuredRoot ? path.resolve(repoRoot, configuredRoot) : path.join(repoRoot, '.artifacts/topoviewer-studio/performance/current');
  const report: BenchmarkReport = {
    budgetVersion: budgets.schemaVersion,
    capturedAt: new Date().toISOString(),
    environment: {
      architecture: process.arch,
      node: process.version,
      platform: process.platform
    },
    metrics,
    sampling: budgets.sampling
  };
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(path.join(outputRoot, fileName), `${JSON.stringify(report, null, 2)}\n`);
}

export { budgets };
