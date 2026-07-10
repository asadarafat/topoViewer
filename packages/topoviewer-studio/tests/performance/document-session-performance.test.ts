import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import { createStudioDocumentSession } from '../../src/session';
import { buildProjection } from '../../src/session/projection';
import { parseStudioSource } from '../../src/session/yamlSource';

function project(topology: string): StudioProject {
  const stylesheet = 'stylesheet: []\n';
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: stylesheet }
    },
    id: 'benchmark',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z', profileVersion: 1, schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Benchmark',
    revision: 'benchmark'
  };
}

function denseTopology(nodeCount: number, linkCount: number): string {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `N${index}`,
    layers: ['physical'],
    name: `Node ${index}`,
    position: [(index % 50) * 80, Math.floor(index / 50) * 80]
  }));
  const links = Array.from({ length: linkCount }, (_, index) => ({
    id: `L${index}`,
    layers: ['physical'],
    source: `N${index % nodeCount}`,
    target: `N${(index * 17 + 1) % nodeCount}`
  }));
  return `${JSON.stringify({
    graph: { layers: [{ id: 'physical', name: 'Physical' }], links, nodes },
    limits: { maxEdges: 3000, maxNodes: 1500 }
  })}\n`;
}

function elapsed<T>(operation: () => T) {
  const started = performance.now();
  const value = operation();
  return { milliseconds: performance.now() - started, value };
}

describe('Studio document session performance', () => {
  it('stays within the approved parse, projection, validation, and mutation budgets', () => {
    const small = 'graph:\n  layers:\n    - id: physical\n      name: Physical\n  nodes:\n    - id: N1\n      name: Node 1\n      layers: [physical]\n      position: [0, 0]\n';
    const dense = denseTopology(1000, 2500);
    const stylesheet = 'stylesheet: []\n';

    const smallParse = elapsed(() => parseStudioSource('topology', small));
    const denseParse = elapsed(() => parseStudioSource('topology', dense));
    const smallProjection = elapsed(() => buildProjection({ topology: small, stylesheet }));
    const denseProjection = elapsed(() => buildProjection({ topology: dense, stylesheet }));
    const smallSession = createStudioDocumentSession(project(small));
    const denseSession = createStudioDocumentSession(project(dense));
    const smallMutation = elapsed(() => smallSession.setValue('topology', ['graph', 'nodes', 0, 'name'], 'Renamed'));
    const denseMutation = elapsed(() => denseSession.setValue('topology', ['graph', 'nodes', 999, 'name'], 'Renamed'));
    const invalidDraft = elapsed(() => denseSession.replaceDraft('topology', 'graph: [\n'));

    expect(smallParse.value.ok).toBe(true);
    expect(denseParse.value.ok).toBe(true);
    expect(smallProjection.value.ok).toBe(true);
    expect(denseProjection.value.ok).toBe(true);
    expect(smallMutation.value.status).toBe('applied');
    expect(denseMutation.value.status).toBe('applied');
    expect(invalidDraft.value.status).toBe('invalid');

    const metrics = {
      fixture: { links: 2500, nodes: 1000 },
      milliseconds: {
        denseMutation: denseMutation.milliseconds,
        denseParse: denseParse.milliseconds,
        denseProjection: denseProjection.milliseconds,
        invalidDraftContainment: invalidDraft.milliseconds,
        smallMutation: smallMutation.milliseconds,
        smallParse: smallParse.milliseconds,
        smallProjection: smallProjection.milliseconds
      },
      thresholds: {
        denseMutation: 250,
        denseParse: 1000,
        denseProjection: 3000,
        invalidDraftContainment: 100,
        smallMutation: 250,
        smallParse: 100,
        smallProjection: 250
      }
    };

    expect(metrics.milliseconds.smallParse).toBeLessThan(metrics.thresholds.smallParse);
    expect(metrics.milliseconds.denseParse).toBeLessThan(metrics.thresholds.denseParse);
    expect(metrics.milliseconds.smallProjection).toBeLessThan(metrics.thresholds.smallProjection);
    expect(metrics.milliseconds.denseProjection).toBeLessThan(metrics.thresholds.denseProjection);
    expect(metrics.milliseconds.smallMutation).toBeLessThan(metrics.thresholds.smallMutation);
    expect(metrics.milliseconds.denseMutation).toBeLessThan(metrics.thresholds.denseMutation);
    expect(metrics.milliseconds.invalidDraftContainment).toBeLessThan(metrics.thresholds.invalidDraftContainment);

    const output = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/session-benchmark.json');
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(metrics, null, 2)}\n`);
  }, 15_000);
});
