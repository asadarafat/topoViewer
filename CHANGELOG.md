# Changelog

TopoViewer follows semantic versioning for public releases. The first public
release is `0.1.0`: an installable early-adopter release with honest pre-1.0
compatibility expectations. Reserve `1.0.0` for the later stable-core API-freeze
release.

## 0.2.0 - 2026-07-09

Second early-adopter release after `0.1.0`. This is a minor pre-1.0 release
because it adds new user-facing authoring, styling, layout, documentation, and
package-release capabilities.

### Packages

- `topoviewer@0.2.0`
- `mkdocs-topoviewer==0.2.0`

### Highlights

- Create and edit topology objects directly from the Browser Harness viewport.
- Align objects with helper lines and snap behavior during canvas authoring.
- Style richer infrastructure nodes with additive nested `nodeLayout` card
  settings.
- Improve source and target endpoint labels for dense link-heavy diagrams.
- Use a clearer examples/use-cases documentation structure for practical
  adoption paths.

### Added

- Canvas-native Browser Harness graph authoring for creating and editing nodes,
  links, paths, regions, shapes, and callouts from the viewport.
- Drag helper lines, snap behavior, and viewport settings controls shared by
  package-level surfaces.
- Nested `nodeLayout` card styling for richer infrastructure-style nodes while
  preserving existing flat style keys.
- Endpoint label styling and automatic placement for link source and target
  labels.
- Global label collision behavior for dense topology views.
- Single-page HTML embed use case and expanded use-case documentation for
  React, MkDocs, Zensical/static HTML, Harness, Kubernetes service maps, service
  provider networks, and Grafana TopoViewer workflows.

### Changed

- Reworked docs navigation and physical content structure so user-facing
  examples and use cases are easier to scan.
- Consolidated example content into the canonical content tree before generated
  docs are synced.
- Improved Harness drag behavior so live movement stays smooth and document
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
