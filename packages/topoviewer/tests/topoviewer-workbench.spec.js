const { test, expect } = require('@playwright/test');
const { canonicalFooterText, canonicalWorkbenchCounts } = require('./workbench-helpers');

async function preloadExportHelpers(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.evaluate(async () => {
        window.__topoviewerExportHelpers = await import('/src/core/export.ts');
      });
      return;
    } catch (error) {
      if (!String(error).includes('Execution context was destroyed') || attempt === 2) {
        throw error;
      }
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
    }
  }
}

test.describe('TopoViewer package workbench', () => {
  test('renders the TypeScript TopoViewer workbench and responds to core controls', async ({ page }) => {
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'TopoViewer' })).toBeVisible();
    await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
    await preloadExportHelpers(page);

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

    await page.getByRole('checkbox', { name: 'Show link/path labels', exact: true }).check();
    await expect(page.locator('.topoviewer-edge-label').first()).toBeVisible();
    const labelIsTopmost = await page.locator('.topoviewer-edge-label').first().evaluate((label) => {
      const box = label.getBoundingClientRect();
      const topElement = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return topElement === label || !!topElement?.closest('.topoviewer-edge-label');
    });
    expect(labelIsTopmost).toBe(true);

    await page.getByLabel('Focus ID').fill('srte-1321-forward');
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(5);
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(4);
    await expect(page.locator('.topoviewer-node-attention-dimmed').first()).toBeVisible();
    const focusedExports = await page.locator('.topoviewer').evaluate(async (element) => {
      const { topoviewerToPdf, topoviewerToPng, topoviewerToSvg } = window.__topoviewerExportHelpers;
      const dataUrl = await topoviewerToSvg(element);
      const payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
      const svg = dataUrl.includes(';base64,') ? atob(payload) : decodeURIComponent(payload);
      const png = await topoviewerToPng(element);
      const pdf = await topoviewerToPdf(element);
      return {
        svg,
        pngPrefix: png.slice(0, 22),
        pngLength: png.length,
        pdfType: pdf.type,
        pdfSize: pdf.size
      };
    });
    expect(focusedExports.svg).toContain('topoviewer-node-attention-focused');
    expect(focusedExports.pngPrefix).toBe('data:image/png;base64,');
    expect(focusedExports.pngLength).toBeGreaterThan(1000);
    expect(focusedExports.pdfType).toBe('application/pdf');
    expect(focusedExports.pdfSize).toBeGreaterThan(1000);

    await page.getByLabel('Focus ID').fill('R05');
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(1);
    await expect(page.locator('.topoviewer-node-attention-related').first()).toBeVisible();
    await expect(page.locator('.topoviewer-node-attention-focused').first()).toHaveAttribute('tabindex', '0');

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByLabel('Focus', { exact: true }).click();
    await page.getByRole('option', { name: 'Changed' }).click();
    await expect(page.locator('.topoviewer-node-attention-focused')).toHaveCount(0);
    await expect(page.locator('.topoviewer-edge-attention-focused')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Focus result 0/0');

    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('combobox', { name: 'Aggregate' }).click();
    await page.getByRole('option', { name: 'Region' }).click();
    await expect.poll(() => page.locator('.react-flow__node-network').count()).toBeLessThan(canonicalWorkbenchCounts.nodes);
    await page.getByRole('combobox', { name: 'Labels' }).click();
    await page.getByRole('option', { name: 'Minimal' }).click();
    await expect(page.locator('.topoviewer')).toHaveClass(/topoviewer-label-density-minimal/);
    await page.getByRole('combobox', { name: 'Aggregate' }).click();
    await page.getByRole('option', { name: 'None' }).click();

    await page.getByRole('button', { name: 'Run force layout' }).click();
    await expect(page.locator('footer')).toContainText(canonicalFooterText());

    const actionableErrors = browserErrors.filter((line) => (
      !line.includes('Download the React DevTools')
      && !line.includes('Error inlining remote css file')
      && !line.includes('Error loading remote stylesheet')
      && !line.includes('Error while reading CSS rules from')
    ));
    expect(actionableErrors).toEqual([]);
  });

  test('matches the reference workbench rendering screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
    await page.getByRole('checkbox', { name: 'Show link/path labels', exact: true }).check();
    await page.waitForTimeout(300);

    await expect(page.locator('.topoviewer-workbench-main')).toHaveScreenshot('topoviewer-workbench-main.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.06
    });
  });
});
