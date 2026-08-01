import type { Page } from '@playwright/test';

export async function resolvedPaletteColor(page: Page, token: string) {
  return page.evaluate((variable) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${variable})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}
