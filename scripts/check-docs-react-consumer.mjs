import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { documentationBlocks } from './lib/docs-code-blocks.mjs';
import { createDocsStaticServer } from './lib/docs-static-server.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, '.artifacts/docs-react-consumer');
fs.mkdirSync(directory, { recursive: true });
const source = fs.readFileSync(path.join(root, 'packages/topoviewer/content/pages/examples/use-cases/react.md'), 'utf8');
const app = documentationBlocks(source).find((block) => block.marker?.kind === 'react');
if (!app) throw new Error('React quickstart needs a runnable marked component.');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: directory, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stdout}\n${result.stderr}`);
}
fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { topoviewer: '0.5.0', '@xyflow/react': '12.10.0', react: '19.2.0', 'react-dom': '19.2.0' }, devDependencies: { typescript: '5.9.3', vite: '8.3.0', '@types/react': '19.2.0', '@types/react-dom': '19.2.0' } }));
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
fs.writeFileSync(path.join(directory, 'App.tsx'), app.text);
fs.writeFileSync(path.join(directory, 'main.tsx'), "import { createRoot } from 'react-dom/client'; import App from './App'; createRoot(document.getElementById('root')!).render(<App />);");
fs.writeFileSync(path.join(directory, 'index.html'), '<!doctype html><html lang="en"><head><title>Docs React consumer</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
fs.writeFileSync(path.join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true, noEmit: true }, include: ['*.tsx'] }));
run(process.execPath, [path.join(directory, 'node_modules/typescript/bin/tsc')]);
run(process.execPath, [path.join(directory, 'node_modules/vite/bin/vite.js'), 'build']);
const { server, baseUrl } = await createDocsStaticServer({ siteRoot: path.join(directory, 'dist'), basePath: '' });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 760 } });
  await page.goto(baseUrl);
  await expect(page.locator('.react-flow__node-network')).toHaveCount(2);
  await page.locator('.react-flow__node-network[data-id="R02"]').click();
  await expect(page.getByRole('status')).toHaveText('Selected object: R02');
  await page.screenshot({ path: path.join(directory, 'quickstart.png') });
  console.log('Released React quickstart: typecheck, build, render and source-ID selection passed against topoviewer@0.5.0.');
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
