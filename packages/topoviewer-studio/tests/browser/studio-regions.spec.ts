import { expect, test, type Locator, type Page } from '@playwright/test';
import { openEditCodeDocument } from '../support/workspaceRail';
import { expectEditorContains } from './helpers/monaco';

async function dragTemplate(page: Page, id: string, position: { x: number; y: number }) {
  if (['callout', 'region', 'shape', 'text'].includes(id)) {
    const group = page.getByRole('button', { name: 'Annotations palette group' });
    if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
  }
  const source = page.getByTestId(`palette-${id}`);
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(page.getByTestId('studio-canvas'), { targetPosition: position });
}

async function dragBy(page: Page, object: Locator, delta: { x: number; y: number }, startInset = { x: 0.5, y: 0.5 }) {
  const box = await object.boundingBox();
  if (!box) throw new Error('Authoring object is not measurable.');
  const start = { x: box.x + box.width * startInset.x, y: box.y + box.height * startInset.y };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + delta.x, start.y + delta.y, { steps: 12 });
  await page.mouse.up();
}

async function openSource(page: Page) {
  return openEditCodeDocument(page, 'topology');
}

test('prevents accidental sibling overlap during direct region creation', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'region', { x: 360, y: 300 });
  await dragTemplate(page, 'region', { x: 360, y: 300 });

  const first = await page.locator('.react-flow__node[data-id="region:region-1"]').boundingBox();
  const second = await page.locator('.react-flow__node[data-id="region:region-2"]').boundingBox();
  if (!first || !second) throw new Error('Regions are not measurable.');
  const overlaps = first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
  expect(overlaps).toBe(false);
});

test('previews containment, moves a region group, collapses it, and releases membership', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'region', { x: 430, y: 320 });
  await page.getByTestId('palette-router').click();

  const region = page.locator('.react-flow__node[data-id="region:region-1"]');
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  const regionBox = await region.boundingBox();
  const nodeBox = await node.boundingBox();
  if (!regionBox || !nodeBox) throw new Error('Region membership objects are not measurable.');
  const target = {
    x: regionBox.x + regionBox.width / 2 - (nodeBox.x + nodeBox.width / 2),
    y: regionBox.y + regionBox.height / 2 - (nodeBox.y + nodeBox.height / 2)
  };
  const start = { x: nodeBox.x + nodeBox.width / 2, y: nodeBox.y + nodeBox.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + target.x, start.y + target.y, { steps: 12 });
  await expect(region.locator('.topoviewer-region-preview')).toBeVisible();
  await page.mouse.up();

  const edit = await openSource(page);
  await expectEditorContains(page, 'topology', 'members:');
  await expectEditorContains(page, 'topology', '- router-1');
  await edit.getByRole('button', { name: 'Collapse workspace panel' }).click();

  const memberBefore = await node.boundingBox();
  await dragBy(page, region, { x: 90, y: 54 }, { x: 0.08, y: 0.85 });
  const memberAfter = await node.boundingBox();
  if (!memberBefore || !memberAfter) throw new Error('Region member disappeared during group movement.');
  expect(memberAfter.x - memberBefore.x).toBeGreaterThan(70);
  expect(memberAfter.y - memberBefore.y).toBeGreaterThan(35);

  await page.getByRole('button', { name: 'Collapse region-1' }).click();
  const expand = page.locator('button.topoviewer-aggregate-expand-button');
  await expect(expand).toHaveAccessibleName(/Expand region-1/);
  await expect(expand).toBeVisible();
  await expand.click();
  await expect(page.getByRole('button', { name: 'Collapse region-1' })).toBeVisible();

  await node.click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Release from region' }).click();
  await openSource(page);
  await expectEditorContains(page, 'topology', 'members: []');
  await expectEditorContains(page, 'topology', 'id: router-1');
});

test('persists a member-derived region drag into topology source', async ({ page }) => {
  await page.goto('/?__studio-test-state=region-move');
  const region = page.locator('.react-flow__node[data-id="region:tactical"]');
  const client = page.locator('.react-flow__node[data-id="client"]');
  const regionBefore = await region.boundingBox();
  const clientBefore = await client.boundingBox();
  if (!regionBefore || !clientBefore) throw new Error('Region move fixture is not measurable.');

  await dragBy(page, region, { x: 120, y: 90 }, { x: 0.08, y: 0.84 });

  const regionAfter = await region.boundingBox();
  const clientAfter = await client.boundingBox();
  if (!regionAfter || !clientAfter) throw new Error('Region move fixture disappeared after drag.');
  expect(regionAfter.x - regionBefore.x).toBeGreaterThan(100);
  expect(regionAfter.y - regionBefore.y).toBeGreaterThan(70);
  expect(clientAfter.x - clientBefore.x).toBeGreaterThan(100);
  expect(clientAfter.y - clientBefore.y).toBeGreaterThan(70);

  await openSource(page);
  await expectEditorContains(page, 'topology', 'position: [180, 220]', false);
  await expectEditorContains(page, 'topology', 'position: [360, 220]', false);
});

test('keeps selected region chrome stable while a drag is committed', async ({ page }) => {
  await page.goto('/?__studio-test-state=region-move');
  const region = page.locator('.react-flow__node[data-id="region:tactical"]');
  await region.click({ position: { x: 20, y: 112 } });
  await expect(region).toHaveClass(/selected/);
  await expect(region.locator('.react-flow__resize-control')).toHaveCount(8);

  await page.evaluate(() => {
    const state = window as unknown as {
      __regionChromeSampling: boolean;
      __regionChromeSamples: Array<{ resizeControls: number; selected: boolean }>;
    };
    state.__regionChromeSampling = true;
    state.__regionChromeSamples = [];
    const sample = () => {
      const element = document.querySelector('.react-flow__node[data-id="region:tactical"]');
      state.__regionChromeSamples.push({
        resizeControls: element?.querySelectorAll('.react-flow__resize-control').length || 0,
        selected: element?.classList.contains('selected') === true
      });
      if (state.__regionChromeSampling) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  await dragBy(page, region, { x: 120, y: 90 }, { x: 0.08, y: 0.84 });
  await page.waitForTimeout(120);
  const samples = await page.evaluate(() => {
    const state = window as unknown as {
      __regionChromeSampling: boolean;
      __regionChromeSamples: Array<{ resizeControls: number; selected: boolean }>;
    };
    state.__regionChromeSampling = false;
    return state.__regionChromeSamples;
  });

  expect(samples.length).toBeGreaterThan(2);
  expect(samples.every((sample) => sample.selected && sample.resizeControls === 8)).toBe(true);
});

test('resizes a directly authored region and preserves explicit geometry', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'region', { x: 380, y: 280 });
  await openSource(page);
  await expectEditorContains(page, 'topology', 'size:', false);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'selector: region[id = "region-1"]');
  await expectEditorContains(page, 'stylesheet', 'width: 280');
  await expectEditorContains(page, 'stylesheet', 'height: 180');
  const region = page.locator('.react-flow__node[data-id="region:region-1"]');
  const resize = region.locator('.topoviewer-resize-handle.bottom.right');
  await expect(resize).toBeVisible();
  const before = await region.boundingBox();
  const handle = await resize.boundingBox();
  if (!before || !handle) throw new Error('Region resize geometry is not measurable.');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 48, handle.y + handle.height / 2 + 32, { steps: 10 });
  await page.mouse.up();
  const after = await region.boundingBox();
  if (!after) throw new Error('Region disappeared after resize.');
  expect(after.width).toBeGreaterThan(before.width + 30);
  expect(after.height).toBeGreaterThan(before.height + 20);
  await openSource(page);
  await expectEditorContains(page, 'topology', 'size:', false);
  await expectEditorContains(page, 'topology', 'paddingX', false);
  await expectEditorContains(page, 'topology', 'paddingY', false);
  await expectEditorContains(page, 'topology', 'headerPadding', false);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'width: 328');
  await expectEditorContains(page, 'stylesheet', 'height: 212');
});

test('converts a member-derived region into stable explicit geometry when resized', async ({ page }) => {
  await page.goto('/?__studio-test-state=region-move');
  const region = page.locator('.react-flow__node[data-id="region:tactical"]');
  await region.click({ position: { x: 20, y: 112 } });
  const resize = region.locator('.topoviewer-resize-handle.bottom.right');
  await expect(resize).toBeVisible();
  const before = await region.boundingBox();
  const handle = await resize.boundingBox();
  if (!before || !handle) throw new Error('Member-derived region resize geometry is not measurable.');

  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 - 60, handle.y + handle.height / 2 - 30, { steps: 10 });
  await page.mouse.up();

  const after = await region.boundingBox();
  if (!after) throw new Error('Member-derived region disappeared after resize.');
  expect(after.width).toBeLessThan(before.width - 45);
  expect(after.height).toBeLessThan(before.height - 20);

  await openSource(page);
  await expectEditorContains(page, 'topology', 'size:', false);
  await expectEditorContains(page, 'topology', 'position:');
  await expectEditorContains(page, 'topology', 'paddingX', false);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'selector: region[id = "tactical"]');
  await expectEditorContains(page, 'stylesheet', 'width:');
  await expectEditorContains(page, 'stylesheet', 'height:');
});

test('creates region nesting only through an explicit group action', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'region', { x: 380, y: 280 });
  const parent = page.locator('.react-flow__node[data-id="region:region-1"]');
  await parent.click({ button: 'right', position: { x: 24, y: 150 } });
  await page.getByRole('menuitem', { name: 'Create nested region' }).click();
  const child = page.locator('.react-flow__node[data-id="region:region-2"]');
  await expect(child).toBeVisible();
  const parentBox = await parent.boundingBox();
  const childBox = await child.boundingBox();
  if (!parentBox || !childBox) throw new Error('Nested region bounds are not measurable.');
  expect(childBox.x).toBeGreaterThan(parentBox.x);
  expect(childBox.y).toBeGreaterThan(parentBox.y);
  expect(childBox.x + childBox.width).toBeLessThan(parentBox.x + parentBox.width);
  expect(childBox.y + childBox.height).toBeLessThan(parentBox.y + parentBox.height);
  await openSource(page);
  await expectEditorContains(page, 'topology', 'id: region-2');
  await expectEditorContains(page, 'topology', 'parent: region-1');
  await expectEditorContains(page, 'topology', 'size:', false);
  await openEditCodeDocument(page, 'stylesheet');
  await expectEditorContains(page, 'stylesheet', 'selector: region[id = "region-2"]');
  await expectEditorContains(page, 'stylesheet', 'width: 160');
  await expectEditorContains(page, 'stylesheet', 'height: 96');
});
