import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const violations = [];

function sourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

function runtimeFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return runtimeFiles(target);
    return /\.(?:css|ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

function inspect(files, rules) {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const rule of rules) {
      if (rule.pattern.test(source)) {
        violations.push(`${path.relative(root, file)}: ${rule.message}`);
      }
    }
  }
}

inspect(sourceFiles(path.join(root, 'packages/topoviewer/src')), [
  {
    message: 'core runtime must not import Studio',
    pattern: /from\s+['"]topoviewer-studio(?:\/[^'"]*)?['"]/
  }
]);

inspect([
  ...runtimeFiles(path.join(root, 'packages/topoviewer-studio/src')),
  ...runtimeFiles(path.join(root, 'apps/topoviewer-studio-desktop/frontend/src'))
], [{
  message: 'Studio runtime assets must be package-local instead of importing documentation assets',
  pattern: /docs\/assets\//
}]);

const studioFeatureFiles = sourceFiles(path.join(root, 'packages/topoviewer-studio/src'))
  .filter((file) => !file.endsWith(`${path.sep}main.tsx`))
  .filter((file) => !file.includes(`${path.sep}hosts${path.sep}`));

inspect(studioFeatureFiles, [
  {
    message: 'Studio feature contracts must not import retired editor-host APIs',
    pattern: /from\s+['"]vscode['"]|acquireVsCodeApi/
  },
  {
    message: 'Studio feature contracts must not import Node filesystem APIs',
    pattern: /from\s+['"]node:fs(?:\/promises)?['"]|require\(['"](?:node:)?fs/
  },
  {
    message: 'Studio feature contracts must not depend on browser globals',
    pattern: /(?<![.\w])(?:window|localStorage|sessionStorage)\s*\.\s*[A-Za-z_$]|globalThis\s*\.\s*(?:window|document|localStorage|sessionStorage)/
  }
]);

inspect(sourceFiles(path.join(root, 'packages/topoviewer-studio/src/features')), [
  {
    message: 'Studio features must not import application composition modules',
    pattern: /from\s+['"][^'"]*(?:^|\/)app(?:\/|['"])/m
  }
]);

const packageResolutionFiles = [
  ...sourceFiles(path.join(root, 'packages/topoviewer-studio')).filter((file) => /(?:vite|vitest).*\.ts$/.test(file)),
  ...sourceFiles(path.join(root, 'apps/topoviewer-studio-desktop/frontend')).filter((file) => /(?:vite|vitest).*\.ts$/.test(file)),
  path.join(root, 'apps/topoviewer-studio-desktop/frontend/tsconfig.json')
].filter((file) => fs.existsSync(file));

inspect(packageResolutionFiles, [
  {
    message: 'Studio hosts must resolve public topoviewer package exports instead of core source aliases',
    pattern: /packages\/topoviewer\/src\//
  }
]);

inspect(sourceFiles(path.join(root, 'packages/topoviewer-studio/src')).filter(
  (file) => !file.endsWith(`${path.sep}browserPreferences.ts`)
), [{
  message: 'Studio local-storage writes must use the safe versioned preference helper',
  pattern: /(?:localStorage|globalThis\s*\.\s*localStorage)\s*\.\s*setItem\s*\(/
}]);

if (violations.length > 0) {
  console.error(`Studio dependency boundary violations:\n${violations.map((item) => `- ${item}`).join('\n')}`);
  process.exit(1);
}

console.log('Studio dependency boundaries passed.');
