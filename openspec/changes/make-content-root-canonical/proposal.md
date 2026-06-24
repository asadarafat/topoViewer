# Make TopoViewer Content Root Canonical

## Why

TopoViewer currently has the right content idea but the wrong long-term
editing boundary:

- `packages/topoviewer/docs/**` is the conceptual documentation source;
- `packages/topoviewer/examples/**` is the conceptual example source;
- `docs/topoviewer/**` is the MkDocs public projection;
- `.artifacts/zensical-docs/**` is the Zensical projection;
- `packages/topoviewer/docs/**` and `packages/topoviewer/examples/**` are also
  packaged into the npm tarball.

This is workable, but it leaves contributors with two canonical-looking source
trees inside the package. It also already contains real internal duplication:

- `integration/yaml-to-network-diagram` and `integration/real-network-underlay`
  have identical topology, stylesheet, and expected YAML;
- `attention/region-collapse` and `attention/region-focus` have identical
  stylesheet YAML;
- some expected metadata files are identical by coincidence.

There is also a product-messaging drift risk. `README.md`, `docs/index.md`,
`why-topoviewer.md`, `real-network-demo.md`, and integration-roadmap pages can
each restate what TopoViewer is. If those pages are edited independently, the
project can lose a clear position.

The project should have one source-of-truth content root. Everything else
should be generated, synced, or packaged from that root.

## What Changes

Introduce `packages/topoviewer/content/**` as the only editable content root:

```text
packages/topoviewer/content/
  pages/
    _fragments/
      product-positioning.md
      integration-surfaces.md
    why-topoviewer.md
    authoring.md
    stylesheet.md
    react.md
    mkdocs.md
    zensical.md
    ...
  examples/
    catalog.yaml
    graph/basic/
      README.md
      topology.yaml
      stylesheet.yaml
      expected.yaml
    integration/real-network-underlay/
      README.md
      topology.yaml
      stylesheet.yaml
      expected.yaml
    _shared/
      ...
```

Then generate all public and package projections from that root:

- root `README.md`
- root `docs/index.md`
- `packages/topoviewer/docs/**`
- `packages/topoviewer/examples/**`
- `docs/topoviewer/**`
- `.artifacts/zensical-docs/**`
- npm package docs/examples content

## Capabilities

### New Capabilities

- `canonical-content-source`: one editable content root for TopoViewer pages,
  examples, catalog metadata, and shared example assets.
- `canonical-product-positioning`: one product-message source for the README,
  docs home, Why TopoViewer page, and integration direction.
- `content-projection-sync`: generated compatibility projections for package
  docs/examples, MkDocs, Zensical, and npm packaging.
- `content-deduplication-contract`: catalog-level aliasing and shared assets so
  repeated examples do not require duplicate canonical YAML files.

## Impact

- `scripts/sync-docs-site.mjs` should read from
  `packages/topoviewer/content/pages` instead of `packages/topoviewer/docs`.
- root `README.md` and `docs/index.md` should be generated or composed from
  `packages/topoviewer/content/pages/_fragments/product-positioning.md`.
- `packages/topoviewer/scripts/sync-examples.mjs` should read from
  `packages/topoviewer/content/examples` instead of
  `packages/topoviewer/examples/test-cases`.
- Existing generated package paths may remain for compatibility, but they
  should be treated as generated output and checked by CI.
- MkDocs and Zensical generation should continue to publish the same public URL
  shape.
- Package tarball contents should remain stable unless a separate release plan
  deliberately changes public package paths.

## Non-Goals

- Do not change TopoViewer YAML schema semantics.
- Do not remove MkDocs or Zensical support.
- Do not require authors to edit generated `docs/topoviewer/**`.
- Do not break existing public docs URLs.
- Do not depend on filesystem symlinks for generated projections; use
  deterministic copy/generation so the workflow is portable across CI,
  package publishing, and local development.
