#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, 'packages/topoviewer-studio/performance-budgets.json');
const outputRoot = path.join(repoRoot, '.artifacts/topoviewer-studio/performance');
const runArgument = process.argv.indexOf('--runs');
const runCount = runArgument >= 0 ? Number(process.argv[runArgument + 1]) : 3;
if (!Number.isInteger(runCount) || runCount < 2) throw new Error('--runs must be an integer of at least 2.');
const budgets = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
const expectedReports = [
  'bundle.json',
  'commands.json',
  'drag.json',
  'drop.json',
  'inspector.json',
  'mapper-worker.json',
  'mapper.json',
  'memory.json',
  'session.json',
  'startup.json'
];

for (let index = 1; index <= runCount; index += 1) {
  const relativeOutput = `.artifacts/topoviewer-studio/performance/run${index}`;
  const absoluteOutput = path.join(repoRoot, relativeOutput);
  fs.rmSync(absoluteOutput, { force: true, recursive: true });
  const env = { ...process.env, TOPOVIEWER_PERFORMANCE_OUTPUT: relativeOutput };
  run('npm', ['--workspace', 'topoviewer-studio', 'run', 'benchmark:unit'], env, `unit performance run ${index}`);
  run('npm', ['--workspace', 'topoviewer-studio', 'run', 'benchmark:browser'], env, `browser performance run ${index}`);
  run('npm', ['run', 'studio:benchmark:bundle'], env, `bundle performance run ${index}`);
}

const perRun = Array.from({ length: runCount }, (_, index) => {
  const directory = path.join(outputRoot, `run${index + 1}`);
  return Object.fromEntries(expectedReports.map((fileName) => {
    const filePath = path.join(directory, fileName);
    if (!fs.existsSync(filePath)) throw new Error(`Performance run ${index + 1} is missing ${fileName}.`);
    return [fileName.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(filePath, 'utf8'))];
  }));
});

const flattened = perRun.map((reports) => {
  const values = {};
  for (const [reportName, report] of Object.entries(reports)) {
    flattenNumbers(report.metrics || report.surfaces || {}, reportName, values);
  }
  return values;
});
const allKeys = [...new Set(flattened.flatMap((values) => Object.keys(values)))].sort();
const missing = allKeys.flatMap((key) => flattened.flatMap((values, index) => (
  values[key] === undefined ? [`run${index + 1}:${key}`] : []
)));
if (missing.length) throw new Error(`Cross-run metrics are incomplete: ${missing.join(', ')}`);

const metrics = Object.fromEntries(allKeys.map((key) => [
  key,
  summarize(flattened.map((values) => values[key]))
]));
const failures = Object.entries(metrics).flatMap(([key, series]) => {
  if (!key.endsWith('.median')) return [];
  if (series.median < budgets.sampling.fastMetricFloorMs) {
    const range = series.maximum - series.minimum;
    return range > budgets.sampling.maxFastMetricRangeMs
      ? [`${key} cross-run range ${range.toFixed(2)} exceeds ${budgets.sampling.maxFastMetricRangeMs} ms.`]
      : [];
  }
  return series.coefficientOfVariation > budgets.sampling.maxCoefficientOfVariation
    ? [
        `${key} cross-run coefficient of variation ${series.coefficientOfVariation.toFixed(3)} exceeds `
        + `${budgets.sampling.maxCoefficientOfVariation}.`
      ]
    : [];
});
const summary = {
  budgetVersion: budgets.schemaVersion,
  capturedAt: new Date().toISOString(),
  failures,
  metrics,
  runCount
};
fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, 'repeat-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Studio performance suite completed ${runCount} times with ${allKeys.length} cross-run metrics.`);
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function run(command, args, env, label) {
  console.log(`\n# ${label}`);
  const result = spawnSync(command, args, { cwd: repoRoot, env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

function flattenNumbers(value, prefix, output) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    output[prefix] = value;
    return;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, nested] of Object.entries(value)) flattenNumbers(nested, `${prefix}.${key}`, output);
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const mean = values.reduce((total, value) => total + value, 0) / values.length;
  const variance = values.reduce((total, value) => total + ((value - mean) ** 2), 0) / values.length;
  return {
    coefficientOfVariation: mean === 0 ? 0 : Math.sqrt(variance) / mean,
    maximum: sorted.at(-1),
    median: sorted[Math.floor(sorted.length / 2)],
    minimum: sorted[0],
    values
  };
}
