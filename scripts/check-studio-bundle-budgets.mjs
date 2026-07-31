#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, 'packages/topoviewer-studio/performance-budgets.json');
const baselinePath = path.join(repoRoot, 'packages/topoviewer-studio/performance-bundle-baseline.json');
const args = process.argv.slice(2);
const requestedSurface = args.includes('--surface') ? args[args.indexOf('--surface') + 1] : undefined;
const budgets = readJson(budgetPath);
const configurations = {
  desktop: {
    assetRoot: 'apps/topoviewer-studio-desktop/frontend/dist',
    html: 'apps/topoviewer-studio-desktop/frontend/dist/index.html'
  },
  studio: {
    assetRoot: 'site/studio',
    html: 'site/studio/index.html'
  }
};

if (requestedSurface && !configurations[requestedSurface]) {
  throw new Error(`Unknown Studio bundle surface "${requestedSurface}".`);
}
const selected = requestedSurface
  ? { [requestedSurface]: configurations[requestedSurface] }
  : configurations;
const surfaces = Object.fromEntries(Object.entries(selected).map(([name, configuration]) => [
  name,
  inspectSurface(configuration)
]));

if (args.includes('--write-baseline')) {
  fs.writeFileSync(baselinePath, `${JSON.stringify({
    budgetVersion: budgets.schemaVersion,
    capturedAt: new Date().toISOString(),
    surfaces: Object.fromEntries(Object.entries(surfaces).map(([name, surface]) => [name, surface.metrics]))
  }, null, 2)}\n`);
}

const baseline = fs.existsSync(baselinePath) ? readJson(baselinePath) : undefined;
const report = {
  baselineVersion: baseline?.budgetVersion,
  budgetVersion: budgets.schemaVersion,
  generatedAt: new Date().toISOString(),
  surfaces: Object.fromEntries(Object.entries(surfaces).map(([name, surface]) => [name, {
    ...surface,
    delta: metricDelta(surface.metrics, baseline?.surfaces?.[name])
  }]))
};
const failures = args.includes('--check') ? budgetFailures(report, budgets, baseline) : [];
const configuredOutput = process.env.TOPOVIEWER_PERFORMANCE_OUTPUT;
if (configuredOutput) {
  const outputRoot = path.resolve(repoRoot, configuredOutput);
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, 'bundle.json'), `${JSON.stringify(report, null, 2)}\n`);
}

if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
else printReport(report);
if (failures.length) {
  console.error('\nStudio bundle budget failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function absolute(relativePath) {
  return path.join(repoRoot, relativePath);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function required(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Required bundle artifact is missing: ${relative(filePath)}`);
  return fs.readFileSync(filePath);
}

function assetReferences(html, extension) {
  if (extension === '.js') {
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js(?:[?#][^"']*)?)["'][^>]*>/g)];
    const modulePreloads = [...html.matchAll(/<link\b(?=[^>]*\brel=["']modulepreload["'])[^>]*\bhref=["']([^"']+\.js(?:[?#][^"']*)?)["'][^>]*>/g)];
    return [...scripts, ...modulePreloads].map((match) => match[1]);
  }
  return [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css(?:[?#][^"']*)?)["'][^>]*>/g)].map((match) => match[1]);
}

function resolveReference(assetRoot, reference) {
  const clean = reference.split(/[?#]/)[0];
  const assetIndex = clean.indexOf('/assets/');
  if (assetIndex >= 0) return path.join(assetRoot, clean.slice(assetIndex + 1));
  return path.join(assetRoot, clean.replace(/^\.?\/+/, ''));
}

function filesWithExtension(root, extension) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) return filesWithExtension(filePath, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [filePath] : [];
  });
}

function inspectChunks(assetRoot, html, extension) {
  const initial = new Set(assetReferences(html, extension).map((reference) => resolveReference(assetRoot, reference)));
  return filesWithExtension(path.join(assetRoot, 'assets'), extension).sort().map((filePath) => {
    const bytes = required(filePath);
    return {
      gzipBytes: gzipSync(bytes).byteLength,
      path: relative(filePath),
      role: initial.has(filePath) ? 'initial' : 'lazy'
    };
  });
}

function inspectSurface(configuration) {
  const assetRoot = absolute(configuration.assetRoot);
  const htmlPath = absolute(configuration.html);
  const html = required(htmlPath).toString('utf8');
  const js = inspectChunks(assetRoot, html, '.js');
  const css = inspectChunks(assetRoot, html, '.css');
  const initial = (chunks) => chunks.filter((chunk) => chunk.role === 'initial');
  const lazy = (chunks) => chunks.filter((chunk) => chunk.role === 'lazy');
  const sum = (chunks) => chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0);
  const largest = (chunks) => Math.max(0, ...chunks.map((chunk) => chunk.gzipBytes));
  const lazyFeatures = Object.fromEntries(
    [
      'StudioSourceWorkspace',
      'ProjectSourceNavigator',
      'MonacoYamlEditor',
      'ObjectPalette',
      'LayerControls',
      'StudioCommandPalette',
      'StudioSessionDock',
      'PropertiesWorkspace',
      'MapperWorkspace',
      'ExportPanel'
    ].map((feature) => [
      feature,
      lazy(js).some((chunk) => path.basename(chunk.path).startsWith(feature))
    ])
  );
  return {
    chunks: { css, js },
    lazyFeatures,
    metrics: {
      initialCssGzipBytes: sum(initial(css)),
      initialJsGzipBytes: sum(initial(js)),
      largestLazyJsGzipBytes: largest(lazy(js)),
      totalLazyJsGzipBytes: sum(lazy(js))
    }
  };
}

function metricDelta(current, baseline) {
  return Object.fromEntries(Object.entries(current).map(([name, value]) => {
    const previous = baseline?.[name];
    return [name, previous === undefined ? undefined : {
      bytes: value - previous,
      percent: previous === 0 ? 0 : ((value - previous) / previous) * 100
    }];
  }));
}

function budgetFailures(report, budgetConfig, baseline) {
  const failures = [];
  if (!baseline) failures.push(`Missing checked-in baseline ${relative(baselinePath)}.`);
  else if (baseline.budgetVersion !== budgetConfig.schemaVersion) {
    failures.push(`Bundle baseline version ${baseline.budgetVersion} does not match budget version ${budgetConfig.schemaVersion}.`);
  }
  for (const [name, surface] of Object.entries(report.surfaces)) {
    const limits = budgetConfig.budgets.bundle[name];
    if (!limits) {
      failures.push(`Missing bundle budgets for ${name}.`);
      continue;
    }
    for (const [metric, limit] of Object.entries(limits)) {
      const value = surface.metrics[metric];
      if (value === undefined) failures.push(`${name} does not report required metric ${metric}.`);
      else if (value > limit) failures.push(`${name} ${metric} is ${value} bytes; budget is ${limit}.`);
    }
    for (const [feature, lazy] of Object.entries(surface.lazyFeatures)) {
      if (!lazy) failures.push(`${name} ${feature} is missing or no longer isolated in a lazy JavaScript chunk.`);
    }
  }
  return failures;
}

function printReport(report) {
  console.log('# TopoViewer Studio bundle report');
  for (const [name, surface] of Object.entries(report.surfaces)) {
    console.log(`\n## ${name}`);
    for (const [metric, value] of Object.entries(surface.metrics)) {
      const delta = surface.delta[metric];
      const suffix = delta ? ` (${delta.bytes >= 0 ? '+' : ''}${delta.bytes} bytes, ${delta.percent.toFixed(2)}%)` : '';
      console.log(`${metric}: ${value} bytes${suffix}`);
    }
    console.log(`Lazy features: ${Object.entries(surface.lazyFeatures).filter(([, lazy]) => lazy).map(([feature]) => feature).join(', ')}`);
  }
}
