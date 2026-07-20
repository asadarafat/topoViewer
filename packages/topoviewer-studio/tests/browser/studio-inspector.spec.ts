import { expect, test, type Locator } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { expectStudioOption, selectStudioOption } from '../support/mui';
import { openEditCodeDocument, openStudioWorkspace } from '../support/workspaceRail';
import { expectEditorContains } from './helpers/monaco';

async function openStylesheetYaml(workspace: Locator) {
  await workspace.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();
}

test('keeps topology properties separate from the Visual and Code style workspace', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();

  const properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Visible label' })).toBeVisible();
  await expect(properties.getByRole('textbox', { name: 'Object ID' })).toHaveValue('router-1');
  await expect(properties.getByRole('button', { name: 'Advanced' })).toHaveCount(0);
  await expect(properties.getByRole('button', { name: 'Open topology source' })).toHaveCount(0);
  await properties.getByRole('button', { name: 'Copy object ID' }).click();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText('Copied object ID router-1');

  const style = await openStyleWorkspace(page);
  const representations = style.getByRole('group', { name: 'Edit representation' });
  await expect(representations.getByRole('button')).toHaveText(['Visual', 'Code']);
  await expect(representations.getByRole('button', { name: 'Visual' })).toHaveAttribute('aria-pressed', 'true');
  await editStyleAttribute(style, 'Shape');
  await expect(style.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await style.getByRole('searchbox', { name: 'Search style attributes' }).fill('outline width');
  await expect(style.locator('.studio-basic-style-field[data-field-path="outlineWidth"]')).toBeVisible();
  await expect(representations.getByRole('button', { name: 'Code' })).toBeEnabled();
});

test('switches regular and card node layouts with one consistent field set', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  const style = await openStyleWorkspace(page);
  const styleFields = style.locator('.studio-basic-style-field[data-field-path]');
  const collapsedPaths = await styleFields.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-field-path')));
  await style.locator('[aria-controls="studio-basic-style-fields"]').click();
  const expandedPaths = await styleFields.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-field-path')));
  expect(expandedPaths.slice(0, collapsedPaths.length)).toEqual(collapsedPaths);
  const expandedLayout = style.locator('.studio-basic-style-field[data-field-path="nodeLayout"]');
  await expect(expandedLayout.locator('[data-specialized-editor="node-layout"] > fieldset')).toHaveCount(0);
  await expect(expandedLayout.locator('.studio-property-row-label')).toHaveText([
    'Node layout',
    'Icon width',
    'Icon height',
    'Content alignment',
    'Title field',
    'Subtitle field'
  ]);
  await expect(style.getByRole('button', { name: 'View less' })).toHaveCount(1);

  const layout = await editStyleAttribute(style, 'Node layout');
  const layoutType = layout.getByRole('combobox', { name: 'Layout type' });

  await expectStudioOption(layoutType, 'standard');
  await expect(layout.getByRole('combobox', { name: 'Direction' })).toHaveCount(0);
  await expect(layout.getByRole('combobox', { name: 'Icon placement' })).toHaveCount(0);
  await expect(layout.getByRole('spinbutton', { name: 'Icon width' })).toBeVisible();
  await expect(layout.getByRole('spinbutton', { name: 'Icon height' })).toBeVisible();
  await expect(layout.getByRole('combobox', { name: 'Content alignment' })).toBeVisible();
  await expect(layout.getByRole('textbox', { name: 'Title field', exact: true })).toBeVisible();
  await expect(layout.getByRole('textbox', { name: 'Subtitle field', exact: true })).toBeVisible();
  await expect(layout.getByRole('button', { name: /^View (more|less)/ })).toHaveCount(0);

  await selectStudioOption(page, layoutType, 'card');
  await expect(page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-card')).toBeVisible();
  await expectStudioOption(layoutType, 'card');
  await expect(layout.getByRole('spinbutton', { name: 'Icon width' })).toBeVisible();
  await expect(layout.getByRole('textbox', { name: 'Subtitle field', exact: true })).toBeVisible();

  await selectStudioOption(page, layoutType, 'standard');
  await expect(page.locator('.react-flow__node[data-id="router-1"] .topoviewer-node-card')).toHaveCount(0);
  await expect(layout.getByRole('spinbutton', { name: 'Icon width' })).toBeVisible();

  await openStylesheetYaml(style);
  await expectEditorContains(page, 'stylesheet', 'shape: roundRectangle');
  await expectEditorContains(page, 'stylesheet', 'type: standard');
});

test('commits typed Basic fields to one exact-ID stylesheet candidate', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const style = await openStyleWorkspace(page);

  await editStyleAttribute(style, 'Shape');
  await selectStudioOption(page, style.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');

  const layout = await editStyleAttribute(style, 'Node layout');
  await selectStudioOption(page, layout.getByRole('combobox', { name: 'Content alignment' }), 'center');

  await style.getByRole('searchbox', { name: 'Search style attributes' }).fill('Icon');
  const icon = style.locator('.studio-basic-style-field[data-field-path="icon"]');
  await expect(icon).toBeVisible();
  const iconPicker = icon.getByRole('combobox', { name: 'Icon' });
  await iconPicker.click();
  const iconOptions = page.getByRole('listbox').locator('[role="option"][data-icon-id]');
  expect(await iconOptions.count()).toBeGreaterThanOrEqual(12);
  expect(await iconOptions.evaluateAll((options) => options.map((option) => option.getAttribute('data-icon-id')))).toEqual(
    expect.arrayContaining(['nokia.client', 'nokia.cloud', 'nokia.controller', 'nokia.dcgw', 'nokia.nsp', 'nokia.pon', 'nokia.rgw', 'nokia.router', 'nokia.server', 'nokia.spine', 'nokia.switch', 'nokia.ue'])
  );
  const cloudOption = page.getByRole('listbox').locator('[role="option"][data-icon-id="nokia.cloud"]');
  await expect(cloudOption.locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml;utf8,/);
  await cloudOption.click();
  await expect(iconPicker.locator('[data-studio-icon-preview="nokia.cloud"] img')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="leaf1"] .topoviewer-node-icon-image')).toHaveAttribute('src', /^data:image\/svg\+xml;utf8,/);

  await editStyleAttribute(style, 'Body width');
  const width = style.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('108');
  await width.press('Enter');

  await editStyleAttribute(style, 'Background color');
  const color = style.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');
  const renderedIcon = page.locator('.react-flow__node[data-id="leaf1"] .topoviewer-node-icon-image');
  await expect.poll(async () => {
    const source = (await renderedIcon.getAttribute('src')) || '';
    return decodeURIComponent(source.slice(source.indexOf(',') + 1));
  }).toContain('fill="#123456"');
  await expect(renderedIcon).toHaveScreenshot('cloud-node-background-color.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01
  });

  await editStyleAttribute(style, 'Draggable');
  await style.getByRole('checkbox', { name: 'Draggable' }).uncheck();

  await editStyleAttribute(style, 'Badge label');
  const badge = style.getByRole('textbox', { name: 'Badge label', exact: true });
  await badge.fill('PE');
  await badge.press('Enter');

  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');
  await openStylesheetYaml(style);
  await expectEditorContains(page, 'stylesheet', 'node[id = "leaf1"]');
  await expectEditorContains(page, 'stylesheet', 'shape: roundRectangle');
  await expectEditorContains(page, 'stylesheet', 'nokia.cloud:');
  await expectEditorContains(page, 'stylesheet', 'icon: nokia.cloud');
  await expectEditorContains(page, 'stylesheet', 'nodeLayout:');
  await expectEditorContains(page, 'stylesheet', 'align: center');
  await expectEditorContains(page, 'stylesheet', 'width: 108');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');
  await expectEditorContains(page, 'stylesheet', 'draggable: false');
  await expectEditorContains(page, 'stylesheet', 'badgeLabel: PE');

  await openEditCodeDocument(page, 'topology');
  await expectEditorContains(page, 'topology', 'backgroundColor: "#123456"', false);
  await expectEditorContains(page, 'topology', 'width: 108', false);
});

test('resets an exact-ID field to its inherited candidate value', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const style = await openStyleWorkspace(page);
  const field = await editStyleAttribute(style, 'Body width');
  const width = field.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('96');
  await width.press('Enter');
  await expect(width).toHaveValue('96');
  await field.getByRole('button', { name: 'Use inherited Body width' }).click();
  await expect(width).toHaveValue('82');
  await expect(field.getByRole('button', { name: 'Use inherited Body width' })).toHaveCount(0);
});

test('creates palette appearance directly in the stylesheet', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  const style = await openStyleWorkspace(page);
  const widthField = await editStyleAttribute(style, 'Body width');

  await expect(widthField.getByRole('spinbutton', { name: 'Body width' })).toBeEnabled();
  await expect(style.getByText('Visual styles found in topology.yaml')).toHaveCount(0);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await openStylesheetYaml(style);
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]');
  await expectEditorContains(page, 'stylesheet', 'width: 64');
  await openEditCodeDocument(page, 'topology');
  await expectEditorContains(page, 'topology', 'width: 64', false);
});

test('deleting an object cleans committed and candidate exact-ID style rules', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  const style = await openStyleWorkspace(page);
  const colorField = await editStyleAttribute(style, 'Background color');
  const color = colorField.locator('input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');
  await openStylesheetYaml(style);
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('Delete');

  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveCount(0);
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]', false);
  await expect(page.getByText('Invalid Style draft')).toHaveCount(0);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveCount(1);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]');

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveCount(0);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]', false);
});

test('cut cleans only the removed object rule and preserves unrelated Style draft edits', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const objects = await openStudioWorkspace(page, 'Objects');
  await objects.getByTestId('palette-router').click();
  await objects.getByTestId('palette-router').click();

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  let style = await openStyleWorkspace(page);
  let color = (await editStyleAttribute(style, 'Background color')).locator('input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');

  await page.locator('.react-flow__node[data-id="router-2"]').click();
  style = await openStyleWorkspace(page);
  color = (await editStyleAttribute(style, 'Background color')).locator('input[type="text"]');
  await color.fill('#654321');
  await color.press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');

  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('ControlOrMeta+x');

  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveCount(0);
  await expect(page.locator('.react-flow__node[data-id="router-2"]')).toHaveCount(1);
  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]', false);
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-2"]');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#654321"');
  await expect(page.getByText('Invalid Style draft')).toHaveCount(0);
});

test('edits a selected link through a link-compatible exact-ID rule', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await selectCanvasTarget(page, page.locator('.react-flow__edge[data-id="spine-leaf"] .react-flow__edge-interaction'), 'link spine-leaf selected');
  const style = await openStyleWorkspace(page);
  const field = await editStyleAttribute(style, 'Curve style');
  await expectStudioOption(field.getByRole('combobox', { name: 'Curve style' }), 'bezier');
  await selectStudioOption(page, field.getByRole('combobox', { name: 'Curve style' }), 'straight');
  await openStylesheetYaml(style);
  await expectEditorContains(page, 'stylesheet', 'link[id = "spine-leaf"]');
  await expectEditorContains(page, 'stylesheet', 'curveStyle: straight');
});

test('associates typed validation errors with their Basic control', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const style = await openStyleWorkspace(page);
  const field = await editStyleAttribute(style, 'Body width');
  const width = field.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('1.2');
  await width.blur();
  await expect(width).toHaveAttribute('aria-invalid', 'true');
  const errorId = await width.getAttribute('aria-errormessage');
  expect(errorId).toBeTruthy();
  await expect(page.locator(`#${errorId}`)).toContainText('whole number');
});
