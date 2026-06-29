## 1. Tests First

- [x] 1.1 Add graph parser/compiler tests for `link.directions.sourceToTarget` and `targetToSource`
- [x] 1.2 Add tests for derived direction IDs when direction IDs are omitted
- [x] 1.3 Add tests rejecting unknown direction keys and duplicate direction IDs
- [x] 1.4 Add selector tests for `linkDirection`, `linkDirection[direction = "..."]`, labels, and data selectors
- [x] 1.5 Add style precedence tests proving each direction can have a distinct computed style
- [x] 1.6 Add mapper tests for `select: linkDirection` with `link_id` and `direction` joins
- [x] 1.7 Add focused Playwright visual probe for the compact bidirectional bandwidth docs example

## 2. Graph And Type Contract

- [x] 2.1 Add `LinkDirectionKey` and `GraphLinkDirection` public TypeScript types
- [x] 2.2 Add optional `directions` to `GraphLink`
- [x] 2.3 Preserve existing `GraphLink` compatibility when `directions` is absent
- [x] 2.4 Generate stable internal direction IDs from parent link ID and direction key
- [x] 2.5 Include parent link ID, source, target, direction key, labels, data, and style in compiled lane data
- [x] 2.6 Update schemas for topology YAML and combined YAML
- [x] 2.7 Update semantic lint for invalid direction declarations

## 3. Selector And Style Contract

- [x] 3.1 Add `linkDirection` as a virtual selector target
- [x] 3.2 Support matching by `direction`, `id`, `labels.*`, `data.*`, parent link ID, source, and target
- [x] 3.3 Add style metadata for `directionalStrokes`, `directionCenterGap`, `directionStartGap`, `directionLabelPlacement`, and `directionLabelOffset`
- [x] 3.4 Allow existing compatible edge style keys on `linkDirection`
- [x] 3.5 Add target-specific lint for style keys that do not apply to `linkDirection`
- [x] 3.6 Apply style precedence from edge defaults, parent link style, `linkDirection` rules, direction-specific rules, inline direction style, and runtime mapper overlays
- [x] 3.7 Update YAML assist to suggest direction blocks, per-direction `style`, and `linkDirection` selectors

## 4. Renderer

- [x] 4.1 Compile direction lanes under the parent React Flow edge data
- [x] 4.2 Render opposing straight strokes on one parent physical link corridor
- [x] 4.3 Preserve a configurable center gap between opposing arrowheads
- [x] 4.4 Preserve a configurable start gap between node boundaries and visible direction strokes
- [x] 4.5 Render source/target arrows with correct orientation per direction
- [x] 4.6 Render direction labels near the correct directional stroke
- [x] 4.7 Preserve parent link hit target behavior for this phase
- [x] 4.8 Verify the docs example renders one edge, two direction strokes, and both direction labels

## 5. Grafana Mapper Integration

- [x] 5.1 Add `linkDirection` as a supported mapper target kind
- [x] 5.2 Add stable `link_id` plus `direction` join behavior
- [x] 5.3 Add mapper schema validation for direction-aware rules
- [x] 5.4 Add runtime overlay application for direction stroke styles and labels
- [x] 5.5 Keep overlays runtime-only and avoid mutating source topology or stylesheet YAML

## 6. Examples And Docs

- [x] 6.1 Add canonical content example for bidirectional bandwidth strokes
- [x] 6.2 Add docs explaining normal links versus parallel links versus directional strokes
- [x] 6.3 Add stylesheet reference entries for directional lane style controls
- [x] 6.4 Add graph reference entries for `link.directions`
- [x] 6.5 Add Grafana docs for mapping telemetry to link directions
- [x] 6.6 Sync generated MkDocs and Zensical docs

## 7. Validation

- [x] 7.1 Run focused unit tests for graph, selector, compiler, mapper, and style metadata
- [x] 7.2 Run focused Playwright visual probe for directional lanes
- [x] 7.3 Run `npm --workspace topoviewer run build`
- [x] 7.4 Run `npm --workspace grafana-topoviewer-panel run test`
- [x] 7.5 Run `npm --workspace grafana-topoviewer-panel run typecheck`
- [x] 7.6 Run `npm --workspace grafana-topoviewer-panel run build`
- [x] 7.7 Run `npm --workspace vscode-topoviewer run build`
- [x] 7.8 Run `npm run validate:schemas`
- [x] 7.9 Run `npm run docs:build`

## 8. Deferred Hardening

The remaining production-hardening items were intentionally moved to `openspec/changes/harden-link-direction-lanes/` so this Phase 1 change only describes the implemented scope. The deferred scope covers curved-edge geometry, parallel physical-link regression hardening, directional hit targets, attention focus, richer mapper coverage, PromQL starters, mounted-bundle examples, full CI, and cross-surface parity sweeps.
