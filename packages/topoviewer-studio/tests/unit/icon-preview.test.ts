import { describe, expect, it } from 'vitest';
import { studioIconPreviewGlyph, studioIconPreviewSource, studioIconPreviewSvg } from '../../src/features/inspector/iconPreview';

describe('Studio icon previews', () => {
  it('materializes safe fill placeholders for inline SVG previews', () => {
    const svg = studioIconPreviewSvg({
      fill: '#123456',
      svg: '<svg viewBox="0 0 10 10"><style>.st0 { fill: ${fillColor}; }</style><rect class="st0" width="10" height="10"/></svg>'
    });

    expect(svg).toContain('fill: #123456');
    expect(svg).not.toContain('${fillColor}');
    expect(studioIconPreviewSource({ svg })).toMatch(/^data:image\/svg\+xml;utf8,/);
  });

  it('allows application chrome to override portable icon colors for previews', () => {
    const svg = studioIconPreviewSvg(
      {
        fill: '#123456',
        stroke: '#abcdef',
        svg: '<svg viewBox="0 0 10 10"><style>.fill { fill: ${fillColor}; }.stroke { stroke: ${strokeColor}; }</style></svg>'
      },
      { fill: 'rgba(0, 0, 0, 0.08)', stroke: '#000000' }
    );

    expect(svg).toContain('fill: rgba(0, 0, 0, 0.08)');
    expect(svg).toContain('stroke: #000000');
    expect(svg).not.toContain('#123456');
    expect(svg).not.toContain('#abcdef');
  });

  it('sanitizes executable SVG markup before creating a preview', () => {
    const svg = studioIconPreviewSvg({ svg: '<svg viewBox="0 0 10 10"><script>alert(1)</script><rect width="10" height="10"/></svg>' });

    expect(svg).not.toContain('<script');
    expect(svg).toContain('<rect');
  });

  it('uses a declared glyph and derives a compact fallback from the icon ID', () => {
    expect(studioIconPreviewGlyph('nokia.router', { glyph: 'RTR' })).toBe('RTR');
    expect(studioIconPreviewGlyph('nokia.dcgw', {})).toBe('DCG');
  });
});
