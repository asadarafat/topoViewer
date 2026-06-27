## 1. Roadmap Refactor

- [x] 1.1 Split Grafana integration into explicit phases
- [x] 1.2 Keep this change as the roadmap and sequencing contract
- [x] 1.3 Move implementation detail into phase files
- [x] 1.4 Make Phase 1 the first executable slice
- [x] 1.5 Keep Codespaces as a later feasibility phase

## 2. Phase 1: Panel Package And Harness Fixture Parity

- [ ] 2.1 Define `packages/grafana-topoviewer-panel` package shape
- [ ] 2.2 Define panel package build command and plugin metadata
- [ ] 2.3 Define `harnessFixtureCatalog.ts` using browser-harness-compatible fixture discovery
- [ ] 2.4 Define generated lab fixture projection from canonical harness fixtures
- [ ] 2.5 Define `grafana:lab:list-fixtures` and `grafana:lab:sync-fixtures`
- [ ] 2.6 Define Grafana fixture selector based on canonical harness fixture index
- [ ] 2.7 Define Phase 1 smoke tests for all harness fixtures
- [ ] 2.8 Define detailed Phase 1 assertions for `layered-network` and `clos-2spine-4leaf`

## 3. Phase 2: Prometheus Weathermap Vertical Slice

- [ ] 3.1 Define pinned Grafana and Prometheus lab versions
- [ ] 3.2 Define local Grafana/Prometheus/injector Docker Compose shape
- [ ] 3.3 Define telemetry injector API and initial metrics
- [ ] 3.4 Define `link-failure` and `healthy` injector scenarios
- [ ] 3.5 Define telemetry rule contract for link utilization and link down state
- [ ] 3.6 Define PromQL used by the Grafana weathermap panel
- [ ] 3.7 Define Phase 2 smoke test from injector mutation to rendered link update
- [ ] 3.8 Define artifact output under `.artifacts/grafana-lab/`

## 4. Phase 3: Interaction State

- [ ] 4.1 Define runtime interaction state shape
- [ ] 4.2 Define panel options for interaction enablement and persistence
- [ ] 4.3 Define node drag and position override merge order
- [ ] 4.4 Define reset behavior for position overrides
- [ ] 4.5 Define telemetry refresh behavior while user interaction state exists
- [ ] 4.6 Define Phase 3 tests for drag persistence and telemetry refresh non-race

## 5. Phase 4: Operational Use Cases And Docs

- [ ] 5.1 Define node health/capacity dashboard behavior
- [ ] 5.2 Define service path SLO/blast-radius dashboard behavior
- [ ] 5.3 Define routing adjacency health dashboard behavior
- [ ] 5.4 Define end-to-end authoring-to-Grafana-to-telemetry documentation
- [ ] 5.5 Define object identity mapping docs for TopoViewer IDs/labels to Prometheus labels
- [ ] 5.6 Define troubleshooting docs for fixture, metric, refresh, version, and lab startup issues

## 6. Phase 5: Codespaces Portability

- [ ] 6.1 Define local-lab preconditions before Codespaces work starts
- [ ] 6.2 Define Containerlab privilege and nested networking checks
- [ ] 6.3 Define image pull, port forwarding, persistence, and resource-limit checks
- [ ] 6.4 Define Codespaces go/no-go criteria

## 7. Validation

- [ ] 7.1 Review `design.md` against all phase files
- [ ] 7.2 Review `specs/grafana-integration-roadmap/spec.md` against phased implementation order
- [ ] 7.3 Review Phase 1 scope to ensure it is buildable without Prometheus
- [ ] 7.4 Review Phase 2 scope to ensure it is a narrow weathermap slice
- [ ] 7.5 Review docs requirements for the full authoring-to-telemetry workflow
- [ ] 7.6 Review the phase lifecycle: implement phase, validate, archive, create next phase spec, update roadmap only when findings require it
