#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const commands = {
  setup: [['bash', ['scripts/local-mkdocs.sh', 'setup']]],
  build: [['bash', ['scripts/local-mkdocs.sh', 'build']]],
  'build:parallel': [['bash', ['scripts/build-parallel-docs.sh']]],
  'build:fast': [['bash', ['scripts/local-mkdocs.sh', 'build'], { TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD: '1' }]],
  serve: [['bash', ['scripts/local-mkdocs.sh', 'serve']]],
  'serve:fast': [['bash', ['scripts/local-mkdocs.sh', 'serve'], { TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD: '1' }]],
  preview: [['bash', ['scripts/local-docs-preview.sh']]],
  'preview:fast': [[
    'bash',
    ['scripts/local-docs-preview.sh'],
    {
      TOPOVIEWER_DOCS_SKIP_VIEWER_BUILD: '1',
      TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD: '1'
    }
  ]],
  clean: [['bash', ['scripts/local-mkdocs.sh', 'clean']]],
  smoke: [['node', ['scripts/smoke-docs-site.mjs']]],
  lint: [
    ['node', ['scripts/sync-object-reference.mjs', '--check']],
    ['node', ['scripts/lint-docs.mjs']]
  ],
  'zensical:setup': [['bash', ['scripts/local-zensical.sh', 'setup']]],
  'zensical:build': [
    ['bash', ['scripts/local-zensical.sh', 'build']],
    ['node', ['scripts/check-zensical-build.mjs']]
  ],
  'zensical:serve': [['bash', ['scripts/local-zensical.sh', 'serve']]]
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
    console.error(`Unknown docs command: ${commandName}`);
    printHelp();
    process.exit(2);
  }

  runSteps(steps, extraArgs);
}

function runSteps(steps, extraArgs) {
  steps.forEach(([command, commandArgs, env], index) => {
    const args = index === steps.length - 1 ? [...commandArgs, ...extraArgs] : commandArgs;
    const result = spawnSync(command, args, {
      env: {
        ...process.env,
        ...(env || {})
      },
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
  console.log(`Usage: npm run docs -- <command> [args]

Commands:
  ${Object.keys(commands).join('\n  ')}`);
}
