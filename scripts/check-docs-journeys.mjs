import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.artifacts/docs-journeys');
fs.mkdirSync(out, { recursive: true });
const { server, baseUrl } = await createDocsStaticServer({ siteRoot: path.join(root, 'site') });
const browser = await chromium.launch();
const results = [];
const failures = [];
async function check(label, run) {
  try { await run(); results.push({ label, passed: true }); console.log(`PASS ${label}`); }
  catch (error) { failures.push(`${label}: ${error.message}`); results.push({ label, passed: false, error: error.message }); console.error(`FAIL ${label}: ${error.message}`); }
}
try {
  for (const host of ['mkdocs', 'zensical']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();
    const url = (route = '') => `${baseUrl}${pagesBasePath}/docs/${host}/${route}`;
    await check(`${host} publication and task navigation`, async () => {
      const response = await page.goto(url(), { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await expect(page.locator('.tv-docs-version')).toContainText('Development documentation');
      for (const label of ['Get started', 'Author diagrams', 'Integrate', 'Troubleshoot and upgrade', 'Contribute']) {
        await expect(page.locator('.md-sidebar--primary')).toContainText(label);
      }
      const first = page.locator('.tv-start-grid a').first();
      expect((await first.boundingBox()).y).toBeLessThan(650);
      const metadata = await (await page.request.get(url('documentation-build.json'))).json();
      expect(metadata.channel).toBe('development');
      expect(metadata.revision).toMatch(/^[a-f0-9]{40}$/);
      if (host === 'zensical') expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain('/docs/mkdocs/');
    });
    for (const route of ['', 'topoviewer/start/first-topology/', 'topoviewer/examples/']) {
      for (const scheme of ['default', 'slate']) {
        await check(`${host} ${route || 'home'} ${scheme} accessibility`, async () => {
          await page.goto(url(route), { waitUntil: 'networkidle' });
          if (await page.locator('body').getAttribute('data-md-color-scheme') !== scheme) {
            await page.locator(`label[for="__palette_${scheme === 'slate' ? 1 : 0}"]`).click();
          }
          await expect(page.locator('body')).toHaveAttribute('data-md-color-scheme', scheme);
          // Let the host's theme transition finish before measuring contrast.
          await page.waitForTimeout(250);
          const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
          const defects = report.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) }));
          fs.writeFileSync(path.join(out, `${host}-${scheme}-${route ? route.split('/').filter(Boolean).at(-1) : 'home'}-axe.json`), JSON.stringify(defects, null, 2));
          expect(defects).toEqual([]);
        });
      }
    }
    await check(`${host} beginner result and mobile resize`, async () => {
      await page.goto(url('topoviewer/start/first-topology/'), { waitUntil: 'networkidle' });
      const embed = page.locator('.topoviewer-embed').first();
      await expect(embed.locator('.react-flow__node-network')).toHaveCount(2);
      expect((await embed.boundingBox()).y).toBeLessThan(1100);
      await page.setViewportSize({ width: 390, height: 844 });
      await expect.poll(async () => embed.evaluate((element) => {
        const outer = element.getBoundingClientRect();
        return [...element.querySelectorAll('.react-flow__node-network')].every((node) => {
          const box = node.getBoundingClientRect();
          return box.left >= outer.left - 2 && box.right <= outer.right + 2;
        });
      })).toBe(true);
      await embed.screenshot({ path: path.join(out, `${host}-first-mobile.png`) });
      const expand = embed.getByRole('button', { name: 'Expand diagram', exact: true });
      await expand.click();
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
      await page.keyboard.press('Escape');
      await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
      await page.setViewportSize({ width: 1440, height: 960 });
    });
    await check(`${host} field and callback findability`, async () => {
      await page.setViewportSize({ width: 1440, height: 960 });
      await page.goto(url('topoviewer/reference/object-attributes/'), { waitUntil: 'networkidle' });
      await page.getByRole('link', { name: 'Read node fields', exact: true }).click();
      await expect(page.locator('h1')).toContainText('Node fields');
      await expect(page.locator('article')).toContainText('Stable identifier');
      await page.goto(url('topoviewer/reference/component-props/'), { waitUntil: 'networkidle' });
      await expect(page.locator('h3#onobjectclick')).toBeVisible();
      await expect(page.locator('article')).toContainText('onSelectionChange');
      await expect(page.locator('article')).toContainText('onViewportChange');
    });
    await check(`${host} keyboard search controls`, async () => {
      await page.goto(url(), { waitUntil: 'networkidle' });
      if (host === 'zensical') await page.keyboard.press('Control+k');
      else await page.getByPlaceholder('Search').click();
      const input = page.getByPlaceholder('Search').first();
      await expect(input).toBeFocused();
      await input.pressSequentially('onObjectClick');
      const results = host === 'mkdocs' ? page.locator('.md-search-result__list') : page.locator('.focus-visible').locator('li').filter({ hasText: 'onObjectClick' }).first();
      await expect(results).toContainText('onObjectClick');
      // Audit the settled dialog, after its fade and result insertion complete.
      await page.waitForTimeout(400);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      fs.writeFileSync(path.join(out, `${host}-search-axe.json`), JSON.stringify(report.violations, null, 2));
      expect(report.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
      await page.keyboard.press('Escape');
      await expect(input).not.toBeFocused();
    });
    await page.screenshot({ path: path.join(out, `${host}-home.png`) });
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ results, failures }, null, 2));
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
