import { expect, test } from '@playwright/test';

test('runs the Studio golden authoring journey through the VS Code host protocol', async ({ page }) => {
  const startup = Date.now();
  await page.goto('./');
  await expect(page.getByRole('region', { name: 'Topology canvas' })).toBeVisible();
  expect(Date.now() - startup).toBeLessThan(5_000);
  await expect(page.getByText('VS Code workspace', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Project menu' }).click();
  const projectMenu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(projectMenu.getByText('VS Code bundle')).toBeVisible();
  await expect(projectMenu.getByRole('button', { name: 'New' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Project menu' }).click();

  await page.getByTestId('palette-node').click();
  await page.getByTestId('palette-node').click();
  await page.locator('.react-flow__node[data-id="node-1"]').click();
  await page.locator('.react-flow__node[data-id="node-2"]').click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Connect selected nodes' }).click();
  await expect(page.locator('.react-flow__edge')).toHaveCount(1);

  await page.locator('.react-flow__node[data-id="node-1"]').click();
  const inspector = page.getByRole('complementary', { name: 'Inspector' });
  await inspector.getByRole('tab', { name: 'Advanced' }).click();
  await inspector.getByRole('searchbox', { name: 'Search style fields' }).fill('outline width');
  await inspector.getByRole('spinbutton', { name: 'Outline width' }).fill('5');
  await inspector.getByRole('spinbutton', { name: 'Outline width' }).press('Enter');

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const mapper = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await mapper.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await mapper.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapper.getByRole('button', { name: 'Create rule' }).click();
  await expect(mapper.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');
  await mapper.getByRole('button', { name: 'Close' }).click();

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
  const savedTopology = await page.evaluate(() => (
    window as typeof window & { __topoviewerVsCodeStudioTest?: { source(path: string): string | undefined } }
  ).__topoviewerVsCodeStudioTest?.source('topology.yaml'));
  expect(savedTopology).toContain('id: node-1');
  expect(savedTopology).toContain('id: link-1');
});
