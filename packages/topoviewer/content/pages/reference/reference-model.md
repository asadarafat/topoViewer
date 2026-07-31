# Reference Model

TopoViewer is a declarative graph renderer with an optional diagram primitive layer. The graph model is semantic first; visual primitives exist to explain the graph, not to replace it.

## Document

A TopoViewer bundle is authored as topology and stylesheet YAML. Rendering
surfaces compose those inputs into one runtime document without changing their
ownership.

| Field | Owner | Semantics |
|---|---|---|
| `version` | Both document schemas | Authoring-model version. Canonical maintained bundles use `"0.2"`; older input requires explicit migration. |
| `graph` | Topology | Semantic graph facts: layers, nodes, links, paths, and regions. |
| `diagram` | Topology | Explanatory primitives: shapes, callouts, and pin/connector helpers. |
| `toggles` | Topology | Reader-visible display switches. |
| `attention` | Topology | Focus, aggregation, grouping, and label-priority policy over semantic objects. |
| `layout` | Stylesheet | Layout policy for `manual`, `force`, `clos`, or `tree` placement. |
| `limits` | Stylesheet | Renderer guardrails for maximum objects and embedded image bytes. |
| `icons` | Stylesheet | Named reusable icon definitions. |
| `labelFields` | Stylesheet | Ordered fields used for labels when a style rule does not override `label`. |
| `stylesheet` | Stylesheet | Selector rules that map graph facts to visual presentation. |

## Graph Objects

Common graph entity fields:

| Field | Values | Use |
|---|---|---|
| `id` | string | Required unique identity, reference key, and default rendered text. |
| `labels` | object of string, number, or boolean values | Optional display alias at `labels.name` plus low-cardinality classifier fields for selectors and filtering. |
| `data` | object | Arbitrary facts such as metrics, severity, inventory IDs, counters, or addresses. |
| `layers` | string array | Visibility layers that include this object. |

Canonical topology objects do not accept generic `name`, generic `label`,
inline `style`, or object-level `icon`. Use `labels.name` for an optional visible
alias and stylesheet rules for persistent appearance. See
[Identity And Source Ownership](../author/identity-and-source-ownership.md).

### Node

A `node` is a semantic thing: router, switch, service endpoint, application, site, tenant, cloud resource, or logical function. Nodes can have `parent` when the child is contained inside another node.

Required: `id`

Recommended: `labels`, `layers`

| Field | Values | Use |
|---|---|---|
| `position` | `[x, y]` or `{ x, y }` | Manual or pinned node position. |
| `parent` | node ID | Places a child node inside a parent node when child rendering is enabled. |
| `pins` | array of pins | Named attachment points for callouts or connectors. |

### Link

A `link` is a direct relationship between two nodes. It is not necessarily physical; it can represent a protocol adjacency, dependency, service relationship, or transport carrier link.

Required: `id`, `source`, `target`

Recommended: `labels`, `layers`

`parent` on a link means the child link is visually carried by another link. The child keeps its real `source` and `target`, but renders as a lane inside the parent link.

| Field | Values | Use |
|---|---|---|
| `source` | node ID | Required source endpoint. |
| `target` | node ID | Required target endpoint. |
| `parent` | link ID | Carries this link inside another link as a child lane. |
| `directions.sourceToTarget` | direction object | Optional telemetry/render channel from `source` toward `target`. |
| `directions.targetToSource` | direction object | Optional telemetry/render channel from `target` toward `source`. |

Use `directions` when one physical adjacency has two independently measured operational directions. The parent `link` remains the single physical relationship; `sourceToTarget` and `targetToSource` are directional strokes rendered inside that same link corridor.

```yaml
links:
  - id: leaf1-spine1
    source: leaf1
    target: spine1
    directions:
      sourceToTarget:
        label: 3.2 Gbps
        labels:
          direction: eastbound
        data:
          metric: if_out_bps
      targetToSource:
        label: 1.1 Gbps
        labels:
          direction: westbound
        data:
          metric: if_out_bps
```

Direction objects accept `id`, their specialized rendered `label`, `labels`, and
`data`. Direction appearance belongs in `linkDirection` stylesheet rules. If
`id` is omitted, TopoViewer derives a stable ID from the parent link ID and
direction key, such as `leaf1-spine1:sourceToTarget`.

### Path

A `path` has two modes.

Sequenced path:

```yaml
paths:
  - id: transport-agg1-agg2
    labels:
      name: AGG transport carrier
    sequence: [AGG1, PE1, P, PE2, AGG2]
```

Stitched child path:

```yaml
paths:
  - id: stitched-services
    labels:
      name: Services A-J stitched over transport
    source: services-a
    target: services-j
    parent: transport-agg1-agg2
```

A stitched child path renders as:

- Stub from child source to the first node of the parent path.
- Lane across every parent path segment.
- Stub from the last node of the parent path to the child target.

| Field | Values | Use |
|---|---|---|
| `sequence` | node ID array | Ordered node traversal for a parent or standalone path. |
| `source` | node ID | Child path source when stitching into a parent path. |
| `target` | node ID | Child path target when stitching into a parent path. |
| `parent` | path ID | Parent sequence that carries the child path. |

### Region

A `region` is membership and scope: AS, IGP area, site, rack, cloud region, tenant, failure domain, or ownership boundary.

`members` can contain node IDs and region IDs. `parent` creates region hierarchy.

| Field | Values | Use |
|---|---|---|
| `members` | node or region ID array | Objects enclosed by the region hull. |
| `parent` | region ID | Nests this region inside another region. |
| `position` | coordinate pair | Topology-owned origin used by an explicit region. |

Explicit `width` and `height`, auto-fit padding, minimum dimensions,
member-size policy, and nested-region spacing are region stylesheet keys.
Author both dimensions on a matching region selector to use explicit geometry.
Topology-side geometry is rejected; use `migrateTopoBundle` explicitly for an
older bundle.

### Shape

A `shape` is a decorative or explanatory primitive. Shapes are not graph facts. Use them for geometry, backgrounds, callout frames, device silhouettes, and slide/document composition.

| Field | Values | Use |
|---|---|---|
| `position` | `[x, y]` or `{ x, y }` | Shape position. |
| `locked` | boolean | Prevents authoring tools from moving the shape. |
| `pins` | array of pins | Named attachment points. |

Shape geometry, `width`, `height`, and `rotation` are stylesheet keys. Select
shapes by stable `id`, `labels`, or `data`, then keep fill, stroke, dimensions,
and geometry in the matching rule. Topology-side `type`, `size`, and `rotation`
are rejected; use `migrateTopoBundle` explicitly for an older bundle.

### Callout

A `callout` is explanatory text with optional leader line. Callout text supports constrained Markdown. Callouts can target graph objects, shapes, pins, or absolute positions.

| Field | Values | Use |
|---|---|---|
| `position` | `[x, y]` or `{ x, y }` | Callout position. |
| `title` | string | Optional title line. |
| `body` | string or string array | Plain or markdown-compatible body text. |
| `markdown` | string or string array | Explicit markdown body. |
| `source`, `target` | object ID | Optional leader endpoints. |
| `sourcePin`, `targetPin` | pin ID | Optional named pin endpoints. |
| `sourcePosition`, `targetPosition` | `[x, y]` or `{ x, y }` | Absolute leader endpoints. |
| `locked` | boolean | Prevents authoring tools from moving the callout. |
| `pins` | array of pins | Named attachment points. |

Style callout `width`, `height`, `textAlign`, and leader appearance with an
exact-ID or semantic `callout` stylesheet rule. Presentation is not stored in
the callout topology object.

### Pins And Connectors

| Field | Values | Use |
|---|---|---|
| `pin.id` | string | Named attachment point. |
| `pin.position` | `[x, y]` or `{ x, y }` | Pin position relative to its owner. |
| `pin.x`, `pin.y` | number | Alternate pin coordinate fields. |
| `connector.source`, `connector.target` | object ID | Visual connector endpoints. |
| `connector.sourcePin`, `connector.targetPin` | pin ID | Named endpoint pins. |
| `connector.sourcePosition`, `connector.targetPosition` | `[x, y]` or `{ x, y }` | Absolute connector endpoints. |

## Layers

Layers are author-controlled visibility groups. They are not fixed to networking layers. Use whatever layer model fits the diagram, such as:

- `physical`
- `underlay`
- `isis`
- `bgp`
- `transport`
- `service`
- `observability`
- `failure-domain`

Objects may belong to multiple layers.

| Field | Values | Use |
|---|---|---|
| `id` | string | Stable layer ID referenced by objects and render controls. |
| `labels.name` | string | Optional reader-facing alias; `id` is used when omitted. |

## Layout

`layout` is authored in stylesheet YAML.

`layout.mode` controls node placement:

| Mode | Behavior |
|---|---|
| `manual` | Uses authored node positions. |
| `force` | Runs deterministic force layout from authored seed positions. |
| `clos` | Infers stage-constrained CLOS-like rows or columns from graph structure, directed hierarchy, endpoint counts, and optional hints. |
| `tree` | Places directed hierarchies and disconnected forests deterministically from stable object IDs. |

Common layout fields:

| Field | Values | Use |
|---|---|---|
| `mode` | `manual`, `force`, `clos`, `tree` | Selects the layout engine. |
| `width`, `height` | number | Viewport coordinate space used by layout and examples. |
| `iterations` | number | Force layout iteration count. |
| `linkDistance` | number | Force layout preferred edge length. |
| `chargeStrength` | number | Force layout repulsion strength. |
| `collideRadius` | number | Force layout collision radius. |
| `centerStrength` | number | Force layout centering force. |
| `clos` | object | Generic CLOS layout options. |
| `tree` | object | Directed tree/forest layout options. |
| `inferLabelRole` | mapping | Compatibility shortcut for CLOS role overrides. Prefer `layout.clos.inferLabelRole`. |

Generic CLOS options:

| Field | Values | Use |
|---|---|---|
| `direction` | `topToBottom`, `bottomToTop`, `leftToRight`, `rightToLeft` | Stage direction. |
| `stageCount` | number or `auto` | Fixed or inferred stage count. |
| `maxStages` | number | Safety cap for inferred stages. |
| `stageKey` | label/data path or `auto` | Explicit stage field. |
| `stageOrder` | string array | Authored stage order. |
| `inferLabelRole` | mapping or mapping array | Optional classifier-to-stage override. Not enabled by default. |
| `groupKey` | label/data path or `auto` | Field used to group nodes along the cross axis. |
| `preservePinned` | boolean | Preserve positions for pinned nodes. |
| `pinnedNodeIds` | string array | Node IDs whose positions should be preserved. |
| `stageGap`, `nodeGap`, `groupGap` | number | Spacing controls. |

`clos` is generic. It does not require data-center-specific roles. Use
`layout.inferLabelRole` when labels/data should explicitly override fuzzy
inference; it is not enabled by default. Without explicit hints, directed
`source` -> `target` links define the root-to-leaf order when they form a clear
hierarchy, and low endpoint count is used as a fuzzy fallback when direction is
not usable. Use `layout.clos.stageKey`, `stageOrder`, and `groupKey` when the
topology has a direct stage field or authored taxonomy should control stage and
group order.

Practical rules:

- Generic stage-like fields such as `labels.stage`, `data.stage`, `labels.tier`,
  and `labels.level` may be used as direct stage hints.
- `labels.node`, `labels.role`, and similar labels are classifiers for selectors
  and filters. They do not control CLOS stages unless referenced by `stageKey`
  or mapped through `inferLabelRole`.
- The automatic root side is inferred from directed hierarchy first. A node with
  many downstream links can still be placed below a lower-degree upstream node
  when link direction makes that hierarchy clear.
- TopoViewer does not use a `rootNodeIds` YAML field for CLOS layout. If the
  automatic hierarchy is not enough, author a stage field and use `stageKey` or
  switch to `manual`.
- Use `force` for organic meshes and cyclic graphs where staged rows would imply
  a false hierarchy.

Tree options:

| Field | Values | Use |
|---|---|---|
| `direction` | `topToBottom`, `bottomToTop`, `leftToRight`, `rightToLeft` | Hierarchy direction. |
| `levelGap` | 40-1000 | Distance between hierarchy levels. |
| `nodeGap` | 40-800 | Distance between nodes at one level. |
| `componentGap` | 40-1600 | Distance between disconnected tree components. |

Tree layout uses stable fallback roots for cyclic or rootless components so
placement completes deterministically. That behavior is a rendering fallback,
not a claim that a cyclic graph satisfies strict tree semantics.

TopoViewer's base model is logical and Cartesian. It does not define latitude,
longitude, map projection, tiles, geocoding, or hybrid geo/logical composition.
Keep geographic facts in domain data and use a host-owned adapter when a map is
required. See [Architecture](../evaluate/architecture.md#logical-topology-scope).

## Toggles

Top-level `toggles` define reader-visible switches. Runtime `TopoViewerToggles`
control built-in viewer behavior.

| Field | Values | Use |
|---|---|---|
| `toggles[].id` | string | Stable toggle ID. |
| `toggles[].name` | string | Reader-facing toggle name. |
| `toggles[].default` | boolean | Initial toggle state. |
| `showRegions` | boolean | Runtime toggle for region hull visibility. |
| `showChildNodesInsideParents` | boolean | Runtime toggle for parent-child node rendering. |
| `showServicesInsideNodes` | boolean | Runtime toggle for service-like child content. |
| `showEdgeLabels` | boolean | Runtime toggle for edge labels. |

## Limits

`limits` is authored in stylesheet YAML.

Renderer limits fail early before a diagram becomes unsafe or unusable.

| Field | Values | Use |
|---|---|---|
| `maxNodes` | number | Maximum graph nodes. |
| `maxEdges` | number | Maximum rendered links/path segments. |
| `maxPathSegments` | number | Maximum path segments. |
| `maxLabels` | number | Maximum rendered labels. |
| `maxCallouts` | number | Maximum diagram callouts. |
| `maxShapes` | number | Maximum diagram shapes. |
| `maxImageBytes` | number | Maximum embedded image/SVG payload size. |

## Icons

`icons` is authored in stylesheet YAML.

Icons are reusable named assets referenced by node stylesheet rules.

| Field | Values | Use |
|---|---|---|
| `glyph` | string | Text glyph fallback. |
| `fill` | color | Default icon fill or node background fallback. |
| `stroke` | color | Default icon stroke or node border fallback. |
| `svg` | inline SVG string | Inline vector icon. Subject to safety checks. |
| `src` | URL or path | External image source. Subject to safety checks. |
| `alt` | string | Accessible description. |

## Stylesheet

| Field | Values | Use |
|---|---|---|
| `stylesheet[].selector` | selector string | Matches object kind, ID, labels, or data. |
| `stylesheet[].style` | style object | Visual keys from the canonical style registry. |
| `labelFields` | string array | Ordered field names used to derive labels. |

## Labels

`labels` are classifier tags used by selectors and filters. `labels.name` is the
one reserved optional display alias. Keep other labels short, stable, and
low-cardinality.

Good:

```yaml
labels:
  node: router
  vendor: nokia
  role: pe
```

Avoid putting high-cardinality facts in `labels`; use `data` instead.

## Data

`data` is arbitrary domain metadata. Use it for metrics, counts, IDs, addresses, service counts, SRLGs, circuit IDs, and external references.

The renderer preserves `data`, but style rules should not depend on every possible data field. Use stable labels for styling.

## Attention

Attention is optional. It gives hosts a declarative way to focus, dim,
aggregate, group, or prioritize labels in dense topologies.

| Field | Values | Use |
|---|---|---|
| `attention.query` | focus query | Default focus query for the document. |
| `attention.interactive` | boolean | Enables interactive focus behavior. |
| `attention.clickMode` | focus mode | Focus mode used when clicking objects. |
| `attention.aggregate.groups` | aggregate group definitions | Region, parent, or label groups that can collapse into summaries. |
| `attention.aggregate.expandedGroupIds` | string array | Aggregate groups expanded by default. |
| `attention.aggregate.expandOnClick` | boolean | Expand collapsed groups when clicked. |
| `attention.aggregate.viewport` | viewport policy | Optional zoom/viewport policy for aggregate behavior. |
| `attention.links.grouping` | link grouping options | Summarize parallel links by endpoint, layer, or authored keys, optionally limited by a link selector. |

Keep attention defaults practical. Object focus with dimmed context is the
default authoring expectation; more advanced aggregate and link grouping should
be declared only when the graph is dense enough to need it.

## Parent Semantics

| Object | Parent meaning |
|---|---|
| `node.parent` | Child node is contained by parent node. |
| `link.parent` | Child link is carried by parent link. |
| `path.parent` | Child path is carried by sequenced parent path. |
| `region.parent` | Region is nested inside parent region. |

Parent relationships are semantic. Do not use them as a visual shortcut.

## Validation Levels

TopoViewer has two validation layers:

- JSON Schema validates document shape.
- Semantic lint validates meaning: references, parents, layers, identities, limits, selectors, and unsafe references.
