import { expect, test } from '@playwright/test';

async function expectEditorContains(page: import('@playwright/test').Page, document: 'topology' | 'stylesheet', query: string) {
  await page.getByLabel(`${document} YAML editor`).focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
}

test('separates document ownership and generates searchable Basic and All style views', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();

  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await expect(inspector.getByRole('tab', { name: 'Topology' })).toHaveAttribute('aria-selected', 'true');
  await expect(inspector.getByText('topology.yaml', { exact: true })).toBeVisible();
  await expect(inspector.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await expect(inspector.locator('.studio-inspector-document-tabs.MuiTabs-root')).toBeVisible();
  await inspector.getByRole('tab', { name: 'Topology' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(inspector.getByRole('tab', { name: 'Styles' })).toHaveAttribute('aria-selected', 'true');
  await expect(inspector.getByRole('tab', { name: 'Basic' })).toHaveAttribute('aria-selected', 'true');
  await expect(inspector.locator('.studio-inspector-view-tabs.MuiTabs-root')).toBeVisible();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(inspector.getByRole('spinbutton', { name: 'Outline width' })).toHaveCount(0);

  await inspector.getByRole('tab', { name: 'All' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('outline width');
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

  await inspector.getByRole('tab', { name: 'Basic' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('');
  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');
  const layout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(layout).toBeVisible();
  await expect(layout.getByRole('combobox', { name: 'Direction' })).toHaveValue('horizontal');
  await layout.getByRole('combobox', { name: 'Content alignment' }).selectOption('center');

  await inspector.getByRole('tab', { name: 'All' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('card layout');
  await expect(layout).toBeVisible();
  await expect(inspector.getByRole('spinbutton', { name: 'Line width' })).toHaveCount(0);

  await inspector.getByRole('tab', { name: 'Mapper' }).click();
  await expect(inspector.getByText('mapper.yaml', { exact: true })).toBeVisible();
  await inspector.getByRole('button', { name: 'Open mapper workspace' }).click();
  await expect(page.getByRole('region', { name: 'Telemetry mapper workspace' })).toBeVisible();
});

test('writes explicit defaults and validates typed list controls', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Styles' }).click();

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

  await page.getByTestId('palette-node').click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await inspector.getByRole('tab', { name: 'All' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('dash pattern');
  const dashPattern = inspector.getByRole('textbox', { name: 'Dash pattern' });
  await dashPattern.fill('8, bad');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toContainText('finite numbers');
  await dashPattern.fill('8, 4');
  await dashPattern.press('Enter');
  await expect(inspector.getByRole('alert')).toHaveCount(0);
});

test('persists sparse field-profile overrides without modifying project YAML', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');

  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  const shapeField = inspector.locator('[data-field-path="shape"]');
  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Remove from Basic' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toHaveCount(0);
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await inspector.getByRole('tab', { name: 'All' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();

  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Hide field' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toHaveCount(0);
  await inspector.getByText('Customize fields').click();
  await inspector.getByRole('checkbox', { name: 'Show hidden' }).check();
  await shapeField.getByRole('button', { name: 'Shape actions' }).click();
  await shapeField.getByRole('menuitem', { name: 'Restore field' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();

  const heightField = inspector.locator('[data-field-path="height"]');
  await heightField.getByRole('button', { name: 'Body height actions' }).click();
  await heightField.getByRole('menuitem', { name: 'Move earlier' }).click();
  const order = await inspector.locator('.studio-generated-field').evaluateAll((fields) => (
    fields.map((field) => field.getAttribute('data-field-path'))
  ));
  expect(order.indexOf('height')).toBeLessThan(order.indexOf('width'));

  await page.getByRole('button', { name: 'Reload project' }).click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  const reloadedInspector = page.getByRole('complementary', { name: 'Inspector' });
  await reloadedInspector.getByRole('tab', { name: 'Styles' }).click();
  await reloadedInspector.getByRole('tab', { name: 'All' }).click();
  await expect(reloadedInspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  const customization = reloadedInspector.getByText('Customize fields');
  if (await customization.getAttribute('aria-expanded') !== 'true') await customization.click();
  await reloadedInspector.getByRole('button', { name: 'Reset field profile' }).click();
  await reloadedInspector.getByRole('tab', { name: 'Basic' }).click();
  await expect(reloadedInspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
});

test('shows provenance and writes only the explicitly selected style scope', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Styles' }).click();

  const shapeField = inspector.locator('[data-field-path="shape"]');
  const provenance = shapeField.locator('.studio-style-provenance summary');
  await expect(provenance).toHaveText('Rule node');
  await provenance.click();
  await expect(shapeField).toContainText(/stylesheet\.yaml:\d+:\d+/);

  const scope = inspector.getByRole('combobox', { name: 'Edit scope' });
  await expect(inspector.getByText('1 affected object')).toBeVisible();
  await scope.selectOption({ label: 'Rule: node' });
  await expect(inspector.getByText('2 affected objects')).toBeVisible();
  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');

  await scope.selectOption('new');
  await inspector.getByRole('textbox', { name: 'New rule selector' }).fill('node[labels.role = "node"]');
  await expect(inspector.getByText('2 affected objects')).toBeVisible();
  const background = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await expect(scope).toHaveValue(/rule:\d+/);

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expectEditorContains(page, 'stylesheet', 'shape: roundRectangle');
  await expectEditorContains(page, 'stylesheet', 'selector: node[labels.role = "node"]');
  await expectEditorContains(page, 'stylesheet', 'backgroundColor: "#123456"');
});

test('preserves unknown future fields and navigates to their raw YAML range', async ({ page }) => {
  await page.goto('/?__studio-test-state=future-style');
  await page.locator('.react-flow__node[data-id="future-node"]').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Styles' }).click();
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
