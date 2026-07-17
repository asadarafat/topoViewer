import { expect, type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from './workspaceRail';

export async function editStyleAttribute(inspector: Locator, label: string) {
  const search = inspector.getByRole('searchbox', { name: 'Search style attributes' });
  await search.fill(label);
  const field = inspector.locator('.studio-basic-style-field').filter({ hasText: label }).first();
  await expect(field).toBeVisible();
  return field;
}

export async function migrateInlineStyles(inspector: Locator) {
  const migrate = inspector.getByRole('button', { name: 'Move all' });
  await expect(migrate).toBeVisible();
  await migrate.click();
}

export function openStyleWorkspace(page: Page) {
  return openStudioWorkspace(page, 'Style');
}
