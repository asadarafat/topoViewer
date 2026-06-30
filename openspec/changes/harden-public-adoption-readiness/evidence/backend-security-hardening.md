# Backend Security Hardening Evidence

Date: 2026-06-30

This note records the mounted-bundle backend and Go vulnerability hardening slice.

## Implemented Guardrails

| Area | Implementation | Validation |
| --- | --- | --- |
| Symlink escape prevention | Mounted bundle files and manifests are resolved with `filepath.EvalSymlinks` before reads; resolved paths must remain under the allowed bundle root. | `go test ./...` through `npm run grafana:panel:test`. |
| File boundary checks | Backend rejects non-regular files, zero-byte files, files larger than `maxBundleFileSize`, and non-UTF-8 content. | `bundles_test.go` covers empty, oversized, and non-UTF-8 canonical files. |
| Discovery work bounds | Bundle root discovery caps bundle directories, and per-bundle scanning caps files per directory. | `bundles_test.go` covers root and bundle directory limits. |
| Manifest abuse | Manifest traversal, absolute path outside root, and symlinked manifest escape are rejected. | `bundles_test.go` covers traversal, absolute outside-root, and symlink escape cases. |
| Go vulnerability triage | Added `npm run go:vulncheck`, pinned to Go 1.25.11 and `govulncheck@v1.5.0`; GitHub Security workflow and local public-readiness lane use the same command. | `npm run go:vulncheck` reports zero called vulnerabilities. |
| Toolchain drift | CI, Docs, Security, and manual npm publish workflows now set up Go 1.25.11 consistently. | `scripts/check-public-readiness.mjs` requires `npm run go:vulncheck` in Security and public-readiness CI. |
| Hostile SVG/Markdown unit coverage | Added unit tests for executable SVG payload removal, unsafe image references, and inert Markdown/callout HTML output. | `npm --workspace topoviewer run test:unit -- security.test.ts`. |

## Remaining Open Items

This slice does not close the full hostile-content and backend security scope.
The following remain open:

- encoded SVG bypass corpus beyond the current regex coverage;
- docs-embed hostile rendering tests for MkDocs and Zensical;
- Grafana mapper-rendered hostile label and telemetry-label tests;
- YAML bomb/deep-nesting abuse tests;
- diagnostic path redaction policy;
- Grafana role/access checks;
- OSV or equivalent cross-ecosystem scanning beyond npm audit and govulncheck.
