import { expect, type Page } from '@playwright/test';

export async function invokeStudioHeaderAction(page: Page, name: 'Presentation mode' | 'Preview feedback' | 'Reload project') {
  const trigger = page.getByRole('button', { name: 'More Studio actions' });
  await trigger.click();
  const action = page.getByRole('menuitem', { name });
  await expect(action).toBeVisible();
  await action.click();
}
