import { test, expect } from '@playwright/test';
import {
  canonicalFooterText,
  canonicalServicesToggleName,
  canonicalWorkbenchLayers,
  canonicalWorkbenchToggles
} from './workbench-helpers.js';
import { expectCurrentServerMarker } from './server-marker.js';

const NODE_CONTAINMENT_TOLERANCE_PX = 3;
const ALLOWED_BROWSER_ERROR_PATTERNS = [
  /Download the React DevTools/
];

async function openWorkbench(page) {
  const browserErrors = [];

  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await expectCurrentServerMarker(page, 'topoviewer');
  await page.goto('/');
  await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
  await expect(page.locator('footer')).toContainText(canonicalFooterText(), { timeout: 10000 });

  return browserErrors;
}

function actionableErrors(browserErrors) {
  return browserErrors.filter((line) => !ALLOWED_BROWSER_ERROR_PATTERNS.some((pattern) => pattern.test(line)));
}

async function setCheckboxByLabel(page, name, checked) {
  const checkbox = page.getByRole('checkbox', { name, exact: true });
  const label = page.locator('label').filter({ has: checkbox }).first();

  await expect(checkbox).toHaveCount(1);
  await expect(checkbox).toBeEnabled();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const isAlreadyChecked = await checkbox.isChecked();
    if (isAlreadyChecked === checked) {
      await expect.poll(() => checkbox.isChecked(), {
        message: `checkbox "${name}" should be ${checked ? 'checked' : 'unchecked'}`
      }).toBe(checked);
      return;
    }

    try {
      await checkbox.setChecked(checked);
    } catch {
      const labelCount = await label.count();
      if (labelCount > 0) {
        await label.click();
      } else {
        await checkbox.click({ force: true });
      }
    }
    await settleReact(page);
  }

  const lastState = await checkbox.isChecked() ? 'checked' : 'unchecked';
  throw new Error(
    `Failed to set checkbox "${name}" to ${checked ? 'checked' : 'unchecked'}. Last state: ${lastState}`
  );
}

function isNavigationRace(error) {
  const message = String(error?.message || error);
  return message.includes('Execution context was destroyed')
    || message.includes('Cannot find context')
    || message.includes('navigation');
}

async function waitForWorkbenchReady(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
  await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
}

async function withNavigationRetry(page, action) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (!isNavigationRace(error)) throw error;

      await waitForWorkbenchReady(page);
    }
  }

  return action();
}

async function settleReact(page) {
  await withNavigationRetry(page, () => page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  })));
}

async function setPermutation(page, selectedLayers, enabledToggles) {
  for (const name of canonicalWorkbenchLayers) {
    await setCheckboxByLabel(page, name, selectedLayers.has(name));
  }

  for (const name of canonicalWorkbenchToggles) {
    await setCheckboxByLabel(page, name, enabledToggles.has(name));
  }

  await settleReact(page);
}

async function waitForRegionVisibility(page, expectsRegions, label) {
  let lastSnapshot = { nodeIds: [], allNodeIds: [] };
  try {
    await expect.poll(async () => {
      lastSnapshot = await renderedSnapshot(page);
      const regionNodeCount = lastSnapshot.nodeIds.filter((id) => id?.startsWith('region:')).length;
      return expectsRegions ? regionNodeCount > 0 : regionNodeCount === 0;
    }, {
      intervals: [100, 250, 500, 1000],
      timeout: 15000
    }).toBe(true);
  } catch (error) {
    const regionNodeCount = lastSnapshot.nodeIds.filter((id) => id?.startsWith('region:')).length;
    throw new Error([
      `${label}: region visibility did not settle`,
      `expected=${expectsRegions ? 'visible' : 'hidden'}`,
      `lastRegionNodeCount=${regionNodeCount}`,
      `lastVisibleNodeIds=[${lastSnapshot.nodeIds.join(', ')}]`,
      `lastAllNodeIds=[${lastSnapshot.allNodeIds.join(', ')}]`,
      String(error?.message || error)
    ].join('\n'));
  }
}

async function waitForEdgeLabelVisibility(page, expectsLabels, label) {
  let lastSnapshot = { edgeCount: 0, edgeLabelCount: 0 };
  try {
    await expect.poll(async () => {
      lastSnapshot = await renderedSnapshot(page);
      return expectsLabels ? lastSnapshot.edgeLabelCount > 0 : lastSnapshot.edgeLabelCount === 0;
    }, {
      intervals: [100, 250, 500, 1000],
      timeout: 15000
    }).toBe(true);
  } catch (error) {
    throw new Error([
      `${label}: edge label visibility did not settle`,
      `expected=${expectsLabels ? 'visible' : 'hidden'}`,
      `lastEdgeCount=${lastSnapshot.edgeCount}`,
      `lastEdgeLabelCount=${lastSnapshot.edgeLabelCount}`,
      String(error?.message || error)
    ].join('\n'));
  }
}

async function expectRenderableState(page, label) {
  const snapshot = await renderedSnapshot(page);
  expect(snapshot.hasErrorAlert, `${label}: renderer reported an alert`).toBe(false);
  expect(snapshot.invalidPathCount, `${label}: edge path(s) had invalid SVG data`).toBe(0);
  return snapshot;
}

async function renderedSnapshot(page) {
  return withNavigationRetry(page, () => page.evaluate(() => {
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const nodeElements = [...document.querySelectorAll('.react-flow__node')];
    const edgeLabelElements = [...document.querySelectorAll('.topoviewer-edge-label')];
    const hiddenEdgePaths = [...document.querySelectorAll('.react-flow__edge-path')];
    const visibleEdgePaths = [...document.querySelectorAll('.topoviewer-edge-visible-path')];
    const invalidPath = (pathElement) => {
      const d = pathElement.getAttribute('d') || '';
      return !d || /NaN|undefined|null/.test(d);
    };
    return {
      hasErrorAlert: !!document.querySelector('.MuiAlert-root'),
      nodeIds: nodeElements.filter(isVisible).map((node) => node.dataset.id),
      allNodeIds: nodeElements.map((node) => node.dataset.id),
      edgeCount: document.querySelectorAll('.react-flow__edge').length,
      edgeLabelCount: edgeLabelElements.filter(isVisible).length,
      invalidPathCount: hiddenEdgePaths.filter(invalidPath).length + visibleEdgePaths.filter(invalidPath).length
    };
  }));
}

async function nodeBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"]`);
  await expect(locator, `Expected node ${id} to exist`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `Expected node ${id} to have a rendered box`).toBeTruthy();
  return box;
}

async function nodeLabelBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"] .topoviewer-node-label`);
  await expect(locator, `Expected node ${id} label to exist`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `Expected node ${id} label to have a rendered box`).toBeTruthy();
  return box;
}

function assertInside(outer, inner, tolerance = NODE_CONTAINMENT_TOLERANCE_PX) {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - tolerance);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - tolerance);
  expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + tolerance);
  expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + tolerance);
}

function movedBy(before, after) {
  return {
    dx: after.x - before.x,
    dy: after.y - before.y
  };
}

async function visibleLabelLayout(page) {
  return withNavigationRetry(page, () => page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0.05
        && box.width > 0
        && box.height > 0;
    };
    const labels = [...document.querySelectorAll('.topoviewer-label-overlay, .topoviewer-edge-label')]
      .filter(visible)
      .map((element, index) => {
        const box = element.getBoundingClientRect();
        return {
          id: element.textContent?.trim() || `${element.className}:${index}`,
          role: element.getAttribute('data-label-role') || (element.classList.contains('topoviewer-edge-label') ? 'edge' : 'overlay'),
          zIndex: element.getAttribute('data-label-z-index') || getComputedStyle(element).zIndex,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height
        };
      });
    const overlapArea = (a, b) => {
      const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
      return x * y;
    };
    const overlaps = [];
    for (let i = 0; i < labels.length; i += 1) {
      for (let j = i + 1; j < labels.length; j += 1) {
        const area = overlapArea(labels[i], labels[j]);
        if (area > 1) overlaps.push({ a: labels[i].id, b: labels[j].id, area });
      }
    }
    return { labels, overlaps };
  }));
}

async function dragBox(page, box, dx, dy, offset = { x: 48, y: 28 }) {
  await page.mouse.move(box.x + offset.x, box.y + offset.y);
  await page.mouse.down();
  await page.mouse.move(box.x + offset.x + dx, box.y + offset.y + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

async function topmostNodeDragPoint(page, id) {
  const point = await page.evaluate((nodeId) => {
    const node = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
    if (!node) return null;
    const box = node.getBoundingClientRect();
    const offsets = [
      [24, 24],
      [box.width - 24, 24],
      [24, box.height - 24],
      [box.width - 24, box.height - 24],
      [box.width / 2, 24],
      [box.width / 2, box.height - 24],
      [24, box.height / 2],
      [box.width - 24, box.height / 2]
    ];
    for (let x = 32; x < box.width - 16; x += 32) {
      offsets.push([x, 24], [x, box.height - 24]);
    }
    for (let y = 32; y < box.height - 16; y += 32) {
      offsets.push([24, y], [box.width - 24, y]);
    }
    const isDragSurface = (element) => !!element?.closest?.(
      '.topoviewer-region-drag, .topoviewer-node-drag, .topoviewer-shape-drag, .topoviewer-callout-drag'
    );
    for (const [relativeX, relativeY] of offsets) {
      const x = box.left + Math.max(4, Math.min(box.width - 4, relativeX));
      const y = box.top + Math.max(4, Math.min(box.height - 4, relativeY));
      const topmost = document.elementFromPoint(x, y);
      const topmostNode = topmost?.closest?.('.react-flow__node');
      if (topmostNode?.getAttribute('data-id') === nodeId && isDragSurface(topmost)) {
        return { x, y };
      }
    }
    return null;
  }, id);
  expect(point, `Expected topmost draggable point for ${id}`).toBeTruthy();
  return point;
}

async function dragNodeByTopmostPoint(page, id, dx, dy) {
  const point = await topmostNodeDragPoint(page, id);
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + dx, point.y + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

test.describe('TopoViewer package interactions', () => {
  test('exposes the current runtime accessibility contract', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/accessibility-runtime.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="router-a"]', { timeout: 30000 });

    const focusedNode = page.locator('.react-flow__node[data-id="router-a"] .topoviewer-node');
    await expect(focusedNode).toHaveAttribute('aria-current', 'true');
    await expect(focusedNode).toHaveAttribute('aria-label', /Router A, attention focused/);
    await focusedNode.focus();
    await expect(focusedNode).toBeFocused();

    const snapshot = await page.locator('.topoviewer').evaluate((viewer) => {
      const durationToMs = (duration) => duration
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          if (part.endsWith('ms')) return Number.parseFloat(part);
          if (part.endsWith('s')) return Number.parseFloat(part) * 1000;
          return Number.parseFloat(part) || 0;
        });
      const colorToRgb = (color) => {
        const match = color.match(/rgba?\(([^)]+)\)/);
        if (!match) return undefined;
        const [r, g, b] = match[1].split(',').slice(0, 3).map((part) => Number.parseFloat(part.trim()));
        return [r, g, b];
      };
      const luminance = ([r, g, b]) => {
        const channel = [r, g, b].map((value) => {
          const normalized = value / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
      };
      const contrastRatio = (foreground, background) => {
        const fg = colorToRgb(foreground);
        const bg = colorToRgb(background);
        if (!fg || !bg) return 0;
        const lighter = Math.max(luminance(fg), luminance(bg));
        const darker = Math.min(luminance(fg), luminance(bg));
        return (lighter + 0.05) / (darker + 0.05);
      };
      const focused = viewer.querySelector('.react-flow__node[data-id="router-a"] .topoviewer-node');
      const geometry = focused?.querySelector('.topoviewer-node-geometry');
      const label = focused?.querySelector('.topoviewer-node-label');
      const badge = focused?.querySelector('.topoviewer-node-badge');
      const status = focused?.querySelector('.topoviewer-node-status');
      const visibleEdge = viewer.querySelector('.topoviewer-edge-visible-path');
      const animatedElements = [viewer, ...viewer.querySelectorAll('*')].map((element) => {
        const style = getComputedStyle(element);
        return {
          transitionMs: Math.max(...durationToMs(style.transitionDuration), 0),
          animationMs: Math.max(...durationToMs(style.animationDuration), 0)
        };
      });
      const labelStyle = label ? getComputedStyle(label) : undefined;

      return {
        focusedFilter: geometry ? getComputedStyle(geometry).filter : '',
        labelText: label?.textContent?.trim(),
        badgeText: badge?.textContent?.trim(),
        statusPlacement: status?.getAttribute('data-status-placement'),
        edgeDash: visibleEdge ? getComputedStyle(visibleEdge).strokeDasharray : '',
        labelContrast: labelStyle ? contrastRatio(labelStyle.color, labelStyle.backgroundColor) : 0,
        maxTransitionMs: Math.max(...animatedElements.map((entry) => entry.transitionMs)),
        maxAnimationMs: Math.max(...animatedElements.map((entry) => entry.animationMs))
      };
    });

    expect(snapshot.focusedFilter).toContain('drop-shadow');
    expect(snapshot.labelText).toBe('Router A');
    expect(snapshot.badgeText).toBe('WARN');
    expect(snapshot.statusPlacement).toBe('bottomRight');
    expect(snapshot.edgeDash).not.toBe('none');
    expect(snapshot.labelContrast).toBeGreaterThanOrEqual(4.5);
    expect(snapshot.maxTransitionMs).toBeLessThanOrEqual(0.001);
    expect(snapshot.maxAnimationMs).toBeLessThanOrEqual(0.001);

    await page.keyboard.press('Escape');
    let escapedViewer = false;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await page.keyboard.press('Tab');
      escapedViewer = await page.evaluate(() => document.activeElement?.id === 'after-viewer');
      if (escapedViewer) break;
    }
    expect(escapedViewer).toBe(true);
  });

  test('places dense node, meta, region, endpoint, and direction labels without visible overlap', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/label-collision-runtime.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.topoviewer-label-overlay', { timeout: 30000 });
    await page.waitForSelector('.topoviewer-edge-label', { timeout: 30000 });

    const layout = await visibleLabelLayout(page);
    expect(layout.labels.length).toBeGreaterThanOrEqual(10);
    expect(layout.labels.some((label) => label.role === 'meta')).toBe(true);
    expect(layout.labels.map((label) => label.zIndex)).toEqual(expect.arrayContaining(['40', '70', '80', '90', '91']));
    expect(layout.overlaps).toEqual([]);
  });

  test('renders card node layout inside round-rectangle node bodies', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/card-node-runtime.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="orders-api"] .topoviewer-node-card', { timeout: 30000 });

    const snapshot = await page.locator('.topoviewer').evaluate((viewer) => {
      const node = viewer.querySelector('.react-flow__node[data-id="orders-api"]');
      const card = node?.querySelector('.topoviewer-node-card');
      const icon = node?.querySelector('.topoviewer-node-card-icon');
      const title = node?.querySelector('.topoviewer-node-card-title');
      const subtitle = node?.querySelector('.topoviewer-node-card-subtitle');
      const badge = node?.querySelector('.topoviewer-node-badge');
      const status = node?.querySelector('.topoviewer-node-status');
      const cluster = node?.querySelector('.topoviewer-node-corner-cluster');
      const externalLabel = node?.querySelector('.topoviewer-node-label');
      const edge = viewer.querySelector('.topoviewer-edge-visible-path');
      const cardBox = card?.getBoundingClientRect();
      const iconBox = icon?.getBoundingClientRect();
      const titleBox = title?.getBoundingClientRect();
      const badgeBox = badge?.getBoundingClientRect();
      const statusBox = status?.getBoundingClientRect();
      const clusterBox = cluster?.getBoundingClientRect();
      const edgePath = edge?.getAttribute('d') || '';
      const viewport = viewer.querySelector('.react-flow__viewport');
      const viewportTransform = viewport ? getComputedStyle(viewport).transform : 'none';
      const viewportScale = viewportTransform === 'none'
        ? 1
        : new DOMMatrixReadOnly(viewportTransform).a || 1;
      const graphSize = (value) => Math.round(value / viewportScale);

      return {
        cardWidth: graphSize(cardBox?.width || 0),
        cardHeight: graphSize(cardBox?.height || 0),
        iconWidth: graphSize(iconBox?.width || 0),
        iconHeight: graphSize(iconBox?.height || 0),
        iconLeftOfTitle: Boolean(iconBox && titleBox && iconBox.right <= titleBox.left),
        title: title?.textContent?.trim(),
        subtitle: subtitle?.textContent?.trim(),
        badge: badge?.textContent?.trim(),
        badgePosition: badge?.getAttribute('data-badge-position'),
        badgeWidth: graphSize(badgeBox?.width || 0),
        badgeHeight: graphSize(badgeBox?.height || 0),
        clusterPosition: cluster?.getAttribute('data-corner-position'),
        clusterOutsideCard: Boolean(cardBox && clusterBox && clusterBox.right > cardBox.right && clusterBox.top < cardBox.top),
        statusPlacement: status?.getAttribute('data-status-placement'),
        statusPriority: status?.getAttribute('data-status-priority'),
        statusWidth: graphSize(statusBox?.width || 0),
        statusHeight: graphSize(statusBox?.height || 0),
        statusLeftOfBadge: Boolean(statusBox && badgeBox && statusBox.right <= badgeBox.left),
        statusAlignedWithBadge: Boolean(statusBox && badgeBox && Math.abs((statusBox.top + statusBox.height / 2) - (badgeBox.top + badgeBox.height / 2)) <= 2),
        externalLabelCount: externalLabel ? 1 : 0,
        edgePath,
        invalidEdgePath: !edgePath || /NaN|undefined|null/.test(edgePath)
      };
    });

    expect(snapshot).toMatchObject({
      cardWidth: 210,
      cardHeight: 72,
      iconWidth: 46,
      iconHeight: 46,
      iconLeftOfTitle: true,
      title: 'Orders API',
      subtitle: 'Ready / 3 pods',
      badge: '3',
      badgePosition: 'topRight',
      badgeWidth: 22,
      badgeHeight: 22,
      clusterPosition: 'topRight',
      clusterOutsideCard: true,
      statusPlacement: 'topRight',
      statusPriority: 'cluster',
      statusWidth: 16,
      statusHeight: 16,
      statusLeftOfBadge: true,
      statusAlignedWithBadge: true,
      externalLabelCount: 0,
      invalidEdgePath: false
    });
  });

  test('shows helper lines during drag and clears them after drag stop', async ({ page }) => {
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/helper-lines-runtime.html', { waitUntil: 'domcontentloaded' });
    const draggedNode = page.locator('.react-flow__node[data-id="drag-me"]');
    await expect(draggedNode).toHaveClass(/\bdraggable\b/, { timeout: 30000 });

    await draggedNode.hover();
    const dragBefore = await nodeBox(page, 'drag-me');
    const peerBefore = await nodeBox(page, 'align-peer');

    await draggedNode.hover();
    await page.mouse.down();
    await page.mouse.move(
      peerBefore.x + peerBefore.width / 2 + 2,
      peerBefore.y + peerBefore.height / 2 + 2,
      { steps: 12 }
    );
    await expect(page.locator('.topoviewer-helper-line').first()).toBeVisible();
    await page.mouse.up();
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);

    const dragAfter = await nodeBox(page, 'drag-me');
    expect(dragAfter.x - dragBefore.x).toBeGreaterThan(150);
    expect(Math.abs(dragAfter.y - peerBefore.y)).toBeLessThanOrEqual(30);
  });

  test('keeps hostile label and callout markdown inert at runtime', async ({ page }) => {
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/security-runtime.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="safe-node"]', { timeout: 30000 });
    await expect(page.locator('.topoviewer-callout-title', { hasText: 'Hostile Callout' })).toBeVisible();

    const runtimeSecurity = await page.locator('.topoviewer').evaluate((viewer) => ({
      hostileExecuted: Boolean(window.__topoviewerHostileExecuted),
      scriptCount: viewer.querySelectorAll('script').length,
      eventAttributeCount: viewer.querySelectorAll('[onload], [onerror], [onclick], [onmouseover]').length,
      javascriptHrefCount: [...viewer.querySelectorAll('a[href], img[src]')]
        .filter((element) => /javascript:/i.test(element.getAttribute('href') || element.getAttribute('src') || '')).length,
      rawImageCount: [...viewer.querySelectorAll('img')]
        .filter((element) => element.getAttribute('src') === 'x').length
    }));

    expect(runtimeSecurity).toEqual({
      hostileExecuted: false,
      scriptCount: 0,
      eventAttributeCount: 0,
      javascriptHrefCount: 0,
      rawImageCount: 0
    });
    expect(actionableErrors(browserErrors)).toEqual([]);
  });

  test('keeps hostile docs embed content inert at runtime', async ({ page }) => {
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/security-docs-embed.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.react-flow__node[data-id="safe-node"]', { timeout: 30000 });
    await expect(page.locator('.topoviewer-callout-title', { hasText: 'Hostile Docs Embed Callout' })).toBeVisible();

    const runtimeSecurity = await page.locator('.topoviewer').evaluate((viewer) => {
      const imagePayloads = [...viewer.querySelectorAll('img[src^="data:image/svg+xml"]')]
        .map((image) => decodeURIComponent(image.getAttribute('src') || ''));
      return {
        hostileExecuted: Boolean(window.__topoviewerHostileExecuted),
        scriptCount: viewer.querySelectorAll('script').length,
        eventAttributeCount: viewer.querySelectorAll('[onload], [onerror], [onclick], [onmouseover]').length,
        javascriptHrefCount: [...viewer.querySelectorAll('a[href], img[src]')]
          .filter((element) => /javascript:/i.test(element.getAttribute('href') || element.getAttribute('src') || '')).length,
        rawImageCount: [...viewer.querySelectorAll('img')]
          .filter((element) => element.getAttribute('src') === 'x').length,
        unsafeIconPayloadCount: imagePayloads.filter((payload) => /<script|foreignObject|javascript:|\son[a-z]+\s*=/i.test(payload)).length
      };
    });

    expect(runtimeSecurity).toEqual({
      hostileExecuted: false,
      scriptCount: 0,
      eventAttributeCount: 0,
      javascriptHrefCount: 0,
      rawImageCount: 0,
      unsafeIconPayloadCount: 0
    });
    expect(actionableErrors(browserErrors)).toEqual([]);
  });

  test('renders layer and display controls without invalid visible state', {
    timeout: 60_000
  }, async ({ page }) => {
    const browserErrors = await openWorkbench(page);

    await setPermutation(
      page,
      new Set(['IGP', 'BGP / Controller', 'Transport']),
      new Set(['Show regions', 'Show services inside nodes'])
    );
    await waitForRegionVisibility(page, true, 'IGP/BGP/Transport with regions enabled');
    await waitForEdgeLabelVisibility(page, false, 'IGP/BGP/Transport with labels disabled');
    await expectRenderableState(page, 'IGP/BGP/Transport baseline');

    await setCheckboxByLabel(page, 'Show regions', false);
    await settleReact(page);
    await waitForRegionVisibility(page, false, 'IGP/BGP/Transport with regions disabled');
    await expectRenderableState(page, 'regions disabled');

    await setCheckboxByLabel(page, 'Show link/path labels', true);
    await settleReact(page);
    await waitForEdgeLabelVisibility(page, true, 'IGP/BGP/Transport with labels enabled');
    await expectRenderableState(page, 'labels enabled');

    await setCheckboxByLabel(page, 'Show link/path labels', false);
    await settleReact(page);
    await waitForEdgeLabelVisibility(page, false, 'IGP/BGP/Transport with labels disabled again');
    await expectRenderableState(page, 'labels disabled again');

    await setPermutation(page, new Set(['Service']), new Set(['Show services inside nodes']));
    await waitForRegionVisibility(page, false, 'Service-only layer');
    await waitForEdgeLabelVisibility(page, false, 'Service-only layer');
    await expectRenderableState(page, 'Service-only layer');

    expect(actionableErrors(browserErrors)).toEqual([]);
  });

  test('nests child nodes inside their parent and drags them with the parent', async ({ page }) => {
    await openWorkbench(page);

    await page.getByLabel(canonicalServicesToggleName, { exact: true }).check();
    await page.waitForTimeout(400);

    const parentBefore = await nodeBox(page, 'R01');
    const childBefore = await nodeBox(page, 'svc-1321-r01');

    assertInside(parentBefore, childBefore, 1);
    await nodeLabelBox(page, 'R01');
    await nodeLabelBox(page, 'svc-1321-r01');
    await expect(page.locator('.react-flow__node[data-id="svc-1321-r01"] .topoviewer-node-label')).toContainText('L3VPN 1321');
    await expect(page.locator('.react-flow__node[data-id="svc-1321-r09"] .topoviewer-node-label')).toContainText('L3VPN 1321');

    await dragBox(page, parentBefore, 95, 45);

    const parentAfter = await nodeBox(page, 'R01');
    const childAfter = await nodeBox(page, 'svc-1321-r01');
    const parentDelta = movedBy(parentBefore, parentAfter);
    const childDelta = movedBy(childBefore, childAfter);

    expect(childDelta.dx).toBeCloseTo(parentDelta.dx, 0);
    expect(childDelta.dy).toBeCloseTo(parentDelta.dy, 0);
  });

  test('drags an overlapping IS-IS L1 region and recomputes dependent hulls', async ({ page }) => {
    await openWorkbench(page);
    await page.getByRole('button', { name: 'No layers' }).click();
    await page.getByLabel('IGP').check();
    await page.waitForTimeout(400);

    const r05Before = await nodeBox(page, 'R05');
    const l2Before = await nodeBox(page, 'region:isis-l2');
    const asBefore = await nodeBox(page, 'region:as65000');

    await dragNodeByTopmostPoint(page, 'region:isis-l1', 80, 35);

    const r05After = await nodeBox(page, 'R05');
    const l1After = await nodeBox(page, 'region:isis-l1');
    const l2After = await nodeBox(page, 'region:isis-l2');
    const asAfter = await nodeBox(page, 'region:as65000');
    const r05Delta = movedBy(r05Before, r05After);

    expect(Math.abs(r05Delta.dx)).toBeGreaterThan(50);
    expect(Math.abs(r05Delta.dy)).toBeGreaterThan(20);

    assertInside(l1After, r05After);
    assertInside(l2After, r05After, 6);
    assertInside(asAfter, r05After);

    expect(Math.abs(l2After.x - l2Before.x) + Math.abs(l2After.width - l2Before.width)).toBeGreaterThan(20);
    expect(Math.abs(asAfter.x - asBefore.x) + Math.abs(asAfter.width - asBefore.width)).toBeGreaterThan(20);
  });

  test('drags the AS region and moves routers while child region hulls follow', async ({ page }) => {
    await openWorkbench(page);
    await page.getByRole('button', { name: 'No layers' }).click();
    await page.getByLabel('IGP').check();
    await page.waitForTimeout(400);

    const r01Before = await nodeBox(page, 'R01');
    const l1Before = await nodeBox(page, 'region:isis-l1');
    const asBefore = await nodeBox(page, 'region:as65000');

    await dragNodeByTopmostPoint(page, 'region:as65000', 70, 50);

    const r01After = await nodeBox(page, 'R01');
    const l1After = await nodeBox(page, 'region:isis-l1');
    const asAfter = await nodeBox(page, 'region:as65000');
    const r01Delta = movedBy(r01Before, r01After);
    const l1Delta = movedBy(l1Before, l1After);
    const asDelta = movedBy(asBefore, asAfter);

    expect(Math.abs(r01Delta.dx) + Math.abs(r01Delta.dy)).toBeGreaterThan(5);
    assertInside(l1After, r01After);
    assertInside(asAfter, r01After);

    expect(Math.abs(l1Delta.dx - r01Delta.dx)).toBeLessThan(2);
    expect(Math.abs(l1Delta.dy - r01Delta.dy)).toBeLessThan(2);
    expect(Math.abs(asDelta.dx - r01Delta.dx)).toBeLessThan(2);
    expect(Math.abs(asDelta.dy - r01Delta.dy)).toBeLessThan(2);
  });
});
