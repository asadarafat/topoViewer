import { describe, expect, it } from 'vitest';
import { createStudioYamlAssist } from '../../src/features/workspace/yamlAssist';
import type { StudioProject } from '../../src';

const project = {
  assets: [],
  documents: {
    topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: 'graph:\n  nodes: []\n' },
    stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: 'stylesheet: []\n' },
    mapper: { contentHash: 'mapper', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nrules: []\n' }
  },
  id: 'assist',
  metadata: { createdAt: '', profileVersion: 1, schemaVersion: 1, updatedAt: '' },
  name: 'Assist',
  revision: '1'
} satisfies StudioProject;

describe('Studio YAML assistance', () => {
  it('derives topology IDs and layer facts from the current project', () => {
    const assist = createStudioYamlAssist(project, {
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [{ id: 'leaf-1', name: 'Leaf 1' }]
      }
    });
    expect(assist.completions('topology').map((item) => item.label)).toEqual(expect.arrayContaining(['graph', 'physical', 'leaf-1']));
  });

  it('derives stylesheet and mapper fields from canonical authoring metadata', () => {
    const assist = createStudioYamlAssist(project, { graph: {} });
    expect(assist.completions('stylesheet').some((item) => item.label === 'lineColor' && item.documentation)).toBe(true);
    expect(assist.completions('mapper').some((item) => item.label === 'sourceId' && item.documentation)).toBe(true);
    expect(assist.hover('stylesheet', 'lineColor')?.contents).toMatch(/line/i);
  });
});
