## Why

TopoViewer Studio needs a dedicated desktop product that can open and save
portable topology bundles without depending on an editor extension or a
browser-specific filesystem API. The current VS Code adapter is experimental,
unpublished, and adds a second host lifecycle without providing a distributable
Studio application.

## What Changes

- Add a Wails v2 and Go desktop host for the existing React and Material UI
  Studio application.
- Produce platform-native Studio artifacts for macOS, Windows, and Linux from
  one source tree, with platform and architecture differences represented
  explicitly in the release matrix.
- Add native project and asset dialogs, bounded filesystem access, atomic
  project saves, recovery, external-change detection, preferences, clipboard,
  and artifact export through the existing typed Studio host boundary.
- Keep Browser Studio as the hosted evaluation and browser authoring surface.
- Add desktop host-conformance, security, package, and platform smoke checks.
- **BREAKING** Remove the experimental `vscode-topoviewer` workspace package,
  commands, documentation, CI lanes, and VS Code-specific host protocol. No
  VSIX has been published, so there is no supported extension migration path.
- Replace public VS Code roadmap wording with accurate Desktop Studio support
  and distribution status.

## Capabilities

### New Capabilities

- `studio-desktop-distribution`: Native Wails host behavior, platform artifacts,
  packaging, signing boundaries, and desktop release verification.

### Modified Capabilities

- `studio-hosts-and-portability`: Replace the thin VS Code adapter contract with
  a thin Wails desktop adapter while preserving Browser Studio portability.
- `studio-product-contract`: Define Desktop Studio as the local filesystem
  authoring product and remove VS Code as a maintained Studio surface.
- `studio-production-readiness`: Require desktop host parity, native package
  verification, and platform-specific release evidence.

## Impact

- Adds a Go module and Wails application under a desktop application-owned
  repository directory.
- Adds pinned Wails v2 build tooling and generated TypeScript bindings.
- Extends the Studio host kind and capability contract with a desktop adapter.
- Moves generic workspace-project persistence out of the VS Code package so
  host-neutral save, recovery, validation, and conflict behavior retain one
  owner.
- Removes `packages/vscode-topoviewer` and its npm workspace, scripts,
  dependencies, tests, documentation, and GitHub workflow references.
- Adds native build dependencies and release responsibilities: Windows
  WebView2 handling, macOS signing and notarization, and Linux GTK/WebKitGTK
  runtime packaging.
- Does not change TopoViewer topology, stylesheet, mapper, renderer, MkDocs,
  Zensical, React, or Grafana runtime contracts.
