import { expect, test } from '@playwright/test';
import { openStudioWorkspace } from '../support/workbench';

test('opens one YAML-first project workbench with a one-quarter source split and real preview', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=starter');

  await expect(page.getByRole('navigation', { name: 'Project source' })).toBeVisible();
  await expect(page.getByRole('tablist', { name: 'Workspace views' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'topology.yaml' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'stylesheet.yaml' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'mapper.yaml' })).toBeVisible();

  const layouts = page.getByRole('group', { name: 'Workbench layout' });
  await expect(layouts.getByRole('button', { name: 'Split' })).toHaveAttribute('aria-pressed', 'true');
  const source = page.getByTestId('studio-source-pane');
  const preview = page.getByTestId('studio-preview-pane');
  await expect(source.getByLabel('topology YAML editor')).toBeVisible();
  await expect(preview.getByTestId('studio-canvas')).toBeVisible();
  await expect(preview.locator('.react-flow')).toBeVisible();

  const [sourceBox, previewBox] = await Promise.all([source.boundingBox(), preview.boundingBox()]);
  if (!sourceBox || !previewBox) throw new Error('The split workbench is not measurable.');
  const ratio = previewBox.width / sourceBox.width;
  expect(ratio).toBeGreaterThan(2.8);
  expect(ratio).toBeLessThan(3.2);
});

test('uses the approved YAML-first shell hierarchy', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const header = page.getByRole('banner');
  const context = page.getByLabel('Workbench context');
  const previewControls = page.getByLabel('Preview controls');
  const dock = page.getByRole('region', { name: 'Project session details' });

  await expect(header.getByText('TopoViewer Studio', { exact: true })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Save project' })).toBeVisible();
  await expect(context.getByRole('group', { name: 'Workbench layout' })).toBeVisible();
  await expect(context).toContainText('topology.yaml');
  await expect(context).toContainText('Valid');
  await expect(previewControls.getByRole('group', { name: 'Topology interaction mode' })).toBeVisible();
  await expect(previewControls.getByRole('searchbox', { name: 'Find topology object' })).toBeVisible();
  await expect(previewControls).toContainText(/source-linked.*nodes.*links/i);

  for (const name of ['Problems', 'Changes', 'Selection', 'History', 'Host events']) {
    await expect(dock.getByRole('tab', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  await expect(dock.getByRole('button', { name: 'Collapse project session details' })).toBeVisible();
});

test('toggles Project Source without replacing source or preview state', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const navigator = page.getByRole('navigation', { name: 'Project source' });
  const source = page.getByTestId('studio-source-pane');
  const preview = page.getByTestId('studio-preview-pane');
  const hide = page.getByRole('button', { name: 'Hide project source' });

  await expect(navigator).toBeVisible();
  await expect(hide).toHaveAttribute('aria-expanded', 'true');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await hide.click();

  await expect(navigator).toBeHidden();
  await expect(source.getByLabel('topology YAML editor')).toBeVisible();
  await expect(preview.getByTestId('studio-canvas')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toHaveClass(/selected/);

  const show = page.getByRole('button', { name: 'Show project source' });
  await expect(show).toHaveAttribute('aria-expanded', 'false');
  await show.click();
  await expect(navigator).toBeVisible();
});

test('uses one semantic icon language and canonical Studio identity', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const header = page.getByRole('banner');
  const navigator = page.getByRole('navigation', { name: 'Project source' });
  const sourceToggle = header.getByRole('button', { name: 'Hide project source' });

  await expect(header.getByTestId('studio-brand-mark')).toBeVisible();
  const brandIcon = page.locator('head link[data-topoviewer-brand-icon="true"]');
  await expect(brandIcon).toHaveAttribute('type', 'image/svg+xml');
  await expect(brandIcon).toHaveAttribute(
    'href',
    /topoviewer-tile-dark.+\.svg$/
  );
  const sourceToggleIcon = sourceToggle.locator(
    '[data-studio-semantic-icon="project-source-toggle"]'
  );
  await expect(sourceToggleIcon).toHaveAttribute('data-mirrored-axis', 'vertical');
  await expect(sourceToggleIcon).toHaveCSS(
    'transform',
    'matrix(-1, 0, 0, 1, 0, 0)'
  );

  const objectDrawer = navigator.getByRole('button', { name: 'Object drawer' });
  await expect(
    objectDrawer.locator(
      '[data-studio-semantic-icon="object-drawer"][data-material-icon="VerticalSplitOutlined"]'
    )
  ).toBeVisible();
  await expect(navigator.getByRole('button', { name: /^Edges/ })).toBeVisible();
  await expect(navigator.getByRole('button', { name: /^Shapes/ })).toBeVisible();
  await expect(navigator.getByText('Links', { exact: true })).toHaveCount(0);
  await expect(navigator.getByText('Diagram', { exact: true })).toHaveCount(0);

  const outlineRegion = navigator.getByRole('button', { name: /^Regions/ });
  const outlineShapes = navigator.getByRole('button', { name: /^Shapes/ });
  await expect(
    outlineRegion.locator(
      '[data-studio-semantic-icon="region"][data-material-icon="SelectAll"]'
    )
  ).toBeVisible();
  await expect(
    outlineShapes.locator(
      '[data-studio-semantic-icon="shape"][data-material-icon="CropSquare"]'
    )
  ).toBeVisible();

  await objectDrawer.click();
  const palette = page.getByRole('complementary', { name: 'Add' });
  await expect(
    palette
      .getByTestId('palette-region')
      .locator('[data-studio-semantic-icon="region"][data-material-icon="SelectAll"]')
  ).toBeVisible();
  await expect(
    palette
      .getByTestId('palette-shape')
      .locator('[data-studio-semantic-icon="shape"][data-material-icon="CropSquare"]')
  ).toBeVisible();
});

test('restores Project Source and independent Authoring visibility through the browser host', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/');

  const navigator = page.getByRole('navigation', { name: 'Project source' });
  await navigator.getByRole('button', { name: 'Object drawer' }).click();
  const add = page.getByRole('complementary', { name: 'Add' });
  await page.getByRole('button', { name: 'Hide project source' }).click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const value = localStorage.getItem(
          'topoviewer-studio:preference:v1:workspace-layout'
        );
        return value ? JSON.parse(value).value : undefined;
      })
    )
    .toMatchObject({
      authoringOpen: true,
      navigatorOpen: false
    });

  await page.reload();
  await expect(navigator).toBeHidden();
  await expect(add).toBeVisible();
});

test('filters project source and keeps contextual drawers over the preview', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1600 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const navigator = page.getByRole('navigation', { name: 'Project source' });
  const filter = navigator.getByRole('searchbox', { name: 'Filter project source' });
  await filter.fill('style');
  await expect(navigator.getByRole('button', { name: 'stylesheet.yaml' })).toBeVisible();
  await expect(navigator.getByRole('button', { name: 'topology.yaml' })).toBeHidden();
  await filter.clear();

  const workspaceHeading = navigator.getByRole('heading', { exact: true, name: 'Workspace' });
  const authoringHeading = navigator.getByRole('heading', { exact: true, name: 'Authoring' });
  const outlineHeading = navigator.getByRole('heading', { exact: true, name: 'Topology outline' });
  const [workspaceBox, authoringBox, outlineBox] = await Promise.all([
    workspaceHeading.boundingBox(),
    authoringHeading.boundingBox(),
    outlineHeading.boundingBox()
  ]);
  if (!workspaceBox || !authoringBox || !outlineBox)
    throw new Error('Project Source section headings are not measurable.');
  expect(authoringBox.y).toBeGreaterThan(workspaceBox.y);
  expect(authoringBox.y).toBeLessThan(outlineBox.y);
  await expect(
    navigator.getByRole('separator', { name: 'Workspace and Authoring' })
  ).toBeVisible();
  await expect(
    navigator.getByRole('separator', { name: 'Authoring and Topology outline' })
  ).toBeVisible();

  const preview = page.getByTestId('studio-preview-pane');
  const canvasBefore = await preview.getByTestId('studio-canvas').boundingBox();
  await navigator.getByRole('button', { name: 'Object drawer' }).click();
  await expect(page.getByRole('complementary', { name: 'Add' })).toBeVisible();
  const canvasWithAdd = await preview.getByTestId('studio-canvas').boundingBox();
  expect(canvasWithAdd?.width).toBe(canvasBefore?.width);

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(page.getByRole('complementary', { name: 'Properties workspace' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Add' })).toBeVisible();
  const canvasWithProperties = await preview.getByTestId('studio-canvas').boundingBox();
  expect(canvasWithProperties?.width).toBe(canvasBefore?.width);
});

test('keeps project-source rows uniform and shows assets only when actionable', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  let navigator = page.getByRole('navigation', { name: 'Project source' });
  const topology = navigator.getByRole('button', { name: 'topology.yaml' });
  const stylesheet = navigator.getByRole('button', { name: 'stylesheet.yaml' });
  const mapper = navigator.getByRole('button', { name: 'mapper.yaml' });
  const rowHeights = await Promise.all(
    [topology, stylesheet, mapper].map(async (row) => (await row.boundingBox())?.height)
  );
  expect(new Set(rowHeights).size).toBe(1);
  const optionalStatus = mapper.locator('[data-source-status="optional"]');
  await expect(optionalStatus).toHaveText('Optional');
  await expect(optionalStatus).toHaveAttribute('title', 'Optional source is not created');
  await expect(navigator.getByRole('button', { name: /^assets/ })).toHaveCount(0);
  await expect(navigator.getByRole('button', { name: 'Object drawer' })).toHaveCSS(
    'border-top-width',
    '0px'
  );

  await page.goto('/?__studio-test-state=asset-preview');
  navigator = page.getByRole('navigation', { name: 'Project source' });
  const assets = navigator.getByRole('button', { name: /^assets/ });
  await expect(assets.locator('.MuiAccordionSummary-expandIconWrapper svg')).toBeVisible();
  expect(
    await assets
      .locator('xpath=ancestor::*[contains(@class, "MuiAccordion-root")][1]')
      .evaluate((accordion) => getComputedStyle(accordion, '::before').display)
  ).toBe('none');
  await assets.click();
  await expect(
    navigator.getByRole('button', { name: 'Preview asset assets/site.svg' })
  ).toBeVisible();
});

test('keeps Authoring open and opens Properties alongside preview selection', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1600 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const navigator = page.getByRole('navigation', { name: 'Project source' });
  await navigator.getByRole('button', { name: 'Object drawer' }).click();

  const add = page.getByRole('complementary', { name: 'Add' });
  await expect(add).toBeVisible();

  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.click();
  await expect(leaf).toHaveClass(/selected/);
  await expect(add).toBeVisible();
  const properties = page.getByRole('complementary', { name: 'Properties workspace' });
  await expect(properties).toBeVisible();

  await properties.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(properties).toBeHidden();
  await expect(add).toBeVisible();

  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(properties).toBeVisible();
  await add.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(add).toBeHidden();
  await expect(properties).toBeVisible();
});

test('uses compact control-owned MUI labels in object Properties', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const properties = page.getByRole('complementary', { name: 'Properties workspace' });
  await expect(properties).toBeVisible();

  const id = properties.getByRole('textbox', { name: 'ID' });
  const visibleLabel = properties.getByRole('textbox', { name: 'Visible label' });
  const appearanceSearch = properties.getByRole('searchbox', {
    name: 'Search style attributes'
  });
  await expect(id).toBeVisible();
  await expect(visibleLabel).toBeVisible();
  await expect(appearanceSearch).toBeVisible();
  await expect(properties.locator('label', { hasText: /^ID$/ })).toBeVisible();
  await expect(properties.locator('label', { hasText: /^Visible label$/ })).toBeVisible();
  await expect(properties.locator('label', { hasText: /^Search attributes$/ })).toBeVisible();
  await expect(properties.locator('.studio-property-row[data-property-label="ID"]')).toHaveCount(0);
  await expect(properties.locator('.studio-property-row[data-property-label="Visible label"]')).toHaveCount(0);
  const formControlAncestor =
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " MuiFormControl-root ")][1]';
  const idField = id.locator(formControlAncestor);
  const searchField = appearanceSearch.locator(formControlAncestor);
  const [idBox, searchBox] = await Promise.all([
    idField.boundingBox(),
    searchField.boundingBox()
  ]);
  if (!idBox || !searchBox) throw new Error('Properties form fields are not measurable.');
  expect(Math.abs(idBox.x - searchBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(idBox.width - searchBox.width)).toBeLessThanOrEqual(1);

  await visibleLabel.fill('Leaf one');
  await visibleLabel.press('Enter');
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toContainText('Leaf one');
});

test('fits around contextual drawers and keeps edge authoring on the unobscured preview', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const navigator = page.getByRole('navigation', { name: 'Project source' });
  await navigator.getByRole('button', { name: 'Object drawer' }).click();
  const add = page.getByRole('complementary', { name: 'Add' });
  await expect(add).toBeVisible();
  await page.waitForTimeout(300);

  const addBox = await add.boundingBox();
  const controlsBox = await page
    .getByTestId('studio-canvas')
    .locator('.studio-canvas-viewport-controls')
    .boundingBox();
  const nodeBoxes = await page.locator('.react-flow__node').evaluateAll((nodes) =>
    nodes.map((node) => {
      const bounds = node.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right };
    })
  );
  if (!addBox || !controlsBox) throw new Error('The Add drawer or preview controls are not measurable.');
  expect(controlsBox.x).toBeGreaterThanOrEqual(addBox.x + addBox.width + 8);
  expect(
    nodeBoxes.some(
      (node) => node.left < addBox.x + addBox.width && node.right > addBox.x
    )
  ).toBe(false);

  await add.getByTestId('palette-link').click();
  await expect(add).toBeVisible();
  const canvas = page.getByTestId('studio-canvas');
  await expect(canvas).toHaveAttribute('data-edge-authoring-mode', 'link');

  const source = page
    .locator(
      '.react-flow__node[data-id="leaf1"] .topoviewer-node-shape-handle.source[data-shape-active="true"]'
    )
    .nth(1);
  const target = page
    .locator(
      '.react-flow__node[data-id="leaf2"] .topoviewer-node-shape-handle.source[data-shape-active="true"]'
    )
    .nth(3);
  const [sourceBox, targetBox] = await Promise.all([source.boundingBox(), target.boundingBox()]);
  if (!sourceBox || !targetBox) throw new Error('Connection handles are not measurable.');
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 8
  });
  await expect(canvas).toHaveAttribute('data-edge-authoring-mode', 'link');
  await page.mouse.up();

  await expect(canvas).not.toHaveAttribute('data-edge-authoring-mode');
  const properties = page.getByRole('complementary', { name: 'Properties workspace' });
  await expect(properties).toBeVisible();
  await expect(add).toBeHidden();
  await properties.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(add).toBeVisible();
});

test('keeps session dock state while collapsed and restored', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const dock = page.getByRole('region', { name: 'Project session details' });
  await dock.getByRole('tab', { name: 'Selection' }).click();
  await expect(dock.getByRole('tabpanel', { name: 'Selection' })).toContainText('No topology object selected');

  await dock.getByRole('button', { name: 'Collapse project session details' }).click();
  await expect(dock).toHaveAttribute('data-collapsed', 'true');
  await dock.getByRole('button', { name: 'Expand project session details' }).click();
  await expect(dock.getByRole('tab', { name: 'Selection' })).toHaveAttribute('aria-selected', 'true');
});

test('switches one shared source editor among project documents without replacing preview', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const canvas = page.getByTestId('studio-canvas');
  const editor = page.getByTestId('studio-source-pane');
  await expect(editor.locator('.monaco-editor')).toHaveCount(1);
  await expect(editor.getByLabel('topology YAML editor')).toBeVisible();

  await page.getByRole('button', { name: 'stylesheet.yaml' }).click();
  await expect(editor.getByLabel('stylesheet YAML editor')).toBeVisible();
  await expect(editor.locator('.monaco-editor')).toHaveCount(1);
  await expect(canvas).toBeVisible();

  await page.getByRole('button', { name: 'mapper.yaml' }).click();
  await expect(editor.getByLabel('mapper YAML editor')).toBeVisible();
  await expect(editor.locator('.monaco-editor')).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect(editor.getByRole('button', { name: 'Show YAML context help' })).toBeVisible();
});

test('separates YAML editor commands above Monaco from status below it', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const source = page.getByTestId('studio-source-pane');
  const editor = source.getByLabel('topology YAML editor');
  const tools = source.getByRole('toolbar', { name: 'YAML editor tools' });
  const status = source.getByRole('group', { name: 'YAML editor status' });

  await expect(tools.getByRole('button', { name: 'Search Topology YAML' })).toBeVisible();
  await expect(tools.getByRole('button', { name: 'Show YAML context help' })).toBeVisible();
  await expect(tools.getByRole('button', { name: 'Format Topology YAML' })).toBeVisible();
  await expect(status).toContainText('Valid');
  await expect(status).toContainText(/Ln 1, Col 1/);
  await expect(status.getByRole('button', { name: 'Search Topology YAML' })).toHaveCount(0);

  const [toolsBox, editorBox, statusBox] = await Promise.all([
    tools.boundingBox(),
    editor.boundingBox(),
    status.boundingBox()
  ]);
  if (!toolsBox || !editorBox || !statusBox)
    throw new Error('The YAML toolbar, editor, or status row is not measurable.');
  expect(toolsBox.y + toolsBox.height).toBeLessThanOrEqual(editorBox.y + 1);
  expect(statusBox.y).toBeGreaterThanOrEqual(editorBox.y + editorBox.height - 1);
  expect(await tools.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    await status.evaluate((element) => getComputedStyle(element).backgroundColor)
  );
});

test('keeps source visible while selection opens contextual visual Properties', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const source = page.getByTestId('studio-source-pane');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();

  const drawer = page.getByRole('complementary', { name: 'Properties workspace' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('leaf1');
  await expect(source).toBeVisible();
  await expect(source.getByLabel('topology YAML editor')).toBeVisible();

  await drawer.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(drawer).toBeHidden();
  await expect(source).toBeVisible();
});

test('keeps last valid preview while an invalid shared source draft is corrected or reverted', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const source = page.getByTestId('studio-source-pane');
  const editor = source.locator('.monaco-editor');
  const nodes = page.locator('.react-flow__node');
  await expect(nodes.first()).toBeVisible();
  const initialNodeCount = await nodes.count();

  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await source.getByRole('button', { name: 'Apply topology' }).click();

  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(nodes).toHaveCount(initialNodeCount);
  await expect(source.getByRole('button', { name: 'Revert invalid draft' })).toBeEnabled();
  await source.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(page.locator('.studio-saved-state')).not.toHaveText('Invalid Draft');
  await expect(nodes).toHaveCount(initialNodeCount);
});

test('offers Source, Split, and Preview without losing source or canvas state', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const layouts = page.getByRole('group', { name: 'Workbench layout' });
  const leaf = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf.click();

  await layouts.getByRole('button', { name: 'Source' }).click();
  await expect(page.getByTestId('studio-source-pane')).toBeVisible();
  await expect(page.getByTestId('studio-preview-pane')).toBeHidden();

  await layouts.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByTestId('studio-preview-pane')).toBeVisible();
  await expect(page.getByTestId('studio-source-pane')).toBeHidden();
  await expect(leaf).toHaveClass(/selected/);

  await layouts.getByRole('button', { name: 'Split' }).click();
  await expect(page.getByTestId('studio-source-pane')).toBeVisible();
  await expect(page.getByTestId('studio-preview-pane')).toBeVisible();
  await expect(leaf).toHaveClass(/selected/);
});

test('browses an optional mapper without creating source', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const navigator = page.getByRole('navigation', { name: 'Project source' });

  await navigator.getByRole('button', { name: 'mapper.yaml' }).click();

  const source = page.getByTestId('studio-source-pane');
  await expect(source).toContainText('mapper.yaml is not part of this project');
  await expect(source.getByRole('button', { name: 'Configure mapper' })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText(/^Saved/);
  await expect(navigator.getByRole('button', { name: 'mapper.yaml' })).toContainText(
    'Optional'
  );
});

test('loads and validates project assets only when the author requests a preview', async ({ page }) => {
  await page.goto('/?__studio-test-state=asset-preview');
  const navigator = page.getByRole('navigation', { name: 'Project source' });

  await navigator.getByRole('button', { name: /^assets/ }).click();
  await navigator.getByRole('button', { name: 'Preview asset assets/site.svg' }).click();

  const dialog = page.getByRole('dialog', { name: 'assets/site.svg' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img', { name: 'assets/site.svg' })).toBeVisible();
  await expect(dialog).toContainText('image/svg+xml');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.studio-saved-state')).toHaveText(/^Saved/);
});

test('contains an optional Mapper failure without losing source or preview', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-error');
  const mapper = await openStudioWorkspace(page, 'Mapper');

  await expect(mapper.getByRole('alert')).toContainText('Telemetry mapper is unavailable');
  await expect(mapper.getByRole('button', { name: 'Retry telemetry mapper' })).toBeVisible();
  await expect(page.getByTestId('studio-source-pane')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
  await mapper.getByRole('button', { name: 'Retry telemetry mapper' }).click();
  await expect(mapper.getByRole('alert')).toHaveCount(0);
  await expect(mapper).toContainText('Graph · whole topology');
  await mapper.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await expect(mapper).toBeHidden();
});

test('contains an optional export failure without losing source or preview', async ({ page }) => {
  await page.goto('/?__studio-test-state=export-error');
  await page.getByRole('button', { name: 'Open export panel' }).click();

  const fallback = page.getByRole('dialog', { name: 'Export tools unavailable' });
  await expect(fallback.getByRole('alert')).toContainText('Export tools are unavailable');
  await expect(fallback.getByRole('button', { name: 'Retry export tools' })).toBeVisible();
  await expect(page.getByTestId('studio-source-pane')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
  await fallback.getByRole('button', { name: 'Close export tools' }).click();
  await expect(fallback).toBeHidden();
});

test('contains an optional asset-preview failure without losing source or preview', async ({ page }) => {
  await page.goto('/?__studio-test-state=asset-error');
  const navigator = page.getByRole('navigation', { name: 'Project source' });
  await navigator.getByRole('button', { name: /^assets/ }).click();
  await navigator.getByRole('button', { name: 'Preview asset assets/site.svg' }).click();

  const fallback = page.getByRole('dialog', { name: 'Asset preview unavailable' });
  await expect(fallback.getByRole('alert')).toContainText('Asset preview is unavailable');
  await expect(fallback.getByRole('button', { name: 'Retry asset preview' })).toBeVisible();
  await expect(page.getByTestId('studio-source-pane')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
  await fallback.getByRole('button', { name: 'Close asset preview' }).click();
  await expect(fallback).toBeHidden();
});

test('blocks visual topology mutations while preserving an invalid source draft', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const source = page.getByTestId('studio-source-pane');
  const editor = source.getByLabel('topology YAML editor');

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await source.getByRole('button', { name: 'Apply topology' }).click();

  await expect(page.getByRole('button', { name: 'Edit' })).toBeDisabled();
  await expect(
    page
      .getByRole('navigation', { name: 'Project source' })
      .getByRole('button', { name: 'Object drawer' })
  ).toBeDisabled();
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
  await source.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(page.getByRole('button', { name: 'Edit' })).toBeEnabled();
});
