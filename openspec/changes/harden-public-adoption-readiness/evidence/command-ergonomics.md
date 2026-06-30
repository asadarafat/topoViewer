# Command Ergonomics Evidence

Date: 2026-06-30

This note records the public-readiness command contract.

## Implemented Commands

| Command | Purpose |
| --- | --- |
| `npm run ci` | Full local parity with the default GitHub CI lane order. |
| `npm run ci:public-readiness` | Adoption hardening gate for docs lint, render parity, hostile-content tests, package dry-run, install command checks, Grafana artifact autopsy, dependency triage, Go vulnerability checks, security health reporting, and public leak/readiness guardrails. |
| `npm run check:public-readiness` | Focused leak/readiness guardrail without the heavier package/parity/security checks. |
| `npm run test:hostile-content` | Focused hostile SVG, Markdown, callout, and runtime inertness regression tests. |

## Default CI Scope

The default CI lanes intentionally exclude Grafana Containerlab-mode checks.
Those checks require Docker, Containerlab privileges, image pulls, and exposed
local lab ports. They remain explicit commands:

```bash
npm run grafana:clab:up
npm run grafana:clab:smoke
npm run grafana:clab:down
```

The public-readiness guard fails if `scripts/ci.mjs` adds `grafana:clab:*`
commands to `ci:public-readiness`.

## Validation

Run after this slice:

```bash
npm run test:hostile-content
npm run public-readiness
```
