import { describe, expect, it } from 'vitest';
import type { StudioCommand, StudioProject } from '../../src';
import { createStudioCommandDispatcher, createStudioTransientStore } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';
import { benchmark, budgets, expectSeriesWithinBudget, writeBenchmarkReport } from './benchmark';

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
      createdAt: '2026-07-09T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Command benchmark',
    revision: 'benchmark'
  };
}

describe('Studio command performance', () => {
  it('keeps pointer updates transient and commits representative commands once', () => {
    const session = createStudioDocumentSession(denseProject());
    const dispatcher = createStudioCommandDispatcher(session);
    const transient = createStudioTransientStore();
    const initialRevision = session.snapshot().projection.sourceRevision;

    const pointerUpdates = benchmark(() => {
      for (let index = 0; index < 1000; index += 1) transient.update({ activeDrag: { id: 'N999', position: { x: index, y: index % 23 } } });
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
    expect(dispatcher.dispatch(dragStop).changes).toHaveLength(1);
    expect(dispatcher.dispatch(bulkRename).changes).toHaveLength(1);
    expect(dispatcher.historyState().undoEntries).toBe(2);

    const runCount = budgets.sampling.warmupIterations + budgets.sampling.sampleIterations;
    const dragDispatchers = Array.from({ length: runCount }, () => createStudioCommandDispatcher(createStudioDocumentSession(denseProject())));
    const bulkDispatchers = Array.from({ length: runCount }, () => createStudioCommandDispatcher(createStudioDocumentSession(denseProject())));
    let dragIndex = 0;
    let bulkIndex = 0;
    const metrics = {
      bulkCommit: benchmark(() => bulkDispatchers[bulkIndex++].dispatch(bulkRename)),
      dragCommit: benchmark(() => dragDispatchers[dragIndex++].dispatch(dragStop)),
      pointerUpdates
    };
    writeBenchmarkReport('commands.json', metrics);
    for (const [name, series] of Object.entries(metrics)) {
      expectSeriesWithinBudget(series, budgets.budgets.unit.commandsMs[name as keyof typeof budgets.budgets.unit.commandsMs], name);
    }
  }, 15_000);
});
