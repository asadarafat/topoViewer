import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { selectStudioOption } from '../support/mui';
import { editStyleAttribute, openStyleWorkspace } from '../support/basicStyle';
import { openStudioWorkspace } from '../support/workspaceRail';

const artifactDirectory = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/phase-9');

async function capture(locator: Locator, name: string) {
  await mkdir(artifactDirectory, { recursive: true });
  await locator.screenshot({ path: path.join(artifactDirectory, `${name}.png`) });
}

async function selectNodes(page: Page, ids: string[]) {
  for (const [index, id] of ids.entries()) {
    await page.locator(`.react-flow__node[data-id="${id}"]`).click({
      modifiers: index === 0 ? [] : ['Control']
    });
  }
}

async function expandPaletteGroup(page: Page, name: string) {
  const group = page.getByRole('button', { name: `${name} palette group` });
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
}

async function openStylesheetYaml(workspace: Locator) {
  await workspace.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' }).click();
  await workspace.getByRole('tablist', { name: 'Code documents' }).getByRole('tab', { name: 'stylesheet.yaml' }).click();
  await expect(workspace.getByLabel('stylesheet YAML editor')).toBeVisible();
}

test('captures generated style groups for authored object families', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const palette = await openStudioWorkspace(page, 'Add');
  await palette.getByTestId('palette-router').click();
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Object ID' })).toHaveValue('router-1');
  let inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await capture(inspector, 'node');
  await expect(inspector.getByRole('menu')).toHaveCount(0);

  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');
  await editStyleAttribute(inspector, 'Node layout');
  const cardLayout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(cardLayout).toBeVisible();
  await selectStudioOption(page, cardLayout.getByRole('combobox', { name: 'Layout type' }), 'card');
  await cardLayout.scrollIntoViewIfNeeded();
  await capture(inspector, 'card-layout');

  await (await openStudioWorkspace(page, 'Add')).getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Object ID' })).toHaveValue('link-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'link');

  const search = inspector.getByRole('searchbox', { name: 'Search style attributes' });
  await search.fill('source label');
  await editStyleAttribute(inspector, 'Source label');
  const sourceLabel = inspector.getByRole('textbox', { name: 'Source label', exact: true });
  await sourceLabel.fill('e1-1');
  await sourceLabel.press('Enter');
  await search.fill('target label');
  await editStyleAttribute(inspector, 'Target label');
  const targetLabel = inspector.getByRole('textbox', { name: 'Target label', exact: true });
  await targetLabel.fill('e1-49');
  await targetLabel.press('Enter');
  await search.fill('endpoint label');
  await capture(inspector, 'endpoint-labels');

  await search.fill('');
  await selectNodes(page, ['router-1', 'router-2']);
  await (await openStudioWorkspace(page, 'Add')).getByTestId('palette-path').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Object ID' })).toHaveValue('path-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'path');

  await openStudioWorkspace(page, 'Add');
  await expandPaletteGroup(page, 'Annotations');
  await page.getByTestId('palette-region').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Visible label', exact: true })).toHaveValue('region-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'region');
  await openStudioWorkspace(page, 'Add');
  await page.getByTestId('palette-shape').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Visible label', exact: true })).toHaveValue('shape-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'shape');
  await openStudioWorkspace(page, 'Add');
  await page.getByTestId('palette-callout').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('New Callout');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'callout');

  await page.locator('.react-flow__pane').click({ position: { x: 250, y: 150 } });
  const viewport = await openStudioWorkspace(page, 'Properties');
  await capture(viewport, 'viewport-after-pane-selection');
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await capture(page.getByRole('dialog', { name: 'Layers' }), 'layers');
});

test('captures link-direction style groups from directional telemetry lanes', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const direction = page.locator('.topoviewer-edge-direction-hit-target[data-direction="sourceToTarget"]');
  await expect(direction).toHaveCount(1);
  await selectCanvasTarget(page, direction, 'linkDirection spine-leaf:sourceToTarget selected');
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Object ID' })).toHaveValue('spine-leaf:sourceToTarget');
  const inspector = await openStyleWorkspace(page);
  await expect(inspector.locator('.studio-basic-style-field').first()).toBeVisible();
  await capture(inspector, 'link-direction');
});

test('keeps the Visual and Code style workspace inside desktop and narrow panels', async ({ page }) => {
  const cascadeArtifacts = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/style-cascade');
  await mkdir(cascadeArtifacts, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  let inspector = await openStyleWorkspace(page);
  await expect(inspector.locator('.studio-basic-style-editor')).toBeVisible();
  expect(await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await inspector.screenshot({ path: path.join(cascadeArtifacts, 'basic-object-desktop.png') });

  await editStyleAttribute(inspector, 'Background color');
  const background = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await inspector.screenshot({ path: path.join(cascadeArtifacts, 'basic-object-edited-desktop.png') });

  await openStylesheetYaml(inspector);
  expect(await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await inspector.screenshot({ path: path.join(cascadeArtifacts, 'yaml-object-desktop.png') });
  const viewportBeforeResize = await page.locator('.react-flow__viewport').getAttribute('style');

  await page.setViewportSize({ width: 900, height: 768 });
  const narrowInspector = await openStyleWorkspace(page);
  await expect(narrowInspector.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  await expect(narrowInspector.getByLabel('stylesheet YAML editor')).toBeVisible();
  expect(await narrowInspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.react-flow__node[data-id="leaf1"]')).toHaveClass(/selected/);
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', viewportBeforeResize || '');
  await narrowInspector.screenshot({ path: path.join(cascadeArtifacts, 'yaml-narrow.png') });

  await narrowInspector.getByRole('group', { name: 'Properties representation' }).getByRole('button', { name: 'Visual' }).click();
  await expect(narrowInspector.locator('.studio-basic-style-editor')).toBeVisible();
  await narrowInspector.screenshot({ path: path.join(cascadeArtifacts, 'basic-narrow.png') });

  await page.getByTestId('studio-canvas').click({ position: { x: 20, y: 20 } });
  const viewport = await openStudioWorkspace(page, 'Properties');
  await expect(narrowInspector).toBeVisible();
  await expect(viewport.getByLabel('Viewport settings')).toBeVisible();
  await expect(viewport.getByLabel('stylesheet YAML editor')).toHaveCount(0);
  await viewport.screenshot({ path: path.join(cascadeArtifacts, 'viewport-after-pane-selection-narrow.png') });
});
