import { test } from '@playwright/test';
import { runGoldenAuthoringJourney } from '../../../../../packages/topoviewer-studio/tests/support/goldenAuthoringJourney';

test('runs the Studio golden authoring journey through the desktop host', async ({ page }) => {
  await runGoldenAuthoringJourney(page, {
    hostLabel: 'Desktop directory',
    url: '/'
  });
});
