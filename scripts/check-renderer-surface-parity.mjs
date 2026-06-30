#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import yaml from 'js-yaml';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');
const artifactRoot = path.join(repoRoot, '.artifacts', 'render-parity');
const paritySiteRoot = path.join(siteRoot, 'render-parity');
const viewerSize = { width: 936, height: 420 };
const maxVisualDiffRatio = 0.035;
const pixelChannelTolerance = 32;
const rendererReadinessTimeoutMs = 60000;

const fixtures = [
  { id: 'graph-basic', sourcePath: 'graph/basic' },
  { id: 'clos-2spine-4leaf', sourcePath: 'harness/clos-2spine-4leaf' },
  { id: 'region-label-placement', sourcePath: 'regions/region-label-placement' },
  { id: 'styling-label-z-index', sourcePath: 'styling/label-z-index' },
  { id: 'layered-network', sourcePath: 'harness/layered-network' },
  { id: 'directional-link-strokes', sourcePath: 'edges/directional-link-strokes' }
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureBuiltSite() {
  const required = [
    'docs/mkdocs/assets/topoviewer/topoviewer-embed.css',
    'docs/mkdocs/assets/topoviewer/topoviewer-embed.iife.js',
    'docs/zensical/assets/topoviewer/topoviewer-embed.css',
    'docs/zensical/assets/topoviewer/topoviewer-embed.iife.js',
    'harness/index.html'
  ];
  for (const relativePath of required) {
    const absolutePath = path.join(siteRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      fail(`Renderer parity requires built site asset ${relativePath}. Run npm run ci:docs first.`);
    }
  }
}

function copyFixture(fixture) {
  const sourceRoot = path.join(repoRoot, 'packages/topoviewer/content/examples', fixture.sourcePath);
  const targetRoot = path.join(paritySiteRoot, 'fixtures', fixture.id);
  fs.mkdirSync(targetRoot, { recursive: true });
  for (const fileName of ['topology.yaml', 'stylesheet.yaml']) {
    const source = path.join(sourceRoot, fileName);
    if (!fs.existsSync(source)) {
      throw new Error(`Parity fixture ${fixture.id} is missing ${fileName} at ${source}`);
    }
    fs.copyFileSync(source, path.join(targetRoot, fileName));
  }
}

function expectedMinimumEdgePaths(fixture) {
  const topologyPath = path.join(repoRoot, 'packages/topoviewer/content/examples', fixture.sourcePath, 'topology.yaml');
  const topology = yaml.load(fs.readFileSync(topologyPath, 'utf8'));
  const graph = topology?.graph || {};
  return Math.max(graph.links?.length || 0, graph.paths?.length || 0);
}

function parityHtml(surface, fixture) {
  const assetRoot = `${pagesBasePath}/docs/${surface}/assets/topoviewer`;
  const fixtureRoot = `${pagesBasePath}/render-parity/fixtures/${fixture.id}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=${viewerSize.width}, initial-scale=1">
    <title>TopoViewer renderer parity: ${surface}/${fixture.id}</title>
    <link rel="stylesheet" href="${assetRoot}/topoviewer-embed.css">
    <style>
      html,
      body {
        width: ${viewerSize.width}px;
        height: ${viewerSize.height}px;
        margin: 0;
        overflow: hidden;
        background: #0b1118;
      }

      .topoviewer-embed {
        width: ${viewerSize.width}px;
        height: ${viewerSize.height}px;
        min-height: ${viewerSize.height}px;
      }

      .topoviewer,
      .topoviewer-embed-shell {
        width: ${viewerSize.width}px;
        height: ${viewerSize.height}px;
        min-height: ${viewerSize.height}px;
        border-radius: 0;
      }

      /*
       * Simulate common documentation theme resets. TopoViewer may inherit
       * color variables from host pages, but host CSS must not change SVG,
       * image, control, or graph geometry.
       */
      .docs-host svg,
      .docs-host img {
        max-width: 100%;
        height: auto;
      }

      .docs-host button {
        padding: 0.625em 1em;
        line-height: 1.6;
      }
    </style>
  </head>
  <body class="docs-host">
    <div
      class="topoviewer-embed topoviewer-parity-theme"
      data-topology="${fixtureRoot}/topology.yaml"
      data-stylesheet="${fixtureRoot}/stylesheet.yaml"
      data-controls="false"
      data-controls-open="false"
    ></div>
    <script src="${assetRoot}/topoviewer-embed.iife.js"></script>
  </body>
</html>
`;
}

function writeParityPages() {
  fs.rmSync(artifactRoot, { recursive: true, force: true });
  fs.rmSync(paritySiteRoot, { recursive: true, force: true });
  fs.mkdirSync(artifactRoot, { recursive: true });

  for (const fixture of fixtures) {
    copyFixture(fixture);
    for (const surface of ['mkdocs', 'zensical']) {
      const target = path.join(paritySiteRoot, surface, fixture.id, 'index.html');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, parityHtml(surface, fixture));
    }
  }
}

function sortObjects(values) {
  return values.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

async function waitForRenderer(page, label, expectedMinEdgePaths) {
  try {
    await page.waitForSelector('.topoviewer', { timeout: rendererReadinessTimeoutMs });
    await page.waitForFunction(() => !document.querySelector('.topoviewer-error'), undefined, { timeout: rendererReadinessTimeoutMs });
    await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length > 0, undefined, { timeout: rendererReadinessTimeoutMs });
    await page.waitForFunction((minimumEdgePaths) => {
      const edgeCount = document.querySelectorAll('.topoviewer .react-flow__edge').length;
      const visiblePathCount = document.querySelectorAll('.topoviewer .topoviewer-edge-visible-path').length;
      return visiblePathCount >= minimumEdgePaths && (edgeCount === 0 || visiblePathCount >= edgeCount);
    }, expectedMinEdgePaths, { timeout: rendererReadinessTimeoutMs });
  } catch (error) {
    const snapshot = await page.evaluate(() => ({
      bodyText: document.body.textContent?.replace(/\s+/g, ' ').trim().slice(0, 500) || '',
      edges: document.querySelectorAll('.topoviewer .react-flow__edge').length,
      errors: Array.from(document.querySelectorAll('.topoviewer-error')).map((element) => element.textContent || ''),
      location: window.location.href,
      nodes: document.querySelectorAll('.topoviewer .react-flow__node').length,
      topoviewers: document.querySelectorAll('.topoviewer').length,
      visiblePaths: document.querySelectorAll('.topoviewer .topoviewer-edge-visible-path').length
    })).catch((snapshotError) => ({ snapshotError: snapshotError instanceof Error ? snapshotError.message : String(snapshotError) }));
    throw new Error(`${label} renderer did not become ready: ${error instanceof Error ? error.message : String(error)}\nSnapshot: ${JSON.stringify(snapshot, null, 2)}`);
  }
  await page.waitForTimeout(250);
  const errors = await page.locator('.topoviewer-error').allTextContents();
  if (errors.length > 0) {
    throw new Error(`${label} rendered TopoViewer errors:\n${errors.join('\n')}`);
  }
}

async function surfaceMetrics(page) {
  return page.locator('.topoviewer').first().evaluate((root) => {
    const rounded = (value) => Math.round(Number(value) * 10) / 10;
    const rootRect = root.getBoundingClientRect();
    const rectOf = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: rounded(rect.x - rootRect.x),
        y: rounded(rect.y - rootRect.y),
        width: rounded(rect.width),
        height: rounded(rect.height)
      };
    };
    const text = (element) => (element.textContent || '').replace(/\s+/g, ' ').trim();
    const computed = (element) => window.getComputedStyle(element);
    const entries = (selector) => Array.from(root.querySelectorAll(selector));
    const viewportTransform = computed(root.querySelector('.react-flow__viewport')).transform;
    const viewportZoom = viewportTransform && viewportTransform !== 'none'
      ? Math.round(new DOMMatrixReadOnly(viewportTransform).a * 1000) / 1000
      : 1;
    const edgePaths = entries('.topoviewer-edge-visible-path').map((element) => {
      const style = computed(element);
      return {
        d: element.getAttribute('d') || '',
        stroke: style.stroke || element.getAttribute('stroke') || '',
        strokeWidth: style.strokeWidth || element.getAttribute('stroke-width') || ''
      };
    });
    const labelBoxes = entries('.topoviewer-node-label, .topoviewer-region-label, .topoviewer-edge-label').map((element) => ({
      className: element.className,
      text: text(element),
      rect: rectOf(element)
    }));
    const iconBoxes = entries('.topoviewer-node-icon').map((element) => ({
      className: element.className,
      rect: rectOf(element)
    }));
    const nodeGeometryBoxes = entries('.topoviewer-node-icon > .topoviewer-node-geometry').map((element) => ({
      className: element.className.baseVal || element.className,
      rect: rectOf(element)
    }));
    const nodeShapeBoxes = entries('.topoviewer-node-geometry-shape').map((element) => ({
      className: element.className.baseVal || element.className,
      rect: rectOf(element)
    }));
    const standaloneShapeGeometryBoxes = entries('.topoviewer-shape > .topoviewer-shape-geometry').map((element) => ({
      className: element.className.baseVal || element.className,
      rect: rectOf(element)
    }));
    const edgePaintLayerBoxes = entries('.react-flow__edge .topoviewer-edge-paint-layer').map((element) => ({
      className: element.className.baseVal || element.className,
      rect: rectOf(element)
    }));
    const nodeBoxes = entries('.react-flow__node').map((element) => ({
      className: element.className,
      rect: rectOf(element)
    }));

    return {
      counts: {
        nodes: entries('.react-flow__node').length,
        networkNodes: entries('.react-flow__node-network').length,
        regions: entries('.react-flow__node-region').length,
        edgePaths: edgePaths.length,
        labels: labelBoxes.length,
        icons: iconBoxes.length
      },
      viewportZoom,
      edgePaths,
      iconBoxes,
      nodeGeometryBoxes,
      nodeShapeBoxes,
      standaloneShapeGeometryBoxes,
      edgePaintLayerBoxes,
      labelBoxes,
      nodeBoxes
    };
  });
}

function comparableMetrics(metrics) {
  return {
    counts: metrics.counts,
    viewportZoom: metrics.viewportZoom,
    edgePaths: sortObjects([...metrics.edgePaths]),
    iconBoxes: sortObjects([...metrics.iconBoxes]),
    nodeGeometryBoxes: sortObjects([...metrics.nodeGeometryBoxes]),
    nodeShapeBoxes: sortObjects([...metrics.nodeShapeBoxes]),
    standaloneShapeGeometryBoxes: sortObjects([...metrics.standaloneShapeGeometryBoxes]),
    edgePaintLayerBoxes: sortObjects([...metrics.edgePaintLayerBoxes]),
    labelBoxes: sortObjects([...metrics.labelBoxes]),
    nodeBoxes: sortObjects([...metrics.nodeBoxes])
  };
}

function assertDeepEqual(label, expected, actual) {
  const left = JSON.stringify(expected, null, 2);
  const right = JSON.stringify(actual, null, 2);
  if (left !== right) {
    throw new Error(`${label} mismatch\nExpected:\n${left}\nActual:\n${right}`);
  }
}

async function screenshotViewer(page, surface, fixture) {
  const target = path.join(artifactRoot, `${fixture.id}-${surface}.png`);
  const buffer = await page.locator('.topoviewer').first().screenshot({ path: target });
  if (buffer.length < 1024) {
    throw new Error(`${surface}/${fixture.id} viewer screenshot is unexpectedly small.`);
  }
  return buffer;
}

async function visualDiffRatio(page, expectedBuffer, actualBuffer) {
  return page.evaluate(async ({ expected, actual, tolerance }) => {
    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });
    }

    const expectedImage = await loadImage(`data:image/png;base64,${expected}`);
    const actualImage = await loadImage(`data:image/png;base64,${actual}`);
    if (expectedImage.naturalWidth !== actualImage.naturalWidth || expectedImage.naturalHeight !== actualImage.naturalHeight) {
      return 1;
    }

    const canvas = document.createElement('canvas');
    canvas.width = expectedImage.naturalWidth;
    canvas.height = expectedImage.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(expectedImage, 0, 0);
    const expectedPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(actualImage, 0, 0);
    const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

    let different = 0;
    const total = canvas.width * canvas.height;
    for (let index = 0; index < expectedPixels.length; index += 4) {
      const delta = Math.max(
        Math.abs(expectedPixels[index] - actualPixels[index]),
        Math.abs(expectedPixels[index + 1] - actualPixels[index + 1]),
        Math.abs(expectedPixels[index + 2] - actualPixels[index + 2]),
        Math.abs(expectedPixels[index + 3] - actualPixels[index + 3])
      );
      if (delta > tolerance) different += 1;
    }
    return different / total;
  }, {
    actual: actualBuffer.toString('base64'),
    expected: expectedBuffer.toString('base64'),
    tolerance: pixelChannelTolerance
  });
}

function harnessUrl(baseUrl, fixture) {
  const fixtureRoot = `${pagesBasePath}/render-parity/fixtures/${fixture.id}`;
  const params = new URLSearchParams({
    parity: '1',
    id: fixture.id,
    topology: `${fixtureRoot}/topology.yaml`,
    stylesheet: `${fixtureRoot}/stylesheet.yaml`
  });
  return `${baseUrl}${pagesBasePath}/harness/?${params.toString()}`;
}

function docsUrl(baseUrl, surface, fixture) {
  return `${baseUrl}${pagesBasePath}/render-parity/${surface}/${fixture.id}/`;
}

async function newParityPage(browser, baseUrl, failures) {
  const page = await browser.newPage({
    viewport: { width: viewerSize.width, height: viewerSize.height },
    colorScheme: 'dark'
  });
  page.on('pageerror', (error) => failures.push(`Browser error: ${error.message}`));
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith(baseUrl) && !url.endsWith('/favicon.ico')) {
      failures.push(`Request failed: ${request.failure()?.errorText || 'unknown'} ${url}`);
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.startsWith(baseUrl) && response.status() >= 400 && !url.endsWith('/favicon.ico')) {
      failures.push(`HTTP ${response.status()} ${url}`);
    }
  });
  return page;
}

async function collectSurface(browser, baseUrl, failures, url, surface, fixture) {
  const page = await newParityPage(browser, baseUrl, failures);
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 30000 });
    await waitForRenderer(page, `${surface}/${fixture.id}`, expectedMinimumEdgePaths(fixture));
    return {
      metrics: comparableMetrics(await surfaceMetrics(page)),
      screenshot: await screenshotViewer(page, surface, fixture)
    };
  } catch (error) {
    throw new Error(`${surface}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await page.close();
  }
}

async function run() {
  ensureBuiltSite();
  writeParityPages();

  const { server, baseUrl } = await createDocsStaticServer({ siteRoot });
  const browser = await chromium.launch();
  const failures = [];

  try {
    const diffPage = await newParityPage(browser, baseUrl, failures);
    for (const fixture of fixtures) {
      try {
        const harness = await collectSurface(browser, baseUrl, failures, harnessUrl(baseUrl, fixture), 'harness', fixture);
        if (harness.metrics.viewportZoom > 1.001) {
          throw new Error(`${fixture.id} harness viewport zoom ${harness.metrics.viewportZoom} exceeds the React Flow default scale cap`);
        }
        for (const surface of ['mkdocs', 'zensical']) {
          const docs = await collectSurface(browser, baseUrl, failures, docsUrl(baseUrl, surface, fixture), surface, fixture);
          if (docs.metrics.viewportZoom > 1.001) {
            throw new Error(`${fixture.id} ${surface} viewport zoom ${docs.metrics.viewportZoom} exceeds the React Flow default scale cap`);
          }
          assertDeepEqual(`${fixture.id} ${surface} DOM`, harness.metrics, docs.metrics);
          const ratio = await visualDiffRatio(diffPage, harness.screenshot, docs.screenshot);
          if (ratio > maxVisualDiffRatio) {
            throw new Error(`${fixture.id} ${surface} visual diff ratio ${ratio.toFixed(4)} exceeds ${maxVisualDiffRatio}`);
          }
          console.log(`Renderer parity passed: ${fixture.id} harness <-> ${surface} (visual diff ${ratio.toFixed(4)})`);
        }
      } catch (error) {
        failures.push(`${fixture.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    await diffPage.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length > 0) {
    fail(`Renderer surface parity failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}\nScreenshots: ${path.relative(repoRoot, artifactRoot)}`);
  }

  console.log(`Renderer surface parity passed. Screenshots: ${path.relative(repoRoot, artifactRoot)}`);
}

await run();
