import { expect, test } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';
import { openStudioWorkspace } from '../support/workspaceRail';

test('authors, edits, restores, saves, and reloads one node through the canvas-first workflow', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  await expect(page.getByText('TopoViewer Studio')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Objects' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Properties' })).toBeVisible();
  await expect(page.locator('.studio-shell > .studio-inspector')).toHaveCount(0);
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
  const placement = await page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-icon').evaluate((node) => {
    const canvas = node.closest<HTMLElement>('[data-testid="studio-canvas"]');
    if (!canvas) return undefined;
    const nodeBox = node.getBoundingClientRect();
    const canvasBox = canvas.getBoundingClientRect();
    return {
      x: nodeBox.left + nodeBox.width / 2 - canvasBox.left,
      y: nodeBox.top + nodeBox.height / 2 - canvasBox.top
    };
  });
  expect(placement?.x, 'drop centers the object under the pointer').toBeCloseTo(300, 0);
  expect(placement?.y, 'drop centers the object under the pointer').toBeCloseTo(220, 0);

  const properties = await openStudioWorkspace(page, 'Properties');
  const name = properties.getByRole('textbox', { name: 'Name' });
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
  await page.goto('/?__studio-test-state=starter');
  const palette = page.getByRole('complementary', { name: 'Objects' });
  for (const family of ['Nodes', 'Edges', 'Annotations']) {
    await expect(palette.getByRole('button', { exact: true, name: `${family} palette group` })).toBeVisible();
  }
  await expect(palette.getByRole('heading', { name: 'Topology' })).toHaveCount(0);
  await expect(palette.getByRole('heading', { name: 'Assets' })).toHaveCount(0);
  await expect(page.getByTestId('palette-router')).toHaveAccessibleName('Router: Drag to canvas or click to add');
  const nodesGroup = palette.getByRole('button', { exact: true, name: 'Nodes palette group' });
  const annotationsGroup = palette.getByRole('button', { name: 'Annotations palette group' });
  await expect(nodesGroup).toHaveAttribute('aria-expanded', 'true');
  await expect(annotationsGroup).toHaveAttribute('aria-expanded', 'false');
  await nodesGroup.click();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await page.getByRole('searchbox', { name: 'Search objects and templates' }).fill('router');
  await expect(page.getByTestId('palette-router')).toBeVisible();
  await page.getByRole('button', { name: 'Clear object search' }).click();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await nodesGroup.click();
  await expect(page.getByTestId('palette-router').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(page.getByTestId('palette-controller').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-controller').click();
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  const controller = page.locator('.react-flow__node[data-id="controller-1"]');
  await expect(router.locator('.topoviewer-node-icon-image')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(controller.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Controller');
});

test('keeps palette drop placement centered after viewport zoom', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const canvas = page.getByTestId('studio-canvas');
  const zoomIn = page.locator('.studio-canvas-viewport-controls').getByRole('button', { name: 'Zoom In' });
  await zoomIn.click();
  await zoomIn.click();
  await page.getByTestId('palette-router').dragTo(canvas, { targetPosition: { x: 680, y: 420 } });

  const placement = await page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-icon').evaluate((node) => {
    const owner = node.closest<HTMLElement>('[data-testid="studio-canvas"]');
    if (!owner) return undefined;
    const nodeBox = node.getBoundingClientRect();
    const canvasBox = owner.getBoundingClientRect();
    return {
      x: nodeBox.left + nodeBox.width / 2 - canvasBox.left,
      y: nodeBox.top + nodeBox.height / 2 - canvasBox.top
    };
  });
  expect(placement?.x).toBeCloseTo(680, 0);
  expect(placement?.y).toBeCloseTo(420, 0);
});

test('shows contextual properties and hands mapper editing to the dedicated workspace', async ({ page }) => {
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Properties');

  await expect(properties.getByRole('tab')).toHaveCount(0);
  await expect(properties.getByText('Select an object on the canvas.')).toBeVisible();
  const viewport = await openStudioWorkspace(page, 'Viewport');
  await expect(viewport.getByRole('switch', { name: /Alignment assistance/ })).toBeChecked();
  await expect(viewport.getByRole('spinbutton', { name: 'Grid size' })).toHaveValue('20');
  await expect(viewport.getByRole('switch', { name: /Grid/ })).toBeChecked();
  await viewport.getByRole('button', { name: 'Advanced viewport' }).click();
  await expect(viewport.getByRole('switch', { name: /Minimap/ })).not.toBeChecked();
  const viewportWidth = viewport.getByRole('spinbutton', { name: 'Viewport width' });
  await viewportWidth.fill('1440');
  await viewportWidth.blur();
  await expect(viewportWidth).toHaveValue('1440');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-controller').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Name' })).toHaveValue('New Controller');
  await expect(properties.getByRole('tab')).toHaveCount(0);
  const mapper = await openStudioWorkspace(page, 'Mapper');
  await expect(mapper.getByText('No mapper yet')).toBeVisible();

  await page.locator('.react-flow__pane').click({ position: { x: 560, y: 520 } });
  await expect(page.getByRole('tab', { name: 'Viewport' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Viewport workspace' })).toBeVisible();
  await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByText('Select an object on the canvas.')).toBeVisible();

  await openStudioWorkspace(page, 'Objects');
  const annotations = page.getByRole('button', { name: 'Annotations palette group' });
  await annotations.click();
  const shapeTemplate = page.getByTestId('palette-shape');
  await shapeTemplate.scrollIntoViewIfNeeded();
  await shapeTemplate.click();
  await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Name' })).toHaveValue('New Shape');
  await expect(properties.getByRole('tab')).toHaveCount(0);
});

test('exposes shape-aware ports and creates an ordinary link without a palette mode', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  await openStudioWorkspace(page, 'Objects');
  await page.getByTestId('palette-router').click();

  const sourceNode = page.locator('.react-flow__node[data-id="router-1"]');
  const targetNode = page.locator('.react-flow__node[data-id="router-2"]');
  await sourceNode.click();
  const sourcePorts = sourceNode.locator('.topoviewer-node-shape-handle.source[data-shape-active="true"]');
  await expect(sourcePorts).toHaveCount(4);
  for (const port of await sourcePorts.all()) await expect(port).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).not.toHaveAttribute('data-edge-authoring-mode', /.+/);

  const style = await openStyleWorkspace(page);
  await editStyleAttribute(style, 'Shape');
  await selectStudioOption(page, style.getByRole('combobox', { name: 'Shape' }), 'hexagon');
  await expect(sourceNode.locator('.topoviewer-node-shape-handle.source[data-shape-active="true"]')).toHaveCount(6);

  const source = sourceNode.locator('.topoviewer-node-shape-handle.source[data-shape-active="true"]').nth(1);
  const sourceBox = await source.boundingBox();
  if (!sourceBox) throw new Error('Source connection point is not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  const target = targetNode.locator('.topoviewer-node-shape-handle.source[data-shape-active="true"]').nth(3);
  await expect(target).toBeVisible();
  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error('Target connection point is not measurable.');
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  await expect(page.locator('.react-flow__edge path.react-flow__edge-path')).toHaveAttribute('d', /\S+/);
});

test('keeps authoring and viewport tools bounded while exposing explicit edge authoring', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const authoringTools = page.getByRole('navigation', { name: 'Canvas authoring tools' });
  const viewportControls = page.locator('.studio-canvas-viewport-controls');
  await expect(authoringTools).toHaveCount(1);
  await expect(viewportControls).toHaveCount(1);
  await expect(viewportControls.getByRole('button', { name: 'Zoom In' })).toBeVisible();
  await expect(authoringTools.getByRole('button', { name: 'Layers' })).toBeVisible();

  const linkTemplate = page.getByTestId('palette-link');
  await expect(linkTemplate).toBeEnabled();
  await linkTemplate.click();
  await expect(page.getByTestId('studio-canvas')).toHaveAttribute('data-edge-authoring-mode', 'link');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('studio-canvas')).not.toHaveAttribute('data-edge-authoring-mode', 'link');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click({ modifiers: ['Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  const link = page.locator('.react-flow__edge[data-id="link-1"]');
  await expect(link).toHaveCount(1);
  await expect(link.locator('path').first()).toHaveAttribute('d', /\S+/);
});

test('applies viewport display preferences without mutating topology source', async ({ page }) => {
  await page.goto('/');
  const properties = await openStudioWorkspace(page, 'Viewport');
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const grid = properties.getByRole('switch', { name: /Grid/ });
  await grid.uncheck();
  await expect(page.locator('.react-flow__background')).toHaveCount(0);

  await properties.getByRole('button', { name: 'Advanced viewport' }).click();
  const minimap = properties.getByRole('switch', { name: /Minimap/ });
  await minimap.check();
  await expect(page.getByLabel('Topology minimap')).toBeVisible();

  const viewportControls = properties.getByRole('switch', { name: /Viewport controls/ });
  await viewportControls.uncheck();
  await expect(page.getByRole('button', { name: 'Zoom In' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Layers' })).toBeVisible();

  const background = properties.getByRole('textbox', { exact: true, name: 'Canvas background' });
  await background.fill('#123456');
  await background.press('Enter');
  const viewer = page.getByTestId('studio-canvas').locator(':scope > .topoviewer');
  await expect(viewer).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(viewer).toHaveCSS('background-image', 'none');
  const gridColor = properties.getByRole('textbox', { exact: true, name: 'Grid color' });
  await gridColor.fill('#abcdef');
  await gridColor.press('Enter');
  await grid.check();
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgb(171, 205, 239)');

  await properties.getByRole('button', { name: 'Reset Canvas background to default' }).click();
  await expect(background).toHaveValue('#0d151e');
  await expect(viewer).toHaveCSS('background-color', 'rgb(13, 21, 30)');
  await properties.getByRole('button', { name: 'Reset Grid color to default' }).click();
  await expect(gridColor).toHaveValue('#49657f');
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgb(73, 101, 127)');
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('adds a visual template icon to an imported stylesheet that has no icon catalog', async ({ page }) => {
  await page.goto('/?__studio-test-state=unstyled');
  await page.getByTestId('palette-router').click();
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  await expect(router.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Router');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await page.getByLabel('stylesheet YAML editor').focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill('topoviewer.router');
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
});

test('searches, creates by keyboard, and collapses desktop panels', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Search objects and templates' }).fill('service');
  await expect(page.getByTestId('palette-service')).toBeVisible();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear object search' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear object search' }).click();
  await expect(page.getByTestId('palette-router')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear object search' })).toHaveCount(0);
  await page.getByRole('searchbox', { name: 'Search objects and templates' }).fill('service');
  await page.getByTestId('palette-service').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('New Service', { exact: true })).toBeVisible();
  const properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Name' })).toHaveValue('New Service');

  await page.getByRole('button', { name: 'Close workspace panel' }).click();
  await expect(properties).toBeHidden();
  await page.getByRole('button', { name: 'Open workspace panel' }).click();
  await expect(properties).toBeVisible();
});

test('keeps the canvas usable at the narrow breakpoint', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/');

  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Objects' })).toBeHidden();
  await expect(page.getByRole('complementary', { name: 'Properties' })).toBeHidden();
  await expect(page.getByRole('button', { name: /properties/i })).toHaveCount(0);
  const openWorkspace = page.getByRole('button', { name: 'Open workspace panel' });
  await expect(openWorkspace).toBeVisible();
  await openWorkspace.click();
  const rail = await page.getByRole('navigation', { name: 'Studio workspaces' }).boundingBox();
  const objects = page.getByRole('complementary', { name: 'Objects' });
  const objectsBox = await objects.boundingBox();
  if (!rail || !objectsBox) throw new Error('Narrow workspace geometry is not measurable.');
  expect(objectsBox.x).toBeGreaterThanOrEqual(rail.x + rail.width - 1);
  await expect(objects.getByRole('heading', { name: 'Objects' })).toBeInViewport();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('renders a nonblank dark canvas and lazy workspace drawer', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?__studio-test-state=starter');

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
