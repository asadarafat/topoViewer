#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const defaultOutputDir = path.join(repoRoot, '.artifacts', 'manual-transfer');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: options.encoding,
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  });
  const allowedStatuses = options.allowedStatuses || [0];
  if (!allowedStatuses.includes(result.status)) {
    const stderr = result.stderr?.toString().trim();
    throw new Error(`${command} ${args.join(' ')} failed${stderr ? `:\n${stderr}` : ''}`);
  }
  return result;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

function parseArgs(argv) {
  const extraPaths = [];
  let outputFile = process.env.TOPOVIEWER_TRANSFER_OUTPUT || '';

  const envExtra = process.env.TOPOVIEWER_TRANSFER_EXTRA;
  if (envExtra) extraPaths.push(...envExtra.split(path.delimiter).filter(Boolean));

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--output' || arg === '--out') {
      outputFile = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--extra') {
      extraPaths.push(argv[index + 1] || '');
      index += 1;
      continue;
    }
    extraPaths.push(arg);
  }

  return { extraPaths: extraPaths.filter(Boolean), outputFile };
}

function gitText(args) {
  return run('git', args, { encoding: 'utf8' }).stdout.trim();
}

function gitBuffer(args, allowedStatuses = [0]) {
  return run('git', args, { allowedStatuses }).stdout;
}

function stagedPatchBuffer(untrackedFiles) {
  const patchParts = [gitBuffer(['diff', '--binary', 'HEAD'])];
  for (const file of untrackedFiles) {
    const patch = gitBuffer(['diff', '--binary', '--no-index', '--', '/dev/null', file], [0, 1]);
    if (patch.length) patchParts.push(patch);
  }
  return Buffer.concat(patchParts.flatMap((part) => part.length ? [part, Buffer.from('\n')] : []));
}

function copyRecursive(source, target) {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function safeArchivePath(inputPath) {
  const absolutePath = path.resolve(repoRoot, inputPath);
  const archivePath = path.isAbsolute(inputPath)
    ? path.relative(path.parse(absolutePath).root, absolutePath)
    : inputPath;
  return archivePath
    .split(path.sep)
    .join('/')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
}

function copyExtras(extraPaths, stagingDir) {
  return extraPaths.map((extraPath) => {
    const absolutePath = path.resolve(repoRoot, extraPath);
    if (!fs.existsSync(absolutePath)) throw new Error(`Extra path does not exist: ${extraPath}`);
    const archivePath = path.posix.join('extras', safeArchivePath(extraPath));
    copyRecursive(absolutePath, path.join(stagingDir, archivePath));
    return { source: absolutePath, archivePath };
  });
}

function writeApplyInstructions(stagingDir, patchFileName, diffCount, extras) {
  const extraLines = extras.length
    ? [
        '',
        '## Extra Files',
        '',
        'These files were copied into `extras/` because they are outside git or intentionally ignored. Copy them manually where you want them on the target machine:',
        '',
        ...extras.map((extra) => `- \`${extra.archivePath}\` from \`${extra.source}\``)
      ]
    : [];

  const content = [
    '# TopoViewer Manual Transfer',
    '',
    `Created: ${new Date().toISOString()}`,
    `Patch file: ${patchFileName}`,
    `Patch diffs: ${diffCount}`,
    '',
    '## Apply Repo Patch',
    '',
    '```bash',
    'cd /path/to/topoViewer',
    'git status --short',
    `git apply --check /path/to/${patchFileName}`,
    `git apply /path/to/${patchFileName}`,
    'npm ci',
    'npm run quality',
    '```',
    ...extraLines,
    ''
  ].join('\n');

  fs.writeFileSync(path.join(stagingDir, 'APPLY.md'), content);
}

function main() {
  const { extraPaths, outputFile } = parseArgs(process.argv.slice(2));
  const repo = gitText(['rev-parse', '--show-toplevel']);
  if (path.resolve(repo) !== repoRoot) throw new Error(`Expected repo root ${repoRoot}, got ${repo}`);

  const untrackedFiles = gitText(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const patchBuffer = stagedPatchBuffer(untrackedFiles);
  const diffCount = (patchBuffer.toString('utf8').match(/^diff --git /gm) || []).length;
  if (!diffCount && !extraPaths.length) {
    throw new Error('No tracked, untracked, or extra-file changes to package.');
  }

  fs.mkdirSync(defaultOutputDir, { recursive: true });
  const resolvedOutput = path.resolve(repoRoot, outputFile || path.join(defaultOutputDir, `topoviewer-manual-transfer-${timestamp()}.tar.gz`));
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });

  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-transfer-'));
  const patchFileName = 'topoviewer-worktree.patch';
  fs.writeFileSync(path.join(stagingDir, patchFileName), patchBuffer);
  const extras = copyExtras(extraPaths, stagingDir);
  writeApplyInstructions(stagingDir, patchFileName, diffCount, extras);

  run('tar', ['-czf', resolvedOutput, '-C', stagingDir, '.']);
  fs.rmSync(stagingDir, { recursive: true, force: true });

  console.log(`Created manual transfer bundle: ${resolvedOutput}`);
  console.log(`Patch diffs: ${diffCount}`);
  if (extras.length) console.log(`Extra files: ${extras.length}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}