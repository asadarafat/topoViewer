#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createDenseTopology } from './dense-fixture.mjs';

const {
  buildAttentionIndex,
  compileTopoGraph,
  computeLayoutPositions,
  resolveFocusQuery,
  validateTopoDocument
} = await import('../dist/topoviewer.mjs');

const SMOKE_THRESHOLDS_MS = {
  total: 30000,
  parse: 1500,
  validation: 3000,
  indexBuild: 3000,
  reduction: 1000,
  layout: 10000,
  firstRender: 10000,
  focusUpdate: 1500
};

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function parseSizes() {
  return (argValue('--nodes') || '1000')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Boolean);
}

function measure(fn) {
  const start = performance.now();
  const result = fn();
  return {
    result,
    ms: Number((performance.now() - start).toFixed(3))
  };
}

function pathSegments(paths) {
  return paths.reduce((total, item) => total + (Array.isArray(item.sequence) ? Math.max(0, item.sequence.length - 1) : item.parent ? 1 : 0), 0);
}

function layoutLinks(graph) {
  return [
    ...(graph.links || []),
    ...(graph.paths || []).flatMap((pathItem) => {
      if (Array.isArray(pathItem.sequence)) {
        return pathItem.sequence.slice(0, -1).map((source, index) => ({
          id: `${pathItem.id}:${index}`,
          source,
          target: pathItem.sequence[index + 1]
        }));
      }
      return pathItem.source && pathItem.target ? [{ id: pathItem.id, source: pathItem.source, target: pathItem.target }] : [];
    })
  ];
}

function deriveIdentityReduction(document, focus) {
  const graph = document.graph || {};
  return {
    nodes: graph.nodes?.length || 0,
    links: graph.links?.length || 0,
    paths: graph.paths?.length || 0,
    regions: graph.regions?.length || 0,
    focused: focus.focusedIds.size,
    related: focus.relatedIds.size,
    context: focus.contextIds.size,
    hidden: focus.hiddenIds.size
  };
}

function benchmark(nodes) {
  const fixture = createDenseTopology({ nodes });
  const fixtureText = JSON.stringify(fixture);
  const timings = {};

  const parsed = measure(() => JSON.parse(fixtureText));
  timings.parse = parsed.ms;

  const validated = measure(() => validateTopoDocument(parsed.result));
  timings.validation = validated.ms;

  const index = measure(() => buildAttentionIndex(validated.result));
  timings.indexBuild = index.ms;

  const focusQuery = {
    pathIds: ['path-0000'],
    dependency: {
      from: ['node-00000'],
      direction: 'both',
      depth: 2
    },
    mode: 'dim-context'
  };

  const focus = measure(() => resolveFocusQuery(index.result, focusQuery));
  timings.focusUpdate = focus.ms;

  const reduction = measure(() => deriveIdentityReduction(validated.result, focus.result));
  timings.reduction = reduction.ms;

  const layoutIterations = Number(argValue('--layout-iterations') || 12);
  const layout = measure(() => computeLayoutPositions(
    validated.result.graph?.nodes || [],
    layoutLinks(validated.result.graph || {}),
    { mode: 'force', iterations: layoutIterations, width: 3600, height: Math.max(1200, Math.ceil(nodes / 50) * 60) }
  ));
  timings.layout = layout.ms;

  const firstRender = measure(() => compileTopoGraph(validated.result, ['physical'], {}, { mode: 'manual' }));
  timings.firstRender = firstRender.ms;
  timings.total = Number(Object.values(timings).reduce((total, value) => total + value, 0).toFixed(3));

  const graph = validated.result.graph || {};
  return {
    fixture: {
      nodes: graph.nodes?.length || 0,
      links: graph.links?.length || 0,
      paths: graph.paths?.length || 0,
      regions: graph.regions?.length || 0,
      pathSegments: pathSegments(graph.paths || [])
    },
    timingsMs: timings,
    reduction: reduction.result,
    output: {
      compiledNodes: firstRender.result.nodes.length,
      compiledEdges: firstRender.result.edges.length,
      layoutPositions: layout.result.size
    }
  };
}

function assertSmoke(result) {
  const failures = Object.entries(SMOKE_THRESHOLDS_MS)
    .filter(([key, threshold]) => (result.timingsMs[key] || 0) > threshold)
    .map(([key, threshold]) => `${key} ${result.timingsMs[key]}ms > ${threshold}ms`);
  if (failures.length) {
    throw new Error(`Dense attention smoke benchmark exceeded thresholds: ${failures.join('; ')}`);
  }
}

const results = parseSizes().map((nodes) => {
  const result = benchmark(nodes);
  if (hasFlag('--assert-smoke')) assertSmoke(result);
  console.log(`attention benchmark ${nodes} nodes: total=${result.timingsMs.total}ms index=${result.timingsMs.indexBuild}ms focus=${result.timingsMs.focusUpdate}ms`);
  return result;
});

const report = {
  generatedAt: new Date().toISOString(),
  thresholdsMs: hasFlag('--assert-smoke') ? SMOKE_THRESHOLDS_MS : undefined,
  results
};

const output = argValue('--output');
if (output) {
  const filePath = path.resolve(output);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`wrote attention benchmark report: ${path.relative(process.cwd(), filePath)}`);
}
