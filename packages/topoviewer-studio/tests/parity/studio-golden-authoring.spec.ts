import { test } from '@playwright/test';
import {
  expectGoldenArchiveRenders,
  exportGoldenArchive,
  reimportGoldenArchive,
  runGoldenAuthoringJourney
} from '../support/goldenAuthoringJourney';

test('runs the complete browser Studio golden authoring journey', async ({ page }) => {
  await runGoldenAuthoringJourney(page, { hostLabel: 'Browser project', url: '/' });
  const archivePath = await exportGoldenArchive(page);
  await expectGoldenArchiveRenders(archivePath);
  await reimportGoldenArchive(page, archivePath);
});
