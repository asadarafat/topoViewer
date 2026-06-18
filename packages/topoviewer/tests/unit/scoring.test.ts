import { describe, expect, it } from 'vitest';
import {
  buildAttentionIndex,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  resolveFocusQuery,
  scoreAttention
} from '../../src';
import { attentionFixture } from './attention-fixture';

describe('scoreAttention', () => {
  it('scores focus match, path membership, severity, fanout, recent change, and context proximity', () => {
    const index = buildAttentionIndex(attentionFixture());
    const pathFocus = resolveFocusQuery(index, { pathIds: ['lsp-critical'] });
    const pathScores = scoreAttention(index, pathFocus);

    expect(pathScores.scores.get('core-1')?.reasons).toContain('focus-match:+100');
    expect(pathScores.scores.get('core-1')?.reasons).toContain('path-membership:lsp-critical,stitched-vpn:+30');
    expect(pathScores.scores.get('core-1')?.reasons).toContain('severity:severity=critical:+70');
    expect(pathScores.scores.get('core-1')?.reasons).toContain('dependency-fanout:2:+12');
    expect(pathScores.scores.get('access-1')?.reasons).toContain('recent-change:+20');

    const idFocus = resolveFocusQuery(index, { ids: ['core-1'] });
    const idScores = scoreAttention(index, idFocus);
    expect(idScores.scores.get('dist-1')?.reasons).toContain('context-proximity:focused-neighbor:+12');
    expect(explainAttentionScore(idScores, 'dist-1')).toEqual(idScores.scores.get('dist-1')?.reasons);
  });

  it('derives default presentation states and label priority', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);
    const focus = resolveFocusQuery(index, { ids: ['core-1'], mode: 'dim-context' });
    const scores = scoreAttention(index, focus);
    const presentation = deriveAttentionPresentation(index, focus, scores);

    expect(presentation.items.get('core-1')).toMatchObject({
      state: 'focused',
      labelPriority: 'focused'
    });
    expect(presentation.items.get('dist-1')).toMatchObject({
      state: 'dimmed',
      labelPriority: 'high'
    });

    const hiddenFocus = resolveFocusQuery(index, { ids: ['core-1'], mode: 'hide-context' });
    const hidden = deriveAttentionPresentation(index, hiddenFocus, scoreAttention(index, hiddenFocus));
    expect(hidden.items.get('dist-1')).toMatchObject({
      state: 'hidden',
      labelPriority: 'hidden'
    });

    const suppressedFocus = resolveFocusQuery(index, { ids: ['core-1'], mode: 'highlight' });
    const suppressed = deriveAttentionPresentation(index, suppressedFocus, scoreAttention(index, suppressedFocus), {
      suppressBelowScore: 10
    });
    expect(suppressed.items.get('region-fra')).toMatchObject({
      state: 'suppressed',
      labelPriority: 'hidden'
    });
  });

  it('assigns aggregate label priority for aggregate overview objects', () => {
    const document = attentionFixture();
    const index = buildAttentionIndex(document);
    const aggregate = deriveAggregateGraph(document, index, {
      groups: [{ id: 'fra', by: 'region', regionId: 'region-fra' }]
    });
    const aggregateIndex = buildAttentionIndex(aggregate.document);
    const focus = resolveFocusQuery(aggregateIndex, {});
    const presentation = deriveAttentionPresentation(aggregateIndex, focus, scoreAttention(aggregateIndex, focus));

    expect(presentation.items.get('aggregate:fra')).toMatchObject({
      state: 'aggregate',
      labelPriority: 'aggregate'
    });
  });
});
