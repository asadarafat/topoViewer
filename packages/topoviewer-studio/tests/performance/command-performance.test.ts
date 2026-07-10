import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import type { StudioCommand, StudioProject } from '../../src';
import { createStudioCommandDispatcher, createStudioTransientStore } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';

function denseProject(nodeCount = 1000): StudioProject {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `N${index}`,
    layers: ['physical'],
    name: `Node ${index}`,
    position: [(index % 50) * 80, Math.floor(index / 50) * 80]
  }));
  const topology = `${JSON.stringify({ graph: { layers: [{ id: 'physical', name: 'Physical' }], nodes } })}\n`;
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: 'stylesheet: []\n' }
    },
    id: 'command-benchmark',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z', profileVersion: 1, schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Command benchmark',
    revision: 'benchmark'
  };
}

function measure(operation: () => void) {
  const started = performance.now();
  operation();
  return performance.now() - started;
}

describe('Studio command performance', () => {
  it('keeps pointer updates transient and commits representative commands once', () => {
    const session = createStudioDocumentSession(denseProject());
    const dispatcher = createStudioCommandDispatcher(session);
    const transient = createStudioTransientStore();
    const initialRevision = session.snapshot().projection.sourceRevision;

    const pointerUpdates = measure(() => {
      for (let index = 0; index < 1000; index += 1) {
        transient.update({ activeDrag: { id: 'N999', position: { x: index, y: index % 23 } } });
      }
    });
    expect(session.snapshot().projection.sourceRevision).toBe(initialRevision);
    expect(dispatcher.historyState().undoEntries).toBe(0);

    const dragStop: StudioCommand = {
      id: 'drag-stop',
      label: 'Move N999',
      execute: () => ({
        mutations: [
          { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 999, 'position', 0], value: 840 },
          { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 999, 'position', 1], value: 620 }
        ],
        summary: 'Move N999'
      })
    };
    let dragChanges = 0;
    const dragCommit = measure(() => {
      dragChanges = dispatcher.dispatch(dragStop).changes.length;
    });

    const bulkRename: StudioCommand = {
      id: 'bulk-rename',
      label: 'Rename 100 nodes',
      execute: () => ({
        mutations: Array.from({ length: 100 }, (_, index) => ({
          document: 'topology' as const,
          kind: 'set-value' as const,
          path: ['graph', 'nodes', index, 'name'],
          value: `Router ${index}`
        })),
        summary: 'Rename 100 nodes'
      })
    };
    const bulkCommit = measure(() => { dispatcher.dispatch(bulkRename); });

    const metrics = {
      fixture: { nodes: 1000, pointerUpdates: 1000 },
      milliseconds: { bulkCommit, dragCommit, pointerUpdates },
      thresholds: { bulkCommit: 250, dragCommit: 100, pointerUpdates: 50 }
    };
    expect(dragChanges).toBe(1);
    expect(dispatcher.historyState().undoEntries).toBe(2);
    expect(pointerUpdates).toBeLessThan(metrics.thresholds.pointerUpdates);
    expect(dragCommit).toBeLessThan(metrics.thresholds.dragCommit);
    expect(bulkCommit).toBeLessThan(metrics.thresholds.bulkCommit);

    const output = path.resolve(process.cwd(), '../../.artifacts/topoviewer-studio/command-benchmark.json');
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(metrics, null, 2)}\n`);
  }, 15_000);
});
