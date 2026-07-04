#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const commands = {
  'fixtures:sync': [['node', ['scripts/sync-grafana-harness-fixtures.mjs']]],
  'fixtures:check': [['node', ['scripts/check-grafana-harness-fixtures.mjs']]],
  'panel:build': [['npm', ['--workspace', 'grafana-topoviewer-panel', 'run', 'build']]],
  'panel:test': [['npm', ['--workspace', 'grafana-topoviewer-panel', 'run', 'test']]],
  'clab:up': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/up.sh']]],
  'clab:down': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/down.sh']]],
  'clab:clean': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/clean-destroy.sh']]],
  'clab:restart': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/restart.sh']]],
  'clab:bundle': [['node', ['scripts/build-grafana-containerlab-bundle.mjs']]],
  'clab:smoke': [['node', ['labs/grafana-topoviewer/containerlab/scripts/smoke.mjs']]],
  'clab:smoke:upstream': [['node', ['labs/grafana-topoviewer/containerlab/scripts/smoke-upstream-candidate.mjs']]],
  'clab:rules': [['node', ['labs/grafana-topoviewer/containerlab/scripts/generate-prometheus-rules.mjs']]],
  'clab:traffic:start': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/traffic.sh', 'start']]],
  'clab:traffic:stop': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/traffic.sh', 'stop']]],
  'clab:traffic:status': [['bash', ['labs/grafana-topoviewer/containerlab/scripts/traffic.sh', 'status']]]
};

runSelectedCommand();

function runSelectedCommand() {
  const [commandName, ...extraArgs] = process.argv.slice(2);
  if (!commandName || commandName === '--help' || commandName === '-h') {
    printHelp();
    process.exit(commandName ? 0 : 2);
  }

  const steps = commands[commandName];
  if (!steps) {
    console.error(`Unknown Grafana command: ${commandName}`);
    printHelp();
    process.exit(2);
  }

  runSteps(steps, extraArgs);
}

function runSteps(steps, extraArgs) {
  steps.forEach(([command, commandArgs], index) => {
    const args = index === steps.length - 1 ? [...commandArgs, ...extraArgs] : commandArgs;
    const result = spawnSync(command, args, {
      env: process.env,
      shell: process.platform === 'win32',
      stdio: 'inherit'
    });

    if (result.error) {
      console.error(result.error.message);
      process.exit(1);
    }

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  });
}

function printHelp() {
  console.log(`Usage: npm run grafana -- <command> [args]

Commands:
  ${Object.keys(commands).join('\n  ')}`);
}
