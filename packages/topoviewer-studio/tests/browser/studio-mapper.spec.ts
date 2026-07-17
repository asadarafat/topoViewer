import { expect, test } from '@playwright/test';
import { selectCanvasTarget } from '../support/canvasSelection';
import { selectStudioOption } from '../support/mui';
import { openMapperCode, openStudioWorkspace } from '../support/workspaceRail';
import { invokeStudioHeaderAction } from '../support/headerActions';
import { expectEditorContains, replaceEditorMatch } from './helpers/monaco';

test('creates and removes the optional mapper through explicit undoable commands', async ({ page }) => {
  await page.goto('/');

  const workspace = await openStudioWorkspace(page, 'Mapper');
  const representations = workspace.getByRole('group', { name: 'Mapper representation' });
  await expect(representations.getByRole('button')).toHaveText(['Visual', 'Code']);
  await expect(representations.getByRole('button', { name: 'Code' })).toBeDisabled();
  await expect(workspace.getByText('No mapper yet')).toBeVisible();
  await expect(workspace.getByLabel('Mapper context')).toContainText('Graph · whole topology');
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await expect(workspace.getByText('Mapper ready')).toBeVisible();
  await expect(representations.getByRole('button', { name: 'Code' })).toBeEnabled();
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(workspace.getByText('No mapper yet')).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(workspace.getByText('Mapper ready')).toBeVisible();

  await workspace.getByRole('button', { name: 'Mapper actions' }).click();
  await page.getByRole('menuitem', { name: 'Remove mapper' }).click();
  const confirmation = page.getByRole('alertdialog', { name: 'Remove telemetry mapper' });
  await expect(confirmation).toContainText('Topology and stylesheet are not changed');
  await confirmation.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(workspace.getByText('No mapper yet')).toBeVisible();
});

test('creates rules from selected object and directional-link context', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await page.locator('.react-flow__node[data-id="spine"]').click();
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await expect(workspace.getByLabel('Mapper context')).toContainText('Node · spine');

  await workspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await selectStudioOption(page, workspace.getByRole('combobox', { name: 'Value semantic' }), 'health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await expect(workspace.getByRole('region', { name: 'Mapper rules' })).toContainText('node-health-node');

  await selectCanvasTarget(page, page.locator('.topoviewer-edge-direction-hit-target[data-direction="sourceToTarget"]'), 'linkDirection 10 Gbps selected');
  await expect(workspace.getByLabel('Mapper context')).toContainText('Link direction · spine-leaf:sourceToTarget');
  await workspace.getByRole('button', { name: 'New rule' }).click();
  const newRule = workspace.locator('.studio-mapper-basic-form');
  await newRule.getByRole('textbox', { name: 'Metric' }).fill('interface_bps');
  await newRule.getByRole('textbox', { name: 'State name' }).fill('busy');
  await newRule.getByRole('textbox', { name: 'State expression' }).fill('>=1000000000');
  await newRule.getByRole('button', { name: 'Create rule' }).click();
  const rules = workspace.getByRole('region', { name: 'Mapper rules' });
  await expect(rules).toContainText('interface-bps-linkdirection');
  await expect(rules).toContainText('linkDirection');
});

test('edits progressively disclosed fields and accounts for the complete metadata surface', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await page.locator('.react-flow__node[data-id="spine"]').click();
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await workspace.getByRole('tab', { name: 'Advanced' }).click();
  const fields = workspace.getByRole('region', { name: 'Mapper fields' });
  await fields.getByRole('button', { name: /View more/i }).click();
  await fields.getByRole('textbox', { name: 'Source Id', exact: true }).fill('branch-core');
  await fields.getByRole('textbox', { name: 'Source Id', exact: true }).press('Enter');
  await fields.getByRole('textbox', { name: 'Metric', exact: true }).fill('node_health_status');
  await fields.getByRole('textbox', { name: 'Metric', exact: true }).press('Enter');
  await expect(page.locator('.studio-saved-state')).toHaveText('Modified');

  await expect(fields.locator('[data-field-path]')).toHaveCount(92);
  await expect(fields.locator('[data-field-path="mappings[].conditions"]')).toContainText('Edit in Code');
});

test('preserves and navigates unsupported future mapper fields', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-future');
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('tab', { name: 'Advanced' }).click();
  const future = workspace.getByRole('button', { name: 'x-future-transform' });
  await expect(future).toBeVisible();
  await future.click();

  await expect(workspace.getByLabel('mapper YAML editor')).toBeVisible();
  await expectEditorContains(page, 'mapper', 'normalize: clamp');
});

test('reuses target-compatible style controls for mapper default and state styles', async ({ page }) => {
  await page.goto('/?__studio-test-state=overlay');
  await selectCanvasTarget(page, page.locator('.react-flow__edge[data-id="spine-leaf"] .react-flow__edge-interaction'), 'link spine-leaf selected');
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await expect(workspace.getByLabel('Mapper context')).toContainText('Link · spine-leaf');
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('interface_utilization');
  await workspace.getByRole('textbox', { name: 'State name' }).fill('busy');
  await workspace.getByRole('textbox', { name: 'State expression' }).fill('>=70');
  await workspace.getByRole('button', { name: 'Create rule' }).click();

  const style = workspace.locator('.studio-mapper-style-editor');
  await expect(style).toContainText('Rule style · link');
  await style.getByRole('button', { name: 'Rule style · link' }).click();
  await expect(style.locator('[data-field-path="backgroundColor"]')).toHaveCount(0);
  await style.getByRole('textbox', { name: 'Line color', exact: true }).fill('#ff0000');
  await style.getByRole('textbox', { name: 'Line color', exact: true }).press('Enter');
  await selectStudioOption(page, style.getByRole('combobox', { name: 'Mapper style state' }), 'busy');
  await style.getByRole('spinbutton', { name: 'Line width', exact: true }).fill('6');
  await style.getByRole('spinbutton', { name: 'Line width', exact: true }).press('Enter');

  await openMapperCode(page);
  await expectEditorContains(page, 'mapper', 'lineColor: "#ff0000"');
  await expectEditorContains(page, 'mapper', 'lineWidth: 6');
});

test('ingests bounded local generic and Grafana sample JSON without a network source', async ({ page }) => {
  await page.goto('/');
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('topology_health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await workspace.getByRole('tab', { name: 'Coverage' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });

  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(
    JSON.stringify([
      { metric: 'node_health', value: 1, labels: { node_id: 'leaf1' } },
      { metric: 'node_health', value: 0, labels: { node_id: 'leaf2' } }
    ])
  );
  await samples.getByRole('button', { name: 'Analyze samples' }).click();
  await expect(samples).toContainText('2 samples');
  await expect(samples).toContainText('generic-records');

  await samples.getByLabel('Choose sample JSON').setInputFiles({
    buffer: Buffer.from(
      JSON.stringify({
        frames: [
          {
            name: 'interface_bps',
            fields: [
              { name: 'Time', values: [1, 2] },
              { name: 'Value', labels: { __name__: 'interface_bps', link_id: 'a-b' }, values: [100, 200] }
            ]
          }
        ]
      })
    ),
    mimeType: 'application/json',
    name: 'grafana-frames.json'
  });
  await expect(samples).toContainText('1 samples');
  await expect(samples).toContainText('grafana-data-frames');
});

test('drags a discovered metric onto an object and requires an explicit ambiguous join choice', async ({ page }) => {
  await page.goto('/?__studio-test-state=starter');
  await page.getByTestId('palette-router').click();
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  await expect(node).toBeVisible();
  await node.click();

  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('textbox', { name: 'Metric' }).fill('seed_health');
  await workspace.getByRole('button', { name: 'Create rule' }).click();
  await workspace.getByRole('tab', { name: 'Coverage' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(JSON.stringify([{ metric: 'node_health', value: 1, labels: { device: 'router-1', node_id: 'router-1' } }]));
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
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('tab', { name: 'Coverage' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(
    JSON.stringify([
      { metric: 'health', value: 1, labels: { node_id: 'leaf1' } },
      { metric: 'health', value: 0, labels: { node_id: 'missing' } },
      { metric: 'role_health', value: 1, labels: { role: 'leaf' } },
      { metric: 'unused', value: 1, labels: {} },
      { value: 1, labels: {} }
    ])
  );
  await samples.getByRole('button', { name: 'Analyze samples' }).click();

  const coverage = workspace.getByRole('region', { name: 'Mapper coverage', exact: true });
  const summary = coverage.locator('.studio-mapper-coverage-summary');
  await expect(summary.locator('[data-status="resolved"]')).toContainText('1 resolved');
  await expect(summary.locator('[data-status="unresolved"]')).toContainText('2 unresolved');
  await expect(summary.locator('[data-status="ambiguous"]')).toContainText('1 ambiguous');
  await expect(summary.locator('[data-status="duplicate"]')).toContainText('1 duplicate');
  await expect(summary.locator('[data-status="ignored"]')).toContainText('1 ignored');
  await expect(summary.locator('[data-status="invalid"]')).toContainText('1 invalid');

  await coverage.getByRole('button', { name: 'Rule health-a' }).first().click();
  await expect(workspace.locator('.studio-mapper-rule-list > button').filter({ hasText: 'health-a' })).toHaveAttribute('aria-pressed', 'true');
  await workspace.getByRole('tab', { name: 'Coverage' }).click();
  await coverage.getByRole('button', { name: 'Object leaf1' }).first().click();
  await expect(page.getByRole('tab', { name: 'Mapper' })).toHaveAttribute('aria-selected', 'true');
  const objectProperties = await openStudioWorkspace(page, 'Properties');
  await expect(objectProperties.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Leaf 1');
});

test('moves measured high-cardinality mapper analysis to a worker', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('tab', { name: 'Coverage' }).click();
  const samples = workspace.getByRole('region', { name: 'Local telemetry samples' });
  await samples.getByRole('textbox', { name: 'Sample JSON' }).fill(
    JSON.stringify(
      Array.from({ length: 300 }, (_, index) => ({
        metric: 'health',
        value: index % 2,
        labels: { node_id: index % 2 ? 'leaf1' : 'leaf2' }
      }))
    )
  );
  await samples.getByRole('button', { name: 'Analyze samples' }).click();

  const status = workspace.locator('[data-analysis-mode="worker"]');
  await status.scrollIntoViewIfNeeded();
  await expect(status).toBeVisible();
  await expect(status).toContainText('off the main thread');
  const coverage = workspace.getByRole('region', { name: 'Mapper coverage', exact: true });
  await coverage.scrollIntoViewIfNeeded();
  await expect(coverage).toBeVisible();
});

test('round-trips mapper YAML through undo, save, reload, and local export', async ({ page }) => {
  await page.goto('/');
  let mapperWorkspace = await openStudioWorkspace(page, 'Mapper');
  await mapperWorkspace.getByRole('textbox', { name: 'Metric' }).fill('node_health');
  await mapperWorkspace.getByRole('button', { name: 'Create rule' }).click();

  const representations = mapperWorkspace.getByRole('group', { name: 'Mapper representation' });
  await representations.getByRole('button', { name: 'Code' }).click();
  await expect(mapperWorkspace.getByLabel('Mapper YAML workspace')).toBeVisible();
  await replaceEditorMatch(page, 'mapper', 'node_health', 'node_health_v2');
  await mapperWorkspace.getByRole('button', { name: 'Apply mapper' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health');
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2', false);
  await page.getByRole('button', { name: 'Redo' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');
  await page.getByRole('button', { name: 'Save project' }).click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible();

  await replaceEditorMatch(page, 'mapper', 'node_health_v2', 'node_health_v3');
  await mapperWorkspace.getByRole('button', { name: 'Apply mapper' }).click();
  await invokeStudioHeaderAction(page, 'Reload project');
  mapperWorkspace = await openStudioWorkspace(page, 'Mapper');
  await mapperWorkspace.getByRole('group', { name: 'Mapper representation' }).getByRole('button', { name: 'Code' }).click();
  await expectEditorContains(page, 'mapper', 'metric: node_health_v2');
  await expectEditorContains(page, 'mapper', 'node_health_v3', false);

  await mapperWorkspace.getByRole('group', { name: 'Mapper representation' }).getByRole('button', { name: 'Visual' }).click();
  await mapperWorkspace.getByRole('button', { name: 'Mapper actions' }).click();
  await page.getByRole('menuitem', { name: 'Export mapper' }).click();
  await expect(page.locator('.studio-visually-hidden[aria-live="polite"]')).toHaveText('Mapper exported');
});

test('keeps invalid Mapper Code isolated from the canvas and reverts to the canonical mapper', async ({ page }) => {
  await page.goto('/?__studio-test-state=mapper-coverage');
  await expect(page.locator('.react-flow__node')).toHaveCount(2);
  const nodeCount = await page.locator('.react-flow__node').count();
  const workspace = await openStudioWorkspace(page, 'Mapper');
  await workspace.getByRole('group', { name: 'Mapper representation' }).getByRole('button', { name: 'Code' }).click();
  const editor = workspace.getByLabel('mapper YAML editor');

  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText('version: [\n# invalid mapper draft');

  await expect(workspace.getByLabel('Mapper diagnostics')).toContainText(/Line \d+:/);
  await workspace.getByRole('button', { name: 'Apply mapper' }).click();
  await expect(page.locator('.studio-saved-state')).toHaveText('Invalid Draft');
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);

  await workspace.getByRole('button', { name: 'Revert invalid draft' }).click();
  await expect(workspace.getByLabel('Mapper diagnostics')).toHaveCount(0);
  await expectEditorContains(page, 'mapper', 'version: 1');
  await expect(page.locator('.react-flow__node')).toHaveCount(nodeCount);
});
