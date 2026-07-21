import { describe, expect, it } from 'vitest';
import { createStylesheetCandidateController, defaultStylesheetCandidateDebounceMs, evaluateStylesheetCandidate } from '../../src/session/stylesheetCandidate';
import { benchmark, budgets, expectSeriesWithinBudget, writeBenchmarkReport } from './benchmark';

function topology(nodeCount: number, linkCount = 0) {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `node-${index}`,
    labels: { name: `Node ${index}`, role: 'router' },
    layers: ['physical'],
    position: [(index % 40) * 100, Math.floor(index / 40) * 90]
  }));
  const links = Array.from({ length: linkCount }, (_, index) => {
    const source = index % nodeCount;
    let target = (source * 17 + 1 + Math.floor(index / nodeCount) * 37) % nodeCount;
    if (target === source) target = (target + 1) % nodeCount;
    return {
      id: `link-${index}`,
      layers: ['physical'],
      source: `node-${source}`,
      target: `node-${target}`
    };
  });
  return `${JSON.stringify({
    version: '0.2',
    graph: { layers: [{ id: 'physical', labels: { name: 'Physical' } }], links, nodes }
  })}\n`;
}

function stylesheet(color: string) {
  return ['limits:', '  maxEdges: 3000', '  maxNodes: 1500', 'stylesheet:', '  - selector: node[labels.role = "router"]', '    style:', `      backgroundColor: "${color}"`, ''].join('\n');
}

function controller(topologyText: string) {
  return createStylesheetCandidateController({
    appliedSourceRevision: 'performance-applied',
    appliedStylesheetText: stylesheet('#123456'),
    topologyText
  });
}

describe('stylesheet candidate performance', () => {
  it('keeps immediate candidate evaluation within reviewed budgets', () => {
    const smallTopology = topology(2);
    const denseTopology = topology(1_000, 2_500);
    const smallEvaluation = evaluateStylesheetCandidate({ topologyText: smallTopology }, stylesheet('#123456'));
    const denseEvaluation = evaluateStylesheetCandidate({ topologyText: denseTopology }, stylesheet('#123456'));
    expect(smallEvaluation.ok, JSON.stringify(smallEvaluation.diagnostics)).toBe(true);
    expect(denseEvaluation.ok, JSON.stringify(denseEvaluation.diagnostics)).toBe(true);
    const smallController = controller(smallTopology);
    const denseController = controller(denseTopology);
    let iteration = 0;
    const mutate = (candidate: ReturnType<typeof controller>) => {
      const color = iteration++ % 2 ? '#123456' : '#654321';
      candidate.replaceStructuredText(stylesheet(color));
    };

    const metrics = {
      denseEvaluation: benchmark(() => mutate(denseController)),
      smallEvaluation: benchmark(() => mutate(smallController))
    };
    denseController.dispose();
    smallController.dispose();
    writeBenchmarkReport('stylesheet-candidate.json', metrics);
    for (const [name, series] of Object.entries(metrics)) {
      expectSeriesWithinBudget(series, budgets.budgets.unit.stylesheetCandidateMs[name as keyof typeof budgets.budgets.unit.stylesheetCandidateMs], `stylesheet candidate ${name}`, { allowSingleBoundedOutlier: true });
    }
    expect(defaultStylesheetCandidateDebounceMs).toBeGreaterThanOrEqual(200);
    expect(defaultStylesheetCandidateDebounceMs).toBeLessThanOrEqual(350);
  }, 15_000);
});
