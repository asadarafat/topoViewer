# Design

## Current Dependency Shape

```text
vscode-topoviewer source ----direct relative imports----> topoviewer/src
vscode-topoviewer package ---package imports------------> topoviewer
grafana panel ---------------package imports------------> topoviewer
mkdocs plugin <--------------vendored embed assets------- topoviewer build
containerlab lab ------------built plugin + mounted bundle
```

The direct relative path is the defect. It creates a second, untracked API
beside `packages/topoviewer/src/index.ts`.

## Target Dependency Shape

```text
topoviewer root API + integration API + CSS
        |             |                  |
        v             v                  v
VS Code/Harness   Grafana panel     React consumers
        |
        +-- host adapters own persistence and file/runtime integration

topoviewer embed build -> vendored assets -> mkdocs-topoviewer

built Grafana plugin + mounted YAML bundle -> Containerlab lab or external lab
```

Consumer source may import `topoviewer`, documented package subpaths, and peer
runtime packages. It may not import `packages/topoviewer/src/**` directly.

## Public Shared Integration API

The core package already owns the shared viewport settings component,
authoring helper-line policy, and layer selection utilities. Export the subset
used by application adapters from `topoviewer/integration` so the minimal root
API does not become an application-UI barrel:

- `ViewportSettingsPanel` and `ViewportSettingsPanelProps`;
- `authoringHelperLinesOptions`;
- `layerIds`;
- `reconcileSelectedLayerIds`;
- `toggleSelectedLayerId`.

These are additive exports. The API report must record them.

## Build-Time Source Resolution

The Harness and webview Vite configs may continue mapping the exact
`topoviewer` and `topoviewer/integration` package specifiers to their source
entries for local development and bundle composition. Application source must
remain unaware of those paths. CSS uses the published `topoviewer/style.css`
subpath after the core package build has produced `dist/topoviewer.css`.

## Enforcement

Add error-level dependency-cruiser rules for both directions:

- application adapters must not import `packages/topoviewer/src/**` directly;
- the core package must not import VS Code/Harness or Grafana application
  source.

The existing no-cycle checks remain in place.

## Runtime And Security Ownership

- React hosts own data loading, authentication, authorization, and persistence.
- VS Code/Harness host adapters own file messages or browser storage.
- MkDocs owns static asset resolution only; it does not run npm at site build.
- Grafana owns authenticated resource calls and mapper/data-frame adaptation.
- The Go backend owns mounted-root allowlisting and safe file reads.
- Containerlab owns disposable demo wiring only. Production authentication,
  ingress, credentials, plugin signing, and telemetry retention remain outside
  the lab.
- External upstream candidates consume built plugin artifacts and copied YAML;
  TopoViewer never reads an external checkout at runtime.

## Validation

Prove the package boundary with dependency-cruiser, public API report checks,
core unit tests, Harness unit/type/build tests, and the full repository gate.
No container deployment is required because runtime/container behavior is not
changed.

## Remaining Risks And Follow-Ups

- `topoviewer/integration` is an additive public compatibility surface. Future
  changes to it require API-report review, migration notes, and semantic
  versioning discipline.
- Local Harness and webview builds resolve package specifiers to source through
  exact Vite aliases. Those aliases are build plumbing, not permission for
  application source to import private files.
- The shared integration bundle is small, but the Harness and webview initial
  bundles remain large. Existing size budgets pass; further reduction should
  continue through measured lazy-loading work rather than this boundary change.
- Grafana mapper execution remains Grafana-owned. Extract it only after a
  second runtime consumer establishes a genuinely shared contract.
- Containerlab and upstream-candidate repositories remain artifact consumers.
  Production credentials, ingress, plugin signing, telemetry retention, and
  authorization are deployment responsibilities, not lab defaults.
- The full CI orchestrator requires generated projections to be committed. A
  pre-commit worktree containing intentional docs projections therefore proves
  substantive lanes independently and receives the final aggregate result only
  after commit.
