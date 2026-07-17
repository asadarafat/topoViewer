# Attention TypeScript API

Use this page when a host application needs to build search, focus, scoring, aggregate, or custom presentation state with the TopoViewer attention engine. For YAML authoring, start with [Topology Attention](../author/attention.md).

The same engine is exposed from the npm package:

```ts
import {
  TopoViewer,
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndex,
  buildAttentionIndexCached,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  resolveAttentionPresentationCached,
  resolveFocusQuery,
  scoreAttention,
  type FocusQuery,
  type TopoDocument
} from 'topoviewer';
```

### Build An Index

Use `buildAttentionIndex` when you need direct lookup tables for UI search, filters, or diagnostics:

```ts
const index = buildAttentionIndex(documentSpec);

console.log(index.nodeIds);
console.log(index.getByLabel('role', 'pe'));
console.log(index.getByData('metrics.fanout', 12));
console.log(index.getPathMembers('critical-path'));
console.log(index.getRegionMembers('access-metro'));
console.log(index.getOutgoing('CORE-1'));
```

Use `buildAttentionIndexCached` when repeated interactions run against the same source graph:

```ts
const index = buildAttentionIndexCached(documentSpec);
```

### Resolve Focus

`resolveFocusQuery` returns sets for `focusedIds`, `relatedIds`, `contextIds`, and `hiddenIds`, plus reason metadata:

```ts
const query: FocusQuery = {
  labels: { role: ['pe', 'p'] },
  dependency: {
    from: ['CORE-1'],
    direction: 'downstream',
    depth: 2
  },
  mode: 'dim-context'
};

const focus = resolveFocusQuery(index, query);

console.log(Array.from(focus.focusedIds));
console.log(Array.from(focus.relatedIds));
console.log(focus.reasons.get('CORE-1'));
```

Invalid object IDs, invalid dependency depth, or unsupported modes throw `FocusQueryError`.

### Score And Present

Scoring is deterministic and explainable. It considers focus matches, related matches, path membership, severity, fanout, recent change markers, and proximity to focused objects.

```ts
const focus = resolveFocusQuery(index, {
  pathIds: ['critical-path'],
  mode: 'dim-context'
});

const scores = scoreAttention(index, focus, {
  severityWeights: {
    critical: 90,
    degraded: 60
  }
});

const presentation = deriveAttentionPresentation(index, focus, scores, {
  suppressBelowScore: 10
});

console.log(presentation.items.get('CORE-1'));
console.log(explainAttentionScore(scores, 'CORE-1'));
```

Presentation states are `focused`, `related`, `context`, `dimmed`, `hidden`, `aggregate`, and `suppressed`. Label priorities are `focused`, `high`, `medium`, `low`, `aggregate`, and `hidden`.

### Derive Aggregates

`deriveAggregateGraph` returns a new document. It does not mutate the source topology.

```ts
const aggregate = deriveAggregateGraph(documentSpec, index, {
  groups: [
    { id: 'access-metro', by: 'region', regionId: 'access-metro', label: 'Access metro' },
    { id: 'pe-services', by: 'parent', parentId: 'PE-1', label: 'PE-1 services' },
    { id: 'access-role', by: 'label', key: 'role', value: 'access', label: 'Access nodes' }
  ],
  expandedGroupIds: [],
  linkGrouping: {
    threshold: 2,
    by: ['endpoints', 'layer'],
    selector: 'link[labels.link = "parallel"]'
  }
});

console.log(aggregate.document);
console.log(aggregate.groups[0]?.severitySummary);
console.log(aggregate.linkGroups[0]?.memberIds);
```

Use `expandedGroupIds` to leave specific groups expanded while other groups stay collapsed.

When `expandOnClick` is enabled, clicking a collapsed aggregate summary expands it. For region and parent aggregates, clicking the expanded source region hull or parent node collapses that group again.

When link grouping `expandOnClick` is enabled, clicking an aggregate link expands only that link group. Use `selector` to limit grouping eligibility to a deliberate link family. Without a selector, all non-parent, non-pipe links remain eligible, preserving the global grouping behavior. Optional zoom policies can group or ungroup links automatically without changing the source topology, but click expansion is the more predictable default for operator workflows.

### Render With React

Pass an attention query directly to `TopoViewer`:

```tsx
<TopoViewer
  document={documentSpec}
  attention={{
    query: {
      pathIds: ['critical-path'],
      mode: 'dim-context'
    }
  }}
/>
```

Or pass a precomputed presentation when the host owns focus/scoring:

```tsx
const presentation = deriveAttentionPresentation(index, focus, scores);

<TopoViewer
  document={documentSpec}
  attention={{ presentation }}
/>
```

For repeated renders, use the cached resolver:

```ts
const presentation = resolveAttentionPresentationCached(documentSpec, {
  query: {
    changes: {
      since: '2026-06-10T00:00:00Z'
    },
    mode: 'dim-context'
  }
});
```

Cache keys are available when host code needs to memoize its own view model:

```ts
const sourceKey = attentionSourceKey(documentSpec);
const stateKey = attentionStateKey({ ids: ['CORE-1'], mode: 'dim-context' });
```
