# TopoViewer

[![CI](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml)
[![Docs](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml)

TopoViewer turns YAML topology facts and selector stylesheets into interactive network, infrastructure, and service-topology diagrams.

![TopoViewer YAML to rendered network diagram](docs/assets/topoviewer-yaml-to-diagram.svg)

The static visual above is a README companion to the canonical
`integration/yaml-to-network-diagram` example. Refresh or validate the live
source with `npm run sync:docs` and the MkDocs/Zensical preview commands below.

```yaml
graph:
  nodes:
    - id: pe-fra-1
      labels: { role: pe, site: fra }
    - id: rr-ams-1
      labels: { role: rr, protocol: bgp }
  links:
    - id: bgp-fra-rr
      source: pe-fra-1
      target: rr-ams-1
      labels: { protocol: bgp }
```

The same source model can render underlay, BGP, service path, and failure views without redrawing the network by hand.

- [Try the YAML to diagram example](docs/topoviewer/yaml-to-diagram/index.md)
- [Open the real network demo](docs/topoviewer/real-network-demo.md)
- [Read why TopoViewer exists](docs/topoviewer/why-topoviewer.md)
- [Review the integration roadmap](docs/topoviewer/integration-roadmap.md)
- [Open the browser authoring harness](https://asadarafat.github.io/topoViewer/harness/)

TopoViewer is a monorepo for the renderer package, MkDocs plugin, VS Code authoring harness, examples, schemas, and documentation build.

## Legacy History

Pre-refresh history before the 2026-06-15 standalone rewrite is preserved at
https://github.com/asadarafat/topoViewer-legacy.

## Packages

| Package | Runtime | Published as | Responsibility |
|---|---|---|---|
| `packages/topoviewer` | Node, browser, React | `topoviewer` | Renderer, compiler, schemas, React component, and embeddable browser bundle |
| `packages/mkdocs-topoviewer` | Python, MkDocs | `mkdocs-topoviewer` | MkDocs fenced-block adapter and vendored browser assets |
| `packages/vscode-topoviewer` | VS Code, browser, Vite | Experimental package | VS Code preview extension and static browser authoring harness |

The dependency direction is one way:

```text
packages/topoviewer source -> dist/embed browser bundle -> packages/mkdocs-topoviewer vendored assets
```

React users should install the npm package. MkDocs users should install the Python plugin. Keeping those packages separate avoids forcing frontend build tooling into documentation builds.

## Development

Requirements:

- Node.js 24 LTS
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

Preview the GitHub Pages sites locally:

```bash
npm run docs:preview
```

This creates the local documentation virtualenvs, syncs generated docs, builds
the viewer assets once, then serves MkDocs at
`http://127.0.0.1:8001/topoViewer/` and Zensical at
`http://127.0.0.1:8002/topoViewer/zensical/`. If either fixed port is already
in use, the command exits with a port-specific error so you can release the
port and rerun it.

For Markdown-only review when assets are already current, use:

```bash
npm run docs:preview:fast
```

The published GitHub Pages artifact is assembled under `site/` with three
targets:

| Target | Published URL | Local command |
|---|---|---|
| MkDocs documentation | `https://asadarafat.github.io/topoViewer/` | `npm run docs:preview` |
| Zensical documentation | `https://asadarafat.github.io/topoViewer/zensical/` | `npm run docs:preview` |
| Browser authoring harness | `https://asadarafat.github.io/topoViewer/harness/` | `npm run vscode:harness` |

For a local static Pages artifact that includes all three targets, run:

```bash
npm run docs:build:parallel
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

Build and inspect the static browser harness that GitHub Pages publishes:

```bash
npm run vscode:harness:build
```

## Package Docs

- Renderer package: [packages/topoviewer/README.md](packages/topoviewer/README.md)
- Monorepo boundary: [packages/topoviewer/docs/monorepo.md](packages/topoviewer/docs/monorepo.md)
- MkDocs plugin: [packages/mkdocs-topoviewer/README.md](packages/mkdocs-topoviewer/README.md)
- Production guardrails: [packages/topoviewer/docs/production.md](packages/topoviewer/docs/production.md)
- Topology attention examples: [docs/topoviewer/reference/attention/index.md](docs/topoviewer/reference/attention/index.md)
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
npm run test:vscode-harness
npm run vscode:harness:build
npm run pack:check
npm run sync:mkdocs-assets
npm run wheel:mkdocs
npm run inspect:wheel
mkdocs build --strict
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
```

CI runs the same gates. The package is not considered production-ready when local-only generated output is required for success.
