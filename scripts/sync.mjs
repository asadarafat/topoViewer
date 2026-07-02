#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const commands = {
  'mkdocs-assets': [['npm', ['--workspace', 'topoviewer', 'run', 'sync:mkdocs-assets']]],
  'zensical-assets': [['node', ['scripts/sync-zensical-assets.mjs']]],
  'zensical-docs': [['node', ['scripts/sync-zensical-docs.mjs']]],
  'object-reference': [['node', ['scripts/sync-object-reference.mjs']]],
  'check:object-reference': [['node', ['scripts/sync-object-reference.mjs', '--check']]],
  content: [
    ['node', ['scripts/sync-object-reference.mjs']],
    ['node', ['scripts/sync-content.mjs']]
  ],
  'check:content': [
    ['node', ['scripts/sync-object-reference.mjs', '--check']],
    ['node', ['scripts/sync-content.mjs', '--check']]
  ],
  'pages-redirects': [['node', ['scripts/write-pages-redirects.mjs']]],
  'docs-site': [['node', ['scripts/sync-docs-site.mjs']]],
  examples: [['npm', ['--workspace', 'topoviewer', 'run', 'sync:examples']]],
  docs: [
    ['node', ['scripts/sync-object-reference.mjs']],
    ['node', ['scripts/sync-content.mjs']],
    ['node', ['scripts/sync-docs-site.mjs']],
    ['npm', ['--workspace', 'topoviewer', 'run', 'sync:examples']]
  ],
  'check:examples': [
    ['node', ['scripts/sync-object-reference.mjs', '--check']],
    ['node', ['scripts/sync-content.mjs', '--check']],
    ['npm', ['--workspace', 'topoviewer', 'run', 'check:examples']]
  ],
  mkdocs: [['npm', ['--workspace', 'topoviewer', 'run', 'sync:mkdocs']]]
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
    console.error(`Unknown sync command: ${commandName}`);
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
  console.log(`Usage: npm run sync -- <command> [args]

Commands:
  ${Object.keys(commands).join('\n  ')}`);
}
