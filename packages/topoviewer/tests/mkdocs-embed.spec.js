import { test, expect } from '@playwright/test';
import * as childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const rtfmPublic = process.env.TOPOVIEWER_MKDOCS_PUBLIC
  ? path.resolve(process.env.TOPOVIEWER_MKDOCS_PUBLIC)
  : path.join(repoRoot, 'site');
const contentExamplesRoot = path.join(packageRoot, 'content/examples');
const catalogPath = path.join(contentExamplesRoot, 'catalog.yaml');

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
}

function exampleFile(example, fileName) {
  const key = {
    'README.md': 'readme',
    'topology.yaml': 'topology',
    'stylesheet.yaml': 'stylesheet',
    'expected.yaml': 'expected'
  }[fileName];
  const configured = key ? example.sourceFiles?.[key] : undefined;
  return configured
    ? path.join(contentExamplesRoot, configured)
    : path.join(contentExamplesRoot, example.sourcePath || example.path, fileName);
}

function loadExamples() {
  if (!fs.existsSync(catalogPath)) return [];
  const catalog = readYaml(catalogPath);
  return (catalog.examples || []).map((example) => ({
    ...example,
    expected: readYaml(exampleFile(example, 'expected.yaml'))
  }));
}

const examples = loadExamples();
const renderableExamples = examples.filter((example) => example.expected?.renderable !== false);
const MKDOCS_ALLOWED_BROWSER_ERROR_PATTERNS = [
  /Download the React DevTools/,
  /gitlabe2\.ext\.net\.nokia\.com\/api\/v4\/projects\/aarafat%2Frtfm/,
  /api\.github\.com\/repos\/asadarafat\/topoviewer/,
  /blocked by CORS policy/,
  /Failed to load resource: net::ERR_FAILED/,
  /^Failed to load resource:/
];

function pageIndexPath(example) {
  return path.join(rtfmPublic, example.page, 'index.html');
}

function categoryIndexPath(feature) {
  return path.join(rtfmPublic, 'topoviewer/reference', feature, 'index.html');
}

function publicPageIndexPath(relativePath) {
  return path.join(rtfmPublic, relativePath, 'index.html');
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
    } catch {
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

async function clickZoomControl(page, direction, count) {
  const label = direction === 'in' ? 'Zoom In' : 'Zoom Out';
  const selector = `.react-flow__controls-${direction === 'in' ? 'zoomin' : 'zoomout'}, .topoviewer-viewport-control-button[aria-label="${label}"]`;
  for (let index = 0; index < Number(count || 0); index += 1) {
    const control = page.locator(selector);
    const disabled = await control.evaluate((element) => element.disabled);
    if (disabled) break;
    await control.click();
    await page.waitForTimeout(90);
  }
}

async function clickNodeById(page, id) {
  const node = page.locator(`.react-flow__node[data-id="${id}"]`);
  if (String(id).startsWith('region:')) {
    const box = await node.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      const point = await page.evaluate(({ targetId, left, right, top, bottom }) => {
        for (let y = top + 6; y < bottom - 6; y += 16) {
          for (let x = left + 6; x < right - 6; x += 16) {
            const hitId = document.elementFromPoint(x, y)?.closest('.react-flow__node')?.getAttribute('data-id');
            if (hitId === targetId) return { x, y };
          }
        }
        return undefined;
      }, {
        targetId: id,
        left: Math.max(0, box.x),
        right: Math.min(viewport.width, box.x + box.width),
        top: Math.max(0, box.y),
        bottom: Math.min(viewport.height, box.y + box.height)
      });
      if (point) {
        await page.mouse.click(point.x, point.y);
        await page.waitForTimeout(120);
        return;
      }
    }
  }
  await node.click({ force: true });
  await page.waitForTimeout(120);
}

async function openExample(page, example) {
  await page.goto(exampleUrl(example), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.topoviewer-embed', { timeout: 30000 });
}

async function openEmbedControls(page) {
  if (await page.locator('.topoviewer-embed-controls').count() === 0) {
    await page.locator('.topoviewer-controls-toggle').first().click();
  }
  await expect(page.locator('.topoviewer-embed-controls').first()).toBeVisible();
}

async function setLayerChecked(page, layerName, checked) {
  const input = page.locator('.topoviewer-embed-check', { hasText: layerName }).locator('input').first();
  if ((await input.isChecked()) !== checked) {
    await input.click();
  }
  if (checked) {
    await expect(input).toBeChecked();
  } else {
    await expect(input).not.toBeChecked();
  }
  await page.waitForTimeout(250);
}

async function setEmbedCheck(page, label, checked) {
  const input = page.locator('.topoviewer-embed-check', { hasText: label }).locator('input').first();
  await expect(input).toBeVisible();
  if ((await input.isChecked()) !== checked) {
    await input.click();
  }
  if (checked) {
    await expect(input).toBeChecked();
  } else {
    await expect(input).not.toBeChecked();
  }
  await page.waitForTimeout(150);
}

async function nodeBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"]`);
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, `node ${id} should have a visible bounding box`).toBeTruthy();
  return box;
}

async function dragNodeNearPeer(page, draggedId, peerId, offset = { x: 4, y: 2 }) {
  const dragBefore = await nodeBox(page, draggedId);
  const peerBefore = await nodeBox(page, peerId);
  const pointerOffset = {
    x: dragBefore.width / 2,
    y: dragBefore.height / 2
  };
  await page.mouse.move(dragBefore.x + pointerOffset.x, dragBefore.y + pointerOffset.y);
  await page.mouse.down();
  await page.mouse.move(
    peerBefore.x + pointerOffset.x + offset.x,
    peerBefore.y + pointerOffset.y + offset.y,
    { steps: 12 }
  );
}

async function expectRenderedCounts(page, { nodes, edges, regions }) {
  if (nodes !== undefined) {
    await expect(page.locator('.react-flow__node-network')).toHaveCount(nodes);
  }
  if (edges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count()).toBe(edges);
  }
  if (regions !== undefined) {
    await expect(page.locator('.react-flow__node-region')).toHaveCount(regions);
  }
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

async function expectVisibleEdgePaintArea(page) {
  const collapsedEdgeSvgIds = await page.locator('.react-flow__edges svg').evaluateAll((svgs) => (
    svgs
      .filter((svg) => svg.querySelector('.topoviewer-edge-visible-path'))
      .map((svg, index) => {
        const box = svg.getBoundingClientRect();
        return {
          index,
          width: box.width,
          height: box.height,
          edges: [...svg.querySelectorAll('.react-flow__edge')].map((edge) => edge.getAttribute('data-id'))
        };
      })
      .filter((entry) => entry.width < 1 || entry.height < 1)
  ));
  expect(collapsedEdgeSvgIds).toEqual([]);
}

function collectBrowserErrors(page, browserErrors) {
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    browserErrors.push(text);
  });
}

async function expectNoBrowserErrors(page, browserErrors) {
  const actionableErrors = browserErrors.filter((line) => {
    return !MKDOCS_ALLOWED_BROWSER_ERROR_PATTERNS.some((pattern) => pattern.test(line));
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
  if (expected.texts !== undefined) {
    await expect(page.locator('.topoviewer-text')).toHaveCount(expected.texts);
  }
  if (expected.minVisibleEdges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(expected.minVisibleEdges);
    await expectVisibleEdgePaintArea(page);
  }
  if (expected.minRegions !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-region').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(expected.minRegions);
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

  if (assertions.nodeShapeTypes) {
    for (const shapeType of String(assertions.nodeShapeTypes).split(',').map((item) => item.trim()).filter(Boolean)) {
      await expect(page.locator(`.topoviewer-node-geometry[data-node-shape="${shapeType}"]`).first()).toBeVisible();
    }
  }

  if (assertions.nodeLabelPositions) {
    for (const position of String(assertions.nodeLabelPositions).split(',').map((item) => item.trim()).filter(Boolean)) {
      await expect(page.locator(`.topoviewer-node-label[data-label-position="${position}"]`).first()).toBeVisible();
    }
  }

  if (assertions.nodeLabelsWithBackgroundMin !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-node-label').evaluateAll((labels) => {
      return labels.filter((label) => {
        const style = getComputedStyle(label);
        return style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent';
      }).length;
    })).toBeGreaterThanOrEqual(Number(assertions.nodeLabelsWithBackgroundMin));
  }

  if (assertions.nodeOutlinesMin !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-node-geometry-outline').evaluateAll((shapes) => {
      return shapes.filter((shape) => {
        const style = getComputedStyle(shape);
        return style.display !== 'none' && Number.parseFloat(style.strokeWidth || '0') > 0;
      }).length;
    })).toBeGreaterThanOrEqual(Number(assertions.nodeOutlinesMin));
  }

  if (assertions.nodeUnderlaysMin !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-node-geometry-underlay').evaluateAll((shapes) => {
      return shapes.filter((shape) => {
        const style = getComputedStyle(shape);
        return style.display !== 'none' && style.fill && style.fill !== 'none' && style.fill !== 'rgba(0, 0, 0, 0)';
      }).length;
    })).toBeGreaterThanOrEqual(Number(assertions.nodeUnderlaysMin));
  }

  if (assertions.nodeBorderDashMin !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-node-geometry-shape').evaluateAll((shapes) => {
      return shapes.filter((shape) => {
        const style = getComputedStyle(shape);
        return style.strokeDasharray && style.strokeDasharray !== 'none';
      }).length;
    })).toBeGreaterThanOrEqual(Number(assertions.nodeBorderDashMin));
  }

  if (assertions.nodeBadgesMin !== undefined) {
    await expect(page.locator('.topoviewer-node-badge')).toHaveCount(Number(assertions.nodeBadgesMin));
  }

  if (assertions.nodeBadgeText) {
    await expect(page.locator('.topoviewer-node-badge', { hasText: String(assertions.nodeBadgeText) }).first()).toBeVisible();
  }

  if (assertions.nodeStatusesMin !== undefined) {
    await expect(page.locator('.topoviewer-node-status')).toHaveCount(Number(assertions.nodeStatusesMin));
  }

  if (assertions.iconFitValues) {
    for (const fit of String(assertions.iconFitValues).split(',').map((item) => item.trim()).filter(Boolean)) {
      await expect.poll(async () => page.locator('.topoviewer-node-icon-image').evaluateAll((images, value) => {
        return images.some((image) => getComputedStyle(image).objectFit === value);
      }, fit)).toBe(true);
    }
  }

  if (assertions.customPolygonShape) {
    await expect(page.locator('.topoviewer-node-geometry[data-node-shape="polygon"] polygon.topoviewer-node-geometry-shape').first()).toBeVisible();
    const points = await page.locator('.topoviewer-node-geometry[data-node-shape="polygon"] polygon.topoviewer-node-geometry-shape').first().getAttribute('points');
    expect(points).toContain('50,10');
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
    await clickZoomControl(page, 'in', 20);
    const zoom = await page.evaluate(currentZoomScript);
    expect(zoom).toBeGreaterThan(assertions.deepZoomMin);
  }

  if (assertions.initialVisibleEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-visible-path')).toHaveCount(Number(assertions.initialVisibleEdges));
  }
  if (assertions.linkAggregateEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-aggregate')).toHaveCount(Number(assertions.linkAggregateEdges));
  }
  if (assertions.edgeLabels) {
    await expect(page.locator('.topoviewer-edge-label').first()).toBeVisible();
  }
  if (assertions.edgeDashPatterns) {
    const expectedPatterns = String(assertions.edgeDashPatterns)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const renderedPatterns = await page.locator('.topoviewer-edge-visible-path').evaluateAll((paths) => (
      paths
        .map((path) => window.getComputedStyle(path).strokeDasharray.replace(/px/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim())
        .filter((value) => value && value !== 'none')
    ));
    expectedPatterns.forEach((pattern) => {
      expect(renderedPatterns).toContain(pattern);
    });
  }
  if (assertions.edgeDashOffsets) {
    const expectedOffsets = String(assertions.edgeDashOffsets)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const renderedOffsets = await page.locator('.topoviewer-edge-visible-path').evaluateAll((paths) => (
      paths
        .map((path) => window.getComputedStyle(path).strokeDashoffset.replace(/px/g, '').trim())
        .filter((value) => value !== '')
    ));
    expectedOffsets.forEach((offset) => {
      expect(renderedOffsets).toContain(offset);
    });
  }
  if (assertions.edgeMarkersMin !== undefined) {
    await expect.poll(async () => page.locator('svg marker').count()).toBeGreaterThanOrEqual(Number(assertions.edgeMarkersMin));
  }
  if (assertions.edgeLinearGradientsMin !== undefined) {
    await expect.poll(async () => page.locator('svg linearGradient').count()).toBeGreaterThanOrEqual(Number(assertions.edgeLinearGradientsMin));
  }
  if (assertions.edgeGradientStopsMin !== undefined) {
    await expect.poll(async () => page.locator('svg linearGradient stop').count()).toBeGreaterThanOrEqual(Number(assertions.edgeGradientStopsMin));
  }
  if (assertions.edgePathsWithMultipleSegmentsMin !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').evaluateAll((paths) => {
      return paths.filter((path) => ((path.getAttribute('d') || '').match(/[Ll]/g) || []).length >= 3).length;
    })).toBeGreaterThanOrEqual(Number(assertions.edgePathsWithMultipleSegmentsMin));
  }
  if (assertions.edgeLabelText) {
    const edgeLabels = page.locator('.topoviewer-edge-label', { hasText: String(assertions.edgeLabelText) });
    if (assertions.edgeLabelTextCount !== undefined) {
      await expect(edgeLabels).toHaveCount(Number(assertions.edgeLabelTextCount));
    } else {
      await expect(edgeLabels.first()).toBeVisible();
    }
  }
  if (assertions.sourceEdgeLabelText) {
    await expect(page.locator('.topoviewer-edge-label-source', { hasText: String(assertions.sourceEdgeLabelText) }).first()).toBeVisible();
  }
  if (assertions.targetEdgeLabelText) {
    await expect(page.locator('.topoviewer-edge-label-target', { hasText: String(assertions.targetEdgeLabelText) }).first()).toBeVisible();
  }
  if (assertions.labelZIndexValues) {
    const expectedValues = String(assertions.labelZIndexValues)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    await expect.poll(async () => page.locator('[data-label-z-index]').count()).toBeGreaterThanOrEqual(expectedValues.length);
    const renderedValues = await page.locator('[data-label-z-index]').evaluateAll((labels) => (
      labels.map((label) => label.getAttribute('data-label-z-index')).filter(Boolean)
    ));
    expectedValues.forEach((value) => {
      expect(renderedValues).toContain(value);
    });
  }
  if (assertions.labelPointerEventsNoneText) {
    const label = page.locator('.topoviewer-edge-label', { hasText: String(assertions.labelPointerEventsNoneText) }).first();
    await expect(label).toBeVisible();
    await expect.poll(async () => label.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
  }

  if (assertions.zoomInClicks) {
    await clickZoomControl(page, 'in', assertions.zoomInClicks);
  }
  if (assertions.zoomInMinZoom !== undefined) {
    const zoom = await page.evaluate(currentZoomScript);
    expect(zoom).toBeGreaterThanOrEqual(Number(assertions.zoomInMinZoom));
  }
  if (assertions.zoomedGraphNodes !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-network').count()).toBe(Number(assertions.zoomedGraphNodes));
  }
  if (assertions.zoomedMinVisibleEdges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThanOrEqual(Number(assertions.zoomedMinVisibleEdges));
  }
  if (assertions.zoomedMinRegions !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-region').count()).toBeGreaterThanOrEqual(Number(assertions.zoomedMinRegions));
  }
  if (assertions.zoomOutClicks) {
    await clickZoomControl(page, 'out', assertions.zoomOutClicks);
  }
  if (assertions.zoomOutMaxZoom !== undefined) {
    const zoom = await page.evaluate(currentZoomScript);
    expect(zoom).toBeLessThanOrEqual(Number(assertions.zoomOutMaxZoom));
  }
  if (assertions.zoomedOutGraphNodes !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-network').count()).toBe(Number(assertions.zoomedOutGraphNodes));
  }
  if (assertions.zoomedOutMinVisibleEdges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThanOrEqual(Number(assertions.zoomedOutMinVisibleEdges));
  }
  if (assertions.zoomedOutRegions !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-region').count()).toBe(Number(assertions.zoomedOutRegions));
  }

  if (assertions.parentLinkPipe) {
    expect(await page.locator('.topoviewer-edge-pipe-fill').count()).toBeGreaterThan(0);
    expect(await page.locator('.topoviewer-edge-lane').count()).toBeGreaterThan(0);
  }

  if (assertions.linkDirections) {
    await expect(page.locator('.topoviewer-edge-direction-stroke')).toHaveCount(2);
    await expect(page.locator('.topoviewer-edge-direction-marker-carrier')).toHaveCount(2);
    const directionGeometry = await page.locator('.topoviewer-edge-direction-stroke').evaluateAll((paths) => {
      return paths.map((path) => {
        const length = path.getTotalLength();
        const start = path.getPointAtLength(0);
        const end = path.getPointAtLength(length);
        const style = window.getComputedStyle(path);
        return {
          direction: path.getAttribute('data-direction'),
          d: path.getAttribute('d') || '',
          length,
          start: { x: start.x, y: start.y },
          end: { x: end.x, y: end.y },
          strokeWidth: style.strokeWidth
        };
      });
    });
    const markerGeometry = await page.locator('.topoviewer-edge-direction-marker-carrier').evaluateAll((paths) => {
      return paths.map((path) => {
        const length = path.getTotalLength();
        const end = path.getPointAtLength(length);
        const markerId = (path.getAttribute('marker-end') || '').match(/#([^)"]+)/)?.[1];
        const marker = markerId ? document.getElementById(markerId) : null;
        return {
          direction: path.getAttribute('data-direction'),
          end: { x: end.x, y: end.y },
          markerWidth: marker?.getAttribute('markerWidth')
        };
      });
    });
    const sourceToTarget = directionGeometry.find((path) => path.direction === 'sourceToTarget');
    const targetToSource = directionGeometry.find((path) => path.direction === 'targetToSource');
    const sourceToTargetMarker = markerGeometry.find((path) => path.direction === 'sourceToTarget');
    const targetToSourceMarker = markerGeometry.find((path) => path.direction === 'targetToSource');
    expect(sourceToTarget?.d).toMatch(/^M /);
    expect(targetToSource?.d).toMatch(/^M /);
    expect(sourceToTarget?.length).toBeGreaterThan(40);
    expect(targetToSource?.length).toBeGreaterThan(40);
    expect(Number.parseFloat(sourceToTarget?.strokeWidth || '0')).toBeCloseTo(16);
    expect(Number.parseFloat(targetToSource?.strokeWidth || '0')).toBeCloseTo(16);
    expect(Number(sourceToTargetMarker?.markerWidth)).toBeCloseTo(16);
    expect(Number(targetToSourceMarker?.markerWidth)).toBeCloseTo(16);
    expect(Math.hypot(
      Number(sourceToTargetMarker?.end.x || 0) - Number(sourceToTarget?.end.x || 0),
      Number(sourceToTargetMarker?.end.y || 0) - Number(sourceToTarget?.end.y || 0)
    )).toBeGreaterThan(8);
    expect(Math.hypot(
      Number(targetToSourceMarker?.end.x || 0) - Number(targetToSource?.end.x || 0),
      Number(targetToSourceMarker?.end.y || 0) - Number(targetToSource?.end.y || 0)
    )).toBeGreaterThan(8);
    const labelTransforms = await page.locator('.topoviewer-edge-label-center').evaluateAll((labels) => {
      return labels.map((label) => ({
        text: label.textContent?.trim() || '',
        transform: label.style.transform
      }));
    });
    const transformY = (text) => {
      const transform = labelTransforms.find((label) => label.text === text)?.transform || '';
      const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      return match ? Number(match[2]) : undefined;
    };
    const parentLabelY = transformY('Leaf-1 to Spine-1');
    const eastboundLabelY = transformY('3.2 Gbps');
    const westboundLabelY = transformY('1.1 Gbps');
    expect(parentLabelY).toBeLessThan(Math.min(Number(eastboundLabelY), Number(westboundLabelY)));
    const centerGap = Math.hypot(
      Number(sourceToTargetMarker?.end.x || 0) - Number(targetToSourceMarker?.end.x || 0),
      Number(sourceToTargetMarker?.end.y || 0) - Number(targetToSourceMarker?.end.y || 0)
    );
    expect(centerGap).toBeGreaterThan(30);
  }

  if (assertions.floatingAnchors) {
    expect(await page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThan(0);
  }

  if (assertions.pinsAndLeaders) {
    await expect(page.locator('.react-flow__node-pin')).toHaveCount(2);
    await expect(page.locator('.react-flow__edge[data-id="access-line:leader"]')).toBeVisible();
    await expect(page.locator('.react-flow__edge[data-id="pin-callout:leader"]')).toBeVisible();
  }

  if (assertions.attentionClickNode) {
    await clickNodeById(page, assertions.attentionClickNode);
  }
  if (assertions.attentionClickEdge) {
    await page.locator(`.react-flow__edge[data-id="${assertions.attentionClickEdge}"]`).click({ force: true });
  }

  if (assertions.expandClickNode) {
    await clickNodeById(page, assertions.expandClickNode);
  }
  if (assertions.expandClickEdge) {
    const expandControl = page.locator('.topoviewer-link-group-expand-button');
    if (await expandControl.count()) await expandControl.click();
    else await page.locator(`.react-flow__edge[data-id="${assertions.expandClickEdge}"]`).click({ force: true });
  }
  if (assertions.expandedGraphNodes !== undefined) {
    await expect(page.locator('.react-flow__node-network')).toHaveCount(Number(assertions.expandedGraphNodes));
  }
  if (assertions.expandedVisibleEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-visible-path')).toHaveCount(Number(assertions.expandedVisibleEdges));
  }
  if (assertions.expandedUniqueEdgeTransforms !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').evaluateAll((paths) => {
      return new Set(paths.map((item) => item.getAttribute('transform') || 'none')).size;
    })).toBe(Number(assertions.expandedUniqueEdgeTransforms));
  }
  if (assertions.expandedUniqueEdgePaths !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').evaluateAll((paths) => {
      return new Set(paths.map((item) => item.getAttribute('d') || '')).size;
    })).toBe(Number(assertions.expandedUniqueEdgePaths));
  }
  if (assertions.expandedMinVisibleEdges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThanOrEqual(Number(assertions.expandedMinVisibleEdges));
  }
  if (assertions.expandedMinRegions !== undefined) {
    await expect.poll(async () => page.locator('.react-flow__node-region').count()).toBeGreaterThanOrEqual(Number(assertions.expandedMinRegions));
  }
  if (assertions.linkAggregateEdgesAfterExpand !== undefined) {
    await expect(page.locator('.topoviewer-edge-aggregate')).toHaveCount(Number(assertions.linkAggregateEdgesAfterExpand));
  }
  if (assertions.collapseLinkGroupButton) {
    await page.getByRole('button', { name: assertions.collapseLinkGroupButton }).click();
  }
  if (assertions.collapseClickNode) {
    await clickNodeById(page, assertions.collapseClickNode);
  }
  if (assertions.collapsedGraphNodes !== undefined) {
    await expect(page.locator('.react-flow__node-network')).toHaveCount(Number(assertions.collapsedGraphNodes));
  }
  if (assertions.collapsedMinVisibleEdges !== undefined) {
    await expect.poll(async () => page.locator('.topoviewer-edge-visible-path').count()).toBeGreaterThanOrEqual(Number(assertions.collapsedMinVisibleEdges));
  }
  if (assertions.collapsedVisibleEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-visible-path')).toHaveCount(Number(assertions.collapsedVisibleEdges));
  }
  if (assertions.collapsedRegions !== undefined) {
    await expect(page.locator('.react-flow__node-region')).toHaveCount(Number(assertions.collapsedRegions));
  }
  if (assertions.linkAggregateEdgesAfterCollapse !== undefined) {
    await expect(page.locator('.topoviewer-edge-aggregate')).toHaveCount(Number(assertions.linkAggregateEdgesAfterCollapse));
  }

  if (assertions.attentionFocusedNodes !== undefined) {
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(Number(assertions.attentionFocusedNodes));
  }
  if (assertions.attentionFocusedEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(Number(assertions.attentionFocusedEdges));
  }
  if (assertions.attentionRelatedNodes !== undefined) {
    await expect(page.locator('.topoviewer-node-attention-related')).toHaveCount(Number(assertions.attentionRelatedNodes));
  }
  if (assertions.attentionRelatedEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-attention-related')).toHaveCount(Number(assertions.attentionRelatedEdges));
  }
  if (assertions.attentionDimmedNodes !== undefined) {
    expect(await page.locator('.topoviewer-node-attention-dimmed').count()).toBeGreaterThanOrEqual(Number(assertions.attentionDimmedNodes));
  }
  if (assertions.attentionDimmedEdges !== undefined) {
    expect(await page.locator('.topoviewer-edge-attention-dimmed').count()).toBeGreaterThanOrEqual(Number(assertions.attentionDimmedEdges));
  }
  if (assertions.attentionHiddenNodes !== undefined) {
    await expect(page.locator('.react-flow__node-network.hidden')).toHaveCount(Number(assertions.attentionHiddenNodes));
  }
  if (assertions.attentionHiddenEdges !== undefined) {
    await expect(page.locator('.react-flow__edge.hidden')).toHaveCount(Number(assertions.attentionHiddenEdges));
  }
  if (assertions.visibleEdges !== undefined) {
    await expect(page.locator('.topoviewer-edge-visible-path')).toHaveCount(Number(assertions.visibleEdges));
  }

  if (assertions.attentionResetClickPane) {
    await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
  }
  if (assertions.attentionFocusedNodesAfterReset !== undefined) {
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(Number(assertions.attentionFocusedNodesAfterReset));
  }
  if (assertions.attentionFocusedEdgesAfterReset !== undefined) {
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(Number(assertions.attentionFocusedEdgesAfterReset));
  }
  if (assertions.attentionDimmedNodesAfterReset !== undefined) {
    await expect(page.locator('.topoviewer-node-attention-dimmed')).toHaveCount(Number(assertions.attentionDimmedNodesAfterReset));
  }
  if (assertions.attentionDimmedEdgesAfterReset !== undefined) {
    await expect(page.locator('.topoviewer-edge-attention-dimmed')).toHaveCount(Number(assertions.attentionDimmedEdgesAfterReset));
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
      collectBrowserErrors(page, browserErrors);

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
      await expect(page.locator('.md-nav--secondary').first()).toContainText(example.title);
    }

    await expect(page.locator('.topoviewer-embed')).toHaveCount(graphExamples.length);
  });

  test('viewport display controls toggle helper lines in docs embeds', async ({ page }) => {
    const pagePath = 'topoviewer/examples/graph/basic';
    test.skip(!fs.existsSync(publicPageIndexPath(pagePath)), `Graph basic example output is missing: ${publicPageIndexPath(pagePath)}`);

    await page.goto(`${baseURL}/${pagePath}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="R01"]', { timeout: 30000 });
    await openEmbedControls(page);

    await setEmbedCheck(page, 'Helper lines', false);
    await dragNodeNearPeer(page, 'R01', 'R02');
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
    await page.mouse.up();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="R01"]', { timeout: 30000 });
    await openEmbedControls(page);
    await setEmbedCheck(page, 'Helper lines', false);
    await setEmbedCheck(page, 'Helper lines', true);
    await dragNodeNearPeer(page, 'R01', 'R02');
    await expect(page.locator('.topoviewer-helper-line').first()).toBeVisible();
    await page.mouse.up();
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
  });

  test('renders the real network demo as one public multi-view page', async ({ page }) => {
    const pagePath = 'topoviewer/real-network-demo';
    test.skip(!fs.existsSync(publicPageIndexPath(pagePath)), `Real network demo output is missing: ${publicPageIndexPath(pagePath)}`);

    await page.goto(`${baseURL}/${pagePath}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main h1', { hasText: 'Real Network Demo' })).toBeVisible();

    for (const heading of ['Underlay', 'BGP', 'Transport Layer', 'Service Path', 'Failure View']) {
      await expect(page.locator('main h2', { hasText: heading })).toBeVisible();
    }

    await expect(page.locator('.topoviewer-embed')).toHaveCount(5);
    await expect(page.locator('main .tabbed-labels label', { hasText: 'Expected YAML' })).toHaveCount(0);
    await expect(page.locator('main .tabbed-labels label', { hasText: 'Attention YAML' })).toHaveCount(2);
    const underlayEmbed = page.locator('.topoviewer-embed[data-topology*="real-network-underlay/topology.yaml"]');
    await expect(underlayEmbed).toHaveCount(1);
    await expect(underlayEmbed).toHaveAttribute('data-selected-layer-ids', '["underlay"]');
    const bgpEmbed = page.locator('.topoviewer-embed[data-topology*="real-network-bgp/topology.yaml"]');
    await expect(bgpEmbed).toHaveCount(1);
    await expect(bgpEmbed).toHaveAttribute('data-selected-layer-ids', '["underlay","bgp"]');
    const transportEmbed = page.locator('.topoviewer-embed[data-topology*="real-network-transport-layer/topology.yaml"]');
    await expect(transportEmbed).toHaveCount(1);
    await expect(transportEmbed).toHaveAttribute('data-selected-layer-ids', '["underlay","bgp","transport"]');
    const serviceEmbed = page.locator('.topoviewer-embed[data-topology*="real-network-service-path/topology.yaml"]');
    await expect(serviceEmbed).toHaveCount(1);
    await expect(serviceEmbed).toHaveAttribute('data-selected-layer-ids', '["underlay","bgp","transport","service"]');
    const failureEmbed = page.locator('.topoviewer-embed[data-topology*="real-network-failure-view/topology.yaml"]');
    await expect(failureEmbed).toHaveCount(1);
    await expect(failureEmbed).toHaveAttribute('data-selected-layer-ids', '["underlay","bgp","transport","service","operations"]');
  });

  test('real network layer controls hide unchecked layer-owned geometry', async ({ page }) => {
    const bgpPagePath = 'topoviewer/examples/use-cases/service-provider-network/bgp';
    const transportPagePath = 'topoviewer/examples/use-cases/service-provider-network/transport-layer';
    test.skip(!fs.existsSync(publicPageIndexPath(bgpPagePath)), `Real network BGP output is missing: ${publicPageIndexPath(bgpPagePath)}`);
    test.skip(!fs.existsSync(publicPageIndexPath(transportPagePath)), `Real network transport output is missing: ${publicPageIndexPath(transportPagePath)}`);

    await page.goto(`${baseURL}/${bgpPagePath}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__renderer', { timeout: 30000 });
    await expectRenderedCounts(page, { nodes: 5, edges: 5, regions: 3 });
    await openEmbedControls(page);

    await setLayerChecked(page, 'Underlay', false);
    await expectRenderedCounts(page, { nodes: 3, edges: 2, regions: 0 });
    await expect(page.locator('.react-flow__node[data-id="p-ams-1"]')).toHaveCount(0);
    await expect(page.locator('.react-flow__node[data-id="p-par-1"]')).toHaveCount(0);

    await setLayerChecked(page, 'Underlay', true);
    await setLayerChecked(page, 'BGP', false);
    await expectRenderedCounts(page, { nodes: 4, edges: 3, regions: 3 });
    await expect(page.locator('.react-flow__node[data-id="rr-ams-1"]')).toHaveCount(0);

    await page.goto(`${baseURL}/${transportPagePath}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__renderer', { timeout: 30000 });
    await expectRenderedCounts(page, { nodes: 5, edges: 8, regions: 3 });
    await openEmbedControls(page);

    await setLayerChecked(page, 'BGP', false);
    await expectRenderedCounts(page, { nodes: 4, edges: 6, regions: 3 });
    await expect(page.locator('.react-flow__node[data-id="rr-ams-1"]')).toHaveCount(0);

    await setLayerChecked(page, 'Underlay', false);
    await expectRenderedCounts(page, { nodes: 4, edges: 3, regions: 0 });
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
