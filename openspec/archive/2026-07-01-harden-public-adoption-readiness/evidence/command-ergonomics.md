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

## Failure Messages

| Surface | Guardrail |
| --- | --- |
| Docs preview | `scripts/local-docs-preview.sh` checks the fixed preview port with `scripts/check-port-free.mjs` before building. |
| Zensical preview | `scripts/local-zensical.sh` checks Python version and fixed serve port before starting. |
| Browser harness | `packages/vscode-topoviewer` checks `127.0.0.1:5174` before launching Vite with `--strictPort`. |
| Grafana lab | `labs/grafana-topoviewer/scripts/check-port.mjs` prints concise `[topoviewer]` port guidance. |
| Grafana Containerlab lab | Containerlab port and tool checks print concise `[topoviewer]` guidance for busy ports, unusable Docker, or missing Containerlab. |

When `scripts/ci.mjs` fails under GitHub Actions, it appends the lane, step,
command, and exit reason to `GITHUB_STEP_SUMMARY`. This gives the remote run a
copyable local command without requiring the user to dig through all logs first.

## Validation

Run after this slice:

```bash
npm run test:hostile-content
npm run ci:public-readiness
npm run public-readiness
```
