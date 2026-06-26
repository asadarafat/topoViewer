# TopoViewer Reference Model

TopoViewer is a declarative graph renderer with an optional diagram primitive layer. The graph model is semantic first; visual primitives exist to explain the graph, not to replace it.

## Document

A TopoViewer document may be split into topology and stylesheet YAML, or composed as one object.

| Field | Semantics |
|---|---|
| `version` | Authoring-model version. Missing versions migrate to the current compatible version. |
| `graph` | Semantic graph facts: layers, nodes, links, paths, and regions. |
| `diagram` | Explanatory primitives: shapes, callouts, and pin/connector helpers. |
| `toggles` | Reader-visible display switches. |
| `layout` | Layout policy for `manual`, `force`, or `clos` placement. |
| `limits` | Renderer guardrails for maximum objects and embedded image bytes. |
| `icons` | Named reusable icon definitions. |
| `labelFields` | Ordered fields used for labels when a style rule does not override `label`. |
| `stylesheet` | Selector rules that map graph facts to visual presentation. |

## Graph Objects

### Node

A `node` is a semantic thing: router, switch, service endpoint, application, site, tenant, cloud resource, or logical function. Nodes can have `parent` when the child is contained inside another node.

Required: `id`

Recommended: `name`, `labels`, `layers`

### Link

A `link` is a direct relationship between two nodes. It is not necessarily physical; it can represent a protocol adjacency, dependency, service relationship, or transport carrier link.

Required: `id`, `source`, `target`

Recommended: `name`, `labels`, `layers`

`parent` on a link means the child link is visually carried by another link. The child keeps its real `source` and `target`, but renders as a lane inside the parent link.

### Path

A `path` has two modes.

Sequenced path:

```yaml
paths:
  - id: transport-agg1-agg2
    name: AGG transport carrier
    sequence: [AGG1, PE1, P, PE2, AGG2]
```

Stitched child path:

```yaml
paths:
  - id: stitched-services
    name: Services A-J stitched over transport
    source: services-a
    target: services-j
    parent: transport-agg1-agg2
```

A stitched child path renders as:

- Stub from child source to the first node of the parent path.
- Lane across every parent path segment.
- Stub from the last node of the parent path to the child target.

### Region

A `region` is membership and scope: AS, IGP area, site, rack, cloud region, tenant, failure domain, or ownership boundary.

`members` can contain node IDs and region IDs. `parent` creates region hierarchy.

### Shape

A `shape` is a decorative or explanatory primitive. Shapes are not graph facts. Use them for geometry, backgrounds, callout frames, device silhouettes, and slide/document composition.

### Callout

A `callout` is explanatory text with optional leader line. Callout text supports constrained Markdown. Callouts can target graph objects, shapes, pins, or absolute positions.

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

## Layout

`layout.mode` controls node placement:

| Mode | Behavior |
|---|---|
| `manual` | Uses authored node positions. |
| `force` | Runs deterministic force layout from authored seed positions. |
| `clos` | Infers stage-constrained CLOS-like rows or columns from graph structure, directed hierarchy, endpoint counts, and optional hints. |

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

## Labels

`labels` are classifier tags used by selectors and filters. Keep labels short, stable, and low-cardinality.

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
- Semantic lint validates meaning: references, parents, layers, names, limits, selectors, and unsafe references.
