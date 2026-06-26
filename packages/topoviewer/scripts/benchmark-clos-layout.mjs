#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createSyntheticClosDocument } from './synthetic-clos-fixture.mjs';

const { computeLayoutPositions } = await import('../dist/topoviewer.mjs');

const SMOKE_THRESHOLDS_MS = {
  generation: 250,
  layoutMedian: 2000,
  layoutMax: 4000,
  totalMedian: 2200
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

function numberArg(name, fallback) {
  const value = argValue(name);
  return value === undefined ? fallback : Number(value);
}

function measure(fn) {
  const start = performance.now();
  const result = fn();
  return {
    result,
    ms: Number((performance.now() - start).toFixed(3))
  };
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio));
  return Number(sorted[index].toFixed(3));
}

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function stageMeans(positions, expectedStageById) {
  const totals = new Map();
  Object.entries(expectedStageById).forEach(([id, stage]) => {
    const position = positions.get(id);
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
      throw new Error(`CLOS benchmark produced missing or invalid position for ${id}.`);
    }
    const item = totals.get(stage) || { count: 0, y: 0 };
    item.count += 1;
    item.y += position.y;
    totals.set(stage, item);
  });

  return [...totals.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([stage, item]) => ({ stage: Number(stage), meanY: item.y / item.count }));
}

function assertStageOrdering(positions, document) {
  const expectedStageById = document.metadata.expectedStageById;
  if (positions.size !== document.graph.nodes.length) {
    throw new Error(`CLOS benchmark produced ${positions.size} positions for ${document.graph.nodes.length} nodes.`);
  }

  const means = stageMeans(positions, expectedStageById);
  for (let index = 1; index < means.length; index += 1) {
    if (!(means[index - 1].meanY < means[index].meanY)) {
      throw new Error(`CLOS benchmark stage ${means[index - 1].stage} was not above stage ${means[index].stage}.`);
    }
  }
}

function benchmark(nodes) {
  const stages = numberArg('--stages', 5);
  const groupsPerStage = numberArg('--groups-per-stage', 8);
  const fanout = numberArg('--fanout', 2);
  const rounds = Math.max(1, numberArg('--rounds', 5));
  const warmupRounds = Math.max(0, numberArg('--warmup-rounds', 1));

  const generated = measure(() => createSyntheticClosDocument({ nodes, stages, groupsPerStage, fanout }));
  const document = generated.result;
  const layout = document.layout;
  const graph = document.graph;

  for (let index = 0; index < warmupRounds; index += 1) {
    computeLayoutPositions(graph.nodes, graph.links, layout);
  }

  const layoutTimings = [];
  let lastPositions = new Map();
  for (let index = 0; index < rounds; index += 1) {
    const measured = measure(() => computeLayoutPositions(graph.nodes, graph.links, layout));
    layoutTimings.push(measured.ms);
    lastPositions = measured.result;
  }
  assertStageOrdering(lastPositions, document);

  const summary = {
    fixture: {
      nodes: graph.nodes.length,
      links: graph.links.length,
      stages: document.metadata.stageCount,
      stageCounts: document.metadata.stageCounts,
      groupsPerStage: document.metadata.groupsPerStage,
      fanout: document.metadata.fanout
    },
    timingsMs: {
      generation: generated.ms,
      layoutMin: percentile(layoutTimings, 0),
      layoutMedian: percentile(layoutTimings, 0.5),
      layoutP95: percentile(layoutTimings, 0.95),
      layoutMax: percentile(layoutTimings, 1),
      layoutAverage: average(layoutTimings),
      totalMedian: Number((generated.ms + percentile(layoutTimings, 0.5)).toFixed(3))
    },
    rounds,
    warmupRounds,
    output: {
      layoutPositions: lastPositions.size
    }
  };

  return summary;
}

function assertSmoke(result) {
  const failures = [
    ['generation', result.timingsMs.generation, SMOKE_THRESHOLDS_MS.generation],
    ['layoutMedian', result.timingsMs.layoutMedian, SMOKE_THRESHOLDS_MS.layoutMedian],
    ['layoutMax', result.timingsMs.layoutMax, SMOKE_THRESHOLDS_MS.layoutMax],
    ['totalMedian', result.timingsMs.totalMedian, SMOKE_THRESHOLDS_MS.totalMedian]
  ]
    .filter(([_key, value, threshold]) => value > threshold)
    .map(([key, value, threshold]) => `${key} ${value}ms > ${threshold}ms`);

  if (failures.length) {
    throw new Error(`CLOS layout smoke benchmark exceeded thresholds: ${failures.join('; ')}`);
  }
}

const results = parseSizes().map((nodes) => {
  const result = benchmark(nodes);
  if (hasFlag('--assert-smoke')) assertSmoke(result);
  console.log(
    `CLOS layout benchmark ${nodes} nodes: median=${result.timingsMs.layoutMedian}ms max=${result.timingsMs.layoutMax}ms links=${result.fixture.links}`
  );
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
  console.log(`wrote CLOS layout benchmark report: ${path.relative(process.cwd(), filePath)}`);
}
