# Support Policy

TopoViewer is early-access software. This file defines what users can reasonably
depend on today and what remains experimental, lab-only, or roadmap.

## Supported Surfaces

Supported means the surface is intended for normal users, documented, and
covered by local or CI validation.

- `packages/topoviewer` core compiler, schemas, style resolution, React runtime,
  and exported package artifacts.
- Canonical topology, stylesheet, attention, and mapper schemas under
  `packages/topoviewer/schemas`.
- MkDocs live viewport embedding through `packages/mkdocs-topoviewer`.
- Public MkDocs documentation generated from `packages/topoviewer/content/**`.

## Best-Effort Surfaces

Best-effort means useful and maintained, but API or workflow details can still
change before a stable release.

- Zensical documentation projection.
- TopoViewer Studio browser authoring workflow.
- TopoViewer Studio VS Code host workflow.
- Grafana panel mounted-bundle workflow and mapper runtime.

## Lab-Only Surfaces

Lab-only means local validation or demo infrastructure. It is not production
deployment guidance.

- `labs/grafana-topoviewer` synthetic Grafana/Prometheus lab.
- Grafana Containerlab-mode telemetry lab.
- Checked-in lab `.env` defaults, anonymous Admin, disabled login form, unsigned
  plugin loading, and published localhost ports.
- Telemetry injectors, generated demo metrics, and screenshot artifacts.

## Roadmap Surfaces

- NetBox plugin.
- OpsMill/Infrahub plugin.
- Packaged/signed Grafana plugin distribution.
- Codespaces or hosted multi-surface demo environment.

## Unsupported Internals

These can change without compatibility guarantees:

- files under `.artifacts/`, `site/`, `dist/`, `build/`, `test-results/`, and
  generated Playwright reports;
- private helper functions not exported from package entry points;
- archived OpenSpec implementation details;
- local lab topology internals that are not documented as public contracts.

## Response Expectations

This project does not provide a promised SLA. Maintainers triage issues by
security impact, public API breakage, data-loss risk, reproducibility, and
alignment with the TopoViewer product boundary.

Security reports should follow `SECURITY.md`. Public bug reports should include
the smallest YAML or command sequence that reproduces the issue.
