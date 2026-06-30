#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, '.artifacts', 'promo');
const checkOnly = process.argv.includes('--check');
const docsBaseUrl = process.env.TOPOVIEWER_PROMO_DOCS_BASE_URL || 'http://127.0.0.1:8001/topoviewer';
const grafanaBaseUrl = process.env.TOPOVIEWER_PROMO_GRAFANA_URL || process.env.GRAFANA_URL || 'http://127.0.0.1:3000';

const surfaces = [
  {
    name: 'Browser harness',
    url: process.env.TOPOVIEWER_PROMO_HARNESS_URL || `${docsBaseUrl}/harness/`,
    caption: 'Author topology, stylesheet, and mapper YAML in the browser harness.'
  },
  {
    name: 'MkDocs live viewport',
    url: process.env.TOPOVIEWER_PROMO_MKDOCS_URL || `${docsBaseUrl}/docs/mkdocs/topoviewer/examples/`,
    caption: 'Render the same YAML as a live MkDocs viewport.'
  },
  {
    name: 'Zensical live viewport',
    url: process.env.TOPOVIEWER_PROMO_ZENSICAL_URL || `${docsBaseUrl}/docs/zensical/topoviewer/examples/`,
    caption: 'Publish the same topology through Zensical without rewriting the model.'
  },
  {
    name: 'Grafana TopoViewer panel',
    url: process.env.TOPOVIEWER_PROMO_GRAFANA_DASHBOARD_URL || `${grafanaBaseUrl}/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles`,
    caption: 'Mount the bundle in Grafana and drive runtime overlays from telemetry.'
  }
];

function timeoutSignal(milliseconds) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), milliseconds);
  return { signal: controller.signal, timeout };
}

async function assertSurface(surface) {
  const { signal, timeout } = timeoutSignal(5000);
  try {
    const response = await fetch(surface.url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error([
      `${surface.name} is not reachable at ${surface.url}.`,
      'Start the required local surface first:',
      '- docs/harness: npm run docs:preview',
      '- Grafana lab: npm run grafana:lab:up',
      'Override URLs with TOPOVIEWER_PROMO_HARNESS_URL, TOPOVIEWER_PROMO_MKDOCS_URL, TOPOVIEWER_PROMO_ZENSICAL_URL, or TOPOVIEWER_PROMO_GRAFANA_DASHBOARD_URL.',
      `Underlying error: ${error instanceof Error ? error.message : String(error)}`
    ].join('\n'));
  } finally {
    clearTimeout(timeout);
  }
}

async function caption(page, text) {
  await page.evaluate((value) => {
    const id = 'topoviewer-promo-caption';
    document.getElementById(id)?.remove();
    const node = document.createElement('div');
    node.id = id;
    node.textContent = value;
    Object.assign(node.style, {
      position: 'fixed',
      left: '50%',
      bottom: '28px',
      transform: 'translateX(-50%)',
      zIndex: '2147483647',
      maxWidth: '920px',
      padding: '12px 18px',
      borderRadius: '999px',
      background: 'rgba(15, 23, 42, 0.86)',
      border: '1px solid rgba(66, 165, 245, 0.48)',
      color: '#e5f3ff',
      font: '600 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.28)',
      pointerEvents: 'none'
    });
    document.body.appendChild(node);
  }, text);
}

async function visitSurface(page, surface) {
  await page.goto(surface.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await caption(page, surface.caption);
  await page.waitForTimeout(4500);
}

async function main() {
  console.log('Checking promo demo surfaces...');
  for (const surface of surfaces) {
    await assertSurface(surface);
    console.log(`- ${surface.name}: ${surface.url}`);
  }

  if (checkOnly) {
    console.log('promo demo preflight passed');
    return;
  }

  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: 'dark',
    recordVideo: {
      dir: outputDir,
      size: { width: 1440, height: 920 }
    },
    viewport: { width: 1440, height: 920 }
  });
  const page = await context.newPage();

  try {
    for (const surface of surfaces) {
      await visitSurface(page, surface);
    }
    await caption(page, 'YAML topology. Reusable stylesheet. Interactive diagram.');
    await page.waitForTimeout(4000);
    await page.screenshot({
      path: path.join(outputDir, 'topoviewer-yaml-to-graph-demo.png'),
      fullPage: false
    });
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();
    const videoPath = await video?.path();
    if (videoPath) {
      await fs.rename(videoPath, path.join(outputDir, 'topoviewer-yaml-to-graph-demo.webm'));
    }
  }

  console.log(`promo demo artifacts written to ${path.relative(repoRoot, outputDir)}`);
  console.log('Review locally, then host the final video on a durable public URL before referencing it from README or docs.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
