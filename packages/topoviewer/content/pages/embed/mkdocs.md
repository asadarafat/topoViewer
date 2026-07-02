# MkDocs

**Support status:** Supported

TopoViewer ships a browser embed bundle in:

- `topoviewer/embed/topoviewer-embed.iife.js`
- `topoviewer/embed/topoviewer-embed.css`

Install the MkDocs adapter from PyPI:

```bash
pip install mkdocs-topoviewer
```

Enable the plugin:

```yaml
plugins:
  - search
  - topoviewer
```

## Markdown Authoring

````markdown
```topoviewer
topology: ./topoviewer-topo.yaml
stylesheet: ./topoviewer-style.yaml
height: 640px
title: MV network SR-TE service path
controls: true
controlsOpen: false
selectedLayerIds: [underlay]
```
````

The fenced-block options are covered by `schemas/topoviewer-mkdocs-block.schema.json`. Keep the block small; detailed topology and styling belong in external YAML files.

Options:

| Option | Use |
|---|---|
| `topology` | Required path to topology YAML, relative to the Markdown file. |
| `stylesheet` | Optional path to stylesheet YAML, relative to the Markdown file. |
| `height` | CSS height for the viewport. |
| `width` | Optional CSS width. Defaults to the available content width. |
| `title` | Optional caption/title. |
| `controls` | Show layer/display controls. Defaults to `true`. |
| `controlsOpen` | Open controls panel initially. Defaults to `false`. |
| `selectedLayerIds` | Initial checked layer IDs for this embed. Defaults to all graph layers. |
| `attention` | Optional runtime attention override for this specific rendered viewport. |

## Attention Blocks

The topology file can include a top-level `attention:` block for its default view. The fenced block can also pass runtime attention state when this specific rendered view should override the topology default.

Object focus:

```yaml
topology: ./topology.yaml
stylesheet: ./stylesheet.yaml
attention:
  query:
    pathIds: [critical-path]
    mode: dim-context
```

Change focus:

```yaml
topology: ./topology.yaml
stylesheet: ./stylesheet.yaml
attention:
  query:
    changes:
      since: "2026-06-10T00:00:00Z"
    mode: dim-context
```

Collapsed region:

```yaml
topology: ./topology.yaml
stylesheet: ./stylesheet.yaml
attention:
  aggregate:
    groups:
      - id: access-metro
        by: region
        regionId: access-metro
        label: Access metro
    expandOnClick: true
```

See [Topology attention](../author/attention.md) for the complete attention block reference, [Authoring for attention](../author/authoring-model.md#authoring-for-attention) for what to declare in topology YAML, and [Attention examples](../reference/attention/index.md) for live examples with topology and stylesheet source.

## Asset Sync

From the repository root:

```bash
npm run build
npm run sync:mkdocs
```

This copies the built embed files into the sibling Python package:

```text
../mkdocs-topoviewer/mkdocs_topoviewer/assets/
```

It also syncs canonical feature examples from `packages/topoviewer/content/examples/` into the configured MkDocs docs tree. The default target is this repository's `docs/` tree. Override it with `--docs-root` or `TOPOVIEWER_DOCS_ROOT` when syncing into another MkDocs workspace:

```text
TOPOVIEWER_DOCS_ROOT=../my-mkdocs-site/docs npm run sync:mkdocs
```

Use `--docs-root` when generating docs somewhere else:

```bash
node scripts/sync-examples.mjs --docs-root ./docs
```

Run `npm run sync:mkdocs-assets` when only the embed bundle changed, or `npm run sync:docs` when content pages, example YAML, README prose, internal expected assertions, or generated docs pages changed. Run `npm run check:examples` in CI to verify the generated docs files have not drifted from `packages/topoviewer/content/**`. The internal `expected.yaml` files stay in the package example projection and are not published as MkDocs or Zensical page tabs.

## MkDocs Plugin Behavior

The plugin:

- Rewrites fenced `topoviewer` blocks into `<div class="topoviewer-embed topoviewer-parity-theme">` containers.
- Resolves topology and stylesheet files relative to the Markdown page.
- Injects the embed CSS and JavaScript.
- Uses the canonical TopoViewer viewport theme so rendered diagrams match the browser harness, MkDocs, and Zensical surfaces.

If the topology or stylesheet YAML cannot be loaded, the embed renders a visible error block instead of failing silently.

## Direct HTML Embed

For non-MkDocs pages, include the bundle and add a container:

```html
<link rel="stylesheet" href="/assets/topoviewer/topoviewer-embed.css">
<script defer src="/assets/topoviewer/topoviewer-embed.iife.js"></script>

<div
  class="topoviewer-embed topoviewer-parity-theme"
  data-topology="/diagrams/topology.yaml"
  data-stylesheet="/diagrams/stylesheet.yaml"
  data-controls="true"
  style="height: 640px"
></div>
```

The bundle mounts all `.topoviewer-embed` containers on page load. If content is injected after page load, call:

```js
window.TopoViewerEmbed.mountAll();
```
