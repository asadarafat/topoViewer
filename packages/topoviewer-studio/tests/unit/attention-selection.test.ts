import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { buildAttentionIndex } from 'topoviewer';
import { projectStudioAttentionSelection } from '../../src/features/attention/attentionSelection';

const document = parse([
  'graph:',
  '  nodes:',
  '    - id: core',
  '    - id: leaf',
  '      parent: core',
  '  links:',
  '    - id: core-leaf',
  '      source: core',
  '      target: leaf',
  '  paths: []',
  '  regions:',
  '    - id: west',
  '      members: [core, leaf]',
  'diagram:',
  '  shapes:',
  '    - id: note-shape',
  '      type: rectangle',
  '      position: [0, 0]',
  '      size: [40, 40]',
  ''
].join('\n'));

describe('Studio Attention selection projection', () => {
  const index = buildAttentionIndex(document);

  it('keeps supported graph objects in selection order and excludes annotations', () => {
    expect(projectStudioAttentionSelection(index, [
      { id: 'leaf', kind: 'node' },
      { id: 'note-shape', kind: 'shape' },
      { id: 'core-leaf', kind: 'link' },
      { id: 'leaf', kind: 'node' }
    ])).toMatchObject({
      focusIds: ['leaf', 'core-leaf'],
      unsupportedCount: 1
    });
  });

  it('offers one aggregate candidate only for a selected region or populated parent', () => {
    expect(projectStudioAttentionSelection(index, [{ id: 'west', kind: 'region' }]).aggregateCandidate)
      .toEqual({ by: 'region', sourceId: 'west' });
    expect(projectStudioAttentionSelection(index, [{ id: 'core', kind: 'node' }]).aggregateCandidate)
      .toEqual({ by: 'parent', sourceId: 'core' });
    expect(projectStudioAttentionSelection(index, [{ id: 'leaf', kind: 'node' }]).aggregateCandidate)
      .toBeUndefined();
    expect(projectStudioAttentionSelection(index, [
      { id: 'core', kind: 'node' },
      { id: 'leaf', kind: 'node' }
    ]).aggregateCandidate).toBeUndefined();
  });
});
