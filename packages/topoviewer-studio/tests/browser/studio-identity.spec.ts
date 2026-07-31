import { expect, test } from '@playwright/test';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument, openStudioWorkspace } from '../support/workbench';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';

async function createReferencedRouterPair(page: import('@playwright/test').Page) {
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  await page.locator('.react-flow__node[data-id="router-2"]').click({ modifiers: ['Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await page.locator('.react-flow__node[data-id="router-1"]').click();
}

test('renames canonical identity from Visual mode with impact, collision, selection, and history safety', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await createReferencedRouterPair(page);
  const edit = await openStudioWorkspace(page, 'Properties');
  const id = edit.getByRole('textbox', { name: 'ID' });

  await id.fill('router-2');
  await expect(edit.getByText(/already used/i)).toBeVisible();
  await id.press('Escape');
  await expect(id).toHaveValue('router-1');

  await id.fill('edge-a');
  await expect(edit.getByText(/2 references across 2 files will update/i)).toBeVisible();
  await id.press('Enter');

  await expect(page.locator('.react-flow__node[data-id="edge-a"]')).toHaveClass(/selected/);
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveClass(/selected/);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.locator('.react-flow__node[data-id="edge-a"]')).toHaveClass(/selected/);

  await openPropertiesCodeDocument(page, 'topology');
  await expectEditorContains(page, 'topology', 'source: edge-a');
  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "edge-a"]');
});

test('completes a Code-mode declaration rename across known bundle references', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await createReferencedRouterPair(page);
  const edit = await openPropertiesCodeDocument(page, 'topology');

  await replaceEditorMatch(page, 'topology', 'id: router-1', 'id: edge-a');
  await edit.getByRole('button', { name: 'Apply topology' }).click();

  await expect(page.locator('.react-flow__node[data-id="edge-a"]')).toHaveClass(/selected/);
  await expectEditorContains(page, 'topology', 'source: edge-a');
  await openPropertiesCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'node[id = "edge-a"]');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.react-flow__node[data-id="router-1"]')).toHaveClass(/selected/);
});
