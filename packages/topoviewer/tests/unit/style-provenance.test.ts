import { describe, expect, it } from 'vitest';
import { resolveStyleProvenance, styleRuleAffectedObjects } from '../../src/authoring';
import type { GraphNode, StylesheetDocument } from '../../src';

describe('style provenance', () => {
  it('reports ordered defaults, matching rules, inline values, and runtime winners', () => {
    const node: GraphNode = {
      id: 'leaf-1',
      labels: { role: 'leaf' },
      style: { backgroundColor: '#334155' }
    };
    const spec: StylesheetDocument = {
      stylesheet: [
        { selector: 'node', style: { backgroundColor: '#0f172a', width: 100 } },
        { selector: 'node[labels.role = "leaf"]', style: { backgroundColor: '#166534' } }
      ]
    };
    const fields = resolveStyleProvenance('node', node, spec, {
      inlineSourcePath: ['graph', 'nodes', 0],
      runtimeStyle: { backgroundColor: '#dc2626' }
    });
    const background = fields.find((field) => field.key === 'backgroundColor')!;
    expect(background.effectiveValue).toBe('#dc2626');
    expect(background.contributors.map((contributor) => contributor.kind))
      .toEqual(['default', 'rule', 'rule', 'inline', 'runtime']);
    expect(background.contributors.at(-2)).toMatchObject({
      document: 'topology',
      overridden: true,
      path: ['graph', 'nodes', 0, 'style', 'backgroundColor']
    });
    expect(background.winner).toMatchObject({ document: 'runtime', kind: 'runtime', overridden: false });
    const width = fields.find((field) => field.key === 'width')!;
    expect(width.contributors.map((contributor) => contributor.value)).toEqual([82, 100]);
    expect(width.winner?.path).toEqual(['stylesheet', 0, 'style', 'width']);
  });

  it('preserves nested contributors while computing the effective object value', () => {
    const node: GraphNode = {
      id: 'service',
      style: { nodeLayout: { content: { align: 'center' } } }
    };
    const fields = resolveStyleProvenance('node', node, {
      stylesheet: [{
        selector: 'node',
        style: { nodeLayout: { type: 'card', content: { titleField: 'name' } } }
      }]
    });
    expect(fields.find((field) => field.key === 'nodeLayout')?.effectiveValue).toEqual({
      type: 'card',
      content: { align: 'center', titleField: 'name' }
    });
  });

  it('previews deterministic selector impact before shared-rule edits', () => {
    const document = {
      graph: {
        nodes: [
          { id: 'leaf-1', labels: { role: 'leaf' } },
          { id: 'leaf-2', labels: { role: 'leaf' } },
          { id: 'spine-1', labels: { role: 'spine' } }
        ]
      }
    };
    expect(styleRuleAffectedObjects(document, 'node', 'node[labels.role = "leaf"]'))
      .toEqual([{ id: 'leaf-1', target: 'node' }, { id: 'leaf-2', target: 'node' }]);
    expect(styleRuleAffectedObjects(document, 'node', 'link')).toEqual([]);
  });
});
