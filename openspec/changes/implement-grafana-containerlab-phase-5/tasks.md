## 0. Entry Gate

- [ ] 0.1 Confirm `implement-grafana-panel-phase-4` has passed its production readiness gate
- [ ] 0.2 Confirm `npm run grafana:lab:smoke:phase4` passed on the final Phase 4 patch set
- [ ] 0.3 Confirm full `npm run ci` passed on the final Phase 4 patch set
- [ ] 0.4 Confirm generated/build outputs are committed intentionally or absent
- [ ] 0.5 Confirm `implement-grafana-panel-phase-4` is archived before Containerlab implementation starts

## 1. Lab Definition

- [ ] 1.1 Select and pin the local Containerlab topology and images
- [ ] 1.2 Add local Containerlab version/preflight checks
- [ ] 1.3 Add `grafana:clab:up`, `grafana:clab:down`, and `grafana:clab:smoke`
- [ ] 1.4 Keep synthetic lab commands independent from Containerlab
- [ ] 1.5 Document required host privileges and cleanup behavior

## 2. Telemetry Pipeline

- [ ] 2.1 Add Prometheus scrape config for Containerlab telemetry
- [ ] 2.2 Normalize telemetry labels for mapper-friendly joins
- [ ] 2.3 Add initial metrics for link state and utilization
- [ ] 2.4 Add one routing adjacency metric if reliably available
- [ ] 2.5 Add one node health/capacity metric if reliably available

## 3. TopoViewer Bundle

- [ ] 3.1 Add mounted bundle topology for the Containerlab topology
- [ ] 3.2 Add mounted bundle stylesheet for operational overlays
- [ ] 3.3 Add mounted bundle mapper rules for live lab metrics
- [ ] 3.4 Validate mapper coverage for matched and unmatched telemetry

## 4. Grafana Dashboard

- [ ] 4.1 Add a dedicated Containerlab dashboard
- [ ] 4.2 Use the local TopoViewer panel plugin build
- [ ] 4.3 Configure queries from mapper-compatible PromQL
- [ ] 4.4 Keep dashboard provisioning deterministic and pinned

## 5. Validation

- [ ] 5.1 Run lab startup and teardown locally
- [ ] 5.2 Run smoke from telemetry mutation to rendered overlay
- [ ] 5.3 Capture before/after screenshots under `.artifacts/grafana-containerlab/`
- [ ] 5.4 Verify existing synthetic Phase 2 and Phase 4 smokes still pass
- [ ] 5.5 Document remaining limits before Codespaces
