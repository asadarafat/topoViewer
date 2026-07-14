import { describe, expect, it } from 'vitest';
import {
  defaultStylesheetCandidateDebounceMs,
  evaluateStylesheetCandidate
} from '../../src/session/stylesheetCandidate';
import { benchmark, budgets, expectSeriesWithinBudget, writeBenchmarkReport } from './benchmark';

function topology(nodeCount: number) {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `node-${index}`,
    labels: { role: 'router' },
    layers: ['physical'],
    name: `Node ${index}`,
    position: [(index % 40) * 100, Math.floor(index / 40) * 90]
  }));
  return `${JSON.stringify({
    graph: { layers: [{ id: 'physical', name: 'Physical' }], links: [], nodes },
    limits: { maxEdges: 3000, maxNodes: 1500 }
  })}\n`;
}

const stylesheet = [
  'stylesheet:',
  '  - selector: node[labels.role = "router"]',
  '    style:',
  '      backgroundColor: "#123456"',
  ''
].join('\n');

describe('stylesheet candidate performance', () => {
  it('keeps immediate candidate evaluation within reviewed budgets', () => {
    const smallTopology = topology(2);
    const denseTopology = topology(1_000);
    expect(evaluateStylesheetCandidate({ topologyText: smallTopology }, stylesheet).ok).toBe(true);
    expect(evaluateStylesheetCandidate({ topologyText: denseTopology }, stylesheet).ok).toBe(true);

    const metrics = {
      denseEvaluation: benchmark(() => evaluateStylesheetCandidate({ topologyText: denseTopology }, stylesheet)),
      smallEvaluation: benchmark(() => evaluateStylesheetCandidate({ topologyText: smallTopology }, stylesheet))
    };
    writeBenchmarkReport('stylesheet-candidate.json', metrics);
    for (const [name, series] of Object.entries(metrics)) {
      expectSeriesWithinBudget(
        series,
        budgets.budgets.unit.stylesheetCandidateMs[name as keyof typeof budgets.budgets.unit.stylesheetCandidateMs],
        `stylesheet candidate ${name}`,
        { allowSingleBoundedOutlier: true }
      );
    }
    expect(defaultStylesheetCandidateDebounceMs).toBeGreaterThanOrEqual(200);
    expect(defaultStylesheetCandidateDebounceMs).toBeLessThanOrEqual(350);
  }, 15_000);
});
