import fs from 'node:fs';
import path from 'node:path';

export const exampleFileKeys = Object.freeze({
  'README.md': 'readme',
  'topology.yaml': 'topology',
  'stylesheet.yaml': 'stylesheet',
  'expected.yaml': 'expected'
});

function ensureInside(root, filePath, label) {
  const relativePath = path.relative(root, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`${label} resolves outside ${root}: ${filePath}`);
  }
}

export function sourceFileFor(contentExamplesRoot, example, fileName) {
  const key = exampleFileKeys[fileName];
  if (!key) {
    throw new Error(`Unsupported example file: ${fileName}`);
  }

  const sourceFiles = example.sourceFiles || {};
  const configured = sourceFiles[key];
  const source = configured
    ? path.join(contentExamplesRoot, configured)
    : path.join(contentExamplesRoot, example.sourcePath || example.path, fileName);
  ensureInside(contentExamplesRoot, source, `${example.id} ${fileName}`);
  return source;
}

export function readExampleText(contentExamplesRoot, example, fileName) {
  const source = sourceFileFor(contentExamplesRoot, example, fileName);
  if (!fs.existsSync(source)) {
    throw new Error(`Example ${example.id} source file is missing: ${source}`);
  }
  return fs.readFileSync(source, 'utf8');
}
