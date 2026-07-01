# Docs Visual Review Evidence

Date: 2026-07-01

## Scope

This review checked the public conversion path after the docs IA moved guide
pages under `topoviewer/start`, `topoviewer/embed`, and `topoviewer/examples`.

Reviewed pages:

- MkDocs home: `/topoviewer/docs/mkdocs/`
- MkDocs First Topology: `/topoviewer/docs/mkdocs/topoviewer/start/first-topology/`
- MkDocs Style Your First Topology: `/topoviewer/docs/mkdocs/topoviewer/start/style-your-first-topology/`
- MkDocs Examples Gallery: `/topoviewer/docs/mkdocs/topoviewer/examples/examples-gallery/`
- MkDocs Kubernetes Service Map gallery section
- MkDocs React guide: `/topoviewer/docs/mkdocs/topoviewer/embed/react/`
- MkDocs MkDocs guide: `/topoviewer/docs/mkdocs/topoviewer/embed/mkdocs/`
- MkDocs Static HTML / Zensical Adapter guide
- Zensical Examples Gallery
- Zensical Kubernetes Service Map

## Finding And Fix

The first Playwright visual probe caught broken MkDocs live viewport asset
paths after the docs IA move. Fenced blocks using `examples/...` were being
resolved relative to the generated page URL, which produced paths such as
`topoviewer/start/examples/...` and `topoviewer/examples/examples/...`.

Fix:

- `packages/mkdocs-topoviewer/mkdocs_topoviewer/plugin.py` now treats
  `examples/...` as the canonical `topoviewer/examples/...` source root,
  matching the Zensical adapter resolver behavior.
- `scripts/sync-zensical-docs.mjs` now includes
  `topoviewer/examples/kubernetes-service-map/index.md` in the public
  Zensical page allowlist.
- The Kubernetes service map example was tuned so data-service labels render
  horizontally and the first viewport reads like a public gallery example.

## Local Artifacts

Screenshots were generated under:

```text
.artifacts/public-adoption-visual-review/
```

The generated local artifact index is:

```text
.artifacts/public-adoption-visual-review/README.md
```

Representative screenshots:

- `mkdocs-home.png`
- `mkdocs-first-topology.png`
- `mkdocs-style-your-first-topology.png`
- `mkdocs-examples-gallery.png`
- `mkdocs-examples-kubernetes-service-map.png`
- `mkdocs-react.png`
- `mkdocs-mkdocs.png`
- `mkdocs-zensical-adapter.png`
- `zensical-examples-gallery.png`
- `zensical-kubernetes-service-map.png`

These remain local-only review artifacts and are intentionally not checked in.

## Commands

```bash
npm run sync:docs
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run docs:smoke
```

The Playwright visual probe used the built `site/` output with the repository
static docs server and captured the pages listed above.

## Result

Pass.

- No navigation, heading, HTTP, or TopoViewer render errors were detected after
  the resolver fix.
- The Examples Gallery first viewport presents curated patterns rather than a
  generated catalog dump.
- The Kubernetes service map demonstrates non-network infrastructure without
  compressed vertical labels.
- MkDocs and Zensical both expose the Kubernetes service map page.
