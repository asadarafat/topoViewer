# TopoViewer In Zensical Feasibility Study

## Scope

This study evaluates whether TopoViewer can be embedded in Zensical documentation in a way comparable to the current MkDocs integration.

The study is based on:

- The current TopoViewer browser embed bundle and MkDocs plugin implementation in this repository.
- Zensical public documentation available on 2026-06-19.
- The absence of a local Zensical project checkout under `/Users/aarafat/_projects`, so project-specific Zensical code paths were not inspected.

## Current TopoViewer Embed Model

TopoViewer already has two integration surfaces:

1. React package integration through `topoviewer` and the exported `<TopoViewer />` component.
2. Static documentation integration through `topoviewer/embed/topoviewer-embed.iife.js` and `topoviewer/embed/topoviewer-embed.css`.

The MkDocs plugin is intentionally thin:

- It rewrites fenced `topoviewer` Markdown blocks into `<figure>` and `<div class="topoviewer-embed">` HTML.
- It resolves `topology` and `stylesheet` paths relative to the Markdown page.
- It injects vendored TopoViewer CSS and JavaScript into the built site.
- It passes runtime options through `data-*` attributes, including controls and attention state.
- The browser bundle fetches YAML and mounts all `.topoviewer-embed` containers.

This means the core embed behavior is not MkDocs-specific. MkDocs is only the authoring and asset-adapter layer.

## Zensical Facts Relevant To Embedding

Zensical is a static site generator built by the creators of Material for MkDocs and is published as a Python package. Its docs describe support for Markdown authoring, Python Markdown extensions, custom CSS, custom JavaScript, and MiniJinja theme overrides.

Relevant Zensical capabilities:

- `extra_css` can add site CSS files from the docs directory.
- `extra_javascript` can add site JavaScript files from the docs directory.
- Extra JavaScript can be loaded as modules, async, or defer.
- Zensical exposes a `document$` observable for custom JavaScript that must rerun after instant navigation.
- Python Markdown extensions such as Snippets and SuperFences are supported.
- Theme overrides can customize templates and inject markup/scripts through MiniJinja blocks.

Relevant uncertainty:

- A full MkDocs-style plugin port is not the safest first target because Zensical's plugin/module story is still evolving. Public discussion and docs point to a broader module/component system as future-facing.
- Without a first-class Zensical plugin hook equivalent to MkDocs `on_page_markdown`, `on_config`, and `on_files`, a package cannot currently be assumed to rewrite fences, generate assets, and inject config in one place.

## Feasibility Verdict

TopoViewer in Zensical is feasible now, but the first implementation should not try to be a full MkDocs plugin clone.

Recommended first target:

- Ship a Zensical static embed recipe and small adapter script that reuses the existing TopoViewer IIFE bundle.
- Let authors place TopoViewer assets under `docs/assets/topoviewer/`.
- Configure Zensical `extra_css` and `extra_javascript`.
- Author embeds as HTML blocks or generated snippets containing `.topoviewer-embed` containers.
- Subscribe to `document$` and call `window.TopoViewerEmbed.mountAll()` after each Zensical navigation event.

Recommended later target:

- Add a `zensical-topoviewer` package only when Zensical has stable module/plugin hooks that can replace the current MkDocs plugin responsibilities cleanly.

## Proposed Phase 1: Static Zensical Adapter

### Authoring Contract

Authors can embed TopoViewer with plain Markdown HTML:

```html
<figure class="topoviewer-figure" style="--topoviewer-width: 100%;">
  <figcaption class="topoviewer-title">Metro service path</figcaption>
  <div
    class="topoviewer-embed"
    data-topology="../topoviewer/metro-topology.yaml"
    data-stylesheet="../topoviewer/metro-stylesheet.yaml"
    data-controls="true"
    data-controls-open="false"
    style="height: 640px"
  ></div>
</figure>
```

If Zensical snippets are enabled, teams can keep the HTML wrapper in a reusable snippet and include only the per-diagram file paths in page-local content.

### Configuration

Copy or publish these files under the Zensical docs directory:

```text
docs/
  assets/
    topoviewer/
      topoviewer-embed.css
      topoviewer-embed.iife.js
      topoviewer-zensical.css
      topoviewer-zensical.js
```

Configure Zensical:

```toml
[project]
extra_css = [
  "assets/topoviewer/topoviewer-embed.css",
  "assets/topoviewer/topoviewer-zensical.css",
]
extra_javascript = [
  "assets/topoviewer/topoviewer-embed.iife.js",
  "assets/topoviewer/topoviewer-zensical.js",
]
```

The minimal `topoviewer-zensical.js` adapter should be:

```js
function mountTopoViewerEmbeds() {
  window.TopoViewerEmbed?.mountAll?.();
}

if (window.document$?.subscribe) {
  window.document$.subscribe(mountTopoViewerEmbeds);
} else {
  window.addEventListener("DOMContentLoaded", mountTopoViewerEmbeds);
}
```

The existing embed bundle already prevents double-mounting through a `data-topoviewer-mounted` marker, so rerunning after navigation should be safe.

## Proposed Phase 2: Fence Authoring Without A Full Plugin

If we want Markdown authoring closer to MkDocs fenced blocks before Zensical has a stable module API, use Python Markdown's SuperFences custom fence support or a small Markdown extension.

Target authoring syntax:

````markdown
```topoviewer
topology: ../topoviewer/metro-topology.yaml
stylesheet: ../topoviewer/metro-stylesheet.yaml
height: 640px
title: Metro service path
controls: true
controlsOpen: false
```
````

Responsibilities:

- Parse the fence YAML.
- Render the same `<figure>` and `.topoviewer-embed` HTML contract used by Phase 1.
- Leave asset injection to documented `extra_css` and `extra_javascript`.

This phase is feasible if Zensical's Python Markdown extension configuration can load a project-local or packaged extension function. It should be treated as an authoring convenience, not the core integration.

## Proposed Phase 3: Native Zensical Package

When Zensical exposes stable module/plugin hooks, a dedicated package can match the MkDocs plugin more closely:

- Vendored TopoViewer embed assets.
- Markdown fence rewriting.
- Page-relative topology and stylesheet path resolution.
- Site asset injection.
- Optional theme CSS tuned for Zensical variables.
- Validation diagnostics for missing topology, invalid fence YAML, and unsupported options.

Package name options:

- `zensical-topoviewer`
- `topoviewer-zensical`

The package should not import TypeScript source, run npm during docs builds, or depend on React/Vite. It should vendor browser-ready assets the same way `mkdocs-topoviewer` does.

## Risks And Mitigations

### Relative Path Resolution

The MkDocs plugin rewrites page-relative source paths into URLs that work from the rendered page. A manual Zensical HTML embed will not do that for authors.

Mitigation:

- Document URL rules clearly in Phase 1.
- Prefer storing diagram YAML under a predictable docs-relative path such as `docs/topoviewer/<case>/`.
- Add a later fence adapter to centralize relative path handling.

### Instant Navigation

If Zensical uses instant navigation, initial page-load mounting is insufficient.

Mitigation:

- The Zensical adapter must subscribe to `document$` and call `mountAll()` after navigation.
- The embed bundle's mounted marker must remain idempotent.

### Asset Drift

MkDocs currently receives synced vendored assets during `npm run sync:mkdocs-assets`. Zensical would need an equivalent asset refresh story.

Mitigation:

- Add a script such as `sync:zensical-assets` only after a real Zensical example project exists.
- For Phase 1, document copying from `packages/topoviewer/dist/embed/`.

### Missing Plugin API

A direct port of `mkdocs-topoviewer` may fail if Zensical does not expose equivalent Python hooks.

Mitigation:

- Do not start with a full plugin.
- Use static assets plus `document$` first.
- Revisit a package after Zensical's module/component system is stable.

### Security

TopoViewer renders authored YAML and optional remote image references. A documentation host should treat diagrams as content, not code.

Mitigation:

- Keep YAML same-origin by default.
- Reuse TopoViewer validation and renderer limits.
- Keep the embed bundle's behavior data-driven through `data-*` attributes.
- Avoid arbitrary HTML execution inside topology or stylesheet files.

## Recommendation

Proceed with a Phase 1 Zensical static embed example before building a package.

Acceptance criteria for Phase 1:

- A minimal Zensical site loads `topoviewer-embed.css` and `topoviewer-embed.iife.js` through `extra_css` and `extra_javascript`.
- A Markdown page contains one `.topoviewer-embed` container that loads topology and stylesheet YAML from the docs tree.
- The adapter calls `window.TopoViewerEmbed.mountAll()` on initial load and on `document$` updates.
- The example works with light/dark theme variables, instant navigation, controls, and attention blocks.
- The same topology and stylesheet files validate through the existing TopoViewer schema and semantic checks.

Do not build `zensical-topoviewer` until either:

- A real Zensical project is available for local testing, or
- Zensical publishes stable module/plugin hooks that cover fence rewriting and asset generation.

## Sources

- TopoViewer MkDocs embed docs: `packages/topoviewer/docs/mkdocs.md`
- TopoViewer browser embed source: `packages/topoviewer/src/embed.tsx`
- MkDocs TopoViewer plugin source: `packages/mkdocs-topoviewer/mkdocs_topoviewer/plugin.py`
- Zensical customization docs: https://zensical.org/docs/customization/
- Zensical extension docs: https://zensical.org/docs/setup/extensions/
- Zensical code block docs: https://zensical.org/docs/authoring/code-blocks/
- Zensical repository: https://github.com/zensical/zensical
