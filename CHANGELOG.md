# Changelog

TopoViewer follows semantic versioning for public releases. The first public
release is `0.1.0`: an installable early-adopter release with honest pre-1.0
compatibility expectations. Reserve `1.0.0` for the later stable-core API-freeze
release.

## Unreleased

## 0.4.0 - 2026-07-22

This pre-1.0 minor release makes source ownership explicit, hardens the npm
package contract for real consumers, and reduces coupling between the core
renderer and TopoViewer Studio.

### Packages

- `topoviewer@0.4.0`
- `mkdocs-topoviewer==0.4.0`

TopoViewer Studio, the Grafana panel, and the VS Code host remain
repository-owned surfaces. Studio is Beta Preview; Grafana and VS Code remain
Experimental.

### Added

- Added the explicit `topoviewer/export` entry for PNG, SVG, and PDF export so
  applications can keep the heavier export implementation outside the initial
  renderer bundle.
- Added explicit ESM and CommonJS runtime artifacts and matching `.d.mts` and
  `.d.cts` declarations for the root, authoring, export, integration, and
  security entries.
- Added public authoring defaults and size resolvers for regions, shapes, and
  callouts.
- Added packed ESM, CommonJS, SSR, TypeScript, CSS/schema, and minimal Vite
  consumer gates across the supported Node and React compatibility matrix.

### Changed

- Enforced the canonical `0.2` source boundary: topology YAML owns identity,
  relationships, positions, labels, and data; stylesheet YAML owns persistent
  appearance. Canonical topology objects no longer accept generic `name`,
  generic `label`, inline `style`, object-level `icon`, or other visual fields.
- Unified Studio node-layout authoring so normal and card layouts expose the
  same schema-derived appearance controls.
- Moved Studio from source aliases and broad controller props to public package
  entries, feature capabilities, and narrow immutable canvas model/action
  contracts.
- Split optional Studio workspaces from first paint and enabled native viewport
  culling for authoring canvases with at least 100 nodes or 250 links.
- Broadened the packed core consumer contract to Node.js 22.12 and later, with
  required Node 22.12, 24, and 26 plus React 18.3 and 19.2 compatibility lanes.

### Fixed

- Kept position-only drag updates out of full document and canvas rebuild
  paths.
- Kept large mapper sample input outside root React state while preserving
  worker analysis and mapper-rule proposal workflows.
- Updated vulnerable DOMPurify and `fast-uri` dependency paths.

### Compatibility And Upgrade Notes

- Migrate unversioned or `0.1` bundles that contain legacy names or inline
  appearance before editing them as canonical `0.2` sources. From a repository
  checkout, run:

  ```bash
  npm run migrate:identity -- --write path/to/topology.yaml
  ```

  The migration moves visible aliases to `labels.name`, moves appearance into
  exact-ID stylesheet rules, and reports conflicts rather than choosing an
  owner silently. Package consumers can use the supported
  `migrateTopoBundle` export for the same split-file migration.
- Existing root export functions remain as lazy asynchronous compatibility
  wrappers. New code should import image and PDF helpers from
  `topoviewer/export`.
- The React package and MkDocs plugin remain Supported. Browser Studio remains
  Beta Preview; Grafana and the VS Code host remain Experimental.
- Monaco remains lazy-loaded, but the Studio initial and editor bundles remain
  tracked size constraints.

### Verification

- Required gates cover schema and semantic validation, API reports, npm package
  lint and type resolution, packed consumers, Studio packed-core builds,
  bundle budgets, browser authoring journeys, visual snapshots, accessibility,
  security checks, and cross-browser/VS Code parity.

## 0.3.2 - 2026-07-20

This patch release hardens TopoViewer Studio for its Beta Preview and fixes
authoring regressions without deliberately changing the supported renderer API
or topology and stylesheet schema contracts.

### Packages

- `topoviewer@0.3.2`
- `mkdocs-topoviewer==0.3.2`

### Added

- Portable built-in SVG icon authoring with a visual Studio picker. Authored
  icon declarations remain in the stylesheet bundle instead of depending on
  Studio-only runtime state.
- Production-build browser coverage, deployed-route smoke checks, and bounded
  performance gates for the Browser Studio release lane.

### Changed

- Defined the Browser Studio as a Beta Preview for current desktop Chrome and
  Edge. Studio internals, browser storage, and the VS Code host remain outside
  the supported public API contract.
- Materialized safe SVG color tokens from authored icon and node colors so icon
  previews and rendered nodes use the same portable stylesheet policy.

### Fixed

- Preserved an explicit empty `labels.name` value so removing a visible label
  no longer falls back to displaying the canonical object ID.
- Kept canonical IDs available to assistive technology when a visual label is
  intentionally hidden.
- Preserved controlled React Flow selection across runtime rebuilds and native
  keyboard selection workflows.
- Prevented stale viewport preference hydration from overwriting a user's first
  interaction.
- Rejected unsafe SVG color-token values while allowing authored background
  colors to update built-in icons consistently.

### Compatibility And Upgrade Notes

- Existing `0.3.1` topology, stylesheet, and mapper bundles remain valid.
- Omitting `labels.name` still falls back to the canonical object ID. Only an
  explicitly empty alias hides the visual label.
- The React package and MkDocs plugin remain supported. Browser Studio is Beta
  Preview; Grafana and the VS Code host remain experimental.
- Monaco remains lazy-loaded, but the Studio main and editor chunks are still
  large and remain a tracked performance limitation.

## 0.3.1 - 2026-07-20

This patch release hardens the authoring and documentation release path after
`0.3.0`. It does not intentionally change the supported renderer API or the
topology and stylesheet schema contracts.

### Packages

- `topoviewer@0.3.1`
- `mkdocs-topoviewer==0.3.1`

### Added

- Deterministic Playwright capture for every raster image used by the README
  and documentation across Studio Visual, Studio Code, MkDocs, Zensical, and
  the Grafana panel.
- A generated screenshot manifest that binds each image to the release version,
  canonical `st-clos` source hashes, capture scenario, dimensions, and digest.
- npm and PyPI publication gates that regenerate documentation media, reject
  drift, and upload the generated files when review is required.

### Changed

- Made TopoViewer Studio the sole maintained authoring application and removed
  the duplicate legacy authoring implementation, active documentation, CI
  lane, and package dependencies. The historical authoring URL remains a
  tested compatibility redirect to Studio.
- Updated the README and maintained documentation to present one canonical
  topology in dark mode across Studio, MkDocs, Zensical, and Grafana.
- Renamed internal Grafana demo-fixture ownership so current product code no
  longer depends on terminology from the retired authoring application.

### Fixed

- Deduplicated Studio canvas selection and made selection equality independent
  of callback order, preventing mixed-object selection feedback from entering a
  React update loop.
- Made release screenshot verification compare reviewed pixels with a bounded
  visual tolerance so harmless operating-system rasterization differences do
  not block npm and PyPI publication.

### Compatibility And Upgrade Notes

- Existing `0.3.0` topology, stylesheet, and mapper bundles remain valid.
- The public `topoviewer` and `mkdocs-topoviewer` support status is unchanged.
- Studio, Grafana, and the VS Code host remain experimental surfaces.
- Maintainers need Docker for the release screenshot gate because it captures
  the real panel in a pinned Grafana container; end users do not need Docker to
  use the renderer or MkDocs plugin.

## 0.3.0 - 2026-07-19

Third early-adopter release after `0.2.0`. This is a minor pre-1.0 release
because it adds substantial authoring APIs and an experimental Studio workflow
while preserving the supported renderer and MkDocs installation paths.

### Packages

- `topoviewer@0.3.0`
- `mkdocs-topoviewer==0.3.0`

TopoViewer Studio, the Grafana panel, and the VS Code host remain experimental
repository surfaces. They are version-aligned for testing but are not separate
public package claims in this release.

### Highlights

- Author portable topology bundles in the experimental TopoViewer Studio with
  canvas-first object creation, direct manipulation, Visual and Code editing,
  project recovery, and deployable exports.
- Reuse the same topology, stylesheet, and optional mapper across React,
  MkDocs, static documentation, Grafana, and repository workflows.
- Build richer authoring products through expanded `topoviewer/authoring` APIs
  for identity, style candidates, selection context, and graph mutations.
- Expand and collapse parallel link groups reversibly while preserving
  individual link identity and selection.

### Added

- Experimental Studio project lifecycle with browser persistence, recovery,
  portable `.tvstudio` archives, project search, rename, duplicate, export, and
  destructive-action confirmation.
- Canvas authoring for nodes, links, paths, regions, shapes, callouts, and text,
  including lasso selection, group movement, alignment, distribution, resize,
  presets, and Format Painter.
- Visual and YAML stylesheet candidate workflow with schema-derived controls,
  normalization review, diagnostics, undo, and explicit apply or revert.
- Visual and Code mapper workspace with local sample ingestion, rule proposals,
  coverage analysis, and bounded worker execution.
- PNG, SVG, documentation-bundle, and Grafana mounted-bundle export paths with
  readiness checks and deterministic artifact names.
- Experimental VS Code Studio host, presentation mode, and GitHub Pages Studio
  preview route.

### Changed

- Adopted canonical object identity in Studio so renames update known topology,
  style, mapper, path, region, and link references together.
- Moved Studio controls onto MUI-owned theme, typography, spacing, and control
  contracts while keeping Monaco and React Flow as explicit integration
  boundaries.
- Made annotations open by default in the Object Palette and improved node,
  edge, annotation, toolbar, and project-management presentation.
- Kept runtime topology facts separate from stylesheet policy; Studio-created
  link curvature and object appearance are emitted as stylesheet rules.

### Fixed

- Stabilized dense node and region dragging, committed positions, helper-line
  interaction, and straight parallel-link endpoint anchoring.
- Cleaned exact-ID stylesheet rules when their objects are deleted or cut.
- Preserved keyboard selection when delayed React Flow selection callbacks
  report stale state.
- Improved forced-color edge-label readability and accessible project,
  export, dialog, keyboard, and multi-selection workflows.

### Compatibility And Upgrade Notes

- `0.3.0` remains pre-1.0 early-adopter software. The public React renderer and
  MkDocs plugin are supported; Studio, Grafana, and VS Code remain
  experimental.
- No deliberate breaking change was made to existing `0.2.0` topology or
  stylesheet YAML. Existing `name` fields remain readable.
- New authoring APIs are additive but pre-1.0. Consumers should import them from
  `topoviewer/authoring` rather than internal package paths.
- Studio uses a canonical writable object ID and optional `labels.name` for a
  duplicate visible label. Review generated diffs when migrating older Studio
  projects.
- Monaco remains lazy-loaded, but the Studio main and editor chunks are still
  large and remain a tracked performance limitation.

### Validation

The release is gated by local and remote runs of:

- `npm run ci`
- `npm run install:check`
- `npm run api:check`
- `npm run artifact:check:package`
- `npm run dependency:advisories`
- `npm run dist:mkdocs`
- `npm run inspect:mkdocs`
- npm and PyPI Trusted Publishing dry runs

## 0.2.0 - 2026-07-09

Second early-adopter release after `0.1.0`. This is a minor pre-1.0 release
because it adds new user-facing authoring, styling, layout, documentation, and
package-release capabilities.

### Packages

- `topoviewer@0.2.0`
- `mkdocs-topoviewer==0.2.0`

### Highlights

- Create and edit topology objects directly from the browser authoring canvas.
- Align objects with helper lines and snap behavior during canvas authoring.
- Style richer infrastructure nodes with additive nested `nodeLayout` card
  settings.
- Improve source and target endpoint labels for dense link-heavy diagrams.
- Use a clearer examples/use-cases documentation structure for practical
  adoption paths.

### Added

- Canvas-native graph authoring for creating and editing nodes,
  links, paths, regions, shapes, and callouts from the viewport.
- Drag helper lines, snap behavior, and viewport settings controls shared by
  package-level surfaces.
- Nested `nodeLayout` card styling for richer infrastructure-style nodes while
  preserving existing flat style keys.
- Endpoint label styling and automatic placement for link source and target
  labels.
- Global label collision behavior for dense topology views.
- Single-page HTML embed use case and expanded use-case documentation for
  React, MkDocs, Zensical/static HTML, Kubernetes service maps, service
  provider networks, and Grafana TopoViewer workflows.

### Changed

- Reworked docs navigation and physical content structure so user-facing
  examples and use cases are easier to scan.
- Consolidated example content into the canonical content tree before generated
  docs are synced.
- Improved canvas drag behavior so live movement stays smooth and document
  writes are deferred to safer commit points.
- Updated the public `topoviewer` npm package and `mkdocs-topoviewer` PyPI
  package release train to `0.2.0`.

### Fixed

- Prevented canvas graph-authoring shortcuts from firing while the YAML editor,
  forms, or Monaco controls have focus.
- Fixed new-topology authoring behavior where newly added nodes could repel,
  jitter, or lose committed positions.
- Tightened graph-semantic authoring checks so path creation respects existing
  link reachability.
- Fixed release-prep checks that previously hard-coded `0.1.0` tarball and
  wheel versions.

### Compatibility And Upgrade Notes

- `0.2.0` remains pre-1.0 early-adopter software. Supported public surfaces are
  installable, documented, and CI-gated, but the stable-core API freeze remains
  reserved for `1.0.0`.
- No known breaking changes from `0.1.0`.
- Existing flat stylesheet keys remain supported.
- Nested `nodeLayout` card styling is additive.
- Existing public install commands remain:

```bash
npm install topoviewer @xyflow/react react react-dom
pip install mkdocs-topoviewer
```

### Validation

Release-prep validation passed locally:

- `npm run check:content`
- `npm run docs:lint`
- `npm run install:check`
- `npm run pack:check`
- `npm run api:check`
- `npm run artifact:check:package`
- `npm run dependency:advisories`
- `npm run wheel:mkdocs`
- `npm run inspect:wheel`
- `npm run ci:package`
- `npm ls topoviewer --workspaces`

## 0.1.0 - 2026-07-01

### Added

- First public `topoviewer` npm package with React renderer, schemas,
  validation helpers, stylesheet keys, examples, and MkDocs embed behavior.
- Production-shaped monorepo with separate `topoviewer` npm package and `mkdocs-topoviewer` Python package.
- React renderer package exports, embeddable browser bundle, and schema package exports.
- MkDocs fenced-block plugin with vendored frontend assets.
- Canonical examples catalog under `packages/topoviewer/content/examples`.
- Generated MkDocs reference pages for graph, edge, path, region, shape, callout, styling, layout, validation, and integration examples.
- JSON Schema validation for topology, stylesheet, MkDocs block, example catalog, generated manifest, and expected test fixtures.
- Semantic lint for graph meaning, unsafe references, model limits, and common authoring mistakes.
- Playwright tests for workbench behavior, documented examples, child nodes, draggable regions, parent link pipes, stitched paths, and visual regression.
- CI workflow for install, schema validation, semantic lint, build, Playwright, npm package dry-run, MkDocs wheel build, wheel inspection, and MkDocs site build.
- GitHub Pages workflow for publishing generated MkDocs documentation.
- Manual npm release workflow using npm Trusted Publishing with GitHub Actions OIDC.

### Changed

- Moved from prototype layout to production monorepo layout:
  - `packages/topoviewer`
  - `packages/mkdocs-topoviewer`
- Changed default generated documentation root from the temporary RTFM tree to the monorepo `docs/` directory.
- Updated README and React docs to use the live npm install command:
  `npm install topoviewer @xyflow/react react react-dom`.

### Security

- Documented the security boundary for Markdown, SVG, image references, and untrusted diagram content.
