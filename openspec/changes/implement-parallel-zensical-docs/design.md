# Design

## Context

The original feasibility study concluded that Zensical support is practical as a
static embed integration. The current TopoViewer browser embed already exposes
the required runtime behavior:

- `topoviewer-embed.css` styles the figure and viewer shell.
- `topoviewer-embed.iife.js` fetches YAML and mounts every
  `.topoviewer-embed` element.
- The bundle is idempotent through its mounted marker, so it can be called after
  client-side navigation.

Official Zensical documentation confirms the minimum integration surface needed
for Phase 1: Zensical supports `zensical build`, `zensical serve`,
`extra_css`, `extra_javascript`, and a `document$` observable for rerunning
custom JavaScript after page updates.

## Deployment Model

GitHub Pages must publish both documentation targets from a single artifact:

```text
site/
  index.html                  # MkDocs root site
  topoviewer/
    ...
  zensical/
    index.html                # Zensical site base
    assets/
      topoviewer/
        topoviewer-embed.css
        topoviewer-embed.iife.js
        topoviewer-zensical.js
```

MkDocs remains the canonical root at `https://asadarafat.github.io/topoViewer/`.
Zensical publishes under `https://asadarafat.github.io/topoViewer/zensical/`.

This preserves existing links and allows a direct side-by-side comparison.

## Repository Shape

Add a separate Zensical source tree, but keep only Zensical-specific landing and
adapter pages handwritten. TopoViewer reference content is generated from
`docs/topoviewer/`:

```text
docs-zensical/
  index.md
  examples/
    topoviewer.md
  topoviewer/                    # generated from docs/topoviewer
  assets/
    topoviewer/
      topoviewer-zensical.js
      topoviewer-zensical.css
      examples/
        ...                      # copied from docs/topoviewer/examples
zensical.toml
```

The generator also updates the `zensical.toml` nav block from the MkDocs nav
subset so the public Zensical information architecture tracks the current
MkDocs structure.

Build artifacts stay out of git:

- MkDocs output: `site/`
- Zensical temporary or direct output: `site/zensical/`
- Zensical mirrored TopoViewer docs: `docs-zensical/topoviewer/`
- Zensical copied example assets: `docs-zensical/assets/topoviewer/examples/`
- Python environments: `.venv*`

## Asset Sync

The Zensical site should not depend on `packages/topoviewer/dist/` being
checked in. Add scripts that:

1. Runs after `npm run build`.
2. Copies `packages/topoviewer/dist/embed/topoviewer-embed.css` to
   `docs-zensical/assets/topoviewer/topoviewer-embed.css`.
3. Copies `packages/topoviewer/dist/embed/topoviewer-embed.iife.js` to
   `docs-zensical/assets/topoviewer/topoviewer-embed.iife.js`.
4. Copies `docs/topoviewer/examples/**` to
   `docs-zensical/assets/topoviewer/examples/**`.
5. Copies/adapts Markdown pages from `docs/topoviewer/**` into
   `docs-zensical/topoviewer/**`.

The adapter files are authored source and remain in `docs-zensical/assets`.

## Zensical Adapter

The adapter should stay minimal:

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

This handles both initial page load and Zensical instant navigation without
making the TopoViewer bundle aware of Zensical.

## Local Scripts

Add root scripts:

- `sync:zensical-assets` - copy built TopoViewer embed assets into
  `docs-zensical/assets/topoviewer/`.
- `sync:zensical-docs` - generate mirrored Zensical TopoViewer docs from
  `docs/topoviewer/`, expand snippets, copy example assets, and update the
  Zensical nav block.
- `zensical:build` - install or use Zensical, sync assets, and build to
  `site/zensical`.
- `zensical:serve` - serve the Zensical project locally, preferably on a port
  that does not conflict with MkDocs, such as 8002.
- `docs:build:parallel` - build MkDocs and Zensical into the combined Pages
  artifact.

Keep the existing `docs:build` behavior focused on MkDocs unless we deliberately
decide to make parallel docs the default local build.

## GitHub Actions

Update the docs workflow:

1. Install Zensical alongside MkDocs dependencies.
2. Build TopoViewer and sync MkDocs assets.
3. Generate MkDocs documentation sources.
4. Build MkDocs into `site/`.
5. Build Zensical into `site/zensical/`.
6. Upload `site/` through `actions/upload-pages-artifact`.

Update CI with the same Zensical build check, but keep deployment only in the
docs workflow.

## Authoring Contract

Mirrored pages keep MkDocs as the authoring source but generate explicit HTML
embeds for Zensical. A source page can continue to use:

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

The Zensical sync rewrites that fence into:

```html
<figure class="topoviewer-figure" style="--topoviewer-width: 100%;">
  <figcaption class="topoviewer-title">Object focus</figcaption>
  <div
    class="topoviewer-embed"
    data-topology="../../../../assets/topoviewer/examples/attention/object-focus/topology.yaml"
    data-stylesheet="../../../../assets/topoviewer/examples/attention/object-focus/stylesheet.yaml"
    data-controls="true"
    data-controls-open="false"
    style="height: 420px"
  ></div>
</figure>
```

The generator only rewrites fences whose topology and stylesheet paths resolve
to canonical example files. Documentation pages that intentionally show a
`topoviewer` fence as literal Markdown keep that fence unchanged.

Snippet directives are expanded during generation so Zensical pages do not
depend on Pymdown Snippets to display full topology and stylesheet YAML.

## Risks

### URL Prefix Drift

Zensical must be configured for the `/topoViewer/zensical/` base path. If the
base URL is wrong, assets and navigation may work locally but fail on GitHub
Pages.

Mitigation: local build tests should inspect built HTML for the expected asset
paths and run an HTTP preview from the same subpath shape where practical.

### Asset Drift

The Zensical copy of the embed bundle can become stale.

Mitigation: never hand-edit copied embed assets. Always regenerate from
`packages/topoviewer/dist/embed/` after `npm run build`.

### Divergent Documentation

Two public doc targets can confuse users if they diverge in scope.

Mitigation: keep `docs/topoviewer/` as the source of truth, generate mirrored
Zensical pages from that tree, and keep only Zensical-specific adapter pages
handwritten.

## Sources

- Prior feasibility study: `feasibility.md`
- Zensical create/build/serve docs: https://zensical.org/docs/create-your-site/
- Zensical customization docs for `extra_css`, `extra_javascript`, and
  `document$`: https://zensical.org/docs/customization/
- Zensical basics docs for `dev_addr`: https://zensical.org/docs/setup/basics/
