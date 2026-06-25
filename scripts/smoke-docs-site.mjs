#!/usr/bin/env node

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');
const pagesBasePath = '/TopoViewer';

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.yaml', 'application/yaml; charset=utf-8'],
  ['.yml', 'application/yaml; charset=utf-8']
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(siteRoot)) {
  fail('Docs smoke requires a built site/ directory. Run npm run ci:docs or npm run docs:build first.');
}

function pathForRequest(requestUrl) {
  const parsed = new URL(requestUrl, 'http://127.0.0.1');
  let urlPath = decodeURIComponent(parsed.pathname);
  if (urlPath === pagesBasePath) {
    urlPath = '/';
  } else if (urlPath.startsWith(`${pagesBasePath}/`)) {
    urlPath = urlPath.slice(pagesBasePath.length);
  }

  let absolutePath = path.resolve(siteRoot, `.${urlPath}`);
  if (!absolutePath.startsWith(siteRoot)) {
    return undefined;
  }

  if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
    absolutePath = path.join(absolutePath, 'index.html');
  } else if (!fs.existsSync(absolutePath) && !path.extname(absolutePath)) {
    absolutePath = path.join(absolutePath, 'index.html');
  }

  if (!absolutePath.startsWith(siteRoot)) {
    return undefined;
  }
  return absolutePath;
}

function createStaticServer() {
  const server = http.createServer((request, response) => {
    const absolutePath = pathForRequest(request.url || '/');
    if (!absolutePath || !fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const contentType = mimeTypes.get(path.extname(absolutePath)) || 'application/octet-stream';
    response.writeHead(200, { 'content-type': contentType });
    fs.createReadStream(absolutePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine docs smoke server address.'));
        return;
      }
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

async function assertNoTopoViewerError(page, label) {
  const errors = await page.locator('.topoviewer-error').allTextContents();
  if (errors.length > 0) {
    throw new Error(`${label} rendered TopoViewer errors:\n${errors.join('\n')}`);
  }
}

async function assertEmbedRendered(page, label, minimumNodes = 1, minimumEdges = 0) {
  await page.waitForSelector('.topoviewer-embed', { timeout: 30000 });
  await page.waitForFunction(
    ([nodes]) => document.querySelectorAll('.react-flow__node-network').length >= nodes,
    [minimumNodes],
    { timeout: 30000 }
  );
  if (minimumEdges > 0) {
    await page.waitForFunction(
      ([edges]) => document.querySelectorAll('.topoviewer-edge-visible-path').length >= edges,
      [minimumEdges],
      { timeout: 30000 }
    );
  }
  await assertNoTopoViewerError(page, label);
}

async function run() {
  const { server, baseUrl } = await createStaticServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const browserErrors = [];

    page.on('pageerror', (error) => {
      browserErrors.push(error.message);
    });
    page.on('response', (response) => {
      const url = response.url();
      if (url.startsWith(baseUrl) && response.status() >= 400 && !url.endsWith('/favicon.ico')) {
        browserErrors.push(`${response.status()} ${url}`);
      }
    });
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.startsWith(baseUrl) && !url.endsWith('/favicon.ico')) {
        browserErrors.push(`${request.failure()?.errorText || 'request failed'} ${url}`);
      }
    });

    const checks = [
      {
        label: 'MkDocs graph basic',
        url: `${baseUrl}/TopoViewer/topoviewer/reference/graph/basic/`,
        nodes: 2,
        edges: 1
      },
      {
        label: 'Zensical attention object focus',
        url: `${baseUrl}/TopoViewer/zensical/topoviewer/reference/attention/object-focus/`,
        nodes: 2,
        edges: 1
      },
      {
        label: 'VS Code browser harness',
        url: `${baseUrl}/TopoViewer/harness/`,
        harness: true
      }
    ];

    for (const check of checks) {
      try {
        await page.goto(check.url, { waitUntil: 'commit', timeout: 30000 });
        if (check.harness) {
          await page.getByText('TopoViewer').first().waitFor({ timeout: 30000 });
          await page.getByText('Browser harness').first().waitFor({ timeout: 30000 });
          await page.getByLabel('Template').first().waitFor({ timeout: 30000 });
          await page.waitForSelector('.topoviewer', { timeout: 30000 });
        } else {
          await assertEmbedRendered(page, check.label, check.nodes, check.edges);
        }
        console.log(`Docs smoke passed: ${check.label}`);
      } catch (error) {
        failures.push(`${check.label}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (browserErrors.length > 0) {
      failures.push(`Browser errors:\n${browserErrors.join('\n')}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    fail(`Docs smoke failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  }
}

await run();
