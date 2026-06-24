#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const steps = [
  ['sync docs', 'npm', ['run', 'sync:docs']],
  ['lint', 'npm', ['run', 'lint']],
  ['validate schemas', 'npm', ['run', 'validate:schemas']],
  ['validate semantics', 'npm', ['run', 'validate:semantics']],
  ['build packages', 'npm', ['run', 'build']],
  ['sync MkDocs assets', 'npm', ['run', 'sync:mkdocs-assets']],
  ['build MkDocs site', 'npm', ['run', 'docs:build:fast']],
  ['test TopoViewer', 'npm', ['test']],
  ['test VS Code harness', 'npm', ['run', 'test:vscode-harness']],
  ['build VS Code harness', 'npm', ['run', 'vscode:harness:build']],
  ['attention smoke benchmark', 'npm', ['run', 'benchmark:attention:smoke']],
  ['pack check', 'npm', ['run', 'pack:check']],
  ['build MkDocs wheel', 'npm', ['run', 'wheel:mkdocs']],
  ['inspect MkDocs wheel', 'npm', ['run', 'inspect:wheel']],
  ['build Zensical site', 'npm', ['run', 'zensical:build'], { TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD: '1' }]
];

for (const [label, command, args, extraEnv] of steps) {
  console.log(`\n==> ${label}`);
  const result = spawnSync(command, args, {
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
