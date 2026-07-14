import { type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from './workspaceRail';

export async function editStyleAttribute(inspector: Locator, label: string) {
  await inspector
    .getByRole('table', { name: 'Style attributes' })
    .getByRole('button', { exact: true, name: `Edit This object ${label}` })
    .click();
}

export function openStyleWorkspace(page: Page) {
  return openStudioWorkspace(page, 'Style');
}
