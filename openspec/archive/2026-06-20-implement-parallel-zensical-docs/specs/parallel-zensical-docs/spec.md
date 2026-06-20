## ADDED Requirements

### Requirement: Parallel documentation outputs

TopoViewer SHALL build MkDocs and Zensical documentation outputs without one
overwriting the other.

#### Scenario: MkDocs remains at GitHub Pages root

- **WHEN** the documentation workflow builds the Pages artifact
- **THEN** the MkDocs site SHALL remain available at `/topoViewer/`
- **AND** existing MkDocs URLs SHALL not move to a Zensical prefix

#### Scenario: Zensical publishes under a stable subpath

- **WHEN** the documentation workflow builds the Pages artifact
- **THEN** the Zensical site SHALL be built into `site/zensical/`
- **AND** it SHALL be reachable at `/topoViewer/zensical/` after GitHub Pages
  deployment

### Requirement: Local Zensical build and preview

TopoViewer SHALL provide first-class local commands for building and previewing
the Zensical documentation target.

#### Scenario: Build Zensical locally

- **WHEN** a contributor runs `npm run zensical:build`
- **THEN** TopoViewer SHALL build the browser embed bundle
- **AND** sync the Zensical embed assets
- **AND** run `zensical build`
- **AND** write the static output to `site/zensical/`

#### Scenario: Serve Zensical locally

- **WHEN** a contributor runs `npm run zensical:serve`
- **THEN** TopoViewer SHALL start a Zensical local preview server
- **AND** use a default port that can run beside MkDocs
- **AND** document the local preview URL

### Requirement: Static TopoViewer embed support in Zensical

The Zensical site SHALL render a live TopoViewer embed using the existing
browser-ready TopoViewer assets.

#### Scenario: Zensical loads TopoViewer assets

- **WHEN** the Zensical site is built
- **THEN** the built HTML SHALL include the TopoViewer embed CSS
- **AND** the TopoViewer embed IIFE bundle
- **AND** the Zensical adapter script

#### Scenario: Zensical page renders a topology

- **WHEN** a browser opens the Zensical TopoViewer example page
- **THEN** the page SHALL contain a `.topoviewer-embed` container
- **AND** the adapter SHALL call `window.TopoViewerEmbed.mountAll()`
- **AND** the viewer SHALL load topology and stylesheet YAML from the Zensical
  docs tree

#### Scenario: Instant navigation remounts embeds

- **WHEN** Zensical emits a `document$` update after client-side navigation
- **THEN** the adapter SHALL call `window.TopoViewerEmbed.mountAll()` again
- **AND** repeated calls SHALL not duplicate already mounted viewers

### Requirement: Zensical mirrors canonical TopoViewer docs

The Zensical site SHALL generate its TopoViewer reference content from the
canonical `docs/topoviewer/` documentation tree.

#### Scenario: Mirrored pages are generated from MkDocs source

- **WHEN** a contributor runs `npm run sync:zensical-docs`
- **THEN** TopoViewer SHALL copy/adapt selected Markdown pages from
  `docs/topoviewer/` into `docs-zensical/topoviewer/`
- **AND** it SHALL leave handwritten Zensical landing and adapter pages outside
  that generated tree

#### Scenario: TopoViewer fences become static embeds

- **WHEN** a copied MkDocs page contains a `topoviewer` fence whose topology
  path resolves to `docs/topoviewer/examples/**`
- **THEN** the Zensical generated page SHALL contain a `.topoviewer-embed`
  HTML container
- **AND** the generated topology and stylesheet URLs SHALL point to the copied
  Zensical example assets

#### Scenario: Example source stays canonical

- **WHEN** Zensical docs are synced
- **THEN** `docs/topoviewer/examples/**` SHALL be copied into
  `docs-zensical/assets/topoviewer/examples/**`
- **AND** rendered YAML tabs SHALL show expanded source text instead of raw
  `--8<--` snippet directives

#### Scenario: Zensical nav follows MkDocs nav

- **WHEN** Zensical docs are synced
- **THEN** the Zensical nav SHALL be generated from the MkDocs nav subset
- **AND** Zensical-specific pages SHALL remain grouped separately

### Requirement: GitHub Pages workflow builds both sites

The GitHub Pages workflow SHALL publish MkDocs and Zensical from a single Pages
artifact.

#### Scenario: Docs workflow builds combined artifact

- **WHEN** `.github/workflows/docs.yml` runs
- **THEN** it SHALL build MkDocs into `site/`
- **AND** build Zensical into `site/zensical/`
- **AND** upload `site/` as the Pages artifact

#### Scenario: CI validates Zensical build

- **WHEN** `.github/workflows/ci.yml` runs
- **THEN** it SHALL execute the Zensical build check
- **AND** fail if the Zensical output is missing required TopoViewer assets or
  the example embed container

### Requirement: Integration remains adapter-only

TopoViewer SHALL not introduce a full Zensical package until Zensical exposes
stable extension hooks that justify it.

#### Scenario: Phase 1 avoids package coupling

- **WHEN** the first Zensical support is implemented
- **THEN** it SHALL use static assets, Zensical configuration, and a small
  adapter script
- **AND** it SHALL not create or publish `zensical-topoviewer`
- **AND** it SHALL not require React, Vite, or TypeScript source execution
  during the Zensical build
