import { expect, test, type Locator, type Page } from '@playwright/test';
import { openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';

const screenshotOptions = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.005
};

async function expectChrome(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveScreenshot(name, screenshotOptions);
}

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}

async function chooseAppearance(page: Page, mode: 'Dark' | 'Light') {
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('menu', { name: 'Appearance' }).getByRole('menuitemradio', { name: mode }).click();
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', mode.toLocaleLowerCase());
  await settle(page);
}

for (const mode of ['Light', 'Dark'] as const) {
  const suffix = mode.toLocaleLowerCase();

  test(`keeps ${suffix} desktop authoring chrome visually stable`, async ({ page }) => {
    await page.setViewportSize({ height: 960, width: 1440 });
    await page.goto('/?__studio-test-state=mapper-coverage');
    await chooseAppearance(page, mode);

    await expectChrome(page.locator('.studio-shell'), `product-shell-desktop-${suffix}.png`);
    await expectChrome(await openStudioWorkspace(page, 'Add'), `product-add-desktop-${suffix}.png`);

    await page.locator('.react-flow__node[data-id="leaf1"]').click();
    const properties = await openStudioWorkspace(page, 'Properties');
    await expectChrome(properties, `product-object-properties-desktop-${suffix}.png`);

    await page.getByTestId('studio-canvas').click({ position: { x: 20, y: 20 } });
    await expect(properties.getByLabel('Viewport settings')).toBeVisible();
    await expectChrome(properties, `product-canvas-properties-desktop-${suffix}.png`);

    const source = await openPropertiesCodeDocument(page, 'topology');
    await page.mouse.move(0, 0);
    await expect.poll(async () =>
      source.locator('.monaco-scrollable-element > .scrollbar').evaluateAll((scrollbars) =>
        scrollbars.every((scrollbar) => {
          const style = getComputedStyle(scrollbar);
          return style.opacity === '0' || style.visibility === 'hidden';
        })
      )
    ).toBe(true);
    await expectChrome(source, `product-monaco-desktop-${suffix}.png`);

    await expectChrome(await openStudioWorkspace(page, 'Mapper'), `product-mapper-desktop-${suffix}.png`);

    await page.getByRole('button', { name: 'Project menu' }).click();
    await expectChrome(page.getByRole('dialog', { name: 'Projects' }), `product-project-dialog-desktop-${suffix}.png`);
    await page.keyboard.press('Escape');

    await page.locator('.react-flow__node[data-id="leaf2"]').click();
    await expectChrome(
      page.getByTestId('studio-canvas').locator('.studio-canvas-unified-controls'),
      `product-canvas-toolbar-desktop-${suffix}.png`
    );
  });

  test(`keeps the ${suffix} narrow Studio shell visually stable`, async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 760 });
    await page.goto('/?__studio-test-state=mapper-coverage');
    await chooseAppearance(page, mode);
    await openStudioWorkspace(page, 'Add');
    await expect(page.locator('.studio-shell')).toHaveScreenshot(`product-shell-narrow-${suffix}.png`, screenshotOptions);
  });
}
