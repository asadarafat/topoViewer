# TopoViewer

[![CI](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml)
[![Docs](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml)

TopoViewer is a monorepo for declarative graph rendering packages.

TopoViewer is a declarative graph renderer for network, infrastructure, and service-topology diagrams. It turns YAML graph definitions and selector stylesheets into interactive topology views, embeddable documentation diagrams, and exportable visual assets.

## Legacy History

Pre-refresh history before the 2026-06-15 standalone rewrite is preserved at
https://github.com/asadarafat/topoViewer-legacy.

## Packages

| Package | Runtime | Published as | Responsibility |
|---|---|---|---|
| `packages/topoviewer` | Node, browser, React | `topoviewer` | Renderer, compiler, schemas, React component, and embeddable browser bundle |
| `packages/mkdocs-topoviewer` | Python, MkDocs | `mkdocs-topoviewer` | MkDocs fenced-block adapter and vendored browser assets |

The dependency direction is one way:

```text
packages/topoviewer source -> dist/embed browser bundle -> packages/mkdocs-topoviewer vendored assets
```

React users should install the npm package. MkDocs users should install the Python plugin. Keeping those packages separate avoids forcing frontend build tooling into documentation builds.

## Development

Requirements:

- Node.js `>=20.19`
- Python `>=3.9` for the MkDocs plugin and documentation build

Install and run from the monorepo root:

```bash
npm ci
npm run dev
npm run build
npm run test:all
```

Build the documentation site:

```bash
npm run sync:docs
python3 -m pip install -e packages/mkdocs-topoviewer mkdocs-material
mkdocs build --strict
```

Build the MkDocs plugin wheel:

```bash
npm run wheel:mkdocs
npm run inspect:wheel
```

Refresh the MkDocs plugin vendored browser assets after changing renderer behavior:

```bash
npm run build
npm run sync:mkdocs-assets
```

## Package Docs

- Renderer package: [packages/topoviewer/README.md](packages/topoviewer/README.md)
- Monorepo boundary: [packages/topoviewer/docs/monorepo.md](packages/topoviewer/docs/monorepo.md)
- MkDocs plugin: [packages/mkdocs-topoviewer/README.md](packages/mkdocs-topoviewer/README.md)
- Production guardrails: [packages/topoviewer/docs/production.md](packages/topoviewer/docs/production.md)
- Topology attention roadmap: [packages/topoviewer/docs/attention-roadmap.md](packages/topoviewer/docs/attention-roadmap.md)

## Repository Quality Gates

Before publishing or merging a release candidate:

```bash
npm ci
npm run sync:docs
npm run validate:schemas
npm run validate:semantics
npm run build
npm test
npm run pack:check
npm run sync:mkdocs-assets
npm run wheel:mkdocs
npm run inspect:wheel
mkdocs build --strict
```

CI runs the same gates. The package is not considered production-ready when local-only generated output is required for success.
