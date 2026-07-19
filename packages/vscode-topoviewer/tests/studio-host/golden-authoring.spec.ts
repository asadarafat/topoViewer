import { expect, test } from '@playwright/test';
import {
  expectGoldenArchiveBytesRender,
  openCurrentProjectActions,
  openProjectManager,
  runGoldenAuthoringJourney
} from '../../../topoviewer-studio/tests/support/goldenAuthoringJourney';

test('runs the Studio golden authoring journey through the VS Code host protocol', async ({ page }) => {
  const journey = await runGoldenAuthoringJourney(page, { hostLabel: 'VS Code workspace', url: './' });
  expect(journey.startupMs).toBeLessThan(5_000);

  const projectMenu = await openProjectManager(page);
  await expect(projectMenu.getByText('VS Code workspace', { exact: true })).toBeVisible();
  await expect(projectMenu.getByRole('listitem').filter({ hasText: 'Current' })).toHaveCount(1);
  await expect(projectMenu.getByRole('button', { name: 'New project' })).toHaveCount(0);
  const projectActions = await openCurrentProjectActions(page);
  await projectActions.getByRole('menuitem', { name: 'Export archive' }).click();
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
