import { expect, test } from '@playwright/test';

test('toggles endpoint and bandwidth overlays without hiding the base link', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const edge = page.locator('.react-flow__edge[data-id="spine-leaf"]');
  await expect(edge).toHaveCount(1);
  await expect(edge.locator('path').first()).toHaveAttribute('d', /\S+/);
  await expect(page.locator('.topoviewer-edge-label-source')).toHaveText('e1-1');
  await expect(page.locator('.topoviewer-edge-label-target')).toHaveText('e1-49');
  await expect(page.locator('.topoviewer-edge-direction-stroke')).toHaveCount(2);

  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  const settings = page.getByRole('dialog', { name: 'Layers' });
  await settings.getByRole('switch', { name: 'Physical ports' }).uncheck();
  await expect(page.locator('.topoviewer-edge-label-source')).toHaveCount(0);
  await expect(page.locator('.topoviewer-edge-label-target')).toHaveCount(0);
  await expect(page.locator('.topoviewer-edge-direction-stroke')).toHaveCount(2);
  await expect(edge).toHaveCount(1);
  await expect(edge.locator('path').first()).toHaveAttribute('d', /\S+/);

  await settings.getByRole('switch', { name: 'Bandwidth' }).uncheck();
  await expect(page.locator('.topoviewer-edge-direction-stroke')).toHaveCount(0);
  await expect(edge).toHaveCount(1);
  await expect(edge.locator('path').first()).toHaveAttribute('d', /\S+/);

  await settings.getByRole('switch', { name: 'Physical ports' }).check();
  await settings.getByRole('switch', { name: 'Bandwidth' }).check();
  await expect(page.locator('.topoviewer-edge-label-source')).toHaveText('e1-1');
  await expect(page.locator('.topoviewer-edge-label-target')).toHaveText('e1-49');
  await expect(page.locator('.topoviewer-edge-direction-stroke')).toHaveCount(2);
});
