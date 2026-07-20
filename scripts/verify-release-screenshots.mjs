#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import {
  absoluteRepoPath,
  documentationScreenshots,
  pngDimensions,
  repoRoot,
  screenshotManifestPath
} from './lib/docs-screenshot-catalog.mjs';

const maxVisualDiffRatio = 0.02;
const pixelChannelTolerance = 32;

function committedBuffer(relativePath) {
  const result = spawnSync('git', ['show', `HEAD:${relativePath}`], {
    cwd: repoRoot,
    encoding: null,
    maxBuffer: 32 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Could not read reviewed release artifact ${relativePath} from HEAD:\n${result.stderr?.toString() || 'git show failed'}`);
  }
  return result.stdout;
}

function comparableManifest(buffer) {
  const manifest = JSON.parse(buffer.toString('utf8'));
  return {
    ...manifest,
    screenshots: manifest.screenshots?.map(({ sha256: _sha256, ...entry }) => entry)
  };
}

async function visualDiffRatio(page, expectedBuffer, actualBuffer) {
  return page.evaluate(async ({ actual, expected, tolerance }) => {
    function loadImage(source) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = `data:image/png;base64,${source}`;
      });
    }

    const [expectedImage, actualImage] = await Promise.all([
      loadImage(expected),
      loadImage(actual)
    ]);
    if (expectedImage.naturalWidth !== actualImage.naturalWidth
      || expectedImage.naturalHeight !== actualImage.naturalHeight) return 1;

    const canvas = document.createElement('canvas');
    canvas.width = expectedImage.naturalWidth;
    canvas.height = expectedImage.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(expectedImage, 0, 0);
    const expectedPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(actualImage, 0, 0);
    const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

    let differentPixels = 0;
    for (let index = 0; index < expectedPixels.length; index += 4) {
      const delta = Math.max(
        Math.abs(expectedPixels[index] - actualPixels[index]),
        Math.abs(expectedPixels[index + 1] - actualPixels[index + 1]),
        Math.abs(expectedPixels[index + 2] - actualPixels[index + 2]),
        Math.abs(expectedPixels[index + 3] - actualPixels[index + 3])
      );
      if (delta > tolerance) differentPixels += 1;
    }
    return differentPixels / (canvas.width * canvas.height);
  }, {
    actual: actualBuffer.toString('base64'),
    expected: expectedBuffer.toString('base64'),
    tolerance: pixelChannelTolerance
  });
}

const reviewedManifest = comparableManifest(committedBuffer(screenshotManifestPath));
const generatedManifest = comparableManifest(fs.readFileSync(absoluteRepoPath(screenshotManifestPath)));
assert.deepStrictEqual(
  generatedManifest,
  reviewedManifest,
  'Regenerated documentation screenshot manifest changed outside platform-dependent image digests.'
);

const comparisons = documentationScreenshots.map((asset) => {
  const reviewed = committedBuffer(asset.path);
  const generated = fs.readFileSync(absoluteRepoPath(asset.path));
  assert.deepStrictEqual(
    pngDimensions(generated),
    pngDimensions(reviewed),
    `${asset.file} dimensions changed from the reviewed release artifact.`
  );
  return { asset, generated, reviewed };
});

let browser;
let page;
const failures = [];
try {
  for (const comparison of comparisons) {
    if (comparison.generated.equals(comparison.reviewed)) {
      console.log(`Release screenshot verified exactly: ${comparison.asset.file}`);
      continue;
    }
    browser ||= await chromium.launch();
    page ||= await browser.newPage();
    const ratio = await visualDiffRatio(page, comparison.reviewed, comparison.generated);
    console.log(`Release screenshot visual diff: ${comparison.asset.file} ${(ratio * 100).toFixed(3)}%`);
    if (ratio > maxVisualDiffRatio) {
      failures.push(`${comparison.asset.file} visual diff ${(ratio * 100).toFixed(3)}% exceeds ${(maxVisualDiffRatio * 100).toFixed(1)}%.`);
    }
  }
} finally {
  await page?.close();
  await browser?.close();
}

if (failures.length) {
  console.error(`Documentation screenshot release verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`Documentation screenshots match reviewed release media within the ${(maxVisualDiffRatio * 100).toFixed(1)}% visual-diff budget (channel tolerance ${pixelChannelTolerance}).`);
