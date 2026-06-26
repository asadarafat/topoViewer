# Design

## Source Ownership

The canonical content tree is:

```text
packages/topoviewer/content/
```

Only this tree is manually edited for product docs, reference prose, example
README files, topology YAML, stylesheet YAML, expected test metadata, and
catalog metadata.

The current package docs/examples paths become generated compatibility
projections:

```text
packages/topoviewer/docs/              # generated from content/pages
packages/topoviewer/examples/          # generated from content/examples
```

Keeping these projections initially reduces migration risk because existing
tests, package files, sync scripts, and tarball contents already know those
paths. The source contract still changes: edits must start in `content/**`,
then the projections are regenerated.

## Content Shape

Recommended source layout:

```text
packages/topoviewer/content/
  pages/
    _fragments/
      product-positioning.md
      integration-surfaces.md
    attention.md
    authoring.md
    integration-roadmap.md
    mkdocs.md
    monorepo.md
    production.md
    react.md
    real-network-demo.md
    reference-model.md
    release.md
    schemas.md
    stylesheet.md
    why-topoviewer.md
    zensical.md

  examples/
    catalog.yaml
    graph/
      basic/
        README.md
        topology.yaml
        stylesheet.yaml
        expected.yaml
    integration/
      real-network-underlay/
        README.md
        topology.yaml
        stylesheet.yaml
        expected.yaml
    _shared/
      attention-region-style.yaml
```

`content/examples/catalog.yaml` remains the driver for generated reference
pages and example projections. The catalog should support entries whose public
page/title differ from their source fixture so the same canonical YAML can
serve more than one public narrative when that is intentional.

## Product Positioning Source

TopoViewer's product position should be authored once under:

```text
packages/topoviewer/content/pages/_fragments/product-positioning.md
```

That fragment should define the canonical wording for:

- what TopoViewer is;
- what problem it solves;
- what "Topology as Code" means in this project;
- how TopoViewer differs from broad diagram-as-code tools such as Mermaid.js;
- which surfaces are supported today;
- which integrations are roadmap, planned, or experimental.

The root `README.md`, root `docs/index.md`, `why-topoviewer.md`, and other
product entry pages should compose this fragment rather than restating the same
message independently.

### Canonical Product Position

TopoViewer should position itself as "Topology as Code":

```text
Declarative topology diagrams and graphs for network, infrastructure, and
service views, authored as YAML topology facts plus selector-based visual
stylesheets, rendered through an embeddable TypeScript/React runtime.
```

In this positioning, "topology" means a diagram or graph that represents
network, infrastructure, service, or similarly connected systems. The topology
is declarative: objects, links, paths, regions, layers, labels, data, attention,
and style policy are described as code instead of being hand-drawn.

### Difference From Mermaid.js

TopoViewer should not position itself as a generic replacement for Mermaid.js.
The distinction should be explicit:

- Mermaid.js is a broad text-to-diagram tool for many diagram types.
- TopoViewer is a semantic topology renderer and library for data-driven,
  inspectable, embeddable topology views.
- TopoViewer's differentiators are topology YAML, selector stylesheets, layers,
  regions, paths, attention/focus behavior, reusable examples, TypeScript APIs,
  and product/plugin embedding.

This avoids a vague "diagram as code" pitch. The project is specifically about
topology as code for connected environments where graph semantics and
operational context matter.

### Integration Surface Messaging

The product-positioning fragment should separate supported surfaces from
roadmap surfaces:

- `topoviewer` npm package: supported TypeScript/React library surface for
  embedding TopoViewer inside end products.
- MkDocs: supported documentation embed surface for live YAML examples.
- Zensical: supported or parallel documentation embed surface, depending on the
  release wording used at implementation time.
- Browser harness: authoring and preview surface for examples, demos, and online
  validation, including a future GitHub Pages hosted authoring experience if
  deliberately published.
- VS Code extension: roadmap/experimental authoring surface that should detect
  TopoViewer YAML files from the VS Code Explorer, preview them, validate them,
  and support authoring workflows.
- NetBox plugin: roadmap network-topology visualizer that derives TopoViewer
  topology from NetBox inventory/raw data and embeds the view inside NetBox.
- OpsMill/Infrahub plugin: roadmap network-topology visualizer that derives
  TopoViewer topology from OpsMill/Infrahub topology/inventory data and embeds
  the view inside that platform.
- Grafana integration: roadmap operational dashboard surface, if retained by
  the standalone Grafana integration OpenSpec.

Public pages should not mark roadmap integrations as supported until an
implementation exists and the corresponding OpenSpec is archived.

## Deduplication Rules

### Full Example Alias

If two public examples use the same topology, stylesheet, and expected metadata,
the catalog should express one canonical fixture and one alias entry. This
applies to the current duplicate pair:

```text
integration/yaml-to-network-diagram
integration/real-network-underlay
```

Either:

1. keep `real-network-underlay` as the canonical fixture and make
   `yaml-to-network-diagram` a catalog/page alias that points to the same
   fixture; or
2. make `yaml-to-network-diagram` a genuinely distinct, smaller before/after
   product example.

Do not keep two identical canonical fixture directories.

### Shared Stylesheet Asset

If examples differ in topology but share identical styling, the canonical
content tree may use a shared stylesheet asset and let the projection generator
materialize example-local `stylesheet.yaml` files if current public/docs paths
expect them.

This applies to the current duplicate pair:

```text
attention/region-collapse/stylesheet.yaml
attention/region-focus/stylesheet.yaml
```

The generated projection may still copy the shared stylesheet into both
example folders for simple embeds and package compatibility. The source should
not require editing two identical files.

### Expected Metadata

Identical `expected.yaml` files are acceptable when the assertions are truly the
same. They are internal test metadata. The deduplication target is primarily
authored public content and authored topology/stylesheet YAML.

## Projection Pipeline

Add or refactor a content sync command, for example:

```text
npm run sync:content
npm run check:content
```

The pipeline should:

1. read `packages/topoviewer/content/pages/**`;
2. generate `packages/topoviewer/docs/**`;
3. read `packages/topoviewer/content/examples/**`;
4. generate `packages/topoviewer/examples/**`;
5. generate or validate `docs/topoviewer/**`;
6. generate or validate `.artifacts/zensical-docs/**` during Zensical builds;
7. fail in check mode when generated files are stale.

Existing commands may remain as wrappers if that avoids churn:

```text
npm run sync:docs
npm run check:examples
npm run validate:schemas
```

The important implementation detail is that their source input becomes
`packages/topoviewer/content/**`.

## CI Contract

CI must enforce the edit-only boundary:

- generated projections are up to date;
- no generated docs/examples are modified without matching content source
  changes;
- docs examples, package examples, MkDocs, and Zensical all derive from the same
  catalog and source files;
- `expected.yaml` remains internal and is not surfaced as a public docs tab.

A lightweight validation script can scan diffs or file hashes to catch stale
projections. It should avoid brittle checks against build artifacts such as
`site/` or `.artifacts/`.

## Migration Strategy

### Phase 1: Introduce content root

- Create `packages/topoviewer/content/pages` from `packages/topoviewer/docs`.
- Create `packages/topoviewer/content/examples` from
  `packages/topoviewer/examples/test-cases` and stress examples.
- Move `catalog.yaml` under `content/examples`.
- Add sync/check commands that regenerate the old package paths.

### Phase 2: Remove canonical duplication

- Convert the `yaml-to-network-diagram` / `real-network-underlay` duplicate into
  either a catalog alias or a genuinely different example.
- Convert the duplicated region attention stylesheet into a shared source asset
  or deliberately accept it with an explanation in catalog metadata.
- Keep generated package/docs projections stable.

### Phase 3: Switch readers to content

- Update tests and generators to read from `content/**` directly where
  practical.
- Keep projections only where public docs, npm packaging, or compatibility need
  concrete files.

### Phase 4: Document contributor workflow

Document that contributors edit:

```text
packages/topoviewer/content/**
```

Then run:

```text
npm run sync:content
npm run ci
```

## Risks

### Migration churn

Changing paths touches many scripts and tests. Use generated compatibility
projections to avoid changing every consumer in one patch.

### Alias confusion

Catalog aliases can hide where YAML actually lives. Keep alias metadata explicit
and generated pages should still link users to the public example they opened,
not an unrelated folder name.

### Package compatibility

The npm package currently includes `docs` and `examples`. Preserve those paths
as generated package content until a separate release decision says otherwise.
