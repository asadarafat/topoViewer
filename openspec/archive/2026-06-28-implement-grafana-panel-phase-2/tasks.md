## 1. Phase 1 Handoff

- [x] 1.1 Confirm `implement-grafana-panel-phase-1` is committed
- [x] 1.2 Confirm Phase 1 Grafana panel still builds
- [x] 1.3 Confirm Phase 1 fixture parity smoke still passes
- [x] 1.4 Keep Phase 2 public status exploratory

## 2. Lab Versions And Services

- [x] 2.1 Pin Prometheus image to `prom/prometheus:v3.5.0`
- [x] 2.2 Pin telemetry injector runtime image to an exact Node 24 tag
- [x] 2.3 Extend `labs/grafana-topoviewer/.env` with Prometheus and injector ports
- [x] 2.4 Extend `docker-compose.yml` with Prometheus
- [x] 2.5 Add telemetry injector service
- [x] 2.6 Add Prometheus scrape config
- [x] 2.7 Add Grafana Prometheus data source provisioning
- [x] 2.8 Update version checks to reject floating tags for every lab container
- [x] 2.9 Verify running Grafana and Prometheus versions in smoke

## 3. Telemetry Injector

- [x] 3.1 Add injector package
- [x] 3.2 Add `/health`
- [x] 3.3 Add `/metrics`
- [x] 3.4 Add `/scenario`
- [x] 3.5 Add `/scenario/healthy`
- [x] 3.6 Add `/scenario/high-utilization`
- [x] 3.7 Add `/scenario/link-failure`
- [x] 3.8 Add `/metric` override endpoint
- [x] 3.9 Add deterministic scenario data for `layered-network`
- [x] 3.10 Add deterministic scenario data for `clos-2spine-4leaf`
- [x] 3.11 Add injector unit tests

## 4. Grafana Panel Telemetry Contract

- [x] 4.1 Add telemetry options to panel option type
- [x] 4.2 Add telemetry option controls where practical
- [x] 4.3 Preserve Phase 1 fixture selector behavior
- [x] 4.4 Keep canonical topology and stylesheet YAML immutable
- [x] 4.5 Add useful diagnostics for missing telemetry fields
- [x] 4.6 Add empty-data behavior that leaves base topology visible

## 5. Data Frame And Overlay Adapter

- [x] 5.1 Add Grafana data frame parser
- [x] 5.2 Match telemetry to links by `link_id`
- [x] 5.3 Add source/target fallback matching
- [x] 5.4 Add utilization severity thresholds
- [x] 5.5 Add down-link styling rules
- [x] 5.6 Generate runtime link style overlays
- [x] 5.7 Generate endpoint node status overlays
- [x] 5.8 Preserve node drag usability during telemetry refresh
- [x] 5.9 Add unit tests for parser, rules, and overlay generation

## 6. Dashboard And Queries

- [x] 6.1 Add Phase 2 dashboard JSON
- [x] 6.2 Add Prometheus queries for link up/down
- [x] 6.3 Add Prometheus queries for utilization, bps, errors, and timestamp
- [x] 6.4 Add dashboard variables for `fixture_id`, `site`, `pod`, and severity
- [x] 6.5 Add raw metric panel for troubleshooting
- [x] 6.6 Add scenario/status panel

## 7. Root Scripts

- [x] 7.1 Add `grafana:lab:inject`
- [x] 7.2 Add `grafana:lab:smoke:phase2`
- [x] 7.3 Keep Docker-dependent Phase 2 commands out of default `npm run ci`
- [x] 7.4 Document port overrides for Grafana, Prometheus, and injector

## 8. Documentation

- [x] 8.1 Document authoring-to-Grafana telemetry workflow
- [x] 8.2 Document required stable link IDs and labels
- [x] 8.3 Document local lab startup and scenario injection
- [x] 8.4 Document data-frame field mapping
- [x] 8.5 Document troubleshooting for missing metrics and stale scrape data
- [x] 8.6 Keep public status as exploratory

## 9. Validation

- [x] 9.1 Run telemetry injector unit tests
- [x] 9.2 Run Grafana panel unit tests
- [x] 9.3 Run `npm run grafana:fixtures:check`
- [x] 9.4 Run `npm run grafana:panel:build`
- [x] 9.5 Run local `npm run grafana:lab:smoke:phase2`
- [x] 9.6 Capture Phase 2 screenshots under `.artifacts/grafana-phase-2/`
- [x] 9.7 Run existing non-Docker CI lanes impacted by the change (`ci:quality` passed; `ci:generated` reports uncommitted generated projections until this patch set is committed)

## 10. Phase Handoff

- [x] 10.1 Record Phase 2 findings that affect Phase 3 assumptions
- [x] 10.2 Update `define-grafana-integration-roadmap` only if Phase 2 findings change the roadmap
- [x] 10.3 Archive `implement-grafana-panel-phase-2` after validation passes
- [x] 10.4 Create Phase 3 implementation OpenSpec for interaction-state persistence
