# Harden Workspace Integration Boundaries

## Why

TopoViewer's package architecture is mostly one-directional, but the Browser
Harness and VS Code webview still import selected files directly from the
`packages/topoviewer/src` tree. Those imports work only because the packages
share one checkout. They bypass the npm package contract, make package
extraction unsafe, and are not rejected by the current dependency checker.

The repository documentation also describes only the two published packages,
while the actual workspace includes two additional application adapters: the
VS Code/Harness package and the Grafana panel package.

## Scope

- expose existing shared viewport UI and pure layer/helper-line utilities from
  an explicit `topoviewer/integration` package subpath;
- migrate VS Code/Harness source to package-name and CSS-subpath imports;
- reject direct imports from one package's source tree into another package;
- preserve local Vite source aliases only as build-time resolution for the
  public `topoviewer` specifier;
- document the four package roles, adapter boundaries, runtime assumptions,
  security ownership, and external Containerlab/upstream-candidate boundary;
- refresh local handoff guidance without changing external repositories.

## Non-Goals

- moving Grafana mapper execution into the core package;
- publishing the VS Code or Grafana packages;
- changing topology, stylesheet, mapper, or mounted-bundle semantics;
- modifying the dirty local `srl-telemetry-lab` upstream-candidate checkout;
- making TopoViewer depend on EDA, Nokia lab, or other sibling repositories.

## Compatibility

This change adds public exports and removes no existing exports. Existing YAML,
React props, static embeds, Grafana dashboards, and MkDocs behavior remain
source-compatible.
