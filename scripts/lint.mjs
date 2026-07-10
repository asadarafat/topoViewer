#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const lintTargets = {
  'code-health': {
    description: 'max source/test/script file length guardrail',
    steps: [['node', ['scripts/check-code-health.mjs']]]
  },
  ts: {
    description: 'oxlint correctness checks',
    steps: [[
      'oxlint',
      [
        'packages/topoviewer/src',
        'packages/topoviewer/scripts',
        'packages/topoviewer/tests',
        'packages/topoviewer-studio/src',
        'packages/topoviewer-studio/tests',
        'packages/topoviewer-studio/vite.config.ts',
        'packages/topoviewer-studio/playwright.config.ts',
        'packages/topoviewer-studio/playwright.parity.config.ts',
        'packages/topoviewer-studio/playwright.performance.config.ts',
        'packages/grafana-topoviewer-panel/src',
        'packages/grafana-topoviewer-panel/scripts',
        'packages/grafana-topoviewer-panel/tests',
        'packages/vscode-topoviewer/src',
        'packages/vscode-topoviewer/scripts',
        'packages/vscode-topoviewer/tests',
        'scripts',
        'labs/grafana-topoviewer/scripts',
        'labs/grafana-topoviewer/containerlab/scripts',
        '--ignore-path',
        '.gitignore'
      ]
    ]]
  },
  'test-types': {
    description: 'TypeScript typecheck for test support code',
    steps: [['npm', ['--workspace', 'topoviewer', 'run', 'typecheck:tests']]]
  },
  deps: {
    description: 'dependency-cruiser boundary and cycle checks',
    steps: [[
      'depcruise',
      [
        '--config',
        '.dependency-cruiser.cjs',
        'packages/topoviewer/src',
        'packages/topoviewer/scripts',
        'packages/topoviewer/tests',
        'packages/topoviewer-studio/src',
        'packages/topoviewer-studio/tests',
        'packages/grafana-topoviewer-panel/src',
        'packages/grafana-topoviewer-panel/tests',
        'packages/vscode-topoviewer/src',
        'packages/vscode-topoviewer/scripts',
        'packages/vscode-topoviewer/tests',
        'scripts'
      ]
    ]]
  },
  cpd: {
    description: 'jscpd duplicate-code threshold',
    steps: [['jscpd', ['--config', '.jscpd.json', '--no-tips']]]
  },
  'cpd-report': {
    description: 'jscpd duplicate-code report for local inspection',
    steps: [['jscpd', ['--config', '.jscpd.json', '--reporters', 'console', '--no-tips']]]
  }
};

const defaultTargets = ['code-health', 'ts', 'test-types', 'deps', 'cpd'];
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const selectedTargets = selectedLintTargets(args);
for (const target of selectedTargets) {
  const definition = lintTargets[target];
  if (!definition) {
    console.error(`Unknown lint target: ${target}`);
    printHelp();
    process.exit(2);
  }
  runTarget(target, definition);
}

function selectedLintTargets(cliArgs) {
  if (cliArgs.length === 0) return defaultTargets;

  const onlyIndex = cliArgs.indexOf('--only');
  if (onlyIndex !== -1) {
    const value = cliArgs[onlyIndex + 1];
    if (!value) {
      console.error('--only requires a comma-separated target list.');
      process.exit(2);
    }
    return value.split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  if (cliArgs[0]?.startsWith('--only=')) {
    return cliArgs[0].slice('--only='.length).split(',').map((entry) => entry.trim()).filter(Boolean);
  }

  return cliArgs;
}

function runTarget(target, definition) {
  console.log(`\n# lint: ${target}`);
  for (const [command, commandArgs] of definition.steps) {
    const result = spawnSync(command, commandArgs, {
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
  }
}

function printHelp() {
  console.log(`Usage: npm run lint -- [target ...]
       npm run lint -- --only <target[,target]>

Targets:`);
  for (const [name, definition] of Object.entries(lintTargets)) {
    console.log(`  ${name.padEnd(14)} ${definition.description}`);
  }
}
