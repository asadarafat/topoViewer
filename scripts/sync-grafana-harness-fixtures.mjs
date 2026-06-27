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
const content = renderGrafanaHarnessFixturesModule(repoRoot);

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, content);
console.log(`Synced Grafana harness fixtures: ${path.relative(repoRoot, target)}`);
