import { describe, expect, it } from 'vitest';
import { expectSeriesWithinBudget, type BenchmarkSeries } from '../performance/benchmark';
import { expectBrowserSeriesWithinBudget } from '../performance-browser/browserBenchmark';

function series(samples: number[]): BenchmarkSeries {
  const sorted = [...samples].sort((left, right) => left - right);
  const mean = samples.reduce((total, value) => total + value, 0) / samples.length;
  const variance = samples.reduce((total, value) => total + (value - mean) ** 2, 0) / samples.length;
  return {
    coefficientOfVariation: Math.sqrt(variance) / mean,
    maximum: sorted.at(-1) as number,
    median: sorted[Math.floor(sorted.length / 2)],
    minimum: sorted[0],
    p95: sorted.at(-1) as number,
    samples
  };
}

describe('performance benchmark variance policy', () => {
  it('requires explicit handling for a single allocation outlier', () => {
    const measured = series([507, 167, 168, 164, 163, 168, 170]);
    expect(() => expectSeriesWithinBudget(measured, 1000, 'dense projection')).toThrow(/coefficient of variation/);
    expect(() => expectSeriesWithinBudget(measured, 1000, 'dense projection', { allowSingleBoundedOutlier: true })).not.toThrow();
  });

  it('never waives an outlier that exceeds the absolute budget', () => {
    const measured = series([1200, 167, 168, 164, 163, 168, 170]);
    expect(() => expectSeriesWithinBudget(measured, 1000, 'dense projection', { allowSingleBoundedOutlier: true })).toThrow();
  });

  it('applies the same explicit bounded-outlier policy to browser metrics', () => {
    const measured = series([47, 17, 16, 17, 18, 16, 17]);
    expect(() => expectBrowserSeriesWithinBudget(measured, 100, 'drop-to-visible')).toThrow(/coefficient of variation/);
    expect(() => expectBrowserSeriesWithinBudget(measured, 100, 'drop-to-visible', { allowSingleBoundedOutlier: true })).not.toThrow();
  });
});
