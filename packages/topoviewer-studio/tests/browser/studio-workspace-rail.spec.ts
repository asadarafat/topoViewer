import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const artifactDirectory = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/workspace-rail');

test('switches one left workspace from the vertical rail without losing canvas context', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');

  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  await expect(rail.getByRole('tab')).toHaveText(['Objects', 'Properties', 'Style', 'Viewport', 'Mapper']);
  await expect(rail.getByRole('tab', { name: 'Objects' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Objects' })).toBeVisible();

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(rail.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Style workspace' })).toBeVisible();
  await rail.getByRole('tab', { name: 'Properties' }).click();
  const objectProperties = page.getByRole('complementary', { name: 'Properties' });
  await expect(objectProperties).toBeVisible();
  await expect(objectProperties.getByRole('textbox', { name: 'Name' })).toHaveValue('Leaf 1');
  await expect(objectProperties.getByRole('tab')).toHaveCount(0);

  await rail.getByRole('tab', { name: 'Objects' }).click();
  const paletteSearch = page.getByRole('searchbox', { name: 'Search objects and templates' });
  await paletteSearch.fill('router');

  await rail.getByRole('tab', { name: 'Style' }).click();
  const style = page.getByRole('complementary', { name: 'Style workspace' });
  await expect(style.getByRole('tab')).toHaveText(['Basic', 'YAML']);
  await expect(style.locator('.studio-basic-style-field').first()).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Objects', includeHidden: true })).toBeHidden();
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toHaveClass(/selected/);
  await style.getByRole('searchbox', { name: 'Search Basic style fields' }).fill('label');
  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(rail.getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true');

  await rail.getByRole('tab', { name: 'Viewport' }).click();
  const viewport = page.getByRole('complementary', { name: 'Viewport workspace' });
  await expect(viewport.getByRole('spinbutton', { name: 'Grid size' })).toBeVisible();

  const viewportTab = rail.getByRole('tab', { name: 'Viewport' });
  await viewportTab.focus();
  await page.keyboard.press('ArrowDown');
  await expect(rail.getByRole('tab', { name: 'Mapper' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Telemetry mapper workspace' })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="leaf2"]')).toHaveClass(/selected/);

  await rail.getByRole('tab', { name: 'Style' }).click();
  await expect(style.getByRole('searchbox', { name: 'Search Basic style fields' })).toHaveValue('label');
  await rail.getByRole('tab', { name: 'Properties' }).click();
  await expect(objectProperties.getByRole('textbox', { name: 'Name' })).toHaveValue('Leaf 2');
  await rail.getByRole('tab', { name: 'Objects' }).click();
  await expect(paletteSearch).toHaveValue('router');
});

test('keeps every workspace bounded, non-overlapping, and accessible', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  const rail = page.getByRole('tablist', { name: 'Workspace views' });

  for (const view of ['Objects', 'Properties', 'Style', 'Viewport', 'Mapper']) {
    await rail.getByRole('tab', { name: view }).click();
    const panel = page.locator('.studio-left-workspace-content');
    const bounds = await page.locator('.studio-left-workspace').evaluate((workspace) => {
      const content = workspace.querySelector<HTMLElement>('.studio-left-workspace-content');
      const navigation = workspace.querySelector<HTMLElement>('.studio-workspace-rail');
      if (!content || !navigation) return undefined;
      const contentBox = content.getBoundingClientRect();
      const navigationBox = navigation.getBoundingClientRect();
      const workspaceBox = workspace.getBoundingClientRect();
      return {
        contentOverflow: content.scrollWidth - content.clientWidth,
        contentLeft: contentBox.left,
        contentRight: contentBox.right,
        navigationLeft: navigationBox.left,
        navigationRight: navigationBox.right,
        navigationPrecedesContent: Boolean(
          navigation.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        workspaceLeft: workspaceBox.left,
        workspaceRight: workspaceBox.right,
        workspaceOverflow: workspace.scrollWidth - workspace.clientWidth
      };
    });
    expect(bounds, `${view} workspace geometry`).toBeDefined();
    expect(bounds?.contentOverflow, `${view} content overflow`).toBeLessThanOrEqual(1);
    expect(bounds?.workspaceOverflow, `${view} workspace overflow`).toBeLessThanOrEqual(1);
    expect(bounds?.navigationLeft, `${view} rail is not leftmost`).toBeCloseTo(bounds?.workspaceLeft || 0, 0);
    expect(bounds?.navigationRight, `${view} rail overlaps content`).toBeLessThanOrEqual((bounds?.contentLeft || 0) + 1);
    expect(bounds?.contentRight, `${view} content escapes workspace`).toBeLessThanOrEqual((bounds?.workspaceRight || 0) + 1);
    expect(bounds?.navigationPrecedesContent, `${view} DOM order differs from visual order`).toBe(true);
    await expect(panel).toBeVisible();

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations, `${view} accessibility violations`).toEqual([]);
  }

  await expect(page.locator('.studio-shell > .studio-inspector')).toHaveCount(0);
  const canvasRight = await page.getByTestId('studio-canvas').evaluate((canvas) => canvas.getBoundingClientRect().right);
  expect(canvasRight, 'canvas does not occupy the removed properties column').toBeCloseTo(1600, 0);

  await rail.getByRole('tab', { name: 'Mapper' }).click();
  const mapper = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  const formRows = await mapper.locator('.studio-mapper-basic-form > label').evaluateAll((labels) => labels.map((label) => {
    const box = label.getBoundingClientRect();
    return { bottom: box.bottom, top: box.top };
  }));
  expect(formRows.every((row, index) => index === 0 || row.top >= formRows[index - 1].bottom - 1), 'Mapper form rows overlap').toBe(true);
  await expect(mapper.locator('.studio-mapper-basic-form .MuiInputBase-root').first()).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('keeps the style workspace scoped to the selected object candidate', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Style' }).click();

  const style = page.getByRole('complementary', { name: 'Style workspace' });
  await expect(style.getByRole('combobox', { name: 'Style selector' })).toHaveCount(0);
  await expect(style.getByRole('heading', { name: 'leaf1' })).toBeVisible();
  await style.getByRole('searchbox', { name: 'Search Basic style fields' }).fill('background color');
  await expect(style.locator('[data-field-path="backgroundColor"] input[type="text"]')).toBeVisible();
  await expect(style.getByRole('menu')).toHaveCount(0);
});

test('captures the five left workspaces at desktop and constrained widths', async ({ page }) => {
  await mkdir(artifactDirectory, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  for (const view of ['Objects', 'Properties', 'Style', 'Viewport', 'Mapper']) {
    await rail.getByRole('tab', { name: view }).click();
    if (view === 'Mapper') await expect(page.getByRole('region', { name: 'Telemetry mapper workspace' })).toBeVisible();
    await page.screenshot({ path: path.join(artifactDirectory, `${view.toLocaleLowerCase()}-desktop.png`) });
  }

  await rail.getByRole('tab', { name: 'Style' }).click();
  const style = page.getByRole('complementary', { name: 'Style workspace' });
  await style.getByRole('searchbox', { name: 'Search Basic style fields' }).fill('background color');
  await expect(style.locator('[data-field-path="backgroundColor"] input[type="text"]')).toBeVisible();
  await page.screenshot({ path: path.join(artifactDirectory, 'style-object-context-desktop.png') });

  await page.setViewportSize({ width: 1180, height: 760 });
  await rail.getByRole('tab', { name: 'Style' }).click();
  await page.screenshot({ path: path.join(artifactDirectory, 'style-constrained.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
