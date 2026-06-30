# Threat Model

TopoViewer accepts rich user-controlled content: YAML, labels, Markdown-like
callouts, inline SVG icons, external image references, style values, mapper
rules, telemetry labels, docs embed options, browser local storage, and Grafana
mounted bundle files. Treat these inputs as untrusted unless the embedding
product controls the source.

## Assets To Protect

| Asset | Why it matters |
|---|---|
| Host page DOM | A malicious diagram must not execute script in React, MkDocs, Zensical, harness, or Grafana. |
| User credentials and browser state | Diagrams must not steal cookies, tokens, local storage, Grafana session state, or dashboard data. |
| Host filesystem | Grafana mounted bundle loading must not escape configured roots or reveal private paths. |
| Availability | Oversized or abusive YAML must not freeze the browser, docs page, CI, or Grafana panel. |
| Source YAML integrity | Runtime telemetry overlays must not mutate topology, stylesheet, or mapper source files. |
| Public artifacts | npm packages, plugin zips, docs builds, and promo media must not contain secrets, local paths, or disposable lab credentials. |

## Input Threats And Controls

| Input | Main threats | Controls | Evidence |
|---|---|---|---|
| Topology and stylesheet YAML | YAML bombs, deep nesting, duplicate IDs, invalid references, renderer overload | Schema validation, semantic lint, renderer limits, hostile YAML tests planned | `npm run ci:schemas`, hostile corpus tasks |
| Labels, data, and callouts | HTML/script injection, broken attributes, CSS injection, layout abuse | React escaping, sanitizer paths, hostile content tests | Hostile label/callout tests |
| Inline SVG icons | Script tags, event handlers, `foreignObject`, `javascript:` URLs, CSS injection, encoded bypasses | SVG sanitizer, unsafe reference blocking, corpus tests | SVG hostile corpus tests |
| Image references | Data exfiltration, unsafe protocols, huge embedded images | Allowed protocol checks, embedded byte limits, diagnostics | Renderer limit tests |
| Mapper rules and templates | Executable labels, unexpected style mutation, ambiguous object matching | Mapper schema, target-kind validation, coverage diagnostics, runtime-only overlays | Mapper docs and Grafana coverage tests |
| Prometheus labels and values | Label injection, stale IDs, high-cardinality denial of service | Mapper value extraction, coverage classification, bounded overlay application | Grafana mapper tests |
| Docs embed options | Asset path confusion, broken page hydration, CSS leakage | Static asset loading, docs smoke, render parity checks | Docs and render parity lanes |
| Browser local storage | Stale draft confusion, accidental persistence of sensitive topology | Local-only authoring posture, export/revert workflow, privacy docs planned | Harness tests and telemetry/privacy tasks |
| Grafana mounted files | Path traversal, symlink escape, oversized files, duplicate bundles, non-UTF-8 content | Backend allowlist, realpath checks, size limits, diagnostics redaction | Grafana backend security tests |
| Lab configuration | Disposable credentials copied into production | Lab warnings, localhost binding, production-shaped examples | Lab safety checks |

## Trust Boundaries

| Boundary | Crossing data | Required behavior |
|---|---|---|
| Authoring file to parser | YAML text | Parse without executing content. Report line/column errors where available. |
| Parser to compiler | Parsed objects | Validate shape and references before rendering. |
| Stylesheet to renderer | Style values | Accept only documented keys and values; reject or warn on unsupported controls. |
| SVG string to DOM | Sanitized SVG or fallback glyph | Strip executable and unsafe content before it reaches the DOM. |
| Grafana backend to frontend | Mounted topology/style/mapper YAML and diagnostics | Read only from allowed roots and redact host paths from diagnostics. |
| Prometheus data frame to mapper | Metric labels and values | Treat labels as untrusted strings and values as bounded runtime state. |
| Runtime overlay to source YAML | Overlay state | Never write telemetry-derived changes back into source YAML. |

## Abuse Cases

| Abuse case | Required result |
|---|---|
| SVG icon includes `<script>` or event handler | Payload is removed or the icon is rejected; no script runs. |
| Label contains HTML or JavaScript URL | Rendered as inert text or rejected; no script runs. |
| Mapper label template receives hostile Prometheus label | Rendered overlay remains inert text. |
| YAML uses aliases or huge nested structures | Validation fails before rendering becomes unresponsive. |
| Mounted bundle path attempts `../` traversal or symlink escape | Backend rejects it and returns redacted diagnostics. |
| Bundle contains duplicate canonical files | Backend rejects the bundle unless a future explicit manifest resolves it. |
| Parallel links match one endpoint-only mapper rule | Mapper reports ambiguity instead of guessing. |
| Docs theme CSS changes SVG or label geometry | Render parity check fails unless the difference is documented as theme color only. |

## What TopoViewer Does Not Guarantee

- It is not a sandbox for arbitrary hostile HTML or JavaScript.
- It does not authenticate users or authorize access to topology content.
- It does not decide whether a topology object should be visible to a tenant.
- It does not make disposable local labs safe for production.
- It does not verify Prometheus data provenance; the host observability stack owns that.

## Evidence Map

| Risk area | Evidence or guardrail |
|---|---|
| SVG and HTML injection | Hostile corpus tests under TopoViewer package tests. |
| Grafana mounted file escape | Go backend tests for roots, symlinks, traversal, size, and redaction. |
| Public artifact leakage | Artifact autopsy scripts for npm, plugin zip, docs, and media. |
| Dependency and supply chain | npm audit, OSV, govulncheck, CodeQL, secret scanning, Trivy, Dependabot. |
| Renderer parity drift | `ci:render-parity` and docs smoke checks. |
| Unsupported public claims | Docs lint and public-readiness checks. |

## Next Steps

- Repository `SECURITY.md`: vulnerability reporting and scope.
- [Production hardening](production.md): validation gates and failure triage.
- [Grafana guide](grafana.md): mounted bundle behavior and mapper diagnostics.
- [Object attributes](object-reference.md): accepted authored fields and mapper implications.
