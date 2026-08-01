import { expect, type Page } from '@playwright/test';

type StudioHeaderAction = 'Presentation mode' | 'Preview feedback' | 'Redo' | 'Reload project' | 'Undo';

export async function invokeStudioHeaderAction(page: Page, name: StudioHeaderAction) {
  const directAction = page.getByRole('button', { name });
  if (await directAction.isVisible().catch(() => false)) {
    await directAction.click();
    return;
  }
  const trigger = page.getByRole('button', { name: 'More Studio actions' });
  await trigger.click();
  const action = page.getByRole('menuitem', { name });
  await expect(action).toBeVisible();
  await action.click();
}
