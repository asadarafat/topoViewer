#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function commandExists(command) {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function requireCommand(candidates, label) {
  for (const command of candidates) {
    const resolved = commandExists(command);
    if (resolved) return { command, resolved };
  }
  throw new Error(`${label} is required for the Containerlab Grafana lab. Install it, then rerun npm run grafana:clab:up.`);
}

function requireWorkingDocker() {
  const docker = requireCommand(['docker'], 'Docker');
  const result = spawnSync(docker.command, ['version', '--format', '{{.Server.Version}}'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    throw new Error(`Docker is installed but not usable by this shell: ${result.stderr.trim() || result.stdout.trim()}`);
  }
  console.log(`Docker is available: ${result.stdout.trim()}`);
}

try {
  requireWorkingDocker();
  const clab = requireCommand(['containerlab', 'clab'], 'Containerlab');
  const version = spawnSync(clab.command, ['version', '--short'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  console.log(`Containerlab is available: ${clab.resolved}`);
  if (version.status === 0 && version.stdout.trim()) {
    console.log(`Containerlab version: ${version.stdout.trim()}`);
  }
} catch (error) {
  console.error(`[topoviewer] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
