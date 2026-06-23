# TopoViewer

[![CI](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/ci.yml)
[![Docs](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml/badge.svg)](https://github.com/asadarafat/topoviewer/actions/workflows/docs.yml)

TopoViewer is a production-oriented topology visualization toolkit for teams that
need diagrams to stay in sync with network reality.

It solves a common failure mode: topology diagrams are often treated as static images,
so they drift away from source data the moment operations changes. TopoViewer
keeps the diagram model in data and the visual policy in style, then renders both
consistently across docs, apps, and interactive tooling.

![TopoViewer YAML to rendered network diagram](docs/assets/topoviewer-yaml-to-diagram.png)

## Get a first result in 30 seconds

```bash
git clone https://github.com/asadarafat/topoviewer.git
cd topoviewer
npm ci
npm run docs:preview
```

Then open:

- `http://127.0.0.1:8001/topoViewer/` (MkDocs docs)
- `http://127.0.0.1:8002/topoViewer/zensical/` (Zensical docs)
- the URL shown by `npm run vscode:harness` (authoring harness)

Expected output after this:

- A rendered topology from the `yaml-to-diagram` example appears instantly.
- Layer toggles and attention behavior are usable from the docs examples.
- The same source model can be switched across underlay/BGP/service/failure views.

## Why teams use TopoViewer

- **Source of truth in YAML:** topology facts (`graph`, `nodes`, `links`, `paths`,
  `regions`) are authored separately from rendering policy (`stylesheet`).
- **Reusable views from one model:** switch layers (underlay, BGP, service, failure)
  without rebuilding the whole diagram.
- **Attention-focused cognition:** highlight paths, mute context, collapse regions, and
  keep dense environments understandable.
- **Integration-ready:** the same model powers a React package, MkDocs plugin,
  Zensical embed, and browser harness workflow.
- **Production gates built in:** schema validation, semantic linting, and UI/fixture
  coverage are part of repository workflows.

## What you can do with it now

- Render editable topology and stylesheet YAML directly in docs.
- Build operational diagrams that reflect intent and can evolve with CI.
- Create dense network views with region management and attention behavior.
- Export rendered outputs for documentation, design reviews, and handoff.

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

The same data can drive underlay/BGP/service/failure views by toggling layer visibility
and attention rules.

## Quick links

- [Why TopoViewer](docs/topoviewer/why-topoviewer.md)
- [YAML to diagram](docs/topoviewer/yaml-to-diagram/index.md)
- [Real network demo](docs/topoviewer/real-network-demo.md)
- [Attention examples](docs/topoviewer/reference/attention/index.md)
- [Integration roadmap](docs/topoviewer/integration-roadmap.md)
- [Docs preview: MkDocs](https://asadarafat.github.io/topoViewer/)
- [Docs preview: Zensical](https://asadarafat.github.io/topoViewer/zensical/)
- [Authoring harness](https://asadarafat.github.io/topoViewer/harness/)

## Package layout

- `packages/topoviewer` → `topoviewer` package (React renderer, compiler, schemas,
  embeddable browser bundle)
- `packages/mkdocs-topoviewer` → `mkdocs-topoviewer` (MkDocs plugin + vendored viewer
  assets)
- `packages/vscode-topoviewer` → experimental VS Code/browser authoring harness

The data model flows from `packages/topoviewer` into `dist/embed`, then into docs adapters.

## Run locally

### Prerequisites

- Node.js 24 LTS
- Python 3.9+ (for MkDocs plugin workflows)

### Core commands

```bash
npm ci
npm run build
npm run test:all
```

### Docs and previews

```bash
npm run docs:preview
```

This serves:

- MkDocs: `http://127.0.0.1:8001/topoViewer/`
- Zensical: `http://127.0.0.1:8002/topoViewer/zensical/`
- Harness (separate command): `npm run vscode:harness`

Use `npm run vscode:harness` if you want to edit YAML directly and watch live updates in the browser authoring pane.

### Install for consumers

If you want to use TopoViewer as a package:

```bash
npm install topoviewer
python3 -m pip install mkdocs-topoviewer
```

### Browser-only review

When generated assets are already current:

```bash
npm run docs:preview:fast
```

For a local artifact containing all publish targets:

```bash
npm run docs:build:parallel
```

## Production readiness checks

Run before releases or major merges:

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

CI runs the same set of checks.

## Further documentation

- Renderer package: [packages/topoviewer/README.md](packages/topoviewer/README.md)
- Plugin docs: [packages/mkdocs-topoviewer/README.md](packages/mkdocs-topoviewer/README.md)
- Repository architecture: [packages/topoviewer/docs/monorepo.md](packages/topoviewer/docs/monorepo.md)
- Production quality model: [packages/topoviewer/docs/production.md](packages/topoviewer/docs/production.md)
- Attention roadmap: [packages/topoviewer/docs/attention-roadmap.md](packages/topoviewer/docs/attention-roadmap.md)

## Legacy history

The historical pre-refresh repository is preserved at
[topoViewer-legacy](https://github.com/asadarafat/topoViewer-legacy).
