# Public Surface Inventory

Audit date: 2026-06-30

This inventory records the public-facing material reviewed for
`harden-public-adoption-readiness`. It is intentionally summarized. The raw file
list is too noisy to review because generated example projections dominate the
count.

## Commands

```bash
find docs -type f \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' \) | wc -l
find packages/topoviewer/content -type f \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' \) | wc -l
find packages/topoviewer/examples -type f \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' \) | wc -l
find labs/grafana-topoviewer -type f \( -name '*.md' -o -name '*.yaml' -o -name '*.yml' -o -name '*.json' \) -not -path '*/node_modules/*' -not -path '*/dist/*' | wc -l
find .github -type f | wc -l
find packages -maxdepth 2 -name README.md -print | sort
```

## Counts

| Surface | Count | Notes |
| --- | ---: | --- |
| `docs/**` Markdown/YAML | 296 | MkDocs source, generated reference pages, generated example projections, public assets metadata. |
| `packages/topoviewer/content/**` Markdown/YAML | 282 | Canonical content source for docs pages and examples. |
| `packages/topoviewer/examples/**` Markdown/YAML | 260 | Canonical test-case catalog, including expected YAML used by tests. |
| `labs/grafana-topoviewer/**` Markdown/YAML/JSON | 26 | Lab README, dashboards, provisioning, bundles, Prometheus, gNMIc, and Containerlab config. |
| `.github/**` | 11 | Workflows, Dependabot, and issue templates. |
| Package READMEs | 4 | `topoviewer`, `mkdocs-topoviewer`, `grafana-topoviewer-panel`, `vscode-topoviewer`. |

## Primary Public Entry Points

| Surface | File |
| --- | --- |
| Root README | `README.md` |
| MkDocs nav and published docs | `mkdocs.yml`, `docs/index.md`, `docs/topoviewer/index.md` |
| Zensical config | `zensical.toml` |
| React/package docs | `packages/topoviewer/README.md`, `docs/topoviewer/react.md` |
| MkDocs integration docs | `packages/mkdocs-topoviewer/README.md`, `docs/topoviewer/mkdocs.md` |
| Zensical integration docs | `docs/topoviewer/zensical.md`, `docs/topoviewer/zensical-embed.md` |
| Browser/VS Code harness docs | `packages/vscode-topoviewer/README.md`, `docs/topoviewer/browser-harness.md` |
| Grafana panel docs | `packages/grafana-topoviewer-panel/README.md`, `labs/grafana-topoviewer/README.md` |
| Public support/security docs | `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `CODEOWNERS` |
| CI/security automation | `.github/workflows/*.yml`, `.github/dependabot.yml` |

## Navigation Classification From `mkdocs.yml`

| Nav Group | Current Intent |
| --- | --- |
| `Start` | First-run learning path. |
| `Author` | Authoring guides for topology, stylesheet, attention, layout, validation, and debugging. |
| `Embed` | React, MkDocs, Zensical, and integration-roadmap material. |
| `Examples` | Current example/reference catalog entry points. Needs curated examples before generated catalog in follow-up tasks. |
| `Reference` | Model, schema, TypeScript API, and glossary material. |
| `Labs` | Grafana lab only. Containerlab appears as Grafana telemetry mode, not a separate top-level lab. |
| `Maintainers` | Monorepo, production hardening, release, and documentation-standard material. |

## Findings

- The public surface is large enough that hand-maintained docs can drift from
  canonical content and generated examples. This supports the existing tasks for
  schema/reference linting and curated example demotion.
- Generated example pages are currently public and useful, but they are not a
  substitute for a small adoption-first example path.
- Grafana lab material is public and intentionally detailed. It must keep
  lab-only auth, unsigned plugin loading, and port exposure warnings adjacent to
  commands.
- The root docs structure is cleaner than before, but object-attribute reference
  completeness and mapper-authoring ergonomics remain the largest adoption gaps.
