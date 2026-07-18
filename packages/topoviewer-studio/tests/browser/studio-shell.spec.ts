import { expect, test } from '@playwright/test';
import { selectStudioOption } from '../support/mui';
import { openStyleWorkspace } from '../support/basicStyle';
import { openEditCodeDocument, openStudioWorkspace } from '../support/workspaceRail';
import { invokeStudioHeaderAction } from '../support/headerActions';

test('authors, edits, restores, saves, and reloads one node through the canvas-first workflow', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');

  await expect(page.getByText('TopoViewer Studio')).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Objects' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Edit' })).toBeVisible();
  await expect(page.locator('.studio-shell > .studio-inspector')).toHaveCount(0);
  await expect(page.getByText('Untitled topology')).toBeVisible();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await expect(page.getByText('Browser project')).toBeVisible();
  await expect(page.getByText('Empty topology')).toBeVisible();

  const started = Date.now();
  await page.getByTestId('palette-router').dragTo(page.getByTestId('studio-canvas'), {
    targetPosition: { x: 300, y: 220 }
  });
  await expect(page.getByText('router-1', { exact: true })).toBeVisible();
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
  const name = properties.getByRole('textbox', { name: 'Visible label' });
  await expect(name).toHaveValue('');
  await name.fill('Core Router');
  await name.press('Enter');
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  await expect(router.getByText('Core Router', { exact: true })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(router.getByText('router-1', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(router.getByText('Core Router', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();
  await name.fill('Unsaved Router');
  await name.press('Enter');
  await invokeStudioHeaderAction(page, 'Reload project');
  await expect(router.getByText('Core Router', { exact: true })).toBeVisible();
});

test('groups palette templates by canonical object family and previews visual node templates', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
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
  await expect(annotationsGroup).toHaveAttribute('aria-expanded', 'true');
  await nodesGroup.click();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await page.getByRole('searchbox', { name: 'Search objects and templates' }).fill('router');
  await expect(page.getByTestId('palette-router')).toBeVisible();
  await page.getByRole('button', { name: 'Clear object search' }).click();
  await expect(page.getByTestId('palette-router')).toBeHidden();
  await nodesGroup.click();
  await expect(page.getByTestId('palette-router').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(page.getByTestId('palette-controller').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  const builtInTemplateIds = ['router', 'controller', 'service', 'parent-child', 'link', 'parallel-link', 'parent-link-pipe', 'path', 'directional-link', 'region', 'shape', 'callout', 'text'] as const;
  for (const id of builtInTemplateIds) {
    const template = page.getByTestId(`palette-${id}`);
    expect(await template.locator('.studio-template-preview-shell').boundingBox()).toMatchObject({ height: 40, width: 64 });
    expect(await template.locator('.studio-template-preview').boundingBox()).toMatchObject({ height: 28, width: 52 });
  }
  for (const id of ['router', 'controller', 'service']) {
    const bounds = await page.getByTestId(`palette-${id}`).locator('img').boundingBox();
    expect(bounds).toMatchObject({ height: 28, width: 28 });
  }
  await expect(page.getByTestId('palette-parent-child').getByTestId('AccountTreeIcon')).toBeVisible();
  expect(await page.getByTestId('palette-parent-child-glyph').boundingBox()).toMatchObject({ height: 28, width: 28 });
  expect(await page.getByTestId('palette-parent-child').getByTestId('AccountTreeIcon').boundingBox()).toMatchObject({ height: 20, width: 20 });
  for (const id of ['region', 'shape', 'callout', 'text']) {
    const bounds = await page.getByTestId(`palette-${id}`).locator('.studio-template-preview > svg').boundingBox();
    expect(bounds).toMatchObject({ height: 28, width: 28 });
  }
  const linkPreview = page.getByTestId('palette-link');
  const parallelPreview = page.getByTestId('palette-parallel-link');
  const parentPipePreview = page.getByTestId('palette-parent-link-pipe');
  const pathPreview = page.getByTestId('palette-path');
  const directionalPreview = page.getByTestId('palette-directional-link');
  await expect(linkPreview.locator('.studio-preview-edge-endpoint')).toHaveCount(2);
  await expect(linkPreview.locator('.studio-preview-edge-arrow-primary')).toHaveCount(1);
  await expect(parallelPreview.locator('.studio-preview-edge-endpoint')).toHaveCount(2);
  await expect(parallelPreview.locator('.studio-preview-edge-primary, .studio-preview-edge-secondary, .studio-preview-edge-info')).toHaveCount(3);
  await expect(parentPipePreview.locator('.studio-preview-edge-pipe-shell')).toHaveCount(1);
  await expect(parentPipePreview.locator('.studio-preview-edge-lane')).toHaveCount(1);
  await expect(parentPipePreview.locator('.studio-preview-edge-arrow-lane')).toHaveCount(1);
  await expect(pathPreview.locator('.studio-preview-edge-waypoint')).toHaveCount(3);
  await expect(pathPreview.locator('.studio-preview-edge-arrow-secondary')).toHaveCount(1);
  await expect(directionalPreview.locator('.studio-preview-edge-arrow-forward')).toHaveCount(1);
  await expect(directionalPreview.locator('.studio-preview-edge-arrow-reverse')).toHaveCount(1);
  for (const edgePreview of [linkPreview, parallelPreview, parentPipePreview, pathPreview, directionalPreview]) {
    const bounds = await edgePreview.locator('.studio-preview-edge').boundingBox();
    expect(bounds).toMatchObject({ height: 28, width: 52 });
  }
  await expect(linkPreview.getByTestId('AddLinkIcon')).toBeVisible();
  await parallelPreview.click();
  await expect(parallelPreview.getByTestId('CheckIcon')).toBeVisible();
  await expect(parallelPreview).toHaveAttribute('aria-pressed', 'true');
  await parallelPreview.click();
  const paletteColors = await palette.evaluate((root) => {
    const resolvedColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${token})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const normalizedColor = (value: string | undefined) => {
      if (!value) return value;
      const probe = document.createElement('span');
      probe.style.color = value;
      document.body.append(probe);
      const normalized = getComputedStyle(probe).color;
      probe.remove();
      return normalized;
    };
    const svgColors = (testId: string) => {
      const source = root.querySelector<HTMLImageElement>(`[data-testid="${testId}"] img`)?.src || '';
      const svg = decodeURIComponent(source.slice(source.indexOf(',') + 1));
      return {
        fill: normalizedColor(svg.match(/<rect[^>]+fill="([^"]+)"/)?.[1]),
        stroke: normalizedColor(svg.match(/<g[^>]+stroke="([^"]+)"/)?.[1])
      };
    };
    const commonWhite = resolvedColor('--mui-palette-common-white');
    return {
      callout: getComputedStyle(root.querySelector('[data-testid="palette-callout"] svg') as SVGElement).color,
      commonWhite,
      link: getComputedStyle(root.querySelector('.studio-preview-edge-primary') as SVGElement).stroke,
      region: getComputedStyle(root.querySelector('[data-testid="palette-region"] svg') as SVGElement).color,
      router: svgColors('palette-router'),
      whiteTint: commonWhite.replace(/^rgb\((.+)\)$/, 'rgba($1, 0.08)')
    };
  });
  expect(paletteColors.router.fill).toBe(paletteColors.whiteTint);
  expect(paletteColors.router.stroke).toBe(paletteColors.commonWhite);
  expect(paletteColors.link).toBe(paletteColors.commonWhite);
  expect(paletteColors.callout).toBe(paletteColors.commonWhite);
  expect(paletteColors.region).toBe(paletteColors.commonWhite);
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-controller').click();
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  const controller = page.locator('.react-flow__node[data-id="controller-1"]');
  await expect(router.locator('.topoviewer-node-icon-image')).toHaveAttribute('src', /^data:image\/svg\+xml/);
  await expect(controller.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Nokia controller');
});

test('uses a compact object preview instead of dragging the full palette row', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const result = await page.getByTestId('palette-router').evaluate((source) => {
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
    const preview = document.querySelector<HTMLElement>('[data-testid="studio-palette-drag-preview"]');
    const row = source.getBoundingClientRect();
    const bounds = preview?.getBoundingClientRect();
    return {
      hasPaletteCopy: Boolean(preview?.querySelector('.studio-template-copy')),
      label: preview?.textContent?.trim(),
      previewWidth: bounds?.width,
      rowWidth: row.width,
      visualCount: preview?.querySelectorAll('.studio-template-preview').length
    };
  });

  expect(result.label).toBe('Router');
  expect(result.visualCount).toBe(1);
  expect(result.hasPaletteCopy).toBe(false);
  expect(result.previewWidth).toBeLessThan((result.rowWidth || 0) * 0.75);
  await page.getByTestId('palette-router').dispatchEvent('dragend');
  await expect(page.getByTestId('studio-palette-drag-preview')).toHaveCount(0);
});

test('keeps palette template names legible in a compact workspace', async ({ page }) => {
  await page.setViewportSize({ height: 768, width: 1024 });
  await page.goto('/?__studio-test-state=starter');
  for (const id of ['router', 'controller', 'service', 'parent-child', 'link', 'parallel-link', 'parent-link-pipe', 'path', 'directional-link', 'region', 'shape', 'callout', 'text']) {
    const row = page.getByTestId(`palette-${id}`);
    const title = row.locator('.studio-template-copy > span').first();
    const dimensions = await title.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(page.getByTestId('palette-link').getByTestId('AddLinkIcon')).toBeHidden();
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
  await expect(properties.getByRole('textbox', { name: 'Visible label' })).toHaveValue('');
  await expect(properties.getByRole('searchbox', { name: 'Search style attributes' })).toBeVisible();
  await expect(properties.getByRole('tab', { name: 'Selector Style' })).toHaveCount(0);
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
  await expect(properties.getByRole('textbox', { name: 'Visible label' })).toHaveValue('');
  await expect(properties.getByRole('searchbox', { name: 'Search style attributes' })).toBeVisible();
  await expect(properties.getByRole('button', { name: /YAML/ })).toHaveCount(0);
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

test('keeps canvas tools in one bounded vertical stack while exposing explicit edge authoring', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const canvasTools = page.locator('.studio-canvas-unified-controls');
  await expect(page.getByRole('navigation', { name: 'Canvas authoring tools' })).toHaveCount(0);
  await expect(canvasTools).toHaveCount(1);
  await expect(canvasTools.getByRole('button', { name: 'Zoom In' })).toBeVisible();
  await expect(canvasTools.getByRole('button', { name: 'Select and lasso' })).toHaveAttribute('aria-pressed', 'true');
  await expect(canvasTools.getByRole('button', { name: 'Pan canvas' })).toHaveAttribute('aria-pressed', 'false');
  await expect(canvasTools.getByRole('button', { name: 'Duplicate selection' })).toHaveCount(0);
  await expect(canvasTools.getByRole('button', { name: 'Layers' })).toBeVisible();
  const controlMetrics = await canvasTools.locator('.react-flow__controls-button').evaluateAll((buttons) =>
    buttons.map((button) => {
      const icon = button.querySelector('svg');
      const buttonBox = button.getBoundingClientRect();
      const iconBox = icon?.getBoundingClientRect();
      return {
        buttonHeight: buttonBox.height,
        buttonWidth: buttonBox.width,
        iconHeight: iconBox?.height,
        iconWidth: iconBox?.width,
        materialIcon: icon?.classList.contains('MuiSvgIcon-root') || false,
        viewBox: icon?.getAttribute('viewBox')
      };
    })
  );
  expect(controlMetrics.length).toBeGreaterThan(0);
  expect(controlMetrics.every((metric) => metric.buttonHeight === 30 && metric.buttonWidth === 30)).toBe(true);
  expect(controlMetrics.every((metric) => metric.iconHeight === 18 && metric.iconWidth === 18)).toBe(true);
  expect(controlMetrics.every((metric) => metric.materialIcon && metric.viewBox === '0 0 24 24')).toBe(true);
  const zoomIn = canvasTools.getByRole('button', { name: 'Zoom In' });
  await zoomIn.hover();
  const toolbarRhythm = await canvasTools.evaluate((toolbar) => {
    const toolbarBox = toolbar.getBoundingClientRect();
    const button = toolbar.querySelector<HTMLElement>('.react-flow__controls-button');
    const buttonBox = button?.getBoundingClientRect();
    const buttonStyle = button ? getComputedStyle(button) : undefined;
    const dividers = [...toolbar.querySelectorAll<HTMLElement>('.studio-canvas-control-separator')];
    return {
      buttonBottomBorder: buttonStyle?.borderBottomWidth,
      buttonLeftInset: buttonBox ? buttonBox.left - toolbarBox.left : undefined,
      buttonRightInset: buttonBox ? toolbarBox.right - buttonBox.right : undefined,
      dividerWidths: dividers.map((divider) => divider.getBoundingClientRect().width),
      toolbarBorder: Number.parseFloat(getComputedStyle(toolbar).borderLeftWidth),
      toolbarWidth: toolbarBox.width
    };
  });
  expect(toolbarRhythm.buttonBottomBorder).toBe('0px');
  expect(toolbarRhythm.buttonLeftInset).toBe(toolbarRhythm.toolbarBorder);
  expect(toolbarRhythm.buttonRightInset).toBe(toolbarRhythm.toolbarBorder);
  expect(toolbarRhythm.dividerWidths).toHaveLength(2);
  expect(toolbarRhythm.dividerWidths.every((width) => width === 30)).toBe(true);
  expect(toolbarRhythm.toolbarWidth).toBe(32);
  const canvasBox = await page.getByTestId('studio-canvas').boundingBox();
  const toolbarBox = await canvasTools.boundingBox();
  if (!canvasBox || !toolbarBox) throw new Error('Canvas toolbar bounds are not measurable.');
  expect(toolbarBox.x).toBeLessThan(canvasBox.x + canvasBox.width / 2);

  const linkTemplate = page.getByTestId('palette-link');
  await expect(linkTemplate).toBeEnabled();
  await linkTemplate.click();
  await expect(page.getByTestId('studio-canvas')).toHaveAttribute('data-edge-authoring-mode', 'link');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('studio-canvas')).not.toHaveAttribute('data-edge-authoring-mode', 'link');
  await page.getByTestId('palette-router').click();
  await page.getByTestId('palette-router').click();
  await expect(canvasTools.getByRole('button', { name: 'Duplicate selection' })).toBeVisible();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click({ modifiers: ['Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  const link = page.locator('.react-flow__edge[data-id="link-1"]');
  await expect(link).toHaveCount(1);
  await expect(link.locator('path').first()).toHaveAttribute('d', /\S+/);
});

test('keeps fit-to-view objects clear of the unified canvas toolbar', async ({ page }) => {
  await page.goto('/?__studio-test-state=dense');
  const toolbar = page.locator('.studio-canvas-unified-controls');
  await toolbar.getByRole('button', { name: 'Fit View' }).click();
  await page.waitForTimeout(300);

  const toolbarBox = await toolbar.boundingBox();
  const objectBoxes = await page.locator('.react-flow__node:visible').evaluateAll((nodes) =>
    nodes.map((node) => {
      const bounds = node.getBoundingClientRect();
      return { bottom: bounds.bottom, left: bounds.left, right: bounds.right, top: bounds.top };
    })
  );
  if (!toolbarBox || objectBoxes.length === 0) throw new Error('Fit-view bounds are not measurable.');

  const toolbarRight = toolbarBox.x + toolbarBox.width;
  const toolbarBottom = toolbarBox.y + toolbarBox.height;
  const overlapsToolbar = objectBoxes.some((box) => box.left < toolbarRight && box.right > toolbarBox.x && box.top < toolbarBottom && box.bottom > toolbarBox.y);
  expect(overlapsToolbar).toBe(false);
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
  await expect(background).toHaveValue('#121212');
  await expect(viewer).toHaveCSS('background-color', 'rgb(18, 18, 18)');
  await properties.getByRole('button', { name: 'Reset Grid color to default' }).click();
  await expect(gridColor).toHaveValue('#49657f');
  await expect(page.locator('.react-flow__background-pattern.dots').first()).toHaveCSS('fill', 'rgb(73, 101, 127)');
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('adds a visual template icon to an imported stylesheet that has no icon catalog', async ({ page }) => {
  await page.goto('/?__studio-test-state=unstyled');
  await page.getByTestId('palette-router').click();
  const router = page.locator('.react-flow__node[data-id="router-1"]');
  await expect(router.locator('.topoviewer-node-icon-image')).toHaveAttribute('alt', 'Nokia router');

  await openEditCodeDocument(page, 'stylesheet');
  await page.getByLabel('stylesheet YAML editor').focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill('nokia.router');
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
  await expect(page.getByText('service-1', { exact: true })).toBeVisible();
  const properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Visible label' })).toHaveValue('');

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
  await expect(page.getByRole('complementary', { name: 'Edit workspace' })).toBeHidden();
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

test('renders a nonblank dark canvas and lazy Code editor', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?__studio-test-state=starter');

  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.monaco-editor')).toHaveCount(0);
  const edit = await openEditCodeDocument(page, 'topology');
  await expect(edit.getByLabel('topology YAML editor')).toBeVisible();
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
  await expect(page.getByRole('button', { name: 'Open workspace panel' })).toBeVisible();
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
