import { describe, expect, it } from 'vitest';
import { createStudioExportSnapshot } from '../../src/export/exportSnapshot';
import { exportDataUrlBytes, exportStudioImage, validateStudioImageExport } from '../../src/export/imageExport';
import { createStarterProject } from '../../src/hosts/starterProject';

function element(options: { height?: number; remote?: string; width?: number } = {}) {
  return {
    getBoundingClientRect: () => ({ height: options.height || 480, width: options.width || 640 }),
    querySelectorAll: () => options.remote ? [{ getAttribute: (name: string) => name === 'src' ? options.remote : null }] : []
  } as unknown as HTMLElement;
}

describe('Studio image export', () => {
  const snapshot = createStudioExportSnapshot(createStarterProject(), 'revision-1');

  it('validates explicit bounded output dimensions', () => {
    expect(validateStudioImageExport({
      element: element(), options: { height: 720, kind: 'png', width: 1280 }, snapshot
    })).toEqual({ height: 720, width: 1280 });
    expect(() => validateStudioImageExport({
      element: element(), options: { height: 9000, kind: 'png', width: 1280 }, snapshot
    })).toThrow(/between 1 and 8192/);
  });

  it('rejects implicit remote asset fetches', () => {
    expect(() => validateStudioImageExport({
      element: element({ remote: 'https://example.invalid/router.svg' }), options: { kind: 'svg' }, snapshot
    })).toThrow(/will not fetch remote asset/);
  });

  it('decodes base64 and percent-encoded image data URLs', () => {
    expect([...exportDataUrlBytes('data:image/png;base64,AQID')]).toEqual([1, 2, 3]);
    expect(new TextDecoder().decode(exportDataUrlBytes('data:image/svg+xml,%3Csvg%2F%3E'))).toBe('<svg/>');
  });

  it('cancels before rendering while reporting bounded progress', async () => {
    const abort = new AbortController();
    const stages: string[] = [];
    abort.abort();
    await expect(exportStudioImage({
      element: element(),
      onProgress: (stage) => stages.push(stage),
      options: { kind: 'png' },
      signal: abort.signal,
      snapshot
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(stages).toEqual(['validate']);
  });
});
