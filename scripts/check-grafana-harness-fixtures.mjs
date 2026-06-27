#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  grafanaGeneratedFixturePath,
  renderGrafanaHarnessFixturesModule,
  repoRootFromScripts
} from './lib/grafana-harness-fixtures.mjs';

const repoRoot = repoRootFromScripts();
const target = grafanaGeneratedFixturePath(repoRoot);
const expected = renderGrafanaHarnessFixturesModule(repoRoot);
const actual = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

if (actual !== expected) {
  console.error(`Grafana harness fixtures are stale: ${path.relative(repoRoot, target)}`);
  console.error('Run `npm run grafana:fixtures:sync` and commit the generated file.');
  process.exit(1);
}

console.log(`Grafana harness fixtures are current: ${path.relative(repoRoot, target)}`);
