import { describe, expect, it } from 'vitest';
import {
  styleRulesForTarget,
  styleSelectorIsValid,
  styleSelectorSuggestions,
  styleSelectorTarget
} from '../../src/authoring';

describe('style authoring selectors', () => {
  it('classifies supported selector targets without accepting lookalikes', () => {
    expect(styleSelectorTarget('node[labels.role = "leaf"]')).toBe('node');
    expect(styleSelectorTarget(' linkDirection[direction = "sourceToTarget"] ')).toBe('linkDirection');
    expect(styleSelectorTarget('nodeGroup[labels.role = "leaf"]')).toBeUndefined();
    expect(styleSelectorTarget('[labels.role = "leaf"]')).toBeUndefined();
  });

  it('validates the selector grammar without hiding malformed target rules', () => {
    expect(styleSelectorIsValid('node')).toBe(true);
    expect(styleSelectorIsValid('node[labels.role = "leaf"][labels.status ~= ready]')).toBe(true);
    expect(styleSelectorIsValid('node labels.role = leaf')).toBe(false);
    expect(styleSelectorIsValid('node[labels.role]')).toBe(false);
    expect(styleSelectorTarget('node invalid')).toBe('node');
  });

  it('suggests kind, identity, and stable label selectors for an object', () => {
    expect(styleSelectorSuggestions('node', {
      id: 'edge-"01',
      labels: { role: 'leaf', status: 'ready' }
    })).toEqual([
      { label: 'All nodes', selector: 'node', source: 'kind' },
      { label: 'This node', selector: 'node[id = "edge-\\"01"]', source: 'id' },
      { label: 'role = leaf', selector: 'node[labels.role = "leaf"]', source: 'label' },
      { label: 'status = ready', selector: 'node[labels.status = "ready"]', source: 'label' }
    ]);
  });

  it('lists every compatible rule in stylesheet order, including non-matches', () => {
    const document = {
      stylesheet: [
        { selector: 'node', style: { shape: 'rectangle' } },
        { selector: 'link', style: { lineWidth: 2 } },
        { selector: 'node[labels.role = "spine"]', style: { backgroundColor: '#123456' } }
      ]
    };

    expect(styleRulesForTarget(document, 'node')).toEqual([
      { index: 0, rule: document.stylesheet[0] },
      { index: 2, rule: document.stylesheet[2] }
    ]);
  });
});
