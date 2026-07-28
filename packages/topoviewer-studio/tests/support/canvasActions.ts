import { expect, type Locator, type Page } from '@playwright/test';

export async function openCanvasSelectionActions(page: Page): Promise<Locator> {
  const button = page
    .getByTestId('studio-canvas')
    .locator('.studio-canvas-unified-controls')
    .getByRole('button', { name: 'Selection actions' });
  await expect(button).toBeVisible();
  await button.click();
  const menu = page.getByRole('menu', { name: 'Selection actions' });
  await expect(menu).toBeVisible();
  return menu;
}

export async function invokeCanvasSelectionAction(
  page: Page,
  name: string | RegExp
): Promise<void> {
  const menu = await openCanvasSelectionActions(page);
  await menu.getByRole('menuitem', { name }).click();
}
