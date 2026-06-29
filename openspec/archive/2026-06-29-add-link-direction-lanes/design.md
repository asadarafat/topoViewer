## Overview

This change implements the first usable directional-link primitive for TopoViewer. The central design decision is to keep the physical adjacency as one `link` while allowing two optional directional render channels:

- `sourceToTarget`
- `targetToSource`

The renderer should not make this look like two physical links. The Phase 1 visual contract is a straight shared corridor:

```txt
A  ------->   <-------  B
```

The implementation is additive. Existing topologies without `link.directions` continue to use the existing link behavior.

## Public Graph Contract

Add optional `directions` to `GraphLink`:

```ts
export type LinkDirectionKey = 'sourceToTarget' | 'targetToSource';

export interface GraphLinkDirection {
  id?: string;
  name?: string;
  label?: string;
  labels?: Record<string, string>;
  data?: Record<string, unknown>;
  style?: TopoViewerStyle;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  directions?: Partial<Record<LinkDirectionKey, GraphLinkDirection>>;
}
```

Direction keys are tied to the parent link endpoints:

- `sourceToTarget`: traffic or state from `link.source` toward `link.target`.
- `targetToSource`: traffic or state from `link.target` toward `link.source`.

If a direction omits `id`, the compiler derives a stable ID:

- `${link.id}:sourceToTarget`
- `${link.id}:targetToSource`

Do not add shorthand aliases in this phase. Names such as `forward`, `reverse`, `aToZ`, or `zToA` become ambiguous when imported links are edited or reversed.

## Public Style Contract

The parent `link` keeps the physical-link style. `linkDirection` is a virtual style target for directional lanes.

```yaml
stylesheet:
  - selector: link
    style:
      directionalStrokes: true
      lineWidth: 3
      lineColor: "#90a4ae"
      targetArrowShape: none

  - selector: linkDirection
    style:
      labelColor: var(--topoviewer-fg-strong)
      textBackgroundColor: var(--topoviewer-edge-label-bg)

  - selector: linkDirection[direction = "sourceToTarget"]
    style:
      targetArrowShape: triangle
      lineColor: "#4caf50"

  - selector: linkDirection[direction = "targetToSource"]
    style:
      sourceArrowShape: triangle
      lineColor: "#ff9800"
```

Initial style keys:

- `directionalStrokes`: boolean; enables directional stroke rendering for links that declare directions.
- `directionCenterGap`: numeric gap between opposing direction arrowheads near the link center.
- `directionStartGap`: numeric inset from the connected node boundary before each directional stroke starts.
- `directionLabelPlacement`: `center | source | target | outside`.
- `directionLabelOffset`: numeric offset from the directional stroke.

Existing edge style keys may apply to `linkDirection` where they are compatible with a directional stroke, including line color, width, opacity, dash, cap, arrows, labels, label background, label border, and label z-index.

Arrow marker controls follow the normal edge-style naming contract:

- `sourceArrowShape`, `sourceArrowColor`, `sourceArrowSize`, `sourceArrowOffset`
- `targetArrowShape`, `targetArrowColor`, `targetArrowSize`, `targetArrowOffset`

For directional lanes, omitted arrow size defaults to that lane's rendered `lineWidth`. An arrow offset of `0` places the arrow tip on the computed directional endpoint. The visible stroke is trimmed before the marker body, including round or square line-cap compensation, so the line does not paint underneath the arrowhead.

The parent link label remains available. When a parent link renders directional strokes and the author does not set `labelXOffset` or `labelYOffset`, TopoViewer automatically moves the parent center label away from the opposing direction labels. Explicit offsets, including `0`, pin the parent label exactly where the author asks.

## Direction Style Precedence

Each direction is styleable independently. The renderer must not collapse both directions into one final edge style.

Precedence from lowest to highest:

1. canonical edge defaults
2. parent `link` stylesheet rules
3. general `linkDirection` stylesheet rules
4. direction-specific stylesheet rules such as `linkDirection[direction = "sourceToTarget"]`
5. inline `directions.<key>.style`
6. runtime telemetry overlay style from a mapper rule

Telemetry overlays are runtime-only. They can affect rendered direction lane style, but they must not mutate `topology.yaml` or `stylesheet.yaml`.

## Renderer Model

Compilation produces renderable direction records under the parent edge data. Graph authors do not create duplicate links.

Phase 1 renderer behavior:

1. Compute normal floating edge endpoints once for the parent link.
2. Render the parent physical link body on the centerline.
3. Apply `directionStartGap` from source and target boundaries so visible strokes do not collide with nodes.
4. Render `sourceToTarget` from the source-side inset toward a center split point.
5. Render `targetToSource` from the target-side inset toward the center split point.
6. Preserve `directionCenterGap` between opposing arrowheads.
7. Reverse arrow orientation for `targetToSource`.
8. Render direction labels near the corresponding stroke.
9. Render the parent link label away from directional labels unless explicit label offsets are provided.
10. Trim the visible directional stroke before arrow marker bodies while keeping arrow tips at the computed endpoints.
11. Keep parent edge hit testing as the interaction behavior for this phase.

`directionStartGap` is separate from existing endpoint controls:

- `sourceDistanceFromNode` and `targetDistanceFromNode` move the parent edge endpoint calculation.
- `directionStartGap` only shortens the visible directional strokes inside the already computed parent corridor.
- `sourceArrowOffset` and `targetArrowOffset` move arrow marker tips relative to the computed directional endpoint; they do not replace `directionStartGap` or `directionCenterGap`.

Curved-edge-following, directional hit targets, and explicit parallel physical-link geometry hardening are deferred to `harden-link-direction-lanes`.

## Mapper Contract

Grafana and future telemetry integrations target directions through `select: linkDirection`.

```yaml
rules:
  - id: fabric-direction-utilization
    metric: if_out_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    value: bps
    states:
      warning: "> 80"
      critical: "> 90"
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

The production-friendly identity labels are:

- `link_id`: parent TopoViewer link ID.
- `direction`: `sourceToTarget` or `targetToSource`.

Future mapper convenience may support endpoint/interface matching, but the first contract should encourage stable IDs.

## Validation And Diagnostics

Phase 1 adds validation/lint for:

- unknown direction keys under `link.directions`
- duplicate explicit direction IDs
- direction IDs colliding with other topology object IDs
- unsupported style keys on `linkDirection`
- mapper rules that select `linkDirection` without direction-aware join data

Runtime should fail soft. If one direction is invalid, render the parent link and any valid direction lane.

## Docs And Examples

The content example should be compact:

- two nodes
- one physical link
- both directions
- opposing lane colors
- opposing arrows
- direction labels
- optional mapper YAML

Docs should explain:

- when to use one normal link
- when to use two explicit physical links
- when to use `link.directions`
- how `sourceToTarget` and `targetToSource` relate to parent endpoints
- how telemetry labels map to direction lanes

## Follow-Up Hardening

The following work is intentionally outside this change and is tracked by `openspec/changes/harden-link-direction-lanes/`:

- committed renderer geometry tests for the `---> <---` visual contract
- direction-specific hit targets and `kind: linkDirection` events
- attention focus for a single direction lane
- curved-edge-following for bezier, segment, taxi, smoothstep, and similar edges
- explicit parallel physical-link regression hardening
- mapper coverage UI for missing, ambiguous, stale, and duplicate direction samples
- PromQL starter generation and mounted bundle examples
- full harness, MkDocs, Zensical, and Grafana parity sweeps
