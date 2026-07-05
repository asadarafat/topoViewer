const { test, expect } = require('@playwright/test');
const { canonicalFooterText, canonicalWorkbenchCounts } = require('./workbench-helpers');
const { expectCurrentServerMarker } = require('./server-marker');

const WORKBENCH_SCREENSHOT_MAX_DIFF_RATIO = 0.06;
const ALLOWED_BROWSER_ERROR_PATTERNS = [
  /Download the React DevTools/,
  /Error inlining remote css file/,
  /Error loading remote stylesheet/,
  /Error while reading CSS rules from/
];

async function selectComboboxOption(page, name, option) {
  await page.getByRole('combobox', { name }).click();
  await page.getByRole('option', { name: option }).click();
  await expect(page.locator('.MuiPopover-root')).toHaveCount(0);
}

async function setCheckboxByLabel(page, name, checked) {
  const checkbox = page.getByRole('checkbox', { name, exact: true });
  const label = page.locator('label').filter({ has: checkbox }).first();

  await expect(checkbox).toBeAttached();
  if (await checkbox.isChecked() === checked) return;

  const labelCount = await label.count();
  if (labelCount > 0) {
    await label.click();
  } else {
    await checkbox.click({ force: true });
  }
  await expect.poll(() => checkbox.isChecked(), {
    message: `checkbox "${name}" should be ${checked ? 'checked' : 'unchecked'}`
  }).toBe(checked);
}

async function nodeBox(page, id) {
  const locator = page.locator(`.react-flow__node[data-id="${id}"]`);
  await expect(locator, `Expected node ${id} to exist`).toHaveCount(1);
  const box = await locator.boundingBox();
  expect(box, `Expected node ${id} to have a rendered box`).toBeTruthy();
  return box;
}

async function exportRenderedSurface(page) {
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
      return await page.locator('.topoviewer').first().evaluate(async (element) => {
        const { topoviewerToPdf, topoviewerToPng, topoviewerToSvg } = await import('/src/core/export.ts');
        const dataUrl = await topoviewerToSvg(element);
        const payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
        const svg = dataUrl.includes(';base64,') ? atob(payload) : decodeURIComponent(payload);
        const png = await topoviewerToPng(element, { pixelRatio: 1 });
        const pdf = await topoviewerToPdf(element, { pixelRatio: 1 });
        return {
          svg,
          pngPrefix: png.slice(0, 22),
          pngLength: png.length,
          pdfType: pdf.type,
          pdfSize: pdf.size
        };
      });
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      if (!message.includes('Execution context was destroyed') && !message.includes('navigation')) {
        throw error;
      }
      await page.waitForLoadState('domcontentloaded').catch(() => undefined);
    }
  }

  throw lastError;
}

test.describe('TopoViewer package workbench', () => {
  test('renders the TypeScript TopoViewer workbench and responds to core controls', async ({ page }) => {
    test.setTimeout(60000);
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'TopoViewer' })).toBeVisible();
    await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });

    await expect(page.getByLabel('Viewport controls')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit View' })).toBeVisible();

    await expect(page.locator('.react-flow__node-network')).toHaveCount(canonicalWorkbenchCounts.nodes);
    await expect.poll(() => page.locator('.react-flow__edge').count()).toBeGreaterThanOrEqual(canonicalWorkbenchCounts.edges);

    await page.getByRole('button', { name: 'Zoom In' }).click();
    await page.getByRole('button', { name: 'Fit View' }).click();

    await page.getByRole('button', { name: 'No layers' }).click();
    await expect(page.locator('.react-flow__node-network')).toHaveCount(0);

    await page.getByRole('button', { name: 'All layers' }).click();
    await expect(page.locator('.react-flow__node-network')).toHaveCount(canonicalWorkbenchCounts.nodes);

    await setCheckboxByLabel(page, 'Show link/path labels', true);
    await expect.poll(() => page.evaluate(() => {
      const labels = [...document.querySelectorAll('.topoviewer-edge-label')];
      const label = labels.find((candidate) => {
        const style = getComputedStyle(candidate);
        const box = candidate.getBoundingClientRect();
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && Number.parseFloat(style.opacity || '1') !== 0
          && box.width > 0
          && box.height > 0;
      });
      if (!label) return false;

      const box = label.getBoundingClientRect();
      const topElement = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return topElement === label || !!topElement?.closest('.topoviewer-edge-label');
    }), {
      message: 'edge labels should render above graph objects',
      timeout: 15000
    }).toBe(true);

    await page.getByLabel('Focus ID').fill('srte-1321-forward');
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(5);
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(4);
    await expect(page.locator('.topoviewer-node-attention-dimmed').first()).toBeVisible();

    await page.getByLabel('Focus ID').fill('R05');
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(1);
    await expect(page.locator('.topoviewer-node-attention-related').first()).toBeVisible();
    await expect(page.locator('.topoviewer-node-attention-focused').first()).toHaveAttribute('tabindex', '0');

    await page.getByRole('button', { name: 'Clear' }).click();
    await selectComboboxOption(page, 'Focus', 'Changed');
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(0);
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Focus result 0/0');

    await page.getByRole('button', { name: 'Clear' }).click();
    await selectComboboxOption(page, 'Aggregate', 'Region');
    await expect.poll(() => page.locator('.react-flow__node-network').count()).toBeLessThan(canonicalWorkbenchCounts.nodes);
    await selectComboboxOption(page, 'Labels', 'Minimal');
    await expect(page.locator('.topoviewer')).toHaveClass(/topoviewer-label-density-minimal/);
    await selectComboboxOption(page, 'Aggregate', 'None');

    await page.getByRole('button', { name: 'Run force layout' }).click();
    await expect(page.locator('footer')).toContainText(canonicalFooterText());

    const actionableErrors = browserErrors.filter((line) => (
      !ALLOWED_BROWSER_ERROR_PATTERNS.some((pattern) => pattern.test(line))
    ));
    expect(actionableErrors).toEqual([]);
  });

  test('exports a rendered TopoViewer surface', async ({ page }) => {
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/tests/fixtures/accessibility-runtime.html', { waitUntil: 'domcontentloaded' });
    const focusedExports = await exportRenderedSurface(page);

    expect(focusedExports.svg).toContain('topoviewer-node-attention-focused');
    expect(focusedExports.pngPrefix).toBe('data:image/png;base64,');
    expect(focusedExports.pngLength).toBeGreaterThan(1000);
    expect(focusedExports.pdfType).toBe('application/pdf');
    expect(focusedExports.pdfSize).toBeGreaterThan(1000);
  });

  test('shows helper lines while dragging objects in the browser harness', async ({ page }) => {
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/');
    await page.waitForSelector('.react-flow__node[data-id="R03"]', { timeout: 30000 });

    const dragBefore = await nodeBox(page, 'R03');
    const peerBefore = await nodeBox(page, 'R05');
    const pointerOffset = {
      x: dragBefore.width / 2,
      y: dragBefore.height / 2
    };

    await page.mouse.move(dragBefore.x + pointerOffset.x, dragBefore.y + pointerOffset.y);
    await page.mouse.down();
    await page.mouse.move(peerBefore.x + pointerOffset.x + 8, peerBefore.y + pointerOffset.y, { steps: 12 });
    await expect(page.locator('.topoviewer-helper-line').first()).toBeVisible();
    await page.mouse.up();
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);

    const dragAfter = await nodeBox(page, 'R03');
    expect(dragAfter.x - dragBefore.x).toBeGreaterThan(60);
    expect(Math.abs(dragAfter.y - peerBefore.y)).toBeLessThanOrEqual(35);
  });

  test('matches the reference workbench rendering screenshot', async ({ page }) => {
    await expectCurrentServerMarker(page, 'topoviewer');
    await page.goto('/');
    await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
    await setCheckboxByLabel(page, 'Show link/path labels', true);
    await page.waitForTimeout(300);

    await expect(page.locator('.topoviewer-workbench-main')).toHaveScreenshot('topoviewer-workbench-main.png', {
      animations: 'disabled',
      maxDiffPixelRatio: WORKBENCH_SCREENSHOT_MAX_DIFF_RATIO
    });
  });
});
