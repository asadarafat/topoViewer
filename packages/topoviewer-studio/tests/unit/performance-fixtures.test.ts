import { describe, expect, it } from 'vitest';
import { MemoryStudioHost, type MemoryStudioFixture } from '../../src/hosts/memoryHost';
import { parseStudioSource } from '../../src/session/yamlSource';

const fixtures: Array<{ fixture: MemoryStudioFixture; links: number; nodes: number }> = [
  { fixture: 'performance-2', links: 1, nodes: 2 },
  { fixture: 'performance-100', links: 250, nodes: 100 },
  { fixture: 'performance-1000', links: 2500, nodes: 1000 }
];

describe('Studio performance fixtures', () => {
  it.each(fixtures)('keeps $fixture stable', async ({ fixture, links, nodes }) => {
    const loaded = await new MemoryStudioHost({ fixture }).loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const parsed = parseStudioSource('topology', loaded.value.project.documents.topology.text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const graph = (parsed.source.value as { graph?: { links?: unknown[]; nodes?: unknown[] } }).graph;
    expect(graph?.nodes).toHaveLength(nodes);
    expect(graph?.links).toHaveLength(links);
  });
});
