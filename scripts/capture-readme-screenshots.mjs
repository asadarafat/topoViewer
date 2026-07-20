#!/usr/bin/env node

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import {
  absoluteRepoPath,
  canonicalBundle as canonicalBundleDefinition,
  canonicalBundleSources,
  documentationScreenshots,
  grafanaCaptureImage,
  pngDimensions,
  releaseVersion,
  screenshotGenerator,
  screenshotManifestPath,
  screenshotManifestSchemaVersion,
  sha256
} from './lib/docs-screenshot-catalog.mjs';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';

const repoRoot = absoluteRepoPath('.');
const packageRoot = absoluteRepoPath('packages/topoviewer-studio');
const siteRoot = absoluteRepoPath('site');
const outputRoot = absoluteRepoPath('docs/assets/readme');
const manifestPath = absoluteRepoPath(screenshotManifestPath);
const diagramPath = absoluteRepoPath('docs/assets/topoviewer-yaml-to-diagram.png');
const collagePath = absoluteRepoPath('docs/assets/topoviewer-yaml-to-graph-collage.png');
const canonicalSources = canonicalBundleSources();
const canonicalBundle = {
  ...canonicalBundleDefinition,
  ...canonicalSources
};
const studioViewport = { height: 900, width: 1600 };
const grafanaViewport = { height: 1000, width: 1600 };
const collageViewport = { height: 1600, width: 2200 };
const host = '127.0.0.1';
const studioPort = Number(process.env.TOPOVIEWER_DOCS_CAPTURE_PORT || 5185);
const grafanaPort = Number(process.env.TOPOVIEWER_DOCS_GRAFANA_CAPTURE_PORT || 5186);
const studioBaseUrl = `http://${host}:${studioPort}`;

function imageEntry({ absolutePath, file, repositoryPath, scenario }) {
  const bytes = fs.readFileSync(absolutePath);
  const asset = documentationScreenshots.find((candidate) => candidate.file === file);
  if (!asset || asset.path !== repositoryPath) {
    throw new Error(`Screenshot ${file} is not owned by the documentation screenshot catalog.`);
  }
  return {
    file,
    path: repositoryPath,
    scenario,
    surface: asset.surface,
    ...pngDimensions(bytes),
    sha256: sha256(bytes)
  };
}

function imageDataUrl(absolutePath) {
  return `data:image/png;base64,${fs.readFileSync(absolutePath).toString('base64')}`;
}

function canonicalBundleManifest() {
  return {
    id: canonicalBundle.id,
    files: canonicalBundleDefinition.files.map(({ kind, path: sourcePath }) => ({
      kind,
      path: sourcePath,
      sha256: sha256(Buffer.from(canonicalBundle[kind].text))
    }))
  };
}

function studioProjectFromCanonicalBundle() {
  const timestamp = '2026-07-19T00:00:00.000Z';
  const document = (kind, source) => ({
    contentHash: `sha256-${sha256(Buffer.from(source.text))}`,
    kind,
    path: path.basename(source.path),
    text: source.text
  });
  return {
    assets: [],
    documents: {
      topology: document('topology', canonicalBundle.topology),
      stylesheet: document('stylesheet', canonicalBundle.stylesheet),
      mapper: document('mapper', canonicalBundle.mapper)
    },
    id: 'readme-st-clos',
    metadata: {
      createdAt: timestamp,
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: timestamp
    },
    name: canonicalBundle.name,
    revision: 'readme-st-clos'
  };
}

async function assertPortFree(port, label) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () => reject(new Error(`${label} capture port ${host}:${port} is already in use.`)));
    server.once('listening', () => server.close(resolve));
    server.listen(port, host);
  });
}

async function waitForStudio(server) {
  const deadline = Date.now() + 45_000;
  let lastError;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Studio capture server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch(`${studioBaseUrl}/__topoviewer-studio-test-marker.json`, { cache: 'no-store' });
      if (response.ok && (await response.json()).package === 'topoviewer-studio') return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Studio capture server did not become ready: ${lastError instanceof Error ? lastError.message : String(lastError || 'timeout')}`);
}

async function settleStudio(page, { minimumNodes, projectName }) {
  await page.getByText('TopoViewer Studio', { exact: true }).waitFor({ timeout: 30_000 });
  await page.getByText(projectName, { exact: true }).first().waitFor({ timeout: 30_000 });
  await page.getByRole('region', { name: 'Topology canvas' }).waitFor({ timeout: 30_000 });
  await page.waitForFunction((count) => document.querySelectorAll('.react-flow__node').length >= count, minimumNodes);
  await page.evaluate(async () => document.fonts.ready);
  await page.waitForTimeout(500);
}

async function installCanonicalStudioProject(page) {
  const project = studioProjectFromCanonicalBundle();
  await page.evaluate(async (projectRecord) => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('topoviewer-studio', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open Studio storage.'));
    });
    try {
      const transaction = database.transaction(['assets', 'projects', 'recoveries'], 'readwrite');
      transaction.objectStore('assets').clear();
      transaction.objectStore('projects').clear();
      transaction.objectStore('recoveries').clear();
      transaction.objectStore('projects').add({
        id: projectRecord.id,
        openedAt: projectRecord.metadata.updatedAt,
        project: projectRecord,
        updatedAt: projectRecord.metadata.updatedAt
      });
      await new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onabort = () => reject(transaction.error || new Error('Studio storage transaction was aborted.'));
        transaction.onerror = () => reject(transaction.error || new Error('Studio storage transaction failed.'));
      });
    } finally {
      database.close();
    }
  }, project);
}

async function capturePage(page, { absolutePath, file, repositoryPath, scenario }) {
  await page.screenshot({ animations: 'disabled', path: absolutePath });
  return imageEntry({ absolutePath, file, repositoryPath, scenario });
}

async function captureStudio(context) {
  const page = await context.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(studioBaseUrl) && !response.url().endsWith('/favicon.ico')) {
      browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(studioBaseUrl, { waitUntil: 'networkidle', timeout: 45_000 });
    await settleStudio(page, { minimumNodes: 3, projectName: 'Backbone topology' });
    await installCanonicalStudioProject(page);
    await page.reload({ waitUntil: 'networkidle', timeout: 45_000 });
    await settleStudio(page, { minimumNodes: 8, projectName: canonicalBundle.name });
    const visualScreenshot = await capturePage(page, {
      absolutePath: path.join(outputRoot, 'studio-visual.png'),
      file: 'studio-visual.png',
      repositoryPath: 'docs/assets/readme/studio-visual.png',
      scenario: `Browser Studio opens the canonical ${canonicalBundle.id} bundle in the Visual authoring workspace.`
    });

    await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Edit' }).click();
    const editWorkspace = page.getByRole('complementary', { name: 'Edit workspace' });
    await editWorkspace.getByRole('group', { name: 'Edit representation' }).getByRole('button', { name: 'Code' }).click();
    await editWorkspace.getByLabel('topology YAML editor').waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => document.querySelectorAll('.monaco-editor .view-line').length > 10);
    await page.addStyleTag({
      content: `
        .monaco-editor .cursor,
        .monaco-editor .cursors-layer,
        .monaco-editor .monaco-scrollable-element > .scrollbar {
          visibility: hidden !important;
        }
      `
    });
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.waitForTimeout(500);
    const codeScreenshot = await capturePage(page, {
      absolutePath: diagramPath,
      file: 'topoviewer-yaml-to-diagram.png',
      repositoryPath: 'docs/assets/topoviewer-yaml-to-diagram.png',
      scenario: `Browser Studio shows the canonical ${canonicalBundle.id} topology YAML beside its live rendered diagram.`
    });

    if (browserErrors.length) throw new Error(`Studio emitted browser errors:\n${browserErrors.join('\n')}`);
    return [visualScreenshot, codeScreenshot];
  } finally {
    await page.close();
  }
}

async function enableDocsBlackMode(page) {
  const darkModeToggle = page.locator('label[title="Switch to dark mode"]').first();
  if (await darkModeToggle.count()) {
    await darkModeToggle.click({ force: true });
  }

  await page.evaluate(() => {
    const palette = { index: 1, color: { scheme: 'slate', primary: 'blue', accent: 'cyan' } };
    try {
      window.localStorage.setItem('__palette', JSON.stringify(palette));
    } catch {
      // The capture still applies the palette directly when storage is unavailable.
    }

    document.documentElement.style.colorScheme = 'dark';
    document.body.setAttribute('data-md-color-scheme', 'slate');
    document.body.setAttribute('data-md-color-primary', 'blue');
    document.body.setAttribute('data-md-color-accent', 'cyan');
    document.body.style.setProperty('--md-default-bg-color', '#121212');
    document.body.style.setProperty('--md-default-fg-color', '#f5f5f5');
    document.body.style.setProperty('--md-default-fg-color--light', '#c7c7c7');
    document.body.style.setProperty('--md-default-fg-color--lighter', '#9e9e9e');
    document.body.style.setProperty('--md-default-fg-color--lightest', '#424242');
    document.body.style.setProperty('--md-primary-fg-color', '#121212');
    document.body.style.setProperty('--md-primary-bg-color', '#f5f5f5');
    document.body.style.setProperty('--md-code-bg-color', '#1d1d1d');
    document.body.style.setProperty('--md-code-fg-color', '#eeeeee');
  });

  await page.addStyleTag({
    content: `
      html, body, .md-container, .md-main, .md-content, .md-sidebar,
      .md-sidebar__scrollwrap, .md-nav, .md-typeset {
        background-color: #121212 !important;
        caret-color: transparent !important;
        color: #f5f5f5 !important;
      }

      .md-header, .md-tabs, .md-search__form, .md-search__input {
        background-color: #181818 !important;
        color: #f5f5f5 !important;
      }

      .md-nav__link, .md-typeset p, .md-typeset li, .md-typeset table {
        color: #d0d0d0 !important;
      }

      .md-typeset h1, .md-typeset h2, .md-typeset h3, .md-typeset h4,
      .md-typeset strong, .tabbed-labels > label {
        color: #f5f5f5 !important;
      }

      .md-source {
        display: none !important;
      }
    `
  });
}

async function captureDocsSurface(context, { baseUrl, file, label, route }) {
  const page = await context.newPage();
  const absolutePath = path.join(outputRoot, file);
  const docsOrigin = new URL(baseUrl).origin;
  await page.route('**/*', (request) => {
    if (new URL(request.request().url()).origin === docsOrigin) return request.fallback();
    return request.abort('blockedbyclient');
  });
  await page.route('**/examples/graph/basic/topology.yaml', (request) =>
    request.fulfill({ body: canonicalBundle.topology.text, contentType: 'application/yaml; charset=utf-8' })
  );
  await page.route('**/examples/graph/basic/stylesheet.yaml', (request) =>
    request.fulfill({ body: canonicalBundle.stylesheet.text, contentType: 'application/yaml; charset=utf-8' })
  );
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('__palette', JSON.stringify({
        index: 1,
        color: { scheme: 'slate', primary: 'blue', accent: 'cyan' }
      }));
    } catch {
      // The docs remain usable when storage is unavailable.
    }
  });

  try {
    await page.goto(`${baseUrl}${pagesBasePath}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
    await enableDocsBlackMode(page);
    await page.waitForFunction(() => document.querySelectorAll('.react-flow__node').length >= 8, null, { timeout: 45_000 });
    const viewer = page.locator('.topoviewer').first();
    await viewer.scrollIntoViewIfNeeded();
    await viewer.getByRole('button', { name: 'Fit View' }).click();
    await page.evaluate((title) => {
      document.title = `${title} - TopoViewer`;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode) {
        if (textNode.nodeValue?.includes('Graph basic')) {
          textNode.nodeValue = textNode.nodeValue.replaceAll('Graph basic', title);
        }
        textNode = walker.nextNode();
      }
    }, canonicalBundle.name);
    await page.evaluate(async () => document.fonts.ready);
    await page.waitForTimeout(750);
    return await capturePage(page, {
      absolutePath,
      file,
      repositoryPath: `docs/assets/readme/${file}`,
      scenario: `${label} renders the canonical ${canonicalBundle.id} topology and stylesheet inside the generated documentation shell.`
    });
  } finally {
    await page.close();
  }
}

function runDocker(args, { allowFailure = false, timeout = 180_000 } = {}) {
  const result = spawnSync('docker', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout
  });
  if (result.error && !allowFailure) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`docker ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result;
}

function assertDockerAvailable() {
  const result = runDocker(['info', '--format', '{{.ServerVersion}}'], { allowFailure: true, timeout: 20_000 });
  if (result.status !== 0 || !result.stdout.trim()) {
    throw new Error('Documentation screenshot capture requires a running Docker engine for the Grafana surface.');
  }
}

function createGrafanaCaptureWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-docs-grafana-'));
  const dashboardDirectory = path.join(workspace, 'dashboards');
  fs.mkdirSync(dashboardDirectory, { recursive: true });

  const sourceDashboard = JSON.parse(fs.readFileSync(
    absoluteRepoPath('labs/grafana-topoviewer/containerlab/configs/grafana/dashboards/topoviewer-containerlab.json'),
    'utf8'
  ));
  const sourcePanel = sourceDashboard.panels.find((panel) => panel.type === 'asadarafat-topoviewer-panel');
  if (!sourcePanel) throw new Error('The canonical Grafana dashboard does not contain the TopoViewer panel.');

  const panel = structuredClone(sourcePanel);
  delete panel.datasource;
  panel.gridPos = { h: 25, w: 24, x: 0, y: 0 };
  panel.options = {
    ...panel.options,
    controlsOpen: false,
    fixtureId: canonicalBundle.id,
    mountedBundle: {
      bundleRoot: '/etc/topoviewer/bundles',
      selectedBundleId: canonicalBundle.id
    },
    showControls: true,
    sourceMode: 'mountedBundle',
    telemetry: {
      ...panel.options.telemetry,
      enabled: false
    },
    themeMode: 'dark'
  };
  panel.targets = [];
  panel.title = `${canonicalBundle.name} - TopoViewer`;

  const dashboard = {
    annotations: { list: [] },
    editable: false,
    fiscalYearStartMonth: 0,
    graphTooltip: 0,
    id: null,
    links: [],
    panels: [panel],
    refresh: '',
    schemaVersion: sourceDashboard.schemaVersion,
    tags: ['topoviewer', 'release-media'],
    templating: { list: [] },
    time: { from: '2026-07-19T00:00:00.000Z', to: '2026-07-19T00:15:00.000Z' },
    timezone: 'utc',
    title: 'TopoViewer release media',
    uid: 'topoviewer-release-media',
    version: 1
  };
  fs.writeFileSync(path.join(dashboardDirectory, 'release-media.json'), `${JSON.stringify(dashboard, null, 2)}\n`);
  fs.writeFileSync(path.join(workspace, 'dashboards.yaml'), [
    'apiVersion: 1',
    '',
    'providers:',
    '  - name: topoviewer-release-media',
    '    type: file',
    '    updateIntervalSeconds: 5',
    '    allowUiUpdates: false',
    '    options:',
    '      path: /var/lib/grafana/dashboards',
    ''
  ].join('\n'));
  return { dashboardDirectory, workspace };
}

async function waitForGrafana(containerName) {
  const deadline = Date.now() + 90_000;
  let lastError;
  while (Date.now() < deadline) {
    const state = runDocker(['inspect', '--format', '{{.State.Running}}', containerName], {
      allowFailure: true,
      timeout: 10_000
    });
    if (state.status !== 0 || state.stdout.trim() !== 'true') {
      throw new Error(`Grafana capture container exited before it became ready.\n${runDocker(['logs', containerName], { allowFailure: true }).stdout}`);
    }
    try {
      const baseUrl = `http://${host}:${grafanaPort}`;
      const [health, dashboard, plugin, bundles] = await Promise.all([
        fetch(`${baseUrl}/api/health`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/dashboards/uid/topoviewer-release-media`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/plugins`, { cache: 'no-store' }),
        fetch(`${baseUrl}/api/plugins/asadarafat-topoviewer-panel/resources/bundles?root=${encodeURIComponent('/etc/topoviewer/bundles')}`, { cache: 'no-store' })
      ]);
      if (health.ok && dashboard.ok && plugin.ok && bundles.ok) {
        const plugins = await plugin.json();
        const pluginSettings = plugins.find((entry) => entry.id === 'asadarafat-topoviewer-panel');
        const bundleIndex = await bundles.json();
        const bundleEntries = Array.isArray(bundleIndex) ? bundleIndex : bundleIndex.bundles;
        if (pluginSettings.enabled && Array.isArray(bundleEntries)
          && bundleEntries.some((bundle) => bundle.id === canonicalBundle.id)) return;
        lastError = new Error(`Grafana dependencies are incomplete: plugin enabled=${Boolean(pluginSettings.enabled)}, ${canonicalBundle.id} discovered=${Boolean(bundleEntries?.some((bundle) => bundle.id === canonicalBundle.id))}.`);
      } else {
        lastError = new Error(`Grafana readiness responses: health=${health.status}, dashboard=${dashboard.status}, plugin=${plugin.status}, bundles=${bundles.status}.`);
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const logs = runDocker(['logs', containerName], { allowFailure: true }).stdout;
  throw new Error(`Grafana did not become ready: ${lastError instanceof Error ? lastError.message : String(lastError || 'timeout')}\n${logs}`);
}

async function captureGrafana(context) {
  assertDockerAvailable();
  await assertPortFree(grafanaPort, 'Grafana');

  const pluginRoot = absoluteRepoPath('packages/grafana-topoviewer-panel/dist');
  for (const requiredFile of ['module.js', 'plugin.json']) {
    if (!fs.existsSync(path.join(pluginRoot, requiredFile))) {
      throw new Error(`Grafana capture requires ${path.join(pluginRoot, requiredFile)}. Run \`npm run grafana:panel:build\` first.`);
    }
  }
  if (!fs.readdirSync(pluginRoot).some((file) => file.startsWith('gpx_topoviewer-panel_linux_'))) {
    throw new Error('Grafana capture requires the built Linux panel backend. Run `npm run grafana:panel:build` first.');
  }

  const capture = createGrafanaCaptureWorkspace();
  const containerName = `topoviewer-docs-grafana-${process.pid}`;
  const page = await context.newPage();
  await page.setViewportSize(grafanaViewport);
  const browserDiagnostics = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserDiagnostics.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => browserDiagnostics.push(`page: ${error.message}`));
  page.on('requestfailed', (request) => browserDiagnostics.push(`request: ${request.url()} (${request.failure()?.errorText || 'failed'})`));
  let containerStarted = false;
  try {
    runDocker([
      'run', '--detach',
      '--name', containerName,
      '--publish', `${host}:${grafanaPort}:3000`,
      '--env', 'GF_ANALYTICS_CHECK_FOR_UPDATES=false',
      '--env', 'GF_ANALYTICS_REPORTING_ENABLED=false',
      '--env', 'GF_AUTH_ANONYMOUS_ENABLED=true',
      '--env', 'GF_AUTH_ANONYMOUS_ORG_ROLE=Admin',
      '--env', 'GF_AUTH_DISABLE_LOGIN_FORM=true',
      '--env', 'GF_LOG_LEVEL=error',
      '--env', 'GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=asadarafat-topoviewer-panel',
      '--env', 'GF_PLUGINS_PREINSTALL_DISABLED=true',
      '--env', 'GF_USERS_DEFAULT_THEME=dark',
      '--env', 'TOPOVIEWER_BUNDLE_ROOT=/etc/topoviewer/bundles',
      '--volume', `${pluginRoot}:/var/lib/grafana/plugins/asadarafat-topoviewer-panel:ro`,
      '--volume', `${absoluteRepoPath('labs/grafana-topoviewer/topoviewer-bundles')}:/etc/topoviewer/bundles:ro`,
      '--volume', `${path.join(capture.workspace, 'dashboards.yaml')}:/etc/grafana/provisioning/dashboards/release-media.yaml:ro`,
      '--volume', `${capture.dashboardDirectory}:/var/lib/grafana/dashboards:ro`,
      grafanaCaptureImage
    ]);
    containerStarted = true;
    await waitForGrafana(containerName);

    const dashboardUrl = `http://${host}:${grafanaPort}/d/topoviewer-release-media/topoviewer-release-media?orgId=1&theme=dark&timezone=utc&from=1784419200000&to=1784420100000`;
    await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForFunction(() => document.querySelectorAll('.react-flow__node').length >= 8, null, { timeout: 60_000 });
    await page.getByRole('button', { name: 'Fit View' }).last().click();
    await page.addStyleTag({
      content: '*, *::before, *::after { animation: none !important; caret-color: transparent !important; transition: none !important; }'
    });
    await page.mouse.move(0, 0);
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.evaluate(async () => document.fonts.ready);
    await page.waitForTimeout(750);
    return await capturePage(page, {
      absolutePath: path.join(outputRoot, 'grafana-panel.png'),
      file: 'grafana-panel.png',
      repositoryPath: 'docs/assets/readme/grafana-panel.png',
      scenario: `Grafana ${grafanaCaptureImage} renders the canonical ${canonicalBundle.id} mounted bundle with the built TopoViewer panel and deterministic telemetry disabled.`
    });
  } catch (error) {
    const logs = containerStarted ? runDocker(['logs', containerName], { allowFailure: true }).stdout.trim() : '';
    const diagnosticsRoot = absoluteRepoPath('.artifacts/docs-screenshots');
    fs.mkdirSync(diagnosticsRoot, { recursive: true });
    await page.screenshot({ animations: 'disabled', path: path.join(diagnosticsRoot, 'grafana-failure.png') }).catch(() => undefined);
    const bodyText = await page.locator('body').innerText().catch(() => 'unavailable');
    throw new Error([
      error instanceof Error ? error.message : String(error),
      `Grafana URL: ${page.url()}`,
      `Grafana page: ${bodyText.slice(0, 2_000)}`,
      browserDiagnostics.length ? `Browser diagnostics:\n${browserDiagnostics.join('\n')}` : '',
      logs ? `Grafana logs:\n${logs}` : '',
      `Failure screenshot: ${path.relative(repoRoot, path.join(diagnosticsRoot, 'grafana-failure.png'))}`
    ].filter(Boolean).join('\n'));
  } finally {
    await page.close();
    if (containerStarted) runDocker(['rm', '--force', containerName], { allowFailure: true, timeout: 30_000 });
    fs.rmSync(capture.workspace, { force: true, recursive: true });
  }
}

function collageHtml(images) {
  const cards = [
    {
      title: 'TopoViewer Studio',
      subtitle: 'Author visually and edit source in one workspace.',
      image: images.studio
    },
    {
      title: 'MkDocs',
      subtitle: 'Publish live YAML diagrams in supported documentation.',
      image: images.mkdocs
    },
    {
      title: 'Zensical',
      subtitle: 'Reuse the generated documentation source in another shell.',
      image: images.zensical
    },
    {
      title: 'Grafana TopoViewer panel',
      subtitle: 'Render the same bundle before applying runtime overlays.',
      image: images.grafana
    }
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TopoViewer product surfaces</title>
    <style>
      :root { color-scheme: dark; --bg: #080808; --panel: #121212; --panel-2: #181818; --border: #3a3a3a; --blue: #8fd0ff; --text: #f8fafc; --muted: #b0b0b0; }
      * { box-sizing: border-box; }
      body { margin: 0; width: 2200px; height: 1600px; overflow: hidden; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--text); background: var(--bg); }
      main { width: 100%; height: 100%; padding: 48px 54px; }
      header { display: flex; justify-content: space-between; align-items: flex-end; gap: 32px; margin-bottom: 28px; }
      h1 { margin: 0; max-width: 1550px; font-size: 58px; line-height: 1.05; letter-spacing: 0; }
      h1 span { color: var(--blue); }
      .badge, code { border: 1px solid #2563a8; background: #102b47; color: #d8efff; border-radius: 999px; padding: 11px 17px; font-size: 20px; font-weight: 800; }
      .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 28px; }
      .card { min-width: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: var(--panel); box-shadow: 0 20px 54px rgba(0, 0, 0, 0.28); }
      .card-head { display: flex; justify-content: space-between; align-items: center; gap: 20px; min-height: 82px; padding: 17px 20px; border-bottom: 1px solid var(--border); background: var(--panel-2); }
      .card-title { flex: 0 0 auto; color: var(--text); font-size: 25px; font-weight: 800; }
      .card-subtitle { max-width: 610px; color: var(--muted); font-size: 16px; font-weight: 650; line-height: 1.3; text-align: right; }
      .shot { height: 510px; padding: 10px; background: #0a0a0a; }
      .shot img { display: block; width: 100%; height: 100%; object-fit: contain; border-radius: 6px; background: #0a0a0a; }
      footer { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; color: var(--muted); font-size: 21px; font-weight: 750; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>One topology bundle. <span>Four surfaces.</span></h1>
        <div class="badge">Topology as Code</div>
      </header>
      <section class="cards">
        ${cards.map((card) => `
          <article class="card">
            <div class="card-head">
              <div class="card-title">${card.title}</div>
              <div class="card-subtitle">${card.subtitle}</div>
            </div>
            <div class="shot"><img src="${card.image}" alt="${card.title} screenshot" /></div>
          </article>
        `).join('')}
      </section>
      <footer>
        <div>Canonical bundle: <code>${canonicalBundle.id}</code></div>
        <div>Studio · MkDocs · Zensical · Grafana</div>
      </footer>
    </main>
  </body>
</html>`;
}

async function captureCollage(context) {
  const page = await context.newPage();
  await page.setViewportSize(collageViewport);
  try {
    await page.setContent(collageHtml({
      studio: imageDataUrl(path.join(outputRoot, 'studio-visual.png')),
      mkdocs: imageDataUrl(path.join(outputRoot, 'mkdocs.png')),
      zensical: imageDataUrl(path.join(outputRoot, 'zensical.png')),
      grafana: imageDataUrl(path.join(outputRoot, 'grafana-panel.png'))
    }), { waitUntil: 'load' });
    await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
    await page.evaluate(async () => document.fonts.ready);
    await page.screenshot({ animations: 'disabled', path: collagePath });
    return imageEntry({
      absolutePath: collagePath,
      file: 'topoviewer-yaml-to-graph-collage.png',
      repositoryPath: 'docs/assets/topoviewer-yaml-to-graph-collage.png',
      scenario: `The canonical ${canonicalBundle.id} bundle shown in Studio, MkDocs, Zensical, and Grafana.`
    });
  } finally {
    await page.close();
  }
}

await assertPortFree(studioPort, 'Studio');
if (!fs.existsSync(path.join(siteRoot, 'docs/mkdocs/index.html'))) {
  throw new Error('README capture requires the generated site/ tree. Run `npm run docs:build:parallel` first.');
}
fs.mkdirSync(outputRoot, { recursive: true });

const viteBin = path.join(repoRoot, 'node_modules/vite/bin/vite.js');
const studioServer = spawn(process.execPath, [
  viteBin,
  '--host', host,
  '--port', String(studioPort),
  '--strictPort',
  '--config', path.join(packageRoot, 'vite.config.ts')
], {
  cwd: packageRoot,
  env: { ...process.env, TOPOVIEWER_STUDIO_BASE: '/' },
  stdio: ['ignore', 'pipe', 'pipe']
});
let serverLog = '';
studioServer.stdout.on('data', (chunk) => { serverLog += chunk.toString(); });
studioServer.stderr.on('data', (chunk) => { serverLog += chunk.toString(); });

let browser;
let docsServer;
try {
  await waitForStudio(studioServer);
  const docs = await createDocsStaticServer({ siteRoot, host, port: 0, basePath: pagesBasePath });
  docsServer = docs.server;
  browser = await chromium.launch();
  const context = await browser.newContext({
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    viewport: studioViewport
  });
  const screenshots = await captureStudio(context);
  screenshots.push(await captureDocsSurface(context, {
    baseUrl: docs.baseUrl,
    file: 'mkdocs.png',
    label: 'MkDocs',
    route: '/docs/mkdocs/topoviewer/examples/graph/basic/'
  }));
  screenshots.push(await captureDocsSurface(context, {
    baseUrl: docs.baseUrl,
    file: 'zensical.png',
    label: 'Zensical',
    route: '/docs/zensical/topoviewer/examples/graph/basic/'
  }));
  screenshots.push(await captureGrafana(context));
  screenshots.push(await captureCollage(context));

  const orderedScreenshots = documentationScreenshots.map((asset) => {
    const screenshot = screenshots.find((entry) => entry.file === asset.file);
    if (!screenshot) throw new Error(`Capture did not produce catalog image ${asset.file}.`);
    return screenshot;
  });
  const version = releaseVersion();
  fs.writeFileSync(manifestPath, `${JSON.stringify({
    schemaVersion: screenshotManifestSchemaVersion,
    releaseVersion: version,
    generator: screenshotGenerator,
    canonicalBundle: canonicalBundleManifest(),
    captureEnvironment: {
      grafanaImage: grafanaCaptureImage,
      colorScheme: 'dark',
      locale: 'en-US',
      timezone: 'UTC'
    },
    viewport: studioViewport,
    screenshots: orderedScreenshots
  }, null, 2)}\n`);
  console.log(`Captured and verified ${orderedScreenshots.length} documentation images for release ${version}.`);
} catch (error) {
  if (serverLog.trim()) console.error(serverLog.trim());
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => docsServer?.close(resolve) || resolve());
  if (studioServer.exitCode === null) {
    studioServer.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => studioServer.once('exit', resolve)),
      new Promise((resolve) => setTimeout(resolve, 3_000))
    ]);
  }
}
