# TopoViewer Authoring Model

TopoViewer uses a two-document model:

- Topology YAML describes graph facts.
- Stylesheet YAML describes visual policy.

The split is intentional. A topology should remain useful even when the visual treatment changes, and a stylesheet should be reusable across multiple diagrams.

Use the published JSON Schemas while authoring YAML. They provide autocomplete and catch structural mistakes before runtime:

```yaml
$schema: ../../schemas/topoviewer-topology.schema.json
```

See [YAML schemas](schemas.md) for editor and CI setup.

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

Attention is driven by graph facts, not by hand-authored highlight styling. The topology YAML declares what exists and how objects relate, and can include a top-level `attention:` block when the focused view is the default for that topology. MkDocs `attention:` blocks, React props, or a workbench/operator UI can override that default for a specific rendered view. See [Topology attention](attention.md) for the full MkDocs and TypeScript API reference.

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

For large views, add viewport thresholds so overview and detail change with zoom:

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

## Layers

Layers are orthogonal visibility groups. They are not fixed by TopoViewer.

```yaml
graph:
  layers:
    - id: physical
      name: Physical
    - id: igp
      name: IGP
    - id: transport
      name: Transport
    - id: service
      name: Service
```

A graph object can belong to one or many layers.

## Nodes

```yaml
nodes:
  - id: R01
    name: R01
    labels:
      node: router
      vendor: nokia
      role: pe
    layers: [physical, igp, transport, service]
    position: [90, 260]
```

`position` can be either `[x, y]` or `{ x: 90, y: 260 }`. The list form is preferred for compact YAML. In force-layout mode, positions are seeds; the layout engine may adjust them.

Any logical child node can be nested inside a parent node with `parent`. A service endpoint inside a router is one common example, but the model is generic. When `showChildNodesInsideParents` is enabled, TopoViewer auto-expands the parent node around its visible children and positions the children inside the parent bounds.

```yaml
nodes:
  - id: svc-1321-r01
    name: '**L3VPN** ++1321++'
    labels:
      node: service
      service: l3vpn
    parent: R01
    layers: [service]
```

## Links

Links connect two nodes.

```yaml
links:
  - id: phy-R01-R03
    source: R01
    target: R03
    labels:
      link: physical
      role: core
    data:
      metric: 10
      delayMs: 5
    layers: [physical]
```

Links can also declare a `parent` link. For links, `parent` means the child link is visually carried by the parent link. This is useful for showing an overlay service lane inside an underlay transport pipe.

```yaml
links:
  - id: transport-tunnel
    source: PE1
    target: PE2
    labels:
      link: transport
      protocol: sr-te
    layers: [transport]

  - id: service-overlay
    source: l3vpn-a
    target: l3vpn-b
    parent: transport-tunnel
    labels:
      link: service
    layers: [service]
```

When a parent link has visible child links, TopoViewer renders the parent as a pipe/corridor and renders the child links as lanes along the parent route. The child link keeps its own source and target as graph facts, but its rendered lane follows the parent link geometry.

## Paths

Paths are ordered node sequences. TopoViewer compiles them into visual edges between each consecutive node pair.

```yaml
paths:
  - id: srte-1321-forward
    name: SR-TE 1321
    labels:
      path: transport
      protocol: sr-te
    layers: [transport, service]
    sequence: [R01, R03, R05, R07, R09]
```

Use paths for overlay narratives such as LSPs, SR Policies, traffic-engineered paths, or service transport.

Paths can also declare `source`, `target`, and `parent` instead of `sequence`. In that form, the path is a stitched child path carried by a sequenced parent path. The child path keeps its real endpoints, but the rendered lane follows every segment of the parent path. TopoViewer draws a stub from the child source to the first parent-path node, lanes across the parent path, and a stub from the last parent-path node to the child target.

```yaml
paths:
  - id: transport-agg1-agg2
    name: AGG transport carrier
    labels:
      path: transport
      protocol: sr-te
    layers: [transport, service]
    sequence: [AGG1, PE1, P, PE2, AGG2]

  - id: stitched-services-a-j
    name: Services A-J stitched over transport
    source: services-1-10-agg1
    target: services-1-10-agg2
    parent: transport-agg1-agg2
    labels:
      path: service
      scope: aggregate
    data:
      serviceCount: 10
    layers: [service]
```

## Regions

Regions represent scope or membership: AS domains, IGP areas, sites, availability zones, or failure domains.

```yaml
regions:
  - id: isis-l1
    name: IS-IS L1
    labels:
      region: igp
      protocol: isis
    parent: as65000
    members: [R01, R03, R05]
    layers: [igp]
```

Regions are hulls around their member nodes. Parent regions resize around child regions and members. If a shared node belongs to multiple regions, dragging one region recomputes the dependent hulls so the graph stays coherent.

Useful region sizing fields:

| Field | Use |
|---|---|
| `padding`, `paddingX`, `paddingY` | Space around members. |
| `headerPadding` | Extra top room for region labels. |
| `minWidth`, `minHeight` | Prevent tiny regions. |
| `parentPadding`, `parentPaddingX`, `parentPaddingY` | Extra parent-region space around child regions. |

## Toggles

Toggles are boolean display controls used by the embed UI and React API.

```yaml
toggles:
  - id: showRegions
    name: Show regions
    default: true
  - id: showChildNodesInsideParents
    name: Show child nodes inside parents
    default: false
  - id: showEdgeLabels
    name: Show link/path labels
    default: false
```

Built-in toggles:

| Toggle | Behavior |
|---|---|
| `showRegions` | Shows or hides regions. |
| `showChildNodesInsideParents` | Shows child nodes nested under parent nodes. |
| `showEdgeLabels` | Enables link/path labels. |

`showServicesInsideNodes` remains accepted as a backward-compatible alias for older diagrams. New diagrams should use `showChildNodesInsideParents`.

Additional toggles are accepted and preserved for custom UI use.

## Validation Contract

TopoViewer validates core structure at runtime:

- Every graph entity must have a non-empty `id`.
- Links require `source` and `target`.
- Paths require either a `sequence` of at least two node IDs, or `source`, `target`, and `parent` when carried by another path.
- Positions must be `[number, number]` or an object with numeric `x` and `y`.

Unknown fields are allowed. This keeps the authoring model extensible without changing the compiler for every domain-specific attribute.

The same contract is available as JSON Schema in `schemas/topoviewer*.schema.json`.

## Diagram Primitive Layer

TopoViewer separates semantic graph objects from explanatory diagram primitives. Use `graph` for topology facts and `diagram` for shape and callout objects that make a technical story readable.

| Capability | Primitive | Why it exists |
|---|---|---|
| First-class callouts | `diagram.callouts[]` | Explanation boxes with leader arrows are not graph nodes. |
| Markdown text blocks | `callout.markdown`, `callout.align` | Bullet lists, bold text, inline code, and left/center/right alignment need a text-box model. |
| Basic geometry primitives | `diagram.shapes[]` | 2D and 3D geometry can explain structure without becoming topology facts. |
| Pin/port anchors | `pins`, `sourcePin`, `targetPin` | Callout lines can attach to exact points, not only floating object centers. |
| Documentation framing | Locked callouts or shapes | Stable visual boundaries for docs, screenshots, and slides should not be interactive graph entities. |
| Decorative versus semantic objects | `diagram.*` versus `graph.*` | A router, service, or interface can remain semantic while notes and decorative shapes stay visual-only. |
| Static export quality | Export utilities plus locked frames | Slide/document workflows need PNG/SVG output, not only interactive viewing. |

### Shapes

Shapes are geometry-only visual primitives. They do not render labels, paragraphs, SVGs, or images. Use them for bars, disks, simple solids, background panels, and other non-topology geometry. If a shape needs text, place a `diagram.callouts[]` object on top of it or next to it.

```yaml
diagram:
  shapes:
    - id: sap-1
      type: rectangle
      position: [185, 245]
      size: [300, 28]
      layers: [access]
      labels:
        shape: sap
      pins:
        - id: left
          position: [0, 14]
        - id: right
          position: [300, 14]
```

Supported 2D `type` values are `circle`, `triangle`, `square`, `rectangle`, `pentagon`, `hexagon`, `octagon`, `ellipse`, `semicircle`, `trapezoid`, `parallelogram`, `rhombus`, `kite`, and `star`.

Supported 3D `type` values are `cube`, `cuboid`, `sphere`, `cone`, `cylinder`, `pyramid`, and `prism`.

Use `rotation` to rotate the geometry in degrees:

```yaml
diagram:
  shapes:
    - id: tilted-cuboid
      type: cuboid
      rotation: -6
      position: [160, 400]
      size: [100, 60]
      layers: [diagram]
```

### Callouts

Callouts are markdown boxes, leader lines, and line-only visual relationships. Use `source`, `sourcePin`, `target`, and `targetPin` when the callout is only a line between two objects. Use `position`, `size`, `title`, and `markdown` when it should render as a visible text box.

```yaml
diagram:
  callouts:
    - id: subscriber-subnet-callout
      title: Represents subscriber subnet
      markdown: |
        - Internal loopback interface
        - Maintains up to **256 subscriber subnets**
        - Can include images: ![Badge](./badge.svg)
      target: subscriber-interface
      targetPin: left
      position: [925, 85]
      size: [320, 210]
      align: left
      layers: [explanation]
      leader:
        lineColor: "#2fa8dc"
        lineWidth: 4
        targetArrowShape: triangle
```

A line-only callout uses the same object family:

```yaml
diagram:
  callouts:
    - id: sap-1-to-group-interface
      source: sap-1
      sourcePin: right
      target: group-interface-1
      targetPin: left
      layers: [access]
      labels:
        callout: sap-binding
```

### Pins

Pins are invisible child anchors. They can be added to graph nodes, shapes, or callouts.

```yaml
nodes:
  - id: subscriber-interface
    pins:
      - id: left
        position: [0, 45]
```

Pins move with their parent object, so callout lines stay attached when a node, shape, or callout is dragged.
