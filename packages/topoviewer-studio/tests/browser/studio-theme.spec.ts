import { expect, test, type Page } from '@playwright/test';
import { openPropertiesCodeDocument, openStudioWorkspace } from '../support/workspaceRail';

async function chooseAppearance(page: Page, mode: 'Dark' | 'Light' | 'System') {
  await page.getByRole('button', { name: 'Appearance' }).click();
  const menu = page.getByRole('menu', { name: 'Appearance' });
  await menu.getByRole('menuitemradio', { name: mode }).click();
}

async function sourceText(page: Page) {
  const edit = await openPropertiesCodeDocument(page, 'topology');
  return edit.getByLabel('topology YAML editor').inputValue();
}

test('switches and persists System, Light, and Dark through the browser host', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'light');

  await chooseAppearance(page, 'Dark');
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'dark');

  await chooseAppearance(page, 'System');
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'dark');

  await chooseAppearance(page, 'Light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-mui-color-scheme', 'light');
});

test('does not mutate project source while changing appearance', async ({ page }) => {
  await page.goto('/');
  const before = await sourceText(page);
  await chooseAppearance(page, 'Light');
  await chooseAppearance(page, 'Dark');
  await chooseAppearance(page, 'System');
  expect(await sourceText(page)).toBe(before);
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('uses the effective Studio scheme for Monaco', async ({ page }) => {
  await page.goto('/');
  await chooseAppearance(page, 'Light');
  let edit = await openPropertiesCodeDocument(page, 'topology');
  await expect(edit.locator('.monaco-editor')).toHaveClass(/vs/);
  await expect(edit.locator('.monaco-editor')).not.toHaveClass(/vs-dark/);

  await chooseAppearance(page, 'Dark');
  edit = await openPropertiesCodeDocument(page, 'topology');
  await expect(edit.locator('.monaco-editor')).toHaveClass(/vs-dark/);
});

test('keeps Add preview graphics legible in light and dark schemes', async ({ page }) => {
  await page.goto('/');
  const add = await openStudioWorkspace(page, 'Add');
  const link = add.getByTestId('palette-link').locator('.studio-preview-edge-primary');
  const parent = add.getByTestId('palette-parent-child-glyph').locator('svg');
  const router = add.getByTestId('palette-router').locator('img');

  await chooseAppearance(page, 'Light');
  await expect(link).toHaveCSS('stroke', 'rgba(0, 0, 0, 0.87)');
  await expect(parent).toHaveCSS('color', 'rgba(0, 0, 0, 0.87)');
  const lightRouter = await router.getAttribute('src');

  await chooseAppearance(page, 'Dark');
  await expect(link).toHaveCSS('stroke', 'rgb(255, 255, 255)');
  await expect(parent).toHaveCSS('color', 'rgb(255, 255, 255)');
  const darkRouter = await router.getAttribute('src');

  expect(lightRouter).toBeTruthy();
  expect(darkRouter).toBeTruthy();
  expect(darkRouter).not.toBe(lightRouter);
});

test('keeps theme-owned canvas and grid colors synchronized with the effective scheme', async ({ page }) => {
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Properties');
  const canvas = page.getByTestId('studio-canvas');
  const grid = page.locator('.react-flow__background-pattern.dots').first();
  const nodeLabel = page.locator('.react-flow__node[data-id="edge-01"] .topoviewer-node-label');

  await chooseAppearance(page, 'Dark');
  await expect(canvas).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  await expect(properties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('var(--mui-palette-background-default)');
  await expect(grid).toHaveCSS('fill', 'rgba(255, 255, 255, 0.12)');
  await expect(nodeLabel).toHaveCSS('color', 'rgb(255, 255, 255)');

  await chooseAppearance(page, 'Light');
  await expect(canvas).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(properties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('var(--mui-palette-background-default)');
  await expect(grid).toHaveCSS('fill', 'rgba(0, 0, 0, 0.12)');
  await expect(nodeLabel).toHaveCSS('color', 'rgba(0, 0, 0, 0.87)');
});

test('preserves custom canvas colors across theme changes and resets them to theme ownership', async ({ page }) => {
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Properties');
  const canvas = page.getByTestId('studio-canvas');
  const background = properties.getByRole('textbox', { name: 'Canvas background', exact: true });
  const gridColor = properties.getByRole('textbox', { name: 'Grid color', exact: true });

  await background.fill('#123456');
  await background.press('Enter');
  await gridColor.fill('#abcdef');
  await gridColor.press('Enter');
  await chooseAppearance(page, 'Light');
  await expect(canvas).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgb(171, 205, 239)');

  await page.reload();
  const restoredProperties = await openStudioWorkspace(page, 'Properties');
  await expect(restoredProperties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('#123456');
  await restoredProperties.getByRole('button', { name: 'Reset Canvas background to theme' }).click();
  await restoredProperties.getByRole('button', { name: 'Reset Grid color to theme' }).click();
  await expect(canvas).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await chooseAppearance(page, 'Dark');
  await expect(canvas).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgba(255, 255, 255, 0.12)');
});

test('migrates legacy canvas defaults while preserving legacy custom colors', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'topoviewer-studio:preference:v1:canvas-display',
      JSON.stringify({
        value: {
          backgroundColor: '#121212',
          gridColor: '#abcdef',
          gridSize: 24,
          gridVisible: true,
          helperLinesEnabled: true,
          miniMapVisible: false,
          snapToAlignment: true,
          viewportControlsVisible: true
        },
        version: 1
      })
    );
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Properties');

  await expect(properties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('var(--mui-palette-background-default)');
  await expect(properties.getByRole('textbox', { name: 'Grid color', exact: true })).toHaveValue('#abcdef');
  await expect(page.getByTestId('studio-canvas')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgb(171, 205, 239)');

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('topoviewer-studio:preference:v1:canvas-display');
        return raw ? JSON.parse(raw).value : undefined;
      })
    )
    .toMatchObject({
      backgroundColor: { mode: 'theme' },
      gridColor: { mode: 'custom', value: '#abcdef' },
      version: 2
    });
});
