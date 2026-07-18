import { describe, expect, it } from 'vitest';
import { indexCanonicalIdentityBundle, planCanonicalObjectIdRename, type CanonicalIdentityBundle } from '../../src/authoring';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function fixture(): CanonicalIdentityBundle {
  return {
    topology: {
      version: '0.2',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          { id: 'A', labels: { name: 'Primary Router', peerHint: 'A' }, layers: ['physical'], position: [0, 0] },
          { id: 'B', layers: ['physical'], position: [100, 0] }
        ],
        links: [{
          id: 'A-B',
          source: 'A',
          target: 'B',
          layers: ['physical'],
          labels: { layer: 'physical' },
          directions: { sourceToTarget: { label: '10G' } }
        }],
        paths: [{ id: 'service-path', sequence: ['A', 'B'], layers: ['physical'] }],
        regions: [{ id: 'site', members: ['A', 'B'], layers: ['physical'] }]
      },
      diagram: {
        callouts: [{ id: 'notice', target: 'A', layers: ['physical'], position: [0, 100], title: 'Notice' }],
        connectors: [{ id: 'note-line', source: 'notice', target: 'A', layers: ['physical'] }]
      },
      layout: { clos: { pinnedNodeIds: ['A'] } },
      attention: {
        query: {
          ids: ['A', 'A-B:sourceToTarget'],
          selectors: ['node[id = "A"]']
        },
        aggregate: {
          groups: [{ id: 'parent-summary', by: 'parent', parentId: 'A' }]
        },
        links: {
          grouping: {
            by: ['endpoints', 'layer'],
            expandedGroupIds: ['endpoints-a-b-layer-physical'],
            selector: 'link[layers ~= "physical"]'
          }
        }
      }
    },
    stylesheet: {
      stylesheet: [
        { selector: 'node[id = "A"]', style: { backgroundColor: '#123456' } },
        { selector: 'linkDirection[id = "A-B:sourceToTarget"]', style: { lineWidth: 4 } },
        { selector: 'node[labels.name = "Primary Router"]', style: { borderWidth: 3 } }
      ]
    },
    mapper: {
      version: 1,
      rules: [{ id: 'node-health', metric: 'node_up', select: 'node[id = "A"]', join: 'node_id' }],
      mappings: [{
        id: 'pinned-health',
        metric: 'node_health',
        target: {
          kind: 'node',
          resolve: { by: 'staticObjectIds', objectIds: ['A'] }
        }
      }, {
        id: 'external-health',
        metric: 'node_up',
        target: {
          kind: 'node',
          resolve: { by: 'id', metricLabel: 'node_id' }
        }
      }]
    }
  };
}

function setAt(root: Record<string, unknown>, path: Array<string | number>, value: unknown) {
  let current: unknown = root;
  path.slice(0, -1).forEach((segment, index) => {
    const container = current as Record<string | number, unknown>;
    if (container[segment] === undefined) container[segment] = typeof path[index + 1] === 'number' ? [] : {};
    current = container[segment];
  });
  (current as Record<string | number, unknown>)[path.at(-1)!] = value;
}

function applyPlan(bundle: CanonicalIdentityBundle, plan: ReturnType<typeof planCanonicalObjectIdRename>) {
  const next = structuredClone(bundle) as CanonicalIdentityBundle;
  plan.mutations.forEach((mutation) => {
    const document = next[mutation.document] as Record<string, unknown>;
    setAt(document, mutation.path, mutation.value);
  });
  return next;
}

describe('canonical object identity rename', () => {
  it('indexes typed definitions and references without treating free text as identity', () => {
    const index = indexCanonicalIdentityBundle(fixture());

    expect(index.definitionsByKey.get('node:A')).toMatchObject({ path: ['graph', 'nodes', 0, 'id'] });
    expect(index.referencesByTargetId.get('A')).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'links', 0, 'source'], role: 'link-source', targetKind: 'node' }),
      expect.objectContaining({ path: ['graph', 'paths', 0, 'sequence', 0], role: 'path-sequence', targetKind: 'node' }),
      expect.objectContaining({ document: 'stylesheet', path: ['stylesheet', 0, 'selector'], role: 'selector', targetKind: 'node' }),
      expect.objectContaining({ document: 'mapper', path: ['mappings', 0, 'target', 'resolve', 'objectIds', 0], role: 'mapper-static-object' })
    ]));
    expect(index.references.some((reference) => reference.path.join('.') === 'graph.nodes.0.labels.peerHint')).toBe(false);
  });

  it('renames a node and all structural references in one bundle plan', () => {
    const bundle = fixture();
    const plan = planCanonicalObjectIdRename(bundle, { id: 'A', kind: 'node' }, 'router-a');
    const next = applyPlan(bundle, plan);

    expect(next.topology.graph?.nodes?.[0]).toMatchObject({
      id: 'router-a',
      labels: { name: 'Primary Router', peerHint: 'A' }
    });
    expect(next.topology.graph?.links?.[0].source).toBe('router-a');
    expect(next.topology.graph?.paths?.[0].sequence).toEqual(['router-a', 'B']);
    expect(next.topology.graph?.regions?.[0].members).toEqual(['router-a', 'B']);
    expect(next.topology.diagram?.callouts?.[0].target).toBe('router-a');
    expect(next.topology.diagram?.connectors?.[0].target).toBe('router-a');
    expect(next.topology.layout?.clos?.pinnedNodeIds).toEqual(['router-a']);
    expect(next.topology.attention?.query?.ids).toEqual(['router-a', 'A-B:sourceToTarget']);
    expect(next.topology.attention?.query?.selectors).toEqual(['node[id = "router-a"]']);
    expect(next.topology.attention?.aggregate?.groups?.[0]).toMatchObject({ parentId: 'router-a' });
    expect(next.topology.attention?.links?.grouping?.expandedGroupIds)
      .toEqual(['endpoints-b-router-a-layer-physical']);
    expect(next.stylesheet?.stylesheet?.[0].selector).toBe('node[id = "router-a"]');
    expect(next.stylesheet?.stylesheet?.[2].selector).toBe('node[labels.name = "Primary Router"]');
    const mapperRule = Array.isArray(next.mapper?.rules) ? record(next.mapper.rules[0]) : {};
    const mapperMapping = Array.isArray(next.mapper?.mappings) ? record(next.mapper.mappings[0]) : {};
    const mapperResolve = record(record(mapperMapping.target).resolve);
    expect(mapperRule.select).toBe('node[id = "router-a"]');
    expect(mapperResolve.objectIds).toEqual(['router-a']);
    expect(plan.nextSelection).toEqual({ id: 'router-a', kind: 'node' });
    expect(plan.risks).toHaveLength(2);
  });

  it('rewrites generated link-direction identities when the parent link ID changes', () => {
    const bundle = fixture();
    const plan = planCanonicalObjectIdRename(bundle, { id: 'A-B', kind: 'link' }, 'core-uplink');
    const next = applyPlan(bundle, plan);

    expect(next.topology.graph?.links?.[0].id).toBe('core-uplink');
    expect(next.topology.attention?.query?.ids).toEqual(['A', 'core-uplink:sourceToTarget']);
    expect(next.stylesheet?.stylesheet?.[1].selector)
      .toBe('linkDirection[id = "core-uplink:sourceToTarget"]');
  });

  it('renames layers across membership, conventional labels, and selectors', () => {
    const bundle = fixture();
    const plan = planCanonicalObjectIdRename(bundle, { id: 'physical', kind: 'layer' }, 'underlay');
    const next = applyPlan(bundle, plan);

    expect(next.topology.graph?.layers?.[0]).toMatchObject({ id: 'underlay', labels: { name: 'Physical' } });
    expect(next.topology.graph?.nodes?.[0].layers).toEqual(['underlay']);
    expect(next.topology.graph?.links?.[0]).toMatchObject({
      labels: { layer: 'underlay' },
      layers: ['underlay']
    });
    expect(next.topology.attention?.links?.grouping?.selector).toBe('link[layers ~= "underlay"]');
  });

  it('rejects collisions and does not mutate the input bundle', () => {
    const bundle = fixture();
    const before = structuredClone(bundle);
    expect(() => planCanonicalObjectIdRename(bundle, { id: 'A', kind: 'node' }, 'B'))
      .toThrow(/already used/);
    expect(bundle).toEqual(before);
  });

  it('indexes and plans a rename for 1,000 nodes within the interaction budget', () => {
    const nodeCount = 1_000;
    const topology: CanonicalIdentityBundle['topology'] = {
      version: '0.2',
      graph: {
        layers: [{ id: 'physical' }],
        nodes: Array.from({ length: nodeCount }, (_, index) => ({ id: `node-${index}`, layers: ['physical'], position: [index * 10, 0] })),
        links: Array.from({ length: nodeCount - 1 }, (_, index) => ({ id: `link-${index}`, layers: ['physical'], source: `node-${index}`, target: `node-${index + 1}` }))
      }
    };
    const bundle = { topology };
    const startedAt = performance.now();
    const index = indexCanonicalIdentityBundle(bundle);
    const plan = planCanonicalObjectIdRename(bundle, { id: 'node-500', kind: 'node' }, 'core-500');
    const elapsedMs = performance.now() - startedAt;

    expect(index.definitions).toHaveLength(nodeCount * 2);
    expect(index.references).toHaveLength(nodeCount + (nodeCount - 1) * 3);
    expect(plan.mutations).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 500, 'id'], value: 'core-500' }),
      expect.objectContaining({ path: ['graph', 'links', 499, 'target'], value: 'core-500' }),
      expect.objectContaining({ path: ['graph', 'links', 500, 'source'], value: 'core-500' })
    ]));
    expect(elapsedMs).toBeLessThan(500);
  });
});
