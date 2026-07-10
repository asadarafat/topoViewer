import { describe, expect, it } from 'vitest';
import {
  adversarialArchivePaths,
  adversarialAssetReferences,
  adversarialMediaTypes,
  compressedBombArchive,
  excessFileArchive,
  malformedArchiveManifests,
  malformedManifestArchive,
  maximumCompressionRatio,
  oversizedFileArchive,
  symbolicLinkWorkspaceEntry
} from '../fixtures/security/adversarial';

describe('Studio adversarial fixture corpus', () => {
  it('covers paths, symlinks, MIME confusion, data URLs, and malformed manifests', () => {
    expect(adversarialArchivePaths).toHaveLength(7);
    expect(adversarialAssetReferences.some((value) => value.startsWith('data:'))).toBe(true);
    expect(adversarialAssetReferences.some((value) => value.startsWith('http'))).toBe(true);
    expect(adversarialMediaTypes).toContain('text/html');
    expect(malformedArchiveManifests.length).toBeGreaterThanOrEqual(6);
    expect(symbolicLinkWorkspaceEntry.symbolicLink).toBe(true);
  });

  it('builds bounded reproductions for expansion, count, size, and manifest attacks', () => {
    const bomb = compressedBombArchive();
    expect(maximumCompressionRatio(bomb)).toBeGreaterThan(100);
    expect(excessFileArchive().byteLength).toBeGreaterThan(0);
    expect(oversizedFileArchive().byteLength).toBeGreaterThan(0);
    expect(malformedManifestArchive(malformedArchiveManifests[0]).byteLength).toBeGreaterThan(0);
  });
});
