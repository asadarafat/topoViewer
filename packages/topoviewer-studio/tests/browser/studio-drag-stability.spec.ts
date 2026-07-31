import { expect, test, type Locator, type Page } from '@playwright/test';
import { activateStudioPaletteTemplate } from '../support/workbench';

async function editorSource(page: Page, editor: Locator) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  return page.evaluate(() => navigator.clipboard.readText());
}

async function staggeredDrag(page: Page, node: Locator, deltas: Array<{ x: number; y: number }>) {
  const dragSurface = node.locator('.topoviewer-node-icon');
  for (const delta of deltas) {
    const box = await dragSurface.boundingBox();
    if (!box) throw new Error('Dragged node is not measurable.');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + delta.x, box.y + box.height / 2 + delta.y, { steps: 12 });
    await page.mouse.up();
    await expect(page.locator('.topoviewer-helper-line')).toHaveCount(0);
    await expect(node).toBeVisible();
    const after = await dragSurface.boundingBox();
    if (!after) throw new Error('Dragged node disappeared after release.');
    expect(Math.hypot(after.x - box.x, after.y - box.y)).toBeGreaterThan(2);
  }
}

test('keeps two-node staggered drag stable and commits only after release', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  const announcement = page.locator('.studio-visually-hidden[aria-live="polite"]');
  const sourceEditor = page.getByLabel('topology YAML editor');
  const sourceBeforeMove = await editorSource(page, sourceEditor);
  await page.waitForTimeout(250);
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  const box = await node.boundingBox();
  if (!box) throw new Error('Dragged node is not measurable.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 4);
  await expect(announcement).toContainText('selected');
  const duringSelection = await announcement.textContent();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 70, { steps: 10 });
  await expect(announcement).toHaveText(duringSelection ?? '');
  await page.mouse.up();
  await expect(announcement).toContainText('Move');
  await expect.poll(() => editorSource(page, sourceEditor)).not.toBe(sourceBeforeMove);

  await staggeredDrag(page, node, [
    { x: 0, y: -34 },
    { x: 24, y: 0 },
    { x: -18, y: 30 },
    { x: 0, y: -22 }
  ]);
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
});

test('keeps dense repeated drag nonblank and bounded', async ({ page }) => {
  await page.goto('/?__studio-test-state=dense');
  const nodes = page.locator('.react-flow__node');
  await expect(nodes).toHaveCount(120, { timeout: 10_000 });
  const node = page.locator('.react-flow__node[data-id="dense-60"]');
  await staggeredDrag(page, node, [
    { x: 0, y: 42 },
    { x: 18, y: 0 },
    { x: 0, y: -24 },
    { x: -12, y: 18 },
    { x: 20, y: -14 }
  ]);
  await expect(nodes).toHaveCount(120);
  await expect(page.locator('.react-flow__renderer')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Dense topology (120 nodes)', exact: true })
  ).toBeVisible();
});
