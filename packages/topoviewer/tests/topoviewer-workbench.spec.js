const { test, expect } = require('@playwright/test');

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

    await expect(page.getByLabel('Viewport controls')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom Out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fit View' })).toBeVisible();

    await expect(page.locator('.react-flow__node-network')).toHaveCount(11);
    await expect(page.locator('.react-flow__edge')).toHaveCount(17);
    await expect(page.locator('.topoviewer-edge-pipe-fill')).toHaveCount(5);
    await expect(page.locator('.topoviewer-edge-lane')).toHaveCount(9);
    await expect(page.locator('.topoviewer-edge-lane-stub')).toHaveCount(4);

    await page.getByRole('button', { name: 'Zoom In' }).click();
    await page.getByRole('button', { name: 'Fit View' }).click();

    await page.getByRole('button', { name: 'No layers' }).click();
    await expect(page.locator('.react-flow__node')).toHaveCount(0);

    await page.getByRole('button', { name: 'All layers' }).click();
    await expect(page.locator('.react-flow__node-network')).toHaveCount(11);

    await page.getByRole('checkbox', { name: 'Show link/path labels', exact: true }).check();
    await expect(page.locator('.topoviewer-edge-label').first()).toBeVisible();
    const labelIsTopmost = await page.locator('.topoviewer-edge-label').first().evaluate((label) => {
      const box = label.getBoundingClientRect();
      const topElement = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return topElement === label || !!topElement?.closest('.topoviewer-edge-label');
    });
    expect(labelIsTopmost).toBe(true);

    await page.getByRole('button', { name: 'Run force layout' }).click();
    await expect(page.locator('footer')).toContainText('Rendered 11 nodes');

    const actionableErrors = browserErrors.filter((line) => !line.includes('Download the React DevTools'));
    expect(actionableErrors).toEqual([]);
  });

  test('matches the reference workbench rendering screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.react-flow__node-network', { timeout: 30000 });
    await page.getByRole('checkbox', { name: 'Show link/path labels', exact: true }).check();
    await page.waitForTimeout(300);

    await expect(page.locator('.topoviewer-workbench-main')).toHaveScreenshot('topoviewer-workbench-main.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.04
    });
  });
});
