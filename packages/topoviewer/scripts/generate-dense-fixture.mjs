#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { createDenseTopology, DEFAULT_DENSE_SIZES } from './dense-fixture.mjs';

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

function writeDocument(filePath, document) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = filePath.endsWith('.json')
    ? `${JSON.stringify(document, null, 2)}\n`
    : yaml.dump(document, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(filePath, text);
}

const output = argValue('--output');
const sizes = parseSizes();

sizes.forEach((nodes) => {
  const document = createDenseTopology({ nodes });
  const filePath = outputPath(output, nodes);
  writeDocument(filePath, document);
  console.log(`wrote dense topology fixture: ${path.relative(process.cwd(), filePath)} (${nodes} nodes)`);
});
