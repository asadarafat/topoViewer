import { describe, expect, it } from 'vitest';
import type { TopoDocument } from '../../src';
import {
  discoverMapperMetrics,
  mapperRuleFromProposal,
  proposeMapperRule,
  type MapperAuthoringSample
} from '../../src/authoring';

const document: TopoDocument = {
  graph: {
    nodes: [
      { id: 'leaf1', labels: { device: 'edge-a', role: 'leaf' }, position: [0, 0] },
      { id: 'leaf2', labels: { device: 'edge-b', role: 'leaf' }, position: [200, 0] }
    ],
    links: [{
      id: 'leaf1-leaf2', source: 'leaf1', target: 'leaf2',
      directions: {
        sourceToTarget: { id: 'leaf1-leaf2:sourceToTarget' },
        targetToSource: { id: 'leaf1-leaf2:targetToSource' }
      }
    }]
  }
};

const samples: MapperAuthoringSample[] = [
  { fields: {}, labels: { device: 'leaf1', node_id: 'leaf1' }, metric: 'node_health', value: 1 },
  { fields: {}, labels: { device: 'leaf2', node_id: 'leaf2' }, metric: 'node_health', value: 1 },
  { fields: {}, labels: { direction: 'sourceToTarget', link_id: 'leaf1-leaf2' }, metric: 'interface_bps', value: 100 }
];

describe('mapper rule inference', () => {
  it('discovers metrics and label facts deterministically', () => {
    expect(discoverMapperMetrics(samples)).toEqual([
      { labelKeys: ['direction', 'link_id'], metric: 'interface_bps', sampleCount: 1 },
      { labelKeys: ['device', 'node_id'], metric: 'node_health', sampleCount: 2 }
    ]);
  });

  it('requires an explicit choice when multiple labels resolve the dropped object', () => {
    const proposal = proposeMapperRule(document, samples, 'node_health', { id: 'leaf1', kind: 'node' });
    expect(proposal.status).toBe('ambiguous');
    expect(proposal.candidates.map((candidate) => candidate.telemetryLabel)).toEqual(['device', 'node_id']);
    expect(() => mapperRuleFromProposal({ version: 1, rules: [] }, proposal)).toThrow('Choose one');
    expect(mapperRuleFromProposal({ version: 1, rules: [] }, proposal, 'id:node_id:id')).toMatchObject({
      collection: 'rules',
      value: { join: 'node_id', metric: 'node_health', select: 'node' }
    });
  });

  it('proposes directional joins from parent-link and direction labels', () => {
    const proposal = proposeMapperRule(document, samples, 'interface_bps', {
      id: 'leaf1-leaf2:sourceToTarget', kind: 'linkDirection'
    });
    expect(proposal).toMatchObject({ status: 'ready', targetKind: 'linkDirection' });
    expect(mapperRuleFromProposal({ version: 1, rules: [] }, proposal)).toMatchObject({
      collection: 'rules',
      value: { join: { direction: 'direction', link: 'link_id' }, select: 'linkDirection' }
    });
  });

  it('proposes canonical label resolvers and reports missing joins', () => {
    const labelSamples: MapperAuthoringSample[] = [{
      fields: {}, labels: { device_name: 'edge-a' }, metric: 'health', value: 1
    }];
    const proposal = proposeMapperRule(document, labelSamples, 'health', { id: 'leaf1', kind: 'node' });
    expect(proposal.status).toBe('ready');
    expect(mapperRuleFromProposal({ version: 1, rules: [] }, proposal)).toMatchObject({
      collection: 'mappings',
      value: { target: { resolve: { by: 'label', key: 'device', metricLabel: 'device_name' } } }
    });
    expect(proposeMapperRule(document, labelSamples, 'missing', { id: 'leaf1', kind: 'node' }).status)
      .toBe('missing-join');
  });
});
