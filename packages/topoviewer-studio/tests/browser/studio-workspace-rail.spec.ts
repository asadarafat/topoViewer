import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';

const artifactDirectory = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/workspace-rail');

test('switches one left workspace from the vertical rail without losing canvas context', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');

  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  await expect(rail.getByRole('tab')).toHaveCount(4);
  for (const workspace of ['Objects', 'Edit', 'Viewport', 'Mapper']) {
    await expect(rail.getByRole('tab', { name: workspace })).toBeVisible();
  }
  await expect(rail.getByRole('tab', { name: 'Objects' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Objects' })).toBeVisible();

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(rail.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  await expect(edit).toBeVisible();
  await expect(edit.getByRole('textbox', { name: 'Name' })).toHaveValue('Leaf 1');

  await rail.getByRole('tab', { name: 'Objects' }).click();
  const paletteSearch = page.getByRole('searchbox', { name: 'Search objects and templates' });
  await paletteSearch.fill('router');

  await rail.getByRole('tab', { name: 'Edit' }).click();
  await expect(edit.getByRole('group', { name: 'Edit representation' }).getByRole('button')).toHaveText(['Visual', 'Code']);
  await expect(edit.locator('.studio-basic-style-field').first()).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Objects', includeHidden: true })).toBeHidden();
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toHaveClass(/selected/);
  await edit.getByRole('searchbox', { name: 'Search style attributes' }).fill('label');
  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(rail.getByRole('tab', { name: 'Edit' })).toHaveAttribute('aria-selected', 'true');

  await rail.getByRole('tab', { name: 'Viewport' }).click();
  const viewport = page.getByRole('complementary', { name: 'Viewport workspace' });
  await expect(viewport.getByRole('spinbutton', { name: 'Grid size' })).toBeVisible();

  const viewportTab = rail.getByRole('tab', { name: 'Viewport' });
  await viewportTab.focus();
  await page.keyboard.press('ArrowDown');
  await expect(rail.getByRole('tab', { name: 'Mapper' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('region', { name: 'Telemetry mapper workspace' })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="leaf2"]')).toHaveClass(/selected/);

  await rail.getByRole('tab', { name: 'Edit' }).click();
  await expect(edit.getByRole('searchbox', { name: 'Search style attributes' })).toHaveValue('label');
  await expect(edit.getByRole('textbox', { name: 'Name' })).toHaveValue('Leaf 2');
  await rail.getByRole('tab', { name: 'Objects' }).click();
  await expect(paletteSearch).toHaveValue('router');
});

test('keeps the Visual edit workspace dense with one property scroll owner', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();

  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  await expect(edit.getByRole('button', { name: 'Open topology source' })).toHaveCount(0);
  await expect(edit.getByRole('button', { name: 'Advanced' })).toHaveCount(0);
  await expect(edit.locator('.studio-topology-property-list .studio-property-row')).toHaveCount(4);
  await expect(edit.locator('.studio-basic-style-field')).toHaveCount(8);

  const rowsAreTwoColumn = await edit.locator('.studio-property-row').evaluateAll((rows) =>
    rows.every((row) => {
      const label = row.querySelector<HTMLElement>('.studio-property-row-label');
      const control = row.querySelector<HTMLElement>('.studio-property-row-control');
      if (!label || !control) return false;
      const labelBox = label.getBoundingClientRect();
      const controlBox = control.getBoundingClientRect();
      return controlBox.left > labelBox.left && controlBox.width > 0;
    })
  );
  expect(rowsAreTwoColumn).toBe(true);
  const rowDividers = await edit.locator('.studio-property-row').evaluateAll((rows) =>
    rows.map((row) => {
      const style = getComputedStyle(row);
      return `${style.borderBottomStyle}:${style.borderBottomWidth}`;
    })
  );
  expect(rowDividers.every((divider) => divider === 'none:0px')).toBe(true);

  const verticalScrollOwners = await edit.locator('*').evaluateAll((elements) =>
    elements
      .filter((element) => ['auto', 'scroll'].includes(getComputedStyle(element).overflowY))
      .map((element) => element.className)
      .filter((className): className is string => typeof className === 'string')
  );
  expect(verticalScrollOwners).toHaveLength(1);
  expect(verticalScrollOwners[0]).toContain('studio-edit-visual');

  const footer = edit.locator('.studio-style-candidate-footer');
  await expect(footer).toHaveCount(0);

  const width = edit.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('90');
  await width.press('Enter');
  await expect(footer).toBeVisible();
  expect((await footer.boundingBox())?.height).toBeLessThanOrEqual(40);
  await expect(footer.getByRole('button', { name: 'Apply' })).toBeVisible();
  await expect(footer.getByRole('button', { name: 'Revert' })).toBeVisible();
});

test('keeps topology and style code in Edit while Mapper owns mapper code', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  const representations = edit.getByRole('group', { name: 'Edit representation' });

  await expect(representations.getByRole('button')).toHaveText(['Visual', 'Code']);
  await expect(representations.getByRole('button', { name: 'Visual' })).toHaveAttribute('aria-pressed', 'true');
  await representations.getByRole('button', { name: 'Code' }).click();

  await expect(edit.getByRole('heading', { name: 'Edit' })).toBeVisible();
  const documents = edit.getByRole('tablist', { name: 'Code documents' });
  await expect(documents.getByRole('tab')).toHaveText(['topology.yaml', 'stylesheet.yaml']);
  async function expectUsableEditorHeight() {
    const editorSurface = edit.locator('.studio-monaco-editor');
    await expect(editorSurface).toBeVisible();
    expect((await editorSurface.boundingBox())?.height).toBeGreaterThan(240);
  }

  const topologyEditor = edit.getByLabel('topology YAML editor');
  await expect(topologyEditor).toBeVisible();
  await expectUsableEditorHeight();
  await topologyEditor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await topologyEditor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', 'graph:\n  id: draft-switch-marker\n  nodes: []\n  links: []');
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData
      })
    );
  });
  await expectEditorContains(page, 'topology', 'draft-switch-marker');

  await documents.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  const stylesheetEditor = edit.getByLabel('stylesheet YAML editor');
  await expect(stylesheetEditor).toBeVisible();
  await expectUsableEditorHeight();

  await documents.getByRole('tab', { name: 'topology.yaml' }).click();
  await expectEditorContains(page, 'topology', 'draft-switch-marker');

  await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Mapper' }).click();
  const mapper = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  const mapperRepresentations = mapper.getByRole('group', { name: 'Mapper representation' });
  await expect(mapperRepresentations.getByRole('button')).toHaveText(['Visual', 'Code']);
  await mapperRepresentations.getByRole('button', { name: 'Code' }).click();
  const mapperEditor = mapper.getByLabel('mapper YAML editor');
  await expect(mapperEditor).toBeVisible();
  expect((await mapper.locator('.studio-monaco-editor').boundingBox())?.height).toBeGreaterThan(240);
  await expect(mapper.getByRole('button', { name: 'Apply mapper' })).toBeDisabled();
  await expectEditorContains(page, 'mapper', 'draft-switch-marker', false);

  await expect(page.locator('.studio-footer').getByText('topology.yaml')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open source workspace' })).toHaveCount(0);
});

test('keeps Visual or Code and the active document sticky while selecting canvas objects', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  const representations = edit.getByRole('group', { name: 'Edit representation' });
  const documents = edit.getByRole('tablist', { name: 'Code documents' });

  await representations.getByRole('button', { name: 'Code' }).click();
  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(representations.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  await expect(documents.getByRole('tab', { name: 'topology.yaml' })).toHaveAttribute('aria-selected', 'true');
  await expect(edit.locator('.view-line').filter({ hasText: 'id: leaf2' }).first()).toBeVisible();

  await documents.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(representations.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  await expect(documents.getByRole('tab', { name: 'stylesheet.yaml' })).toHaveAttribute('aria-selected', 'true');
  await expect(edit.getByLabel('stylesheet YAML editor')).toBeVisible();

  await representations.getByRole('button', { name: 'Visual' }).click();
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(representations.getByRole('button', { name: 'Visual' })).toHaveAttribute('aria-pressed', 'true');
  await expect(edit.getByRole('textbox', { name: 'Name' })).toHaveValue('Leaf 1');

  await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Mapper' }).click();
  const mapper = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  const mapperRepresentations = mapper.getByRole('group', { name: 'Mapper representation' });
  await mapperRepresentations.getByRole('button', { name: 'Code' }).click();
  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(mapperRepresentations.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  await expect(mapper.getByLabel('mapper YAML editor')).toBeVisible();

  await mapperRepresentations.getByRole('button', { name: 'Visual' }).click();
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(mapperRepresentations.getByRole('button', { name: 'Visual' })).toHaveAttribute('aria-pressed', 'true');
  await expect(mapper.getByLabel('Mapper context')).toContainText('Node · leaf1');
});

test('keeps every workspace bounded, non-overlapping, and accessible', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  const rail = page.getByRole('tablist', { name: 'Workspace views' });

  for (const view of ['Objects', 'Edit', 'Viewport', 'Mapper']) {
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
        navigationPrecedesContent: Boolean(navigation.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING),
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
  const mapperRowDividers = await mapper.locator('.studio-mapper-basic-form .studio-property-row').evaluateAll((rows) =>
    rows.map((row) => {
      const style = getComputedStyle(row);
      return `${style.borderBottomStyle}:${style.borderBottomWidth}`;
    })
  );
  expect(mapperRowDividers.every((divider) => divider === 'none:0px')).toBe(true);
  const formRows = await mapper.locator('.studio-mapper-basic-form > label').evaluateAll((labels) =>
    labels.map((label) => {
      const box = label.getBoundingClientRect();
      return { bottom: box.bottom, top: box.top };
    })
  );
  expect(
    formRows.every((row, index) => index === 0 || row.top >= formRows[index - 1].bottom - 1),
    'Mapper form rows overlap'
  ).toBe(true);
  await expect(mapper.locator('.studio-mapper-basic-form .MuiInputBase-root').first()).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('defaults the workspace to one quarter and resizes it up to one half', async ({ page }) => {
  await mkdir(artifactDirectory, { recursive: true });
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');

  const workspace = page.locator('.studio-left-workspace');
  const separator = page.getByRole('separator', { name: 'Resize workspace panel' });
  await expect(separator).toBeVisible();
  await expect(separator).toHaveAttribute('aria-valuenow', '25');
  expect((await workspace.boundingBox())?.width).toBeCloseTo(375, 0);

  await separator.focus();
  await page.keyboard.press('End');
  await expect(separator).toHaveAttribute('aria-valuenow', '50');
  expect((await workspace.boundingBox())?.width).toBeCloseTo(750, 0);

  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  await page.screenshot({ path: path.join(artifactDirectory, 'edit-visual-half-width.png') });
  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  await edit.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  const yamlEditor = edit.getByLabel('stylesheet YAML editor');
  await expect(yamlEditor).toBeVisible();
  expect((await edit.locator('.studio-monaco-editor').boundingBox())?.width).toBeGreaterThan(620);
  await page.screenshot({ path: path.join(artifactDirectory, 'style-yaml-half-width.png') });

  await separator.focus();
  await page.keyboard.press('Home');
  await expect(separator).toHaveAttribute('aria-valuenow', '25');
  expect((await workspace.boundingBox())?.width).toBeCloseTo(375, 0);

  const handle = await separator.boundingBox();
  if (!handle) throw new Error('Workspace resize separator is not measurable.');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + 120);
  await page.mouse.down();
  await page.mouse.move(675, handle.y + 120, { steps: 4 });
  await page.mouse.up();
  await expect(separator).toHaveAttribute('aria-valuenow', '45');
  expect((await workspace.boundingBox())?.width).toBeCloseTo(675, 0);

  await separator.dblclick();
  await expect(separator).toHaveAttribute('aria-valuenow', '25');
  expect((await workspace.boundingBox())?.width).toBeCloseTo(375, 0);
});

test('restores the workspace width from the browser host preference', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.goto('/');

  const separator = page.getByRole('separator', { name: 'Resize workspace panel' });
  await separator.focus();
  await page.keyboard.press('End');
  await expect(separator).toHaveAttribute('aria-valuenow', '50');
  await page.waitForTimeout(250);

  await page.reload();
  await expect(page.getByRole('separator', { name: 'Resize workspace panel' })).toHaveAttribute('aria-valuenow', '50');
  expect((await page.locator('.studio-left-workspace').boundingBox())?.width).toBeCloseTo(750, 0);
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
});

test('keeps the style workspace scoped to the selected object candidate', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Edit' }).click();

  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  await expect(edit.getByRole('combobox', { name: 'Style selector' })).toHaveCount(0);
  await expect(edit.getByText(/leaf1|Leaf 1/).first()).toBeVisible();
  await edit.getByRole('searchbox', { name: 'Search style attributes' }).fill('background color');
  await expect(edit.locator('[data-field-path="backgroundColor"] input[type="text"]')).toBeVisible();
  await expect(edit.getByRole('menu')).toHaveCount(0);
});

test('keeps reusable selector authoring in Code', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });

  await expect(edit.getByRole('tab', { name: 'Selector Style' })).toHaveCount(0);
  await expect(edit.getByRole('button', { name: /YAML/ })).toHaveCount(0);
  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  await edit.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(edit.getByLabel('stylesheet YAML editor')).toBeVisible();
});

test('edits topology YAML in context while an invalid draft leaves the canvas intact', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  const nodeCount = await page.locator('.react-flow__node').count();

  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  const editor = edit.getByTestId('studio-yaml-editor').getByLabel('topology YAML editor');
  await expect(editor).toBeVisible();
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await editor.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', 'graph: [\n# invalid topology draft');
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData
      })
    );
  });

  await expect(edit.getByLabel('Topology diagnostics')).toContainText(/Line \d+:/);
  await edit.getByRole('button', { name: 'Apply topology' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);
  await edit.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(edit.getByLabel('Topology diagnostics')).toHaveCount(0);
});

test('keeps the user YAML location after applying code from a selected object', async ({ page }) => {
  await page.goto('/?__studio-test-state=dense');
  await page.locator('.react-flow__node[data-id="dense-60"]').click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });

  await edit.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  await expect(edit.locator('.view-line').filter({ hasText: 'id: dense-60' }).first()).toBeVisible();
  await replaceEditorMatch(page, 'topology', 'threshold: 2', 'threshold: 4');

  await expect(edit.locator('.view-line').filter({ hasText: 'threshold: 4' })).toBeVisible();
  await edit.getByRole('button', { name: 'Apply topology' }).click();

  await expect(edit.locator('.view-line').filter({ hasText: 'threshold: 4' })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="dense-60"]')).toHaveClass(/selected/);
});

test('captures the four left workspaces at desktop and constrained widths', async ({ page }) => {
  await mkdir(artifactDirectory, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  for (const view of ['Objects', 'Edit', 'Viewport', 'Mapper']) {
    await rail.getByRole('tab', { name: view }).click();
    if (view === 'Mapper') await expect(page.getByRole('region', { name: 'Telemetry mapper workspace' })).toBeVisible();
    await page.screenshot({ path: path.join(artifactDirectory, `${view.toLocaleLowerCase()}-desktop.png`) });
  }

  await rail.getByRole('tab', { name: 'Edit' }).click();
  const edit = page.getByRole('complementary', { name: 'Edit workspace' });
  await edit.getByRole('searchbox', { name: 'Search style attributes' }).fill('background color');
  await expect(edit.locator('[data-field-path="backgroundColor"] input[type="text"]')).toBeVisible();
  await page.screenshot({ path: path.join(artifactDirectory, 'style-object-context-desktop.png') });

  await page.setViewportSize({ width: 1180, height: 760 });
  await rail.getByRole('tab', { name: 'Edit' }).click();
  const constrainedRows = await edit.locator('.studio-property-row:visible').evaluateAll((rows) =>
    rows.map((row) => {
      const label = row.querySelector<HTMLElement>('.studio-property-row-label');
      const control = row.querySelector<HTMLElement>('.studio-property-row-control');
      if (!label || !control) return undefined;
      const labelBox = label.getBoundingClientRect();
      const controlBox = control.getBoundingClientRect();
      const lineHeight = Number.parseFloat(getComputedStyle(label).lineHeight) || labelBox.height;
      return {
        controlWidth: controlBox.width,
        labelLines: labelBox.height / lineHeight,
        stacked: controlBox.top >= labelBox.bottom - 1
      };
    })
  );
  expect(
    constrainedRows.every((row) => row && row.controlWidth >= 180),
    'constrained controls remain readable'
  ).toBe(true);
  expect(
    constrainedRows.every((row) => row && row.labelLines <= 2.1),
    'property labels use at most two lines'
  ).toBe(true);
  expect(
    constrainedRows.every((row) => row?.stacked),
    'constrained property rows stack label over value'
  ).toBe(true);
  const positionX = await edit.getByRole('spinbutton', { name: 'Position X' }).boundingBox();
  const colorValue = await edit.getByRole('textbox', { name: 'Background color', exact: true }).boundingBox();
  expect(positionX?.width).toBeGreaterThanOrEqual(88);
  expect(colorValue?.width).toBeGreaterThanOrEqual(150);
  await expect(edit.getByRole('button', { name: 'Clear style search' })).toHaveCount(1);
  await page.screenshot({ path: path.join(artifactDirectory, 'style-constrained.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Close workspace panel' }).click();
  expect((await page.locator('.studio-left-workspace').boundingBox())?.width).toBeCloseTo(48, 0);
});
