import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import { createStudioDocumentSession } from '../../src/session';
import { buildProjection } from '../../src/session/projection';
import { parseStudioSource } from '../../src/session/yamlSource';
import { benchmark, budgets, expectSeriesWithinBudget, writeBenchmarkReport } from './benchmark';

function project(topology: string): StudioProject {
  const stylesheet = 'limits:\n  maxEdges: 3000\n  maxNodes: 1500\nstylesheet: []\n';
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: stylesheet }
    },
    id: 'benchmark',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Benchmark',
    revision: 'benchmark'
  };
}

function denseTopology(nodeCount: number, linkCount: number): string {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `N${index}`,
    labels: { name: `Node ${index}` },
    layers: ['physical'],
    position: [(index % 50) * 80, Math.floor(index / 50) * 80]
  }));
  const links = Array.from({ length: linkCount }, (_, index) => ({
    id: `L${index}`,
    layers: ['physical'],
    source: `N${index % nodeCount}`,
    target: `N${(index * 17 + 1) % nodeCount}`
  }));
  return `${JSON.stringify({
    version: '0.2',
    graph: { layers: [{ id: 'physical', labels: { name: 'Physical' } }], links, nodes }
  })}\n`;
}

describe('Studio document session performance', () => {
  it('stays within the approved parse, projection, validation, and mutation budgets', () => {
    const small = 'version: "0.2"\ngraph:\n  layers:\n    - id: physical\n      labels: { name: Physical }\n  nodes:\n    - id: N1\n      labels: { name: Node 1 }\n      layers: [physical]\n      position: [0, 0]\n';
    const dense = denseTopology(1000, 2500);
    const stylesheet = 'limits:\n  maxEdges: 3000\n  maxNodes: 1500\nstylesheet: []\n';

    expect(parseStudioSource('topology', small).ok).toBe(true);
    expect(parseStudioSource('topology', dense).ok).toBe(true);
    const smallProjection = buildProjection({ topology: small, stylesheet });
    const denseProjection = buildProjection({ topology: dense, stylesheet });
    expect(smallProjection.ok, JSON.stringify(smallProjection.diagnostics)).toBe(true);
    expect(denseProjection.ok, JSON.stringify(denseProjection.diagnostics)).toBe(true);

    const smallSession = createStudioDocumentSession(project(small));
    const denseMutationSession = createStudioDocumentSession(project(dense));
    const denseInvalidSession = createStudioDocumentSession(project(dense));
    let mutationRevision = 0;
    let invalidRevision = 0;
    const metrics = {
      denseMutation: benchmark(() => {
        for (let edit = 0; edit < 5; edit += 1) {
          denseMutationSession.setValue('topology', ['graph', 'nodes', 999, 'labels', 'name'], `Router ${mutationRevision}-${edit}`);
        }
        mutationRevision += 1;
      }, 5),
      denseParse: benchmark(() => parseStudioSource('topology', dense)),
      denseProjection: benchmark(() => buildProjection({ topology: dense, stylesheet })),
      invalidDraftContainment: benchmark(() => {
        denseInvalidSession.replaceDraft('topology', `graph: [\n# invalid-${invalidRevision}`);
        invalidRevision += 1;
      }),
      smallMutation: benchmark(() => {
        smallSession.setValue('topology', ['graph', 'nodes', 0, 'labels', 'name'], `Renamed ${mutationRevision}`);
        mutationRevision += 1;
      }),
      smallParse: benchmark(() => parseStudioSource('topology', small)),
      smallProjection: benchmark(() => buildProjection({ topology: small, stylesheet }))
    };

    writeBenchmarkReport('session.json', metrics);
    for (const [name, series] of Object.entries(metrics)) {
      expectSeriesWithinBudget(series, budgets.budgets.unit.sessionMs[name as keyof typeof budgets.budgets.unit.sessionMs], name, { allowSingleBoundedOutlier: name === 'denseProjection' });
    }
  }, 15_000);
});
