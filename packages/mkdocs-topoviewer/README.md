# mkdocs-topoviewer

**Support status:** Supported

`mkdocs-topoviewer` is the MkDocs plugin wrapper for TopoViewer. It lets MkDocs users install TopoViewer with pip and embed declarative topology diagrams with a fenced Markdown block.

This package is licensed under Apache-2.0, like TopoViewer. It is publish-shaped for intentional public Python package releases, while private/customer-specific material should stay in separate packages or private indexes.

## Repository Boundary

This package is intentionally separate from the npm renderer package, but both packages are intended to live in one monorepo:

```text
topoviewer/
  package.json            # npm workspace orchestrator
  packages/
    topoviewer/           # npm package: topoviewer
    mkdocs-topoviewer/    # Python package: mkdocs-topoviewer
```

The renderer package owns the React component, compiler, schemas, and browser bundle. This package owns only the MkDocs integration: fenced-block parsing, page-relative reference resolution, asset injection, and packaging the approved browser bundle for Python users.

The dependency direction is one way: build TopoViewer first, then vendor its browser-ready embed assets into this package. MkDocs users should not need npm, Vite, React, or TypeScript in their documentation build pipeline.

## Install

Target install after package publication:

```bash
pip install mkdocs-topoviewer
```

Local development install:

```bash
pip install -e packages/mkdocs-topoviewer
```

Private distribution should use an approved package index:

```bash
pip install --index-url https://<private-index>/simple mkdocs-topoviewer
```

## Configure

```yaml
plugins:
  - search
  - topoviewer
```

Optional plugin config:

```yaml
plugins:
  - topoviewer:
      asset_path: assets/topoviewer
```

## Use

````markdown
```topoviewer
topology: ./topoviewer-topo.yaml
stylesheet: ./topoviewer-style.yaml
height: 640px
title: MV network SR-TE service path
controls: true
controlsOpen: false
```
````

The plugin resolves `topology` and `stylesheet` relative to the Markdown page.

## What The Plugin Ships

The Python package vendors the browser-ready TopoViewer bundle:

- `topoviewer-embed.iife.js`
- `topoviewer-embed.css`
- `topoviewer-mkdocs.css`

MkDocs receives those files as generated site assets. Projects using the plugin do not need to run npm or copy assets manually.

## Development

When the TopoViewer browser bundle changes, refresh the vendored assets from the npm package:

```bash
cd ../topoviewer
npm run build
npm run sync:mkdocs
```

When changing only this Python plugin, work from this package root:

```bash
python -m pip install -e .
python -m build
```

The plugin package should remain independently buildable and publishable. Do not import source files from `../topoviewer`; use only the vendored browser assets under `mkdocs_topoviewer/assets/`.

## Release Model

- `mkdocs-topoviewer` is the MkDocs wrapper for the stable TopoViewer browser bundle.
- Public plugin releases should contain stable behavior, docs, schemas, and vendored assets.
- Internal preview builds should use approved private package indexes.
- Customer-specific templates, private assets, or proprietary importers belong in separate private packages, not in this generic plugin.
