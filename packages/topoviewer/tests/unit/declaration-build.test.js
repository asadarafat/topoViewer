import { describe, expect, it } from 'vitest';

import { isExternalDeclarationId } from '../../rollup.types.config.mjs';

describe('declaration build module boundary', () => {
  it.each([
    './types.js',
    '../shared/types.js',
    '/workspace/topoviewer/dist/types-source/types.d.ts',
    String.raw`D:\a\topoviewer\dist\types-source\types.d.ts`,
    String.raw`\\server\share\topoviewer\types.d.ts`,
    '\0virtual:declaration-module'
  ])('keeps internal module id %s in the declaration bundle', (id) => {
    expect(isExternalDeclarationId(id)).toBe(false);
  });

  it.each(['react', '@xyflow/react', 'node:path'])('keeps package id %s external', (id) => {
    expect(isExternalDeclarationId(id)).toBe(true);
  });
});
