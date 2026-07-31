import { afterEach, describe, expect, it, vi } from 'vitest';

const moduleLoads = vi.hoisted(() => ({ image: 0, pdf: 0 }));

vi.mock('html-to-image', () => {
  moduleLoads.image += 1;
  return {
    toPng: vi.fn(async () => 'data:image/png;base64,cG5n'),
    toSvg: vi.fn(async () => 'data:image/svg+xml,svg')
  };
});

vi.mock('jspdf', () => {
  moduleLoads.pdf += 1;
  return {
    jsPDF: class {
      addImage() {}
      output() { return new Blob(); }
    }
  };
});

describe('static export package boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps export implementation modules lazy behind root compatibility functions', { timeout: 15_000 }, async () => {
    const root = await import('../../src/index');

    expect(moduleLoads).toEqual({ image: 0, pdf: 0 });

    vi.stubGlobal('document', { fonts: { ready: Promise.resolve() } });
    const target = {
      querySelector: () => null
    } as unknown as HTMLElement;
    await expect(root.topoviewerToSvg(target)).resolves.toBe('data:image/svg+xml,svg');
    expect(moduleLoads.image).toBe(1);
    expect(moduleLoads.pdf).toBe(1);
  });
});
