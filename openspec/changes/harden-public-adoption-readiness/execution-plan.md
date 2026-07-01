# Execution Plan

This change is intentionally broad. `tasks.md` is grouped by requirement area,
not by implementation order. Use this file to review progress sequentially
without checking unrelated work simply because it appears earlier in the task
list.

## Phase A: Baseline, Governance, And Safety Labels

Goal: make the current public surface honest before adding more capability.

Includes:

- inventory and classification evidence;
- governance files, issue templates, CODEOWNERS, support boundaries;
- lab safety warnings for anonymous Admin, unsigned plugins, and exposed local
  ports;
- public URL/casing/local-path leak checks.

Status: substantially implemented; final readiness report remains open.

## Phase B: Dependency And Artifact Guardrails

Goal: prevent public adoption claims while shipped dependencies or release
artifacts are unsafe or unreviewed.

Includes:

- production npm audit hard gate;
- documented full-audit triage for current Grafana transitive advisories;
- npm pack artifact autopsy;
- Grafana plugin artifact staging autopsy;
- docs build artifact autopsy;
- promotional/public media path checks;
- package install dry-run validation.

Status: implemented through the current package/install guardrail work.

## Phase C: Manual Release And Install Readiness

Goal: make the `npm install topoviewer ...` story real without allowing
accidental publication.

Includes:

- canonical package name decision;
- package install dry runs;
- manual-only npm publish workflow;
- dist-tag, Trusted Publishing OIDC, provenance, rollback, and deprecation docs;
- first package release feedback intake.

Status: implemented as a manual release path; actual publication remains a
maintainer decision, not an automatic CI action.

## Phase D: Hostile Input And Backend Abuse Tests

Goal: prove the renderer, docs embeds, Grafana mapper, and mounted-bundle
backend withstand intentionally hostile content.

Includes:

- hostile SVG, label, callout, Markdown, mapper template, and telemetry-label
  corpus;
- YAML abuse tests;
- renderer-limit diagnostics;
- mounted-bundle backend traversal, symlink, duplicate, large-file, and timeout
  tests.

Status: open; this is the next security-hardening block after release/install
guardrails.

## Phase E: Documentation And Mapper Authoring Ergonomics

Goal: make early adopters productive without source-code archaeology.

Includes:

- curated examples;
- object-attribute reference completeness;
- mapper YAML authoring in the harness;
- mapper schema-backed suggestions and diagnostics;
- Grafana early-adopter docs from harness-authored bundle to mounted dashboard.

Status: open; this is the largest developer-experience block.

## Phase F: Rendering Parity, Performance, And Adopter Drills

Goal: prove the repo is usable from a clean checkout and rendered outputs are
stable across supported surfaces.

Includes:

- cross-surface Playwright visual parity;
- representative curated-example screenshots;
- performance budgets;
- clean-checkout early-adopter drills;
- support-burden simulation;
- final public readiness report.

Status: partially implemented by existing smoke/parity infrastructure; final
public readiness remains open.
