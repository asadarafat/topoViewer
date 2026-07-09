import { expect, type Locator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YamlAuthoringDocument } from '../src/webview/webviewYamlAuthoring';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

export type YamlCompletion = {
  detail?: string;
  documentation?: string;
  insertText?: string;
  label: string;
};

export type StyleValueDataType = 'text' | 'enum' | 'boolean' | 'integer' | 'number' | 'color' | 'object';

export type HarnessStyleMetadata = {
  optionsByKind: Record<string, Array<{ key: string; label: string }>>;
  valueTypesByKind: Record<string, Record<string, { dataType: StyleValueDataType; options?: string[] }>>;
};

function currentGitSha() {
  return execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
}

async function getMarkerWithRetry(page: Page) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await page.request.get('/__topoviewer-test-marker.json', { timeout: 5000 });
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(200 * (attempt + 1));
    }
  }

  throw lastError;
}

export async function expectCurrentHarnessServer(page: Page) {
  const response = await getMarkerWithRetry(page);
  expect(response.ok(), 'served harness should expose the TopoViewer test marker').toBe(true);
  const marker = await response.json();
  expect(marker).toEqual({
    package: 'vscode-topoviewer-harness',
    gitSha: currentGitSha()
  });
}

export async function topologyText(page: Page) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessDraft?.topologyText || !!(window as any).__topoviewerHarnessState?.topologyText || !!(window as any).monaco?.editor?.getModels?.()[0]);
  return page.evaluate(() => {
    const draft = (window as any).__topoviewerHarnessDraft;
    if (draft?.topologyText) return draft.topologyText as string;
    const harnessState = (window as any).__topoviewerHarnessState;
    if (harnessState?.topologyText) return harnessState.topologyText as string;
    const models = (window as any).monaco.editor.getModels();
    const topologyModel = models.find((model: { getValue: () => string }) => model.getValue().includes('graph:'));
    return (topologyModel || models[0]).getValue() as string;
  });
}

export async function stylesheetText(page: Page) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessDraft?.stylesheetText || !!(window as any).__topoviewerHarnessState?.stylesheetText);
  return page.evaluate(() => ((window as any).__topoviewerHarnessDraft?.stylesheetText || (window as any).__topoviewerHarnessState.stylesheetText) as string);
}

export async function mapperText(page: Page) {
  await page.waitForFunction(() => (window as any).__topoviewerHarnessDraft?.mapperText !== undefined || (window as any).__topoviewerHarnessState?.mapperText !== undefined);
  return page.evaluate(() => ((window as any).__topoviewerHarnessDraft?.mapperText ?? (window as any).__topoviewerHarnessState.mapperText) as string);
}

export async function setTopologyText(page: Page, text: string) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessEditor?.setValue);
  await page.evaluate((value) => {
    (window as any).__topoviewerHarnessEditor.setValue(value);
  }, text);
  await page.waitForFunction((value) => (window as any).__topoviewerHarnessDraft?.topologyText === value, text);
}

export async function setMapperText(page: Page, text: string) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessEditor?.setValue);
  await page.evaluate((value) => {
    (window as any).__topoviewerHarnessEditor.setValue(value);
  }, text);
  await page.waitForFunction((value) => (window as any).__topoviewerHarnessDraft?.mapperText === value, text);
}

export async function yamlCompletions(
  page: Page,
  request: { document: YamlAuthoringDocument; text: string; lineNumber: number; column: number }
) {
  await page.waitForFunction(() => !!(window as any).__topoviewerYamlIntelligence?.completions);
  return page.evaluate((completionRequest) => (
    (window as any).__topoviewerYamlIntelligence.completions(completionRequest) as YamlCompletion[]
  ), request);
}

export async function yamlStyleMetadata(page: Page) {
  await page.waitForFunction(() => !!(window as any).__topoviewerYamlIntelligence?.styleMetadata);
  return page.evaluate(() => (
    (window as any).__topoviewerYamlIntelligence.styleMetadata() as HarnessStyleMetadata
  ));
}

export async function yamlHover(
  page: Page,
  request: { document: YamlAuthoringDocument; text: string; lineNumber: number; column: number }
) {
  await page.waitForFunction(() => !!(window as any).__topoviewerYamlIntelligence?.hover);
  return page.evaluate((hoverRequest) => (
    (window as any).__topoviewerYamlIntelligence.hover(hoverRequest) as { contents: string } | undefined
  ), request);
}

export async function yamlShouldOpenHelp(
  page: Page,
  request: { document: YamlAuthoringDocument; text: string; lineNumber: number; column: number }
) {
  await page.waitForFunction(() => !!(window as any).__topoviewerYamlIntelligence?.shouldOpenHelp);
  return page.evaluate((helpRequest) => (
    (window as any).__topoviewerYamlIntelligence.shouldOpenHelp(helpRequest) as boolean
  ), request);
}

export async function focusYamlEditorAt(page: Page, lineNumber: number, column: number) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessEditor?.focusAt);
  await page.evaluate(([line, col]) => {
    (window as any).__topoviewerHarnessEditor.focusAt(line, col);
    (document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement | null)?.focus();
  }, [lineNumber, column]);
}

export async function yamlSuggestionWidgetVisible(page: Page) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessEditor?.suggestionVisible);
  return page.evaluate(() => (window as any).__topoviewerHarnessEditor.suggestionVisible() as boolean);
}

export async function typeYamlEditorText(page: Page, text: string) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessEditor?.typeText);
  await page.evaluate((value) => {
    (window as any).__topoviewerHarnessEditor.typeText(value);
  }, text);
}

export async function chooseOption(page: Page, combobox: Locator, optionName: string) {
  await combobox.click();
  await page.getByRole('option', { name: optionName, exact: true }).click();
}

export async function waitForHarnessReady(page: Page) {
  await expect(page.getByText('No diagnostics')).toBeVisible();
  await page.waitForFunction(() => (window as any).__topoviewerHarnessState?.topologyText?.includes('id: fra-pe'));
  await expect(graphNodeByLabel(page, 'FRA-PE')).toBeVisible();
}

export function graphNodeByLabel(page: Page, label: string) {
  const exact = JSON.stringify(label);
  const prefixed = JSON.stringify(`${label},`);
  return page.locator(`.topoviewer-node[aria-label=${exact}], .topoviewer-node[aria-label^=${prefixed}]`);
}

export async function selectGraphNodes(page: Page, labels: string[]) {
  for (const [index, label] of labels.entries()) {
    await graphNodeByLabel(page, label).click(index === 0 ? undefined : { modifiers: ['Shift'] });
  }
}

export async function selectedPreviewObjectCount(page: Page) {
  return page.locator('.react-flow__node.selected, .react-flow__edge.selected').count();
}

export async function showAllHarnessLayers(page: Page, expectedLayerNames: string[] = []) {
  await page.getByRole('tab', { name: 'Layers', exact: true }).click();
  for (const layerName of expectedLayerNames) {
    await expect(page.getByRole('checkbox', { name: layerName })).toBeVisible();
  }
  const checkboxes = page.locator('.topoviewer-vscode-layers-pane input[type="checkbox"]');
  await expect.poll(() => checkboxes.count()).toBeGreaterThan(0);
  const count = await checkboxes.count();
  for (let index = 0; index < count; index += 1) {
    const checkbox = checkboxes.nth(index);
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }
  }
  for (const layerName of expectedLayerNames) {
    await expect(page.getByRole('checkbox', { name: layerName })).toBeChecked();
  }
  await page.getByRole('tab', { name: 'Build', exact: true }).click();
}

export async function waitForValidatedLayers(page: Page, ids: string[]) {
  await page.waitForFunction((targetIds) => {
    const layers = (window as any).__topoviewerHarnessValidation?.layers;
    if (!Array.isArray(layers)) return false;
    const available = new Set(layers.map((layer: { id?: unknown }) => String(layer.id || '')));
    return (targetIds as string[]).every((id) => available.has(id));
  }, ids);
}

export async function waitForHarnessState(page: Page) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessState?.topologyText);
}

export async function waitForValidatedGraphObject(page: Page, collection: 'links' | 'paths', id: string) {
  await page.waitForFunction(([targetCollection, targetId]) => {
    const graph = (window as any).__topoviewerHarnessValidation?.document?.graph;
    return Array.isArray(graph?.[targetCollection])
      && graph[targetCollection].some((object: { id?: string }) => object.id === targetId);
  }, [collection, id]);
}

export async function waitForValidatedGraphNodes(page: Page, ids: string[]) {
  await page.waitForFunction((targetIds) => {
    const nodes = (window as any).__topoviewerHarnessValidation?.document?.graph?.nodes;
    if (!Array.isArray(nodes)) return false;
    const available = new Set(nodes.map((node: { id?: unknown }) => String(node.id || '')));
    return (targetIds as string[]).every((id) => available.has(id));
  }, ids);
}

export async function placeCanvasNode(
  page: Page,
  options: { expectedId?: string; xFraction?: number; yFraction?: number } = {}
) {
  const {
    expectedId,
    xFraction = 0.5,
    yFraction = 0.5
  } = options;
  const paneBox = await page.locator('.react-flow__pane').boundingBox();
  expect(paneBox).not.toBeNull();
  await page.getByRole('toolbar', { name: 'Canvas authoring tools' }).getByRole('button', { name: 'Node tool' }).click();
  await page.mouse.click(
    paneBox!.x + paneBox!.width * xFraction,
    paneBox!.y + paneBox!.height * yFraction
  );
  if (expectedId) await waitForValidatedGraphNodes(page, [expectedId]);
}

export async function selectHarnessObject(page: Page, kind: 'node' | 'link' | 'path' | 'region' | 'shape' | 'callout', id: string) {
  await page.waitForFunction(() => !!(window as any).__topoviewerHarnessActions?.selectObject);
  await page.evaluate((selection) => {
    (window as any).__topoviewerHarnessActions.selectObject(selection);
  }, { kind, id });
  await expect(page.getByRole('tab', { name: 'Inspect', exact: true })).toHaveAttribute('aria-selected', 'true');
}

export async function revertTemplateState(page: Page) {
  const revert = page.getByRole('button', { name: /^(Revert template|Remove saved)$/ });
  if (!(await revert.isVisible())) return;
  await revert.click();
  await waitForHarnessState(page);
  await expect(page.getByText('No diagnostics')).toBeVisible();
}

export function nodePosition(text: string, id: string): { x: number; y: number } | undefined {
  const start = text.indexOf(`id: ${id}`);
  if (start === -1) return undefined;
  const rest = text.slice(start);
  const nextObject = rest.search(/\n\s+- id: /);
  const block = nextObject === -1 ? rest : rest.slice(0, nextObject);
  const tuple = block.match(/position:\s*\[?([0-9.-]+),\s*([0-9.-]+)\]?/);
  if (tuple?.[1] && tuple?.[2]) return { x: Number(tuple[1]), y: Number(tuple[2]) };
  const list = block.match(/position:\s*\n\s*-\s*([0-9.-]+)\s*\n\s*-\s*([0-9.-]+)/);
  if (list) return { x: Number(list[1]), y: Number(list[2]) };
  const object = block.match(/position:\s*\n\s*x:\s*([0-9.-]+)\s*\n\s*y:\s*([0-9.-]+)/);
  if (object) return { x: Number(object[1]), y: Number(object[2]) };
  return undefined;
}

export function yamlObjectBlock(text: string, id: string) {
  const start = text.indexOf(`id: ${id}`);
  if (start === -1) return '';
  const rest = text.slice(start);
  const nextObject = rest.slice(1).search(/\n\s+- id: /);
  return nextObject === -1 ? rest : rest.slice(0, nextObject + 1);
}

export async function railWidth(page: Page) {
  const box = await page.locator('.topoviewer-vscode-rail').boundingBox();
  expect(box).not.toBeNull();
  return box!.width;
}

export async function panelOverflowIssues(panel: Locator) {
  return panel.evaluate((pane) => {
    const scroll = pane.querySelector('.topoviewer-vscode-mode-pane-scroll') || pane;
    const bounds = scroll.getBoundingClientRect();
    const candidates = Array.from(pane.querySelectorAll([
      '.topoviewer-vscode-key-value-row',
      '.MuiFormControl-root',
      '.MuiTextField-root',
      '.MuiInputBase-root',
      '.MuiButton-root',
      '.MuiChip-root'
    ].join(',')));

    return candidates.flatMap((candidate) => {
      if (candidate.closest('.monaco-editor')) return [];
      const rect = candidate.getBoundingClientRect();
      const style = window.getComputedStyle(candidate);
      if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden') return [];
      const intersectsViewport = rect.bottom > bounds.top && rect.top < bounds.bottom;
      if (!intersectsViewport) return [];
      const failures: string[] = [];
      if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) {
        const label = candidate.getAttribute('aria-label') || candidate.textContent?.trim() || candidate.className.toString();
        failures.push(`horizontal overflow: ${label}`);
      }
      if (rect.top < bounds.top - 1) {
        const label = candidate.getAttribute('aria-label') || candidate.textContent?.trim() || candidate.className.toString();
        failures.push(`top clipped: ${label}`);
      }
      return failures;
    });
  });
}

export async function expectActivePanelBeforePreview(page: Page, panelSelector: string) {
  const panelBox = await page.locator(panelSelector).boundingBox();
  const previewBox = await page.locator('.topoviewer-vscode-preview').boundingBox();
  expect(panelBox).not.toBeNull();
  expect(previewBox).not.toBeNull();
  expect(panelBox!.height).toBeGreaterThan(80);
  expect(previewBox!.y).toBeGreaterThan(panelBox!.y + panelBox!.height - 1);
}

export async function expectSameVisualRow(row: Locator, controls: Locator[]) {
  const rowBox = await row.boundingBox();
  expect(rowBox).not.toBeNull();
  const centers = [];
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    centers.push(box!.y + box!.height / 2);
  }
  const minCenter = Math.min(...centers);
  const maxCenter = Math.max(...centers);
  expect(maxCenter - minCenter).toBeLessThan(rowBox!.height / 2);
}
