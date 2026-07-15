import { expect, test } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { expectStudioOption, selectStudioOption } from '../support/mui';
import { openStudioWorkspace } from '../support/workspaceRail';
import { expectEditorContains } from './helpers/monaco';

test('keeps object properties separate from the Basic and YAML style workspace', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();

  const properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await expect(properties.getByRole('textbox', { name: 'ID', exact: true })).toBeHidden();
  await properties.getByRole('button', { name: 'Advanced' }).click();
  await expect(properties.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('router-1');
  await properties.getByRole('button', { name: 'Copy object ID' }).click();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText('Copied object ID router-1');

  const style = await openStyleWorkspace(page);
  await expect(style.getByRole('tab')).toHaveText(['Basic', 'YAML']);
  await expect(style.getByRole('tab', { name: 'Basic' })).toHaveAttribute('aria-selected', 'true');
  await editStyleAttribute(style, 'Shape');
  await expect(style.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await style.getByRole('searchbox', { name: 'Search Basic style fields' }).fill('outline width');
  await expect(style.getByText('No matching Basic fields.')).toBeVisible();
  await expect(style.getByRole('tab', { name: 'YAML' })).toBeEnabled();
});

test('commits typed Basic fields to one exact-ID stylesheet candidate', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const style = await openStyleWorkspace(page);

  await editStyleAttribute(style, 'Shape');
  await selectStudioOption(page, style.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');

  const layout = await editStyleAttribute(style, 'Node layout');
  await selectStudioOption(
    page,
    layout.getByRole('combobox', { name: 'Content alignment' }),
    'center'
  );

  await style.getByRole('searchbox', { name: 'Search Basic style fields' }).fill('Icon');
  const icon = style.locator('.studio-basic-style-field[data-field-path="icon"]');
  await expect(icon).toBeVisible();
  await selectStudioOption(page, icon.getByRole('combobox', { name: 'Icon' }), 'topoviewer.router');

  await editStyleAttribute(style, 'Body width');
  const width = style.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('108');
  await width.press('Enter');

  await editStyleAttribute(style, 'Background color');
  const color = style.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');

  await editStyleAttribute(style, 'Draggable');
  await style.getByRole('checkbox', { name: 'Draggable' }).uncheck();

  await editStyleAttribute(style, 'Badge label');
  const badge = style.getByRole('textbox', { name: 'Badge label', exact: true });
  await badge.fill('PE');
  await badge.press('Enter');

  await expect(page.locator('.studio-saved-state')).toHaveText('Style draft');
  await style.getByRole('tab', { name: 'YAML' }).click();
  await expectEditorContains(page, 'stylesheet', 'node[id = "leaf1"]');
  await expectEditorContains(page, 'stylesheet', 'shape: roundRectangle');
  await expectEditorContains(page, 'stylesheet', 'icon: topoviewer.router');
  await expectEditorContains(page, 'stylesheet', 'nodeLayout:');
  await expectEditorContains(page, 'stylesheet', 'align: center');
  await expectEditorContains(page, 'stylesheet', 'width: 108');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');
  await expectEditorContains(page, 'stylesheet', 'draggable: false');
  await expectEditorContains(page, 'stylesheet', 'badgeLabel: PE');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'topology.yaml' }).click();
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

test('reports inline winners and migrates them only through the explicit command', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  const style = await openStyleWorkspace(page);
  const widthField = await editStyleAttribute(style, 'Body width');

  await expect(widthField).toContainText('Inline topology override');
  await expect(widthField.getByRole('spinbutton', { name: 'Body width' })).toBeDisabled();
  await widthField.getByRole('button', { name: 'Move to stylesheet' }).click();
  await expect(widthField.getByRole('spinbutton', { name: 'Body width' })).toBeEnabled();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await style.getByRole('tab', { name: 'YAML' }).click();
  await expectEditorContains(page, 'stylesheet', 'node[id = "router-1"]');
  await expectEditorContains(page, 'stylesheet', 'width: 64');
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'topology.yaml' }).click();
  await expectEditorContains(page, 'topology', 'width: 64', false);
});

test('edits a selected link through a link-compatible exact-ID rule', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await selectCanvasTarget(
    page,
    page.locator('.react-flow__edge[data-id="spine-leaf"] .react-flow__edge-interaction'),
    'link spine-leaf selected'
  );
  const style = await openStyleWorkspace(page);
  const field = await editStyleAttribute(style, 'Curve style');
  await expectStudioOption(field.getByRole('combobox', { name: 'Curve style' }), 'bezier');
  await selectStudioOption(page, field.getByRole('combobox', { name: 'Curve style' }), 'straight');
  await style.getByRole('tab', { name: 'YAML' }).click();
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
