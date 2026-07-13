import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openStudioWorkspace } from '../support/workspaceRail';

test('restores authoring selection and viewport after presentation mode', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  await node.click();
  await expect(node).toHaveClass(/selected/);
  const viewport = page.locator('.react-flow__viewport');
  const authoringTransform = await viewport.getAttribute('style');

  await page.getByRole('button', { name: 'Enter presentation mode' }).click();
  await expect(page.locator('.studio-shell')).toHaveClass(/studio-shell--presentation/);
  await expect(page.getByRole('button', { name: 'Exit presentation mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Zoom In' }).click();
  await expect(viewport).not.toHaveAttribute('style', authoringTransform || '');

  await page.getByRole('button', { name: 'Exit presentation mode' }).click();
  await expect(page.locator('.studio-shell')).not.toHaveClass(/studio-shell--presentation/);
  await expect(viewport).toHaveAttribute('style', authoringTransform || '');
  await expect(node).toHaveClass(/selected/);
});

test('exports bounded PNG and SVG images from the current canvas', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export project' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'Export width' }).fill('480');
  await dialog.getByRole('spinbutton', { name: 'Export height' }).fill('320');

  const pngDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export PNG' }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  const pngBytes = await readFile(await png.path() as string);
  expect([...pngBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

  await dialog.getByRole('button', { name: 'SVG' }).click();
  const svgDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export SVG' }).click();
  const svg = await svgDownload;
  expect(svg.suggestedFilename()).toMatch(/\.svg$/);
  const svgText = await readFile(await svg.path() as string, 'utf8');
  expect(svgText).toMatch(/<svg[\s>]/);
});

test('copies MkDocs and static snippets that reference canonical files', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export project' });

  await dialog.getByRole('button', { name: 'Copy MkDocs snippet' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('```topoviewer\ntopology: topology.yaml');
  await dialog.getByRole('button', { name: 'Copy static HTML snippet' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('data-stylesheet="stylesheet.yaml"');
});

test('validates and exports the canonical Grafana mounted-bundle layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  let dialog = page.getByRole('dialog', { name: 'Export project' });
  await dialog.getByRole('button', { name: 'Export Grafana bundle' }).click();
  await expect(dialog.getByRole('alert')).toContainText('requires mapper YAML');
  await dialog.getByRole('button', { name: 'Close export panel' }).click();

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await mapper.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await page.getByRole('button', { name: 'Open export panel' }).click();
  dialog = page.getByRole('dialog', { name: 'Export project' });
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export Grafana bundle' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.grafana\.zip$/);
  const bytes = await readFile(await download.path() as string);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
});

test('contains export failure and retries without clearing dirty project state', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-router').click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export project' });
  await dialog.getByRole('spinbutton', { name: 'Export width' }).fill('9000');
  await dialog.getByRole('button', { name: 'Export PNG' }).click();
  await expect(dialog.getByRole('alert')).toContainText('between 1 and 8192');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await dialog.getByRole('spinbutton', { name: 'Export width' }).fill('480');
  await dialog.getByRole('spinbutton', { name: 'Export height' }).fill('320');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Retry PNG export' }).click();
  await downloadPromise;
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});
