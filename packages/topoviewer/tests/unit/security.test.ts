import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { compileTopoGraph, lintTopoDocument, type TopoDocument } from '../../src';
import { sanitizeSvg, isSafeImageReference, materializeSvgColorTokens } from '../../src/core/security';
import { markdownToHtml } from '../../src/core/style';
import { hostileSvgCorpus } from './hostile-content-corpus';

describe('hostile content sanitization', () => {
  it('removes executable SVG payloads while preserving safe geometry', () => {
    const sanitized = sanitizeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <style>.ok { fill: #001135; }</style>
        <script>alert("x")</script>
        <foreignObject><body onload="alert(1)">bad</body></foreignObject>
        <a href="javascript:alert(1)"><rect width="10" height="10" onclick="alert(1)" /></a>
        <path d="M0 0h10" onmouseover=alert(2) style="background:url(javascript:alert(3))" />
        <circle cx="5" cy="5" r="4" fill="#fff" />
      </svg>
    `);

    expect(sanitized).toContain('<circle');
    expect(sanitized).toContain('<style>');
    expect(sanitized).not.toMatch(/<script/i);
    expect(sanitized).not.toMatch(/foreignObject/i);
    expect(sanitized).not.toMatch(/\son[a-z]+\s*=/i);
    expect(sanitized).not.toMatch(/javascript:/i);
  });

  it.each(hostileSvgCorpus)('sanitizes hostile SVG corpus case: $name', ({ svg, forbidden }) => {
    const sanitized = sanitizeSvg(svg);

    for (const pattern of forbidden) {
      expect(sanitized).not.toMatch(pattern);
    }
  });

  it('materializes trusted icon color tokens after sanitizing the SVG', () => {
    const materialized = materializeSvgColorTokens(
      '<svg onload="alert(1)"><rect fill="${fillColor}"/><path stroke="${stroke}"/></svg>',
      { fill: '#123456', stroke: 'var(--topoviewer-icon-stroke)' }
    );

    expect(materialized).toContain('fill="#123456"');
    expect(materialized).toContain('stroke="var(--topoviewer-icon-stroke)"');
    expect(materialized).not.toContain('${');
    expect(materialized).not.toContain('onload');
  });

  it('rejects color-token values that could escape SVG attributes', () => {
    const materialized = materializeSvgColorTokens(
      '<svg><rect fill="${fillColor}"/><path stroke="${strokeColor}"/></svg>',
      { fill: '#fff" onload="alert(1)', stroke: 'url(javascript:alert(1))' }
    );

    expect(materialized).toContain('fill="transparent"');
    expect(materialized).toContain('stroke="currentColor"');
    expect(materialized).not.toContain('onload');
    expect(materialized).not.toContain('javascript');
  });

  it('accepts only inert image references for Markdown and icon URLs', () => {
    expect(isSafeImageReference('https://example.test/icon.png')).toBe(true);
    expect(isSafeImageReference('./icon.png')).toBe(true);
    expect(isSafeImageReference('data:image/png;base64,AAAA')).toBe(true);
    expect(isSafeImageReference('data:image/svg+xml,<svg onload=alert(1)>')).toBe(false);
    expect(isSafeImageReference('javascript:alert(1)')).toBe(false);
    expect(isSafeImageReference('//example.test/icon.png')).toBe(false);
    expect(isSafeImageReference('data:text/html;base64,PHNjcmlwdD4=')).toBe(false);
    expect(isSafeImageReference('https://example.test/icon.png\nonerror=alert(1)')).toBe(false);
  });

  it('removes implicit network references from inline SVG', () => {
    const sanitized = sanitizeSvg([
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<image href="https://attacker.invalid/pixel.png" />',
      '<use xlink:href="//attacker.invalid/sprite.svg#router" />',
      '<circle r="4" />',
      '</svg>'
    ].join(''));

    expect(sanitized).toContain('<circle');
    expect(sanitized).not.toMatch(/attacker\.invalid/);
    expect(sanitized).not.toMatch(/(?:xlink:)?href=/i);
  });

  it('keeps hostile Markdown and callout HTML inert', () => {
    const html = markdownToHtml([
      '# <script>alert(1)</script>',
      '![bad](javascript:alert(1))',
      '[bad](javascript:alert(2))',
      '<img src=x onerror=alert(3)>',
      '**safe emphasis**'
    ]);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(3)&gt;');
    expect(html).toContain('<strong>safe emphasis</strong>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
    expect(html).not.toMatch(/<img src=x/i);
  });

  it('keeps hostile YAML parser and renderer abuse cases out of render paths', () => {
    expect(() => yaml.load([
      'graph:',
      '  id: one',
      '  id: two'
    ].join('\n'))).toThrow(/duplicated mapping key/i);

    expect(() => yaml.load([
      'graph:',
      '  nodes: ['
    ].join('\n'))).toThrow();

    const oversized: TopoDocument = {
      limits: {
        maxNodes: 2,
        maxEdges: 1,
        maxLabels: 2,
        maxImageBytes: 16
      },
      icons: {
        huge: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>oversized hostile fixture</text></svg>'
        }
      },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: Array.from({ length: 4 }, (_value, index) => ({
          id: `n${index}`,
          name: `Node ${index}`,
          layers: ['physical'],
          position: [index * 80, 0]
        })),
        links: [
          { id: 'n0-n1', source: 'n0', target: 'n1', layers: ['physical'] },
          { id: 'n1-n2', source: 'n1', target: 'n2', layers: ['physical'] }
        ]
      }
    };

    expect(lintTopoDocument(oversized, { requireNames: false }).map((entry) => entry.code))
      .toContain('renderer-limit');
    expect(() => compileTopoGraph(oversized, ['physical'])).toThrow(/renderer limits exceeded/i);
  });

  it('reports null bytes, bidi controls, and invalid UTF-8 replacement characters in object text', () => {
    const issues = lintTopoDocument({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          {
            id: 'safe-node',
            labels: {
              name: 'Safe\u202Eevil',
              role: 'pe\u0000router'
            },
            data: {
              description: 'bad\uFFFDtext'
            },
            layers: ['physical'],
            position: [0, 0]
          }
        ]
      },
      diagram: {
        texts: [{ id: 'unsafe-text', text: 'bad\u202Etext' }]
      }
    } as TopoDocument, { requireNames: false });

    expect(issues.filter((entry) => entry.code === 'unsafe-text-control')).toEqual([
      expect.objectContaining({ path: 'graph.nodes[0].labels.name' }),
      expect.objectContaining({ path: 'graph.nodes[0].labels.role' }),
      expect.objectContaining({ path: 'graph.nodes[0].data.description' }),
      expect.objectContaining({ path: 'diagram.texts[0].text' })
    ]);
  });
});
