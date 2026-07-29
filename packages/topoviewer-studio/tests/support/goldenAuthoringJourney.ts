import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { compileTopoGraph, composeTopoViewerDocument, type TopoDocument } from 'topoviewer';
import { parse } from 'yaml';
import { decodeStudioProjectArchive } from '../../src/archive/projectArchive';
import { editStyleAttribute, openStyleWorkspace } from './basicStyle';
import { selectStudioOption } from './mui';
import { activateStudioPaletteTemplate, openPropertiesCodeDocument, openStudioWorkspace } from './workspaceRail';
import { invokeStudioHeaderAction } from './headerActions';

export interface GoldenAuthoringJourneyOptions {
  hostLabel: string;
  url: string;
}

function topologyNodePosition(text: string, id: string): [number, number] {
  const document = parse(text) as TopoDocument;
  const position = document.graph?.nodes?.find((node) => node.id === id)?.position;
  if (!Array.isArray(position) || position.length !== 2) {
    throw new Error(`Golden journey node "${id}" does not have a tuple position.`);
  }
  return [Number(position[0]), Number(position[1])];
}

async function renderedNodePosition(page: Page, id: string): Promise<[number, number]> {
  const transform = await page.locator(`.react-flow__node[data-id="${id}"]`).evaluate((element) => (
    (element as HTMLElement).style.transform
  ));
  const match = transform.match(/translate\(\s*(-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\s*\)/);
  if (!match) throw new Error(`Golden journey node "${id}" has an unreadable transform: ${transform}`);
  return [Number(match[1]), Number(match[2])];
}

async function dragNodeBy(page: Page, id: string, delta: { x: number; y: number }) {
  const node = page.locator(`.react-flow__node[data-id="${id}"]`);
  const dragSurface = node.locator('.topoviewer-node-icon');
  const box = await dragSurface.boundingBox();
  if (!box) throw new Error(`Golden journey node "${id}" is not measurable.`);
  const before = await renderedNodePosition(page, id);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + delta.x, box.y + box.height / 2 + delta.y, { steps: 12 });
  await page.mouse.up();
  await expect.poll(() => renderedNodePosition(page, id)).not.toEqual(before);
  return renderedNodePosition(page, id);
}

export async function openProjectManager(page: Page) {
  const manager = page.getByRole('dialog', { name: 'Projects' });
  if (!await manager.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Project menu' }).click();
  }
  await expect(manager).toBeVisible();
  return manager;
}

export async function openCurrentProjectActions(page: Page) {
  const manager = await openProjectManager(page);
  const currentProject = manager.getByRole('listitem').filter({ hasText: 'Current' });
  await currentProject.getByRole('button', { name: /^Actions for / }).click();
  return page.getByRole('menu', { name: / project actions$/ });
}

export async function runGoldenAuthoringJourney(page: Page, options: GoldenAuthoringJourneyOptions) {
  const startup = Date.now();
  await page.goto(options.url);
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  const startupMs = Date.now() - startup;
  await expect(page.getByText(options.hostLabel, { exact: true })).toBeVisible();

  const projectMenu = await openProjectManager(page);
  const newProject = projectMenu.getByRole('button', { name: 'New project' });
  if (await newProject.isVisible().catch(() => false)) {
    await newProject.click();
  } else {
    await page.keyboard.press('Escape');
    await expect(projectMenu).toBeHidden();
  }
  await expect(page.locator('.react-flow__node')).toHaveCount(0);

  await activateStudioPaletteTemplate(page, 'router');
  await activateStudioPaletteTemplate(page, 'router');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  if ((page.viewportSize()?.width || Number.POSITIVE_INFINITY) < 900) {
    await (await openStudioWorkspace(page, 'Properties')).getByRole('button', { name: 'Collapse workspace panel' }).click();
  }
  const firstNode = page.locator('.react-flow__node[data-id="router-1"]');
  const secondNode = page.locator('.react-flow__node[data-id="router-2"]');
  const releasedPosition = await dragNodeBy(page, 'router-1', { x: 96, y: 64 });
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await firstNode.click();
  const browserName = page.context().browser()?.browserType().name();
  await secondNode.click({ modifiers: [browserName === 'webkit' ? 'Meta' : 'Control'] });
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await firstNode.click();
  const properties = await openStyleWorkspace(page);
  await editStyleAttribute(properties, 'Shape');
  await expect(properties.getByRole('combobox', { name: 'Shape' })).toBeEnabled();
  await selectStudioOption(page, properties.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');
  await properties.getByRole('button', { name: 'Apply' }).click();
  await expect(properties.locator('.studio-style-candidate-footer')).toHaveCount(0);
  const mapper = await openStudioWorkspace(page, 'Mapper');
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expect(mapper.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');
  await mapper.getByRole('button', { name: 'Collapse workspace panel' }).click();

  const edit = await openPropertiesCodeDocument(page, 'topology');
  const authoredPosition = topologyNodePosition(
    await edit.getByLabel('topology YAML editor').inputValue(),
    'router-1'
  );
  expect(authoredPosition[0]).toBeCloseTo(releasedPosition[0], 0);
  expect(authoredPosition[1]).toBeCloseTo(releasedPosition[1], 0);
  await edit.locator('.monaco-editor').click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('graph:\n  nodes: [');
  await edit.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await edit.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');
  await edit.getByRole('button', { name: 'Collapse workspace panel' }).click();

  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Redo' }).click();
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Saved');
  await invokeStudioHeaderAction(page, 'Reload project');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
  const reloadedEdit = await openPropertiesCodeDocument(page, 'topology');
  expect(topologyNodePosition(
    await reloadedEdit.getByLabel('topology YAML editor').inputValue(),
    'router-1'
  )).toEqual(authoredPosition);
  return { startupMs };
}

export async function exportGoldenArchive(page: Page) {
  const projectActions = await openCurrentProjectActions(page);
  const [download] = await Promise.all([page.waitForEvent('download'), projectActions.getByRole('menuitem', { name: 'Export archive' }).click()]);
  const archivePath = await download.path();
  if (!archivePath) throw new Error('Golden journey archive download has no local path.');
  return archivePath;
}

export async function expectGoldenArchiveRenders(archivePath: string) {
  return expectGoldenArchiveBytesRender(new Uint8Array(await readFile(archivePath)));
}

export async function readStudioProjectArchive(archivePath: string) {
  return decodeStudioProjectArchive(new Uint8Array(await readFile(archivePath)));
}

export function expectGoldenArchiveBytesRender(bytes: Uint8Array) {
  const archive = decodeStudioProjectArchive(bytes);
  const document = composeTopoViewerDocument(parse(archive.project.documents.topology.text) as TopoDocument, parse(archive.project.documents.stylesheet.text) as TopoDocument);
  const graph = compileTopoGraph(document);
  expect(graph.nodes.map((node) => node.id).sort()).toEqual(['router-1', 'router-2']);
  expect(graph.edges.map((edge) => edge.id)).toContain('link-1');
  expect(archive.project.documents.mapper?.text).toContain('node_health');
}

export async function reimportGoldenArchive(page: Page, archivePath: string) {
  let menu = await openProjectManager(page);
  await menu.getByRole('button', { name: 'New project' }).click();
  await expect(page.locator('.react-flow__node')).toHaveCount(0);

  menu = await openProjectManager(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), menu.getByRole('button', { name: 'Open archive' }).click()]);
  await chooser.setFiles(archivePath);
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);
}
