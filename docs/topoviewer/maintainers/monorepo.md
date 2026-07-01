# Monorepo

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

The renderer must not import Python plugin code. The Python plugin must not
require npm at documentation build time. After the Python package is published
and verified, MkDocs users should be able to install and use the plugin with:

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
| MkDocs, Zensical, and harness docs build | `npm run ci:docs` |
| Renderer surface parity | `npm run ci:render-parity` |
| Renderer tests | `npm run ci:test:topoviewer` |
| Browser harness tests | `npm run ci:test:harness` |
| Public adoption/readiness gate | `npm run ci:public-readiness` |

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

`npm run docs:preview` serves the combined GitHub Pages artifact from one local port. MkDocs is available at `http://127.0.0.1:8001/topoviewer/docs/mkdocs/`, Zensical is available at `http://127.0.0.1:8001/topoviewer/docs/zensical/`, and the browser harness is available at `http://127.0.0.1:8001/topoviewer/harness/`. The preview command fails instead of selecting another port when the fixed port is already in use. Use `npm run docs:build:parallel` to build the combined GitHub Pages artifact with MkDocs at `site/docs/mkdocs/`, Zensical at `site/docs/zensical/`, and the harness at `site/harness/`.

After building the static site, run:

```bash
npm run docs:smoke
npm run render:parity
```

Those checks open the built MkDocs, Zensical, and harness pages through
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
| `npm run test:vscode-harness` | Browser harness test alias. | `npm run ci:test:harness` |
| `npm run test:hostile-content` | Focused hostile SVG/Markdown runtime and sanitizer tests. | `npm run ci:public-readiness` |
| `npm run docs:build` | Full MkDocs build with local setup behavior. | `npm run ci:docs` |
| `npm run docs:build:fast` | MkDocs build when the viewer bundle is already built. | `npm run ci:docs` |
| `npm run docs:serve` | Serve MkDocs directly for focused page work. | `npm run docs:preview` for Pages parity |
| `npm run docs:serve:fast` | Serve MkDocs directly without rebuilding the viewer. | `npm run docs:preview` for Pages parity |
| `npm run mkdocs:build` | Compatibility alias for the MkDocs build path. | `npm run docs:build` or `npm run ci:docs` |
| `npm run zensical:build` | Focused Zensical build. | `npm run ci:docs` |
| `npm run vscode:harness` | Browser harness development server. | `npm run ci:test:harness` for validation |
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
# after PyPI publication:
pip install mkdocs-topoviewer
```

For release preflight, maintainers can still validate the renderer through the
local tarball produced by
`npm --workspace topoviewer pack --pack-destination /tmp/topoviewer-pack`.

One repository can coordinate the two packages, but each package should remain independently understandable, installable, testable, and publishable.
