import { expect, test } from '@playwright/test';

test('authors, edits, restores, saves, and reloads one node through the canvas-first workflow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('TopoViewer Studio')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Object palette' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeVisible();
  await expect(page.getByText('Untitled topology')).toBeVisible();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByText('Browser project')).toBeVisible();
  await expect(page.getByText('Empty topology')).toBeVisible();

  const started = Date.now();
  await page.getByTestId('palette-router').dragTo(page.getByTestId('studio-canvas'), {
    targetPosition: { x: 300, y: 220 }
  });
  await expect(page.getByText('New Router', { exact: true })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(1500);

  const name = page.getByRole('textbox', { name: 'Name' });
  await expect(name).toHaveValue('New Router');
  await name.fill('Core Router');
  await name.press('Enter');
  await expect(page.getByText('Core Router', { exact: true })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('New Router', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByText('Core Router', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await name.fill('Unsaved Router');
  await name.press('Enter');
  await page.getByRole('button', { name: 'Reload project' }).click();
  await expect(page.getByText('Core Router', { exact: true })).toBeVisible();
});

test('groups palette templates by canonical object family and previews visual node templates', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Object palette' });
  for (const family of ['Nodes', 'Paths', 'Regions', 'Shapes', 'Callouts']) {
    await expect(palette.getByRole('heading', { name: family })).toBeVisible();
  }
  await expect(palette.getByRole('heading', { name: 'Topology' })).toHaveCount(0);
  await expect(palette.getByRole('heading', { name: 'Assets' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add Basic node' })).toBeVisible();
  await expect(page.getByTestId('palette-router').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(page.getByTestId('palette-switch').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-switch').click();
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  const networkSwitch = page.locator('.react-flow__node[data-id="switch-1"]');
  await expect(router.locator('.topoviewer-node-icon-image')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(networkSwitch.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Switch');
});

test('adds a visual template icon to an imported stylesheet that has no icon catalog', async ({ page }) => {
  await page.goto('/?__studio-test-state=unstyled');
  await page.getByTestId('palette-switch').click();
  const networkSwitch = page.locator('.react-flow__node[data-id="switch-1"]');
  await expect(networkSwitch.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Switch');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await page.getByLabel('stylesheet YAML editor').focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill('switch.generic');
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
});

test('searches, creates by keyboard, and collapses desktop panels', async ({ page }) => {
  await page.goto('/');

  const palette = page.getByRole('complementary', { name: 'Object palette' });
  await page.getByRole('searchbox', { name: 'Search objects' }).fill('service');
  await expect(page.getByTestId('palette-service')).toBeVisible();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await page.getByTestId('palette-service').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('New Service', { exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('New Service');

  await page.getByRole('button', { name: 'Close object palette' }).click();
  await expect(palette).toBeHidden();
  await page.getByRole('button', { name: 'Open object palette' }).click();
  await expect(palette).toBeVisible();

  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await page.getByRole('button', { name: 'Close Inspector' }).click();
  await expect(inspector).toBeHidden();
  await page.getByRole('button', { name: 'Open Inspector' }).click();
  await expect(inspector).toBeVisible();
});

test('keeps the canvas usable at the narrow breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Object palette' })).toBeHidden();
  await expect(page.getByRole('complementary', { name: 'Inspector' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open object palette' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('exposes the structured preview feedback path without replacing Studio', async ({ page }) => {
  await page.goto('/');

  const feedback = page.getByRole('link', { name: 'Send Studio preview feedback' });
  await expect(feedback).toBeVisible();
  await expect(feedback).toHaveAttribute('href', 'https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml');
  await expect(feedback).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
});

test('renders a nonblank dark canvas and lazy workspace drawer', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('topology.yaml', { exact: true })).toBeVisible();
  const canvas = await page.getByTestId('studio-canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(300);
  expect(canvas?.height).toBeGreaterThan(300);
  const background = await page.getByTestId('studio-canvas').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).not.toBe('rgba(0, 0, 0, 0)');
});

test('keeps primary controls reachable at the 200 percent zoom reflow width', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 900 });
  await page.goto('/');

  await expect(page.getByText('TopoViewer Studio')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open workspace drawer' })).toBeVisible();
  const canvas = await page.getByTestId('studio-canvas').boundingBox();
  expect(canvas?.width).toBeGreaterThan(150);
  expect(canvas?.height).toBeGreaterThan(200);
  const layout = await page.evaluate(() => {
    const product = document.querySelector('.studio-product')?.getBoundingClientRect();
    const actions = document.querySelector('.studio-header-actions')?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      separated: Boolean(product && actions && product.bottom <= actions.top + 1)
    };
  });
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.separated).toBe(true);
});

test('contains a render failure without blanking recovery guidance', async ({ page }) => {
  await page.goto('/?__studio-test-state=render-error');

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Studio could not open' })).toBeVisible();
  await expect(page.getByText('The project source has not been changed.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
