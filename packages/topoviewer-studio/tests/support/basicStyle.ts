import { expect, type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from './workspaceRail';

export async function editStyleAttribute(inspector: Locator, label: string) {
  const search = inspector.getByRole('searchbox', { name: 'Search Basic style fields' });
  await search.fill(label);
  const field = inspector.locator('.studio-basic-style-field').filter({ hasText: label }).first();
  await expect(field).toBeVisible();
  return field;
}

export async function migrateInlineStyleAttribute(inspector: Locator, label: string) {
  const field = await editStyleAttribute(inspector, label);
  const migrate = field.getByRole('button', { name: 'Move to stylesheet' });
  await expect(migrate).toBeVisible();
  await migrate.click();
  return editStyleAttribute(inspector, label);
}

export function openStyleWorkspace(page: Page) {
  return openStudioWorkspace(page, 'Style');
}
