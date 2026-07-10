#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repoRoot, 'packages/topoviewer');
const reportFile = path.join(packageRoot, 'api-report.md');
const writeMode = process.argv.includes('--write');
const entries = [
  {
    heading: 'Root Entry (`topoviewer`)',
    sourceFile: path.join(packageRoot, 'src/index.ts'),
    sourceLabel: 'packages/topoviewer/src/index.ts'
  },
  {
    heading: 'Integration Entry (`topoviewer/integration`)',
    sourceFile: path.join(packageRoot, 'src/integration.ts'),
    sourceLabel: 'packages/topoviewer/src/integration.ts'
  },
  {
    heading: 'Authoring Entry (`topoviewer/authoring`)',
    sourceFile: path.join(packageRoot, 'src/authoring.ts'),
    sourceLabel: 'packages/topoviewer/src/authoring.ts'
  }
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function exportedName(rawName) {
  const cleaned = rawName
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
  if (!cleaned) return undefined;
  const aliasMatch = cleaned.match(/\s+as\s+([A-Za-z0-9_$]+)$/);
  if (aliasMatch) return aliasMatch[1];
  return cleaned.replace(/^type\s+/, '').trim();
}

function collectExports(indexText) {
  const valueExports = [];
  const typeExports = [];
  const exportBlockPattern = /export\s+(type\s+)?\{\s*([\s\S]*?)\s*\}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = exportBlockPattern.exec(indexText)) !== null) {
    const isTypeExport = Boolean(match[1]);
    const source = match[3];
    for (const raw of match[2].split(',')) {
      const name = exportedName(raw);
      if (!name) continue;
      (isTypeExport ? typeExports : valueExports).push({ name, source });
    }
  }

  function sortRows(rows) {
    return rows.sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source));
  }

  return {
    valueExports: sortRows(valueExports),
    typeExports: sortRows(typeExports)
  };
}

function renderTable(rows) {
  if (rows.length === 0) return '_None._\n';
  return [
    '| Export | Source |',
    '|---|---|',
    ...rows.map((row) => `| \`${row.name}\` | \`${row.source}\` |`)
  ].join('\n') + '\n';
}

function renderEntry(entry) {
  const exports = collectExports(readText(entry.sourceFile));
  return `## ${entry.heading}

Generated from \`${entry.sourceLabel}\`.

### Value Exports

${renderTable(exports.valueExports)}

### Type Exports

${renderTable(exports.typeExports)}`;
}

function renderReport() {
  return `# TopoViewer Public API Report

Run \`npm run api:report\` after intentionally adding, removing, renaming, or
moving a public package export. The report is a public-surface tripwire; it is
not a replacement for migration notes, API docs, or compatibility tests.

${entries.map(renderEntry).join('\n\n')}
`;
}

const report = renderReport();

if (writeMode) {
  fs.writeFileSync(reportFile, report);
  console.log(`Wrote ${path.relative(repoRoot, reportFile)}`);
  process.exit(0);
}

if (!fs.existsSync(reportFile)) {
  console.error(`Missing ${path.relative(repoRoot, reportFile)}. Run npm run api:report.`);
  process.exit(1);
}

const existing = readText(reportFile);
if (existing !== report) {
  console.error(`${path.relative(repoRoot, reportFile)} is out of date.`);
  console.error('Run npm run api:report, review the public export diff, and commit it with the API change.');
  process.exit(1);
}

console.log(`${path.relative(repoRoot, reportFile)} is in sync with the public package entries`);
