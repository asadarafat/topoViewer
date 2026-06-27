#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { loadGrafanaHarnessFixtures } from '../../../scripts/lib/grafana-harness-fixtures.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(labRoot, '../..');
const artifactRoot = path.join(repoRoot, '.artifacts/grafana-phase-1');
const env = parseEnvFile(path.join(labRoot, '.env'));
const grafanaBaseUrl = process.env.GRAFANA_URL || `http://127.0.0.1:${env.GRAFANA_HTTP_PORT || '3000'}`;
const dashboardUrl = `${grafanaBaseUrl}/d/topoviewer-phase-1/topoviewer-phase-1?orgId=1&kiosk`;
const screenshotFixtureIds = new Set(['layered-network', 'clos-2spine-4leaf']);

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

async function waitForGrafana() {
  const healthUrl = `${grafanaBaseUrl}/api/health`;
  const started = Date.now();
  let lastError = '';
  while (Date.now() - started < 60_000) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Grafana did not become healthy at ${healthUrl}: ${lastError}`);
}

async function assertFixtureRendered(page, fixtureId) {
  await page.locator('[data-testid="topoviewer-fixture-select"]').selectOption(fixtureId);
  await page.waitForFunction(() => document.querySelectorAll('.topoviewer .react-flow__node').length > 0);
  const diagnostics = page.locator('[data-testid="topoviewer-grafana-diagnostics"]');
  if (await diagnostics.count()) {
    throw new Error(`Fixture ${fixtureId} rendered diagnostics: ${await diagnostics.first().innerText()}`);
  }
}

async function assertFixtureSelectorUsable(page) {
  const selector = page.locator('[data-testid="topoviewer-fixture-select"]').first();
  const box = await selector.boundingBox();
  if (!box || box.width < 200 || box.height < 28) {
    throw new Error(`Fixture selector is too small for manual use: ${JSON.stringify(box)}`);
  }
}

await waitForGrafana();
fs.mkdirSync(artifactRoot, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    locale: 'en-US',
    viewport: { width: 1440, height: 1000 }
  });
  await page.goto(dashboardUrl, { waitUntil: 'networkidle' });
  const panel = page.locator('[data-testid="topoviewer-grafana-panel"]').first();
  await panel.waitFor({ state: 'visible', timeout: 60_000 });
  await assertFixtureSelectorUsable(page);

  for (const fixture of loadGrafanaHarnessFixtures(repoRoot)) {
    await assertFixtureRendered(page, fixture.id);
    if (screenshotFixtureIds.has(fixture.id)) {
      await panel.screenshot({
        path: path.join(artifactRoot, `${fixture.id}.png`)
      });
    }
  }

  console.log(`Grafana Phase 1 smoke passed: ${dashboardUrl}`);
  console.log(`Screenshots: ${path.relative(repoRoot, artifactRoot)}`);
} finally {
  await browser.close();
}
