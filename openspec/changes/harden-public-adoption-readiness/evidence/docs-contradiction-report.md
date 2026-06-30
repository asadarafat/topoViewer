# Docs Contradiction Report

This report compares public status, route, package, and support wording across
README, docs home, package READMEs, and integration pages.

## Checked Surfaces

| Surface | Guardrail |
|---|---|
| README | Generated from canonical content fragments and checked by public-readiness. |
| Docs home | Generated from the same fragments as README. |
| Package READMEs | Status labels checked by docs lint. |
| Integration pages | Status labels checked against expected labels. |
| OpenSpec active work | Kept out of the first-run path and labeled roadmap/maintainer where surfaced. |

## Current Contradiction Findings

| Finding | Status |
|---|---|
| Stale `/TopoViewer/` route casing | Guarded by public-readiness leak check. |
| Stale `github.com/asadarafat/TopoViewer` repository casing | Guarded by public-readiness leak check. |
| Unsupported "production-ready" claim | Guarded by docs lint forbidden-claim checks. |
| Grafana fixture workflow presented as normal user workflow | Fixed in Grafana docs; fixture mode is demo/CI-only. |
| Containerlab appears as a separate top-level lab | Corrected to Grafana lab mode. |
| Npm install shown before package publication | README and React docs label package pre-publish. |

## Remaining Drift Risks

| Risk | Owner task |
|---|---|
| Promo video and README visual story can drift after video is added | Task 17. |
| Curated screenshots can drift from live renderer | Tasks 5 and 9. |
| Mapper docs can drift from harness rule-builder once implemented | Task 8. |
| Accessibility posture can drift once automated checks exist | Task 22.8. |
