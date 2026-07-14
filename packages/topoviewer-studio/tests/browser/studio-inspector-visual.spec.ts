import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { selectStudioOption } from '../support/mui';
import { editStyleAttribute, openStyleWorkspace } from '../support/styleMatrix';
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
  if (await group.getAttribute('aria-expanded') !== 'true') await group.click();
}

test('captures generated style groups for authored object families', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  const palette = await openStudioWorkspace(page, 'Objects');
  await palette.getByTestId('palette-router').click();
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await objectProperties.getByRole('button', { name: 'Advanced' }).click();
  let inspector = await openStyleWorkspace(page);
  await editStyleAttribute(inspector, 'Shape');
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await capture(inspector, 'node');
  await expect(inspector.getByRole('menu')).toHaveCount(0);

  await selectStudioOption(page, inspector.getByRole('combobox', { name: 'Shape' }), 'roundRectangle');
  await editStyleAttribute(inspector, 'Node layout');
  const cardLayout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(cardLayout).toBeVisible();
  await cardLayout.scrollIntoViewIfNeeded();
  await capture(inspector, 'card-layout');

  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-router').click();
  await selectNodes(page, ['router-1', 'router-2']);
  await page.getByTestId('studio-canvas').focus();
  await page.keyboard.press('l');
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('link-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'link');

  const search = inspector.getByRole('searchbox', { name: 'Search style fields' });
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
  await (await openStudioWorkspace(page, 'Objects')).getByTestId('palette-path').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('path-1');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'path');

  await openStudioWorkspace(page, 'Objects');
  await expandPaletteGroup(page, 'Annotations');
  await page.getByTestId('palette-region').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('New Region');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'region');
  await openStudioWorkspace(page, 'Objects');
  await page.getByTestId('palette-shape').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('New Shape');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'shape');
  await openStudioWorkspace(page, 'Objects');
  await page.getByTestId('palette-callout').click();
  await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('New Callout');
  inspector = await openStyleWorkspace(page);
  await capture(inspector, 'callout');

  await page.locator('.react-flow__pane').click({ position: { x: 500, y: 560 } });
  const viewport = await openStudioWorkspace(page, 'Viewport');
  await capture(viewport, 'viewport-after-pane-selection');
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await capture(page.getByRole('dialog', { name: 'Layers' }), 'layers');
});

test('captures link-direction style groups from directional telemetry lanes', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const direction = page.locator('.topoviewer-edge-direction-hit-target[data-direction="sourceToTarget"]');
  await expect(direction).toHaveCount(1);
  await selectCanvasTarget(page, direction, 'linkDirection 10 Gbps selected');
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await objectProperties.getByRole('button', { name: 'Advanced' }).click();
  await expect(objectProperties.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('spine-leaf:sourceToTarget');
  const inspector = await openStyleWorkspace(page);
  await expect(inspector.getByRole('button', { name: /View More/ })).toBeVisible();
  await capture(inspector, 'link-direction');
});

test('keeps the style attribute matrix inside desktop and narrow inspectors', async ({ page }) => {
  const cascadeArtifacts = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/style-cascade');
  await mkdir(cascadeArtifacts, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  let inspector = await openStyleWorkspace(page);
  const matrix = inspector.getByRole('table', { name: 'Style attributes' });
  await expect(matrix).toBeVisible();
  expect(await inspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await inspector.screenshot({ path: path.join(cascadeArtifacts, 'matrix-object-desktop.png') });

  const backgroundRow = matrix.getByRole('row', { name: /Background color/ });
  await backgroundRow.getByRole('button', { name: 'Edit This object Background color' }).click();
  const background = inspector.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await background.fill('#123456');
  await background.press('Enter');
  await inspector.screenshot({ path: path.join(cascadeArtifacts, 'matrix-object-edited-desktop.png') });

  await page.locator('.react-flow__pane').click({ position: { x: 80, y: 80 } });
  const viewport = await openStudioWorkspace(page, 'Viewport');
  await expect(inspector).toBeHidden();
  await viewport.screenshot({ path: path.join(cascadeArtifacts, 'viewport-after-pane-selection-desktop.png') });

  await page.setViewportSize({ width: 900, height: 768 });
  await page.reload();
  await page.locator('.react-flow__node[data-id="leaf1"]').click();
  const narrowInspector = await openStyleWorkspace(page);
  expect(await narrowInspector.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await narrowInspector.screenshot({ path: path.join(cascadeArtifacts, 'matrix-narrow.png') });
});
