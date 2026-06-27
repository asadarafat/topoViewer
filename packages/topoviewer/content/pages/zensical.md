# Zensical Adapter

TopoViewer's Zensical integration is currently an adapter-only static site integration. It is not an installable Zensical plugin package.

The working model is:

```text
TopoViewer build -> browser embed CSS/JS
docs/ -> generated .artifacts/zensical-docs
Zensical config -> loads static assets
adapter JavaScript -> mounts .topoviewer-embed blocks
```

This keeps the integration usable today without depending on unstable Zensical plugin or module hooks.

## What Is Installed

Nothing Zensical-specific is installed as a TopoViewer plugin.

The repository uses:

- `zensical.toml` to configure Zensical.
- `extra_css` to load `assets/topoviewer/topoviewer-embed.css` and the Zensical adapter CSS.
- `extra_javascript` to load `assets/topoviewer/topoviewer-embed.iife.js` and the Zensical adapter script.
- `docs/assets/topoviewer/topoviewer-zensical.js` to call `window.TopoViewerEmbed.mountAll()`.

The adapter subscribes to Zensical's `document$` observable when available, so embeds are remounted after instant navigation. The TopoViewer embed bundle is idempotent and skips containers that are already mounted.

## Authoring Model

MkDocs remains the canonical documentation authoring surface. Authors continue to write `topoviewer` fenced blocks in `docs/topoviewer`:

````markdown
```topoviewer
topology: ../../../examples/attention/object-focus/topology.yaml
stylesheet: ../../../examples/attention/object-focus/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: Object focus
```
````

The Zensical sync step rewrites those fences into plain static HTML:

```html
<figure class="topoviewer-figure" style="--topoviewer-width: 100%;">
  <figcaption class="topoviewer-title">Object focus</figcaption>
  <div class="topoviewer-embed topoviewer-parity-theme" data-topology="..." data-stylesheet="..." style="height: 420px;"></div>
</figure>
```

It also expands YAML snippet directives so the Zensical output shows full topology and stylesheet source text.

## Local Commands

Preview both local documentation sites:

```bash
npm run docs:preview
```

Preview only the Zensical site:

```bash
npm run zensical:serve
```

Build the Zensical site:

```bash
npm run zensical:build
```

Build the combined GitHub Pages artifact:

```bash
npm run docs:build:parallel
```

Local preview uses the same path shape as the published GitHub Pages site, but with a local host and port:

| Target | Local preview | Published GitHub Pages |
| --- | --- | --- |
| MkDocs | `http://127.0.0.1:8001/topoviewer/docs/mkdocs/` | `https://asadarafat.github.io/topoviewer/docs/mkdocs/` |
| Zensical | `http://127.0.0.1:8001/topoviewer/docs/zensical/` | `https://asadarafat.github.io/topoviewer/docs/zensical/` |

If either local port is already in use, the serve command exits with a clear error instead of selecting another port. Release the port and rerun the command.

When running the targeted `npm run zensical:serve` command, Zensical still uses its own development server. The production-like `npm run docs:preview` command is the preferred local review path because it serves MkDocs, Zensical, and the browser harness from the same `/topoviewer/` base.

## Generated Files

The durable source files are:

- `docs/**` for canonical TopoViewer documentation.
- `docs/topoviewer/zensical-embed.md` for the Zensical adapter example.
- `docs/assets/topoviewer/topoviewer-zensical.css` and `topoviewer-zensical.js`.
- `scripts/sync-zensical-docs.mjs`.
- `scripts/sync-zensical-assets.mjs`.

These generated files are ignored and recreated for Zensical builds:

- `.artifacts/zensical-docs/**`

## Why Not A Plugin Yet

A future `zensical-topoviewer` package can make sense when Zensical exposes stable extension hooks for:

- Markdown fence rewriting.
- Page-relative topology and stylesheet path resolution.
- Asset injection.
- Build-time diagnostics.

Until then, the adapter-only approach is the safer production path because it uses static assets, documented Zensical configuration, and the existing browser embed bundle.
