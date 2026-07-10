#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const parityPath = path.join(root, 'packages/topoviewer-studio/PARITY.md');
const parityDirectory = path.dirname(parityPath);
const allowedStatuses = new Set(['Delivered', 'Intentional removal', 'Test-only']);
const failures = [];

if (!fs.existsSync(parityPath)) {
  console.error('Studio parity contract is missing: packages/topoviewer-studio/PARITY.md');
  process.exit(1);
}

const text = fs.readFileSync(parityPath, 'utf8');
const rows = text.split(/\r?\n/).filter((line) => line.startsWith('| ') && !line.startsWith('|---'));
const workflowRows = rows.slice(1);

if (workflowRows.length < 30) failures.push(`Parity contract has only ${workflowRows.length} workflow rows.`);

for (const row of workflowRows) {
  const cells = row.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== 4) {
    failures.push(`Malformed parity row: ${row}`);
    continue;
  }
  const [workflow, , evidence, status] = cells;
  if (!allowedStatuses.has(status)) failures.push(`${workflow} has unapproved status "${status}".`);
  const links = [...evidence.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  if (links.length === 0) failures.push(`${workflow} has no evidence link.`);
  for (const link of links) {
    const file = link.split('#', 1)[0];
    if (!file || /^[a-z]+:/i.test(file)) continue;
    const target = path.resolve(parityDirectory, file);
    if (!fs.existsSync(target)) failures.push(`${workflow} references missing evidence: ${file}`);
  }
}

if (failures.length > 0) {
  console.error(`Studio parity contract failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Studio parity contract passed for ${workflowRows.length} workflows.`);
