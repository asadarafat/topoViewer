#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  artifactRoot,
  env,
  gnmicUrl,
  grafanaUrl,
  normalizerUrl,
  prometheusUrl,
  repoRoot
} from './env.mjs';

const grafanaBaseUrl = grafanaUrl();
const prometheusBaseUrl = prometheusUrl();
const gnmicBaseUrl = gnmicUrl();
const normalizerBaseUrl = normalizerUrl();
const dashboardUrl = `${grafanaBaseUrl}/d/topoviewer-clab/topoviewer-containerlab-phase-5?orgId=1&kiosk`;

function writeText(fileName, text) {
  fs.mkdirSync(artifactRoot, { recursive: true });
  fs.writeFileSync(path.join(artifactRoot, fileName), text);
}

function writeJson(fileName, payload) {
  writeText(fileName, `${JSON.stringify(payload, null, 2)}\n`);
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  return text;
}

async function fetchJson(url, options) {
  return JSON.parse(await fetchText(url, options));
}

async function waitFor(name, probe, timeoutMs = 90_000) {
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await probe();
      if (value) return value;
      lastError = `${name} probe returned no usable result`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${name} did not become ready within ${timeoutMs}ms: ${lastError}`);
}

async function waitForGrafana() {
  return waitFor('Grafana', async () => {
    const health = await fetchJson(`${grafanaBaseUrl}/api/health`);
    return health.version === env.GRAFANA_VERSION ? health : undefined;
  });
}

async function waitForPrometheus() {
  return waitFor('Prometheus', async () => {
    const status = await fetchJson(`${prometheusBaseUrl}/api/v1/status/buildinfo`);
    return status.status === 'success' ? status.data : undefined;
  });
}

async function waitForNormalizer() {
  return waitFor('TopoViewer normalizer', async () => {
    const health = await fetchJson(`${normalizerBaseUrl}/health`);
    return health.status === 'ok' ? health : undefined;
  });
}

async function prometheusQuery(query) {
  const result = await fetchJson(`${prometheusBaseUrl}/api/v1/query?query=${encodeURIComponent(query)}`);
  if (result.status !== 'success') {
    throw new Error(`Prometheus query failed: ${query}`);
  }
  return result.data.result;
}

function vectorValue(result) {
  const value = result?.[0]?.value?.[1];
  return Number(value);
}

async function waitForQuery(name, query, predicate, timeoutMs = 90_000) {
  return waitFor(name, async () => {
    const result = await prometheusQuery(query);
    const value = vectorValue(result);
    return Number.isFinite(value) && predicate(value, result) ? { value, result } : undefined;
  }, timeoutMs);
}

async function setScenario(name) {
  await fetchJson(`${normalizerBaseUrl}/scenario/${encodeURIComponent(name)}`);
  await fetchText(`${normalizerBaseUrl}/metrics`);
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function runCommand(command, args, description) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.status !== 0) {
    throw new Error(`${description} failed: ${result.stderr.trim() || result.stdout.trim()}`);
  }
  return result.stdout.trim();
}

function containerlabVersion() {
  const command = spawnSync('bash', ['-lc', 'command -v containerlab || command -v clab'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).stdout.trim();
  return command ? commandOutput(command, ['version', '--short']) : 'containerlab not found';
}

async function capturePanel(page, name) {
  await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 90_000 });
  const panel = page.locator('[data-testid="topoviewer-grafana-panel"]').first();
  await panel.waitFor({ state: 'visible', timeout: 60_000 });
  const selector = page.locator('[data-testid="topoviewer-bundle-select"]').first();
  await selector.selectOption('clab-clos');
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length >= 4);
  const diagnostics = page.locator('[data-testid="topoviewer-grafana-diagnostics"]');
  if (await diagnostics.count()) {
    throw new Error(`Containerlab dashboard rendered blocking diagnostics: ${await diagnostics.first().innerText()}`);
  }
  const status = page.locator('[data-testid="topoviewer-grafana-telemetry-status"]').first();
  await status.waitFor({ state: 'visible', timeout: 60_000 });
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="topoviewer-grafana-telemetry-status"]');
    return Boolean(element?.textContent?.includes('Mapper coverage:'));
  });
  const statusText = (await status.innerText()).trim();
  if (!/Mapper coverage: \d+\/\d+ samples resolved/.test(statusText)) {
    throw new Error(`Unexpected mapper coverage text: ${statusText}`);
  }
  await panel.screenshot({ path: path.join(artifactRoot, `${name}.png`) });
  writeText(`mapper-coverage-${name}.txt`, `${statusText}\n`);
}

fs.mkdirSync(artifactRoot, { recursive: true });
writeJson('versions.json', {
  env,
  docker: commandOutput('docker', ['version', '--format', '{{json .}}']),
  containerlab: containerlabVersion()
});

const grafanaHealth = await waitForGrafana();
const prometheusBuildInfo = await waitForPrometheus();
const normalizerHealth = await waitForNormalizer();
writeJson('grafana-health.json', grafanaHealth);
writeJson('prometheus-buildinfo.json', prometheusBuildInfo);
writeJson('normalizer-health.json', normalizerHealth);

const bundleIndex = await fetchJson(`${grafanaBaseUrl}/api/plugins/asadarafat-topoviewer-panel/resources/bundles?root=${encodeURIComponent('/etc/topoviewer/bundles')}`);
writeJson('bundle-index.json', bundleIndex);
if (!bundleIndex.bundles?.some((bundle) => bundle.id === 'clab-clos')) {
  throw new Error(`Grafana plugin did not discover clab-clos bundle: ${JSON.stringify(bundleIndex)}`);
}

const targets = await fetchJson(`${prometheusBaseUrl}/api/v1/targets`);
writeJson('prometheus-targets.json', targets);
const activeTargets = targets.data?.activeTargets || [];
const unhealthyTargets = activeTargets.filter((target) => target.health !== 'up');
if (unhealthyTargets.length) {
  throw new Error(`Prometheus has unhealthy targets: ${JSON.stringify(unhealthyTargets, null, 2)}`);
}

writeText(
  'client-reachability.txt',
  `${runCommand('docker', ['exec', 'clab-topoviewer-grafana-client1', 'ping', '-c', '3', '-W', '1', '192.0.2.13'], 'client1 to client2 ping')}\n`
);
writeText('gnmic-metrics.prom', await fetchText(`${gnmicBaseUrl}/metrics`));
await setScenario('healthy');
await waitForQuery(
  'healthy link utilization',
  'max(topoviewer_clab_link_utilization_percent{topology="clab-clos"})',
  (value) => value <= 25
);
writeText('normalizer-metrics-healthy.prom', await fetchText(`${normalizerBaseUrl}/metrics`));
writeJson('query-healthy-link-up.json', await prometheusQuery('topoviewer_clab_link_up{topology="clab-clos"}'));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    locale: 'en-US',
    viewport: { width: 1500, height: 1000 }
  });
  await capturePanel(page, 'healthy');

  await setScenario('high-utilization');
  const highUtilization = await waitForQuery(
    'high utilization overlay',
    'max(topoviewer_clab_link_utilization_percent{topology="clab-clos"})',
    (value) => value >= 90
  );
  writeJson('query-high-utilization.json', highUtilization);
  writeText('normalizer-metrics-high-utilization.prom', await fetchText(`${normalizerBaseUrl}/metrics`));
  await capturePanel(page, 'high-utilization');

  await setScenario('link-failure');
  const linkFailure = await waitForQuery(
    'link failure overlay',
    'topoviewer_clab_link_up{topology="clab-clos",link_id="spine1-leaf1"}',
    (value) => value === 0
  );
  writeJson('query-link-failure.json', linkFailure);
  writeText('normalizer-metrics-link-failure.prom', await fetchText(`${normalizerBaseUrl}/metrics`));
  await capturePanel(page, 'link-failure');
} finally {
  await browser.close();
}

console.log(`Grafana Containerlab smoke passed: ${dashboardUrl}`);
console.log(`Artifacts: ${path.relative(repoRoot, artifactRoot)}`);
