# Compatibility

TopoViewer has several public contracts: the npm package exports, YAML
documents, stylesheet keys, mapper rules, docs embed blocks, Grafana panel
options, and generated examples. Treat them differently. A React component prop
does not have the same compatibility promise as an internal Studio helper.

## Version Policy

The public `0.x` package line is installable early-adopter software with honest
pre-1.0 compatibility expectations. It should be good enough to try from npm,
but it should not claim API freeze. `0.1.0` was the first public package;
`0.3.0` continues the same pre-1.0 contract with migration notes.

The later stable-core target is `1.0.0`. For `1.0.0`, the stable core means the
React renderer, documented props/events, topology and stylesheet schemas,
validation/lint helpers, curated examples, and MkDocs embed behavior are
supportable under normal SemVer expectations. Grafana, VS Code, labs, Zensical
adapter internals, NetBox, and OpsMill/Infrahub can remain Experimental, Lab,
Supported Adapter, or Roadmap without blocking the core package release.

| Surface | Compatibility rule |
|---|---|
| `topoviewer` npm package | `0.x` releases are public early-adopter releases. `1.0.0` is the later stable-core release; after that, supported API/YAML/style/schema changes follow SemVer strictly. |
| React component props | `TopoViewer`, documented props, and documented event payloads are the primary supported API. Breaking prop/event changes require migration notes. |
| TypeScript exports | Exports marked `Supported` in [TypeScript API](./typescript-api.md) are intended for application code. `Advanced` exports are public but lower-level. `Experimental` exports may change while the feature matures. |
| Topology YAML | `version` is the document migration hook. Missing versions are treated as current-compatible until a migration says otherwise. |
| Stylesheet YAML | Canonical keys are camelCase. Removing or changing an accepted key requires migration guidance and docs/schema updates. |
| Attention YAML | Top-level `attention` and React `attention` props should preserve documented focus semantics across releases. |
| Mapper YAML | `version: 1` is required. Compact `rules` and canonical `mappings` must remain readable or fail with explicit mapper diagnostics. |
| MkDocs/Zensical embed blocks | Documented block options should remain compatible. New options must be optional. |
| Grafana panel options | Dashboard JSON options need migration behavior when field names or defaults change. |

## Public API Boundary

The checked-in API report at `packages/topoviewer/api-report.md` is generated
from `packages/topoviewer/src/index.ts`. Run `npm run api:check` to verify the
public export surface or `npm run api:report` after an intentional export
change.

| Area | Public status | Ownership rule |
|---|---|---|
| `TopoViewer` React component | Supported | Public package contract. Keep props typed, documented, and covered by examples/tests. |
| Validation and lint helpers | Supported | Safe for CI, editor, docs, and product integration. |
| Layout helpers | Supported for documented modes | Keep generic and renderer-agnostic where possible. |
| Style metadata registry | Supported | Single source for docs, schemas, YAML assist, and runtime defaults. |
| Static export helpers | Supported | Browser APIs are expected; SSR callers must guard usage. |
| Attention engine | Supported where documented | Runtime APIs are UI-independent and should stay testable without React. |
| Compiler helpers | Advanced | Public for host integrations, but lower-level than the component. Prefer documented wrappers. |
| Studio internals | Internal | Do not import feature-private Studio source paths in products. |
| MkDocs plugin internals | Internal | Use documented fenced blocks and package commands. |
| Zensical adapter internals | Internal adapter implementation | Use generated docs output and documented static embed behavior. |
| Grafana backend resource API | Experimental integration API | May change while the panel is experimental; dashboard migrations must be documented. |
| Lab scripts and Containerlab mode | Lab | Not a production API. Do not build automation against lab-only ports, credentials, or file paths. |

## Docs Embed API Compatibility

MkDocs and Zensical share the same `topoviewer` fenced-block contract. The
current documented options are:

| Option | Compatibility rule |
|---|---|
| `topology` | Required. Removing or renaming this would be breaking. |
| `stylesheet` | Optional. Must remain optional so topology-only examples keep rendering. |
| `height` | Optional CSS length. Defaults remain adapter-owned. |
| `width` | Optional CSS length. Defaults remain adapter-owned. |
| `title` | Optional caption. |
| `controls` | Optional boolean. Existing omitted value must keep showing controls by default. |
| `controlsOpen` | Optional boolean. Existing omitted value must keep controls closed by default. |
| `selectedLayerIds` | Optional list of layer IDs. Existing omitted value must keep selecting all layers. |
| `attention` | Optional runtime attention override. Existing topology-level attention remains valid. |

New embed options must be optional. Any removal, rename, or default change needs
a migration note and a docs-embed compatibility test update.

## Grafana Panel Option Compatibility

Grafana dashboard JSON stores panel options. Treat these paths as the current
experimental compatibility contract:

| Option path | Compatibility rule |
|---|---|
| `sourceMode` | Defaults to mounted bundle. Existing fixture dashboards must still migrate or render as fixture compatibility mode. |
| `fixtureId` | Demo/CI compatibility only; do not require normal users to edit fixture catalogs. |
| `mountedBundle.bundleRoot` | Defaults to `/etc/topoviewer/bundles`; path validation remains backend-owned. |
| `mountedBundle.manifestPath` | Optional. Empty string keeps suffix discovery. |
| `mountedBundle.selectedBundleId` | Optional. Empty string selects the first complete bundle. |
| `themeMode` | Optional display intent. Existing `auto` behavior must keep following host theme where possible. |
| `showControls` | Optional boolean. Omitted dashboards keep controls visible. |
| `controlsOpen` | Optional boolean. Omitted dashboards keep controls closed. |
| `telemetry.enabled` | Optional boolean. Omitted dashboards render base topology without overlays. |
| `telemetry.infoPercent` | Optional numeric threshold. Defaults to `50`. |
| `telemetry.warningPercent` | Optional numeric threshold. Defaults to `80`. |
| `telemetry.errorPercent` | Optional numeric threshold. Defaults to `90`. |
| `interaction.enabled` | Optional boolean. Omitted dashboards keep interaction state enabled. |
| `interaction.allowNodeDrag` | Optional boolean. Omitted dashboards allow local node drag. |
| `interaction.persistViewport` | Optional persistence mode. Defaults to `session`. |
| `interaction.persistSelection` | Optional persistence mode. Defaults to `session`. |
| `interaction.persistNodePositions` | Optional persistence mode. Defaults to `session`. |
| `interaction.resetOnTopologyIdentityChange` | Optional boolean. Omitted dashboards isolate state by topology identity. |

Grafana option changes must update panel defaults, docs, dashboard migration
notes, and tests in the same change.

## Document Migration Rules

Use these rules when changing YAML, schema, style, attention, mapper, or layout
contracts:

1. Add or update a schema when the authored shape changes.
2. Add a migration helper when old valid YAML can be transformed safely.
3. Add a semantic lint or diagnostic when old YAML cannot be migrated safely.
4. Add at least one before/after example or release note entry.
5. Add compatibility fixtures for previously documented YAML when the change
   affects rendering or validation behavior.

Do not silently reinterpret existing YAML. A diagram that used to render should
either render compatibly or fail with an actionable migration diagnostic.

## Compatibility Fixtures

Compatibility fixtures live under
`packages/topoviewer/tests/fixtures/compatibility/`. They cover no-version
YAML that appeared in early public examples and migration failures that should
remain explicit.

Current fixture contract:

| Fixture | Expected behavior |
|---|---|
| `v0.1/basic.topo.tv.yaml` + `v0.1/basic.style.tv.yaml` | Validates, lints without errors, and compiles to the same two-node one-link graph. |
| `v0.1/kebab-style-key.style.tv.yaml` | Fails with an explicit "use camelCase style keys" migration diagnostic. |

Add a fixture when public docs, README snippets, generated examples, or
released package examples change in a way that could break existing user YAML.

## Compatibility Matrix

| Dependency or host | Current contract |
|---|---|
| Node.js | Node.js 24 LTS for local development, CI, package build, docs generation, Studio, and Grafana plugin build. This is intentional for the `0.x` line so local and GitHub gates stay identical while the package is still pre-1.0. Broader Node 20/22/24 package-consumer support is a later compatibility decision, not a current claim. |
| npm | Use the committed lockfile. Public install snippets must be validated by `npm run install:check` before publication. |
| React | Peer dependency `react >=18`. React 18 is used in local tests. |
| React DOM | Peer dependency `react-dom >=18`. React DOM 18 is used in local tests. |
| React Flow | Peer dependency `@xyflow/react ^12.10.0`; local tests use the workspace-locked version. |
| TypeScript | Workspace builds use TypeScript 5.9. Public type output is emitted under `dist/types`. |
| Browsers | Chromium is the primary automated browser gate today. Firefox/WebKit support needs explicit verification before being claimed. |
| MkDocs | Supported through `mkdocs-topoviewer` and the vendored browser embed bundle. |
| Zensical | `Supported Adapter` path through generated static docs and shared embed assets. |
| Grafana | Experimental panel tested against pinned Grafana package versions in the workspace and pinned local lab images. |
| Go backend | Grafana backend tests and vulnerability checks run with the pinned Go toolchain configured by package scripts. |
| Operating systems | CI is the source of truth. Local macOS development is common, but public compatibility should not depend on macOS-specific paths or tools. |

## Release Notes And Deprecation

Every public release or release candidate should include:

- support-status changes;
- new public APIs, YAML fields, style keys, mapper fields, or embed options;
- deprecations and replacement syntax;
- breaking changes with migration steps;
- known limitations and accepted risks;
- validation commands used for the release.

Prefer additive changes. When removal is unavoidable, keep the old key or option
as a documented compatibility alias for one migration window unless the old
behavior is unsafe.
