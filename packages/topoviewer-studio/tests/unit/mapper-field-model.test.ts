import { describe, expect, it } from 'vitest';
import { mapperAuthoringField, mapperAuthoringMetadata } from 'topoviewer/authoring';
import {
  mapperApplicableMetadata,
  mapperFieldDisposition,
  mapperFieldIsDirectlyEditable,
  mapperFieldSourcePath,
  mapperStyleSlots,
  mapperStyleTarget,
  unknownMapperSourcePaths
} from '../../src/features/mapper/mapperFieldModel';

describe('Studio mapper field model', () => {
  it('disposes every canonical metadata field as a control or reviewed YAML fallback', () => {
    expect(mapperAuthoringMetadata).toHaveLength(92);
    for (const field of mapperAuthoringMetadata) {
      expect(['control', 'raw-yaml']).toContain(mapperFieldDisposition(field));
    }
    expect(mapperFieldDisposition(mapperAuthoringField('identity.sourceId')!)).toBe('control');
    expect(mapperFieldDisposition(mapperAuthoringField('mappings[].conditions')!)).toBe('raw-yaml');
    expect(mapperFieldDisposition(mapperAuthoringField('mappings[].conditions[].when.value.gte')!)).toBe('raw-yaml');
    expect(mapperFieldIsDirectlyEditable(
      mapperAuthoringField('rules[].metric')!, { collection: 'mappings', index: 0 }
    )).toBe(false);
  });

  it('materializes selected rule paths and stops at unsupported nested sequences', () => {
    const mapping = { collection: 'mappings' as const, index: 2 };
    expect(mapperFieldSourcePath(mapperAuthoringField('mappings[].target.resolve.by')!, mapping))
      .toEqual(['mappings', 2, 'target', 'resolve', 'by']);
    expect(mapperFieldSourcePath(mapperAuthoringField('mappings[].conditions[].when.value.gte')!, mapping))
      .toEqual(['mappings', 2, 'conditions']);
  });

  it('filters Advanced to the current shape while All remains complete', () => {
    const rules = mapperApplicableMetadata({ collection: 'rules', index: 0 }, 'advanced');
    expect(rules.some((field) => field.path === 'rules[].metric')).toBe(true);
    expect(rules.some((field) => field.path === 'mappings[].metric')).toBe(false);
    expect(mapperApplicableMetadata(undefined, 'all')).toHaveLength(mapperAuthoringMetadata.length);
  });

  it('finds unknown extensions without misclassifying style patches', () => {
    expect(unknownMapperSourcePaths({
      version: 1,
      mappings: [{
        id: 'health', metric: 'health',
        target: { kind: 'node', resolve: { by: 'id', metricLabel: 'node_id' } },
        overlay: { style: { borderWidth: 4 } }
      }],
      'x-future': { mode: 'safe' }
    })).toEqual([['x-future']]);
  });

  it('derives target-compatible default and state style slots for both rule shapes', () => {
    const mapper = {
      rules: [{
        id: 'link', metric: 'bps', select: 'link', states: { busy: '>=70' },
        style: { default: { lineWidth: 2 }, busy: { lineWidth: 5 } }
      }],
      mappings: [{
        id: 'node', metric: 'health',
        target: { kind: 'node', resolve: { by: 'id', metricLabel: 'node_id' } },
        overlay: { style: { borderWidth: 2 } },
        conditions: [{ id: 'down', style: { borderWidth: 5 } }]
      }]
    };
    expect(mapperStyleTarget(mapper.rules[0])).toBe('link');
    expect(mapperStyleSlots(mapper, { collection: 'rules', index: 0 }).map((slot) => slot.label))
      .toEqual(['Default', 'busy']);
    expect(mapperStyleSlots(mapper, { collection: 'mappings', index: 0 }).map((slot) => slot.label))
      .toEqual(['Default', 'down']);
    expect(mapperStyleTarget({ select: 'graph' })).toBeUndefined();
  });
});
