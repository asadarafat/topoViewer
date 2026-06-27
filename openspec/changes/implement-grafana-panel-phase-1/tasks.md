## 1. Package Scaffold

- [ ] 1.1 Verify Grafana panel scaffold/build tooling against pinned Grafana `13.1.0`
- [ ] 1.2 Add `packages/grafana-topoviewer-panel/package.json`
- [ ] 1.3 Add `packages/grafana-topoviewer-panel/plugin.json`
- [ ] 1.4 Add `src/module.ts`
- [ ] 1.5 Add `src/TopoViewerPanel.tsx`
- [ ] 1.6 Add `src/panelOptions.ts`
- [ ] 1.7 Add `src/runtimeModel.ts`
- [ ] 1.8 Add `src/types.ts`
- [ ] 1.9 Import shared `topoviewer` runtime and CSS without renderer forks

## 2. Harness Fixture Projection

- [ ] 2.1 Add `src/harnessFixtureCatalog.ts`
- [ ] 2.2 Match browser harness fixture discovery semantics
- [ ] 2.3 Add `scripts/sync-grafana-harness-fixtures.mjs`
- [ ] 2.4 Add `scripts/check-grafana-harness-fixtures.mjs`
- [ ] 2.5 Generate `src/generated/harnessFixtures.ts`
- [ ] 2.6 Reject duplicate fixture IDs
- [ ] 2.7 Reject fixture paths outside canonical content examples
- [ ] 2.8 Ensure all current harness fixture IDs are present

## 3. Panel Behavior

- [ ] 3.1 Add fixture selector panel option
- [ ] 3.2 Default to `layered-network`
- [ ] 3.3 Render selected fixture topology and stylesheet through TopoViewer
- [ ] 3.4 Show actionable diagnostic for invalid fixture ID
- [ ] 3.5 Keep public status exploratory

## 4. Local Grafana Lab

- [ ] 4.1 Add `labs/grafana-topoviewer/.env` with pinned Grafana version
- [ ] 4.2 Add local `docker-compose.yml` for Grafana only
- [ ] 4.3 Add dashboard provisioning
- [ ] 4.4 Add `topoviewer-phase-1.json` dashboard
- [ ] 4.5 Add `up.sh`
- [ ] 4.6 Add `down.sh`
- [ ] 4.7 Add `check-versions.mjs`
- [ ] 4.8 Add `smoke-grafana-phase-1.mjs`

## 5. Root Scripts

- [ ] 5.1 Add `grafana:fixtures:sync`
- [ ] 5.2 Add `grafana:fixtures:check`
- [ ] 5.3 Add `grafana:panel:build`
- [ ] 5.4 Add `grafana:panel:test`
- [ ] 5.5 Add `grafana:lab:up`
- [ ] 5.6 Add `grafana:lab:down`
- [ ] 5.7 Add `grafana:lab:smoke:phase1`
- [ ] 5.8 Keep Docker-dependent Grafana lab commands out of default `npm run ci`

## 6. Tests

- [ ] 6.1 Add unit tests for fixture discovery
- [ ] 6.2 Add unit tests for panel option defaults
- [ ] 6.3 Add unit tests for invalid fixture diagnostics
- [ ] 6.4 Add unit tests for runtime model generation
- [ ] 6.5 Add generated fixture check
- [ ] 6.6 Add local Grafana smoke for all harness fixtures
- [ ] 6.7 Capture detailed screenshots for `layered-network`
- [ ] 6.8 Capture detailed screenshots for `clos-2spine-4leaf`

## 7. Validation

- [ ] 7.1 Run `npm run grafana:fixtures:sync`
- [ ] 7.2 Run `npm run grafana:fixtures:check`
- [ ] 7.3 Run `npm run grafana:panel:test`
- [ ] 7.4 Run `npm run grafana:panel:build`
- [ ] 7.5 Run local `npm run grafana:lab:smoke:phase1`
- [ ] 7.6 Run existing `npm run ci`

## 8. Phase Handoff

- [ ] 8.1 Record Phase 1 findings that affect Phase 2 assumptions
- [ ] 8.2 Update `define-grafana-integration-roadmap` only if Phase 1 findings change the roadmap
- [ ] 8.3 Archive `implement-grafana-panel-phase-1` after validation passes
- [ ] 8.4 Create `implement-grafana-panel-phase-2` for Prometheus weathermap work
