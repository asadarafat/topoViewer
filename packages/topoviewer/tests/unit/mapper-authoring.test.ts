import { describe, expect, it } from 'vitest';
import {
  createBasicMapperRule,
  mapperAuthoringTargetKinds,
  mapperRuleTargetKind
} from '../../src/authoring';

describe('mapper authoring', () => {
  it('creates compact rules for every Basic target kind', () => {
    const expectedJoins = {
      graph: undefined,
      link: 'link_id',
      linkDirection: { direction: 'direction', link: 'link_id' },
      node: 'node_id',
      path: 'path_id',
      region: 'region_id'
    } as const;
    for (const targetKind of mapperAuthoringTargetKinds) {
      const rule = createBasicMapperRule({ version: 1, rules: [] }, {
        metric: `metric_${targetKind}`,
        targetKind,
        value: 'health'
      });
      expect(rule).toMatchObject({ select: targetKind, value: 'health' });
      if (targetKind === 'graph') expect(rule).not.toHaveProperty('join');
      else expect(rule.join).toEqual(expectedJoins[targetKind]);
      expect(mapperRuleTargetKind(rule)).toBe(targetKind);
    }
  });

  it('creates directional joins, optional states, and stable unique IDs', () => {
    const mapper = { rules: [{ id: 'interface-bps-linkdirection' }], version: 1 };
    expect(createBasicMapperRule(mapper, {
      directionLabel: 'traffic_direction',
      linkLabel: 'topology_link',
      metric: 'interface_bps',
      stateExpression: '>=1000000000',
      stateName: 'busy',
      targetKind: 'linkDirection',
      value: 'bps'
    })).toEqual({
      id: 'interface-bps-linkdirection-2',
      join: { direction: 'traffic_direction', link: 'topology_link' },
      metric: 'interface_bps',
      select: 'linkDirection',
      states: { busy: '>=1000000000' },
      value: 'bps'
    });
  });

  it('rejects incomplete metrics, joins, and state expressions', () => {
    expect(() => createBasicMapperRule({}, { metric: ' ', targetKind: 'node' })).toThrow('Metric name');
    expect(() => createBasicMapperRule({}, { joinLabel: ' ', metric: 'up', targetKind: 'node' })).toThrow('Join');
    expect(() => createBasicMapperRule({}, {
      metric: 'up', stateName: 'down', targetKind: 'node'
    })).toThrow('provided together');
  });
});
