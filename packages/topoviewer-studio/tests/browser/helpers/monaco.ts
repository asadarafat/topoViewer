import { expect, type Page } from '@playwright/test';

export type StudioYamlDocument = 'topology' | 'stylesheet' | 'mapper';

export async function expectEditorContains(
  page: Page,
  document: StudioYamlDocument,
  query: string,
  present = true
) {
  const editor = page.getByLabel(`${document} YAML editor`);
  await editor.focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  const matches = page.locator('.find-widget .matchesCount');
  if (present) await expect(matches).toHaveText(/\d+ of \d+/);
  else await expect(matches).toHaveText('No results');
  await page.keyboard.press('Escape');
}

export async function replaceEditorMatch(
  page: Page,
  document: StudioYamlDocument,
  query: string,
  replacement: string
) {
  const editor = page.getByLabel(`${document} YAML editor`);
  await editor.focus();
  await page.keyboard.press('Control+f');
  await page.getByRole('textbox', { name: 'Find', exact: true }).fill(query);
  await expect(page.locator('.find-widget .matchesCount')).toHaveText(/\d+ of \d+/);
  await page.keyboard.press('Escape');
  await page.keyboard.insertText(replacement);
}
