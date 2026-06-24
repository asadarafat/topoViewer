#!/usr/bin/env node

const REQUIRED_MAJOR = 24;
const currentMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);

if (currentMajor === REQUIRED_MAJOR) {
  process.exit(0);
}

console.error(`TopoViewer requires Node.js ${REQUIRED_MAJOR} LTS. Current Node.js is ${process.versions.node}.`);
console.error('Activate the repo Node version first, for example: nvm use 24');
process.exit(1);
