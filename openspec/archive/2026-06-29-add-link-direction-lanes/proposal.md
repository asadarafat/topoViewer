## Why

Operational topology views often need to show two independent traffic directions on one physical adjacency. A single link can carry different utilization, loss, or state in each direction, and weathermap-style diagrams commonly communicate that with two opposing directional strokes such as:

```txt
A  ------->   <-------  B
```

TopoViewer could previously approximate this by rendering one link with two arrows or by modeling two opposite links between the same nodes. Both approaches are incomplete. One link with two arrows cannot independently style each traffic direction. Two opposite links duplicate one physical adjacency, make mapper joins ambiguous, and complicate selection, grouping, labels, layer behavior, and diagnostics.

This change adds the first production slice of a directional-link primitive: keep the physical link as one `graph.links[]` object and attach optional `sourceToTarget` and `targetToSource` render/telemetry channels to that link.

## What Changes

Phase 1 adds a declarative graph model:

```yaml
graph:
  links:
    - id: spine1-leaf1
      source: spine1
      target: leaf1
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

The parent `link` remains the physical adjacency. The directions are optional child render channels associated with that adjacency.

Phase 1 also adds a virtual style target named `linkDirection`:

```yaml
stylesheet:
  - selector: link
    style:
      directionalStrokes: true
      lineWidth: 3

  - selector: linkDirection[direction = "sourceToTarget"]
    style:
      targetArrowShape: triangle
      lineColor: "#4caf50"

  - selector: linkDirection[direction = "targetToSource"]
    style:
      sourceArrowShape: triangle
      sourceArrowSize: 6
      sourceArrowOffset: 0
      lineColor: "#ff9800"
```

Directional arrows use the same source/target arrow style keys as normal edges. When arrow size is omitted, the renderer uses the lane's `lineWidth`; `sourceArrowOffset: 0` or `targetArrowOffset: 0` keeps the arrow tip at the computed directional endpoint while the visible stroke is trimmed before the marker body.

The parent link label is still available for the physical adjacency name. Direction labels describe each telemetry direction. When directional lanes are present, the renderer automatically offsets the parent center label away from the direction labels unless the author sets explicit `labelXOffset` or `labelYOffset`.

Each direction may also carry inline style when the style belongs to one physical adjacency instead of a reusable stylesheet rule:

```yaml
graph:
  links:
    - id: spine1-leaf1
      source: spine1
      target: leaf1
      directions:
        sourceToTarget:
          label: 3.2 Gbps
          style:
            lineColor: "#4caf50"
            lineWidth: 4
            targetArrowShape: triangle
        targetToSource:
          label: 1.1 Gbps
          style:
            lineColor: "#ff9800"
            lineWidth: 6
            sourceArrowShape: triangle
            lineStyle: dashed
```

Grafana mapper rules can apply runtime overlays to one direction of one physical link:

```yaml
rules:
  - id: directional-interface-utilization
    metric: if_out_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    value: bps
    states:
      warning: "> 1000000000"
      critical: "> 5000000000"
    style:
      default:
        label: "{{ value | bandwidth }}"
        lineWidth: 3
      warning:
        lineColor: "#ff9800"
      critical:
        lineColor: "#d32f2f"
        lineWidth: 7
```

## Capabilities

### New Capabilities

- `link-direction-lanes`: semantic directional strokes for bidirectional telemetry on one physical link.

### Modified Capabilities

- `topoviewer-graph-model`: accepts optional `link.directions.sourceToTarget` and `link.directions.targetToSource`.
- `stylesheet-selector-model`: supports `linkDirection` as a virtual selector target.
- `topoviewer-renderer`: renders two opposing straight directional strokes in one physical link corridor.
- `topoviewer-mapper`: maps telemetry to `linkDirection` targets using stable `link_id` and `direction` joins.
- `topoviewer-docs`: documents the graph model, style controls, mapper usage, and examples.
- `vscode-topoviewer-yaml-assist`: suggests direction blocks, `linkDirection` selectors, and mapper joins.

## Impact

- `packages/topoviewer/src/core/types.ts` - add link direction types.
- `packages/topoviewer/src/core/compiler.ts` - compile directional lanes into parent edge data.
- `packages/topoviewer/src/core/styleDefaults.ts` and schema files - add canonical style metadata for directional lane controls.
- `packages/topoviewer/src/components/FloatingEdge.tsx` - render straight shared-corridor directional strokes, labels, and arrows.
- Grafana mapper code - allow `select: linkDirection` and direction-aware joins.
- Harness and VS Code YAML assist - suggest `directions`, `linkDirection`, and mapper joins.
- Content examples and docs - add compact bidirectional bandwidth examples.

## Non-Goals

- Replacing normal `link` rendering.
- Replacing explicit parallel physical links.
- Supporting more than the two canonical directions in the first implementation.
- Modeling physical interfaces as a separate graph object.
- Animated traffic particles or animated bandwidth flow.
- Direction-specific click selection, attention focus, and embeddable events.
- Curved-edge-following for bezier, segment, taxi, or smoothstep edges.
- Full production hardening for parallel physical links with directional overlays.
- Full mapper coverage UI for missing, ambiguous, stale, or duplicate direction telemetry.

Those deferred items are tracked in `openspec/changes/harden-link-direction-lanes/`.
