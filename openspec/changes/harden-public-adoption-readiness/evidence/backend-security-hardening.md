# Backend Security Hardening Evidence

Date: 2026-06-30

This note records the mounted-bundle backend and Go vulnerability hardening slice.

## Implemented Guardrails

| Area | Implementation | Validation |
| --- | --- | --- |
| Symlink escape prevention | Mounted bundle files and manifests are resolved with `filepath.EvalSymlinks` before reads; resolved paths must remain under the allowed bundle root. | `go test ./...` through `npm run grafana:panel:test`. |
| File boundary checks | Backend rejects non-regular files, zero-byte files, files larger than `maxBundleFileSize`, and non-UTF-8 content. | `bundles_test.go` covers empty, oversized, and non-UTF-8 canonical files. |
| Root allowlist checks | Resource requests reject disallowed roots, relative roots outside the allowlist, `root=/`, and roots outside the configured allowlist; empty query roots use the configured default root. | `bundles_test.go` covers the root-allowlist resource behavior. |
| Discovery work bounds | Bundle root discovery caps bundle directories, and per-bundle scanning caps files per directory. | `bundles_test.go` covers root and bundle directory limits. |
| Manifest abuse | Manifest traversal, absolute path outside root, symlinked manifest escape, malformed YAML, and duplicate IDs are rejected or surfaced as diagnostics. | `bundles_test.go` covers traversal, absolute outside-root, symlink escape, malformed manifest YAML, and duplicate-ID cases. |
| Frontend path redaction | Grafana resource responses keep absolute mounted paths internal and return logical bundle-relative paths plus redacted diagnostics. | `bundles_test.go` covers index responses, manifest traversal errors, and read errors without leaking the temp bundle root. |
| Go vulnerability triage | Added `npm run go:vulncheck`, pinned to Go 1.25.11 and `govulncheck@v1.5.0`; GitHub Security workflow and local public-readiness lane use the same command. | `npm run go:vulncheck` reports zero called vulnerabilities. |
| Toolchain drift | CI, Docs, Security, and manual npm publish workflows now set up Go 1.25.11 consistently. | `scripts/check-public-readiness.mjs` requires `npm run go:vulncheck` in Security and public-readiness CI. |
| Hostile SVG/Markdown unit coverage | Added unit tests for executable SVG payload removal, unsafe image references, and inert Markdown/callout HTML output. | `npm --workspace topoviewer run test:unit -- security.test.ts`. |
| Remote secret-scan robustness | Security workflow checkout now uses full history so Gitleaks can scan the pushed commit range instead of failing on an unavailable base revision. | GitHub Security run `28449811135` exposed the shallow-checkout failure; local public-readiness now checks for `fetch-depth: 0`. |
| Third-party lab image drift | Pinned Grafana images currently report upstream HIGH findings in bundled Grafana binaries. Push and pull-request runs keep these scans visible but non-blocking; scheduled/manual Security runs remain blocking so image drift still creates maintainer work. | Local Trivy probes checked current `grafana/grafana:13.1.0`, slim, distroless, Ubuntu, and `13.0.3` variants; no clean pinned Grafana image was available at the time of this slice. |

## Remaining Open Items

This slice does not close the full hostile-content and backend security scope.
The following remain open:

- encoded SVG bypass corpus beyond the current regex coverage;
- docs-embed hostile rendering tests for MkDocs and Zensical;
- Grafana mapper-rendered hostile label and telemetry-label tests;
- YAML bomb/deep-nesting abuse tests;
- Grafana role/access checks;
- OSV or equivalent cross-ecosystem scanning beyond npm audit and govulncheck.
