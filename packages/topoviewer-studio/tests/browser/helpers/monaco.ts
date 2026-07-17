import { expect, type Page } from '@playwright/test';

export type StudioYamlDocument = 'topology' | 'stylesheet' | 'mapper';

function editorSurface(page: Page, document: StudioYamlDocument) {
  const editor = page.getByLabel(`${document} YAML editor`);
  const surface = editor.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " monaco-editor ")][1]');
  return { editor, surface };
}

export async function expectEditorContains(page: Page, document: StudioYamlDocument, query: string, present = true) {
  const { editor, surface } = editorSurface(page, document);
  await editor.focus();
  await page.keyboard.press('Control+f');
  await surface.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  const matches = surface.locator('.find-widget .matchesCount');
  if (present) await expect(matches).toHaveText(/\d+ of \d+/);
  else await expect(matches).toHaveText('No results');
  await page.keyboard.press('Escape');
}

export async function replaceEditorMatch(page: Page, document: StudioYamlDocument, query: string, replacement: string) {
  const { editor, surface } = editorSurface(page, document);
  await editor.focus();
  await page.keyboard.press('Control+f');
  await surface.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  await expect(surface.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
  await page.keyboard.insertText(replacement);
}
