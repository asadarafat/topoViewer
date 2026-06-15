const { test, expect } = require('@playwright/test');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const rtfmRoot = path.resolve(__dirname, '../../../../rtfm');
const rtfmPublic = process.env.TOPOVIEWER_MKDOCS_PUBLIC
  ? path.resolve(process.env.TOPOVIEWER_MKDOCS_PUBLIC)
  : path.join(rtfmRoot, 'public');
const packageRoot = path.resolve(__dirname, '..');
const catalogPath = path.join(packageRoot, 'examples/test-cases/catalog.yaml');

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
}

function loadExamples() {
  if (!fs.existsSync(catalogPath)) return [];
  const catalog = readYaml(catalogPath);
  return (catalog.examples || []).map((example) => ({
    ...example,
    expected: readYaml(path.join(packageRoot, 'examples/test-cases', example.path, 'expected.yaml'))
  }));
}

const examples = loadExamples();
const renderableExamples = examples.filter((example) => example.expected?.renderable !== false);

function pageIndexPath(example) {
  return path.join(rtfmPublic, example.page, 'index.html');
}

function categoryIndexPath(feature) {
  return path.join(rtfmPublic, 'topoviewer/reference', feature, 'index.html');
}

function exampleUrl(example) {
  return `${baseURL}/${example.page}/`;
}

function categoryUrl(feature) {
  return `${baseURL}/topoviewer/reference/${feature}/`;
}

function hasPublicExample(example) {
  return fs.existsSync(pageIndexPath(example));
}

function hasPublicCategory(feature) {
  return fs.existsSync(categoryIndexPath(feature));
}

const firstPublicExample = renderableExamples.find(hasPublicExample);

let server;
let baseURL;

async function waitForServer(url) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function currentZoomScript() {
  const viewport = document.querySelector('.react-flow__viewport');
  const transform = getComputedStyle(viewport).transform;
  if (!transform || transform === 'none') return 1;
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return null;
  return Number(match[1].split(',')[0]);
}

async function openExample(page, example) {
  await page.goto(exampleUrl(example), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.topoviewer-embed', { timeout: 30000 });
}

async function expectNoInvalidGeometry(page) {
  const invalidPathCount = await page.locator('svg path').evaluateAll((paths) => {
    return paths.filter((item) => {
      const d = item.getAttribute('d');
      return d && /NaN|undefined|null/.test(d);
    }).length;
  });
  expect(invalidPathCount).toBe(0);
}

async function expectNoBrowserErrors(page, browserErrors) {
  const actionableErrors = browserErrors.filter((line) => {
    if (line.includes('Download the React DevTools')) return false;
    if (line.includes('gitlabe2.ext.net.nokia.com/api/v4/projects/aarafat%2Frtfm')) return false;
    if (line.includes('blocked by CORS policy')) return false;
    if (line.includes('Failed to load resource: net::ERR_FAILED')) return false;
    return true;
  });
  expect(actionableErrors).toEqual([]);
  await expectNoInvalidGeometry(page);
}

async function expectGenericExample(page, example) {
  const expected = example.expected?.dom || {};

  await expect(page.locator('.topoviewer-figure')).toBeVisible();
  await expect(page.locator('.topoviewer-embed')).toBeVisible();

  if (expected.graphNodes !== undefined) {
    await expect(page.locator('.react-flow__node-network')).toHaveCount(expected.graphNodes);
  }
  if (expected.shapes !== undefined) {
    await expect(page.locator('.topoviewer-shape-geometry')).toHaveCount(expected.shapes);
  }
  if (expected.visibleCallouts !== undefined) {
    await expect(page.locator('.topoviewer-callout')).toHaveCount(expected.visibleCallouts);
  }
  if (expected.minVisibleEdges !== undefined) {
    expect(await page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThanOrEqual(expected.minVisibleEdges);
  }
  if (expected.minRegions !== undefined) {
    expect(await page.locator('.react-flow__node-region').count()).toBeGreaterThanOrEqual(expected.minRegions);
  }
}

async function expectControlAssertions(page, example) {
  const assertions = example.expected?.assertions || {};

  if (assertions.controls) {
    await expect(page.locator('.topoviewer-controls-toggle')).toHaveCount(1);
    if (await page.locator('.topoviewer-embed-controls-overlay').count() === 0) {
      await page.locator('.topoviewer-controls-toggle').click();
    }
    await expect(page.locator('.topoviewer-embed-controls-overlay')).toBeVisible();
  }

  if (assertions.svgIcons) {
    expect(await page.locator('.topoviewer-node-icon-image[src^="data:image/svg+xml"]').count()).toBeGreaterThan(0);
  }

  if (assertions.themeVariables) {
    const lightBackground = await page.locator('.topoviewer-figure').evaluate((element) => {
      return getComputedStyle(element).getPropertyValue('--topoviewer-bg').trim();
    });
    await page.evaluate(() => document.documentElement.setAttribute('data-md-color-scheme', 'slate'));
    const darkBackground = await page.locator('.topoviewer-figure').evaluate((element) => {
      return getComputedStyle(element).getPropertyValue('--topoviewer-bg').trim();
    });
    expect(lightBackground).not.toEqual('');
    expect(darkBackground).not.toEqual('');
    expect(darkBackground).not.toEqual(lightBackground);
  }

  if (assertions.deepZoomMin) {
    if (await page.locator('.topoviewer-embed-controls-overlay').count() === 0) {
      await page.locator('.topoviewer-controls-toggle').click();
    }
    for (let index = 0; index < 20; index += 1) {
      const disabled = await page.locator('.react-flow__controls-zoomin').evaluate((element) => element.disabled);
      if (disabled) break;
      await page.locator('.react-flow__controls-zoomin').click();
      await page.waitForTimeout(80);
    }
    const zoom = await page.evaluate(currentZoomScript);
    expect(zoom).toBeGreaterThan(assertions.deepZoomMin);
  }

  if (assertions.parentLinkPipe) {
    expect(await page.locator('.topoviewer-edge-pipe-fill').count()).toBeGreaterThan(0);
    expect(await page.locator('.topoviewer-edge-lane').count()).toBeGreaterThan(0);
  }

  if (assertions.floatingAnchors) {
    expect(await page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThan(0);
  }

  if (assertions.pinsAndLeaders) {
    await expect(page.locator('.react-flow__node-pin')).toHaveCount(2);
    await expect(page.locator('.react-flow__edge[data-id="access-line:leader"]')).toBeVisible();
    await expect(page.locator('.react-flow__edge[data-id="pin-callout:leader"]')).toBeVisible();
  }
}

test.describe('MkDocs TopoViewer documented examples', () => {
  test.skip(!firstPublicExample, `MkDocs public TopoViewer output is missing: ${rtfmPublic}`);

  test.beforeAll(async () => {
    const port = 8800 + Math.floor(Math.random() * 200);
    baseURL = `http://127.0.0.1:${port}`;
    server = childProcess.spawn('python3', ['-m', 'http.server', String(port), '--directory', rtfmPublic], {
      stdio: 'ignore'
    });
    await waitForServer(`${baseURL}/${firstPublicExample.page}/`);
  });

  test.afterAll(() => {
    if (server) server.kill();
  });

  for (const example of renderableExamples) {
    test(`renders documented example: ${example.id}`, async ({ page }) => {
      test.skip(!hasPublicExample(example), `MkDocs example output is missing: ${pageIndexPath(example)}`);
      const browserErrors = [];
      page.on('pageerror', (error) => browserErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') browserErrors.push(message.text());
      });

      await openExample(page, example);
      await expectGenericExample(page, example);
      await expectControlAssertions(page, example);
      await expectNoBrowserErrors(page, browserErrors);
    });
  }

  for (const example of examples.filter((item) => item.expected?.renderable === false)) {
    test(`documents non-renderable validation fixture: ${example.id}`, async ({ page }) => {
      test.skip(!hasPublicExample(example), `MkDocs validation page output is missing: ${pageIndexPath(example)}`);
      await page.goto(exampleUrl(example), { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.admonition.warning, .admonition-title', { hasText: 'Non-renderable validation fixture' }).first()).toBeVisible();
      await expect(page.locator('.topoviewer-embed')).toHaveCount(0);
    });
  }

  test('renders category navigation with examples as page sections', async ({ page }) => {
    const graphExamples = examples.filter((example) => example.feature === 'graph');
    test.skip(!hasPublicCategory('graph'), `MkDocs category output is missing: ${categoryIndexPath('graph')}`);

    await page.goto(categoryUrl('graph'), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Graph/);
    await expect(page.locator('main h1', { hasText: 'Graph' })).toBeVisible();

    for (const example of graphExamples) {
      await expect(page.locator('main h2', { hasText: example.title })).toBeVisible();
      await expect(page.locator('.md-nav--secondary')).toContainText(example.title);
    }

    await expect(page.locator('.topoviewer-embed')).toHaveCount(graphExamples.length);
  });

  test('renders callout markdown headings, inline formatting, and embedded images', async ({ page }) => {
    const example = examples.find((item) => item.expected?.assertions?.markdownCallout);
    test.skip(!example || !hasPublicExample(example), 'No published markdown callout example is available.');
    await openExample(page, example);

    const markdownCallout = page.locator('.topoviewer-callout', {
      has: page.locator('.topoviewer-callout-title', { hasText: 'Markdown Callout' })
    });
    await expect(markdownCallout.locator('.topoviewer-callout-body h3', { hasText: 'Graph node target' })).toBeVisible();
    await expect(markdownCallout.locator('.topoviewer-callout-body code', { hasText: 'PE1' })).toBeVisible();
    await expect(markdownCallout.locator('.topoviewer-callout-body strong', { hasText: 'graph.nodes' })).toBeVisible();
    await expect(markdownCallout.locator('.topoviewer-callout-body img[alt="Tiny topology badge"]')).toBeVisible();
  });

  test('renders geometry-only shapes without legacy label, body, or image nodes', async ({ page }) => {
    const example = examples.find((item) => item.expected?.assertions?.shapeRotation);
    test.skip(!example || !hasPublicExample(example), 'No published geometry-shape example is available.');
    await openExample(page, example);

    await expect(page.locator('.topoviewer-shape-geometry')).toHaveCount(example.expected.dom.shapes);
    await expect(page.locator('.topoviewer-shape-label')).toHaveCount(0);
    await expect(page.locator('.topoviewer-shape-body')).toHaveCount(0);
    await expect(page.locator('.topoviewer-shape-image')).toHaveCount(0);
    await expect(page.locator('.topoviewer-shape-cuboid .topoviewer-shape-geometry g')).toHaveAttribute('transform', 'rotate(-6 50 50)');
  });

  test('renders stitched child service paths inside a parent transport path', async ({ page }) => {
    const example = examples.find((item) => item.expected?.assertions?.stitchedChildPaths);
    test.skip(!example || !hasPublicExample(example), 'No published stitched child-path example is available.');
    await openExample(page, example);

    await expect(page.locator('.react-flow__node[data-id="services-1-10-agg1"]')).toBeVisible();
    await expect(page.locator('.react-flow__node[data-id="services-1-10-agg2"]')).toBeVisible();
    await expect(page.locator('.topoviewer-edge-pipe-fill')).toHaveCount(4);
    await expect(page.locator('.topoviewer-edge-lane')).toHaveCount(6);
    await expect(page.locator('.topoviewer-edge-lane-stub')).toHaveCount(2);
  });
});
