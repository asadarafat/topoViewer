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
  },
  {
    message: 'core runtime must not import the VS Code adapter',
    pattern: /from\s+['"](?:vscode-topoviewer|.*vscode-topoviewer\/src)[^'"]*['"]/
  }
]);

const studioFeatureFiles = sourceFiles(path.join(root, 'packages/topoviewer-studio/src'))
  .filter((file) => !file.endsWith(`${path.sep}main.tsx`))
  .filter((file) => !file.includes(`${path.sep}hosts${path.sep}`));

inspect(studioFeatureFiles, [
  {
    message: 'Studio feature contracts must not import VS Code APIs',
    pattern: /from\s+['"]vscode['"]|acquireVsCodeApi/
  },
  {
    message: 'Studio feature contracts must not import Node filesystem APIs',
    pattern: /from\s+['"]node:fs(?:\/promises)?['"]|require\(['"](?:node:)?fs/
  },
  {
    message: 'Studio feature contracts must not depend on browser globals',
    pattern: /(?<![.\w])(?:window|localStorage|sessionStorage)\s*\.\s*[A-Za-z_$]|globalThis\s*\.\s*(?:window|document|localStorage|sessionStorage)/
  },
  {
    message: 'Studio must not deep-import the VS Code package',
    pattern: /from\s+['"][^'"]*vscode-topoviewer[^'"]*['"]/
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
