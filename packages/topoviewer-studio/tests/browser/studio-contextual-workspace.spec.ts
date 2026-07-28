import { expect, test } from '@playwright/test';
import { openStudioWorkspace } from '../support/workspaceRail';

test('uses Add, Properties, and Mapper as the only workspace destinations', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  await expect(rail.getByRole('tab')).toHaveCount(3);
  await expect(rail.getByRole('tab', { name: 'Add' })).toHaveAttribute('aria-selected', 'true');
  await expect(rail.getByRole('tab', { name: 'Properties' })).toBeVisible();
  await expect(rail.getByRole('tab', { name: 'Mapper' })).toBeVisible();
  await expect(rail.getByRole('tab', { name: 'Objects' })).toHaveCount(0);
  await expect(rail.getByRole('tab', { name: 'Edit' })).toHaveCount(0);
  await expect(rail.getByRole('tab', { name: 'Viewport' })).toHaveCount(0);
});

test('opens object and canvas Properties while keeping Mapper selection sticky', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const leaf1 = page.locator('.react-flow__node[data-id="leaf1"]');
  await leaf1.focus();
  await page.keyboard.press('Enter');
  await expect(leaf1).toBeFocused();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toContainText(/selected/i);
  let properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByText('leaf1', { exact: true })).toBeVisible();

  await page.getByTestId('studio-canvas').click({ position: { x: 20, y: 20 } });
  properties = await openStudioWorkspace(page, 'Properties');
  await expect(properties.getByLabel('Viewport settings')).toBeVisible();
  await expect(properties.getByLabel('Viewport settings')).toBeVisible();

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await page.locator('.react-flow__node[data-id="leaf2"]').click();
  await expect(page.getByRole('tab', { name: 'Mapper' })).toHaveAttribute('aria-selected', 'true');
  await expect(mapper).toBeVisible();
});

test('moves completed creation to contextual Properties and leaves cancellation in Add', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const add = await openStudioWorkspace(page, 'Add');
  await add.getByTestId('palette-router').click();
  await expect(page.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('complementary', { name: 'Properties workspace' })).toContainText('router-1');

  await openStudioWorkspace(page, 'Add');
  await add.getByTestId('palette-link').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tab', { name: 'Add' })).toHaveAttribute('aria-selected', 'true');
});

test('keeps selection-only commands in one contextual Material menu', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  const controls = page.getByTestId('studio-canvas').locator('.studio-canvas-unified-controls');

  await expect(controls.getByRole('button', { name: 'Selection actions' })).toBeVisible();
  await expect(controls.getByRole('button', { name: 'Duplicate selection' })).toHaveCount(0);
  await expect(controls.getByRole('button', { name: 'Copy formatting' })).toHaveCount(0);
  await expect(controls.getByRole('button', { name: 'Save selection to Object Palette' })).toHaveCount(0);

  await controls.getByRole('button', { name: 'Selection actions' }).click();
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Copy formatting' })).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Save to Object Palette' })).toBeVisible();
});
