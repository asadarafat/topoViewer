## 1. Baselines And Fixtures

- [ ] 1.1 Add generated dense topology fixture script for 1k, 5k, and 10k raw nodes
- [ ] 1.2 Add representative labels, regions, paths, links, parent-child membership, and operational `data.*` fields to generated fixtures
- [ ] 1.3 Add benchmark probes for parse, validation, index build, reduction, layout, first render, and focus update timings
- [ ] 1.4 Add CI-safe 1k smoke benchmark threshold and local-only larger benchmark command
- [ ] 1.5 Document how to run and compare benchmark JSON output

## 2. Semantic Index

- [ ] 2.1 Add unit tests for ID, label, `data.*`, region, path, parent-child, adjacency, and reverse-adjacency lookup
- [ ] 2.2 Implement immutable graph index construction in `packages/topoviewer/src/core/attention`
- [ ] 2.3 Add tests proving index reads do not mutate source topology documents or compiled graph facts
- [ ] 2.4 Export index types and constructors from the package entry point as appropriate

## 3. Focus Query API

- [ ] 3.1 Add unit tests for focus by ID, labels, `data.*`, path ID, region ID, and selector-compatible predicates
- [ ] 3.2 Add unit tests for upstream, downstream, and bidirectional dependency focus by depth
- [ ] 3.3 Implement `FocusQuery` and `FocusResult` runtime contracts with reason metadata
- [ ] 3.4 Add invalid-query handling tests for missing IDs, invalid depth, and unsupported modes
- [ ] 3.5 Add documentation examples for runtime focus API usage

## 4. Progressive Disclosure

- [ ] 4.1 Add tests for collapsing by region, parent-child node, and label-defined groups
- [ ] 4.2 Implement derived aggregate graph generation without mutating the source graph
- [ ] 4.3 Preserve child membership references, child counts, link counts, and severity summaries on aggregates
- [ ] 4.4 Add expand/collapse state tests proving unrelated layout inputs remain stable
- [ ] 4.5 Add stylesheet hooks and default aggregate presentation

## 5. Importance Scoring And Labels

- [ ] 5.1 Add score fixture tests covering focus match, path membership, severity, fanout, recent change, and context proximity
- [ ] 5.2 Implement deterministic scoring with reason output
- [ ] 5.3 Add label-priority tests for focused, high-score, low-score, context, and aggregate objects
- [ ] 5.4 Implement default attention presentation states: focused, related, context, dimmed, hidden, aggregate, and suppressed
- [ ] 5.5 Add debug output or developer inspection helpers for score reasons

## 6. Operator Workflows

- [ ] 6.1 Add Playwright fixture for path focus with dimmed context
- [ ] 6.2 Add Playwright fixture for upstream/downstream blast-radius focus
- [ ] 6.3 Add Playwright fixture for change focus when objects include timestamp or revision metadata
- [ ] 6.4 Wire attention state into `TopoViewer` runtime props
- [ ] 6.5 Add controls to `TopoViewerWorkbench` for focus mode, depth, dim/hide mode, expansion, and label density
- [ ] 6.6 Add keyboard and accessibility checks for moving through focused results

## 7. Focused Export

- [ ] 7.1 Add export tests for focused SVG state
- [ ] 7.2 Verify PNG/PDF export reflects active focus, dimming, aggregate, and label-priority state
- [ ] 7.3 Document export behavior for focused and aggregate views

## 8. Rendering Scale Optimization

- [ ] 8.1 Analyze benchmark output after index, focus, reduction, and scoring are implemented
- [ ] 8.2 Add cache keys based on source graph hash plus attention state
- [ ] 8.3 Add viewport culling only if benchmark data identifies visible-object rendering as the bottleneck
- [ ] 8.4 Evaluate worker offload only if benchmark data identifies index/reduction/layout computation as the bottleneck
- [ ] 8.5 Evaluate Canvas/WebGL only if SVG/React rendering remains the bottleneck after aggregation and culling

## 9. Documentation And Release Readiness

- [ ] 9.1 Keep public roadmap high level and link detailed planning to OpenSpec artifacts
- [ ] 9.2 Add authoring docs for attention metadata conventions once runtime behavior is stable
- [ ] 9.3 Add migration notes if any schema shortcuts are introduced
- [ ] 9.4 Run local validation: `npm run ci` and `mkdocs build --strict`
- [ ] 9.5 Verify remote CI and Docs after pushing implementation milestones
