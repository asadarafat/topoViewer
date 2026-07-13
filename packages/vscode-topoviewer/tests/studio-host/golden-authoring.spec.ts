import { expect, test } from '@playwright/test';
import {
  expectGoldenArchiveBytesRender,
  runGoldenAuthoringJourney
} from '../../../topoviewer-studio/tests/support/goldenAuthoringJourney';

test('runs the Studio golden authoring journey through the VS Code host protocol', async ({ page }) => {
  const journey = await runGoldenAuthoringJourney(page, { hostLabel: 'VS Code workspace', url: './' });
  expect(journey.startupMs).toBeLessThan(5_000);

  await page.getByRole('button', { name: 'Project menu' }).click();
  const projectMenu = page.getByRole('dialog', { name: 'Project menu' });
  await expect(projectMenu.getByText('VS Code bundle')).toBeVisible();
  await expect(projectMenu.getByRole('button', { name: 'New' })).toHaveCount(0);
  await projectMenu.getByRole('button', { name: 'Export archive' }).click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __topoviewerVsCodeStudioTest?: { exports: unknown[] } }
  ).__topoviewerVsCodeStudioTest?.exports.length || 0)).toBe(1);
  const exported = await page.evaluate(() => {
    const request = (
      window as typeof window & {
        __topoviewerVsCodeStudioTest?: {
          exports: Array<{ artifact: { bytes: number[] }; suggestedName: string }>;
        };
      }
    ).__topoviewerVsCodeStudioTest?.exports.at(-1);
    return request ? { bytes: request.artifact.bytes, suggestedName: request.suggestedName } : undefined;
  });
  expect(exported?.suggestedName).toMatch(/\.tvstudio$/);
  expectGoldenArchiveBytesRender(Uint8Array.from(exported?.bytes || []));
  const savedTopology = await page.evaluate(() => (
    window as typeof window & { __topoviewerVsCodeStudioTest?: { source(path: string): string | undefined } }
  ).__topoviewerVsCodeStudioTest?.source('topology.yaml'));
  expect(savedTopology).toContain('id: router-1');
  expect(savedTopology).toContain('id: link-1');
});
