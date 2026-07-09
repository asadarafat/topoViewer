import { expect, type Page, test } from '@playwright/test';
import {
  chooseOption,
  expectCurrentHarnessServer,
  focusYamlEditorAt,
  graphNodeByLabel,
  mapperText,
  revertTemplateState,
  selectHarnessObject,
  setMapperText,
  showAllHarnessLayers,
  stylesheetText,
  waitForHarnessReady
} from './harness-helpers';

const HARNESS_ALLOWED_BROWSER_ERROR_PATTERNS = [
  /ResizeObserver loop completed with undelivered notifications/,
  /Error inlining remote css file/,
  /Error loading remote stylesheet/,
  /Error while reading CSS rules from/
];
const harnessBrowserErrors = new WeakMap<object, string[]>();

async function ensureMapperRuleBuilderOpen(page: Page) {
  const ruleIdField = page.getByLabel('Rule ID');
  if (!(await ruleIdField.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /Rule builder/ }).click();
  }
  await expect(ruleIdField).toBeVisible({ timeout: 15000 });
}

test.beforeEach(async ({ page }) => {
  const browserErrors: string[] = [];
  harnessBrowserErrors.set(page, browserErrors);
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await expectCurrentHarnessServer(page);
});

test.afterEach(async ({ page }) => {
  const browserErrors = harnessBrowserErrors.get(page) || [];
  const actionableErrors = browserErrors.filter((line) => (
    !HARNESS_ALLOWED_BROWSER_ERROR_PATTERNS.some((pattern) => pattern.test(line))
  ));
  expect(actionableErrors).toEqual([]);
});

test('authors mapper YAML as part of the editable Grafana bundle', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Topology YAML' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Stylesheet YAML' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Mapper YAML' })).toBeVisible();

  await page.getByRole('tab', { name: 'Mapper YAML' }).click();
  await expect(page.getByRole('button', { name: 'Mapper docs' })).toBeVisible();
  await ensureMapperRuleBuilderOpen(page);
  await page.getByLabel('Rule ID').fill('builder-link-state');
  await page.getByLabel('Metric').fill('topoviewer_link_up');
  await chooseOption(page, page.getByRole('combobox', { name: 'Object' }), 'underlay-fra-ams');
  await expect(page.getByLabel('Telemetry label')).toHaveValue('link_id');
  await page.getByLabel('Label template').fill('{{ severity }}');
  await ensureMapperRuleBuilderOpen(page);
  const insertMapperRuleButton = page.getByRole('button', { name: 'Insert mapper rule' });
  await expect(insertMapperRuleButton).toBeEnabled({ timeout: 15000 });
  await insertMapperRuleButton.click();
  await expect.poll(() => mapperText(page)).toContain('id: builder-link-state');
  await expect.poll(() => mapperText(page)).toContain('mappings:');
  await expect.poll(() => mapperText(page)).toContain('metricLabel: link_id');
  await expect.poll(() => mapperText(page)).toContain('conditions:');

  await chooseOption(page, page.getByRole('combobox', { name: 'Target' }), 'node');
  await chooseOption(page, page.getByRole('combobox', { name: 'Match by' }), 'label');
  await expect(page.getByRole('combobox', { name: 'Label key' })).toBeVisible();
  await chooseOption(page, page.getByRole('combobox', { name: 'Label key' }), 'role');
  await expect(page.getByRole('combobox', { name: 'Label value' })).toBeVisible();
  await chooseOption(page, page.getByRole('combobox', { name: 'Match by' }), 'data');
  await expect(page.getByRole('combobox', { name: 'Data key' })).toBeVisible();
  await chooseOption(page, page.getByRole('combobox', { name: 'Match by' }), 'endpoint');
  await expect(page.getByRole('combobox', { name: 'Topology endpoint pair' })).toBeVisible();

  await page.getByRole('button', { name: 'Mapper docs' }).click();
  await expect(page.getByRole('menuitem', { name: 'Mapper recipes' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Mapper schema' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Object attributes' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Presets' })).toBeVisible();
  await page.getByRole('button', { name: 'Presets' }).click();
  await expect(page.getByRole('menuitem', { name: /Comprehensive starter/ })).toBeVisible();
  await page.getByRole('menuitem', { name: /Comprehensive starter/ }).click();
  await expect.poll(() => mapperText(page)).toContain('id: node-health-by-id');
  await expect.poll(() => mapperText(page)).toContain('version: 1');
  await expect.poll(() => mapperText(page)).toContain('mappings:');

  await setMapperText(page, 'version: 2\nrules: []\n');
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('invalid-mapper-schema');
  await page.getByRole('button', { name: /invalid-mapper-schema/ }).click();
  await expect(page.getByRole('tab', { name: 'Mapper YAML' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('invalid-mapper-schema');

  const validMapper = [
    'version: 1',
    'identity:',
    '  sourceId: layered-network',
    '  sourceIdLabel: source_id',
    'rules:',
    '  - id: link-health',
    '    metric: topoviewer_link_up',
    '    select: link',
    '    join: link_id',
    '    value: up',
    '    states:',
    '      down: "==0"',
    '    style:',
    '      default:',
    '        label: UP',
    '        lineColor: "#4caf50"',
    '      down:',
    '        label: DOWN',
    '        lineColor: "#d32f2f"',
    '        lineStyle: dashed',
    ''
  ].join('\n');
  await setMapperText(page, validMapper);
  await expect(page.getByText('Synthetic mapper coverage')).toBeVisible();
  await expect(page.getByText(/1\/1 rules resolve against the current topology/)).toBeVisible();
  await expect(page.locator('.topoviewer-vscode-diagnostic-strip')).toContainText('YAML draft has unapplied changes');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
  await expect.poll(() => mapperText(page)).toContain('id: link-health');
  await expect.poll(() => page.evaluate(() => (window as any).__topoviewerHarnessState?.mapperText || '')).toContain('lineStyle: dashed');
  const graphId = await page.evaluate(() => (window as any).__topoviewerHarnessValidation?.document?.graph?.id || 'topoviewer');
  const downloadedFiles: string[] = [];
  page.on('download', (download) => downloadedFiles.push(download.suggestedFilename()));
  await page.getByRole('button', { name: 'Download bundle' }).click();
  await expect.poll(() => downloadedFiles.slice().sort()).toEqual([
    `${graphId}.mapper.tv.yaml`,
    `${graphId}.style.tv.yaml`,
    `${graphId}.topo.tv.yaml`
  ].sort());

  await page.reload();
  await waitForHarnessReady(page);
  await expect.poll(() => mapperText(page)).toContain('id: link-health');

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await page.getByRole('tab', { name: 'Mapper YAML' }).click();
  await setMapperText(page, 'version: 1\nrules:\n  - ');
  await focusYamlEditorAt(page, 3, 5);
  await page.getByRole('button', { name: 'YAML assist' }).click();
  await expect(page.locator('.suggest-widget')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.monaco-list-row').filter({ hasText: 'id' }).first()).toBeVisible();
});

test('creates selected object style rules and opens YAML suggestions', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await graphNodeByLabel(page, 'FRA-PE').click();
  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect(page.getByRole('tab', { name: 'Stylesheet YAML' })).toHaveAttribute('aria-selected', 'true');
  await expect.poll(() => stylesheetText(page)).toContain('selector: node[id = "fra-pe"]');
  await expect.poll(() => stylesheetText(page)).toContain('opacity: 1');
  await expect(page.locator('.topoviewer-vscode-editor .monaco-editor')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.suggest-widget')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.monaco-list-row').filter({ hasText: 'backgroundColor' }).first()).toBeVisible();

  await page.keyboard.press('Escape');
  const beforeHelp = await stylesheetText(page);
  await page.keyboard.type('?');
  await expect(page.locator('.suggest-widget')).toBeVisible();
  await expect.poll(() => stylesheetText(page)).toBe(beforeHelp);
  await page.keyboard.press('Escape');
  await revertTemplateState(page);

  await showAllHarnessLayers(page);
  await selectHarnessObject(page, 'link', 'underlay-fra-ams');
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect.poll(() => stylesheetText(page)).toContain('selector: link[id = "underlay-fra-ams"]');

  await selectHarnessObject(page, 'path', 'payments-path');
  await page.getByRole('button', { name: 'Style in YAML' }).click();
  await expect.poll(() => stylesheetText(page)).toContain('selector: path[id = "payments-path"]');
  await revertTemplateState(page);
});
