#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(siteRoot)) {
  fail('Docs smoke requires a built site/ directory. Run npm run ci:docs or npm run docs:build first.');
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
  const { server, baseUrl } = await createDocsStaticServer({ siteRoot });
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
        url: `${baseUrl}${pagesBasePath}/docs/mkdocs/topoviewer/reference/graph/basic/`,
        nodes: 2,
        edges: 1
      },
      {
        label: 'Zensical attention object focus',
        url: `${baseUrl}${pagesBasePath}/docs/zensical/topoviewer/reference/attention/object-focus/`,
        nodes: 2,
        edges: 1
      },
      {
        label: 'VS Code browser harness',
        url: `${baseUrl}${pagesBasePath}/harness/`,
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
