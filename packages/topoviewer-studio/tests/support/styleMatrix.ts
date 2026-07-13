import { type Locator, type Page } from '@playwright/test';
import { openStudioWorkspace } from './workspaceRail';

export type StyleMatrixSource = 'Default' | 'Selector' | 'Bypass';

export async function editStyleAttribute(inspector: Locator, source: StyleMatrixSource, label: string) {
  await inspector
    .getByRole('table', { name: 'Style attributes' })
    .getByRole('button', { exact: true, name: `Edit ${source} ${label}` })
    .click();
}

export function openStyleWorkspace(page: Page) {
  return openStudioWorkspace(page, 'Style');
}
