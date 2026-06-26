## 1. Contract And Tests First

- [x] 1.1 Add failing unit tests for `layout.mode: clos` schema validation
- [x] 1.2 Add failing unit tests for deterministic CLOS positions on a two-stage graph
- [x] 1.3 Add failing unit tests for inferred three-stage CLOS positions without role labels
- [x] 1.4 Add failing unit tests for five-stage and ten-stage CLOS inference
- [x] 1.5 Add failing unit tests for explicit stage and group hint precedence
- [x] 1.6 Add failing unit tests for pinned-node preservation
- [x] 1.7 Add failing unit tests for link endpoint-count fuzzy inference and `layout.inferLabelRole`
- [x] 1.8 Add failing unit tests for ambiguous graph fallback diagnostics

## 2. Type And Schema Contract

- [x] 2.1 Extend `LayoutConfig` with `mode: 'clos'`
- [x] 2.2 Add a typed `ClosLayoutOptions` contract
- [x] 2.3 Update runtime validation schema
- [x] 2.4 Update exported JSON schemas
- [x] 2.5 Update YAML authoring metadata so Monaco suggests CLOS layout keys

## 3. Layout Engine

- [x] 3.1 Add a renderer-agnostic CLOS layout module under `packages/topoviewer/src/core`
- [x] 3.2 Build visible graph adjacency and connected component helpers
- [x] 3.3 Implement explicit stage and group hint extraction from generic field paths
- [x] 3.4 Implement automatic stage inference with a `maxStages` cap
- [x] 3.5 Implement link endpoint-count fuzzy stage inference
- [x] 3.6 Implement `layout.inferLabelRole` and `layout.clos.inferLabelRole` overrides
- [x] 3.7 Implement inferred grouping from shared adjacent-stage neighborhoods
- [x] 3.8 Implement barycentric ordering sweeps for crossing reduction
- [x] 3.9 Implement axis packing for vertical and horizontal directions
- [x] 3.10 Implement pinned-node preservation
- [x] 3.11 Route `layout.mode: clos` through `computeLayoutPositions`

## 4. Diagnostics And Robustness

- [x] 4.1 Add low-confidence inference diagnostics
- [x] 4.2 Add diagnostics for conflicting explicit stage hints
- [x] 4.3 Add diagnostics when auto inference hits `maxStages`
- [x] 4.4 Ensure invalid CLOS options fail validation without breaking rendering
- [x] 4.5 Ensure non-CLOS graphs still receive deterministic fallback positions

## 5. Examples And Docs

- [x] 5.1 Add a small generic CLOS layout example
- [x] 5.2 Add a three-stage CLOS example without required role labels
- [x] 5.3 Add ten-stage unit coverage to prove the algorithm is generic
- [x] 5.4 Update the harness CLOS fixture to use `layout.mode: clos` instead of manual coordinates
- [x] 5.5 Document CLOS layout in authoring, reference model, React API, and stylesheet/layout docs
- [x] 5.6 Document ambiguity handling and when to add stage/group hints
- [x] 5.7 Update docs with practical root inference guidance: directed links first, endpoint-count fallback only when direction is not usable
- [x] 5.8 Document that `labels.role` and `labels.node` are styling/filter metadata unless `stageKey` or `inferLabelRole` is configured
- [x] 5.9 Add copyable YAML snippets for automatic CLOS, explicit `stageKey`/`stageOrder`, and opt-in `inferLabelRole`
- [x] 5.10 Document the `CLOS 2-spine 4-leaf` harness template as the practical automatic-layout example
- [x] 5.11 Document when to use `manual` or `force` instead of `clos`

## 6. Performance

- [x] 6.1 Add a synthetic CLOS generator for layout benchmarks
- [x] 6.2 Add benchmark coverage for 1k-node CLOS graphs
- [x] 6.3 Record timing and interaction budgets in production docs
- [x] 6.4 Ensure the layout does not use all-pairs algorithms on large graphs

## 7. Validation

- [x] 7.1 Run `npm --workspace topoviewer run test:unit`
- [x] 7.2 Run `npm run ci:schemas`
- [x] 7.3 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 7.4 Run `npm run docs:build`
- [ ] 7.5 Run `npm run ci` after committing generated docs/examples; current uncommitted generated files intentionally trip the generated-files gate.

## 8. Public API Hardening

- [x] 8.1 Add public layout inference diagnostics once TopoViewer has a stable diagnostics return channel for layout-only helpers.
- [x] 8.2 Add a dedicated synthetic CLOS benchmark and CI budget after the benchmark harness supports layout-only measurements.
