import { expect, type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from './workbench';

export async function editStyleAttribute(inspector: Locator, label: string) {
  const search = inspector.getByRole('searchbox', { name: 'Search style attributes' });
  await search.fill(label);
  const fields = inspector.locator('.studio-basic-style-field');
  const labelledField = fields.filter({ hasText: label }).first();
  const field = (await labelledField.count()) > 0 ? labelledField : fields.first();
  await expect(field).toBeVisible();
  return field;
}

export function openStyleWorkspace(page: Page) {
  return openStudioWorkspace(page, 'Properties');
}
