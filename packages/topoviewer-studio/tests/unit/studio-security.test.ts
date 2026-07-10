import { assertRendererLimits, type TopoDocument } from 'topoviewer';
import { ingestMapperSamples } from 'topoviewer/authoring';
import { describe, expect, it } from 'vitest';
import { validateStudioAssetContent } from '../../src/security/assetSecurity';
import { parseStudioSource } from '../../src/session/yamlSource';
import { buildProjection } from '../../src/session/projection';
import { adversarialAssetReferences } from '../fixtures/security/adversarial';

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function aliasExpansionYaml(): string {
  const repeated = (anchor: string) => Array.from({ length: 20 }, () => `*${anchor}`).join(', ');
  return [
    `base: &base [${Array.from({ length: 20 }, () => 'x').join(', ')}]`,
    `level1: &level1 [${repeated('base')}]`,
    `level2: &level2 [${repeated('level1')}]`,
    `level3: &level3 [${repeated('level2')}]`,
    'expanded: *level3',
    ''
  ].join('\n');
}

describe('Studio hostile input boundaries', () => {
  it('rejects executable or remote SVG and accepts inert local SVG', () => {
    const safe = validateStudioAssetContent({
      bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle r="4"/></svg>'),
      mediaType: 'image/svg+xml',
      name: 'assets/router.svg'
    });
    expect(safe.mediaType).toBe('image/svg+xml');

    for (const svg of [
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://attacker.invalid/pixel.png"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
    ]) {
      expect(() => validateStudioAssetContent({
        bytes: new TextEncoder().encode(svg), mediaType: 'image/svg+xml', name: 'assets/hostile.svg'
      })).toThrow(/SVG/i);
    }
  });

  it('rejects raster MIME spoofing and excessive image dimensions', () => {
    expect(() => validateStudioAssetContent({
      bytes: pngHeader(64, 64), mediaType: 'image/jpeg', name: 'assets/router.jpg'
    })).toThrow(/media type/i);
    expect(() => validateStudioAssetContent({
      bytes: pngHeader(20_000, 20_000), mediaType: 'image/png', name: 'assets/huge.png'
    })).toThrow(/dimension|pixel/i);
    for (const name of adversarialAssetReferences) {
      expect(() => validateStudioAssetContent({
        bytes: pngHeader(64, 64), mediaType: 'image/png', name
      })).toThrow(/path/i);
    }
  });

  it('bounds YAML bytes, structure depth, aliases, and renderer work', () => {
    const tooLarge = parseStudioSource('topology', `graph: {}\n#${'x'.repeat(2 * 1024 * 1024)}`);
    expect(tooLarge).toMatchObject({ ok: false });
    if (!tooLarge.ok) expect(tooLarge.diagnostics[0]?.code).toBe('yaml-source-too-large');

    const deep = parseStudioSource('topology', `${Array.from({ length: 140 }, (_, index) => `${'  '.repeat(index)}k${index}:`).join('\n')}\n${'  '.repeat(140)}value: true\n`);
    expect(deep).toMatchObject({ ok: false });
    if (!deep.ok) expect(deep.diagnostics[0]?.code).toBe('yaml-structure-limit');

    const alias = parseStudioSource('topology', aliasExpansionYaml());
    expect(alias).toMatchObject({ ok: false });

    expect(() => assertRendererLimits({
      limits: { maxNodes: 1 },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [0, 1].map((index) => ({ id: `n${index}`, layers: ['physical'], position: [index, 0] }))
      }
    } as TopoDocument)).toThrow(/renderer limits exceeded/i);
  });

  it('keeps mapper expressions inert and caps telemetry cardinality', () => {
    const expression = '${globalThis.fetch("https://attacker.invalid")}';
    const result = ingestMapperSamples(Array.from({ length: 5_100 }, (_, index) => ({
      fields: { expression },
      labels: { node_id: `node-${index}` },
      metric: 'node_health',
      value: expression
    })));
    expect(result.samples).toHaveLength(5_000);
    expect(result.truncated).toBe(true);
    expect(result.samples[0]?.value).toBe(expression);
    expect(result.samples[0]?.fields.expression).toBe(expression);
  });

  it('rejects implicit image fetches before Studio rendering', () => {
    const remoteIcon = buildProjection({
      topology: 'graph:\n  nodes: []\n  links: []\n',
      stylesheet: 'icons:\n  remote:\n    src: https://attacker.invalid/router.png\nstylesheet: []\n'
    });
    expect(remoteIcon).toMatchObject({ ok: false });
    if (!remoteIcon.ok) expect(remoteIcon.diagnostics.map((item) => item.code)).toContain('studio-implicit-image-fetch');

    const remoteMarkdown = buildProjection({
      topology: [
        'graph:',
        '  nodes: []',
        '  links: []',
        'diagram:',
        '  callouts:',
        '    - id: note',
        '      markdown: "![tracker](https://attacker.invalid/pixel.png)"',
        ''
      ].join('\n'),
      stylesheet: 'stylesheet: []\n'
    });
    expect(remoteMarkdown).toMatchObject({ ok: false });
    if (!remoteMarkdown.ok) expect(remoteMarkdown.diagnostics.map((item) => item.code)).toContain('studio-implicit-markdown-image-fetch');
  });
});
