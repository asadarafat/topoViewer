const { expect, test } = require('@playwright/test');

for (const surface of ['browser', 'mkdocs', 'zensical', 'react']) {
  test(`renders a Studio-exported bundle through the ${surface} consumer`, async ({ page }) => {
    await page.goto(`/tests/fixtures/studio-export-consumers.html?surface=${surface}`);
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-consumer-surface', surface);
    const expected = await root.getAttribute('data-expected-semantic-hash');
    const rendered = await root.getAttribute('data-rendered-semantic-hash');
    expect(await root.getAttribute('data-consumer-error')).toBeNull();
    expect(rendered).toBe(expected);
  });
}

