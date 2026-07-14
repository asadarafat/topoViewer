import { expect, type Locator, type Page } from '@playwright/test';

export function liveAnnouncement(page: Page) {
  return page.locator('.studio-visually-hidden[aria-live="polite"]');
}

export async function selectCanvasTarget(page: Page, target: Locator, announcement: string) {
  await expect(async () => {
    await target.dispatchEvent('click');
    await expect(liveAnnouncement(page)).toContainText(announcement, { timeout: 1_000 });
  }).toPass({ intervals: [100, 250, 500], timeout: 5_000 });
}
