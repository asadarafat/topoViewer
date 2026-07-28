import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { activateStudioPaletteTemplate, openStudioWorkspace } from '../support/workspaceRail';

interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}

function overlaps(left: Rect, right: Rect, tolerance = 1) {
  return left.x + tolerance < right.x + right.width && left.x + left.width > right.x + tolerance && left.y + tolerance < right.y + right.height && left.y + left.height > right.y + tolerance;
}

async function dragTemplate(page: Page, id: string, position: { x: number; y: number }) {
  await openStudioWorkspace(page, 'Add');
  if (['callout', 'region', 'shape', 'text'].includes(id)) {
    const group = page.getByRole('button', { name: 'Annotations palette group' });
    if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
  }
  const source = page.getByTestId(`palette-${id}`);
  await source.scrollIntoViewIfNeeded();
  await source.dragTo(page.getByTestId('studio-canvas'), { targetPosition: position });
}

async function dragCenterTo(object: Locator, target: Rect, page: Page) {
  const dragSurface = object.locator('.topoviewer-node-geometry').first();
  const box = await dragSurface.boundingBox();
  if (!box) throw new Error('Authoring object is not measurable.');
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const end = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 14 });
  await page.mouse.up();
}

test('keeps curated regions, nodes, and labels coherent and collapse recoverable', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await dragTemplate(page, 'region', { x: 420, y: 250 });
  await dragTemplate(page, 'region', { x: 420, y: 250 });
  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');

  const regions = [page.locator('.react-flow__node[data-id="region:region-1"]'), page.locator('.react-flow__node[data-id="region:region-2"]')];
  const nodes = [page.locator('.react-flow__node[data-id="router-1"]'), page.locator('.react-flow__node[data-id="router-2"]')];
  await page.getByRole('button', { name: 'Fit view' }).click();
  await page.waitForTimeout(500);
  const regionBoxes = await Promise.all(regions.map((region) => region.boundingBox()));
  if (!regionBoxes[0] || !regionBoxes[1]) throw new Error('Region geometry is not measurable.');

  await dragCenterTo(nodes[0], regionBoxes[0], page);
  await dragCenterTo(nodes[1], regionBoxes[1], page);

  const settledRegionBoxes = await Promise.all(regions.map((region) => region.boundingBox()));
  const nodeBoxes = await Promise.all(nodes.map((node) => node.boundingBox()));
  if (settledRegionBoxes.some((box) => !box) || nodeBoxes.some((box) => !box)) {
    throw new Error('Curated authoring geometry disappeared.');
  }
  const measuredRegions = settledRegionBoxes as Rect[];
  const measuredNodes = nodeBoxes as Rect[];
  expect(overlaps(measuredRegions[0], measuredRegions[1])).toBe(false);
  expect(overlaps(measuredNodes[0], measuredNodes[1])).toBe(false);
  measuredNodes.forEach((node, index) => {
    const region = measuredRegions[index];
    expect(node.x).toBeGreaterThan(region.x);
    expect(node.y).toBeGreaterThan(region.y);
    expect(node.x + node.width).toBeLessThan(region.x + region.width);
    expect(node.y + node.height).toBeLessThan(region.y + region.height);
  });

  const labels = page.locator('.topoviewer-label-overlay:visible');
  const labelBoxes = await Promise.all(Array.from({ length: await labels.count() }, (_, index) => labels.nth(index).boundingBox()));
  const measuredLabels = labelBoxes.filter((box): box is Rect => Boolean(box));
  for (let left = 0; left < measuredLabels.length; left += 1) {
    for (let right = left + 1; right < measuredLabels.length; right += 1) {
      expect(overlaps(measuredLabels[left], measuredLabels[right])).toBe(false);
    }
  }
  measuredLabels.forEach((label) => {
    measuredNodes.forEach((node) => expect(overlaps(label, node)).toBe(false));
  });

  const artifactDirectory = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/phase-8');
  await mkdir(artifactDirectory, { recursive: true });
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.screenshot({ path: path.join(artifactDirectory, 'regions-expanded.png') });

  await page.getByRole('button', { name: 'Collapse region-1' }).click();
  const expand = page.locator('button.topoviewer-aggregate-expand-button');
  await expect(expand).toHaveAccessibleName(/Expand region-1/);
  await expect(expand).toBeVisible();
  await page.screenshot({ path: path.join(artifactDirectory, 'region-collapsed.png') });
  await expand.click();
  await expect(page.getByRole('button', { name: /^Collapse region-[12]$/ })).toHaveCount(2);
});
