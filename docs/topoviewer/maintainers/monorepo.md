# Monorepo

TopoViewer coordinates two published packages, two application adapters, and a
disposable integration lab in one repository:

```text
topoviewer/
  package.json            # npm workspace orchestrator
  packages/
    topoviewer/           # npm package: topoviewer
    topoviewer-studio/    # Browser and VS Code authoring application
    mkdocs-topoviewer/    # Python package: mkdocs-topoviewer
    vscode-topoviewer/    # VS Code host adapter
    grafana-topoviewer-panel/ # Grafana frontend and Go backend
  labs/
    grafana-topoviewer/containerlab/ # disposable runtime proof
```

These boundaries stay separate because they serve different runtimes and
release contracts:

| Area | Runtime | Distribution | Responsibility |
|---|---|---|---|
| `packages/topoviewer/` | Browser, React, Node build tooling | `topoviewer` on npm | Public model, compiler, validation, renderer, CSS, schemas, and embed bundle |
| `packages/mkdocs-topoviewer/` | Python, MkDocs | `mkdocs-topoviewer` on PyPI | Fenced-block adapter and vendored browser assets |
| `packages/topoviewer-studio/` | Browser and VS Code webview | Private application; Browser Studio is Beta Preview | Project sessions, authoring UI, browser persistence, canvas commands, mapper authoring, and export orchestration |
| `packages/vscode-topoviewer/` | VS Code extension host | Private and experimental | Workspace trust, filesystem lifecycle, atomic writes, file watching, and Studio messaging |
| `packages/grafana-topoviewer-panel/` | Grafana frontend and Go plugin backend | Private and experimental | Mounted-bundle resources, Grafana data-frame mapping, panel options, and diagnostics |
| `labs/grafana-topoviewer/containerlab/` | Docker and Containerlab | Generated local bundle only | Disposable telemetry and deployment proof |

The monorepo is a coordination boundary, not permission to import sibling
internals. Application source consumes public package exports. Python consumes
built embed assets. Labs consume built artifacts and mounted data.

## Dependency Direction

The dependency direction is one way:

```text
packages/topoviewer public API
  |-> packages/topoviewer-studio
  |-> packages/grafana-topoviewer-panel
  +-> external React applications

packages/topoviewer-studio public app/host contracts
  -> packages/vscode-topoviewer

packages/topoviewer source
  -> built embed bundle
  -> packages/mkdocs-topoviewer vendored assets

packages/grafana-topoviewer-panel build + mounted YAML
  -> labs/grafana-topoviewer/containerlab
  -> external lab or deployment
```

Consumer code may import `topoviewer`, `topoviewer/authoring`,
`topoviewer/export`, `topoviewer/integration`, and documented package subpaths
such as `topoviewer/style.css` and
`topoviewer/schemas/...`. It must not import `packages/topoviewer/src/**`
directly. Dependency-cruiser enforces that rule in both directions.

Studio browser and VS Code webview builds resolve those package names through
the workspace package exports, never through core source aliases. The required
`npm run studio:packed-core:check` lane packs the core artifact and builds
Studio against that isolated package, proving the monorepo is not hiding an
unpublished dependency.

`mkdocs-topoviewer` vendors the browser-ready files from `packages/topoviewer/dist/embed/`:

- `topoviewer-embed.iife.js`
- `topoviewer-embed.css`

The renderer must not import Python plugin code. The Python plugin must not
require npm at documentation build time. MkDocs users install and use the
plugin with:

```bash
pip install mkdocs-topoviewer
```

## Local Development Flow

Run commands from the repository root unless a package-specific script is
needed. The root scripts are the stable interface used by GitHub Actions.

| Task | Command |
|---|---|
| Full CI parity | `npm run ci` |
| Remote-style local run | `npm run ci:remote-parity` |
| Generated content drift | `npm run ci:generated` |
| Code quality | `npm run ci:quality` |
| Schema and semantic checks | `npm run ci:schemas` |
| Package and asset build | `npm run ci:build` |
| MkDocs, Zensical, and Studio Pages build | `npm run ci:docs` |
| Renderer surface parity | `npm run ci:render-parity` |
| Renderer tests | `npm run ci:test:topoviewer` |
| Studio browser and host tests | `npm run studio:ci:integration` |
| Core package contract | `npm run package:contract` |
| Studio against packed core | `npm run studio:packed-core:check` |
| Remote public-readiness guardrails | `npm run ci:public-readiness:core` |
| Full local/release public-adoption gate | `npm run ci:public-readiness` |

Remote `CI` is split by feedback lane after generated-content preflight. Local
`npm run ci` intentionally stays sequential so release and pre-push validation
exercise the complete gate in the same process tree.

When changing renderer behavior:

```bash
npm run build
npm run sync:mkdocs-assets
npm run ci:test:topoviewer
```

When changing only the MkDocs plugin:

```bash
cd packages/mkdocs-topoviewer
python -m pip install -e .
```

When validating the public documentation targets from the repository root:

```bash
npm run docs:preview
```

`npm run docs:preview` serves the combined GitHub Pages artifact from one local port. MkDocs is available at `http://127.0.0.1:8001/topoviewer/docs/mkdocs/`, Zensical at `http://127.0.0.1:8001/topoviewer/docs/zensical/`, and Studio at `http://127.0.0.1:8001/topoviewer/studio/`. The preview command fails instead of selecting another port when the fixed port is already in use. `npm run docs:build:parallel` builds those three surfaces under `site/`.

After building the static site, run:

```bash
npm run docs:smoke
npm run render:parity
```

Those checks open the built MkDocs, Zensical, and Studio pages through
Chromium using the same `/topoviewer/` path shape as GitHub Pages. The renderer
parity check compares only the TopoViewer viewport so page chrome differences
do not hide renderer drift.

When validating the RTFM integration, the RTFM Makefile can build a local wheel from `mkdocs-topoviewer` and install it into the vanilla MkDocs Material container. That keeps the docs build close to the eventual user install model while still using local source during development.

## Command Naming Contract

Scripts follow a small vocabulary:

| Prefix | Meaning |
|---|---|
| `dev:*` / unprefixed dev commands | Start a local development server. |
| `serve:*` / `docs:serve` | Serve an already prepared local preview. |
| `sync:*` | Write generated content or copied assets from canonical sources. |
| `check:*` | Check for generated drift without making durable changes. |
| `validate:*` | Validate schemas, semantics, or built artifacts. |
| `build:*` / `build` | Produce local build output. |
| `test:*` | Run focused tests. |
| `ci:*` | Run the exact gate shape expected by GitHub Actions. |
| `pack:*` / `wheel:*` | Inspect publishable npm or Python artifacts. |
| `clean:*` / `clean` | Remove generated build or report output. |

New scripts should fit this vocabulary. If a command writes tracked files, its
name should start with `sync:` or the command should be documented as a build
step that intentionally refreshes vendored assets.

## Retained Command Aliases

Keep the named `ci:*` lanes as the production contract. A few older or narrower
commands remain because they are convenient for local development or package
workflows:

| Command | Current role | Preferred production gate |
|---|---|---|
| `npm run test` | Renderer package test alias. | `npm run ci:test:topoviewer` |
| `npm run studio:test:browser` | Studio browser workflow tests. | `npm run studio:ci:integration` |
| `npm run test:hostile-content` | Focused hostile SVG/Markdown runtime and sanitizer tests. | `npm run ci:public-readiness` |
| `npm run docs:build` | Full MkDocs build with local setup behavior. | `npm run ci:docs` |
| `npm run docs:build:fast` | MkDocs build when the viewer bundle is already built. | `npm run ci:docs` |
| `npm run docs:serve` | Serve MkDocs directly for focused page work. | `npm run docs:preview` for Pages parity |
| `npm run docs:serve:fast` | Serve MkDocs directly without rebuilding the viewer. | `npm run docs:preview` for Pages parity |
| `npm run mkdocs:build` | Compatibility alias for the MkDocs build path. | `npm run docs:build` or `npm run ci:docs` |
| `npm run zensical:build` | Focused Zensical build. | `npm run ci:docs` |
| `npm run studio:dev` | Studio development server. | `npm run studio:ci:integration` for validation |
| `npm run check:public-readiness` | Focused public leak/readiness guardrail. | `npm run ci:public-readiness` |

Do not add new aliases for GitHub-facing behavior unless they improve the
command taxonomy. Prefer adding a named `ci:*` lane or a focused `sync:*`,
`check:*`, `validate:*`, `build:*`, or `test:*` command.

## Release Flow

Release these as independent artifacts, even when the version numbers are intentionally aligned:

1. Build and test `topoviewer`.
2. Sync the approved embed bundle into `mkdocs-topoviewer`.
3. Build and test `mkdocs-topoviewer`.
4. Publish npm and Python packages independently.

The Studio, VS Code host, and Grafana packages are built and tested as application
consumers before release, but they are not implied public packages. The
Containerlab bundle is generated from a built Grafana plugin and copied YAML;
it must not depend on an external checkout path.

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

The clean boundary for users is:

```bash
npm install topoviewer @xyflow/react react react-dom
pip install mkdocs-topoviewer
```

For release preflight, maintainers can still validate the renderer through the
local tarball produced by
`npm --workspace topoviewer pack --pack-destination /tmp/topoviewer-pack`.

One repository can coordinate the two packages, but each package should remain independently understandable, installable, testable, and publishable.
