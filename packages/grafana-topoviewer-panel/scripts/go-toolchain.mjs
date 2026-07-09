import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const packageRoot = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const localGoBinary = path.join(repoRoot, '.artifacts', 'go', 'bin', process.platform === 'win32' ? 'go.exe' : 'go');
const requiredGoToolchain = 'go1.25.12+auto';

function canRun(command) {
  const result = spawnSync(command, ['version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return result.status === 0;
}

export function resolveGoBinary() {
  if (process.env.GO_BINARY) {
    if (canRun(process.env.GO_BINARY)) {
      return process.env.GO_BINARY;
    }
    throw new Error(`GO_BINARY is set but not executable: ${process.env.GO_BINARY}`);
  }

  if (canRun('go')) {
    return 'go';
  }

  if (fs.existsSync(localGoBinary) && canRun(localGoBinary)) {
    return localGoBinary;
  }

  throw new Error([
    'Go is required to build and test the Grafana plugin backend.',
    `Install Go ${requiredGoToolchain.replace('+auto', '')}, set GO_BINARY, or place a local toolchain at ${path.relative(repoRoot, localGoBinary)}.`
  ].join('\n'));
}

export function goEnv(extraEnv = {}) {
  return {
    ...process.env,
    GOTOOLCHAIN: process.env.GOTOOLCHAIN || requiredGoToolchain,
    ...extraEnv
  };
}

export function runGo(args, cwd = packageRoot, extraEnv = {}) {
  execFileSync(resolveGoBinary(), args, {
    cwd,
    stdio: 'inherit',
    env: goEnv(extraEnv)
  });
}
