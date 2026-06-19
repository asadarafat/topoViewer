# Monorepo Package Boundary

TopoViewer is intended to live as two separately published packages in one repository:

```text
topoviewer/
  package.json            # npm workspace orchestrator
  packages/
    topoviewer/           # npm package: topoviewer
    mkdocs-topoviewer/    # Python package: mkdocs-topoviewer
```

The packages stay separate because they serve different runtimes:

| Package | Runtime | Published as | Responsibility |
|---|---|---|---|
| `packages/topoviewer/` | Node, browser, React | `topoviewer` on npm | Renderer, compiler, schemas, React component, and embeddable browser bundle |
| `packages/mkdocs-topoviewer/` | Python, MkDocs | `mkdocs-topoviewer` on PyPI or a private Python index | MkDocs fenced-block adapter and vendored browser assets |

The monorepo is only a coordination boundary. It does not mean the Python plugin becomes part of the npm package, and it does not mean React users need MkDocs dependencies.

## Dependency Direction

The dependency direction is one way:

```text
packages/topoviewer source -> built embed bundle -> packages/mkdocs-topoviewer vendored assets
```

`mkdocs-topoviewer` vendors the browser-ready files from `packages/topoviewer/dist/embed/`:

- `topoviewer-embed.iife.js`
- `topoviewer-embed.css`

The renderer must not import Python plugin code. The Python plugin must not require npm at documentation build time. MkDocs users should be able to install and use the plugin with:

```bash
pip install mkdocs-topoviewer
```

## Local Development Flow

When changing renderer behavior:

```bash
cd packages/topoviewer
npm install
npm run build
npm run sync:mkdocs-assets
npm run test:all
```

When changing only the MkDocs plugin:

```bash
cd packages/mkdocs-topoviewer
python -m pip install -e .
```

When validating the public documentation targets from the repository root:

```bash
npm run docs:serve
npm run zensical:serve
```

MkDocs serves the canonical documentation site at `http://127.0.0.1:8000/topoViewer/` by default. Zensical serves the parallel preview site at `http://127.0.0.1:8002/` by default. Use `npm run docs:build:parallel` to build the combined GitHub Pages artifact with MkDocs at `site/` and Zensical at `site/zensical/`.

When validating the RTFM integration, the RTFM Makefile can build a local wheel from `mkdocs-topoviewer` and install it into the vanilla MkDocs Material container. That keeps the docs build close to the eventual user install model while still using local source during development.

## Release Flow

Release these as independent artifacts, even when the version numbers are intentionally aligned:

1. Build and test `topoviewer`.
2. Sync the approved embed bundle into `mkdocs-topoviewer`.
3. Build and test `mkdocs-topoviewer`.
4. Publish npm and Python packages independently.

Keeping the artifacts independent lets React apps install only the renderer, while MkDocs users install only the plugin.

## What Belongs Outside The Generic Packages

Keep customer-specific or proprietary material out of both public packages:

- Private topology importers.
- Customer icon packs.
- Private templates.
- Proprietary lint rules.
- Deployment-specific API clients.

Those belong in separate private extension packages that depend on the public renderer or plugin surface.

## Why Not Merge The Packages

Merging the packages would make a simple MkDocs plugin installation depend on frontend build tooling, and it would make React users carry Python packaging concerns. That increases support cost without improving the authoring model.

The clean boundary is:

```bash
npm install topoviewer
pip install mkdocs-topoviewer
```

One repository can coordinate the two packages, but each package should remain independently understandable, installable, testable, and publishable.
