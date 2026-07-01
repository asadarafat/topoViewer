# Topology Attention

Attention is TopoViewer's way to show what matters in dense topology. The source topology stays complete. A focused view is derived from stable graph facts: IDs, labels, data fields, paths, regions, parent-child relationships, and link/path adjacency.

There are two authoring layers:

- `topology.yaml` declares the facts attention can search and derive from, and may include a top-level `attention:` block for the default view.
- MkDocs `attention:` blocks, React props, or TypeScript calls can override that default for a specific rendered view.

Use topology-level `attention:` when the focus behavior is part of the intended default view for that topology. Use a MkDocs block or React prop when the same topology needs different focus states in different places.

## Topology Facts

| User intent | Declare in topology YAML |
|---|---|
| Focus one known object | Stable `id` on the node, link, path, or region. |
| Focus by role, site, tenant, vendor, protocol, service | `labels` key/value pairs. |
| Focus by severity, health, operational state, counters, timestamps | `data` key/value pairs. Nested objects are addressable by dot path. |
| Focus an LSP, service path, traffic path, or ordered dependency chain | `graph.paths[].sequence` or path `source`/`target` with `parent`. |
| Focus or collapse a site, domain, failure area, or ownership boundary | `graph.regions[].members`. |
| Collapse child services, interfaces, or logical objects under a parent | `parent` on the child nodes, links, paths, or regions. |
| Traverse blast radius | Directed `graph.links` and `graph.paths` adjacency. |

Example attention-ready topology facts:

```yaml
graph:
  nodes:
    - id: CORE-1
      labels:
        role: core
        site: fra
      data:
        severity: critical
        changedAt: "2026-06-15T10:30:00Z"
        metrics:
          fanout: 12

  links:
    - id: core-dist
      source: CORE-1
      target: DIST-1
      labels:
        media: fiber

  paths:
    - id: critical-path
      sequence: [CORE-1, DIST-1, ACCESS-1]

  regions:
    - id: access-metro
      members: [DIST-1, ACCESS-1, ACCESS-2]
```

## Topology Attention Block

Topology YAML can carry the default attention state:

```yaml
graph:
  nodes:
    - id: CORE-1
    - id: CORE-2
  links:
    - id: core-link
      source: CORE-1
      target: CORE-2

attention:
  interactive: true
  clickMode: dim-context
```

## MkDocs Attention Blocks

MkDocs can also expose attention declaratively next to the rendered view. This overrides any topology-level `attention:` block for that rendered instance:

```yaml
topology: ./topology.yaml
stylesheet: ./stylesheet.yaml
attention:
  query:
    ids: [CORE-1]
    mode: dim-context
```

The public block supports:

| Field | Use |
|---|---|
| `attention.interactive` | Enables click-to-focus. Clicking a node, link, path segment, or region applies a focus query for that object; clicking empty viewport space clears the active focus. |
| `attention.clickMode` | Focus mode used by click-to-focus. |
| `attention.query` | Static focus query applied when the page loads. |
| `attention.aggregate` | Derived aggregate view applied when the page loads. |

### Focus Query Fields

`attention.query` can combine multiple criteria. Matches are unioned into the focused set.

| Query field | Source facts | Behavior |
|---|---|---|
| `ids` | Any graph object `id` | Focuses exact objects. |
| `labels` | `labels.*` and direct `label` | Focuses objects with matching classification values. Values can be scalar or lists. |
| `data` | `data.*` | Focuses objects with matching operational values. Nested fields use dot paths such as `metrics.fanout`. |
| `pathIds` | `graph.paths[].id` | Focuses the path object and its member nodes. Rendered path segments are emphasized. |
| `regionIds` | `graph.regions[].id` | Focuses the region object and its member nodes. |
| `selectors` | Stylesheet selector syntax | Focuses objects matching selectors such as `link[labels.media = "fiber"]`. |
| `dependency` | Directed links and path sequences | Focuses seed objects and marks upstream, downstream, or bidirectional neighbors as related up to `depth`. |
| `changes` | `data.changed`, timestamps, revisions | Focuses objects changed since a timestamp or revision baseline. |
| `mode` | Runtime presentation | One of `highlight`, `dim-context`, or `hide-context`. Defaults to `dim-context`. |

### Focus Modes

| Mode | Expected result |
|---|---|
| `highlight` | Focused and related objects are emphasized; context remains normal. |
| `dim-context` | Focused and related objects are emphasized; non-matching context remains visible but muted. This is the default for dense topology. |
| `hide-context` | Non-matching context is hidden. Use this when the user needs an isolated subgraph. |

### Query Examples

Focus one object:

```yaml
attention:
  query:
    ids: [CORE-1]
    mode: dim-context
```

Focus by labels:

```yaml
attention:
  query:
    labels:
      role: [pe, p]
      site: fra
    mode: dim-context
```

Focus by operational data, including nested fields:

```yaml
attention:
  query:
    data:
      severity: critical
      metrics.fanout: 12
    mode: dim-context
```

Focus by selector:

```yaml
attention:
  query:
    selectors:
      - link[labels.media = "fiber"]
      - node[data.severity = "critical"]
    mode: dim-context
```

Focus a path:

```yaml
attention:
  query:
    pathIds: [critical-path]
    mode: dim-context
```

Focus a region:

```yaml
attention:
  query:
    regionIds: [access-metro]
    mode: dim-context
```

Traverse dependency:

```yaml
attention:
  query:
    dependency:
      from: [CORE-1]
      direction: downstream
      depth: 2
    mode: dim-context
```

`direction` can be `upstream`, `downstream`, or `both`. Depth `0` focuses only the seed objects.

Focus changes:

```yaml
attention:
  query:
    changes:
      since: "2026-06-10T00:00:00Z"
    mode: dim-context
```

`changes.since` checks timestamp fields under `data.*`: `changedAt`, `updatedAt`, `lastChangedAt`, and `modifiedAt` by default. Override with `timestampFields` when the source system uses a different field:

```yaml
attention:
  query:
    changes:
      since: "2026-06-10T00:00:00Z"
      timestampFields: [lastAlarmChangeAt]
```

Revision focus is explicit:

```yaml
attention:
  query:
    changes:
      revision: 41
      revisionFields: [revision, inventoryVersion]
```

Numeric revisions match when the current value is greater than the baseline. String revisions match when they differ from the baseline.

Enable click-to-focus:

```yaml
attention:
  interactive: true
  clickMode: dim-context
```

With interactive attention, an object click focuses that object and an empty viewport click resets the view to the unfocused topology.

### Aggregate Examples

Collapse by region:

```yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
        label: Access metro
    expandOnClick: true
```

Collapse by parent-child relationship:

```yaml
attention:
  aggregate:
    groups:
      - id: pe-services
        by: parent
        parentId: PE-1
        label: PE-1 services
```

Collapse by label-defined group:

```yaml
attention:
  aggregate:
    groups:
      - id: access-role
        by: label
        key: role
        value: access
        label: Access nodes
```

Start with a group already expanded:

```yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
    expandedGroupIds: [access-metro]
    expandOnClick: true
```

Prefer explicit drill-down for operator control. Keep summaries collapsed in the overview, then let the operator expand and collapse the group they intend to inspect:

```yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
        label: Access metro
    expandedGroupIds: []
    expandOnClick: true
```

Zoom thresholds are available as an advanced host policy, but they should not be the default way to teach or operate dense topology views. Use them only when the embedding experience intentionally wants map-style overview/detail transitions:

```yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
        label: Access metro
    expandOnClick: true
    viewport:
      collapseBelowZoom: 0.85
      expandAboveZoom: 1.15
```

At low zoom, the group is rendered as one aggregate summary. At high zoom, the source members and region hull are rendered again. `viewport.groupIds` can limit the policy to specific aggregate groups. The source topology is unchanged either way.

Aggregate nodes expose summary data:

```yaml
labels:
  aggregate: 'true'
  aggregateBy: region
  nodes: 3
  links: 3
  severity: major
  major: 1
data:
  isAggregate: true
  aggregateId: access-metro
  aggregateBy: region
  members: [AGG-1, ACC-1, ACC-2]
  childCount: 3
  linkCount: 3
  severitySummary:
    major: 1
    normal: 2
```

Use the label fields for at-a-glance styling and visible metadata. Use the
`data.*` fields when a host app needs exact membership, counts, or drill-down
details.

### Link Grouping

Group parallel links when the visible link count crosses a threshold:

```yaml
attention:
  links:
    grouping:
      enabled: true
      threshold: 2
      by: [endpoints, layer]
      expandOnClick: true
```

The default grouping key is `[endpoints, layer]`, which keeps unrelated links separate and only summarizes links between the same visible endpoint pair in the same layer. The aggregate link keeps `data.members`, `data.count`, and `data.isLinkAggregate` for labels, styling, export, and click-to-expand behavior. When the group is expanded, same-endpoint links using `curveStyle: bezier` are drawn as bundled quadratic Bezier edges with distinct control-point curvature. Set `controlPointStepSize` in the link style when the default separation needs to be stronger.

Link grouping can also follow viewport zoom:

```yaml
attention:
  links:
    grouping:
      threshold: 2
      viewport:
        groupBelowZoom: 0.8
        ungroupAboveZoom: 1.2
```

## TypeScript API

Use [Attention TypeScript API](attention-typescript-api.md) when the host application owns attention indexing, scoring, aggregates, cached presentation state, or custom React integration.

## Exact Reference

Use [Attention Reference](attention-reference.md) for schema-backed object families, focus modes, click behavior, aggregate summary fields, and validation commands.

## Public Examples

The [Attention examples](reference/attention/index.md) page is generated from the canonical test catalog and includes live viewports, topology YAML, and stylesheet YAML for:

- Object focus and click-to-focus.
- Change focus from timestamp metadata.
- Region focus.
- Dependency focus.
- Explicit ID, label, data, and selector focus.
- Hide-context mode.
- Region, parent, and label aggregation.

The canonical attention examples put their default `attention:` block in `topology.yaml`. A page-specific MkDocs `attention:` block is still useful when one topology needs multiple rendered focus states.
