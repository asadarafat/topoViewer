import { describe, expect, it } from 'vitest';
import { compileTopoGraph } from '../../src/core/compiler';
import { composeTopoViewerDocument } from '../../src/core/compose';
import { migrateTopoBundle, migrateTopoDocument } from '../../src/core/migration';
import { selectorMatches } from '../../src/core/selector';
import { applyStyle, displayName } from '../../src/core/style';
import { topologyOwnershipIssues } from '../../src/core/topologyOwnership';
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

  it('requires explicit source migration and produces a renderable split bundle', () => {
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
      layout: { mode: 'manual' },
      toggles: [{ id: 'showEdgeLabels', default: true, name: 'Edge labels' }],
      stylesheet: [
        { selector: 'node', style: { borderWidth: 2 } },
        { selector: 'node[id = "router-a"]', style: { borderColor: '#f8fafc' } }
      ]
    };

    expect(() => composeTopoViewerDocument(topology as unknown as TopoDocument, stylesheet as unknown as TopoDocument))
      .toThrow(/presentation policy/);
    const migrated = migrateTopoBundle({ stylesheet, topology });
    const after = compileTopoGraph(composeTopoViewerDocument(migrated.topology, migrated.stylesheet), ['physical']);

    expect(migrated.topology.version).toBe('0.2');
    expect(migrated.topology.graph?.layers?.[0]).toEqual({ id: 'physical', labels: { name: 'Physical' } });
    expect(migrated.topology.graph?.nodes?.[0]).toMatchObject({ id: 'router-a', labels: { name: 'Router A' } });
    expect(migrated.topology.graph?.links?.[0]).toMatchObject({ id: 'router-a-router-b', labels: { name: 'A to B' } });
    expect(migrated.topology).not.toHaveProperty('icons');
    expect(migrated.topology).not.toHaveProperty('stylesheet');
    expect(migrated.stylesheet?.labelFields).toEqual(['labels.name', 'labels.role']);
    expect(migrated.topology.toggles).toEqual([{ id: 'showEdgeLabels', default: true, labels: { name: 'Edge labels' } }]);
    expect(migrated.stylesheet?.stylesheet).toContainEqual({
      selector: 'node[id = "router-a"]',
      style: { backgroundColor: '#123456', borderColor: '#f8fafc', icon: 'router', width: 96 }
    });
    expect(after.nodes.find((node) => node.id === 'router-a')).toMatchObject({
      position: { x: 80, y: 80 },
      style: { width: 96 }
    });
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

  it('reports every topology presentation ownership boundary', () => {
    const issues = topologyOwnershipIssues({
      icons: {},
      labelFields: ['labels.name'],
      layout: { mode: 'manual' },
      limits: { maxNodes: 10 },
      stylesheet: [],
      graph: {
        backgroundColor: '#101010',
        style: { backgroundColor: '#000000' },
        layers: [{ id: 'physical', opacity: 0.8 }],
        nodes: [{ id: 'node-a', icon: 'router', style: { width: 80 }, width: 90 }],
        links: [{
          id: 'node-a-node-b',
          lineColor: '#00ff00',
          source: 'node-a',
          sourceLabel: 'ethernet-1/1',
          target: 'node-b',
          targetLabel: 'ethernet-1/2',
          directions: { sourceToTarget: { label: '3 Gbps', lineWidth: 4, style: { opacity: 0.8 } } }
        }],
        regions: [{ id: 'region-a', height: 200, paddingX: 20, size: [300, 200], width: 300 }]
      },
      diagram: {
        backgroundColor: '#202020',
        shapes: [{ id: 'shape-a', fill: '#112233', rotation: 20, size: [100, 60], type: 'star' }],
        callouts: [{ id: 'callout-a', align: 'center', leader: { lineWidth: 2 }, size: [180, 90], textAlign: 'right' }],
        texts: [{ id: 'text-a', align: 'right', color: '#ffffff', rotation: 10, size: [140, 40], verticalAlign: 'middle' }]
      },
      toggles: [{ id: 'showRegions', opacity: 0.5 }]
    });

    expect(new Set(issues.map((issue) => issue.path.join('.')))).toEqual(new Set([
      'icons',
      'labelFields',
      'layout',
      'limits',
      'stylesheet',
      'graph.backgroundColor',
      'graph.style',
      'graph.layers.0.opacity',
      'graph.nodes.0.icon',
      'graph.nodes.0.style',
      'graph.nodes.0.width',
      'graph.links.0.lineColor',
      'graph.links.0.directions.sourceToTarget.lineWidth',
      'graph.links.0.directions.sourceToTarget.style',
      'graph.regions.0.height',
      'graph.regions.0.paddingX',
      'graph.regions.0.size',
      'graph.regions.0.width',
      'diagram.backgroundColor',
      'diagram.shapes.0.fill',
      'diagram.shapes.0.rotation',
      'diagram.shapes.0.size',
      'diagram.shapes.0.type',
      'diagram.callouts.0.align',
      'diagram.callouts.0.leader',
      'diagram.callouts.0.size',
      'diagram.callouts.0.textAlign',
      'diagram.texts.0.align',
      'diagram.texts.0.color',
      'diagram.texts.0.rotation',
      'diagram.texts.0.size',
      'diagram.texts.0.verticalAlign',
      'toggles.0.opacity'
    ]));
  });

  it('keeps semantic link endpoint and direction labels in topology ownership', () => {
    expect(topologyOwnershipIssues({
      graph: {
        links: [{
          id: 'link-a',
          source: 'node-a',
          sourceLabel: 'ethernet-1/1',
          target: 'node-b',
          targetLabel: 'ethernet-1/2',
          directions: { sourceToTarget: { label: '3 Gbps' } }
        }]
      }
    })).toEqual([]);
  });

  it('explicitly migrates all legacy presentation into stylesheet ownership', () => {
    const migrated = migrateTopoBundle({
      topology: {
        layout: { mode: 'manual', width: 900, height: 500 },
        limits: { maxNodes: 100 },
        graph: {
          nodes: [{ id: 'node-a', backgroundColor: '#123456', width: 96 }],
          regions: [{ id: 'region-a', paddingX: 20, paddingY: 30, size: [300, 200] }],
          links: [{
            id: 'link-a',
            lineColor: '#abcdef',
            source: 'node-a',
            target: 'node-b',
            directions: { sourceToTarget: { lineWidth: 4, style: { opacity: 0.8 } } }
          }]
        },
        diagram: {
          shapes: [{ id: 'shape-a', rotation: 20, size: [100, 60], type: 'star' }],
          callouts: [{ id: 'callout-a', align: 'center', leader: { lineWidth: 2 }, size: [180, 90] }],
          texts: [{ id: 'text-a', align: 'right', rotation: 10, size: [140, 40], verticalAlign: 'middle' }]
        }
      }
    });

    expect(topologyOwnershipIssues(migrated.topology)).toEqual([]);
    expect(migrated.stylesheet).toMatchObject({
      layout: { mode: 'manual', width: 900, height: 500 },
      limits: { maxNodes: 100 }
    });
    expect(migrated.stylesheet?.stylesheet).toEqual(expect.arrayContaining([
      { selector: 'node[id = "node-a"]', style: { backgroundColor: '#123456', width: 96 } },
      { selector: 'link[id = "link-a"]', style: { lineColor: '#abcdef' } },
      { selector: 'region[id = "region-a"]', style: { height: 200, paddingX: 20, paddingY: 30, width: 300 } },
      { selector: 'shape[id = "shape-a"]', style: { height: 60, rotation: 20, shape: 'star', width: 100 } },
      { selector: 'callout[id = "callout-a"]', style: { height: 90, textAlign: 'center', width: 180 } },
      { selector: 'link[id = "callout-a:leader"]', style: { lineWidth: 2 } },
      { selector: 'text[id = "text-a"]', style: { height: 40, rotation: 10, textAlign: 'right', verticalAlign: 'middle', width: 140 } },
      { selector: 'linkDirection[id = "link-a:sourceToTarget"]', style: { lineWidth: 4, opacity: 0.8 } }
    ]));
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
