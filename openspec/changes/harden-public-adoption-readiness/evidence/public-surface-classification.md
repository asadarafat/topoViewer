# Public Surface Classification

Audit date: 2026-06-30

This classification uses the status taxonomy from `design.md`:

- `Supported`: intended for normal users; covered by CI and docs.
- `Experimental`: implemented, but API or UX can change.
- `Lab`: local validation/demo environment, not a packaged product surface.
- `Roadmap`: planned or being specified, not supported.
- `Maintainer`: internal development/release documentation.

## Surface Status

| Surface | Status | Evidence | Notes |
| --- | --- | --- | --- |
| TopoViewer YAML model and renderer core | Supported | `packages/topoviewer`, `docs/topoviewer/reference/reference-model.md`, generated schemas | Stable center of the repo. Public npm package still needs manual publish readiness before install docs can remove pre-publish caveat. |
| React embedding | Supported | `docs/topoviewer/embed/react.md`, `packages/topoviewer/README.md` | Needs continued API/docs alignment and package install dry-run before public npm claim. |
| MkDocs plugin | Supported | `packages/mkdocs-topoviewer`, `docs/topoviewer/embed/mkdocs.md`, docs CI | Supported docs embed path. |
| Zensical static adapter | Experimental | `docs/topoviewer/embed/static-html-zensical-adapter.md`, generated Zensical site | Works as a generated adapter, but not a standalone packaged plugin. |
| Browser harness | Experimental | `packages/vscode-topoviewer/src/harness`, `docs/topoviewer/tools/browser-harness.md` | Strong authoring surface, but mapper bundle authoring is still missing. |
| VS Code extension package | Experimental | `packages/vscode-topoviewer`, `packages/vscode-topoviewer/README.md` | Package exists, but product workflow and distribution are not mature enough to call supported. |
| Grafana panel mounted-bundle workflow | Experimental | `packages/grafana-topoviewer-panel`, `labs/grafana-topoviewer/README.md` | Implemented and valuable, but needs mapper docs, harness mapper authoring, backend hardening tests, release artifact integrity, and signed plugin guidance. |
| Grafana synthetic telemetry lab | Lab | `labs/grafana-topoviewer/docker-compose.yml` | Local-only validation with explicit anonymous Admin/unsigned-plugin warnings. |
| Grafana Containerlab telemetry mode | Lab | `labs/grafana-topoviewer/containerlab` | Real telemetry validation mode under Grafana lab, not a separate public top-level lab. |
| NetBox integration | Roadmap | `docs/topoviewer/evaluate/integration-roadmap.md`, OpenSpec studies/changes | Not shipped. Should remain roadmap until plugin packaging and docs exist. |
| OpsMill/Infrahub integration | Roadmap | `docs/topoviewer/evaluate/integration-roadmap.md`, OpenSpec studies/changes | Not shipped. Should remain roadmap until plugin packaging and docs exist. |
| Release, monorepo, docs standard, hardening docs | Maintainer | `docs/topoviewer/maintainers/monorepo.md`, `docs/topoviewer/maintainers/release.md`, `docs/topoviewer/maintainers/documentation-standard.md`, `docs/topoviewer/maintainers/production-hardening.md` | Public for transparency, but not part of the first-run learning path. |

## Classification Gaps

- Status wording is not yet centrally generated across README, docs home,
  package READMEs, and integration pages. Tasks `4.1` through `4.4` remain open.
- The generated example catalog is public and useful, but it reads like an
  exhaustive regression catalog rather than an adoption path. Tasks `5.1`
  through `5.7` remain open.
- Object attributes and mapper attributes are not yet documented exhaustively
  enough for a developer to avoid source-code reading. Tasks `6.9` through
  `6.17` and `10.10` remain open.
- Grafana should stay `Experimental` until the backend abuse tests, mapper docs,
  package artifact checks, and release/signing story exist.
