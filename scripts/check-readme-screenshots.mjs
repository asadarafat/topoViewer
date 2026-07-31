#!/usr/bin/env node

import fs from 'node:fs';
import {
  absoluteRepoPath,
  canonicalBundle,
  documentationBrandRasters,
  documentationRasterAssets,
  documentationRasterReferences,
  documentationScreenshots,
  grafanaCaptureImage,
  pngDimensions,
  releaseVersion,
  screenshotGenerator,
  screenshotManifestPath,
  screenshotManifestSchemaVersion,
  sha256
} from './lib/docs-screenshot-catalog.mjs';

const errors = [];
const screenshotPaths = new Set(documentationScreenshots.map((asset) => asset.path));
const ownedPaths = new Set([
  ...screenshotPaths,
  ...documentationBrandRasters.map((asset) => asset.path)
]);

function reportSetDifference(actual, expected, message) {
  for (const value of actual) {
    if (!expected.has(value)) errors.push(`${message}: ${value}`);
  }
}

const rasterAssets = documentationRasterAssets();
reportSetDifference(rasterAssets, ownedPaths, 'Documentation contains an unowned raster image');
reportSetDifference(ownedPaths, new Set(rasterAssets), 'The documentation asset catalog owns a missing raster image');

for (const asset of documentationBrandRasters) {
  const imagePath = absoluteRepoPath(asset.path);
  if (!fs.existsSync(imagePath)) continue;
  try {
    const dimensions = pngDimensions(fs.readFileSync(imagePath));
    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      errors.push(
        `${asset.path} must be ${asset.width}x${asset.height}, not ${dimensions.width}x${dimensions.height}.`
      );
    }
  } catch (error) {
    errors.push(
      `${asset.path} is invalid: ${error instanceof Error ? error.message : String(error)}.`
    );
  }
}

for (const reference of documentationRasterReferences()) {
  if (!fs.existsSync(absoluteRepoPath(reference.path))) {
    errors.push(`${reference.document} references a missing image: ${reference.path}`);
  } else if (!ownedPaths.has(reference.path)) {
    errors.push(`${reference.document} references an image outside the documentation asset catalog: ${reference.path}`);
  }
}

const manifestAbsolutePath = absoluteRepoPath(screenshotManifestPath);
if (!fs.existsSync(manifestAbsolutePath)) {
  errors.push(`Documentation screenshot manifest is missing. Run \`npm run docs:screenshots\`.`);
} else {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestAbsolutePath, 'utf8'));
  } catch (error) {
    errors.push(`Documentation screenshot manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}.`);
  }

  if (manifest) {
    const expectedVersion = releaseVersion();
    if (manifest.schemaVersion !== screenshotManifestSchemaVersion) {
      errors.push(`Documentation screenshot manifest must use schema version ${screenshotManifestSchemaVersion}.`);
    }
    if (manifest.releaseVersion !== expectedVersion) {
      errors.push(`Documentation screenshots target ${manifest.releaseVersion || 'no version'}, but the package version is ${expectedVersion}. Run \`npm run docs:screenshots\`.`);
    }
    if (manifest.generator !== screenshotGenerator) {
      errors.push(`Documentation screenshot manifest must name ${screenshotGenerator} as its generator.`);
    }
    if (manifest.captureEnvironment?.grafanaImage !== grafanaCaptureImage) {
      errors.push(`Documentation screenshots must use the pinned Grafana capture image ${grafanaCaptureImage}.`);
    }
    if (manifest.captureEnvironment?.colorScheme !== 'dark') {
      errors.push('Documentation screenshots must use the dark color scheme.');
    }
    if (manifest.captureEnvironment?.locale !== 'en-US' || manifest.captureEnvironment?.timezone !== 'UTC') {
      errors.push('Documentation screenshots must use the deterministic en-US locale and UTC timezone.');
    }
    if (manifest.canonicalBundle?.id !== canonicalBundle.id) {
      errors.push(`Documentation screenshots must use the canonical ${canonicalBundle.id} bundle on every surface.`);
    }

    const canonicalManifestFiles = Array.isArray(manifest.canonicalBundle?.files)
      ? manifest.canonicalBundle.files
      : [];
    for (const source of canonicalBundle.files) {
      const entry = canonicalManifestFiles.find((candidate) => candidate.kind === source.kind);
      if (!entry || entry.path !== source.path) {
        errors.push(`Documentation screenshot manifest is missing canonical ${source.kind} source ${source.path}.`);
        continue;
      }
      const sourceHash = sha256(fs.readFileSync(absoluteRepoPath(source.path)));
      if (entry.sha256 !== sourceHash) {
        errors.push(`Canonical ${source.kind} changed without regenerating documentation screenshots.`);
      }
    }
    if (canonicalManifestFiles.length !== canonicalBundle.files.length) {
      errors.push('Documentation screenshot manifest contains an unexpected canonical bundle source.');
    }

    const entries = Array.isArray(manifest.screenshots) ? manifest.screenshots : [];
    const byFile = new Map(entries.map((entry) => [entry.file, entry]));
    if (byFile.size !== entries.length) errors.push('Documentation screenshot manifest contains a duplicate file entry.');

    for (const asset of documentationScreenshots) {
      const entry = byFile.get(asset.file);
      if (!entry) {
        errors.push(`Documentation screenshot manifest is missing ${asset.file}.`);
        continue;
      }
      if (entry.path !== asset.path) errors.push(`${asset.file} has an incorrect repository path in the manifest.`);
      if (entry.surface !== asset.surface) errors.push(`${asset.file} has an incorrect surface in the manifest.`);

      const imagePath = absoluteRepoPath(asset.path);
      if (!fs.existsSync(imagePath)) continue;
      const bytes = fs.readFileSync(imagePath);
      try {
        const dimensions = pngDimensions(bytes);
        if (dimensions.width < asset.minWidth || dimensions.height < asset.minHeight) {
          errors.push(`${asset.file} is unexpectedly small at ${dimensions.width}x${dimensions.height}.`);
        }
        if (entry.width !== dimensions.width || entry.height !== dimensions.height) {
          errors.push(`${asset.file} dimensions do not match its manifest entry.`);
        }
      } catch (error) {
        errors.push(`${asset.file} is invalid: ${error instanceof Error ? error.message : String(error)}.`);
      }
      if (entry.sha256 !== sha256(bytes)) {
        errors.push(`${asset.file} content does not match its reviewed manifest hash.`);
      }
      if (typeof entry.scenario !== 'string' || !entry.scenario.trim()) {
        errors.push(`${asset.file} has no documented capture scenario.`);
      } else if (!entry.scenario.includes(canonicalBundle.id)) {
        errors.push(`${asset.file} does not identify the canonical ${canonicalBundle.id} bundle.`);
      }
    }

    for (const entry of entries) {
      if (!documentationScreenshots.some((asset) => asset.file === entry.file)) {
        errors.push(`Documentation screenshot manifest contains an unowned image: ${entry.file}.`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Documentation screenshot check passed: ${documentationScreenshots.length} generated images, references, dimensions, sources, release version, and hashes are current.`);
