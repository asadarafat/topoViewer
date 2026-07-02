import { describe, expect, it } from 'vitest';
import { buildAttentionIndex, deriveAggregateGraph } from '../../src';
import { attentionFixture } from './attention-fixture';

describe('deriveAggregateGraph', () => {
  it('collapses region members into an aggregate node without mutating the source document', () => {
    const document = attentionFixture();
    const before = JSON.stringify(document);
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'fra', by: 'region', regionId: 'region-fra', label: 'Frankfurt aggregate' }]
    });

    expect(JSON.stringify(document)).toBe(before);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]).toMatchObject({
      id: 'fra',
      aggregateNodeId: 'aggregate:fra',
      by: 'region',
      sourceId: 'region-fra',
      childCount: 2,
      linkCount: 1,
      severitySummary: { critical: 1, major: 1 }
    });

    const nodes = result.document.graph?.nodes || [];
    expect(nodes.map((node) => node.id)).toEqual(['aggregate:fra', 'access-1']);
    expect(nodes.find((node) => node.id === 'aggregate:fra')?.data).toMatchObject({
      isAggregate: true,
      aggregateBy: 'region',
      members: ['core-1', 'dist-1'],
      childCount: 2
    });

    expect(result.document.graph?.links?.map((link) => [link.id, link.source, link.target])).toEqual([]);
    expect(result.document.graph?.paths?.find((path) => path.id === 'lsp-critical')?.sequence).toEqual(['aggregate:fra', 'access-1']);
    expect(result.document.graph?.paths?.find((path) => path.id === 'stitched-vpn')).toMatchObject({
      source: 'access-1',
      target: 'aggregate:fra'
    });
    expect(result.document.graph?.regions?.map((region) => region.id)).toEqual([]);
    expect(result.document.stylesheet?.some((rule) => rule.selector === 'node[isAggregate="true"]')).toBe(true);
  });

  it('keeps collapsed aggregate nodes visible in the member layers', () => {
    const document = {
      graph: {
        layers: [
          { id: 'control-plane', name: 'Control plane' },
          { id: 'topology-runtime', name: 'Topology runtime' }
        ],
        nodes: [
          { id: 'svc-api', label: 'API service', layers: ['control-plane'], position: [100, 100] },
          { id: 'deploy-api', label: 'API deployment', layers: ['control-plane'], position: [220, 100] },
          { id: 'toponode-leaf1', label: 'leaf1', layers: ['topology-runtime'], position: [100, 260] }
        ],
        links: [
          { id: 'svc-deploy', source: 'svc-api', target: 'deploy-api', layers: ['control-plane'] }
        ],
        regions: [
          {
            id: 'api-region',
            name: 'API region',
            members: ['svc-api', 'deploy-api'],
            layers: ['control-plane']
          }
        ]
      }
    };
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'api-region', by: 'region', regionId: 'api-region', label: 'API region' }]
    });

    expect(result.document.graph?.nodes?.find((node) => node.id === 'aggregate:api-region')?.layers).toEqual(['control-plane']);
    expect(result.document.graph?.nodes?.map((node) => node.id)).toEqual(['aggregate:api-region', 'toponode-leaf1']);
  });

  it('collapses parent-child nodes and label-defined groups', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);

    const parentResult = deriveAggregateGraph(document, index, {
      groups: [{ id: 'dist-children', by: 'parent', parentId: 'dist-1' }]
    });
    expect(parentResult.groups[0].memberIds).toEqual(['access-1']);
    expect(parentResult.document.graph?.nodes?.map((node) => node.id)).toEqual([
      'aggregate:dist-children',
      'core-1',
      'dist-1'
    ]);

    const labelResult = deriveAggregateGraph(document, index, {
      groups: [{ id: 'access-role', by: 'label', key: 'role', value: 'access' }]
    });
    expect(labelResult.groups[0]).toMatchObject({
      by: 'label',
      sourceId: 'role:access',
      childCount: 1
    });
    expect(labelResult.document.graph?.nodes?.map((node) => node.id)).toEqual([
      'aggregate:access-role',
      'core-1',
      'dist-1'
    ]);
  });

  it('honors expanded group state by leaving unrelated layout inputs stable', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);

    const result = deriveAggregateGraph(document, index, {
      groups: [{ id: 'fra', by: 'region', regionId: 'region-fra' }],
      expandedGroupIds: ['fra']
    });

    expect(result.groups).toEqual([]);
    expect(result.document.graph?.nodes).toEqual(document.graph?.nodes);
    expect(result.document.graph?.links).toEqual(document.graph?.links);
    expect(result.document.graph?.paths).toEqual(document.graph?.paths);
  });

  it('groups parallel links by threshold while preserving member references', () => {
    const document = {
      version: '1.0',
      graph: {
        layers: [{ id: 'transport', name: 'Transport' }],
        nodes: [
          { id: 'a', label: 'A', layers: ['transport'] },
          { id: 'b', label: 'B', layers: ['transport'] }
        ],
        links: [
          { id: 'a-b-1', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-2', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'b-a-3', source: 'b', target: 'a', layers: ['transport'] }
        ]
      }
    };
    const index = buildAttentionIndex(document);

    const grouped = deriveAggregateGraph(document, index, {
      groups: [],
      linkGrouping: {
        threshold: 2,
        by: ['endpoints', 'layer']
      }
    });

    expect(grouped.linkGroups).toHaveLength(1);
    expect(grouped.linkGroups[0]).toMatchObject({
      id: 'endpoints-a-b-layer-transport',
      aggregateLinkId: 'aggregate-link-group:endpoints-a-b-layer-transport',
      source: 'a',
      target: 'b',
      count: 3,
      memberIds: ['a-b-1', 'a-b-2', 'b-a-3']
    });
    expect(grouped.document.graph?.links).toEqual([
      expect.objectContaining({
        id: 'aggregate-link-group:endpoints-a-b-layer-transport',
        label: '3 links',
        data: expect.objectContaining({
          isLinkAggregate: true,
          members: ['a-b-1', 'a-b-2', 'b-a-3']
        })
      })
    ]);

    const expanded = deriveAggregateGraph(document, index, {
      groups: [],
      linkGrouping: {
        threshold: 2,
        by: ['endpoints', 'layer'],
        expandedGroupIds: ['endpoints-a-b-layer-transport']
      }
    });
    expect(expanded.linkGroups).toHaveLength(0);
    expect(expanded.document.graph?.links?.map((link) => link.id)).toEqual(['a-b-1', 'a-b-2', 'b-a-3']);
  });
});
