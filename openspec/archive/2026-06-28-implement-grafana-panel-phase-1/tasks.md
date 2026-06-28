## 1. Package Scaffold

- [x] 1.1 Verify Grafana panel scaffold/build tooling against pinned Grafana `13.1.0`
- [x] 1.2 Add `packages/grafana-topoviewer-panel/package.json`
- [x] 1.3 Add `packages/grafana-topoviewer-panel/plugin.json`
- [x] 1.4 Add `src/module.ts`
- [x] 1.5 Add `src/TopoViewerPanel.tsx`
- [x] 1.6 Add `src/panelOptions.ts`
- [x] 1.7 Add `src/runtimeModel.ts`
- [x] 1.8 Add `src/types.ts`
- [x] 1.9 Import shared `topoviewer` runtime and CSS without renderer forks

## 2. Harness Fixture Projection

- [x] 2.1 Add `src/harnessFixtureCatalog.ts`
- [x] 2.2 Match browser harness fixture discovery semantics
- [x] 2.3 Add `scripts/sync-grafana-harness-fixtures.mjs`
- [x] 2.4 Add `scripts/check-grafana-harness-fixtures.mjs`
- [x] 2.5 Generate `src/generated/harnessFixtures.ts`
- [x] 2.6 Reject duplicate fixture IDs
- [x] 2.7 Reject fixture paths outside canonical content examples
- [x] 2.8 Ensure all current harness fixture IDs are present

## 3. Panel Behavior

- [x] 3.1 Add fixture selector panel option
- [x] 3.2 Default to `layered-network`
- [x] 3.3 Render selected fixture topology and stylesheet through TopoViewer
- [x] 3.4 Show actionable diagnostic for invalid fixture ID
- [x] 3.5 Keep public status exploratory

## 4. Local Grafana Lab

- [x] 4.1 Add `labs/grafana-topoviewer/.env` with pinned Grafana version
- [x] 4.2 Add local `docker-compose.yml` for Grafana only
- [x] 4.3 Add dashboard provisioning
- [x] 4.4 Add `topoviewer-phase-1.json` dashboard
- [x] 4.5 Add `up.sh`
- [x] 4.6 Add `down.sh`
- [x] 4.7 Add `check-versions.mjs`
- [x] 4.8 Add `smoke-grafana-phase-1.mjs`

## 5. Root Scripts

- [x] 5.1 Add `grafana:fixtures:sync`
- [x] 5.2 Add `grafana:fixtures:check`
- [x] 5.3 Add `grafana:panel:build`
- [x] 5.4 Add `grafana:panel:test`
- [x] 5.5 Add `grafana:lab:up`
- [x] 5.6 Add `grafana:lab:down`
- [x] 5.7 Add `grafana:lab:smoke:phase1`
- [x] 5.8 Keep Docker-dependent Grafana lab commands out of default `npm run ci`

## 6. Tests

- [x] 6.1 Add unit tests for fixture discovery
- [x] 6.2 Add unit tests for panel option defaults
- [x] 6.3 Add unit tests for invalid fixture diagnostics
- [x] 6.4 Add unit tests for runtime model generation
- [x] 6.5 Add generated fixture check
- [x] 6.6 Add local Grafana smoke for all harness fixtures
- [x] 6.7 Capture detailed screenshots for `layered-network`
- [x] 6.8 Capture detailed screenshots for `clos-2spine-4leaf`

## 7. Validation

- [x] 7.1 Run `npm run grafana:fixtures:sync`
- [x] 7.2 Run `npm run grafana:fixtures:check`
- [x] 7.3 Run `npm run grafana:panel:test`
- [x] 7.4 Run `npm run grafana:panel:build`
- [x] 7.5 Run local `npm run grafana:lab:smoke:phase1`
- [x] 7.6 Run existing `npm run ci`

## 8. Phase Handoff

- [x] 8.1 Record Phase 1 findings that affect Phase 2 assumptions
- [x] 8.2 Update `define-grafana-integration-roadmap` only if Phase 1 findings change the roadmap
- [x] 8.3 Archive `implement-grafana-panel-phase-1` after validation passes
- [x] 8.4 Create `implement-grafana-panel-phase-2` for Prometheus weathermap work
