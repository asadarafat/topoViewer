# Topology Model

Use this page when you need object-by-object topology authoring details. Use [TopoViewer Authoring Model](../author/authoring-model.md) for the higher-level authoring workflow, and [Object Attribute Reference](./object-attributes.md) for the generated schema-backed attribute contract.

## Layers

Layers are orthogonal visibility groups. They are not fixed by TopoViewer.

```yaml
graph:
  layers:
    - id: physical
      labels:
        name: Physical
    - id: igp
      labels:
        name: IGP
    - id: transport
      labels:
        name: Transport
    - id: service
      labels:
        name: Service
```

A graph object can belong to one or many layers.

## Nodes

```yaml
nodes:
  - id: R01
    labels:
      node: router
      vendor: nokia
      role: pe
    layers: [physical, igp, transport, service]
    position: [90, 260]
```

`position` can be either `[x, y]` or `{ x: 90, y: 260 }`. The list form is preferred for compact YAML. In `force` mode, positions are seeds; in `clos` mode, positions are ignored unless the node is listed in `layout.clos.pinnedNodeIds` with `preservePinned: true`.

Any logical child node can be nested inside a parent node with `parent`. A service endpoint inside a router is one common example, but the model is generic. When `showChildNodesInsideParents` is enabled, TopoViewer auto-expands the parent node around its visible children and positions the children inside the parent bounds.

```yaml
nodes:
  - id: svc-1321-r01
    labels:
      name: '**L3VPN** ++1321++'
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

Use `directions` when the topology has one physical link but telemetry differs by direction. This is different from two explicit links: the graph still has one adjacency, while the renderer shows two opposing strokes inside the same corridor.

```yaml
links:
  - id: leaf1-spine1
    source: leaf1
    target: spine1
    labels:
      link: fabric
    directions:
      sourceToTarget:
        label: 3.2 Gbps
        data:
          metric: if_out_bps
      targetToSource:
        label: 1.1 Gbps
        data:
          metric: if_out_bps
```

Style directions with the virtual `linkDirection` selector:

```yaml
stylesheet:
  - selector: link
    style:
      directionalStrokes: true
      directionCenterGap: 64
      directionStartGap: 18
  - selector: linkDirection[direction = "sourceToTarget"]
    style:
      lineColor: "#4caf50"
      targetArrowShape: triangle
  - selector: linkDirection[direction = "targetToSource"]
    style:
      lineColor: "#ff9800"
      sourceArrowShape: triangle
```

## Paths

Paths are ordered node sequences. TopoViewer compiles them into visual edges between each consecutive node pair.

```yaml
paths:
  - id: srte-1321-forward
    labels:
      name: SR-TE 1321
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
    labels:
      name: AGG transport carrier
      path: transport
      protocol: sr-te
    layers: [transport, service]
    sequence: [AGG1, PE1, P, PE2, AGG2]

  - id: stitched-services-a-j
    source: services-1-10-agg1
    target: services-1-10-agg2
    parent: transport-agg1-agg2
    labels:
      name: Services A-J stitched over transport
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
    labels:
      name: IS-IS L1
      region: igp
      protocol: isis
    parent: as65000
    members: [R01, R03, R05]
    layers: [igp]
```

Regions are hulls around their member nodes. Parent regions resize around child regions and members. If a shared node belongs to multiple regions, dragging one region recomputes the dependent hulls so the graph stays coherent.

Region labels default to the top-left of the hull using the historical renderer offset: 12 px from the top edge and 18 px from the left edge. For single-node regions, add `headerPadding` when the label remains on the top edge, or move the label with region style keys such as `labelPosition: rightCenter` and `labelMargin: 14`.

Useful region sizing fields:

| Field | Use |
|---|---|
| `padding`, `paddingX`, `paddingY` | Space around members. |
| `headerPadding` | Extra top room for region labels. |
| `minWidth`, `minHeight` | Prevent tiny regions. |
| `parentPadding`, `parentPaddingX`, `parentPaddingY` | Extra parent-region space around child regions. |

```yaml
regions:
  - id: single-node-site
    labels:
      name: Single Node Site
    members: [edge-a]
    layers: [site]
    paddingX: 54
    paddingY: 34
    headerPadding: 34
    minWidth: 220
    minHeight: 170
```

## Toggles

Toggles are boolean display controls used by the embed UI and React API.

```yaml
toggles:
  - id: showRegions
    labels:
      name: Show regions
    default: true
  - id: showChildNodesInsideParents
    labels:
      name: Show child nodes inside parents
    default: false
  - id: showEdgeLabels
    labels:
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

Domain-specific facts belong in `labels` or `data`. Canonical version `0.2`
rejects generic object `name`, generic object `label`, inline `style`, object-level
`icon`, and callout `leader` appearance so identity and visual policy cannot
acquire competing owners.

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
```

Put the leader appearance in the stylesheet:

```yaml
stylesheet:
  - selector: 'callout[id = "subscriber-subnet-callout"]'
    style:
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
