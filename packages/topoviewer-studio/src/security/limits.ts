export const studioSecurityLimits = {
  archiveCompressedBytes: 25 * 1024 * 1024,
  archiveExpandedBytes: 25 * 1024 * 1024,
  archiveFiles: 256,
  archiveManifestBytes: 1024 * 1024,
  archiveMaximumCompressionRatio: 200,
  assetBytes: 10 * 1024 * 1024,
  imageDimension: 8_192,
  imagePixels: 32_000_000,
  sourceAliases: 100,
  sourceBytes: 2 * 1024 * 1024,
  sourceDepth: 128,
  sourceNodes: 100_000
} as const;
