## 1. Renderer Geometry

- [x] 1.1 Add committed renderer geometry tests for two opposing strokes on one physical link corridor
- [x] 1.2 Add renderer tests combining directional strokes with existing parallel physical links
- [x] 1.3 Ensure direction strokes remain inside the parent physical-link corridor after parallel-link offsets are applied
- [x] 1.4 Add curved-edge-following support for bezier edges
- [x] 1.5 Add routed-edge support for segment, round-segment, taxi, and smooth-taxi style edges
- [x] 1.6 Preserve endpoint spacing, gradients, outlines, dash styles, and label z-index behavior
- [x] 1.7 Add Playwright visual coverage for a compact bidirectional bandwidth example

## 2. Interaction And Attention

- [x] 2.1 Extend selection/event payloads with `kind: linkDirection`
- [x] 2.2 Add hit targets for direction strokes without losing parent link hit target behavior
- [x] 2.3 Add parent link hover/focus behavior that keeps both direction strokes readable
- [x] 2.4 Add directional stroke focus behavior that preserves physical-link context
- [x] 2.5 Add attention tests for focusing a parent link and one directional lane
- [x] 2.6 Update embeddable event docs for parent link and direction lane clicks

## 3. Mapper Coverage

- [x] 3.1 Add mapper coverage states for matched, missing, ambiguous, stale, duplicate, unsupported direction, and missing parent link
- [x] 3.2 Add Grafana diagnostics UI for direction-lane coverage
- [x] 3.3 Add PromQL starter examples for directional interface utilization
- [x] 3.4 Add mounted-bundle example that uses `*.mapper.tv.yaml` to drive direction lanes
- [x] 3.5 Add tests for unresolved, ambiguous, stale, and duplicate direction telemetry samples

## 4. Cross-Surface Parity

- [x] 4.1 Verify docs, harness, Zensical, and Grafana render the same direction-stroke geometry
- [x] 4.2 Capture before/after artifacts for the docs example and Grafana mounted-bundle example
- [x] 4.3 Add regression coverage for renderer CSS isolation so MkDocs/Zensical theme CSS cannot alter direction geometry

## 5. Validation

- [x] 5.1 Run focused unit tests for graph, renderer, attention, mapper, and style metadata
- [x] 5.2 Run focused Playwright visual tests for directional lanes
- [x] 5.3 Run Grafana panel tests and build
- [x] 5.4 Run docs build and representative docs preview checks
- [ ] 5.5 Run full `npm run ci` after generated projections are committed
