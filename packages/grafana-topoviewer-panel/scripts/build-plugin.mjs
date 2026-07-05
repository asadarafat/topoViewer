#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { runGo } from './go-toolchain.mjs';

const packageRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const distRoot = path.join(packageRoot, 'dist');
const backendExecutable = 'gpx_topoviewer-panel';

function goArchForNodeArch(arch) {
  if (arch === 'arm64') return 'arm64';
  if (arch === 'x64') return 'amd64';
  return arch;
}

function run(command, args, cwd = repoRoot, extraEnv = {}) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv
    }
  });
}

run('npm', ['--workspace', 'topoviewer', 'run', 'build:lib']);
run('webpack', ['--config', 'webpack.config.cjs'], packageRoot);
const backendGoos = process.env.GRAFANA_PLUGIN_GOOS || 'linux';
const backendGoarch = process.env.GRAFANA_PLUGIN_GOARCH || goArchForNodeArch(process.arch);
const backendExecutableForPlatform = `${backendExecutable}_${backendGoos}_${backendGoarch}`;
runGo(['build', '-o', path.join(distRoot, backendExecutableForPlatform), './pkg'], packageRoot, {
  CGO_ENABLED: '0',
  GOOS: backendGoos,
  GOARCH: backendGoarch
});

fs.copyFileSync(path.join(packageRoot, 'plugin.json'), path.join(distRoot, 'plugin.json'));
fs.mkdirSync(path.join(distRoot, 'img'), { recursive: true });
fs.copyFileSync(path.join(packageRoot, 'img/logo.svg'), path.join(distRoot, 'img/logo.svg'));
fs.chmodSync(path.join(distRoot, backendExecutableForPlatform), 0o755);

console.log(`Built Grafana TopoViewer panel: ${path.relative(repoRoot, distRoot)}`);
