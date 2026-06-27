#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(labRoot, '../..');
const artifactRoot = path.join(repoRoot, '.artifacts/grafana-phase-2');
const env = parseEnvFile(path.join(labRoot, '.env'));
const grafanaBaseUrl = process.env.GRAFANA_URL || `http://127.0.0.1:${env.GRAFANA_HTTP_PORT || '3000'}`;
const prometheusBaseUrl = process.env.PROMETHEUS_URL || `http://127.0.0.1:${env.PROMETHEUS_HTTP_PORT || '9090'}`;
const injectorBaseUrl = process.env.TELEMETRY_INJECTOR_URL || `http://127.0.0.1:${env.TELEMETRY_INJECTOR_HTTP_PORT || '9108'}`;
const dashboardUrl = `${grafanaBaseUrl}/d/topoviewer-phase-2/topoviewer-phase-2-weathermap?orgId=1&kiosk`;

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

async function waitForJson(url, label, predicate = () => true) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < 90_000) {
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (response.ok && predicate(payload)) return payload;
      lastError = JSON.stringify(payload);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} did not become ready at ${url}: ${lastError}`);
}

async function setScenario(name) {
  const response = await fetch(`${injectorBaseUrl}/scenario/${name}`, { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Failed to set scenario ${name}: ${JSON.stringify(payload)}`);
  return payload;
}

async function waitForPrometheusFailureSample() {
  const query = encodeURIComponent('topoviewer_link_up{fixture_id="layered-network",link_id="underlay-ams-lon"}');
  return waitForJson(
    `${prometheusBaseUrl}/api/v1/query?query=${query}`,
    'Prometheus failure sample',
    (payload) => payload?.data?.result?.some((sample) => Number(sample.value?.[1]) === 0)
  );
}

await waitForJson(`${grafanaBaseUrl}/api/health`, 'Grafana', (payload) => payload.version === env.GRAFANA_VERSION);
await waitForJson(`${prometheusBaseUrl}/api/v1/status/buildinfo`, 'Prometheus', (payload) => payload?.data?.version === env.PROMETHEUS_VERSION);
await waitForJson(`${injectorBaseUrl}/health`, 'Telemetry injector', (payload) => payload.status === 'ok');
await setScenario('link-failure');
await waitForPrometheusFailureSample();
fs.mkdirSync(artifactRoot, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    locale: 'en-US',
    viewport: { width: 1600, height: 1100 }
  });
  await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
  await page.getByText('Layered Network Weathermap').waitFor({ state: 'visible', timeout: 60_000 });
  await page.locator('[data-testid="topoviewer-grafana-panel"]').first().waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length > 0);
  const diagnostics = page.locator('[data-testid="topoviewer-grafana-diagnostics"]');
  if (await diagnostics.count()) {
    throw new Error(`Phase 2 dashboard rendered diagnostics: ${await diagnostics.first().innerText()}`);
  }
  await page.waitForFunction(() => {
    const edges = Array.from(document.querySelectorAll('.topoviewer .react-flow__edge path'));
    return edges.some((edge) => getComputedStyle(edge).stroke === 'rgb(211, 47, 47)');
  });
  await page.screenshot({
    fullPage: true,
    path: path.join(artifactRoot, 'topoviewer-phase-2-weathermap.png')
  });

  console.log(`Grafana Phase 2 smoke passed: ${dashboardUrl}`);
  console.log(`Screenshots: ${path.relative(repoRoot, artifactRoot)}`);
} finally {
  await browser.close();
}
