import { expect, test, type Locator, type Page } from '@playwright/test';
import { openStyleWorkspace } from '../support/basicStyle';
import { resolvedPaletteColor } from '../support/theme';
import { openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';

async function chooseAppearance(page: Page, mode: 'Dark' | 'Light' | 'System') {
  await page.getByRole('banner').getByRole('button', { name: 'Appearance' }).click();
  const menu = page.getByRole('menu', { name: 'Appearance' });
  await menu.getByRole('menuitemradio', { name: mode }).click();
}

async function sourceText(page: Page) {
  const edit = await openPropertiesCodeDocument(page, 'topology');
  return edit.getByLabel('topology YAML editor').inputValue();
}

async function expectMonacoColorHarmony(page: Page, workspace: Locator) {
  const editor = workspace.locator('.monaco-editor');
  const paper = await resolvedPaletteColor(page, '--mui-palette-background-paper');
  const primary = await resolvedPaletteColor(page, '--mui-palette-primary-main');
  const success = await resolvedPaletteColor(page, '--mui-palette-success-main');
  const secondary = await resolvedPaletteColor(page, '--mui-palette-text-secondary');
  await expect(editor).toHaveCSS('background-color', paper);
  await expect(editor.locator('.margin[role="presentation"]')).toHaveCSS(
    'background-color',
    paper
  );
  await expect(editor.locator('.line-numbers.active-line-number').first()).toHaveCSS(
    'color',
    secondary
  );
  await expect(editor.locator('.line-numbers:not(.active-line-number)').first()).toHaveCSS(
    'color',
    secondary
  );
  const semanticLineColors = await editor
    .locator('.view-line')
    .filter({ hasText: 'showEdgeLabels' })
    .first()
    .locator('span')
    .evaluateAll((spans) => [...new Set(spans.map((span) => getComputedStyle(span).color))]);
  expect(semanticLineColors).toEqual(expect.arrayContaining([primary, success]));
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
  await expect(page.locator('.studio-saved-state')).toHaveAttribute('data-status', 'saved');
});

test('uses the effective Studio scheme for Monaco', async ({ page }) => {
  await page.goto('/');
  await chooseAppearance(page, 'Light');
  let edit = await openPropertiesCodeDocument(page, 'topology');
  await expect(edit.locator('.monaco-editor')).toHaveClass(/vs/);
  await expect(edit.locator('.monaco-editor')).not.toHaveClass(/vs-dark/);
  await expectMonacoColorHarmony(page, edit);

  await chooseAppearance(page, 'Dark');
  edit = await openPropertiesCodeDocument(page, 'topology');
  await expect(edit.locator('.monaco-editor')).toHaveClass(/vs-dark/);
  await expectMonacoColorHarmony(page, edit);
});

test('keeps Add preview graphics legible in light and dark schemes', async ({ page }) => {
  await page.goto('/');
  const add = await openStudioWorkspace(page, 'Add');
  const link = add.getByTestId('palette-link').locator('.studio-preview-edge-primary');
  const parent = add.getByTestId('palette-parent-child-glyph').locator('svg');
  const router = add.getByTestId('palette-router').locator('img');

  await chooseAppearance(page, 'Light');
  const lightText = await resolvedPaletteColor(page, '--mui-palette-text-primary');
  await expect(link).toHaveCSS('stroke', lightText);
  await expect(parent).toHaveCSS('color', lightText);
  const lightRouter = await router.getAttribute('src');

  await chooseAppearance(page, 'Dark');
  const darkText = await resolvedPaletteColor(page, '--mui-palette-text-primary');
  await expect(link).toHaveCSS('stroke', darkText);
  await expect(parent).toHaveCSS('color', darkText);
  const darkRouter = await router.getAttribute('src');

  expect(lightRouter).toBeTruthy();
  expect(darkRouter).toBeTruthy();
  expect(darkRouter).not.toBe(lightRouter);
});

test('keeps Appearance icon previews synchronized with the effective scheme', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const style = await openStyleWorkspace(page);

  const openIconPicker = async () => {
    await style.getByRole('searchbox', { name: 'Search style attributes' }).fill('Icon');
    const icon = style.locator('.studio-basic-style-field[data-field-path="icon"]');
    await expect(icon).toBeVisible();
    await icon.scrollIntoViewIfNeeded();
    await icon.getByRole('combobox', { name: 'Icon' }).click();
  };

  await chooseAppearance(page, 'Light');
  await openIconPicker();
  const option = page
    .getByRole('listbox')
    .locator('[role="option"][data-icon-id="nokia.router"] img');
  const lightSource = await option.getAttribute('src');
  await page.keyboard.press('Escape');

  await chooseAppearance(page, 'Dark');
  await openIconPicker();
  const darkSource = await option.getAttribute('src');

  expect(lightSource).toBeTruthy();
  expect(darkSource).toBeTruthy();
  expect(darkSource).not.toBe(lightSource);
  expect(decodeURIComponent(lightSource || '')).toContain('stroke="#000"');
  expect(decodeURIComponent(darkSource || '')).toContain('stroke="#fff"');
});

test('keeps theme-owned canvas and grid colors synchronized with the effective scheme', async ({ page }) => {
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Properties');
  const canvas = page.getByTestId('studio-canvas');
  const grid = page.locator('.react-flow__background-pattern.dots').first();
  const nodeLabel = page.locator('.react-flow__node[data-id="edge-01"] .topoviewer-node-label');

  await chooseAppearance(page, 'Dark');
  await expect(canvas).toHaveCSS(
    'background-color',
    await resolvedPaletteColor(page, '--mui-palette-background-default')
  );
  await expect(properties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('var(--mui-palette-background-default)');
  await expect(grid).toHaveCSS('fill', await resolvedPaletteColor(page, '--mui-palette-divider'));
  await expect(nodeLabel).toHaveCSS(
    'color',
    await resolvedPaletteColor(page, '--mui-palette-text-primary')
  );

  await chooseAppearance(page, 'Light');
  await expect(canvas).toHaveCSS(
    'background-color',
    await resolvedPaletteColor(page, '--mui-palette-background-default')
  );
  await expect(properties.getByRole('textbox', { name: 'Canvas background', exact: true })).toHaveValue('var(--mui-palette-background-default)');
  await expect(grid).toHaveCSS('fill', await resolvedPaletteColor(page, '--mui-palette-divider'));
  await expect(nodeLabel).toHaveCSS(
    'color',
    await resolvedPaletteColor(page, '--mui-palette-text-primary')
  );
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
  await expect(canvas).toHaveCSS(
    'background-color',
    await resolvedPaletteColor(page, '--mui-palette-background-default')
  );

  await chooseAppearance(page, 'Dark');
  await expect(canvas).toHaveCSS(
    'background-color',
    await resolvedPaletteColor(page, '--mui-palette-background-default')
  );
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS(
    'fill',
    await resolvedPaletteColor(page, '--mui-palette-divider')
  );
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
  await expect(page.getByTestId('studio-canvas')).toHaveCSS(
    'background-color',
    await resolvedPaletteColor(page, '--mui-palette-background-default')
  );
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
