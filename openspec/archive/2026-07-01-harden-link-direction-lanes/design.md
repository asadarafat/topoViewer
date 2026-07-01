## Overview

This change hardens the directional-link primitive after the Phase 1 implementation. The guiding rule is still the same: direction lanes are child render/telemetry channels of one physical `link`, not duplicate physical links.

The hardening work focuses on four areas:

- renderer geometry under real topology conditions;
- interaction and attention semantics;
- mapper coverage and operational diagnostics;
- cross-surface parity and regression coverage.

## Renderer Geometry

Direction lanes need deterministic geometry across:

- straight edges;
- bezier edges;
- segment and rounded segment edges;
- taxi and smooth taxi edges;
- physical parallel links between the same endpoints.

The renderer should compute the parent physical edge route first, including any physical parallel-link offset. Direction strokes should then be clipped or split inside that already computed parent corridor. This prevents direction lanes from being mistaken for extra physical links.

The key visual contract remains:

```txt
A  ------->   <-------  B
```

The center gap and start gap must stay configurable, and committed tests should verify the geometry instead of relying only on manual screenshots.

## Interaction And Attention

Phase 1 keeps parent link hit testing. Hardening adds direction-specific interaction:

```ts
type TopoViewerSelection =
  | { kind: 'link'; id: string }
  | { kind: 'linkDirection'; linkId: string; direction: LinkDirectionKey; id: string };
```

Interaction behavior:

- clicking the parent edge hit target selects the parent `link`;
- clicking a visible direction stroke selects `linkDirection`;
- hovering the parent link may highlight both direction lanes;
- focusing a parent link dims unrelated objects and keeps both direction lanes readable;
- focusing one direction lane keeps parent link context visible while emphasizing that lane.

## Mapper Coverage

Phase 1 applies runtime overlays when telemetry resolves to a direction. Hardening adds coverage states:

- matched;
- missing;
- ambiguous;
- stale;
- duplicate;
- unsupported direction;
- missing parent link.

Coverage should be visible in Grafana without requiring users to inspect browser logs. The mapper should also provide starter PromQL examples for direction-lane use cases and recommend stable metric labels:

- `link_id`;
- `direction`;
- optional `source`, `target`, `interface`, and `peer_interface` for future convenience resolvers.

## Documentation And Examples

Docs should include:

- a mounted-bundle example using `*.mapper.tv.yaml`;
- a PromQL starter for directional interface utilization;
- a clear comparison of normal links, explicit parallel physical links, and directional lanes;
- caveats for curved edges and high-density graphs;
- screenshots or visual checks for MkDocs, Zensical, harness, and Grafana.

## Validation Strategy

Validation should include:

- focused unit tests for interaction payloads and mapper coverage;
- renderer geometry tests for straight and routed edges;
- Playwright visual probes for representative docs and harness examples;
- Grafana panel tests for linkDirection mapper coverage and overlays;
- full `npm run ci` before archiving this hardening change.
