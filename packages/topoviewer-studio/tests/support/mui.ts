import { expect, type Locator, type Page } from '@playwright/test';

function exactText(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

export async function expectStudioOption(combobox: Locator, option: string) {
  await expect(combobox).toHaveText(exactText(option));
}

export async function selectStudioOption(page: Page, combobox: Locator, option: string) {
  await combobox.click();
  const listbox = page.getByRole('listbox');
  const options = listbox.getByRole('option');
  const namedOption = options.filter({ hasText: exactText(option) });
  if (await namedOption.count()) {
    await namedOption.first().click();
  } else {
    const valueIndex = await options.evaluateAll(
      (elements, expected) => elements.findIndex((element) => element.getAttribute('data-value') === expected),
      option
    );
    if (valueIndex < 0) throw new Error(`MUI Select option not found: ${option}`);
    await options.nth(valueIndex).click();
  }
  await expect(listbox).toBeHidden();
}
