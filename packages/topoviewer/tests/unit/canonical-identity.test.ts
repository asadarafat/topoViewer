import { describe, expect, it } from 'vitest';
import { compileTopoGraph } from '../../src/core/compiler';
import { composeTopoViewerDocument } from '../../src/core/compose';
import { migrateTopoBundle, migrateTopoDocument } from '../../src/core/migration';
import { selectorMatches } from '../../src/core/selector';
import { applyStyle, displayName } from '../../src/core/style';
import type { GraphEntity, TopoDocument } from '../../src/core/types';
import { validateTopoDocument } from '../../src/core/validation';

describe('canonical object identity', () => {
  it('renders labels.name when present and otherwise renders the canonical id', () => {
    expect(displayName({ id: 'client-pe05' })).toBe('client-pe05');
    expect(displayName({ id: 'client-pe05', labels: { name: 'Client PE' } })).toBe('Client PE');
    expect(displayName({ id: 'client-pe05', labels: { name: '' } })).toBe('');
  });

  it('uses the same alias fallback in compiled node and edge accessibility', () => {
    const compiled = compileTopoGraph({
      version: '0.2',
      graph: {
        id: 'accessible-identity',
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'router-a', labels: { name: 'Router Alpha' }, layers: ['physical'], position: [80, 80] },
          { id: 'router-b', layers: ['physical'], position: [280, 80] }
        ],
        links: [{ id: 'router-a-router-b', labels: { name: 'Primary circuit' }, source: 'router-a', target: 'router-b', layers: ['physical'] }]
      }
    }, ['physical']);

    expect(compiled.nodes.find((node) => node.id === 'router-a')?.ariaLabel).toBe('node Router Alpha');
    expect(compiled.nodes.find((node) => node.id === 'router-b')?.ariaLabel).toBe('node router-b');
    expect(compiled.edges.find((edge) => edge.id === 'router-a-router-b')?.ariaLabel).toBe('link Primary circuit, from router-a to router-b');
  });

  it('keeps canonical IDs accessible when visible aliases are intentionally hidden', () => {
    const compiled = compileTopoGraph({
      version: '0.2',
      graph: {
        id: 'hidden-visible-labels',
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'router-a', labels: { name: '' }, layers: ['physical'], position: [80, 80] },
          { id: 'router-b', layers: ['physical'], position: [280, 80] }
        ],
        links: [{ id: 'router-a-router-b', labels: { name: '' }, layers: ['physical'], source: 'router-a', target: 'router-b' }]
      }
    }, ['physical']);

    expect(compiled.nodes.find((node) => node.id === 'router-a')?.ariaLabel).toBe('node router-a');
    expect(compiled.edges.find((edge) => edge.id === 'router-a-router-b')?.label).toBeUndefined();
    expect(compiled.edges.find((edge) => edge.id === 'router-a-router-b')?.ariaLabel).toBe('link router-a-router-b, from router-a to router-b');
  });

  it('matches a visible alias through the normal selector contract', () => {
    const node = { id: 'client-pe05', labels: { name: 'Client PE' } };
    expect(selectorMatches('node', node, 'node[labels.name = "Client PE"]')).toBe(true);
    expect(selectorMatches('node', node, 'node[labels.name = "Other"]')).toBe(false);
  });

  it('gives exact-id rules precedence over later broad rules', () => {
    const entity: GraphEntity = { id: 'client-pe05' };
    const stylesheet: TopoDocument = {
      stylesheet: [
        { selector: 'node[id = "client-pe05"]', style: { backgroundColor: '#123456' } },
        { selector: 'node', style: { backgroundColor: '#abcdef', borderWidth: 2 } }
      ]
    };

    expect(applyStyle('node', entity, stylesheet)).toMatchObject({
      backgroundColor: '#123456',
      borderWidth: 2
    });
  });

  it('migrates legacy names and inline appearance into canonical fields', () => {
    const migrated = migrateTopoDocument({
      graph: {
        nodes: [{
          id: 'client-pe05',
          name: 'Client PE',
          icon: 'router',
          style: { backgroundColor: '#123456' }
        }]
      }
    });

    expect(migrated.version).toBe('0.2');
    expect(migrated.graph?.nodes?.[0]).toEqual({
      id: 'client-pe05',
      labels: { name: 'Client PE' }
    });
    expect(migrated.stylesheet).toContainEqual({
      selector: 'node[id = "client-pe05"]',
      style: { backgroundColor: '#123456', icon: 'router' }
    });
    expect(migrateTopoDocument(migrated)).toEqual(migrated);
  });

  it('migrates a source bundle without leaking appearance into topology or changing rendering', () => {
    const topology = {
      graph: {
        id: 'migration-parity',
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [
          { id: 'router-a', name: 'Router A', icon: 'router', layers: ['physical'], position: [80, 80], style: { backgroundColor: '#123456', width: 96 } },
          { id: 'router-b', layers: ['physical'], position: [280, 80] }
        ],
        links: [{ id: 'router-a-router-b', name: 'A to B', source: 'router-a', target: 'router-b', layers: ['physical'] }]
      }
    };
    const stylesheet = {
      icons: { router: { fill: '#334155', glyph: 'R', stroke: '#cbd5e1' } },
      labelFields: ['name', 'labels.role'],
      toggles: [{ id: 'showEdgeLabels', default: true, name: 'Edge labels' }],
      stylesheet: [
        { selector: 'node', style: { borderWidth: 2 } },
        { selector: 'node[id = "router-a"]', style: { borderColor: '#f8fafc' } }
      ]
    };

    const before = compileTopoGraph(
      composeTopoViewerDocument(topology as unknown as TopoDocument, stylesheet),
      ['physical']
    );
    const migrated = migrateTopoBundle({ stylesheet, topology });
    const after = compileTopoGraph(composeTopoViewerDocument(migrated.topology, migrated.stylesheet), ['physical']);

    expect(migrated.topology.version).toBe('0.2');
    expect(migrated.topology.graph?.layers?.[0]).toEqual({ id: 'physical', labels: { name: 'Physical' } });
    expect(migrated.topology.graph?.nodes?.[0]).toMatchObject({ id: 'router-a', labels: { name: 'Router A' } });
    expect(migrated.topology.graph?.links?.[0]).toMatchObject({ id: 'router-a-router-b', labels: { name: 'A to B' } });
    expect(migrated.topology).not.toHaveProperty('icons');
    expect(migrated.topology).not.toHaveProperty('stylesheet');
    expect(migrated.stylesheet?.labelFields).toEqual(['labels.name', 'labels.role']);
    expect((migrated.stylesheet as TopoDocument).toggles).toEqual([{ id: 'showEdgeLabels', default: true, labels: { name: 'Edge labels' } }]);
    expect(migrated.stylesheet?.stylesheet).toContainEqual({
      selector: 'node[id = "router-a"]',
      style: { backgroundColor: '#123456', borderColor: '#f8fafc', icon: 'router', width: 96 }
    });
    expect(after).toEqual(before);
    expect(migrateTopoBundle(migrated)).toEqual(migrated);
  });

  it('rejects appearance leaked into a canonical topology object', () => {
    expect(() => validateTopoDocument({
      version: '0.2',
      graph: {
        nodes: [{ id: 'client-pe05', style: { backgroundColor: '#123456' } }]
      }
    })).toThrow(/graph\.nodes\.0\.style|style.*not allowed/i);
  });

  it('reports legacy alias conflicts instead of dropping either value', () => {
    expect(() => migrateTopoDocument({
      graph: {
        nodes: [{ id: 'client-pe05', labels: { name: 'Client' }, name: 'Provider edge' }]
      }
    })).toThrow(/graph\.nodes\.0.*conflicts with labels\.name/i);
  });

  it('rejects generic name and label fields in a canonical topology object', () => {
    expect(() => validateTopoDocument({
      version: '0.2',
      graph: {
        nodes: [{ id: 'client-pe05', name: 'Client', label: 'Client' }]
      }
    })).toThrow(/graph\.nodes\.0\.(name|label)|not allowed/i);
  });

  it('migrates a 1,000-node legacy bundle within the interaction budget', () => {
    const nodeCount = 1_000;
    const topology = {
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: Array.from({ length: nodeCount }, (_, index) => ({
          id: `node-${index}`,
          icon: 'router',
          layers: ['physical'],
          name: `Node ${index}`,
          position: [index * 10, 0],
          style: { backgroundColor: index % 2 ? '#123456' : '#654321' }
        })),
        links: Array.from({ length: nodeCount - 1 }, (_, index) => ({
          id: `link-${index}`,
          layers: ['physical'],
          source: `node-${index}`,
          target: `node-${index + 1}`
        }))
      }
    };

    const startedAt = performance.now();
    const migrated = migrateTopoBundle({ stylesheet: { stylesheet: [] }, topology });
    const elapsedMs = performance.now() - startedAt;

    expect(migrated.topology.version).toBe('0.2');
    expect(migrated.topology.graph?.nodes).toHaveLength(nodeCount);
    expect(migrated.stylesheet?.stylesheet).toHaveLength(nodeCount);
    expect(elapsedMs).toBeLessThan(500);
  });
});
