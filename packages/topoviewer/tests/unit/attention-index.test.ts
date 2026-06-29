import { describe, expect, it } from 'vitest';
import {
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndex,
  buildAttentionIndexCached,
  compileTopoGraph,
  resolveAttentionPresentationCached
} from '../../src';
import { attentionFixture } from './attention-fixture';

describe('buildAttentionIndex', () => {
  it('indexes IDs, labels, and data fields', () => {
    const index = buildAttentionIndex(attentionFixture());

    expect(index.objectIds).toEqual([
      'core-1',
      'dist-1',
      'access-1',
      'core-dist',
      'lsp-critical',
      'stitched-vpn',
      'region-fra'
    ]);
    expect(index.nodeIds).toEqual(['core-1', 'dist-1', 'access-1']);
    expect(index.linkIds).toEqual(['core-dist']);
    expect(index.pathIds).toEqual(['lsp-critical', 'stitched-vpn']);
    expect(index.regionIds).toEqual(['region-fra']);

    expect(index.getNode('core-1')?.entity.label).toBe('Core 1');
    expect(index.getLink('core-dist')?.entity.source).toBe('core-1');
    expect(index.getPath('lsp-critical')?.entity.label).toBe('Critical LSP');
    expect(index.getRegion('region-fra')?.entity.label).toBe('Frankfurt');
    expect(index.getObject('core-1')?.kind).toBe('node');
    expect(index.getObject('core-dist', 'link')?.entity.target).toBe('dist-1');

    expect(index.getByLabel('role', 'core')).toEqual(['core-1']);
    expect(index.getByLabel('site', 'fra')).toEqual(['core-1', 'dist-1', 'access-1']);
    expect(index.getByLabel('service')).toEqual(['lsp-critical', 'stitched-vpn']);
    expect(index.getByLabel('label', 'Frankfurt')).toEqual(['region-fra']);

    expect(index.getByData('severity', 'critical')).toEqual(['core-1', 'lsp-critical']);
    expect(index.getByData('metrics.fanout', 12)).toEqual(['core-1']);
    expect(index.getByData('owner', { team: 'transport' })).toEqual(['lsp-critical']);
    expect(index.getByData('owner.team', 'transport')).toEqual(['lsp-critical']);
    expect(index.getByData('site.code', 'fra')).toEqual(['region-fra']);
  });

  it('indexes region, path, parent-child, adjacency, and reverse adjacency relationships', () => {
    const index = buildAttentionIndex(attentionFixture());

    expect(index.getRegionMembers('region-fra')).toEqual(['core-1', 'dist-1']);
    expect(index.getRegionsByMember('dist-1')).toEqual(['region-fra']);

    expect(index.getPathMembers('lsp-critical')).toEqual(['core-1', 'dist-1', 'access-1']);
    expect(index.getPathMembers('stitched-vpn')).toEqual(['access-1', 'core-1']);
    expect(index.getPathsByMember('core-1')).toEqual(['lsp-critical', 'stitched-vpn']);

    expect(index.getParent('dist-1')).toBe('region-fra');
    expect(index.getParent('access-1')).toBe('dist-1');
    expect(index.getParent('stitched-vpn')).toBe('lsp-critical');
    expect(index.getChildren('dist-1')).toEqual(['access-1']);
    expect(index.getChildren('lsp-critical')).toEqual(['stitched-vpn']);

    expect(index.getOutgoing('core-1')).toEqual(['dist-1']);
    expect(index.getIncoming('dist-1')).toEqual(['core-1']);
    expect(index.getOutgoing('dist-1')).toEqual(['access-1']);
    expect(index.getIncoming('core-1')).toEqual(['access-1']);
    expect(index.getAdjacent('dist-1')).toEqual(['access-1', 'core-1']);
  });

  it('does not mutate the topology document or compiled graph facts while serving reads', () => {
    const doc = attentionFixture();
    const beforeDocument = JSON.stringify(doc);
    const compiled = compileTopoGraph(doc, ['physical']);
    const beforeCompiled = JSON.stringify(compiled);

    const index = buildAttentionIndex(doc);

    expect(Object.isFrozen(index)).toBe(true);
    expect(Object.isFrozen(index.objectIds)).toBe(true);
    expect(Object.isFrozen(index.getByLabel('role'))).toBe(true);
    expect(Object.isFrozen(index.getNode('core-1')?.entity)).toBe(true);
    expect(index.getNode('core-1')?.entity).not.toBe(doc.graph?.nodes?.[0]);

    index.getObject('core-1');
    index.getByData('severity', 'critical');
    index.getRegionMembers('region-fra');
    index.getPathMembers('lsp-critical');
    index.getOutgoing('core-1');
    index.getIncoming('dist-1');
    index.getAdjacent('dist-1');

    expect(JSON.stringify(doc)).toBe(beforeDocument);
    expect(JSON.stringify(compiled)).toBe(beforeCompiled);
  });

  it('builds stable cache keys and reuses compatible attention outputs', () => {
    const doc = attentionFixture();
    const equivalentDoc = attentionFixture();
    const query = { ids: ['core-1'], mode: 'dim-context' as const };

    expect(attentionSourceKey(doc)).toBe(attentionSourceKey(equivalentDoc));
    expect(attentionStateKey(query)).toBe(attentionStateKey({ mode: 'dim-context', ids: ['core-1'] }));
    expect(buildAttentionIndexCached(doc)).toBe(buildAttentionIndexCached(equivalentDoc));
    expect(resolveAttentionPresentationCached(doc, { query })).toBe(resolveAttentionPresentationCached(equivalentDoc, { query }));
  });

  it('indexes link directions as focusable attention objects', () => {
    const doc = attentionFixture();
    if (doc.graph?.links?.[0]) {
      doc.graph.links[0].directions = {
        sourceToTarget: {
          label: 'Core to distribution',
          labels: { directionRole: 'tx' },
          data: { utilization: 82 }
        },
        targetToSource: {
          label: 'Distribution to core',
          labels: { directionRole: 'rx' }
        }
      };
    }

    const index = buildAttentionIndex(doc);

    expect(index.linkDirectionIds).toEqual(['core-dist:sourceToTarget', 'core-dist:targetToSource']);
    expect(index.getLinkDirection('core-dist:sourceToTarget')).toMatchObject({
      kind: 'linkDirection',
      entity: {
        direction: 'sourceToTarget',
        linkId: 'core-dist',
        parentLinkId: 'core-dist',
        source: 'core-1',
        target: 'dist-1'
      }
    });
    expect(index.getByLabel('directionRole', 'tx')).toEqual(['core-dist:sourceToTarget']);
    expect(index.getByData('utilization', 82)).toEqual(['core-dist:sourceToTarget']);
    expect(index.getParent('core-dist:sourceToTarget')).toBe('core-dist');
  });
});
