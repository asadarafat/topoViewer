#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const GENERATED_DOC_PATHS = [
  'README.md',
  'docs/index.md',
  'docs/topoviewer',
  'packages/topoviewer/docs',
  'packages/topoviewer/examples'
];

const MKDOCS_ASSET_PATHS = [
  'packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.css',
  'packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.iife.js'
];

const ZENSICAL_GENERATED_PATHS = [
  'zensical.toml'
];

const args = process.argv.slice(2);
const remoteParity = args.includes('--remote-parity');
const selectedLane = parseLane(args);

function parseLane(cliArgs) {
  const explicit = cliArgs.find((arg) => arg.startsWith('--lane='));
  if (explicit) {
    return explicit.slice('--lane='.length);
  }

  const laneFlagIndex = cliArgs.indexOf('--lane');
  if (laneFlagIndex !== -1) {
    return cliArgs[laneFlagIndex + 1];
  }

  return undefined;
}

function step(label, command, commandArgs, options = {}) {
  return {
    label,
    command,
    args: commandArgs,
    env: {
      ...(remoteParity ? { CI: 'true', NODE_ENV: 'test' } : {}),
      ...(options.env || {})
    }
  };
}

const laneDefinitions = {
  env: [
    step('report environment', 'node', ['scripts/report-ci-environment.mjs'])
  ],
  generated: [
    step('sync docs', 'npm', ['run', 'sync:docs']),
    step('check generated docs are committed', 'node', ['scripts/check-git-clean.mjs', ...GENERATED_DOC_PATHS])
  ],
  quality: [
    step('lint and typecheck', 'npm', ['run', 'quality'])
  ],
  schemas: [
    step('validate schemas', 'npm', ['run', 'validate:schemas']),
    step('validate semantics', 'npm', ['run', 'validate:semantics'])
  ],
  build: [
    step('build packages', 'npm', ['run', 'build']),
    step('sync MkDocs assets', 'npm', ['run', 'sync:mkdocs-assets']),
    step('check MkDocs assets are committed', 'node', ['scripts/check-git-clean.mjs', ...MKDOCS_ASSET_PATHS])
  ],
  docs: [
    step('build packages for docs', 'npm', ['run', 'build']),
    step('sync MkDocs assets for docs', 'npm', ['run', 'sync:mkdocs-assets']),
    step('check MkDocs assets for docs are committed', 'node', ['scripts/check-git-clean.mjs', ...MKDOCS_ASSET_PATHS]),
    step('sync documentation sources', 'npm', ['run', 'sync:docs']),
    step('check documentation sources are committed', 'node', ['scripts/check-git-clean.mjs', ...GENERATED_DOC_PATHS]),
    step('build MkDocs site', 'npm', ['run', 'docs:build:fast']),
    step('build Zensical site', 'npm', ['run', 'zensical:build'], { env: { TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD: '1' } }),
    step('check Zensical generated config is committed', 'node', ['scripts/check-git-clean.mjs', ...ZENSICAL_GENERATED_PATHS]),
    step('build VS Code harness site', 'npm', ['run', 'vscode:harness:build']),
    step('smoke built docs site', 'npm', ['run', 'docs:smoke'])
  ],
  'test:topoviewer': [
    step('test TopoViewer', 'npm', ['test'])
  ],
  'test:harness': [
    step('test VS Code harness', 'npm', ['run', 'test:vscode-harness'])
  ],
  'perf:smoke': [
    step('attention smoke benchmark', 'npm', ['run', 'benchmark:attention:smoke'])
  ],
  package: [
    step('pack check', 'npm', ['run', 'pack:check']),
    step('build MkDocs wheel', 'npm', ['run', 'wheel:mkdocs']),
    step('inspect MkDocs wheel', 'npm', ['run', 'inspect:wheel'])
  ]
};

const fullLaneOrder = [
  'env',
  'generated',
  'quality',
  'schemas',
  'build',
  'docs',
  'test:topoviewer',
  'test:harness',
  'perf:smoke',
  'package'
];

if (args.includes('--list')) {
  console.log(fullLaneOrder.join('\n'));
  process.exit(0);
}

if (selectedLane && !laneDefinitions[selectedLane]) {
  console.error(`Unknown CI lane: ${selectedLane}`);
  console.error(`Available lanes: ${Object.keys(laneDefinitions).join(', ')}`);
  process.exit(2);
}

const lanesToRun = selectedLane ? [selectedLane] : fullLaneOrder;

for (const laneName of lanesToRun) {
  console.log(`\n# CI lane: ${laneName}`);
  for (const { label, command, args: commandArgs, env } of laneDefinitions[laneName]) {
    runStep(label, command, commandArgs, env);
  }
}

function runStep(label, command, commandArgs, extraEnv = {}) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, commandArgs, {
    env: {
      ...process.env,
      ...extraEnv
    },
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.signal) {
    console.error(`${label} terminated with signal ${result.signal}.`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
