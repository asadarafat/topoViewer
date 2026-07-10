# Build TopoViewer Studio

## Why

TopoViewer now has a capable renderer, a validated YAML model, cross-surface
embeds, mapper-driven telemetry overlays, and substantial canvas authoring
behavior. The Browser Harness proves those contracts, but its product shell
still reflects its history as a fixture runner, YAML workbench, VS Code preview,
and incremental authoring experiment.

The next adoption constraint is no longer missing graph primitives. It is the
absence of one polished, discoverable authoring product that lets a human create
and style the complete TopoViewer bundle without first learning every YAML
attribute.

## Product Promise

TopoViewer Studio SHALL provide one authoring experience for one portable
bundle:

```text
topology.yaml
stylesheet.yaml
mapper.yaml
assets/
```

The same bundle remains the input for MkDocs, Zensical, React, Grafana, static
export, and presentation. Studio SHALL NOT fork authoring by destination or
require a surface-selection wizard.

The primary interaction contract is:

> Drag to create, select to edit, connect directly, and reveal complexity only
> when requested.

## What Changes

- Add a private `topoviewer-studio` application with a canvas-first shell,
  drag-to-create palette, selection-driven Inspector, and optional workspace
  drawer.
- Add canonical specification-driven style and mapper authoring metadata so the
  UI can expose the complete public contract through a task-focused Basic view,
  a complete All view, and raw-source fallback without duplicating runtime facts.
- Add a lossless multi-document authoring session, transactional commands,
  history, persistence, recovery, conflict handling, and deterministic exports.
- Add one typed host boundary and run the same Studio application in browser and
  VS Code hosts.
- Add measured security, accessibility, reliability, performance, parity,
  migration, preview-release, rollback, and production-cutover gates.
- Keep the existing Harness available until those gates pass, then remove its
  migrated duplicate shell in a separate reviewable step.

## Capabilities

### New Capabilities

- `studio-product-contract`: one portable bundle, one authoring UX, a canvas-
  first shell, coherent state, and reversible Harness migration.
- `studio-direct-manipulation`: drag-to-create objects, direct graph editing,
  graph-valid paths, regions, and transactional canvas interaction.
- `studio-spec-driven-authoring`: complete canonical field metadata, generated
  controls, customizable authoring profiles, provenance, and lossless editing.
- `studio-telemetry-mapper`: complete mapper authoring, target-compatible state
  style, sample-driven inference, and auditable coverage diagnostics.
- `studio-hosts-and-portability`: browser and VS Code host contracts,
  persistence, conflicts, deterministic bundles, and consumer-independent
  exports.
- `studio-production-readiness`: evidence-based performance, accessibility,
  security, recovery, cross-host verification, and cutover gates.

### Modified Capabilities

- None. Existing TopoViewer YAML and runtime contracts remain compatible; any
  implementation-time contract change requires a separate explicit delta.

## Impact

- New private application package: `packages/topoviewer-studio`.
- Extended pure authoring metadata and provenance APIs in
  `packages/topoviewer`.
- Reduced `packages/vscode-topoviewer` ownership after reusable authoring logic
  moves behind the Studio host contract.
- New `/studio/` browser route alongside the existing `/harness/` migration
  surface.
- Canonical user, maintainer, security, and migration documentation plus CI,
  Playwright, accessibility, and performance gates.
- No runtime dependency from MkDocs, Zensical, React, Grafana, or labs on the
  Studio package.

## Goals

- Create a new private `topoviewer-studio` application package with a
  canvas-first product shell.
- Reuse the current renderer, validation, graph semantics, mapper logic, and
  proven authoring mutations instead of rewriting them.
- Make object creation direct: drag a template from the palette and drop it on
  the canvas in one gesture.
- Render every supported style attribute dynamically from canonical authoring
  metadata, with Basic and All views.
- Let users add or remove Basic fields, hide, search, and reorder fields without
  changing the runtime YAML contract or filling every row with profile controls.
- Explain effective style provenance and make edit scope explicit.
- Render telemetry mapper fields from canonical metadata and reuse the same
  style editor for mapper states and target object kinds.
- Keep browser and VS Code hosts thin and behaviorally identical.
- Preserve comments, ordering, unknown fields, and unsupported future fields
  during structured edits wherever technically possible.
- Replace the public Harness UI only after measured behavioral parity,
  accessibility, performance, security, and reliability gates pass.

## Scope

- product information architecture and interaction design;
- `packages/topoviewer-studio/` application and browser host;
- explicit Studio host contract for browser and VS Code;
- canonical style and mapper authoring metadata;
- specification-driven forms and user field-profile overrides;
- document session, AST-safe mutation, history, recovery, and persistence;
- drag-to-create palette, direct connection handles, contextual Inspector, and
  lazy YAML/diagnostics drawer;
- mapper authoring, sample telemetry, inference, and coverage diagnostics;
- presentation, preview, bundle export, documentation snippets, and Grafana
  bundle packaging without destination-specific authoring modes;
- migration from the existing Browser Harness and VS Code webview;
- production-readiness validation, documentation, release, and rollback.

## Ownership

- `packages/topoviewer` owns renderer/runtime behavior, schema, validation,
  style resolution, provenance, and pure authoring metadata.
- `packages/topoviewer-studio` owns the authoring session, commands, product UI,
  palette, Inspector, YAML workspace, mapper UI, and browser host.
- `packages/vscode-topoviewer` owns only VS Code workspace access, messages,
  file watching, CSP, and Studio mounting.
- MkDocs, Zensical, React, Grafana, and labs consume exported bundles or built
  runtime artifacts; they do not own Studio state.

## Non-Goals

- separate Studio products for documentation, Grafana, or presentation;
- a general-purpose whiteboard or PowerPoint replacement;
- multi-user real-time collaboration or a hosted backend;
- network-lab deployment, Grafana administration, or NOC operations;
- replacing NetBox, Infrahub, Kubernetes, or inventory systems;
- silently deploying bundles into production systems;
- publishing Studio as a stable npm library before its contracts settle;
- rewriting the TopoViewer renderer or discarding existing authoring tests.

## Compatibility And Migration

Existing TopoViewer YAML remains the compatibility contract. Studio must import
current bundles without semantic loss and export bundles accepted unchanged by
the current renderer and integration surfaces.

The existing Harness remains available during migration as a comparison and
rollback surface. Studio first publishes at `/studio/`. The `/harness/` route
changes only after parity and public-readiness gates pass. Removal of the old UI
occurs in a separate, reviewable deletion step after the redirect has proven
stable.

## Production-Grade Exit

Studio is not production-grade merely because feature parity exists. The
change may be archived only when:

- the primary authoring loop is measurably faster and clearer than the Harness;
- the complete public style and mapper contracts are reachable from the UI;
- browser and VS Code hosts pass the same behavioral suite;
- imported YAML survives structured edits without silent data loss;
- interaction and bundle budgets pass on representative dense topologies;
- keyboard, screen-reader, contrast, focus, and reduced-motion checks pass;
- hostile-input, persistence-recovery, file-conflict, and export tests pass;
- local and remote CI are green on a clean committed tree;
- public documentation and support status match the delivered product.
