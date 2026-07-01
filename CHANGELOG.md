# Changelog

TopoViewer follows semantic versioning for public releases. The first public
release is `0.1.0`: an installable early-adopter release with honest pre-1.0
compatibility expectations. Reserve `1.0.0` for the later stable-core API-freeze
release.

## 0.1.0 - 2026-07-01

### Added

- First public `topoviewer` npm package with React renderer, schemas,
  validation helpers, stylesheet keys, examples, and MkDocs embed behavior.
- Production-shaped monorepo with separate `topoviewer` npm package and `mkdocs-topoviewer` Python package.
- React renderer package exports, embeddable browser bundle, and schema package exports.
- MkDocs fenced-block plugin with vendored frontend assets.
- Canonical examples catalog under `packages/topoviewer/examples/test-cases`.
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

## 1.0.0 - Future Stable-Core Release

This future release is reserved for the stable-core API-freeze milestone after
the early-adopter package has real user feedback, migration notes, and a
supportable SemVer boundary.
