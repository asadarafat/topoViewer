import { expect, test } from '@playwright/test';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';

test('enables and removes the optional mapper through explicit undoable commands', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await expect(workspace).toBeVisible();
  await expect(workspace.getByText('No mapper in this project')).toBeVisible();

  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await expect(workspace.getByText('mapper.yaml enabled')).toBeVisible();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(workspace.getByText('No mapper in this project')).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(workspace.getByText('mapper.yaml enabled')).toBeVisible();

  await workspace.getByRole('button', { name: 'Remove mapper' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Remove telemetry mapper' });
  await expect(confirmation).toContainText('Topology and stylesheet are not changed');
  await confirmation.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(workspace.getByText('No mapper in this project')).toBeVisible();
});

test('creates Basic rules for object and directional-link telemetry', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();

  await workspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await workspace.getByRole('combobox', { name: 'Target' }).selectOption('node');
  await workspace.getByRole('combobox', { name: 'Value semantic' }).selectOption('health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await expect(workspace.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');

  await workspace.getByRole('textbox', { name: 'Metric' }).fill('interface_bps');
  await workspace.getByRole('combobox', { name: 'Target' }).selectOption('linkDirection');
  await workspace.getByRole('textbox', { name: 'State name' }).fill('busy');
  await workspace.getByRole('textbox', { name: 'State expression' }).fill('>=1000000000');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  const rules = workspace.getByRole('region', { name: 'Mapper rules' });
  await expect(rules).toContainText('interface-bps-linkdirection');
  await expect(rules).toContainText('linkDirection');
});

test('edits Advanced fields and accounts for the complete metadata surface', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  const authoringViews = workspace.getByRole('tablist', { name: 'Mapper authoring views' });

  await authoringViews.getByRole('tab', { name: 'Advanced' }).click();
  const advanced = workspace.getByRole('region', { name: 'advanced mapper fields' });
  await advanced.getByRole('textbox', { name: 'Source Id', exact: true }).fill('branch-core');
  await advanced.getByRole('textbox', { name: 'Source Id', exact: true }).press('Enter');
  await advanced.getByRole('textbox', { name: 'Metric', exact: true }).fill('node_health_status');
  await advanced.getByRole('textbox', { name: 'Metric', exact: true }).press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await authoringViews.getByRole('tab', { name: 'All' }).click();
  const all = workspace.getByRole('region', { name: 'all mapper fields' });
  await expect(all.locator('[data-field-path]')).toHaveCount(92);
  await expect(all.locator('[data-field-path="mappings[].conditions"]')).toContainText('Edit in YAML');
});

test('preserves and navigates unsupported future mapper fields', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-future');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace
    .getByRole('tablist', { name: 'Mapper authoring views' })
    .getByRole('tab', { name: 'All' })
    .click();
  const future = workspace.getByRole('button', { name: 'x-future-transform' });
  await expect(future).toBeVisible();
  await future.click();

  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('x-future-transform');
  await expectEditorContains(page, 'mapper', 'normalize: clamp');
});

test('reuses target-compatible style controls for mapper default and state styles', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('interface_utilization');
  await workspace.getByRole('combobox', { name: 'Target' }).selectOption('link');
  await workspace.getByRole('textbox', { name: 'State name' }).fill('busy');
  await workspace.getByRole('textbox', { name: 'State expression' }).fill('>=70');
  await workspace.getByRole('button', { name: 'Create rule' }).click();

  const style = workspace.locator('.studio-mapper-style-editor');
  await expect(style).toContainText('Rule style · link');
  await expect(style.locator('[data-field-path="backgroundColor"]')).toHaveCount(0);
  await style.getByRole('textbox', { name: 'Line color', exact: true }).fill('#ff0000');
  await style.getByRole('textbox', { name: 'Line color', exact: true }).press('Enter');
  await style.getByRole('combobox', { name: 'Mapper style state' }).selectOption('busy');
  await style.getByRole('spinbutton', { name: 'Line width', exact: true }).fill('6');
  await style.getByRole('spinbutton', { name: 'Line width', exact: true }).press('Enter');

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  const drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'mapper.yaml' }).click();
  await expectEditorContains(page, 'mapper', 'lineColor: "#ff0000"');
  await expectEditorContains(page, 'mapper', 'lineWidth: 6');
});

test('ingests bounded local generic and Grafana sample JSON without a network source', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });

  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(JSON.stringify([
    { metric: 'node_health', value: 1, labels: { node_id: 'leaf1' } },
    { metric: 'node_health', value: 0, labels: { node_id: 'leaf2' } }
  ]));
  await samples.getByRole('button', { name: 'Analyze samples' }).click();
  await expect(samples).toContainText('2 samples');
  await expect(samples).toContainText('generic-records');

  await samples.getByLabel('Choose sample JSON').setInputFiles({
    buffer: Buffer.from(JSON.stringify({ frames: [{
      name: 'interface_bps',
      fields: [
        { name: 'Time', values: [1, 2] },
        { name: 'Value', labels: { __name__: 'interface_bps', link_id: 'a-b' }, values: [100, 200] }
      ]
    }] })),
    mimeType: 'application/json',
    name: 'grafana-frames.json'
  });
  await expect(samples).toContainText('1 samples');
  await expect(samples).toContainText('grafana-data-frames');
});

test('drags a discovered metric onto an object and requires an explicit ambiguous join choice', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('palette-node').click();
  const node = page.locator('.react-flow__node').first();
  await expect(node).toBeVisible();

  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await workspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(JSON.stringify([
    { metric: 'node_health', value: 1, labels: { device: 'node-1', node_id: 'node-1' } }
  ]));
  await samples.getByRole('button', { name: 'Analyze samples' }).click();

  const metric = workspace.getByRole('button', { name: /node_health/ });
  await metric.dragTo(node);
  const proposal = workspace.getByRole('region', { name: 'Mapper rule proposal' });
  await expect(proposal).toContainText('ambiguous');
  await expect(proposal.getByRole('radio')).toHaveCount(2);
  await expect(proposal.getByRole('button', { name: 'Create proposed rule' })).toBeDisabled();
  await proposal.locator('label').filter({ hasText: 'node_id' }).getByRole('radio').check();
  await proposal.getByRole('button', { name: 'Create proposed rule' }).click();

  await expect(workspace.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');
  await expect(proposal).toBeHidden();
});

test('reports auditable mapper coverage and links findings to rules and objects', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(JSON.stringify([
    { metric: 'health', value: 1, labels: { node_id: 'leaf1' } },
    { metric: 'health', value: 0, labels: { node_id: 'missing' } },
    { metric: 'role_health', value: 1, labels: { role: 'leaf' } },
    { metric: 'unused', value: 1, labels: {} },
    { value: 1, labels: {} }
  ]));
  await samples.getByRole('button', { name: 'Analyze samples' }).click();

  const coverage = workspace.getByRole('region', { name: 'Mapper coverage' });
  const summary = coverage.locator('.studio-mapper-coverage-summary');
  await expect(summary.locator('[data-status="resolved"]')).toContainText('1 resolved');
  await expect(summary.locator('[data-status="unresolved"]')).toContainText('2 unresolved');
  await expect(summary.locator('[data-status="ambiguous"]')).toContainText('1 ambiguous');
  await expect(summary.locator('[data-status="duplicate"]')).toContainText('1 duplicate');
  await expect(summary.locator('[data-status="ignored"]')).toContainText('1 ignored');
  await expect(summary.locator('[data-status="invalid"]')).toContainText('1 invalid');

  await coverage.getByRole('button', { name: 'Rule health-a' }).first().click();
  await expect(workspace.locator('.studio-mapper-rule-list > button').filter({ hasText: 'health-a' }))
    .toHaveAttribute('aria-pressed', 'true');
  await coverage.getByRole('button', { name: 'Object leaf1' }).first().click();
  await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Leaf 1');
});

test('moves measured high-cardinality mapper analysis to a worker', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const workspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(JSON.stringify(
    Array.from({ length: 300 }, (_, index) => ({
      metric: 'health', value: index % 2, labels: { node_id: index % 2 ? 'leaf1' : 'leaf2' }
    }))
  ));
  await samples.getByRole('button', { name: 'Analyze samples' }).click();

  const status = workspace.locator('[data-analysis-mode="worker"]');
  await status.scrollIntoViewIfNeeded();
  await expect(status).toBeVisible();
  await expect(status).toContainText('off the main thread');
  const coverage = workspace.getByRole('region', { name: 'Mapper coverage' });
  await coverage.scrollIntoViewIfNeeded();
  await expect(coverage).toBeVisible();
});

test('round-trips mapper YAML through undo, save, reload, and local export', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  const mapperWorkspace = page.getByRole('region', { name: 'Telemetry mapper workspace' });
  await mapperWorkspace.getByRole('button', { name: 'Enable telemetry mapper' }).click();
  await mapperWorkspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapperWorkspace.getByRole('button', { name: 'Create rule' }).click();

  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  let drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'mapper.yaml' }).click();
  await replaceEditorMatch(page, 'mapper', 'node_health', 'node_health_v2');
  await drawer.getByRole('button', { name: 'Apply' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health');
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2', false);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await replaceEditorMatch(page, 'mapper', 'node_health_v2', 'node_health_v3');
  await drawer.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Reload project' }).click();
  await page.getByRole('button', { name: 'Open workspace drawer' }).click();
  drawer = page.getByRole('region', { name: 'Workspace drawer' });
  await drawer.getByRole('tab', { name: 'mapper.yaml' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');
  await expectEditorContains(page, 'mapper', 'node_health_v3', false);

  await drawer.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Open telemetry mapper' }).click();
  await page.getByRole('button', { name: 'Export mapper' }).click();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toHaveText('Mapper exported');
});
