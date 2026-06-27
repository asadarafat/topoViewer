#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const packageRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const distRoot = path.join(packageRoot, 'dist');

function run(command, args, cwd = repoRoot) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env
  });
}

run('npm', ['--workspace', 'topoviewer', 'run', 'build:lib']);
run('webpack', ['--config', 'webpack.config.cjs'], packageRoot);

fs.copyFileSync(path.join(packageRoot, 'plugin.json'), path.join(distRoot, 'plugin.json'));
fs.mkdirSync(path.join(distRoot, 'img'), { recursive: true });
fs.copyFileSync(path.join(packageRoot, 'img/logo.svg'), path.join(distRoot, 'img/logo.svg'));

console.log(`Built Grafana TopoViewer panel: ${path.relative(repoRoot, distRoot)}`);
