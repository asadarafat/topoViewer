import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import {
  activateStudioPaletteTemplate,
  openStudioWorkspace
} from '../support/workbench';
import { invokeStudioHeaderAction } from '../support/headerActions';

test('fits the authoring viewport and preserves selection after presentation mode', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  await node.click();
  await expect(node).toHaveClass(/selected/);
  const viewport = page.locator('.react-flow__viewport');
  await page.getByRole('button', { name: 'Fit View' }).click();
  await page.waitForTimeout(300);
  const fittedTransform = await viewport.getAttribute('style');
  await page.getByRole('button', { name: 'Zoom In' }).click();
  await expect(viewport).not.toHaveAttribute('style', fittedTransform || '');

  await invokeStudioHeaderAction(page, 'Presentation mode');
  await expect(page.locator('.studio-shell')).toHaveClass(/studio-shell--presentation/);
  await expect(node).toHaveClass(/selected/);
  const presentationControls = page.locator('.topoviewer-reactflow-controls');
  const exitPresentation = presentationControls.getByRole('button', { name: 'Exit presentation mode' });
  await expect(exitPresentation).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exit presentation mode' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Zoom In' }).click();
  await expect(node).toHaveClass(/selected/);

  await exitPresentation.click();
  await expect(page.locator('.studio-shell')).not.toHaveClass(/studio-shell--presentation/);
  await page.waitForTimeout(300);
  const exitFittedTransform = await viewport.getAttribute('style');
  expect(exitFittedTransform).toBeTruthy();
  await page.getByRole('button', { name: 'Zoom In' }).click();
  await expect(viewport).not.toHaveAttribute('style', exitFittedTransform || '');
  await page.getByRole('button', { name: 'Fit View' }).click();
  await expect(viewport).toHaveAttribute('style', exitFittedTransform || '');
  await expect(node).toHaveClass(/selected/);
});

test('keeps presentation exit in the viewport toolbar when navigation controls are hidden', async ({ page }) => {
  await page.goto('/');
  const viewportWorkspace = await openStudioWorkspace(page, 'Properties');
  await viewportWorkspace.getByRole('button', { name: 'Advanced viewport' }).click();
  await viewportWorkspace.getByRole('switch', { name: /Viewport controls/ }).uncheck();

  await invokeStudioHeaderAction(page, 'Presentation mode');
  const presentationControls = page.locator('.topoviewer-reactflow-controls');
  await expect(presentationControls.getByRole('button', { name: 'Zoom In' })).toHaveCount(0);
  await expect(presentationControls.getByRole('button', { name: 'Fit View' })).toHaveCount(0);
  await expect(presentationControls.getByRole('button', { name: 'Exit presentation mode' })).toBeVisible();
});

test('exports bounded PNG and SVG images from the current canvas', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export project' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('spinbutton', { name: 'Export width' }).fill('480');
  await dialog.getByRole('spinbutton', { name: 'Export height' }).fill('320');

  const pngDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export PNG' }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toMatch(/\.png$/);
  const pngBytes = await readFile((await png.path()) as string);
  expect([...pngBytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  await expect(dialog.getByRole('alert')).toContainText(/exported/);

  await dialog.getByRole('button', { name: 'SVG' }).click();
  await dialog.getByRole('spinbutton', { name: 'Export width' }).fill('1500');
  await dialog.getByRole('spinbutton', { name: 'Export height' }).fill('968');
  const svgDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export SVG' }).click();
  const svg = await svgDownload;
  expect(svg.suggestedFilename()).toMatch(/\.svg$/);
  const svgText = await readFile((await svg.path()) as string, 'utf8');
  expect(svgText).toMatch(/<svg[\s>]/);
  expect(Buffer.byteLength(svgText)).toBeLessThan(25 * 1024 * 1024);
});

test('copies canonical snippets and downloads a deployable documentation bundle', async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export project' });
  await dialog.getByRole('tab', { name: 'Documentation' }).click();

  await dialog.getByRole('button', { name: 'Copy MkDocs snippet' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('```topoviewer\ntopology: topology.yaml');
  await expect(dialog.getByRole('alert')).toContainText('MkDocs snippet copied');
  const bundleDownload = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export documentation bundle' }).click();
  const bundle = await bundleDownload;
  expect(bundle.suggestedFilename()).toMatch(/\.mkdocs\.docs\.zip$/);
  expect((await readFile((await bundle.path()) as string)).subarray(0, 2).toString()).toBe('PK');

  await dialog.getByRole('button', { name: 'Static HTML' }).click();
  await dialog.getByRole('button', { name: 'Copy static HTML snippet' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('data-stylesheet="stylesheet.yaml"');
});

test('validates and exports the canonical Grafana mounted-bundle layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open export panel' }).click();
  let dialog = page.getByRole('dialog', { name: 'Export project' });
  await dialog.getByRole('tab', { name: 'Grafana' }).click();
  await expect(dialog.getByRole('alert')).toContainText('requires mapper YAML');
  await dialog.getByRole('button', { name: 'Configure mapper' }).click();

  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await page.getByRole('button', { name: 'Collapse workspace panel' }).click();
  await page.getByRole('button', { name: 'Open export panel' }).click();
  dialog = page.getByRole('dialog', { name: 'Export project' });
  await dialog.getByRole('tab', { name: 'Grafana' }).click();
  await expect(dialog.getByRole('alert')).toContainText('ready for mounted-file deployment');
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export Grafana bundle' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.grafana\.zip$/);
  const bytes = await readFile((await download.path()) as string);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
});

test('contains export failure and retries without clearing dirty project state', async ({ page }) => {
  await page.goto('/');
  await activateStudioPaletteTemplate(page, 'router');
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
  await dialog.getByRole('button', { name: 'Export PNG' }).click();
  await downloadPromise;
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
});
