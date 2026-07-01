#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, '.artifacts', 'promo');
const readmePosterPath = path.join(repoRoot, 'docs', 'assets', 'topoviewer-yaml-to-graph-demo.png');
const checkOnly = process.argv.includes('--check');
const posterOnly = process.argv.includes('--poster-only');
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

function readmePosterHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TopoViewer YAML to graph poster</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(15, 23, 42, 0.88);
        --panel-strong: rgba(15, 23, 42, 0.96);
        --border: rgba(148, 163, 184, 0.24);
        --blue: #42a5f5;
        --blue-strong: #1976d2;
        --purple: #ba68c8;
        --orange: #ff9800;
        --green: #4caf50;
        --text: #f8fafc;
        --muted: #9fb2cc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        width: 1440px;
        height: 820px;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 77% 20%, rgba(66, 165, 245, 0.18), transparent 34%),
          linear-gradient(135deg, #08111f 0%, #0d1728 48%, #06131b 100%);
      }

      .poster {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 42px 48px 36px;
      }

      .grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
        background-size: 32px 32px;
        mask-image: linear-gradient(to bottom, transparent, black 14%, black 86%, transparent);
      }

      .header {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0;
      }

      .badge {
        border: 1px solid rgba(66, 165, 245, 0.42);
        background: rgba(66, 165, 245, 0.12);
        color: #d8efff;
        border-radius: 999px;
        padding: 8px 13px;
        font-size: 16px;
        font-weight: 700;
      }

      .headline {
        position: relative;
        max-width: 1120px;
        font-size: 46px;
        line-height: 1.06;
        font-weight: 850;
        letter-spacing: 0;
        margin-bottom: 28px;
      }

      .headline span {
        color: #8fd0ff;
      }

      .surface {
        position: relative;
        display: grid;
        grid-template-columns: 470px 96px 1fr;
        gap: 24px;
        align-items: stretch;
      }

      .card {
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
      }

      .code-card {
        border-radius: 18px;
        overflow: hidden;
      }

      .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid var(--border);
        background: var(--panel-strong);
      }

      .card-title {
        color: #dce9f8;
        font-size: 17px;
        font-weight: 800;
      }

      .file-pill {
        color: #b9c7da;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 13px;
        font-weight: 700;
      }

      pre {
        margin: 0;
        padding: 18px 22px 20px;
        min-height: 358px;
        color: #dce9f8;
        font: 600 16px/1.42 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        white-space: pre-wrap;
      }

      .key { color: #5eead4; }
      .value { color: #fdba74; }
      .list { color: #93c5fd; }
      .comment { color: #9fb2cc; }

      .arrow {
        align-self: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: #cdeaff;
        font-weight: 800;
        font-size: 15px;
        text-align: center;
      }

      .arrow svg {
        width: 94px;
        height: 94px;
        filter: drop-shadow(0 10px 24px rgba(66, 165, 245, 0.26));
      }

      .viewer-card {
        position: relative;
        min-height: 428px;
        border-radius: 18px;
        overflow: hidden;
      }

      .viewer-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 18px;
        border-bottom: 1px solid var(--border);
        background: rgba(7, 17, 31, 0.82);
      }

      .viewer-title {
        font-size: 17px;
        font-weight: 800;
      }

      .viewer-tabs {
        display: flex;
        gap: 8px;
      }

      .viewer-tabs span {
        border-radius: 999px;
        padding: 6px 10px;
        color: #c8d7eb;
        background: rgba(148, 163, 184, 0.1);
        font-size: 12px;
        font-weight: 800;
      }

      .viewer-tabs span:first-child {
        color: #e5f3ff;
        background: rgba(66, 165, 245, 0.18);
      }

      .viewport {
        position: relative;
        height: 372px;
        background:
          radial-gradient(circle at 50% 45%, rgba(25, 118, 210, 0.16), transparent 42%),
          linear-gradient(180deg, rgba(8, 21, 36, 0.98), rgba(4, 12, 20, 0.98));
      }

      .viewport svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }

      .footer {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        color: var(--muted);
        font-size: 17px;
        font-weight: 700;
      }

      .chips {
        display: flex;
        gap: 10px;
      }

      .chips span {
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 999px;
        padding: 8px 12px;
        background: rgba(15, 23, 42, 0.72);
      }
    </style>
  </head>
  <body>
    <main class="poster">
      <div class="grid" aria-hidden="true"></div>
      <section class="header">
        <div class="brand">TopoViewer <span class="badge">Topology as Code</span></div>
        <div class="badge">YAML to interactive graph</div>
      </section>
      <section class="headline">
        Define topology facts once. <span>Render docs, tools, and telemetry views from the same model.</span>
      </section>
      <section class="surface">
        <article class="card code-card">
          <div class="card-head">
            <div class="card-title">Declarative source</div>
            <div class="file-pill">topology + stylesheet YAML</div>
          </div>
          <pre><span class="key">graph:</span>
  <span class="key">nodes:</span>
    - <span class="key">id:</span> <span class="value">FRA-PE</span>
      <span class="key">labels:</span> { <span class="key">role:</span> <span class="value">pe</span>, <span class="key">site:</span> <span class="value">fra</span> }
    - <span class="key">id:</span> <span class="value">AMS-P</span>
      <span class="key">labels:</span> { <span class="key">role:</span> <span class="value">p</span> }
    - <span class="key">id:</span> <span class="value">Payments VPN</span>
      <span class="key">labels:</span> { <span class="key">service:</span> <span class="value">payments</span> }

<span class="key">stylesheet:</span>
  - <span class="key">selector:</span> <span class="value">link[labels.tenant = "payments"]</span>
    <span class="key">style:</span> { <span class="key">lineColor:</span> <span class="value">"#ff9800"</span>, <span class="key">lineWidth:</span> <span class="value">4</span> }</pre>
        </article>

        <div class="arrow">
          <svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
            <path d="M14 48h58" stroke="#42a5f5" stroke-width="8" stroke-linecap="round" />
            <path d="M51 25l22 23-22 23" stroke="#42a5f5" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="48" cy="48" r="43" stroke="rgba(66,165,245,.24)" stroke-width="2" />
          </svg>
          render once,<br />reuse anywhere
        </div>

        <article class="card viewer-card">
          <div class="viewer-topbar">
            <div class="viewer-title">Rendered topology</div>
            <div class="viewer-tabs"><span>Layers</span><span>Attention</span><span>Telemetry</span></div>
          </div>
          <div class="viewport">
            <svg viewBox="0 0 780 438" aria-label="Rendered TopoViewer network graph">
              <defs>
                <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#020617" flood-opacity="0.44" />
                </filter>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0l10 5-10 5z" fill="#4caf50" />
                </marker>
                <marker id="arrowOrange" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0l10 5-10 5z" fill="#ff9800" />
                </marker>
                <marker id="arrowPurple" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M0 0l10 5-10 5z" fill="#ba68c8" />
                </marker>
              </defs>
              <rect x="78" y="118" width="520" height="124" rx="10" fill="rgba(25,118,210,.08)" stroke="rgba(66,165,245,.32)" />
              <text x="338" y="144" text-anchor="middle" fill="#e2e8f0" font-size="15" font-weight="800">PROVIDER CORE</text>
              <path d="M155 196H320H485" stroke="#4caf50" stroke-width="16" stroke-linecap="round" opacity=".28" />
              <path d="M155 196H320H485" stroke="#4caf50" stroke-width="5" stroke-linecap="round" marker-end="url(#arrowGreen)" />
              <path d="M155 196Q320 336 485 196" stroke="#ff9800" stroke-width="6" fill="none" stroke-linecap="round" marker-end="url(#arrowOrange)" />
              <path d="M155 196Q320 28 485 196" stroke="#ba68c8" stroke-width="4" stroke-dasharray="10 9" fill="none" marker-end="url(#arrowPurple)" />
              <path d="M485 196H642V82" stroke="#ef5350" stroke-width="4" stroke-dasharray="8 7" fill="none" marker-end="url(#arrowOrange)" />

              <g filter="url(#shadow)">
                <rect x="122" y="163" width="66" height="66" rx="8" fill="#001135" stroke="#42a5f5" stroke-width="4" />
                <path d="M143 181v12h-12M132 193l12-12M168 181v12h12M179 193l-12-12M143 211v-12h-12M132 199l12 12M168 211v-12h12M179 199l-12 12" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="287" y="163" width="66" height="66" rx="8" fill="#001135" stroke="#90caf9" stroke-width="4" />
                <path d="M308 181v12h-12M297 193l12-12M333 181v12h12M344 193l-12-12M308 211v-12h-12M297 199l12 12M333 211v-12h12M344 199l-12 12" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="452" y="163" width="66" height="66" rx="8" fill="#001135" stroke="#42a5f5" stroke-width="4" />
                <path d="M473 181v12h-12M462 193l12-12M498 181v12h12M509 193l-12-12M473 211v-12h-12M462 199l12 12M498 211v-12h12M509 199l-12 12" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                <rect x="296" y="285" width="48" height="48" rx="8" fill="#001135" stroke="#90caf9" stroke-width="4" />
                <path d="M304 315c.5 6.1 6 11.1 12.4 11.1h32.8c5.4 0 10.6-2.8 13.6-7.2 6-8.9 0-21.9-10.6-23.5-1.5-.2-2.7-.2-4.1 0l-1.5.2c-1.1.2-2.3-.4-2.8-1.5-2.4-4.4-7.5-7.3-13.2-6.6-6 .7-11.5 5.5-11.5 11.4v1c0 1.5-1.3 2.8-2.8 2.8h-.2c-6.8 0-12.4 5.7-11.9 12.4z" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" />
                <rect x="625" y="62" width="48" height="48" rx="6" fill="#001135" stroke="#90caf9" stroke-width="4" />
                <circle cx="647" cy="86" r="13" fill="none" stroke="#fff" stroke-width="3" />
                <path d="M660 76l10 10-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </g>

              <g font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="850" fill="#f8fafc">
                <text x="155" y="257" text-anchor="middle">FRA-PE</text>
                <text x="320" y="257" text-anchor="middle">AMS-P</text>
                <text x="485" y="257" text-anchor="middle">LON-PE</text>
                <text x="320" y="364" text-anchor="middle">Payments VPN</text>
                <text x="649" y="139" text-anchor="middle">NOC</text>
              </g>
              <g font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="800">
                <rect x="223" y="174" width="92" height="26" rx="13" fill="rgba(76,175,80,.16)" stroke="rgba(76,175,80,.34)" />
                <text x="269" y="192" text-anchor="middle" fill="#bdf4c2">underlay</text>
                <rect x="342" y="300" width="88" height="26" rx="13" fill="rgba(255,152,0,.16)" stroke="rgba(255,152,0,.38)" />
                <text x="386" y="318" text-anchor="middle" fill="#ffd8a8">service path</text>
                <rect x="332" y="64" width="64" height="26" rx="13" fill="rgba(186,104,200,.16)" stroke="rgba(186,104,200,.38)" />
                <text x="364" y="82" text-anchor="middle" fill="#f1c7f7">BGP</text>
              </g>
            </svg>
          </div>
        </article>
      </section>
      <section class="footer">
        <div>One YAML model, many rendering surfaces.</div>
        <div class="chips"><span>MkDocs</span><span>Zensical</span><span>React</span><span>Grafana</span><span>Harness</span></div>
      </section>
    </main>
  </body>
</html>`;
}

async function writeReadmePoster(browser) {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.dirname(readmePosterPath), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 820 }, deviceScaleFactor: 1 });
  try {
    await page.setContent(readmePosterHtml(), { waitUntil: 'load' });
    await page.screenshot({
      path: path.join(outputDir, 'topoviewer-yaml-to-graph-demo.png'),
      fullPage: false
    });
    await page.screenshot({
      path: readmePosterPath,
      fullPage: false
    });
  } finally {
    await page.close();
  }
}

async function main() {
  if (posterOnly) {
    const browser = await chromium.launch();
    try {
      await writeReadmePoster(browser);
    } finally {
      await browser.close();
    }
    console.log(`README poster written to ${path.relative(repoRoot, readmePosterPath)}`);
    return;
  }

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
    await writeReadmePoster(browser);
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
