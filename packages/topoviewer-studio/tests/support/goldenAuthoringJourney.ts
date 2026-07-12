import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { compileTopoGraph, composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import { parse } from 'yaml';
import { decodeStudioProjectArchive } from '../../src/archive/projectArchive';

export interface GoldenAuthoringJourneyOptions {
  hostLabel: 'Browser project' | 'VS Code workspace';
  url: string;
}

async function openPaletteWhenCollapsed(page: Page) {
  const palette = page.getByRole('complementary', { name: 'Object palette' });
  if (!await palette.isVisible()) await page.getByRole('button', { name: 'Open object palette' }).click();
}

async function openPropertiesWhenCollapsed(page: Page) {
  const properties = page.getByRole('complementary', { name: 'Properties' });
  if (!await properties.isVisible()) await page.getByRole('button', { name: 'Open properties' }).click();
  return properties;
}

export async function runGoldenAuthoringJourney(page: Page, options: GoldenAuthoringJourneyOptions) {
  const startup = Date.now();
  await page.goto(options.url);
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  const startupMs = Date.now() - startup;
  await expect(page.getByText(options.hostLabel, { exact: true })).toBeVisible();

  await openPaletteWhenCollapsed(page);
  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  const closePalette = page.getByRole('button', { name: 'Close object palette' });
  if (await closePalette.isVisible()) await closePalette.click();

  const firstNode = page.locator('.react-flow__node[data-id="node-1"]');
  const secondNode = page.locator('.react-flow__node[data-id="node-2"]');
  await firstNode.click();
  const browserName = page.context().browser()?.browserType().name();
  await secondNode.click({ modifiers: [browserName === 'webkit' ? 'Meta' : 'Control'] });
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await firstNode.click();
  const properties = await openPropertiesWhenCollapsed(page);
  await properties.getByRole('tab', { name: 'Style' }).click();
  await properties.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');
  await properties.getByRole('tab', { name: 'All' }).click();
  await properties.getByRole('searchbox', { name: 'Search style fields' }).fill('outline width');
  const outline = properties.getByRole('spinbutton', { name: 'Outline width' });
  await outline.fill('5');
  await outline.press('Enter');
  const closeProperties = page.getByRole('button', { name: 'Close properties' });
  if (await closeProperties.isVisible()) await closeProperties.click();

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const mapper = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await mapper.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expect(mapper.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');
  await mapper.getByRole('button', { name: 'Close', exact: true }).click();

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  const editor = drawer.getByLabel('topology YAML editor');
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await drawer.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await drawer.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await drawer.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Redo' }).click();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await page.getByRole('button', { name: 'Reload project' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  return { startupMs };
}

export async function exportGoldenArchive(page: Page) {
  await page.getByRole('button', { name: 'Project menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Project menu' });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    menu.getByRole('button', { name: 'Export archive' }).click()
  ]);
  const archivePath = await download.path();
  if (!archivePath) throw new Error('Golden journey archive download has no local path.');
  return archivePath;
}

export async function expectGoldenArchiveRenders(archivePath: string) {
  return expectGoldenArchiveBytesRender(new Uint8Array(await readFile(archivePath)));
}

export function expectGoldenArchiveBytesRender(bytes: Uint8Array) {
  const archive = decodeStudioProjectArchive(bytes);
  const document = composeTopoViewerDocument(
    parse(archive.project.documents.topology.text) as TopoDocument,
    parse(archive.project.documents.stylesheet.text) as TopoDocument
  );
  const graph = compileTopoGraph(document);
  expect(graph.nodes.map((node) => node.id).sort()).toEqual(['node-1', 'node-2']);
  expect(graph.edges.map((edge) => edge.id)).toContain('link-1');
  expect(archive.project.documents.mapper?.text).toContain('node_health');
}

export async function reimportGoldenArchive(page: Page, archivePath: string) {
  await page.getByRole('button', { name: 'Project menu' }).click();
  let menu = page.getByRole('dialog', { name: 'Project menu' });
  await menu.getByRole('button', { name: 'New' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(0);

  await page.getByRole('button', { name: 'Project menu' }).click();
  menu = page.getByRole('dialog', { name: 'Project menu' });
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    menu.getByRole('button', { name: 'Open archive' }).click()
  ]);
  await chooser.setFiles(archivePath);
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
}
