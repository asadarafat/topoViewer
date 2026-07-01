#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(labRoot, '../..');
const artifactRoot = path.join(repoRoot, '.artifacts/grafana-phase-4');
const env = parseEnvFile(path.join(labRoot, '.env'));
const runtimeEnv = parseOptionalEnvFile(path.join(repoRoot, '.artifacts/grafana-topoviewer-lab.env'));
const grafanaBaseUrl = process.env.GRAFANA_URL || `http://127.0.0.1:${env.GRAFANA_HTTP_PORT || '3000'}`;
const injectorBaseUrl = process.env.TELEMETRY_INJECTOR_URL ||
  `http://127.0.0.1:${runtimeEnv.TELEMETRY_INJECTOR_HTTP_PORT || env.TELEMETRY_INJECTOR_HTTP_PORT || '9108'}`;
const dashboardUrl = `${grafanaBaseUrl}/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles?orgId=1&kiosk`;

function parseEnvFile(filePath) {
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

function parseOptionalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnvFile(filePath);
}

async function waitForGrafana() {
  const healthUrl = `${grafanaBaseUrl}/api/health`;
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < 60_000) {
    try {
      const response = await fetch(healthUrl);
      const payload = await response.json();
      if (response.ok && payload.version === env.GRAFANA_VERSION) return;
      lastError = JSON.stringify(payload);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Grafana did not become healthy at ${healthUrl}: ${lastError}`);
}

async function setTelemetryScenario(scenario) {
  const response = await fetch(`${injectorBaseUrl}/scenario/${scenario}`, { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Unable to set telemetry scenario "${scenario}" at ${injectorBaseUrl}: ${JSON.stringify(payload)}`);
  }
}

async function waitForPanel(page) {
  const panel = page.locator('[data-testid="topoviewer-grafana-panel"]').first();
  await panel.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length > 0);
  return panel;
}

async function assertMountedBundleRendered(page, bundleId) {
  const selector = page.locator('[data-testid="topoviewer-bundle-select"]').first();
  await selector.selectOption(bundleId);
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length > 0);
  const selectedBundleName = await selector.locator('option:checked').innerText();
  const selectedTopologyName = (await page.locator('[data-testid="topoviewer-selected-topology-name"]').first().innerText()).trim();
  if (selectedTopologyName !== selectedBundleName.trim()) {
    throw new Error(`Mounted bundle ${bundleId} header mismatch: expected "${selectedBundleName.trim()}", got "${selectedTopologyName}".`);
  }
  const panelHeaderText = await page.locator('[data-testid="topoviewer-grafana-panel"] > header').first().innerText();
  if (panelHeaderText.trim().startsWith('TopoViewer\n')) {
    throw new Error(`Mounted bundle ${bundleId} repeats the Grafana panel title inside the plugin header: ${JSON.stringify(panelHeaderText)}.`);
  }
  const diagnostics = page.locator('[data-testid="topoviewer-grafana-diagnostics"]');
  if (await diagnostics.count()) {
    throw new Error(`Mounted bundle ${bundleId} rendered diagnostics: ${await diagnostics.first().innerText()}`);
  }
}

async function assertEdgeStrokePathsDoNotFill(page, bundleId) {
  const edgePathFills = await page.locator([
    '.topoviewer-edge-visible-path',
    '.topoviewer-edge-line-outline',
    '.topoviewer-edge-pipe-border',
    '.topoviewer-edge-pipe-fill',
    '.topoviewer-edge-lane'
  ].join(', ')).evaluateAll((paths) => paths.map((path) => ({
    className: path.getAttribute('class') || '',
    fillAttribute: path.getAttribute('fill') || '',
    computedFill: window.getComputedStyle(path).fill
  })));
  const filledPaths = edgePathFills.filter((item) => item.computedFill !== 'none');
  if (filledPaths.length) {
    throw new Error(`Mounted bundle ${bundleId} rendered filled edge stroke paths: ${JSON.stringify(filledPaths.slice(0, 5))}`);
  }
}

async function assertBundleSelectorUsable(page) {
  const selector = page.locator('[data-testid="topoviewer-bundle-select"]').first();
  const box = await selector.boundingBox();
  if (!box || box.width < 200 || box.height < 28) {
    throw new Error(`Mounted bundle selector is too small for manual use: ${JSON.stringify(box)}`);
  }
}

await waitForGrafana();
await setTelemetryScenario('healthy');
fs.mkdirSync(artifactRoot, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    locale: 'en-US',
    viewport: { width: 1440, height: 1000 }
  });
  await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
  const panel = await waitForPanel(page);
  await assertBundleSelectorUsable(page);
  await assertMountedBundleRendered(page, 'layered-network');
  await assertEdgeStrokePathsDoNotFill(page, 'layered-network');
  await panel.screenshot({
    path: path.join(artifactRoot, 'mounted-bundle-selection.png')
  });
  const telemetryStatus = page.locator('[data-testid="topoviewer-grafana-telemetry-status"]').first();
  await telemetryStatus.waitFor({ state: 'visible', timeout: 30_000 });
  await telemetryStatus.screenshot({
    path: path.join(artifactRoot, 'mapping-coverage.png')
  });
  await telemetryStatus.locator('summary').click();
  await telemetryStatus.screenshot({
    path: path.join(artifactRoot, 'mapper-diagnostics-promql.png')
  });
  await assertMountedBundleRendered(page, 'clos-2spine-4leaf');
  await assertEdgeStrokePathsDoNotFill(page, 'clos-2spine-4leaf');
  await panel.screenshot({
    path: path.join(artifactRoot, 'mounted-bundles.png')
  });
  await setTelemetryScenario('link-failure');
  await page.reload({ waitUntil: 'networkidle' });
  const refreshedPanel = await waitForPanel(page);
  await assertMountedBundleRendered(page, 'layered-network');
  await refreshedPanel.screenshot({
    path: path.join(artifactRoot, 'telemetry-overlay-link-failure.png')
  });

  console.log(`Grafana Phase 4 smoke passed: ${dashboardUrl}`);
  console.log(`Screenshots: ${path.relative(repoRoot, artifactRoot)}`);
} finally {
  await browser.close();
}
