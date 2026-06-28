## 1. Roadmap Feedback

- [x] 1.1 Update `define-grafana-integration-roadmap` so Phase 4 production readiness requires mounted bundles as the default Grafana workflow
- [x] 1.2 Mark fixture source as backwards-compatible demo/CI support, not production input
- [x] 1.3 Ensure Phase 5 Containerlab preconditions depend on mounted bundle workflow only

## 2. Panel Source Defaults

- [x] 2.1 Make `mountedBundle` the default source mode for new Grafana panel options
- [x] 2.2 Keep `fixture` source mode functional for existing dashboards
- [x] 2.3 Label fixture source as bundled example or legacy compatibility in panel UI
- [x] 2.4 Ensure selected topology name remains dynamic inside the panel header
- [x] 2.5 Avoid duplicating the Grafana panel title inside the plugin header

## 3. Lab Commands

- [x] 3.1 Remove `npm run grafana:fixtures:check` from `npm run grafana:lab:up`
- [x] 3.2 Keep fixture checks in explicit dev/CI commands
- [x] 3.3 Decide not to add `npm run grafana:lab:up:fixtures` unless legacy fixture dashboards need a dedicated local entry point
- [x] 3.4 Ensure `grafana:lab:up` startup output emphasizes the Phase 4 topology bundle dashboard

## 4. Dashboards And Docs

- [x] 4.1 Keep Phase 4 dashboard panels production-shaped around mounted bundles
- [x] 4.2 Avoid static topology-specific Grafana panel titles when the panel has a dynamic topology selector
- [x] 4.3 Update Grafana README and lab README to say mounted topology bundles are the production workflow
- [x] 4.4 Document fixture mode as compatibility/demo/CI only
- [x] 4.5 Remove wording that implies users must edit `catalog.yaml`, sync fixtures, or rebuild the plugin for new topologies
- [x] 4.6 Make local lab dashboards editable from the Grafana UI while keeping JSON files as seeds
- [x] 4.7 Refetch mounted topology/style/mapper YAML on Grafana dashboard refresh

## 5. Validation

- [x] 5.1 Run Grafana panel tests
- [x] 5.2 Run Phase 4 smoke against mounted bundles
- [x] 5.3 Run fixture parity check explicitly to prove compatibility still works
- [x] 5.4 Run full `npm run ci` after generated outputs are committed or confirmed clean
- [ ] 5.5 Archive this phase-hardening change only after Phase 4 production readiness passes
