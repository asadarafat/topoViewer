# Security Surface Inventory

Audit date: 2026-06-30

This inventory records the first-pass review of lab credentials, broad port
exposure, hostile input paths, YAML parsing, SVG handling, mapper overlays, and
mounted-bundle file reads.

## Commands

```bash
rg -n "GRAFANA_ADMIN_PASSWORD=admin|GRAFANA_ADMIN_USER=admin|admin/admin|GF_AUTH_ANONYMOUS_ENABLED|GF_AUTH_DISABLE_LOGIN_FORM|GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS|anonymous Admin|unsigned plugin|0\.0\.0\.0|ports:" scripts docs README.md SECURITY.md SUPPORT.md packages labs .github --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/.artifacts/**'

rg -n "dangerouslySetInnerHTML|sanitize|DOMPurify|parse\(|yaml|YAML|mapper|readFile|readFileSync|fs\.|os\.ReadFile|filepath|realpath|symlink|svg|SVG|innerHTML" packages/topoviewer/src packages/grafana-topoviewer-panel/src packages/grafana-topoviewer-panel/pkg packages/vscode-topoviewer/src scripts labs/grafana-topoviewer --glob '!**/dist/**' --glob '!**/node_modules/**'
```

## Lab Credential And Port Findings

| Finding | Files | Status |
| --- | --- | --- |
| Anonymous Admin and disabled login are enabled in local Grafana labs. | `labs/grafana-topoviewer/docker-compose.yml`, `labs/grafana-topoviewer/containerlab/topoviewer-grafana.clab.yml` | Accepted lab-only risk with startup warning and docs warning. |
| Unsigned plugin loading is enabled in local Grafana labs. | Same Grafana lab configs. | Accepted lab-only risk; docs state unsigned plugin loading is local lab/development only. |
| Synthetic Docker Compose lab exposes Grafana, Prometheus, and injector. | `labs/grafana-topoviewer/docker-compose.yml` | Bound to `127.0.0.1` and checked by public-readiness guardrail. |
| Containerlab profile publishes Grafana, Prometheus, gNMIc, and normalizer host ports. | `labs/grafana-topoviewer/containerlab/topoviewer-grafana.clab.yml` | Documented as trusted-local-host/host-firewall responsibility. Follow-up can investigate per-port host binding if Containerlab supports the exact syntax reliably. |
| Lab services listen on `0.0.0.0` inside containers. | `labs/grafana-topoviewer/telemetry-injector/src/server.mjs`, `labs/grafana-topoviewer/containerlab/normalizer/src/server.mjs` | Acceptable inside containers only if host-published ports are constrained and documented. |
| Production-facing docs must not contain copyable lab credentials/settings. | `scripts/check-public-readiness.mjs` | Guardrail added for admin/admin, anonymous-login YAML, disabled-login YAML, and unsigned-plugin YAML snippets. |

## Hostile Input And Rendering Paths

| Surface | Files | Risk |
| --- | --- | --- |
| Inline SVG sanitization | `packages/topoviewer/src/core/security.ts`, `packages/topoviewer/src/core/validation.ts`, `packages/topoviewer/src/core/lint.ts` | Needs hostile SVG corpus and coverage for script tags, event handlers, `foreignObject`, JavaScript hrefs, and encoded bypasses. |
| YAML schema/validation | `packages/topoviewer/src/core/validation.ts`, `packages/topoviewer/src/core/lint.ts`, `packages/topoviewer/src/core/compose.ts`, `packages/topoviewer/src/core/compiler.ts` | Needs YAML abuse corpus for deep nesting, aliases, huge arrays, duplicate keys, null bytes, and partial-edit behavior. |
| Markdown/callout/label rendering | `packages/topoviewer/src/core/types.ts`, renderer components under `packages/topoviewer/src` | Needs inert-content tests across React, docs embeds, harness, and Grafana. |
| Mapper parser and overlays | `packages/grafana-topoviewer-panel/src/mapperParser.ts`, `packages/grafana-topoviewer-panel/src/mapperOverlayAdapter.ts`, `packages/grafana-topoviewer-panel/src/mapperTelemetryFrames.ts`, `packages/grafana-topoviewer-panel/src/mapperTypes.ts` | Needs hostile mapper template, unsupported overlay, stale object, and telemetry-label tests. |
| Grafana mounted-bundle backend | `packages/grafana-topoviewer-panel/pkg/plugin/bundles.go`, `packages/grafana-topoviewer-panel/pkg/plugin/bundles_test.go` | Needs hardening tests for traversal, symlink escape, root allowlist, duplicate files, zero-byte/non-UTF-8 files, size limits, many directories, and diagnostic redaction. |
| VS Code/harness file and export paths | `packages/vscode-topoviewer/src/extension/extension.ts`, `packages/vscode-topoviewer/src/webview/webviewYamlAuthoring.ts` | Needs mapper authoring tests and export/write boundary checks when mapper bundle export is added. |
| Docs embed asset paths | `scripts/check-zensical-build.mjs`, MkDocs plugin package assets | Needs docs-embed hostile content and CSS-leakage regression tests. |

## Immediate Guardrails Added

- Public text leak checks for local paths, private workspace markers, wrong
  route casing, and local promo artifact references.
- Lab-warning checks for disposable `.env` defaults, anonymous Admin, unsigned
  plugin loading, startup warnings, and localhost-bound Docker Compose ports.
- Production-doc guardrail rejecting copyable Grafana lab credentials/settings
  outside lab-only material.
- Dependabot, CodeQL, security workflow, secret scanning, and container-image
  scanning configuration presence checks.

## Follow-Up Open Tasks

- Hostile content corpus and tests: tasks `12.1` through `12.9`.
- Grafana mounted-bundle backend abuse tests: tasks `13.1` through `13.8`.
- Release artifact autopsy: tasks `14.1` through `14.6`.
- Dependency-risk ledger and OSV/govuln triage: tasks `15.1` through `15.4`
  and `15.13` through `15.14`.
- Mapper authoring and validation UX in harness: tasks `8.1` through `8.22`.
