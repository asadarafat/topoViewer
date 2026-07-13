import { expect, test } from '@playwright/test';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';
import { openStudioWorkspace } from '../support/workspaceRail';

async function expectEditorContains(page: import('@playwright/test').Page, document: 'topology' | 'stylesheet', query: string) {
  await page.getByLabel(`${document} YAML editor`).focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
}

test('separates document ownership and progressively discloses complete style fields', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await (await openStudioWorkspace(page, 'Topo')).getByTestId('palette-router').click();

  const objectProperties = await openStudioWorkspace(page, 'Object');
  await expect(objectProperties.getByText('topology.yaml', { exact: true })).toBeVisible();
  await expect(objectProperties.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await expect(objectProperties.getByRole('tab')).toHaveCount(0);

  const inspector = await openStyleWorkspace(page);
  await expect(inspector.getByRole('tab')).toHaveCount(0);
  await editStyleAttribute(inspector, 'Default', 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toHaveCount(0);

  await inspector.getByRole('button', { name: /View More/ }).click();
  await expect(inspector.locator('[data-style-attribute="outlineWidth"]')).toBeVisible();
  await inspector.getByRole('button', { name: 'View Less' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('outline width');
  await editStyleAttribute(inspector, 'Default', 'Outline width');
  const outline = inspector.getByRole('spinbutton', { name: 'Outline width' });
  await expect(outline).toBeVisible();
  await outline.fill('6');
  await outline.press('Enter');
  await expect(inspector.getByRole('spinbutton', { name: 'Outline width' })).toHaveValue('6');
  const outlineField = inspector.locator('[data-field-path="outlineWidth"]');
  await outlineField.getByRole('button', { name: 'Outline width actions' }).click();
  await outlineField.getByRole('menuitem', { name: 'Unset value' }).click();
  await outlineField.getByRole('button', { name: 'Outline width actions' }).click();
  await expect(outlineField.getByRole('menuitem', { name: 'Unset value' })).toBeDisabled();

  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('');
  await editStyleAttribute(inspector, 'Default', 'Shape');
  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');

  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('card layout');
  await editStyleAttribute(inspector, 'Default', 'Node layout');
  const layout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(layout).toBeVisible();
  await expect(layout.getByRole('combobox', { name: 'Direction' })).toHaveValue('horizontal');
  await layout.getByRole('combobox', { name: 'Content alignment' }).selectOption('center');
  await expect(inspector.getByRole('spinbutton', { name: 'Line width' })).toHaveCount(0);

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await expect(mapper.getByText('No mapper in this project')).toBeVisible();
});

test('writes explicit defaults and validates typed list controls', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const palette = await openStudioWorkspace(page, 'Topo');
  await palette.getByTestId('palette-router').click();
  const inspector = await openStyleWorkspace(page);

  await editStyleAttribute(inspector, 'Default', 'Body width');
  const widthField = inspector.locator('[data-field-path="width"]');
  await widthField.getByRole('button', { name: 'Body width actions' }).click();
  const menuMetrics = await widthField.getByRole('menu').evaluate((menu) => {
    const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    return {
      menuWidth: menu.getBoundingClientRect().width,
      wrappedItems: items.filter((item) => item.scrollWidth > item.clientWidth || item.getBoundingClientRect().height > 32).length,
      narrowItems: items.filter((item) => item.getBoundingClientRect().width < 120).length
    };
  });
  expect(menuMetrics.menuWidth).toBeGreaterThanOrEqual(150);
  expect(menuMetrics.wrappedItems).toBe(0);
  expect(menuMetrics.narrowItems).toBe(0);
  await widthField.getByRole('menuitem', { name: 'Write default' }).click();
  await expect(inspector.getByRole('spinbutton', { name: 'Body width' })).toHaveValue('82');
  await widthField.getByRole('button', { name: 'Body width actions' }).click();
  await widthField.getByRole('menuitem', { name: 'Unset value' }).click();

  await (await openStudioWorkspace(page, 'Topo')).getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click({ modifiers: ['Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge[data-id="link-1"]')).toHaveCount(1);
  await openStyleWorkspace(page);
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('dash pattern');
  await editStyleAttribute(inspector, 'Default', 'Dash pattern');
  const dashPattern = inspector.getByRole('textbox', { name: 'Dash pattern' });
  await dashPattern.fill('8, bad');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toContainText('finite numbers');
  await dashPattern.fill('8, 4');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toHaveCount(0);
});

test('persists sparse field-profile overrides without modifying project YAML', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Default', 'Shape');
  const shapeField = inspector.locator('[data-field-path="shape"]');
  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Move to View More' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toHaveCount(0);
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await inspector.getByRole('button', { name: /View More/ }).click();
  await editStyleAttribute(inspector, 'Default', 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();

  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Hide field' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toHaveCount(0);
  await inspector.getByText('Customize fields').click();
  await inspector.getByRole('checkbox', { name: 'Show hidden' }).check();
  await editStyleAttribute(inspector, 'Default', 'Shape');
  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Restore field' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();

  await editStyleAttribute(inspector, 'Default', 'Body height');
  const heightField = inspector.locator('[data-field-path="height"]');
  await heightField.getByRole('button', { name: 'Body height actions' }).click();
  await heightField.getByRole('menuitem', { name: 'Move earlier' }).click();
  const order = await inspector.locator('.studio-style-matrix-row').evaluateAll((fields) => (
    fields.map((field) => field.getAttribute('data-style-attribute'))
  ));
  expect(order.indexOf('height')).toBeLessThan(order.indexOf('width'));
  await inspector.getByRole('button', { name: 'View Less' }).click();

  await page.getByRole('button', { name: 'Reload project' }).click();
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const reloadedInspector = await openStyleWorkspace(page);
  await reloadedInspector.getByRole('button', { name: /View More/ }).click();
  await editStyleAttribute(reloadedInspector, 'Default', 'Shape');
  await expect(reloadedInspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  const customization = reloadedInspector.getByText('Customize fields');
  if (await customization.getAttribute('aria-expanded') !== 'true') await customization.click();
  await reloadedInspector.getByRole('button', { name: 'Reset field profile' }).click();
  await expect(reloadedInspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('authors reusable rules and object overrides as one visible style cascade', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);

  await editStyleAttribute(inspector, 'Default', 'Shape');
  const shapeField = inspector.locator('[data-field-path="shape"]');
  const provenance = shapeField.getByRole('button', { name: 'Rule node' });
  await expect(provenance).toHaveText('Rule node');
  await provenance.click();
  await expect(shapeField).toContainText(/stylesheet\.yaml:\d+:\d+/);

  await expect(inspector.getByRole('combobox', { name: 'Style target' })).toHaveValue('node');
  await expect(inspector.getByRole('combobox', { name: 'Style target' })).toBeEnabled();
  await editStyleAttribute(inspector, 'Selector', 'Shape');
  const rule = inspector.getByRole('combobox', { name: 'Style selector' });
  await expect(rule.locator('option')).toHaveCount(1);

  await inspector.getByRole('button', { name: 'Add selector' }).click();
  await expect(inspector.getByRole('button', { name: 'Use selector This node' })).toBeVisible();
  await inspector.getByRole('button', { name: 'Use selector role = leaf' }).click();
  await expect(inspector.getByRole('textbox', { name: 'New selector' })).toHaveValue('node[labels.role = "leaf"]');
  await inspector.getByRole('button', { name: 'Create selector' }).click();
  await expect(inspector.getByText('2 matches')).toBeVisible();
  await editStyleAttribute(inspector, 'Selector', 'Shape');
  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');

  await editStyleAttribute(inspector, 'Bypass', 'Background color');
  const background = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await expect(inspector.locator('[data-field-path="backgroundColor"]')).toContainText('Object override');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expectEditorContains(page, 'stylesheet', 'shape: roundRectangle');
  await drawer.getByRole('tab', { name: 'topology.yaml' }).click();
  await expectEditorContains(page, 'topology', 'backgroundColor: "#123456"');
});

test('authors one style attribute across Default, Selector, and Bypass columns', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const inspector = await openStyleWorkspace(page);

  const matrix = inspector.getByRole('table', { name: 'Style attributes' });
  await expect(matrix.getByRole('columnheader')).toHaveText(['Default', 'Selector', 'Bypass', 'Style attribute']);
  const background = matrix.getByRole('row', { name: /Background color/ });
  await expect(background.getByRole('button', { name: 'Edit Default Background color' })).toBeVisible();
  await expect(background.getByRole('button', { name: 'Edit Selector Background color' })).toBeVisible();
  await expect(background.getByRole('button', { name: 'Edit Bypass Background color' })).toBeEnabled();

  await background.getByRole('button', { name: 'Edit Default Background color' }).click();
  await expect(inspector.getByText('Default · node')).toBeVisible();

  await background.getByRole('button', { name: 'Edit Selector Background color' }).click();
  await inspector.getByRole('button', { name: 'Add selector' }).click();
  await inspector.getByRole('button', { name: 'Use selector role = leaf' }).click();
  await inspector.getByRole('button', { name: 'Create selector' }).click();
  await background.getByRole('button', { name: 'Edit Selector Background color' }).click();
  await expect(inspector.getByText('Selector · node[labels.role = "leaf"]')).toBeVisible();

  await background.getByRole('button', { name: 'Edit Bypass Background color' }).click();
  await expect(inspector.getByText('Bypass · leaf1')).toBeVisible();
});

test('manages ordered reusable rules without requiring a selected object', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const inspector = await openStyleWorkspace(page);

  await inspector.getByRole('combobox', { name: 'Style target' }).selectOption('node');
  await expect(inspector.getByRole('button', { exact: true, name: 'Edit Bypass Shape' })).toBeDisabled();
  await inspector.getByRole('combobox', { name: 'Style target' }).selectOption('link');
  await editStyleAttribute(inspector, 'Selector', 'Curve style');
  const rule = inspector.getByRole('combobox', { name: 'Style selector' });
  await expect(rule.locator('option')).toHaveCount(1);
  await expect(rule.locator('option').first()).toContainText('No specific selectors');

  await inspector.getByRole('button', { name: 'Add selector' }).click();
  const selector = inspector.getByRole('textbox', { name: 'New selector' });
  await selector.fill('link[labels.link = "backbone"]');
  await inspector.getByRole('button', { name: 'Create selector' }).click();
  await expect(rule.locator('option')).toHaveCount(1);

  await inspector.getByRole('button', { name: 'Selector actions' }).click();
  await inspector.getByRole('menuitem', { name: 'Edit selector' }).click();
  const existingSelector = inspector.getByRole('textbox', { name: 'Selector expression' });
  await expect(existingSelector).toHaveValue('link[labels.link = "backbone"]');
  await expect(inspector.getByText('No current matches')).toBeVisible();
  await existingSelector.fill('link[labels.link = "transport"]');
  await inspector.getByRole('button', { name: 'Save' }).click();
  await expect(rule).toContainText('link[labels.link = "transport"]');

  await inspector.getByRole('button', { name: 'Selector actions' }).click();
  await inspector.getByRole('menuitem', { name: 'Duplicate selector' }).click();
  await expect(rule.locator('option')).toHaveCount(2);
  await inspector.getByRole('button', { name: 'Selector actions' }).click();
  await inspector.getByRole('menuitem', { name: 'Move earlier' }).click();
  await inspector.getByRole('button', { name: 'Selector actions' }).click();
  await inspector.getByRole('menuitem', { name: 'Delete selector' }).click();
  await expect(rule.locator('option')).toHaveCount(1);

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(rule.locator('option')).toHaveCount(2);

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expectEditorContains(page, 'stylesheet', 'selector: link[labels.link = "transport"]');
});

test('preserves unknown future fields and navigates to their raw YAML range', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  await page.locator('.react-flow__node[data-id="future-node"]').click();
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Bypass', 'Body width');
  await expect(inspector.getByText('Unsupported fields')).toBeVisible();
  await inspector.getByRole('button', { name: 'Open futureGlow in YAML' }).click();

  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer.getByText('graph.nodes.0.style.futureGlow')).toBeVisible();
  await expect(drawer.getByText(/Line \d+, column \d+/)).toBeVisible();
  await expectEditorContains(page, 'topology', 'futureGlow:');
  await drawer.getByRole('button', { name: 'Close' }).click();

  const widthField = inspector.locator('[data-field-path="width"]');
  await widthField.getByRole('button', { name: 'Body width actions' }).click();
  await widthField.getByRole('menuitem', { name: 'Write default' }).click();
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  await expectEditorContains(page, 'topology', 'futureGlow:');
  await expectEditorContains(page, 'topology', 'width: 82');
});
