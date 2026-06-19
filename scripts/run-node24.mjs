#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const REQUIRED_MAJOR = 24;
const currentMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);
const command = process.argv.slice(2);

if (command.length === 0) {
  console.error('usage: node scripts/run-node24.mjs <command> [args...]');
  process.exit(2);
}

if (currentMajor === REQUIRED_MAJOR) {
  exitWith(spawnCommand(command[0], command.slice(1)));
}

if (process.env.TOPOVIEWER_NODE24_REEXEC === '1') {
  console.error(`TopoViewer requires Node.js ${REQUIRED_MAJOR} LTS, but re-exec is still using ${process.versions.node}.`);
  process.exit(1);
}

console.error(`TopoViewer requires Node.js ${REQUIRED_MAJOR} LTS; current Node.js is ${process.versions.node}. Re-running with node@${REQUIRED_MAJOR}.`);

exitWith(spawnCommand('npx', [
  '-y',
  '-p',
  `node@${REQUIRED_MAJOR}`,
  '-c',
  command.map(shellQuote).join(' ')
], {
  ...process.env,
  TOPOVIEWER_NODE24_REEXEC: '1'
}));

function spawnCommand(commandName, args, env = process.env) {
  return spawnSync(commandName, args, {
    env,
    shell: process.platform === 'win32',
    stdio: 'inherit'
  });
}

function exitWith(result) {
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.signal) {
    console.error(`Command terminated with signal ${result.signal}.`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
