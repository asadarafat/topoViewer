import path from 'node:path';
import { runTests } from '@vscode/test-electron';

const root = path.resolve(import.meta.dirname, '..');

try {
  await runTests({
    extensionDevelopmentPath: root,
    extensionTestsPath: path.join(root, 'tests/extension/run.cjs'),
    launchArgs: [path.join(root, 'tests/extension/fixture'), '--disable-extensions'],
    version: 'stable'
  });
} catch (error) {
  console.error('VS Code Studio extension-host test failed.', error);
  process.exitCode = 1;
}
