# Changelog

TopoViewer follows semantic versioning for public releases. During early access, breaking changes may still occur, but they must be documented with migration notes.

## 0.1.0 - Unreleased

### Added

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

### Changed

- Moved from prototype layout to production monorepo layout:
  - `packages/topoviewer`
  - `packages/mkdocs-topoviewer`
- Changed default generated documentation root from the temporary RTFM tree to the monorepo `docs/` directory.

### Security

- Documented the security boundary for Markdown, SVG, image references, and untrusted diagram content.
