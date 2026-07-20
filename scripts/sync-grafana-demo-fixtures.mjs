#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  grafanaGeneratedFixturePath,
  renderGrafanaDemoFixturesModule,
  repoRootFromScripts
} from './lib/grafana-demo-fixtures.mjs';

const repoRoot = repoRootFromScripts();
const target = grafanaGeneratedFixturePath(repoRoot);
const content = renderGrafanaDemoFixturesModule(repoRoot);

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, content);
console.log(`Synced Grafana demo fixtures: ${path.relative(repoRoot, target)}`);
