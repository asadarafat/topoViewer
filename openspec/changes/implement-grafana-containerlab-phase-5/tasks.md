## 0. Entry Gate

- [x] 0.1 Confirm `implement-grafana-panel-phase-4` has passed its production readiness gate
- [x] 0.2 Confirm `npm run grafana:lab:smoke:phase4` passed on the final Phase 4 patch set
- [x] 0.3 Confirm full `npm run ci` passed on the final Phase 4 patch set
- [x] 0.4 Confirm generated/build outputs are committed intentionally or absent
- [x] 0.5 Confirm `implement-grafana-panel-phase-4` is archived before Containerlab implementation starts

## 1. Lab Definition

- [ ] 1.1 Add `labs/grafana-topoviewer/containerlab/topoviewer-grafana.clab.yml`
- [ ] 1.2 Define a small SR Linux CLOS-like lab: two spines, two or three leaves, and two client/traffic endpoints
- [ ] 1.3 Pin SR Linux, gNMIc, Prometheus, and Grafana image versions
- [ ] 1.4 Add local Containerlab and Docker preflight checks
- [ ] 1.5 Add `grafana:clab:up`, `grafana:clab:down`, `grafana:clab:restart`, and `grafana:clab:smoke`
- [ ] 1.6 Keep synthetic lab commands independent from Containerlab
- [ ] 1.7 Document required host privileges, ports, image pull expectations, and cleanup behavior
- [ ] 1.8 Ensure implementation does not require a runtime clone of an external lab repository
- [ ] 1.9 Ensure public docs and OpenSpec files do not include external lab repository URLs

## 2. Telemetry Pipeline

- [ ] 2.1 Add gNMIc config for SR Linux telemetry subscriptions
- [ ] 2.2 Expose gNMIc Prometheus metrics on a deterministic host/container port
- [ ] 2.3 Add Prometheus scrape config for gNMIc telemetry
- [ ] 2.4 Normalize telemetry labels for mapper-friendly joins: `node_id`, `link_id`, `source`, `target`, `protocol`, `interface`, and `direction`
- [ ] 2.5 Add initial metrics for interface/link oper state
- [ ] 2.6 Add initial metrics for interface utilization or counter-derived traffic rate
- [ ] 2.7 Add one routing adjacency metric if reliably available
- [ ] 2.8 Add one node health/capacity metric if reliably available
- [ ] 2.9 Add deterministic traffic or config mutation helper only if needed to force visible state changes
- [ ] 2.10 Add Prometheus recording rules when exporter-native labels are not mapper-friendly

## 3. TopoViewer Bundle

- [ ] 3.1 Add `labs/grafana-topoviewer/topoviewer-bundles/clab-clos/clab-clos.topo.tv.yaml`
- [ ] 3.2 Add `labs/grafana-topoviewer/topoviewer-bundles/clab-clos/clab-clos.style.tv.yaml`
- [ ] 3.3 Add `labs/grafana-topoviewer/topoviewer-bundles/clab-clos/clab-clos.mapper.tv.yaml`
- [ ] 3.4 Model topology facts with stable node/link/interface identity fields
- [ ] 3.5 Keep baseline visuals in stylesheet YAML and telemetry behavior in mapper YAML
- [ ] 3.6 Add mapper rules for link state, utilization, and adjacency or node health
- [ ] 3.7 Validate mapper coverage for matched, unmatched, duplicate, and ambiguous telemetry
- [ ] 3.8 Extend mapper schema/YAML assist if live lab exposes new stable join patterns
- [ ] 3.9 Ensure the bundle is mounted under `/etc/topoviewer/bundles` in Grafana

## 4. Grafana Dashboard

- [ ] 4.1 Add a dedicated editable `topoviewer-grafana` dashboard
- [ ] 4.2 Use the local TopoViewer panel plugin build mounted into Grafana
- [ ] 4.3 Configure the panel to use mounted-bundle source mode and `clab-clos`
- [ ] 4.4 Configure queries from mapper-compatible PromQL
- [ ] 4.5 Show mapper coverage, source diagnostics, and Prometheus target health in the panel/dashboard
- [ ] 4.6 Keep dashboard provisioning deterministic and pinned
- [ ] 4.7 Verify changing `*.topo.tv.yaml`, `*.style.tv.yaml`, or `*.mapper.tv.yaml` can be observed through refresh without rebuilding the plugin

## 5. Validation

- [ ] 5.1 Run lab startup and teardown locally
- [ ] 5.2 Verify gNMIc target/subscription health
- [ ] 5.3 Verify Prometheus target health and sample query output
- [ ] 5.4 Run smoke from telemetry mutation to rendered overlay
- [ ] 5.5 Capture before/after screenshots under `.artifacts/grafana-containerlab/`
- [ ] 5.6 Capture mapper coverage JSON/text under `.artifacts/grafana-containerlab/`
- [ ] 5.7 Capture lab version details under `.artifacts/grafana-containerlab/`
- [ ] 5.8 Verify existing synthetic Phase 2 and Phase 4 smokes still pass
- [ ] 5.9 Run `npm run ci` after generated outputs are committed
- [ ] 5.10 Document remaining limits before Codespaces

## 6. Documentation

- [ ] 6.1 Document the local `topoviewer-grafana` Containerlab workflow
- [ ] 6.2 Document the topology/style/mapper bundle workflow from harness authoring to Grafana mount
- [ ] 6.3 Document the Prometheus label contract and mapper join strategy
- [ ] 6.4 Document live telemetry use cases: link state, utilization, and adjacency or node health
- [ ] 6.5 Document troubleshooting for image pulls, privileges, ports, gNMIc targets, Prometheus targets, and Grafana bundle refresh
- [ ] 6.6 Keep external lab repository links out of public docs and OpenSpec files
