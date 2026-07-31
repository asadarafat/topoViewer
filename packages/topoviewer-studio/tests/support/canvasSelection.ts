import { expect, type Locator, type Page } from '@playwright/test';

export function liveAnnouncement(page: Page) {
  return page.locator('.studio-visually-hidden[aria-live="polite"]');
}

async function clickCanvasTarget(
  page: Page,
  target: Locator,
  modifiers: Array<'Alt' | 'Control' | 'Meta' | 'Shift'>
) {
  const svgTarget = await target.evaluate(
    (element) => element instanceof SVGGeometryElement
  );
  if (!svgTarget) {
    await target.click({ force: true, modifiers });
    return;
  }
  for (const modifier of modifiers) await page.keyboard.down(modifier);
  try {
    await target.dispatchEvent('click', {
      altKey: modifiers.includes('Alt'),
      ctrlKey: modifiers.includes('Control'),
      metaKey: modifiers.includes('Meta'),
      shiftKey: modifiers.includes('Shift')
    });
  } finally {
    for (const modifier of [...modifiers].reverse()) await page.keyboard.up(modifier);
  }
}

export async function selectCanvasTarget(
  page: Page,
  target: Locator,
  announcement: string,
  modifiers: Array<'Alt' | 'Control' | 'Meta' | 'Shift'> = []
) {
  await expect(async () => {
    await clickCanvasTarget(page, target, modifiers);
    await expect(liveAnnouncement(page)).toContainText(announcement, { timeout: 1_000 });
  }).toPass({ intervals: [100, 250, 500], timeout: 5_000 });
}
