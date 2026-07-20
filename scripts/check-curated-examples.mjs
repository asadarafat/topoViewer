#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplesRoot = path.join(repoRoot, 'packages/topoviewer/content/examples');

const curatedExamples = [
  'graph/basic',
  'authoring/clos-2spine-4leaf',
  'nodes/icon-fit-and-badges',
  'edges/directional-link-strokes',
  'attention/object-focus',
  'integration/real-network-underlay',
  'integration/real-network-bgp',
  'integration/real-network-transport-layer',
  'integration/real-network-service-path',
  'integration/real-network-failure-view'
];

const colorKeyPattern = /(?:color|fill|stroke)$/i;
const safeColorPattern = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\(--[\w-]+(?:\s*,\s*[^()<>]+)?\)|transparent|currentColor)$/i;

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function isUnsafeImageReference(value) {
  return typeof value === 'string' && (/^javascript:/i.test(value.trim()) || /^data:image\/svg\+xml/i.test(value.trim()));
}

function styleEntries(document) {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  const entityStyles = [
    ...(graph.nodes || []).map((entity) => ['graph.nodes', entity.style]),
    ...(graph.links || []).map((entity) => ['graph.links', entity.style]),
    ...(graph.paths || []).map((entity) => ['graph.paths', entity.style]),
    ...(graph.regions || []).map((entity) => ['graph.regions', entity.style]),
    ...(diagram.shapes || []).map((entity) => ['diagram.shapes', entity.style]),
    ...(diagram.callouts || []).flatMap((entity) => [
      ['diagram.callouts.style', entity.style],
      ['diagram.callouts.leader', entity.leader]
    ]),
    ...(diagram.texts || []).map((entity) => ['diagram.texts', entity.style]),
    ...(document.stylesheet || []).map((rule, index) => [`stylesheet[${index}]`, rule.style])
  ];
  return entityStyles.filter(([, style]) => style && typeof style === 'object');
}

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function checkStyle(pathLabel, style) {
  const shape = style.shape;
  const width = numberValue(style.width);
  const height = numberValue(style.height);
  if ((shape === 'square' || shape === 'circle') && width !== undefined && height !== undefined && width !== height) {
    fail(`${pathLabel}: shape ${shape} must use equal width and height; got ${width}x${height}.`);
  }
  if ((style.icon || style.iconFit || style.iconPadding !== undefined) && (width !== undefined || height !== undefined)) {
    if (width !== undefined && width <= 0) fail(`${pathLabel}: node/icon width must be positive.`);
    if (height !== undefined && height <= 0) fail(`${pathLabel}: node/icon height must be positive.`);
  }
  Object.entries(style).forEach(([key, value]) => {
    if (!colorKeyPattern.test(key)) return;
    if (typeof value !== 'string') return;
    if (!safeColorPattern.test(value.trim())) {
      fail(`${pathLabel}.${key}: color-like value must be an explicit color or CSS variable, got ${JSON.stringify(value)}.`);
    }
  });
}

function checkGraphReferences(exampleId, document) {
  const graph = document.graph || {};
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  const regionIds = new Set((graph.regions || []).map((region) => region.id));

  (graph.links || []).forEach((link) => {
    if (!nodeIds.has(link.source)) fail(`${exampleId}: link ${link.id} source ${link.source} does not exist.`);
    if (!nodeIds.has(link.target)) fail(`${exampleId}: link ${link.id} target ${link.target} does not exist.`);
  });

  (graph.paths || []).forEach((topologyPath) => {
    (topologyPath.sequence || []).forEach((nodeId) => {
      if (!nodeIds.has(nodeId)) fail(`${exampleId}: path ${topologyPath.id} sequence node ${nodeId} does not exist.`);
    });
    if (topologyPath.source && !nodeIds.has(topologyPath.source)) fail(`${exampleId}: path ${topologyPath.id} source ${topologyPath.source} does not exist.`);
    if (topologyPath.target && !nodeIds.has(topologyPath.target)) fail(`${exampleId}: path ${topologyPath.id} target ${topologyPath.target} does not exist.`);
  });

  (graph.regions || []).forEach((region) => {
    (region.members || []).forEach((member) => {
      if (!nodeIds.has(member) && !regionIds.has(member)) fail(`${exampleId}: region ${region.id} member ${member} does not exist.`);
    });
    if ((region.members || []).length && region.paddingY !== undefined && Number(region.paddingY) < 24) {
      fail(`${exampleId}: region ${region.id} paddingY should be at least 24px to reduce label/member overlap.`);
    }
  });
}

function checkIcons(exampleId, document) {
  Object.entries(document.icons || {}).forEach(([key, icon]) => {
    if (isUnsafeImageReference(icon.src)) fail(`${exampleId}: icon ${key} uses unsafe src ${icon.src}.`);
    if (typeof icon.svg === 'string' && /<script|foreignObject|\son[a-z]+\s*=|javascript:/i.test(icon.svg)) {
      fail(`${exampleId}: icon ${key} contains active SVG content; curated examples must use sanitized-safe SVG.`);
    }
  });
}

for (const exampleId of curatedExamples) {
  const topologyFile = path.join(examplesRoot, exampleId, 'topology.yaml');
  const stylesheetFile = path.join(examplesRoot, exampleId, 'stylesheet.yaml');
  if (!fs.existsSync(topologyFile)) fail(`${exampleId}: missing topology.yaml.`);
  if (!fs.existsSync(stylesheetFile)) fail(`${exampleId}: missing stylesheet.yaml.`);
  if (!fs.existsSync(topologyFile) || !fs.existsSync(stylesheetFile)) continue;

  const topology = readYaml(topologyFile);
  const stylesheet = readYaml(stylesheetFile);
  const document = {
    ...topology,
    ...stylesheet,
    graph: topology.graph || {},
    diagram: topology.diagram || {},
    toggles: topology.toggles || stylesheet.toggles || []
  };

  checkGraphReferences(exampleId, document);
  checkIcons(exampleId, document);
  styleEntries(document).forEach(([pathLabel, style]) => checkStyle(`${exampleId}:${pathLabel}`, style));
}

if (process.exitCode) {
  console.error('curated example audit failed');
  process.exit(process.exitCode);
}

console.log(`curated example audit passed for ${curatedExamples.length} examples`);
