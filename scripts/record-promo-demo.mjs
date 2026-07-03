#!/usr/bin/env node

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(repoRoot, '.artifacts', 'promo');
const frameDir = path.join(outputDir, 'frames');
const readmeCollagePath = path.join(repoRoot, 'docs', 'assets', 'topoviewer-yaml-to-graph-collage.png');
const reviewPosterPath = path.join(outputDir, 'topoviewer-yaml-to-graph-demo.png');
const reviewMp4Path = path.join(outputDir, 'topoviewer-yaml-to-graph-demo.mp4');
const reviewGifPath = path.join(outputDir, 'topoviewer-yaml-to-graph-demo.gif');
const checkOnly = process.argv.includes('--check');
const mediaOnly = process.argv.includes('--media-only') || process.argv.includes('--poster-only');

const fixtureId = process.env.TOPOVIEWER_PROMO_FIXTURE_ID || 'layered-network';
const docsBaseUrl = process.env.TOPOVIEWER_PROMO_DOCS_BASE_URL || 'http://127.0.0.1:8001/topoviewer';
const grafanaBaseUrl = process.env.TOPOVIEWER_PROMO_GRAFANA_URL || process.env.GRAFANA_URL || 'http://127.0.0.1:3000';
const telemetryInjectorUrl = process.env.TOPOVIEWER_PROMO_TELEMETRY_INJECTOR_URL ||
  process.env.TELEMETRY_INJECTOR_URL ||
  'http://127.0.0.1:9108';

const surfaceUrls = {
  harness: process.env.TOPOVIEWER_PROMO_HARNESS_URL || `${docsBaseUrl}/harness/`,
  mkdocs: process.env.TOPOVIEWER_PROMO_MKDOCS_URL ||
    `${docsBaseUrl}/docs/mkdocs/topoviewer/examples/harness/layered-network/`,
  zensical: process.env.TOPOVIEWER_PROMO_ZENSICAL_URL ||
    `${docsBaseUrl}/docs/zensical/topoviewer/examples/harness/layered-network/`,
  grafana: process.env.TOPOVIEWER_PROMO_GRAFANA_DASHBOARD_URL ||
    `${grafanaBaseUrl}/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles?orgId=1`
};

const surfaces = [
  {
    id: 'harness',
    name: 'Browser harness',
    title: 'Author in the Harness',
    eyebrow: 'YAML authoring',
    url: surfaceUrls.harness,
    caption: 'Edit topology.yaml and stylesheet.yaml beside the rendered graph.',
    collageSubtitle: 'Author topology and stylesheet YAML beside the live canvas.',
    footer: 'The browser harness is the authoring surface for topology, styles, mapper YAML, and live validation.'
  },
  {
    id: 'mkdocs',
    name: 'MkDocs live viewport',
    title: 'Publish in MkDocs',
    eyebrow: 'Documentation embed',
    url: surfaceUrls.mkdocs,
    caption: 'Render the same canonical YAML as an interactive documentation viewport.',
    collageSubtitle: 'Embed the same YAML in MkDocs documentation.',
    footer: 'MkDocs examples consume the same source bundle used by the harness and test catalog.'
  },
  {
    id: 'zensical',
    name: 'Zensical live viewport',
    title: 'Mirror into Zensical',
    eyebrow: 'Parallel docs surface',
    url: surfaceUrls.zensical,
    caption: 'Reuse the same docs content through the Zensical publishing surface.',
    collageSubtitle: 'Publish the same generated docs content through Zensical.',
    footer: 'Zensical keeps the topology model intact while changing the documentation shell.'
  },
  {
    id: 'grafana',
    name: 'Grafana TopoViewer panel',
    title: 'Operate in Grafana',
    eyebrow: 'Telemetry overlay',
    url: surfaceUrls.grafana,
    caption: 'Mount the same TopoViewer bundle and overlay runtime telemetry.',
    collageSubtitle: 'Mount the same bundle and overlay telemetry in Grafana.',
    footer: 'Grafana reads *.topo.tv.yaml, *.style.tv.yaml, and *.mapper.tv.yaml without rebuilding the plugin.'
  }
];

const docsDarkPalette = {
  index: 1,
  color: {
    scheme: 'slate',
    primary: 'blue',
    accent: 'cyan'
  }
};

function timeoutSignal(milliseconds) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), milliseconds);
  return { signal: controller.signal, timeout };
}

async function run(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
      ...options
    });
    return result;
  } catch (error) {
    const stderr = error?.stderr ? `\n${error.stderr}` : '';
    const stdout = error?.stdout ? `\n${error.stdout}` : '';
    throw new Error(`${command} ${args.join(' ')} failed.${stdout}${stderr}`);
  }
}

async function assertFfmpeg() {
  await run('ffmpeg', ['-version']);
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
      'Start the required local surfaces first:',
      '- docs/harness/MkDocs/Zensical: npm run docs:preview',
      '- Grafana lab: GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:up',
      'Override URLs with TOPOVIEWER_PROMO_HARNESS_URL, TOPOVIEWER_PROMO_MKDOCS_URL, TOPOVIEWER_PROMO_ZENSICAL_URL, or TOPOVIEWER_PROMO_GRAFANA_DASHBOARD_URL.',
      `Underlying error: ${error instanceof Error ? error.message : String(error)}`
    ].join('\n'));
  } finally {
    clearTimeout(timeout);
  }
}

async function setTelemetryScenario(scenario) {
  const response = await fetch(`${telemetryInjectorUrl}/scenario/${scenario}`, { method: 'POST' });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Unable to set telemetry scenario "${scenario}" at ${telemetryInjectorUrl}: ${response.status} ${text}`);
  }
}

async function waitForTopoViewerNodes(page) {
  await page.waitForSelector('.topoviewer .react-flow__node, .react-flow__node', { timeout: 45_000 });
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node, .react-flow__node').length >= 2);
  await page.waitForTimeout(1000);
}

async function imageDataUrl(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function installDocsDarkMode(page) {
  await page.addInitScript((palette) => {
    try {
      window.localStorage.setItem('__palette', JSON.stringify(palette));
    } catch {
      // Ignore storage failures in locked-down browser contexts.
    }
  }, docsDarkPalette);
}

async function forceDocsDarkMode(page) {
  await page.evaluate((palette) => {
    try {
      window.localStorage.setItem('__palette', JSON.stringify(palette));
    } catch {
      // Ignore storage failures in locked-down browser contexts.
    }

    const root = document.documentElement;
    root.classList.add('topoviewer-promo-force-dark');
    root.style.colorScheme = 'dark';
    root.setAttribute('data-md-color-scheme', 'slate');
    root.setAttribute('data-md-color-primary', 'blue');
    root.setAttribute('data-md-color-accent', 'cyan');
    root.style.setProperty('--md-default-bg-color', '#0b1220');
    root.style.setProperty('--md-default-fg-color', '#d7e3f3');
    root.style.setProperty('--md-default-fg-color--light', '#a8b7cc');
    root.style.setProperty('--md-default-fg-color--lighter', '#94a3b8');
    root.style.setProperty('--md-default-fg-color--lightest', '#334155');
    root.style.setProperty('--md-code-bg-color', '#111827');
    root.style.setProperty('--md-code-fg-color', '#e5edf7');
    root.style.setProperty('--md-typeset-a-color', '#42a5f5');
  }, docsDarkPalette);

  await page.addStyleTag({
    content: `
      html.topoviewer-promo-force-dark,
      html.topoviewer-promo-force-dark body {
        color-scheme: dark !important;
        background: #0b1220 !important;
      }

      html.topoviewer-promo-force-dark :where(.md-main, .md-content, .md-sidebar, .md-sidebar__scrollwrap, .md-nav, .md-typeset) {
        background-color: #0b1220 !important;
        color: #d7e3f3 !important;
      }

      html.topoviewer-promo-force-dark :where(.md-header, .md-tabs) {
        background-color: #0f172a !important;
        color: #eef6ff !important;
      }

      html.topoviewer-promo-force-dark :where(.md-search__form, .md-search__input) {
        background-color: rgba(15, 23, 42, 0.9) !important;
        color: #eef6ff !important;
      }

      html.topoviewer-promo-force-dark :where(.md-nav__link, .md-typeset p, .md-typeset li, .md-typeset table) {
        color: #c6d3e1 !important;
      }

      html.topoviewer-promo-force-dark :where(.md-typeset h1, .md-typeset h2, .md-typeset h3, .md-typeset h4, .md-typeset strong) {
        color: #f8fafc !important;
      }

      html.topoviewer-promo-force-dark :where(.md-typeset a, .md-tabs__link--active, .tabbed-labels > label) {
        color: #42a5f5 !important;
      }
    `
  });
}

async function captureHarness(browser) {
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    viewport: { width: 1440, height: 860 }
  });
  try {
    await page.addInitScript((activeFixtureId) => {
      window.localStorage.setItem('topoviewer.vscodeHarness.activeFixture.v1', activeFixtureId);
      window.localStorage.setItem('topoviewer.vscodeHarness.splitPercent.v2', '38');
    }, fixtureId);
    await page.goto(surfaceUrls.harness, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForFunction(() => !!window.__topoviewerHarnessState?.topologyText, null, { timeout: 45_000 });
    await page.getByRole('tab', { name: /^YAML$/ }).click();
    await page.getByRole('tab', { name: 'Topology YAML' }).click();
    await waitForTopoViewerNodes(page);
    await page.waitForSelector('.monaco-editor', { timeout: 30_000 });
    return imageDataUrl(await page.screenshot({ fullPage: false }));
  } finally {
    await page.close();
  }
}

async function captureDocsViewport(browser, url) {
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    viewport: { width: 1440, height: 860 }
  });
  try {
    await installDocsDarkMode(page);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await forceDocsDarkMode(page);
    await waitForTopoViewerNodes(page);
    await page.locator('.topoviewer').first().scrollIntoViewIfNeeded();
    await forceDocsDarkMode(page);
    await page.waitForTimeout(400);
    return imageDataUrl(await page.screenshot({ fullPage: false }));
  } finally {
    await page.close();
  }
}

async function captureGrafana(browser) {
  await setTelemetryScenario('healthy');
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    locale: 'en-US',
    viewport: { width: 1440, height: 860 }
  });
  try {
    await page.goto(surfaceUrls.grafana, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const panel = page.locator('[data-testid="topoviewer-grafana-panel"]').first();
    await panel.waitFor({ state: 'visible', timeout: 60_000 });
    const selector = page.locator('[data-testid="topoviewer-bundle-select"]').first();
    if (await selector.count()) {
      await selector.selectOption(fixtureId);
    }
    await waitForTopoViewerNodes(page);
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    return imageDataUrl(await page.screenshot({ fullPage: false }));
  } finally {
    await page.close();
  }
}

async function captureSurfaces(browser) {
  return {
    harness: await captureHarness(browser),
    mkdocs: await captureDocsViewport(browser, surfaceUrls.mkdocs),
    zensical: await captureDocsViewport(browser, surfaceUrls.zensical),
    grafana: await captureGrafana(browser)
  };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slideHtml(surface, image) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(surface.title)}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(15, 23, 42, 0.94);
        --panel-2: rgba(17, 28, 46, 0.98);
        --border: rgba(148, 163, 184, 0.32);
        --blue: #42a5f5;
        --text: #f8fafc;
        --muted: #a8b7cc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        width: 1600px;
        height: 900px;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 78% 16%, rgba(66, 165, 245, 0.18), transparent 34%),
          linear-gradient(135deg, #08111f 0%, #0d1728 48%, #06131b 100%);
      }

      .grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: linear-gradient(to bottom, transparent, black 12%, black 90%, transparent);
      }

      main {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 32px 38px;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 20px;
      }

      header,
      footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
      }

      h1 {
        margin: 0;
        font-size: 48px;
        line-height: 1.04;
        letter-spacing: 0;
      }

      h1 span {
        color: #8fd0ff;
      }

      .eyebrow,
      code {
        border: 1px solid rgba(66, 165, 245, 0.42);
        background: rgba(66, 165, 245, 0.13);
        color: #d8efff;
        border-radius: 999px;
        padding: 9px 14px;
        font-size: 18px;
        font-weight: 800;
      }

      .shot {
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--panel);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
        padding: 12px;
      }

      .shot img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 12px;
        background: #050d17;
      }

      .caption {
        max-width: 820px;
        color: var(--text);
        font-size: 24px;
        font-weight: 850;
      }

      .footer-right {
        color: var(--muted);
        font-size: 18px;
        font-weight: 800;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <div class="grid" aria-hidden="true"></div>
    <main>
      <header>
        <h1>Same TopoViewer YAML. <span>${escapeHtml(surface.title)}</span></h1>
        <div class="eyebrow">${escapeHtml(surface.eyebrow)}</div>
      </header>
      <section class="shot">
        <img src="${image}" alt="${escapeHtml(surface.name)} screenshot" />
      </section>
      <footer>
        <div class="caption">${escapeHtml(surface.caption)}</div>
        <div class="footer-right">Canonical bundle: <code>${escapeHtml(fixtureId)}</code><br />${escapeHtml(surface.footer)}</div>
      </footer>
    </main>
  </body>
</html>`;
}

function collageHtml(images) {
  const cards = surfaces.map((surface) => ({
    title: surface.name.replace(' live viewport', ''),
    subtitle: surface.collageSubtitle,
    image: images[surface.id]
  }));

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TopoViewer four-surface collage</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111f;
        --panel: rgba(15, 23, 42, 0.92);
        --panel-2: rgba(17, 28, 46, 0.98);
        --border: rgba(148, 163, 184, 0.32);
        --blue: #42a5f5;
        --text: #f8fafc;
        --muted: #a8b7cc;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        width: 2200px;
        height: 1600px;
        overflow: hidden;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 78% 16%, rgba(66, 165, 245, 0.18), transparent 34%),
          linear-gradient(135deg, #08111f 0%, #0d1728 48%, #06131b 100%);
      }

      .grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
        background-size: 34px 34px;
        mask-image: linear-gradient(to bottom, transparent, black 11%, black 90%, transparent);
      }

      main {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 46px 54px 50px;
      }

      header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 32px;
        margin-bottom: 30px;
      }

      h1 {
        margin: 0;
        max-width: 1420px;
        font-size: 58px;
        line-height: 1.04;
        letter-spacing: 0;
      }

      h1 span {
        color: #8fd0ff;
      }

      .badge,
      code {
        border: 1px solid rgba(66, 165, 245, 0.42);
        background: rgba(66, 165, 245, 0.13);
        color: #d8efff;
        border-radius: 999px;
        padding: 11px 17px;
        font-size: 20px;
        font-weight: 850;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 28px;
      }

      .card {
        min-width: 0;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 18px;
        background: var(--panel);
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 20px;
        min-height: 82px;
        padding: 17px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--panel-2);
      }

      .card-title {
        flex: 0 0 auto;
        color: var(--text);
        font-size: 25px;
        font-weight: 900;
      }

      .card-subtitle {
        color: var(--muted);
        font-size: 16px;
        font-weight: 750;
        line-height: 1.25;
        text-align: right;
      }

      .shot {
        height: 510px;
        padding: 10px;
        background: #07111f;
      }

      .shot img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 10px;
        background: #050d17;
      }

      footer {
        margin-top: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 21px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="grid" aria-hidden="true"></div>
    <main>
      <header>
        <h1>Same TopoViewer YAML. <span>Harness, docs, and operations.</span></h1>
        <div class="badge">Topology as Code</div>
      </header>
      <section class="cards">
        ${cards.map((card) => `
          <article class="card">
            <div class="card-head">
              <div class="card-title">${escapeHtml(card.title)}</div>
              <div class="card-subtitle">${escapeHtml(card.subtitle)}</div>
            </div>
            <div class="shot"><img src="${card.image}" alt="${escapeHtml(card.title)} screenshot" /></div>
          </article>
        `).join('')}
      </section>
      <footer>
        <div>Canonical bundle: <code>${escapeHtml(fixtureId)}</code></div>
        <div>Harness · MkDocs · Zensical · Grafana</div>
      </footer>
    </main>
  </body>
</html>`;
}

async function writeSlideFrame(browser, surface, image, index) {
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    viewport: { width: 1600, height: 900 }
  });
  const framePath = path.join(frameDir, `frame-${String(index).padStart(2, '0')}.png`);
  try {
    await page.setContent(slideHtml(surface, image), { waitUntil: 'load' });
    await page.screenshot({ path: framePath, fullPage: false });
    return framePath;
  } finally {
    await page.close();
  }
}

async function writeCollageImage(browser, images) {
  const page = await browser.newPage({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
        viewport: { width: 2200, height: 1600 }
  });
  try {
    await page.setContent(collageHtml(images), { waitUntil: 'load' });
    await page.screenshot({ path: readmeCollagePath, fullPage: false });
    await page.screenshot({ path: path.join(outputDir, 'topoviewer-yaml-to-graph-collage.png'), fullPage: false });
  } finally {
    await page.close();
  }
}

async function encodeMp4(framePaths) {
  const concatPath = path.join(outputDir, 'topoviewer-yaml-to-graph-demo.frames.txt');
  const lines = [];
  for (const framePath of framePaths) {
    lines.push(`file '${framePath.replaceAll("'", "'\\''")}'`);
    lines.push('duration 2.45');
  }
  lines.push(`file '${framePaths.at(-1).replaceAll("'", "'\\''")}'`);
  await fs.writeFile(concatPath, `${lines.join('\n')}\n`);

  await run('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatPath,
    '-vf', 'fps=30,format=yuv420p',
    '-movflags', '+faststart',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '20',
    reviewMp4Path
  ]);
}

async function encodeGif() {
  const palettePath = path.join(outputDir, 'topoviewer-yaml-to-graph-demo.palette.png');
  await run('ffmpeg', [
    '-y',
    '-i', reviewMp4Path,
    '-vf', 'fps=7,scale=960:-1:flags=lanczos,palettegen=max_colors=72:stats_mode=diff',
    palettePath
  ]);
  await run('ffmpeg', [
    '-y',
    '-i', reviewMp4Path,
    '-i', palettePath,
    '-filter_complex', 'fps=7,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
    reviewGifPath
  ]);
}

async function writePromoMedia(browser) {
  await fs.rm(frameDir, { recursive: true, force: true });
  await fs.mkdir(frameDir, { recursive: true });
  await fs.mkdir(path.dirname(readmeCollagePath), { recursive: true });

  const images = await captureSurfaces(browser);
  await writeCollageImage(browser, images);

  const framePaths = [];
  for (const [index, surface] of surfaces.entries()) {
    framePaths.push(await writeSlideFrame(browser, surface, images[surface.id], index + 1));
  }

  await fs.copyFile(framePaths[0], reviewPosterPath);
  await encodeMp4(framePaths);
  await encodeGif();
}

async function main() {
  console.log('Checking promo demo surfaces...');
  await assertFfmpeg();
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
  try {
    await writePromoMedia(browser);
  } finally {
    await browser.close();
  }

  const stats = await Promise.all([
    fs.stat(reviewMp4Path),
    fs.stat(reviewGifPath),
    fs.stat(reviewPosterPath),
    fs.stat(readmeCollagePath)
  ]);
  console.log(`promo MP4 written to ${path.relative(repoRoot, reviewMp4Path)} (${(stats[0].size / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`promo GIF written to ${path.relative(repoRoot, reviewGifPath)} (${(stats[1].size / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`promo review PNG written to ${path.relative(repoRoot, reviewPosterPath)} (${(stats[2].size / 1024 / 1024).toFixed(2)} MiB)`);
  console.log(`promo README collage PNG written to ${path.relative(repoRoot, readmeCollagePath)} (${(stats[3].size / 1024 / 1024).toFixed(2)} MiB)`);
  if (!mediaOnly) {
    console.log(`promo artifacts also copied to ${path.relative(repoRoot, outputDir)}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
