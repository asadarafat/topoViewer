#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { createDenseTopology, createRegionalDenseTopology, DEFAULT_DENSE_SIZES } from './dense-fixture.mjs';

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseSizes() {
  const raw = argValue('--nodes') || argValue('--sizes');
  if (!raw) return DEFAULT_DENSE_SIZES;
  return raw.split(',').map((value) => Number(value.trim())).filter(Boolean);
}

function outputPath(template, nodes) {
  const target = template || '.artifacts/dense-fixtures/topology-{nodes}.yaml';
  const resolved = target.includes('{nodes}')
    ? target.replaceAll('{nodes}', String(nodes))
    : fs.existsSync(target) && fs.statSync(target).isDirectory()
      ? path.join(target, `topology-${nodes}.yaml`)
      : target;
  return path.resolve(resolved);
}

function profileName() {
  return argValue('--profile') || 'flat';
}

function numberArg(name, fallback) {
  const value = argValue(name);
  return value === undefined ? fallback : Number(value);
}

function writeDocument(filePath, document) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = filePath.endsWith('.json')
    ? `${JSON.stringify(document, null, 2)}\n`
    : yaml.dump(document, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(filePath, text);
}

const output = argValue('--output');
const outputDir = argValue('--output-dir');
const profile = profileName();
const sizes = parseSizes();

if (profile === 'regional') {
  const regional = createRegionalDenseTopology({
    regions: numberArg('--regions', 3),
    ringsPerRegion: numberArg('--rings-per-region', 10),
    edgeNodesPerRing: numberArg('--edge-nodes-per-ring', 8),
    aggregationNodesPerRing: numberArg('--aggregation-nodes-per-ring', 2),
    peRoutersPerRegion: numberArg('--pe-routers-per-region', 4)
  });

  if (outputDir) {
    const targetDir = path.resolve(outputDir);
    writeDocument(path.join(targetDir, 'topology.yaml'), regional.topology);
    writeDocument(path.join(targetDir, 'stylesheet.yaml'), regional.stylesheet);
    console.log(`wrote regional dense fixture: ${path.relative(process.cwd(), targetDir)}`);
  } else {
    const filePath = outputPath(output || '.artifacts/dense-fixtures/regional-topology.yaml', regional.topology.graph.nodes.length);
    writeDocument(filePath, {
      ...regional.topology,
      ...regional.stylesheet
    });
    console.log(`wrote regional dense topology fixture: ${path.relative(process.cwd(), filePath)} (${regional.topology.graph.nodes.length} nodes)`);
  }
} else {
  sizes.forEach((nodes) => {
    const document = createDenseTopology({ nodes });
    const filePath = outputPath(output, nodes);
    writeDocument(filePath, document);
    console.log(`wrote dense topology fixture: ${path.relative(process.cwd(), filePath)} (${nodes} nodes)`);
  });
}
