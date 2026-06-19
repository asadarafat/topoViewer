## 1. Baselines And Fixtures

- [x] 1.1 Add generated dense topology fixture script for 1k, 5k, and 10k raw nodes
- [x] 1.2 Add representative labels, regions, paths, links, parent-child membership, and operational `data.*` fields to generated fixtures
- [x] 1.3 Add benchmark probes for parse, validation, index build, reduction, layout, first render, and focus update timings
- [x] 1.4 Add CI-safe 1k smoke benchmark threshold and local-only larger benchmark command
- [x] 1.5 Document how to run and compare benchmark JSON output

## 2. Semantic Index

- [x] 2.1 Add unit tests for ID, label, `data.*`, region, path, parent-child, adjacency, and reverse-adjacency lookup
- [x] 2.2 Implement immutable graph index construction in `packages/topoviewer/src/core/attention`
- [x] 2.3 Add tests proving index reads do not mutate source topology documents or compiled graph facts
- [x] 2.4 Export index types and constructors from the package entry point as appropriate

## 3. Focus Query API

- [x] 3.1 Add unit tests for focus by ID, labels, `data.*`, path ID, region ID, and selector-compatible predicates
- [x] 3.2 Add unit tests for upstream, downstream, and bidirectional dependency focus by depth
- [x] 3.3 Implement `FocusQuery` and `FocusResult` runtime contracts with reason metadata
- [x] 3.4 Add invalid-query handling tests for missing IDs, invalid depth, and unsupported modes
- [x] 3.5 Add documentation examples for runtime focus API usage

## 4. Progressive Disclosure

- [x] 4.1 Add tests for collapsing by region, parent-child node, and label-defined groups
- [x] 4.2 Implement derived aggregate graph generation without mutating the source graph
- [x] 4.3 Preserve child membership references, child counts, link counts, and severity summaries on aggregates
- [x] 4.4 Add expand/collapse state tests proving unrelated layout inputs remain stable
- [x] 4.5 Add stylesheet hooks and default aggregate presentation
- [x] 4.6 Add optional viewport-driven aggregate collapse and expansion from declarative zoom thresholds
- [x] 4.7 Add threshold-based grouped links with member references and documented examples
- [x] 4.8 Keep the public dense-collapse example compact and move the generated 300-node regional topology to a stress fixture
- [x] 4.9 Reframe public dense examples around explicit click drill-down, with zoom policy documented as advanced behavior

## 5. Importance Scoring And Labels

- [x] 5.1 Add score fixture tests covering focus match, path membership, severity, fanout, recent change, and context proximity
- [x] 5.2 Implement deterministic scoring with reason output
- [x] 5.3 Add label-priority tests for focused, high-score, low-score, context, and aggregate objects
- [x] 5.4 Implement default attention presentation states: focused, related, context, dimmed, hidden, aggregate, and suppressed
- [x] 5.5 Add debug output or developer inspection helpers for score reasons

## 6. Operator Workflows

- [x] 6.1 Add Playwright fixture for object focus with dimmed context
- [x] 6.2 Add Playwright fixture for upstream/downstream blast-radius focus
- [x] 6.3 Add Playwright fixture for change focus when objects include timestamp or revision metadata
- [x] 6.4 Wire attention state into `TopoViewer` runtime props
- [x] 6.5 Add controls to `TopoViewerWorkbench` for focus mode, depth, dim/hide mode, expansion, and label density
- [x] 6.6 Add keyboard and accessibility checks for moving through focused results

## 7. Focused Export

- [x] 7.1 Add export tests for focused SVG state
- [x] 7.2 Verify PNG/PDF export reflects active focus, dimming, aggregate, and label-priority state
- [x] 7.3 Document export behavior for focused and aggregate views

## 8. Rendering Scale Optimization

- [x] 8.1 Analyze benchmark output after index, focus, reduction, and scoring are implemented
- [x] 8.2 Add cache keys based on source graph hash plus attention state
- [x] 8.3 Add viewport culling only if benchmark data identifies visible-object rendering as the bottleneck
- [x] 8.4 Evaluate worker offload only if benchmark data identifies index/reduction/layout computation as the bottleneck
- [x] 8.5 Evaluate Canvas/WebGL only if SVG/React rendering remains the bottleneck after aggregation and culling

## 9. Documentation And Release Readiness

- [x] 9.1 Keep public roadmap high level and link detailed planning to OpenSpec artifacts
- [x] 9.2 Add authoring docs for attention metadata conventions once runtime behavior is stable
- [x] 9.3 Confirm no schema shortcuts were introduced; no migration notes required
- [x] 9.4 Run local validation: `npm run ci` and `mkdocs build --strict`
- [ ] 9.5 Verify remote CI and Docs after pushing implementation milestones
