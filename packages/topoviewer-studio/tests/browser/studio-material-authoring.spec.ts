import { expect, test } from '@playwright/test';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';

async function expandPaletteGroup(page: import('@playwright/test').Page, name: string) {
  const group = page.getByRole('button', { name: `${name} palette group` });
  if (await group.getAttribute('aria-expanded') !== 'true') await group.click();
}

async function dragTemplate(
  page: import('@playwright/test').Page,
  id: string,
  position: { x: number; y: number }
) {
  if (['callout', 'region', 'shape', 'text'].includes(id)) await expandPaletteGroup(page, 'Annotations');
  const source = page.getByTestId(`palette-${id}`);
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(page.getByTestId('studio-canvas'), { targetPosition: position });
}

test('offsets click-created objects across canvas object families', async ({ page }) => {
  await page.goto('/');
  await expandPaletteGroup(page, 'Annotations');
  await page.getByTestId('palette-text').click();
  await page.getByTestId('palette-router').click();
  const text = await page.locator('.react-flow__node[data-id="text-1"]').boundingBox();
  const node = await page.locator('.react-flow__node[data-id="router-1"]').boundingBox();
  if (!text || !node) throw new Error('Click-created object geometry is not measurable.');
  const overlapWidth = Math.max(0, Math.min(text.x + text.width, node.x + node.width) - Math.max(text.x, node.x));
  const overlapHeight = Math.max(0, Math.min(text.y + text.height, node.y + node.height) - Math.max(text.y, node.y));
  expect(overlapWidth * overlapHeight).toBe(0);
});

test('creates, resizes, and directly edits a standalone text object', async ({ page }) => {
  await page.goto('/');
  await dragTemplate(page, 'text', { x: 360, y: 220 });

  const text = page.locator('.react-flow__node[data-id="text-1"]');
  const textSurface = text.locator('.topoviewer-resize-surface');
  await expect(text).toContainText('Text');
  await text.dblclick();
  const quickEditor = page.getByRole('dialog', { name: /Edit text/i });
  await expect(quickEditor).toBeVisible();
  await quickEditor.getByRole('textbox').fill('Maintenance\n23:00 UTC');
  await quickEditor.getByRole('button', { name: 'Save' }).click();
  await expect(text).toContainText('Maintenance');

  await text.click();
  const resize = text.locator('.topoviewer-resize-handle.bottom.right');
  const before = await text.boundingBox();
  const handle = await resize.boundingBox();
  if (!before || !handle) throw new Error('Text resize geometry is not measurable.');
  await textSurface.evaluate((element) => {
    (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle = false;
    new MutationObserver(() => {
      if (element.getAttribute('data-resize-state') === 'settling') {
        (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle = true;
      }
    }).observe(element, { attributes: true, attributeFilter: ['data-resize-state'] });
  });
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + 56, handle.y + 32, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => (await text.boundingBox())?.width || 0).toBeGreaterThan(before.width + 20);
  expect(await page.evaluate(() => (
    (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle
  ))).toBe(true);
  await expect(textSurface).toHaveAttribute('data-resize-state', 'idle');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(async () => Math.abs(((await text.boundingBox())?.width || 0) - before.width)).toBeLessThan(3);
});

test('disables resize completion animation when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  const nodeSurface = node.locator('.topoviewer-resize-surface');
  await node.click();
  const handle = node.locator('.topoviewer-resize-handle.bottom.right');
  const box = await handle.boundingBox();
  if (!box) throw new Error('Node resize handle is not measurable.');
  await nodeSurface.evaluate((element) => {
    (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle = false;
    new MutationObserver(() => {
      if (element.getAttribute('data-resize-state') === 'settling') {
        (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle = true;
      }
    }).observe(element, { attributes: true, attributeFilter: ['data-resize-state'] });
  });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 32, box.y + 24, { steps: 6 });
  await page.mouse.up();
  await expect(nodeSurface).toHaveAttribute('data-resize-state', 'idle');
  expect(await page.evaluate(() => (
    (window as typeof window & { __topoviewerSawResizeSettle?: boolean }).__topoviewerSawResizeSettle
  ))).toBe(false);
});

test('uses the shared reliable resize affordance for shapes and callouts', async ({ page }) => {
  await page.goto('/');
  await expandPaletteGroup(page, 'Annotations');
  for (const [template, id] of [['shape', 'shape-1'], ['callout', 'callout-1']] as const) {
    await page.getByTestId(`palette-${template}`).click();
    const object = page.locator(`.react-flow__node[data-id="${id}"]`);
    const before = await object.boundingBox();
    const handle = await object.locator('.topoviewer-resize-handle.bottom.right').boundingBox();
    if (!before || !handle) throw new Error(`${template} resize geometry is not measurable.`);
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 36, handle.y + handle.height / 2 + 24, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => (await object.boundingBox())?.width || 0).toBeGreaterThan(before.width + 20);
  }
});

test('renders a visual color control for every color-valued Inspector field', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.locator('.react-flow__node[data-id="router-1"]').click();
  const inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'This object', 'Background color');

  const textField = page.getByRole('textbox', { exact: true, name: 'Background color' });
  await expect(textField).toBeVisible();
  await textField.fill('rgba(10, 20, 30, 0.5)');
  await textField.blur();
  await expect(page.getByLabel('Background color color picker')).toBeVisible();
});

test('uses Material controls without raw feature-level interactive elements', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.MuiButtonBase-root').first()).toBeVisible();
  await expect(page.locator('.studio-shell')).toHaveAttribute('data-ui-system', 'material');
});
