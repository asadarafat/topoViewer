## 0. Entry Gate

- [x] 0.1 Confirm `implement-grafana-panel-phase-4` has passed its production readiness gate
- [x] 0.2 Confirm `npm run grafana:lab:smoke:phase4` passed on the final Phase 4 patch set
- [x] 0.3 Confirm full `npm run ci` passed on the final Phase 4 patch set
- [x] 0.4 Confirm generated/build outputs are committed intentionally or absent
- [x] 0.5 Confirm `implement-grafana-panel-phase-4` is archived before Containerlab implementation starts

## 1. Lab Definition

- [x] 1.1 Clone the upstream telemetry lab locally as a PR-candidate working tree
- [x] 1.2 Reuse the existing CLOS lab shape: two spines, three leaves, three clients, gNMIc, Prometheus, and Grafana
- [x] 1.3 Pin SR Linux, gNMIc, Prometheus, and Grafana image versions
- [x] 1.4 Add local Containerlab and Docker preflight checks
- [x] 1.5 Add `grafana:clab:up`, `grafana:clab:down`, `grafana:clab:restart`, and `grafana:clab:smoke`
- [x] 1.6 Keep synthetic lab commands independent from Containerlab
- [x] 1.7 Document required host privileges, ports, image pull expectations, and cleanup behavior
- [x] 1.8 Keep the upstream candidate delta small enough for a later PR
- [x] 1.9 Ensure public docs and OpenSpec files do not include external lab repository URLs

## 2. Telemetry Pipeline

- [x] 2.1 Add gNMIc config for SR Linux telemetry subscriptions
- [x] 2.2 Expose gNMIc Prometheus metrics on a deterministic host/container port
- [x] 2.3 Add Prometheus scrape config for gNMIc telemetry
- [x] 2.4 Add Prometheus recording rules for mapper-friendly joins: `link_id` and `direction`
- [x] 2.5 Add initial metrics for interface/link oper state
- [x] 2.6 Add initial metrics for interface utilization or counter-derived traffic rate
- [x] 2.7 Defer routing adjacency overlays because the current live lab does not expose a stable, reviewable adjacency signal without bloating the first upstream-candidate patch
- [x] 2.8 Defer node health/capacity overlays because the current live lab readiness proof is link-state and bidirectional-utilization focused
- [x] 2.9 Reuse the existing traffic script to force visible state changes
- [x] 2.10 Remove the custom normalizer from the production-path design
- [x] 2.11 Add topology-authored telemetry bindings for raw Prometheus metric labels
- [x] 2.12 Add a generator that emits mapper-friendly Prometheus recording rules from topology telemetry bindings
- [x] 2.13 Add a check mode so generated recording rules cannot silently drift from topology telemetry bindings
- [x] 2.14 Regenerate upstream-candidate `topoviewer-rules.yml` from `st-clos.topo.tv.yaml`

## 3. TopoViewer Bundle

- [x] 3.1 Add `configs/grafana/topoviewer-bundles/st-clos/st-clos.topo.tv.yaml`
- [x] 3.2 Add `configs/grafana/topoviewer-bundles/st-clos/st-clos.style.tv.yaml`
- [x] 3.3 Add `configs/grafana/topoviewer-bundles/st-clos/st-clos.mapper.tv.yaml`
- [x] 3.4 Model topology facts with stable node/link/interface identity fields
- [x] 3.5 Keep baseline visuals in stylesheet YAML and telemetry behavior in mapper YAML
- [x] 3.6 Add mapper rules for link state and direction utilization
- [x] 3.7 Validate mapper coverage for matched, unmatched, duplicate, and ambiguous telemetry with a checked-in mapper regression
- [x] 3.8 Extend mapper schema/YAML assist if live lab exposes new stable join patterns
- [x] 3.9 Ensure the bundle is mounted under `/etc/topoviewer/bundles` in Grafana

## 4. Grafana Dashboard

- [x] 4.1 Add a `Network Telemetry - TopoViewer` B dashboard by copying the existing `Network Telemetry` dashboard and replacing only the `Network Telemetry` topology panel
- [x] 4.2 Use the local TopoViewer panel plugin build mounted into Grafana
- [x] 4.3 Configure the panel to use mounted-bundle source mode and `st-clos`
- [x] 4.4 Configure queries from mapper-compatible PromQL
- [x] 4.5 Show mapper coverage, source diagnostics, and Prometheus target health in the panel/dashboard
- [x] 4.6 Keep dashboard provisioning deterministic and pinned
- [x] 4.7 Verify changing `*.topo.tv.yaml`, `*.style.tv.yaml`, or `*.mapper.tv.yaml` can be observed through refresh without rebuilding the plugin

## 5. Validation

- [x] 5.1 Run lab startup and teardown locally
- [x] 5.2 Verify gNMIc target/subscription health
- [x] 5.3 Verify Prometheus target health and sample query output
- [x] 5.4 Run smoke from telemetry mutation to rendered overlay
- [x] 5.5 Capture before/after screenshots under `.artifacts/grafana-containerlab/`
- [x] 5.6 Capture mapper coverage JSON/text under `.artifacts/grafana-containerlab/`
- [x] 5.7 Capture lab version details under `.artifacts/grafana-containerlab/`
- [x] 5.8 Verify existing synthetic Phase 2 and Phase 4 smokes still pass
- [x] 5.9 Run `npm run ci` after generated outputs are committed
- [x] 5.10 Document remaining limits before Codespaces
- [x] 5.11 Deploy the upstream-candidate lab and verify TopoViewer dashboard rendering
- [x] 5.12 Start upstream lab traffic and verify TopoViewer directional lanes update
- [x] 5.13 Produce an upstream PR patch/diff after local validation
- [x] 5.14 Replace the current ad hoc validation notes with a repeatable smoke command
- [x] 5.15 Make the smoke command verify Grafana health, plugin availability, bundle discovery, Prometheus rules, mapper coverage, and screenshot capture
- [x] 5.16 Make the smoke command fail with actionable logs when gNMIc subscriptions, Prometheus targets, or TopoViewer rendering are not ready
- [x] 5.17 Document fresh-checkout smoke as the release-mode artifact gate because no pinned public plugin artifact exists yet
- [x] 5.18 Capture a clean visual artifact proving the dashboard is readable under live traffic, not merely rendered

## 6. Documentation

- [x] 6.1 Document the local `topoviewer-grafana` Containerlab workflow
- [x] 6.2 Document the topology/style/mapper bundle workflow from harness authoring to Grafana mount
- [x] 6.3 Document the Prometheus label contract and mapper join strategy
- [x] 6.4 Document live telemetry use cases: link state and bidirectional utilization
- [x] 6.5 Document troubleshooting for image pulls, privileges, ports, gNMIc targets, Prometheus targets, and Grafana bundle refresh
- [x] 6.6 Keep external lab repository links out of public docs and OpenSpec files
- [x] 6.7 Document the production plugin install contract separately from the local development bind mount
- [x] 6.8 Document the fresh-checkout workflow from lab deploy to traffic generation to TopoViewer dashboard inspection
- [x] 6.9 Document the mounted bundle contract in upstream-lab terms without requiring users to know the TopoViewer monorepo layout
- [x] 6.10 Document how to edit or persist the Grafana dashboard when provisioning makes the default dashboard read-only
- [x] 6.11 Document exactly which metrics and recording rules back the link-state and bidirectional-utilization overlays
- [x] 6.12 Document that recording rules are generated from topology telemetry bindings, not hand-maintained as the primary source

## 7. Production Hardening

- [x] 7.1 Remove hard-coded repo-relative TopoViewer plugin paths from the upstream-candidate patch
- [x] 7.2 Add an explicit development-only override for local plugin dist bind mounts
- [x] 7.3 Define the release-mode plugin installation path and pinned plugin artifact requirement
- [x] 7.4 Verify the upstream-candidate patch does not vendor the TopoViewer Grafana plugin dist
- [x] 7.5 Verify the upstream-candidate patch does not add a TopoViewer-specific telemetry normalizer service
- [x] 7.6 Keep Prometheus recording rules as the mapper-friendly identity layer unless a stronger native label exists
- [x] 7.7 Review the upstream-candidate patch for reviewability: original dashboard preserved, small file count, clear README section, removable demo surface
- [x] 7.8 Decide whether adjacency and node-health overlays are reliable enough for Phase 5 or explicitly defer them
- [x] 7.9 Reduce the manual recording-rule burden by deriving TopoViewer recording rules from the mounted topology bundle
- [x] 7.10 Run full `npm run ci` after production-hardening changes are committed
- [x] 7.11 Keep this change open until the pinned plugin artifact and fresh-checkout upstream smoke exist; do not archive it as production-ready yet
