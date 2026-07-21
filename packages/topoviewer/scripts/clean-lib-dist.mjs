#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(packageRoot, 'dist');

if (fs.existsSync(distRoot)) {
  for (const entry of fs.readdirSync(distRoot)) {
    if (entry === 'embed') continue;
    fs.rmSync(path.join(distRoot, entry), { force: true, recursive: true });
  }
}
