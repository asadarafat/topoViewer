import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';

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

test('captures generated style groups for authored object families', async ({ page }) => {
  await page.goto('/');
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await page.getByTestId('palette-node').click();
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await expect(inspector.getByRole('combobox', { name: 'Shape' })).toBeVisible();
  await capture(inspector, 'node');
  await inspector.locator('[data-field-path="shape"]').getByRole('button', { name: 'Shape actions' }).click();
  await capture(inspector, 'field-actions');
  await page.keyboard.press('Escape');

  await inspector.getByRole('combobox', { name: 'Shape' }).selectOption('roundRectangle');
  const cardLayout = inspector.locator('[data-specialized-editor="node-layout"]');
  await expect(cardLayout).toBeVisible();
  await cardLayout.scrollIntoViewIfNeeded();
  await capture(inspector, 'card-layout');

  await page.getByTestId('palette-node').click();
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('link-1');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await capture(inspector, 'link');

  await inspector.getByRole('tab', { name: 'All' }).click();
  const search = inspector.getByRole('searchbox', { name: 'Search style fields' });
  await search.fill('source label');
  const sourceLabel = inspector.getByRole('textbox', { name: 'Source label', exact: true });
  await sourceLabel.fill('e1-1');
  await sourceLabel.press('Enter');
  await search.fill('target label');
  const targetLabel = inspector.getByRole('textbox', { name: 'Target label', exact: true });
  await targetLabel.fill('e1-49');
  await targetLabel.press('Enter');
  await search.fill('endpoint label');
  await capture(inspector, 'endpoint-labels');

  await search.fill('');
  await selectNodes(page, ['node-1', 'node-2']);
  await page.getByTestId('palette-path').click();
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('path-1');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await capture(inspector, 'path');

  await page.getByTestId('palette-region').click();
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('New Region');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await capture(inspector, 'region');
  await page.getByTestId('palette-shape').click();
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('New Shape');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await capture(inspector, 'shape');
  await page.getByTestId('palette-callout').click();
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('New Callout');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await capture(inspector, 'callout');

  await page.getByTestId('studio-canvas').click({ position: { x: 700, y: 600 } });
  await capture(inspector, 'graph-no-selection');
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await capture(page.getByRole('dialog', { name: 'Layers' }), 'layers');
  await page.getByRole('button', { name: 'Viewport settings' }).click();
  await capture(page.getByRole('dialog', { name: 'Viewport settings' }), 'overlays');
});

test('captures link-direction style groups from directional telemetry lanes', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  const direction = page.locator('.topoviewer-edge-direction-hit-target[data-direction="sourceToTarget"]');
  await expect(direction).toHaveCount(1);
  await direction.dispatchEvent('click');
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Topology' }).click();
  await expect(inspector.getByRole('textbox', { name: 'ID', exact: true })).toHaveValue('spine-leaf:sourceToTarget');
  await inspector.getByRole('tab', { name: 'Styles' }).click();
  await expect(inspector.getByRole('tab', { name: 'All' })).toBeVisible();
  await capture(inspector, 'link-direction');
});
