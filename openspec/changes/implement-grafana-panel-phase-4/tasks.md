## 1. Mounted Bundle Source Model

- [x] 1.1 Add Grafana source mode types for mounted bundle and fixture fallback
- [x] 1.2 Add mounted bundle root option
- [x] 1.3 Add optional bundle manifest path option
- [x] 1.4 Add selected bundle ID option
- [x] 1.5 Define default paths under `/etc/topoviewer/`
- [x] 1.6 Preserve existing fixture behavior for demos and CI only
- [x] 1.7 Add normalized defaults and migration behavior for existing dashboards
- [x] 1.8 Provide a Grafana backend/resource endpoint or equivalent provisioning mechanism to deliver selected mounted bundle YAML to the frontend
- [x] 1.9 Discover bundle files by canonical suffix: `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`
- [x] 1.10 Reject bundle directories with missing or duplicate canonical suffix files unless an explicit manifest resolves them

## 2. Source Validation

- [x] 2.1 Add source diagnostics for missing mounted bundle root, empty bundle root, missing selected bundle, or duplicate bundle IDs
- [x] 2.2 Add YAML parse diagnostics with document label and line/column when available
- [x] 2.3 Add TopoViewer composition diagnostics
- [x] 2.4 Add TopoViewer mapper schema diagnostics
- [x] 2.5 Add empty graph and renderer-limit diagnostics
- [x] 2.6 Block telemetry overlays when source loading, composition, or mapper parsing fails
- [x] 2.7 Add tests for mounted bundle source, suffix discovery, manifest override, and fixture fallback

## 3. TopoViewer Mapper

- [x] 3.1 Define `*.mapper.tv.yaml` schema for identity, queries, and generic metric-to-object mapping rules
- [x] 3.2 Add parser and validator for TopoViewer mapper YAML
- [x] 3.3 Add JSON schema export for `*.mapper.tv.yaml`
- [x] 3.4 Reuse mapper schema in browser harness YAML assist
- [x] 3.5 Reuse mapper schema in VS Code harness YAML assist
- [x] 3.6 Add topology-aware mapper suggestions for object IDs, labels, data keys, join targets, thresholds, and overlay modes
- [x] 3.7 Add compiled topology inventory model for nodes, links, paths, regions, layers, labels, and data keys
- [x] 3.8 Add mapping coverage model for matched, unmatched, ambiguous, duplicate, and stale telemetry
- [x] 3.9 Add stable metric label recommendations for `node_id`, `link_id`, `path_id`, and `region_id`
- [x] 3.10 Warn when endpoint-only link matching is ambiguous because parallel links exist
- [x] 3.11 Add starter PromQL extraction/generation from TopoViewer mapper
- [x] 3.12 Add panel UI or diagnostics surface for mapping coverage
- [x] 3.13 Add unit tests for mapper parsing, schema validation, suggestions, and mapping coverage edge cases
- [x] 3.14 Support target kinds `node`, `link`, `path`, `region`, `layer`, and `graph`
- [x] 3.15 Support resolver modes for ID, label, data-field, endpoint, selector, aggregate, and static object ID matching
- [x] 3.16 Add target-specific overlay adapter validation so unsupported style controls are rejected for the selected target kind
- [x] 3.17 Add tests proving arbitrary supported Prometheus metric names can map to any supported TopoViewer target kind through mapper YAML
- [x] 3.18 Add aggregate target behavior for `layer` and `graph`, including summary state and optional child-object propagation
- [x] 3.19 Add mapper-owned severity palette so color policy can be changed in `*.mapper.tv.yaml`
- [x] 3.20 Add selector-driven conditional style patches so all supported TopoViewer object kinds can be styled from telemetry without fault-management assumptions
- [x] 3.21 Add compact `rules:` authoring profile that compiles to canonical mapper rules
- [x] 3.22 Add `states` plus `style.default`/`style.<state>` runtime styling as the preferred simple mapper workflow

## 4. Mapper Overlay Foundation

- [x] 4.1 Parse generic Grafana telemetry samples through mapper-selected metrics
- [x] 4.2 Apply runtime overlays to nodes, links, paths, regions, layers, and graphs through target-specific adapters
- [x] 4.3 Reject unsupported overlay controls for the selected target kind with mapper diagnostics
- [x] 4.4 Support aggregate target behavior for `layer` and `graph`, including optional child-object propagation
- [x] 4.5 Keep all overlays runtime-only and separate from source YAML
- [x] 4.6 Implement mapper-driven overlay execution so code-only link telemetry becomes compatibility behavior, not the production path
- [x] 4.7 Record node health, service path SLO, and routing adjacency as follow-up playbooks that consume the generic mapper foundation
- [x] 4.8 Document and test that mapper overlays behave as runtime display policy, not source stylesheet mutation
- [x] 4.9 Support conditional style templates for metric value, severity, target ID, data-frame labels, and data-frame fields
- [x] 4.10 Support state/category templates for compact rule styles without requiring severity terminology

## 5. UX

- [x] 5.1 Make mounted bundle root and selected bundle clear and non-destructive
- [x] 5.2 Show source, mapper, telemetry, and interaction state as separate concepts
- [x] 5.3 Provide copyable starter metric labels and PromQL from the TopoViewer mapper
- [x] 5.4 Provide actionable empty states for no topology, no mapper, no telemetry, and no mapping
- [x] 5.5 Keep the panel usable when Grafana refreshes data frames
- [x] 5.6 Do not require catalog edits, fixture sync, or plugin rebuild for user-provided mounted bundles
- [x] 5.7 Support selecting among multiple mounted bundles in one panel

## 6. Documentation

- [x] 6.1 Document harness authoring workflow for topology/style YAML
- [x] 6.2 Document `*.mapper.tv.yaml` schema and harness suggestion workflow
- [x] 6.3 Document Docker/Grafana mounted bundle layout and canonical file suffixes
- [x] 6.4 Document object identity mapping rules
- [x] 6.5 Document mapper-provided PromQL examples
- [x] 6.6 Document mapping coverage diagnostics
- [x] 6.7 Document generic mapper-driven operational examples and explicitly defer polished node health, service path, and routing adjacency playbooks
- [x] 6.8 Document fixture mode as demo/CI-only, not the user workflow
- [x] 6.9 Document why TopoViewer differs from generic SVG-first panel workflows
- [x] 6.10 Document mapper palette editing and the runtime overlay model
- [x] 6.11 Document selector-like conditional mapper rules as the preferred generic runtime styling model
- [x] 6.12 Document compact `rules:` as the preferred authoring model and canonical `mappings:` as the advanced normalized model

## 7. Validation

- [x] 7.1 Run Grafana panel unit tests
- [x] 7.2 Run Grafana panel typecheck
- [x] 7.3 Run Grafana panel build
- [x] 7.4 Run local Grafana smoke for mounted bundle source
- [x] 7.5 Run local Grafana smoke for fixture fallback
- [x] 7.6 Capture before/after artifacts for mapping coverage and telemetry overlays

## 8. Production Readiness Gate

- [ ] 8.1 Rerun `npm run grafana:lab:smoke:phase4` after manifest and source-diagnostic hardening
- [ ] 8.2 Run full `npm run ci` after generated outputs are staged or intentionally excluded
- [ ] 8.3 Verify generated/build outputs are either committed intentionally or absent from the patch
- [ ] 8.4 Split Phase 4 into reviewable conventional commits
- [ ] 8.5 Archive `implement-grafana-panel-phase-4` only after the production readiness gate passes
