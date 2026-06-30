## ADDED Requirements

### Requirement: Public Entry Point Clarity

The repository SHALL make the stable TopoViewer core understandable from the
README and docs home without requiring users to understand the monorepo,
OpenSpec history, labs, or experimental integrations.

#### Scenario: First screen explains the product

- **GIVEN** a new user opens the README or published docs home
- **WHEN** they read the first screen
- **THEN** they can identify TopoViewer as Topology as Code for semantic,
  interactive diagrams
- **AND** they can see a visual result
- **AND** they can reach a first working topology path.

#### Scenario: Stable path is separated from roadmap

- **GIVEN** a user is evaluating adoption
- **WHEN** they browse docs navigation
- **THEN** supported install, authoring, embedding, and reference material is
  visually separated from roadmap, lab, and maintainer content.

### Requirement: Support Status Taxonomy

The public docs SHALL classify major surfaces as Supported, Experimental, Lab,
Roadmap, or Maintainer.

#### Scenario: Integration status is visible

- **GIVEN** a user reads about React, MkDocs, Zensical, Grafana, VS Code,
  NetBox, or OpsMill/Infrahub
- **WHEN** the integration is mentioned in README, docs home, integration
  roadmap, or package README
- **THEN** the status is explicit and consistent.

#### Scenario: Roadmap does not imply support

- **GIVEN** a feature is only planned or in OpenSpec
- **WHEN** it is described in public docs
- **THEN** it is labeled Roadmap and does not use wording that implies a
  supported package or stable user workflow.

### Requirement: Curated Example Path

The docs SHALL provide a small curated example path separate from the generated
test catalog.

#### Scenario: User wants a copyable network example

- **GIVEN** a user wants to learn by copying YAML
- **WHEN** they open Examples
- **THEN** they see curated examples for basic graph, CLOS fabric, real network,
  node styling, edge styling, and attention before the exhaustive generated
  catalog.

#### Scenario: Generated catalog remains available

- **GIVEN** a user needs full feature coverage
- **WHEN** they open the reference/test catalog
- **THEN** they can still access every generated live viewport, topology YAML,
  stylesheet YAML, and relevant attention YAML.

### Requirement: Promotional Walkthrough Video

The README SHALL include a playable promotional walkthrough video or a
GitHub-compatible video fallback that demonstrates YAML becoming an interactive
TopoViewer graph across the main public surfaces.

#### Scenario: Video is generated repeatably

- **GIVEN** the local docs preview and Grafana lab surfaces are running
- **WHEN** the promotional recording command runs
- **THEN** Playwright records a deterministic walkthrough artifact
- **AND** temporary review artifacts may be written under `.artifacts/promo/`
- **AND** README/docs-visible poster or fallback assets are written under
  `docs/assets/`
- **AND** the final video is either uploaded to a durable GitHub-hosted media
  URL or copied to a checked-in docs asset location approved for repository
  size.

#### Scenario: Video tells the YAML-to-graph story

- **GIVEN** a user watches the README video
- **WHEN** the video plays
- **THEN** it shows topology/style YAML
- **AND** it shows the rendered graph in the browser harness
- **AND** it shows the same live viewport in MkDocs
- **AND** it shows the same live viewport in Zensical
- **AND** it shows Grafana rendering a mounted-bundle topology with telemetry
  overlay behavior.

#### Scenario: README uses durable hosted asset

- **GIVEN** the final video has been reviewed
- **WHEN** it is added to the README
- **THEN** the README uses a GitHub-hosted uploaded media asset or an equivalent
  durable hosted URL
- **AND** any checked-in poster image lives under `docs/assets/`
- **AND** a poster image or linked demo page exists as fallback
- **AND** local-only `.artifacts` paths are not referenced by public docs.

### Requirement: Stable Contract Visibility

The docs SHALL clearly show which YAML, stylesheet, and TypeScript API surfaces
are stable enough for users to depend on.

#### Scenario: User checks a YAML field

- **GIVEN** a user reads the model reference or schema page
- **WHEN** a field is stable, experimental, or internal
- **THEN** its status and accepted values are clear.

#### Scenario: User checks an exported API

- **GIVEN** a user reads the React or TypeScript API docs
- **WHEN** an export is documented
- **THEN** the docs show intended use and stability status.

### Requirement: TopoViewer Object Attribute Reference

The docs SHALL provide an attribute-by-attribute reference for every public
TopoViewer object that developers author, inspect, map, style, or embed.

#### Scenario: Developer checks a topology object attribute

- **GIVEN** a developer is authoring topology YAML
- **WHEN** they read the reference for graph, layer, node, link, path, region,
  callout, label, data, layout, icon, attention, stylesheet rule, style object,
  or mapper rule
- **THEN** every public attribute lists purpose, required/optional status,
  data type, accepted values or format, default behavior, validation behavior,
  selector implications, mapper implications when relevant, and stability
  status
- **AND** the page includes a minimal YAML snippet for that attribute.

#### Scenario: Developer learns by example

- **GIVEN** a developer does not know which field to use
- **WHEN** they open the object reference or examples
- **THEN** each object family has small rendered examples that isolate the
  attribute being explained
- **AND** examples include topology YAML, stylesheet YAML, mapper YAML when
  relevant, and the expected visual or diagnostic result.

#### Scenario: Reference stays aligned with implementation

- **GIVEN** a public object attribute, style key, mapper key, or TypeScript type
  changes
- **WHEN** CI runs
- **THEN** generated reference data, schemas, YAML assist metadata, and docs
  tables are checked for drift
- **AND** undocumented public attributes fail the public-readiness gate.

### Requirement: Enterprise Trust And Governance

The repository SHALL provide enough ownership, support, security, and
contribution structure for a large engineering organization to evaluate
TopoViewer as a third-party dependency.

#### Scenario: Evaluator checks project ownership

- **GIVEN** an enterprise evaluator opens the repository
- **WHEN** they look for maintainership and contribution signals
- **THEN** they can find `CONTRIBUTING.md`, issue templates, review
  expectations, and `CODEOWNERS` or an equivalent ownership model
- **AND** they can understand how changes are reviewed and what support is
  realistic.

#### Scenario: Evaluator checks support boundaries

- **GIVEN** a user wants to depend on TopoViewer
- **WHEN** they read support documentation
- **THEN** they can distinguish supported package/API surfaces, best-effort
  surfaces, lab-only surfaces, and unsupported internal behavior
- **AND** the docs do not imply a service-level agreement that maintainers do
  not intend to provide.

#### Scenario: Evaluator reports a vulnerability

- **GIVEN** a user discovers a security issue
- **WHEN** they read the repository security policy
- **THEN** they can identify how to report it, what scope is covered, and what
  response path to expect.

### Requirement: Compatibility And API Stability

TopoViewer SHALL define and test compatibility for public YAML, stylesheet,
mapper, React, docs embed, and Grafana plugin contracts.

#### Scenario: Existing YAML remains compatible

- **GIVEN** a user has YAML from a previous documented release
- **WHEN** the current renderer, docs embeds, harness, or Grafana plugin loads
  it
- **THEN** it either renders compatibly or fails with a documented migration
  diagnostic
- **AND** compatibility is covered by regression fixtures.

#### Scenario: Public API changes are controlled

- **GIVEN** a maintainer changes a public TypeScript export, YAML field,
  stylesheet key, mapper field, docs embed option, or Grafana plugin option
- **WHEN** CI runs
- **THEN** API/schema compatibility checks detect the change
- **AND** the change requires SemVer, changelog, migration, or deprecation
  documentation before release.

#### Scenario: Compatibility matrix is visible

- **GIVEN** a user wants to install or embed TopoViewer
- **WHEN** they read release or install docs
- **THEN** they can find tested versions for Node, React, React Flow, Grafana,
  browsers, MkDocs, Zensical, and supported operating systems.

### Requirement: Performance And Reliability Evidence

TopoViewer SHALL publish measured performance and reliability budgets for the
topology sizes and integration surfaces it asks users to trust.

#### Scenario: User evaluates graph size limits

- **GIVEN** a user wants to render small, curated, dense, or stress topologies
- **WHEN** they read performance docs
- **THEN** they can find expected node/link ranges, first-render budgets,
  interaction-latency budgets, memory budgets, and known fallback behavior.

#### Scenario: Performance budgets regress

- **GIVEN** a change affects rendering, layout, docs embeds, harness, or
  Grafana overlays
- **WHEN** performance checks run
- **THEN** regressions beyond the documented budgets fail CI or produce an
  explicit release-blocking report.

#### Scenario: Runtime failure is diagnosable

- **GIVEN** YAML, assets, mapper rules, telemetry, or layout input fails
- **WHEN** TopoViewer renders in React, docs, harness, or Grafana
- **THEN** the user sees bounded, actionable diagnostics
- **AND** the failure does not corrupt source YAML or freeze the UI.

### Requirement: Accessibility And UI Integration Contract

TopoViewer SHALL define minimum accessibility and host-application integration
expectations for embeddable UI surfaces.

#### Scenario: User navigates with keyboard

- **GIVEN** TopoViewer is embedded in a docs page, React app, harness, or
  Grafana panel
- **WHEN** a user navigates common controls with a keyboard
- **THEN** focus order, visible focus state, core controls, and escape behavior
  are documented and tested at the supported level.

#### Scenario: User relies on accessible visual state

- **GIVEN** a topology uses color, attention dimming, status badges, labels, or
  telemetry overlays
- **WHEN** the user views it in light or dark mode
- **THEN** contrast, non-color cues, reduced-motion behavior, and text
  legibility meet the documented accessibility posture.

### Requirement: Architecture And Threat Model

TopoViewer SHALL document its runtime boundaries and hostile-input threat model
so adopters can assess risk without reverse-engineering the code.

#### Scenario: Evaluator reviews architecture

- **GIVEN** a user wants to embed TopoViewer in an application or operations
  dashboard
- **WHEN** they read architecture docs
- **THEN** they can understand the compiler, renderer, style metadata,
  schema/validation, docs embeds, harness, Grafana plugin, and mounted-bundle
  data flow
- **AND** public versus internal modules are clearly identified.

#### Scenario: Evaluator reviews threat model

- **GIVEN** a user wants to understand security risk
- **WHEN** they read the threat model
- **THEN** they can identify trust boundaries for YAML, SVG, Markdown-derived
  HTML, mapper templates, telemetry labels, image references, docs embeds,
  local storage, and Grafana mounted files
- **AND** the threat model links to the hostile-input tests that enforce it.

### Requirement: Harness Mapper Authoring

The browser harness SHALL support first-class authoring of `*.mapper.tv.yaml`
as part of the Grafana mounted-bundle workflow. Grafana adoption SHALL NOT be
called ready while mapper YAML can only be authored manually from docs or source
code.

#### Scenario: User Authors A Complete Grafana Bundle

- **GIVEN** a user has topology and stylesheet YAML in the browser harness
- **WHEN** they prepare a Grafana mounted bundle
- **THEN** the harness lets them edit mapper YAML alongside topology and
  stylesheet YAML
- **AND** the harness can export or copy files using the canonical suffixes
  `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
- **AND** the harness treats the three files as one bundle with shared
  validation state.

#### Scenario: User creates mapper rules without source-code knowledge

- **GIVEN** a user wants to map Prometheus data to TopoViewer nodes, links,
  paths, regions, layers, or graph-level state
- **WHEN** they use the harness mapper authoring UI
- **THEN** they can create, edit, validate, and preview mapper rules without
  reading implementation files
- **AND** the UI explains selector, join, target, value extraction, state
  conditions, overlay style, label changes, and aggregate behavior.

#### Scenario: Mapper Suggestions Are Schema And Topology Aware

- **GIVEN** a user is editing `*.mapper.tv.yaml`
- **WHEN** Monaco suggestions are requested
- **THEN** suggestions include valid mapper keys, enum values, target kinds,
  resolver modes, states, thresholds, overlays, and query hints
- **AND** suggestions include topology-aware object IDs, layers, labels, and
  data keys from the currently applied topology.
- **AND** suggestions include style overlay keys that are valid for the mapper
  target kind.

#### Scenario: Mapper Validation Is Actionable

- **GIVEN** mapper YAML contains a problem
- **WHEN** the harness validates it
- **THEN** diagnostics distinguish YAML parse errors, schema errors, topology
  binding errors, unsupported overlay keys, ambiguous matches, stale IDs, and
  query-shape hints.

#### Scenario: User Previews Mapping Coverage Before Grafana

- **GIVEN** a user has mapper rules and sample telemetry labels or synthetic
  sample frames
- **WHEN** the harness runs mapper coverage
- **THEN** it shows matched objects, unmatched telemetry, duplicate mappings,
  ambiguous mappings, and stale topology references
- **AND** the user can correct the mapper before mounting the bundle in
  Grafana.

#### Scenario: Mapper examples cover object and attribute targets

- **GIVEN** a user wants to manipulate topology presentation from telemetry
- **WHEN** they read mapper examples or open harness presets
- **THEN** examples cover node, link, path, region, layer, and graph targets
- **AND** examples show style changes, label changes, status/badge changes,
  aggregate state, selector matching, ID matching, label/data matching,
  endpoint matching, and ambiguous-match diagnostics.

### Requirement: Manual npm Publishing

TopoViewer SHALL define npm package publication as a deliberate manual release
workflow, not an automatic side effect of normal pushes.

#### Scenario: Push CI Validates But Does Not Publish

- **GIVEN** a maintainer pushes to the repository
- **WHEN** normal CI runs
- **THEN** it may validate package metadata, build output, package files, peer
  dependencies, and `npm pack --dry-run`
- **AND** it SHALL NOT publish any npm package.

#### Scenario: Maintainer Publishes Intentionally

- **GIVEN** the package is ready for public npm installation
- **WHEN** a maintainer starts the publish workflow
- **THEN** the workflow is manually triggered through a documented local command
  or GitHub Actions `workflow_dispatch`
- **AND** it requires successful `npm run ci`
- **AND** it requires package dry-run validation
- **AND** it requires an explicit version, changelog or release note, npm
  access, provenance or token/2FA expectations, and dist-tag decision.

#### Scenario: Install Instructions Match Published Package

- **GIVEN** docs show `npm install topoviewer @xyflow/react react react-dom`
- **WHEN** the package is published or renamed
- **THEN** README, MkDocs, Zensical, package README, and React usage examples
  SHALL use the same package name and peer dependency contract
- **AND** stale install commands SHALL be treated as public-adoption blockers.

#### Scenario: Early Release Uses Deliberate Dist Tag

- **GIVEN** the project publishes an early public package for validation
- **WHEN** the API or docs contract is not yet stable enough for broad users
- **THEN** maintainers SHOULD publish with a deliberate non-default dist-tag
  such as `next`
- **AND** `latest` SHALL be reserved for the stable public package contract.

### Requirement: Cross-Surface Early-Adopter Ergonomics

The repository SHALL define first-success workflows for every public adoption
surface without requiring monorepo-internal knowledge.

#### Scenario: User starts from YAML

- **GIVEN** a user has topology and stylesheet YAML
- **WHEN** they follow public docs
- **THEN** they can preview the diagram in the harness
- **AND** they can reuse the same YAML in React, MkDocs, Zensical, or Grafana
  according to each surface's support status
- **AND** they do not need to understand generated projections, fixture sync,
  OpenSpec history, lab scripts, or package internals.

#### Scenario: Integration page gives exact expectations

- **GIVEN** a user opens a React, MkDocs, Zensical, VS Code, Grafana, NetBox,
  or OpsMill/Infrahub page
- **WHEN** the page describes a workflow
- **THEN** it includes support status, prerequisites, commands or files,
  expected result, known limitations, troubleshooting, and a next step
- **AND** it does not present lab-only shortcuts as production guidance.
- **AND** Containerlab-backed telemetry is documented only as a mode of the
  Grafana lab workflow, not as a separate public lab surface.

#### Scenario: Grafana user brings their own bundle

- **GIVEN** a user has `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`
- **WHEN** they follow the Grafana adoption docs
- **THEN** they can mount the files, select the bundle, inspect mapper
  coverage, bind telemetry, and see runtime overlays
- **AND** they do not need to edit catalog files, run fixture sync, or rebuild
  the plugin for normal bundle changes.

### Requirement: Security And Abuse Resistance

TopoViewer SHALL treat user-authored YAML, stylesheets, SVG, callouts, labels,
mapper templates, telemetry labels, docs embed blocks, and mounted bundle files
as hostile input until validated or sanitized.

#### Scenario: Hostile visual content is inert

- **GIVEN** malicious SVG, Markdown/callout HTML, labels, image references, or
  mapper-rendered text
- **WHEN** the content is rendered through React, MkDocs, Zensical, the browser
  harness, or Grafana
- **THEN** scripts, event handlers, `javascript:` references, encoded bypasses,
  CSS injection, unsafe SVG features, and raw executable HTML are blocked or
  rendered as inert text
- **AND** the renderer remains responsive.

#### Scenario: Hostile YAML fails safely

- **GIVEN** YAML with aliases, YAML bombs, deep nesting, duplicate keys, huge
  arrays, null bytes, invalid UTF-8, Unicode controls, or malformed partial
  edits
- **WHEN** the parser, harness, docs embed, or Grafana bundle loader processes
  it
- **THEN** it produces bounded diagnostics or rejection
- **AND** it does not freeze the browser, docs preview, or Grafana panel.

#### Scenario: Grafana mounted bundle cannot escape its root

- **GIVEN** a mounted bundle request uses a disallowed root, traversal path,
  symlink escape, absolute manifest path, oversized file, duplicate ID,
  malformed manifest, or non-UTF-8 file
- **WHEN** the Grafana backend resource endpoint handles the request
- **THEN** it rejects the request before reading outside the allowed roots
- **AND** diagnostics avoid leaking unnecessary filesystem paths.

#### Scenario: Grafana roles are tested

- **GIVEN** Grafana users with Viewer, Editor, Admin, and anonymous access
- **WHEN** they request TopoViewer bundle resources
- **THEN** access follows the documented security model
- **AND** anonymous Admin is documented only as a disposable local lab setting.

### Requirement: Lab Safety Boundaries

Lab and demo environments SHALL be visibly unsafe-by-design when they use
anonymous Admin, disposable credentials, broad local port exposure, or unsigned
plugins.

#### Scenario: User starts a lab

- **GIVEN** a command starts Grafana, Prometheus, synthetic telemetry, or
  Grafana Containerlab-mode services
- **WHEN** the command is documented or executed through npm scripts
- **THEN** the docs or command output warn when anonymous Admin, default
  credentials, unsigned plugin loading, or host port exposure is used
- **AND** the warning clearly says this is not production configuration.

#### Scenario: User reads production guidance

- **GIVEN** a user reads production-shaped Grafana docs
- **WHEN** authentication, network exposure, plugin signing, credentials, or
  telemetry ingestion are mentioned
- **THEN** lab shortcuts are separated from production-shaped guidance
- **AND** the docs do not encourage copying checked-in `.env` values into a
  real deployment.

### Requirement: Artifact And Supply-Chain Integrity

Public adoption SHALL be blocked until package, plugin, docs, and media
artifacts are inspected for leakage and dependency risk is triaged.

#### Scenario: npm package is prepared

- **GIVEN** maintainers prepare an npm package
- **WHEN** package validation runs
- **THEN** it verifies package metadata, peer dependencies, install command
  correctness, package file allowlist, and `npm pack --dry-run`
- **AND** it rejects `.env`, `.donotpush`, local paths, private keys, debug
  dumps, unexpected generated files, and stale public URLs.

#### Scenario: Grafana plugin artifact is prepared

- **GIVEN** maintainers prepare a Grafana plugin zip
- **WHEN** artifact validation runs
- **THEN** it verifies plugin metadata, supported Grafana version, signing or
  unsigned status, checksum guidance, and packaged file allowlist
- **AND** it rejects secrets, local paths, lab-only config, and unexpected
  generated files.

#### Scenario: Dependency advisories exist

- **GIVEN** npm or Go vulnerability checks report advisories
- **WHEN** public readiness is evaluated
- **THEN** each advisory is fixed, upgraded, or recorded in a dependency-risk
  ledger as shipped risk, dev-only risk, toolchain risk, upstream/external risk,
  or temporary accepted risk
- **AND** untriaged shipped-risk advisories block production-ready claims.

### Requirement: Automated Security Monitoring

The repository SHALL run automated security monitoring for dependencies, source
code, secrets, and container/lab images so public-readiness does not depend on
manual scans alone.

#### Scenario: Dependency security updates are automatic

- **GIVEN** the repository uses npm packages, GitHub Actions, Go modules, and
  Docker/container images
- **WHEN** Dependabot or an equivalent update system is configured
- **THEN** it watches every supported ecosystem used by the repo
- **AND** security updates create reviewable PRs with clear labels, grouping,
  reviewers or owners, and CI coverage.

#### Scenario: Static and secret scanning run automatically

- **GIVEN** a change is pushed or a pull request is opened
- **WHEN** security automation runs
- **THEN** CodeQL or equivalent static analysis covers TypeScript/JavaScript
  and Go code
- **AND** secret scanning or an equivalent repository scan checks for tokens,
  private keys, credentials, `.env` leakage, and local-private artifacts.

#### Scenario: Lab and plugin images are scanned

- **GIVEN** Grafana lab, Grafana Containerlab-mode, or plugin packaging uses
  container images
- **WHEN** public-readiness checks run
- **THEN** container image scanning checks pinned images and generated images
  where applicable
- **AND** critical/high findings are triaged before public-ready claims.
- **AND** push and pull-request runs may report third-party lab image CVE drift
  without blocking unrelated code review when scheduled or manual security
  sweeps remain blocking for the same image findings.

#### Scenario: Security automation health is visible

- **GIVEN** a maintainer or adopter checks security posture
- **WHEN** they inspect CI, docs, or the readiness report
- **THEN** they can see when Dependabot/security update checks, static
  analysis, secret scanning, container scanning, npm audit, and Go vulnerability
  checks last ran
- **AND** untriaged findings block archive of this OpenSpec.

### Requirement: Uncommon Hardening Program

The repository SHALL add hardening checks that simulate serious external review,
not only ordinary unit and lint coverage.

#### Scenario: Fake early adopter follows docs only

- **GIVEN** a clean checkout and no maintainer context
- **WHEN** the documented first-run, docs embed, React, harness, and Grafana
  paths are followed
- **THEN** each path succeeds or fails with documented, actionable errors
- **AND** any step requiring source-code reading becomes a docs bug.

#### Scenario: Public artifacts are autopsied

- **GIVEN** docs builds, npm packs, Grafana plugin zips, screenshots, and promo
  videos are generated
- **WHEN** artifact autopsy runs
- **THEN** it scans for local paths, private files, lab secrets, outdated
  routes, debug panels, personal data, and unexpected binary content.

#### Scenario: Cross-surface visual parity is protected

- **GIVEN** a curated example renders in harness, MkDocs, and Zensical
- **WHEN** visual parity checks run
- **THEN** theme colors may differ only where explicitly allowed
- **AND** geometry, shape aspect ratio, icon/glyph alignment, label placement,
  edge attachment, and layout sizing do not drift.

### Requirement: Differentiation Without Hype

The docs SHALL explain how TopoViewer differs from broad text-to-diagram tools,
raw graph/canvas libraries, and static image workflows.

#### Scenario: User compares TopoViewer with Mermaid.js

- **GIVEN** a user asks why not Mermaid.js
- **WHEN** they read the comparison
- **THEN** they understand that TopoViewer is narrower and more semantic:
  topology facts, reusable stylesheets, interaction, validation, embeds, and
  runtime APIs.

#### Scenario: User compares TopoViewer with React Flow directly

- **GIVEN** a user asks why not build directly with React Flow
- **WHEN** they read the comparison
- **THEN** they understand that TopoViewer provides a topology schema,
  stylesheet compiler, examples, docs embeds, validation, and authoring path on
  top of React Flow.

### Requirement: Public Docs Quality Gates

CI SHALL protect public docs from structural drift.

#### Scenario: Public nav regresses

- **GIVEN** a change edits nav, generated docs, README, or content pages
- **WHEN** docs lint runs
- **THEN** it detects unexpected public nav drift, missing status labels,
  broken public links, or generated projection drift.

#### Scenario: Representative examples regress visually

- **GIVEN** a change affects renderer CSS, examples, docs embeds, or the harness
- **WHEN** representative visual checks run
- **THEN** they verify at least one curated example across harness, MkDocs, and
  Zensical.
