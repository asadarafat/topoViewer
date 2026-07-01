# Authoring Model

TopoViewer uses a two-document model:

- Topology YAML describes graph facts.
- Stylesheet YAML describes visual policy.

The split is intentional. A topology should remain useful even when the visual treatment changes, and a stylesheet should be reusable across multiple diagrams.

Use the published JSON Schemas while authoring YAML. They provide autocomplete and catch structural mistakes before runtime:

```yaml
$schema: ../../schemas/topoviewer-topology.schema.json
```

See [YAML schemas](../reference/yaml-schemas.md) for editor and CI setup.

## Top-Level Shape

```yaml
graph:
  id: mv-network
  layers: []
  nodes: []
  links: []
  paths: []
  regions: []

diagram:
  shapes: []
  callouts: []

toggles: []
layout:
  mode: force
```

## Layout Modes

TopoViewer supports three layout modes:

| Mode | Use |
|---|---|
| `manual` | Use authored `position` values exactly. |
| `force` | Use authored positions as seeds, then run deterministic force layout. |
| `clos` | Infer a layer-constrained CLOS-like graph layout from visible nodes and links. |

Use `clos` when the graph is a multi-stage fabric or dependency lattice where
stages matter more than force-directed clustering. The engine is generic: it
does not know that a node is a spine, leaf, gateway, or service unless you
explicitly make those labels part of the layout contract.

The default workflow is:

1. Set `layout.mode: clos`.
2. Omit manual node `position` values unless you intentionally pin nodes.
3. Author links in the intended root-to-leaf direction. `source` is the upstream
   or earlier-stage node; `target` is the downstream or later-stage node.
4. Keep `labels.node`, `labels.role`, and similar fields for styling, filtering,
   and layer controls.
5. Add `stageKey`, `stageOrder`, or `inferLabelRole` only when the graph is
   ambiguous or an existing taxonomy must control stages.

Directed `source` -> `target` links are the strongest automatic root-to-leaf
signal. When direction is not usable, lower endpoint count is used as a fuzzy
root-side signal for ambiguous fabrics. A high-fanout node is not automatically
treated as root if the directed hierarchy says it belongs in a lower stage.
Generic stage-like fields such as `labels.stage`, `data.stage`, `labels.tier`,
or `labels.level` can also act as direct stage hints. Domain labels such as
`labels.node: spine` and `labels.role: pe` do not.

Automatic CLOS layout only needs layout options and directed graph links:

```yaml
layout:
  mode: clos
  width: 860
  height: 420
  clos:
    direction: topToBottom
    nodeGap: 168
    groupGap: 208

graph:
  nodes:
    - id: Spine-1
      name: Spine-1
      labels:
        node: spine
    - id: Leaf-1
      name: Leaf-1
      labels:
        node: leaf
  links:
    - id: Spine-1-Leaf-1
      source: Spine-1
      target: Leaf-1
```

`labels.node: spine` and `labels.node: leaf` can be used by the stylesheet, but
they do not decide stages in this automatic form.

Use `stageKey` when your topology already has a direct stage field and you want
to make that stage source explicit:

```yaml
layout:
  mode: clos
  clos:
    stageKey: labels.stage
    stageOrder: [core, aggregation, access]
    groupKey: labels.site
```

For ambiguous legacy role vocabularies, opt in to label-role inference:

```yaml
layout:
  mode: clos
  inferLabelRole:
    - stage-1: p
    - stage-2: pe
    - stage-3: agg
    - stage-4: access
```

`inferLabelRole` scans classifier values such as labels, data, type, label, and
icon. It is strictly opt-in. Without this block, `labels.role`, `labels.node`,
and similar domain labels stay ordinary graph metadata and do not become stage
rules.

The `CLOS 2-spine 4-leaf` harness template is the practical automatic-layout
example: it has no manual node positions and no `stageKey`. Directed fabric
links place the spines above the leaves; `labels.node` only drives icon and
outline styling.

Use `manual` instead of `clos` when the diagram is hand-composed or has an
operator-approved placement. Use `force` when the graph is cyclic, mesh-heavy,
or does not have a meaningful staged direction.

When embedded in MkDocs, the topology and stylesheet are normally loaded as separate files:

```yaml
topology: ./topoviewer-topo.yaml
stylesheet: ./topoviewer-style.yaml
height: 640px
title: MV network SR-TE service path
```

## Common Entity Fields

Nodes, links, paths, regions, shapes, and callouts share the same base fields.

| Field | Type | Use |
|---|---|---|
| `id` | string | Stable identifier. Required. |
| `name` | string | Human label. |
| `labels` | map | Classification used by stylesheet selectors. |
| `data` | map | Operational facts or metrics shown/used by custom renderers. |
| `layers` | string list | Visibility membership. |
| `icon` | string | Optional direct icon key. Usually prefer stylesheet rules. |
| `style` | map | Per-object escape hatch. Prefer reusable stylesheet rules first. |

Use `labels` for classification, such as `node: router`, `vendor: nokia`, or `protocol: pcep`. Use `data` for values, such as `metric: 20`, `delayMs: 5`, or `sidCount: 3`.

## Authoring For Attention

Attention is driven by graph facts, not by hand-authored highlight styling. The topology YAML declares what exists and how objects relate, and can include a top-level `attention:` block when the focused view is the default for that topology. MkDocs `attention:` blocks, React props, or a workbench/operator UI can override that default for a specific rendered view. See [Topology attention](./attention.md) for the full MkDocs and TypeScript API reference.

| To focus by | Declare in topology YAML |
|---|---|
| Specific object | Stable `id` values on nodes, links, paths, regions, shapes, or callouts. |
| Type, role, site, tenant, vendor, protocol | `labels` key/value pairs. |
| Severity, health, status, counters, timestamps | `data` key/value pairs. |
| Service or transport route | `graph.paths[].sequence`. |
| Site, domain, failure area, collapsed scope | `graph.regions[].members` and optional region hierarchy. |
| Containment | `parent` on child nodes, links, paths, or regions. |
| Dependency or blast radius | Links and paths with correct direction and adjacency. |

Put `attention:` in `topology.yaml` when it describes the default view for that topology. Use a MkDocs block, React prop, or host UI state when a specific rendered instance needs to override that default.

Object focus starts with stable object IDs. This example declares a path so the host can focus the path object and its traversed nodes:

```yaml
graph:
  nodes:
    - id: CORE-1
    - id: CORE-2
    - id: EDGE-1
  paths:
    - id: critical-path
      name: Critical path
      sequence: [CORE-1, CORE-2, EDGE-1]
```

Then the topology can choose that object as its default focus, or a host can pass the same block as an override:

```yaml
attention:
  query:
    pathIds: [critical-path]
    mode: dim-context
```

Expected result: the selected object is focused; for a path, its segments and traversed nodes are focused while unrelated topology remains visible but muted.

Change focus starts with operational facts in `data`:

```yaml
graph:
  nodes:
    - id: CORE-1
      data:
        status: degraded
        changedAt: "2026-06-15T10:30:00Z"
  links:
    - id: core-1-core-2
      source: CORE-1
      target: CORE-2
      data:
        changedAt: "2026-06-15T10:32:00Z"
```

Then the runtime query selects recent changes:

```yaml
attention:
  query:
    changes:
      since: "2026-06-10T00:00:00Z"
    mode: dim-context
```

Expected result: objects with timestamp fields newer than `since` are focused. Revision fields only participate when the query also declares `changes.revision`.

Region collapse starts with a real region:

```yaml
graph:
  nodes:
    - id: AGG-1
    - id: ACC-1
    - id: ACC-2
  regions:
    - id: access-metro
      name: Access metro
      members: [AGG-1, ACC-1, ACC-2]
```

Then the embed chooses to aggregate that region:

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

Expected result: the region starts as one aggregate summary node; clicking the summary expands the member nodes, internal links, and region hull. Clicking the expanded region hull collapses it back into the summary node.

For controlled operations, prefer explicit drill-down over zoom-triggered detail. Viewport thresholds are available when an embedding experience intentionally wants map-style overview/detail transitions, but they should not replace click expansion for ordinary topology inspection:

```yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
    viewport:
      collapseBelowZoom: 0.85
      expandAboveZoom: 1.15
```

Use link grouping when many visible links connect the same endpoint pair:

```yaml
attention:
  links:
    grouping:
      threshold: 2
      by: [endpoints, layer]
      expandOnClick: true
```

Expected result: parallel links in the same layer render as one summary link with `data.members` and `data.count`; clicking the summary expands the member links.

## Model Details

Use [Topology Model](../reference/topology-model.md) for object-by-object YAML details covering layers, nodes, links, paths, regions, toggles, validation, shapes, callouts, and pins. Use [Object Attribute Reference](../reference/object-attributes.md) when you need every schema attribute, accepted value, default, and validation note.
