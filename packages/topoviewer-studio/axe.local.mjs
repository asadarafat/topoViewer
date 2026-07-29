import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
const page = await context.newPage();
await page.goto('http://127.0.0.1:5177/?__studio-test-state=mapper-coverage', { waitUntil: 'load' });
await page.getByRole('region', { name: 'Topology canvas' }).waitFor({ timeout: 20000 });
await page.waitForTimeout(1200);
await page.getByRole('tablist', { name: 'Workspace views' }).getByRole('tab', { name: 'Add' }).click();
await page.waitForTimeout(900);
const result = await new AxeBuilder({ page }).analyze();
for (const violation of result.violations) {
  console.log('VIOLATION', violation.id, violation.impact, violation.nodes.length);
  for (const node of violation.nodes.slice(0, 6)) console.log('   ', node.target.join(' '), '|', node.html.slice(0, 110));
}
if (!result.violations.length) console.log('no violations');
await browser.close();
