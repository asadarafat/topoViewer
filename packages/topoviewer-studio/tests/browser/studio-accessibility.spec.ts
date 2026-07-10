import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('has no critical or serious automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('New Router');

  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) => (
    violation.impact === 'critical' || violation.impact === 'serious'
  ));
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
});
