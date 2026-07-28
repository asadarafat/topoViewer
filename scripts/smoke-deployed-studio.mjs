#!/usr/bin/env node

import { chromium, expect } from '@playwright/test';

const deploymentUrl = process.argv[2];
if (!deploymentUrl) {
  console.error('Usage: node scripts/smoke-deployed-studio.mjs <pages-url>');
  process.exit(1);
}

const root = new URL(deploymentUrl.endsWith('/') ? deploymentUrl : `${deploymentUrl}/`);
const studioUrl = new URL('studio/', root).toString();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { height: 920, width: 1440 } });
const errors = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('requestfailed', (request) => errors.push(`${request.failure()?.errorText || 'request failed'} ${request.url()}`));

try {
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      await page.goto(studioUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.getByRole('heading', { name: 'TopoViewer Studio' }).waitFor({ timeout: 20_000 });
      await page.getByRole('region', { name: 'Topology canvas' }).waitFor({ timeout: 20_000 });
      lastError = undefined;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 6) await page.waitForTimeout(attempt * 5_000);
    }
  }
  if (lastError) throw lastError;
  errors.length = 0;

  const rail = page.getByRole('tablist', { name: 'Workspace views' });
  const addTab = rail.getByRole('tab', { name: 'Add' });
  if ((await addTab.getAttribute('aria-selected')) !== 'true') await addTab.click();
  await page.getByTestId('palette-router').click();
  const node = page.locator('.react-flow__node[data-id="router-1"]');
  await node.waitFor({ timeout: 20_000 });
  await node.click();
  const propertiesTab = rail.getByRole('tab', { name: 'Properties' });
  if ((await propertiesTab.getAttribute('aria-selected')) !== 'true') await propertiesTab.click();
  const workspace = page.getByRole('complementary', { name: 'Properties workspace' });
  await workspace.getByRole('searchbox', { name: 'Search style attributes' }).fill('Icon');
  const iconPicker = workspace.getByRole('combobox', { name: 'Icon', exact: true });
  await iconPicker.click();
  const options = page.getByRole('listbox').locator('[role="option"][data-icon-id]');
  if ((await options.count()) < 12) throw new Error(`Deployed Studio exposed only ${await options.count()} icon choices.`);
  await page.getByRole('listbox').locator('[role="option"][data-icon-id="nokia.cloud"]').click();

  await workspace.getByRole('searchbox', { name: 'Search style attributes' }).fill('Background color');
  const backgroundColor = workspace.locator('[data-field-path="backgroundColor"] input[type="text"]');
  await backgroundColor.fill('#123456');
  await backgroundColor.press('Enter');

  const renderedIcon = node.locator('.topoviewer-node-icon-image');
  const readRenderedSvg = () => renderedIcon.evaluate((element) => {
    const source = element.getAttribute('src') || '';
    return source.startsWith('data:image/svg+xml;utf8,')
      ? decodeURIComponent(source.slice(source.indexOf(',') + 1))
      : '';
  });
  await expect.poll(readRenderedSvg, {
    message: 'Deployed Studio should apply the authored node background to the selected SVG icon.',
    timeout: 10_000
  }).toContain('fill="#123456"');
  const renderedSvg = await readRenderedSvg();
  if (!renderedSvg) throw new Error('Deployed Studio did not render the selected node SVG.');
  if (renderedSvg.includes('${')) {
    throw new Error('Deployed Studio leaked unresolved SVG color tokens.');
  }
  if (errors.length > 0) throw new Error(`Browser errors:\n${errors.join('\n')}`);
  console.log(`Deployed Studio smoke passed: ${studioUrl}`);
} finally {
  await browser.close();
}
