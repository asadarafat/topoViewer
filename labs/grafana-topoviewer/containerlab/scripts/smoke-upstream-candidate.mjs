#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { repoRoot } from './env.mjs';

const pluginId = 'asadarafat-topoviewer-panel';
const grafanaBaseUrl = process.env.GRAFANA_URL || 'http://127.0.0.1:3000';
const prometheusBaseUrl = process.env.PROMETHEUS_URL || 'http://127.0.0.1:9090';
const bundleRoot = process.env.TOPOVIEWER_BUNDLE_ROOT || '/etc/topoviewer/bundles';
const bundleId = process.env.TOPOVIEWER_BUNDLE_ID || 'st-clos';
const topologyLabel = process.env.TOPOVIEWER_TOPOLOGY_LABEL || 'st-clos';
const artifactRoot = path.resolve(
  repoRoot,
  process.env.TOPOVIEWER_ARTIFACT_DIR || '.artifacts/grafana-upstream'
);
const dashboardUrl = process.env.TOPOVIEWER_DASHBOARD_URL
  || `${grafanaBaseUrl}/d/network-telemetry-topoviewer/network-telemetry-topoviewer?orgId=1&kiosk`;
const trafficCommand = process.env.TOPOVIEWER_TRAFFIC_COMMAND || 'bash labs/grafana-topoviewer/containerlab/traffic.sh start all';
const requireTraffic = process.env.TOPOVIEWER_REQUIRE_TRAFFIC !== '0';

function artifactPath(fileName) {
  fs.mkdirSync(artifactRoot, { recursive: true });
  return path.join(artifactRoot, fileName);
}

function writeText(fileName, text) {
  fs.writeFileSync(artifactPath(fileName), text);
}

function writeJson(fileName, value) {
  writeText(fileName, `${JSON.stringify(value, null, 2)}\n`);
}

function describeFetchError(url, status, text) {
  return `${url} returned HTTP ${status}: ${text.slice(0, 800)}`;
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) throw new Error(describeFetchError(url, response.status, text));
  return text;
}

async function fetchJson(url, options) {
  return JSON.parse(await fetchText(url, options));
}

async function waitFor(name, probe, options = {}) {
  const timeoutMs = options.timeoutMs || 120_000;
  const intervalMs = options.intervalMs || 1500;
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
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`${name} did not become ready within ${timeoutMs}ms. Last error: ${lastError}`);
}

async function prometheusQuery(query) {
  const url = `${prometheusBaseUrl}/api/v1/query?query=${encodeURIComponent(query)}`;
  const payload = await fetchJson(url);
  if (payload.status !== 'success') {
    throw new Error(`Prometheus query failed: ${query}\n${JSON.stringify(payload, null, 2)}`);
  }
  return payload.data.result;
}

function firstVectorValue(result) {
  const value = result?.[0]?.value?.[1];
  return Number(value);
}

async function waitForPrometheusValue(name, query, predicate, timeoutMs = 120_000) {
  return waitFor(name, async () => {
    const result = await prometheusQuery(query);
    const value = firstVectorValue(result);
    return Number.isFinite(value) && predicate(value, result) ? { value, result } : undefined;
  }, { timeoutMs });
}

function runOptionalTrafficCommand() {
  if (!trafficCommand) return;
  const result = spawnSync('bash', ['-lc', trafficCommand], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  writeText('traffic-command.log', [
    `$ ${trafficCommand}`,
    result.stdout.trim(),
    result.stderr.trim()
  ].filter(Boolean).join('\n'));
  if (result.status !== 0) {
    throw new Error(`Traffic command failed with exit code ${result.status}: ${result.stderr.trim() || result.stdout.trim()}`);
  }
}

async function verifyGrafana() {
  const health = await waitFor('Grafana health', async () => {
    const payload = await fetchJson(`${grafanaBaseUrl}/api/health`);
    return payload.database === 'ok' ? payload : undefined;
  });
  writeJson('grafana-health.json', health);

  const plugins = await fetchJson(`${grafanaBaseUrl}/api/plugins`);
  const plugin = plugins.find((entry) => entry.id === pluginId);
  writeJson('grafana-plugin.json', plugin || { missing: pluginId });
  if (!plugin?.enabled) {
    throw new Error(`Grafana plugin "${pluginId}" is not enabled. Check the plugin install path and GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS.`);
  }

  const bundleIndex = await fetchJson(
    `${grafanaBaseUrl}/api/plugins/${pluginId}/resources/bundles?root=${encodeURIComponent(bundleRoot)}`
  );
  writeJson('bundle-index.json', bundleIndex);
  if (!bundleIndex.bundles?.some((bundle) => bundle.id === bundleId)) {
    throw new Error(`Mounted bundle "${bundleId}" was not discovered under ${bundleRoot}: ${JSON.stringify(bundleIndex, null, 2)}`);
  }
}

async function verifyPrometheus() {
  const buildInfo = await waitFor('Prometheus build info', async () => {
    const payload = await fetchJson(`${prometheusBaseUrl}/api/v1/status/buildinfo`);
    return payload.status === 'success' ? payload.data : undefined;
  });
  writeJson('prometheus-buildinfo.json', buildInfo);

  const targets = await fetchJson(`${prometheusBaseUrl}/api/v1/targets`);
  writeJson('prometheus-targets.json', targets);
  const unhealthyTargets = (targets.data?.activeTargets || [])
    .filter((target) => target.health !== 'up')
    .map((target) => ({
      scrapeUrl: target.scrapeUrl,
      labels: target.labels,
      health: target.health,
      lastError: target.lastError
    }));
  if (unhealthyTargets.length) {
    throw new Error(`Prometheus has unhealthy targets: ${JSON.stringify(unhealthyTargets, null, 2)}`);
  }

  const linkState = await waitForPrometheusValue(
    'TopoViewer link state recording rules',
    `count(topoviewer_st_link_up{topology="${topologyLabel}"})`,
    (value) => value >= 9
  );
  writeJson('query-link-state-count.json', linkState);

  const directionCount = await waitForPrometheusValue(
    'TopoViewer direction recording rules',
    `count(topoviewer_st_link_direction_bps{topology="${topologyLabel}"})`,
    (value) => value >= 18
  );
  writeJson('query-direction-count.json', directionCount);

  if (requireTraffic) {
    runOptionalTrafficCommand();
    const traffic = await waitForPrometheusValue(
      'TopoViewer live direction traffic',
      `max(topoviewer_st_link_direction_bps{topology="${topologyLabel}"})`,
      (value) => value > 0,
      180_000
    );
    writeJson('query-direction-max.json', traffic);
  }
}

function parseCoverage(text) {
  const match = text.match(/Mapper coverage:\s+(\d+)\/(\d+) samples resolved .*?(\d+) unresolved .*?(\d+) ambiguous/s);
  if (!match) return undefined;
  return {
    resolved: Number(match[1]),
    total: Number(match[2]),
    unresolved: Number(match[3]),
    ambiguous: Number(match[4])
  };
}

async function verifyDashboard() {
  const browser = await chromium.launch();
  const consoleMessages = [];
  try {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1600, height: 1000 }
    });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleMessages.push(`CONSOLE ${message.text()}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) consoleMessages.push(`HTTP ${response.status()} ${response.url()}`);
    });

    await page.goto(dashboardUrl, { waitUntil: 'networkidle', timeout: 90_000 });
    const panel = page.locator('[data-testid="topoviewer-grafana-panel"]').first();
    await panel.waitFor({ state: 'visible', timeout: 90_000 });
    await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length >= 8, undefined, {
      timeout: 90_000
    });
    const status = page.locator('[data-testid="topoviewer-grafana-telemetry-status"]').first();
    await status.waitFor({ state: 'visible', timeout: 90_000 });
    await page.waitForFunction(() => {
      const text = document.querySelector('[data-testid="topoviewer-grafana-telemetry-status"]')?.textContent || '';
      return text.includes('Mapper coverage:');
    }, undefined, { timeout: 90_000 });

    const bodyText = await page.locator('body').innerText();
    writeText('dashboard-text.txt', bodyText);
    const coverage = parseCoverage(bodyText);
    writeJson('mapper-coverage.json', coverage || { error: 'coverage text not found' });
    if (!coverage) throw new Error(`Mapper coverage text was not found in dashboard body: ${bodyText.slice(0, 1000)}`);
    if (coverage.total < 27 || coverage.resolved !== coverage.total || coverage.unresolved !== 0 || coverage.ambiguous !== 0) {
      throw new Error(`Unexpected mapper coverage: ${JSON.stringify(coverage)}`);
    }

    const diagnostics = page.locator('[data-testid="topoviewer-grafana-diagnostics"]');
    if (await diagnostics.count()) {
      throw new Error(`Dashboard rendered blocking diagnostics: ${await diagnostics.first().innerText()}`);
    }

    await page.screenshot({ path: artifactPath('topoviewer-dashboard.png'), fullPage: true });
  } finally {
    if (consoleMessages.length) writeText('browser-console.log', `${consoleMessages.join('\n')}\n`);
    await browser.close();
  }
}

fs.mkdirSync(artifactRoot, { recursive: true });
writeJson('smoke-config.json', {
  grafanaBaseUrl,
  prometheusBaseUrl,
  bundleRoot,
  bundleId,
  topologyLabel,
  dashboardUrl,
  requireTraffic,
  trafficCommand: trafficCommand || null
});

await verifyGrafana();
await verifyPrometheus();
await verifyDashboard();

console.log(`Upstream-candidate TopoViewer smoke passed: ${dashboardUrl}`);
console.log(`Artifacts: ${path.relative(repoRoot, artifactRoot)}`);
