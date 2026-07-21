import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from '../support/workspaceRail';

const screenshotOptions = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.02
};

async function expectChrome(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveScreenshot(name, screenshotOptions);
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}

test('keeps desktop authoring chrome visually stable', async ({ page }) => {
  await page.setViewportSize({ height: 960, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await settle(page);

  await expectChrome(await openStudioWorkspace(page, 'Objects'), 'product-palette-desktop.png');

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expectChrome(await openStudioWorkspace(page, 'Edit'), 'product-edit-desktop.png');

  await expectChrome(await openStudioWorkspace(page, 'Mapper'), 'product-mapper-desktop.png');

  await page.getByRole('button', { name: 'Project menu' }).click();
  await expectChrome(page.getByRole('dialog', { name: 'Projects' }), 'product-project-dialog-desktop.png');
  await page.keyboard.press('Escape');

  await expectChrome(
    page.getByTestId('studio-canvas').locator('.studio-canvas-unified-controls'),
    'product-canvas-toolbar-desktop.png'
  );
});

test('keeps the narrow Studio shell visually stable', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 760 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await settle(page);
  await openStudioWorkspace(page, 'Objects');
  await expect(page.locator('.studio-shell')).toHaveScreenshot('product-shell-narrow.png', screenshotOptions);
});
