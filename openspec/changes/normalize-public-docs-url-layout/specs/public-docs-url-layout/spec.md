# Public Docs URL Layout Requirements

## ADDED Requirements

### Requirement: Lowercase public identity

TopoViewer SHALL use lowercase public repository and GitHub Pages URLs.

#### Scenario: Repository links

- **WHEN** public README, package metadata, plugin metadata, or docs tooling
  references the GitHub repository
- **THEN** the URL SHALL use `https://github.com/asadarafat/topoviewer`

#### Scenario: Pages links

- **WHEN** public README, package docs, VS Code docs links, or docs tooling
  references GitHub Pages
- **THEN** the URL SHALL use `https://asadarafat.github.io/topoviewer/`

### Requirement: Combined Pages artifact layout

TopoViewer SHALL publish MkDocs, Zensical, and browser harness surfaces as
sibling routes under one Pages base.

#### Scenario: MkDocs route

- **WHEN** the combined documentation artifact is built
- **THEN** MkDocs SHALL be available under `site/docs/mkdocs/**`
- **AND** the published route SHALL be `/topoviewer/docs/mkdocs/`

#### Scenario: Zensical route

- **WHEN** the combined documentation artifact is built
- **THEN** Zensical SHALL be available under `site/docs/zensical/**`
- **AND** the published route SHALL be `/topoviewer/docs/zensical/`

#### Scenario: Browser harness route

- **WHEN** the combined documentation artifact is built
- **THEN** the browser harness SHALL be available under `site/harness/**`
- **AND** the published route SHALL be `/topoviewer/harness/`

### Requirement: Single-port production-like preview

TopoViewer SHALL provide one local preview command that serves the combined
static Pages artifact.

#### Scenario: Local preview URLs

- **WHEN** a developer runs `npm run docs:preview`
- **THEN** the preview SHALL use port 8001 by default
- **AND** MkDocs SHALL be available at
  `http://127.0.0.1:8001/topoviewer/docs/mkdocs/`
- **AND** Zensical SHALL be available at
  `http://127.0.0.1:8001/topoviewer/docs/zensical/`
- **AND** the browser harness SHALL be available at
  `http://127.0.0.1:8001/topoviewer/harness/`

#### Scenario: Port conflict

- **WHEN** port 8001 is already in use
- **THEN** `npm run docs:preview` SHALL fail with a clear message instead of
  selecting another port

### Requirement: Built-site smoke coverage

Docs smoke validation SHALL check the same route shape used by GitHub Pages and
local preview.

#### Scenario: Smoke checks

- **WHEN** docs smoke validation runs
- **THEN** it SHALL open representative MkDocs, Zensical, and browser harness
  routes under `/topoviewer/`
- **AND** it SHALL fail on missing assets, missing TopoViewer hydration, or
  missing harness shell content
