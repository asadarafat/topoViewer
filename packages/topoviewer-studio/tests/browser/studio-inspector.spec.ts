import { expect, test } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';
import { expectStudioOption, selectStudioOption } from '../support/mui';
import { openStudioWorkspace } from '../support/workspaceRail';

async function expectEditorContains(page: import('@playwright/test').Page, document: 'topology' | 'stylesheet', query: string) {
  await page.getByLabel(`${document} YAML editor`).focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
}

test('progressively discloses object details and complete style fields', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();

  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await expect(objectProperties.getByRole('textbox', { name: 'ID', exact: true })).toBeHidden();
  await objectProperties.getByRole('button', { name: 'Advanced' }).click();
  await expect(objectProperties.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('router-1');
  await objectProperties.getByRole('button', { name: 'Copy object ID' }).click();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText('Copied object ID router-1');
  await expect(objectProperties.getByRole('tab')).toHaveCount(0);

  const inspector = await openStyleWorkspace(page);
  await expect(inspector.getByRole('tab')).toHaveCount(0);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toHaveCount(0);

  await inspector.getByRole('button', { name: /View More/ }).click();
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toBeVisible();
  await inspector.getByRole('button', { name: 'View Less' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('outline width');
  await editStyleAttribute(inspector, 'Outline width');
  const outline = inspector.getByRole('spinbutton', { name: 'Outline width' });
  await expect(outline).toBeVisible();
  await outline.fill('6');
  await outline.press('Enter');
  await expect(inspector.getByRole('spinbutton', { name: 'Outline width' })).toHaveValue('6');
  const outlineField = inspector.locator('[data-field-path="outlineWidth"]');
  await outlineField.getByRole('button', { name: 'Use inherited Outline width' }).click();
  await expect(outlineField.getByRole('button', { name: 'Use inherited Outline width' })).toHaveCount(0);

  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('');
  await editStyleAttribute(inspector, 'Shape');
  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');

  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('card layout');
  await editStyleAttribute(inspector, 'Node layout');
  const layout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(layout).toBeVisible();
  await expectStudioOption(layout.getByRole('combobox', { name: 'Direction' }), 'horizontal');
  await selectStudioOption(page, layout.getByRole('combobox', { name: 'Content alignment' }), 'center');
  await expect(inspector.getByRole('spinbutton', { name: 'Line width' })).toHaveCount(0);

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await expect(mapper.getByText('No mapper yet')).toBeVisible();
});

test('writes and unsets explicit object values and validates typed list controls', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const palette = await openStudioWorkspace(page, 'Objects');
  await palette.getByTestId('palette-router').click();
  const inspector = await openStyleWorkspace(page);

  await editStyleAttribute(inspector, 'Body width');
  const widthField = inspector.locator('[data-field-path="width"]');
  const rowMetrics = await inspector.locator('[data-style-attribute="width"]').evaluate((row) => {
    const input = row.querySelector<HTMLElement>('input');
    const valueCell = row.querySelector<HTMLElement>('td');
    if (!input || !valueCell) throw new Error('Inline width editor is missing.');
    const inputBox = input.getBoundingClientRect();
    const valueBox = valueCell.getBoundingClientRect();
    return {
      inputBottom: inputBox.bottom,
      inputLeft: inputBox.left,
      inputRight: inputBox.right,
      inputTop: inputBox.top,
      valueBottom: valueBox.bottom,
      valueLeft: valueBox.left,
      valueRight: valueBox.right,
      valueTop: valueBox.top
    };
  });
  expect(rowMetrics.inputLeft).toBeGreaterThanOrEqual(rowMetrics.valueLeft);
  expect(rowMetrics.inputRight).toBeLessThanOrEqual(rowMetrics.valueRight);
  expect(rowMetrics.inputTop).toBeGreaterThanOrEqual(rowMetrics.valueTop);
  expect(rowMetrics.inputBottom).toBeLessThanOrEqual(rowMetrics.valueBottom);
  await expect(inspector.getByRole('menu')).toHaveCount(0);
  const width = inspector.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('96');
  await width.press('Enter');
  await expect(inspector.getByRole('spinbutton', { name: 'Body width' })).toHaveValue('96');
  await widthField.getByRole('button', { name: 'Use inherited Body width' }).click();
  await expect(inspector.getByRole('spinbutton', { name: 'Body width' })).toHaveValue('82');
  await expect(widthField.getByRole('button', { name: 'Use inherited Body width' })).toHaveCount(0);

  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click({ modifiers: ['Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge[data-id="link-1"]')).toHaveCount(1);
  await openStyleWorkspace(page);
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('dash pattern');
  await editStyleAttribute(inspector, 'Dash pattern');
  const dashPattern = inspector.getByRole('textbox', { name: 'Dash pattern' });
  await dashPattern.fill('8, bad');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toContainText('finite numbers');
  await dashPattern.fill('8, 4');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toHaveCount(0);
});

test('does not write object style until a value is committed', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await openStudioWorkspace(page, 'Objects');
  const annotations = page.getByRole('button', { name: 'Annotations palette group' });
  if (await annotations.getAttribute('aria-expanded') !== 'true') await annotations.click();
  await page.getByTestId('palette-shape').click();
  const save = page.getByRole('button', { name: 'Save project' });
  if (await save.isEnabled()) await save.click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Background color');
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const color = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await color.fill('#123456');
  await color.press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});

test('keeps field customization out of the common value-editing path', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(inspector.getByRole('button', { name: /actions$/ })).toHaveCount(0);
  await expect(inspector.getByRole('menu')).toHaveCount(0);
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toHaveCount(0);
  await inspector.getByRole('button', { name: /View More/ }).click();
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('edits one object while preserving inherited style values', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);

  await editStyleAttribute(inspector, 'Shape');
  const shapeField = inspector.locator('[data-field-path="shape"]');
  await expectStudioOption(inspector.getByRole('combobox', { name: 'Shape' }), 'rectangle');
  await expect(shapeField.getByText('Rule node')).toHaveCount(0);
  await expect(shapeField.getByText('Object override')).toHaveCount(0);

  await expect(inspector.getByLabel('Style context')).toContainText('Node · leaf1');
  await expect(inspector.getByRole('combobox', { name: 'Style selector' })).toHaveCount(0);
  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');
  await expectStudioOption(inspector.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');

  await editStyleAttribute(inspector, 'Background color');
  const background = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await expect(background).toHaveValue('#123456');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'topology.yaml' }).click();
  await expectEditorContains(page, 'topology', 'shape: roundRectangle');
  await expectEditorContains(page, 'topology', 'backgroundColor: "#123456"');
});

test('presents only Attribute and Value style columns', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);

  const matrix = inspector.getByRole('table', { name: 'Style attributes' });
  await expect(matrix.getByRole('columnheader')).toHaveText(['Attribute', 'Value']);
  const background = matrix.getByRole('row', { name: /Background color/ });
  await expect(background.getByRole('button', { name: 'Edit This object Background color' })).toBeEnabled();
  await expect(background).toContainText('#1976d2');
  await expect(background.getByRole('button', { name: /Edit (Default|Rule)/ })).toHaveCount(0);

  await background.getByRole('button', { name: 'Edit This object Background color' }).click();
  await expect(inspector.locator('[data-style-attribute="backgroundColor"] input[type="text"]')).toBeVisible();
  await expect(inspector.locator('.studio-style-matrix-editor-row')).toHaveCount(0);
  await expect(inspector.getByRole('menu')).toHaveCount(0);
});

test('smooths coarse style-panel wheel input without rerendering the Inspector', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);
  const panel = page.locator('#studio-inspector-style-panel');
  const renderCount = await inspector.getAttribute('data-render-count');

  await panel.evaluate((element) => { element.scrollTop = 0; });
  await panel.hover();
  await page.mouse.wheel(0, 500);
  const firstPosition = await panel.evaluate((element) => element.scrollTop);
  expect(firstPosition).toBeLessThan(500);

  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBe(500);
  await expect(inspector).toHaveAttribute('data-render-count', renderCount || '');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await panel.evaluate((element) => { element.scrollTop = 0; });
  await page.mouse.wheel(0, 500);
  await expect(panel).toHaveJSProperty('scrollTop', 500);
});

test('edits a selected link without exposing selector lifecycle controls', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await selectCanvasTarget(
    page,
    page.locator('.react-flow__edge[data-id="spine-leaf"] .react-flow__edge-interaction'),
    'link spine-leaf selected'
  );
  const inspector = await openStyleWorkspace(page);

  await expect(inspector.getByLabel('Style context')).toContainText('Link');
  await editStyleAttribute(inspector, 'Curve style');
  await expect(inspector.getByRole('combobox', { name: 'Style selector' })).toHaveCount(0);
  await expect(inspector.getByRole('button', { name: 'Add selector' })).toHaveCount(0);
  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Curve style' }), 'straight');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'topology.yaml' }).click();
  await expectEditorContains(page, 'topology', 'curveStyle: straight');
});

test('preserves unknown future fields and navigates to their raw YAML range', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  await page.locator('.react-flow__node[data-id="future-node"]').click();
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Body width');
  await expect(inspector.getByText('Unsupported fields')).toBeVisible();
  await inspector.getByRole('button', { name: 'Open futureGlow in YAML' }).click();

  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer.getByText('graph.nodes.0.style.futureGlow')).toBeVisible();
  await expect(drawer.getByText(/Line \d+, column \d+/)).toBeVisible();
  await expectEditorContains(page, 'topology', 'futureGlow:');
  await drawer.getByRole('button', { name: 'Close' }).click();

  const width = inspector.getByRole('spinbutton', { name: 'Body width' });
  await width.fill('83');
  await width.press('Enter');
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expectEditorContains(page, 'topology', 'futureGlow:');
  await expectEditorContains(page, 'topology', 'width: 83');
});
