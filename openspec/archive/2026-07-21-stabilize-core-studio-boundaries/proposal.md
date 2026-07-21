## Why

TopoViewer's validation and release gates are stronger than its current package
and application boundaries. The public core package has ambiguous module/type
metadata, ships documentation sources, and exposes broadly coupled runtime
responsibilities, while Studio bypasses the package boundary and concentrates
feature state and actions in oversized application modules.

Core must be stabilized before Studio is decomposed. Otherwise Studio would be
refactored against implementation paths that the package migration then changes,
creating avoidable code oscillation and duplicate verification work.

## What Changes

- Make `topoviewer` pass package lint and type-resolution checks for supported
  ESM consumers while preserving documented browser IIFE integration.
- Remove canonical documentation sources from the npm artifact and generate the
  npm-facing README from the canonical repository documentation fragment.
- Establish explicit renderer, authoring, integration, security, and export
  build boundaries with shared build policy and lazy export dependencies.
- Add packed-package consumer checks for ESM import, SSR import, type checking,
  tree shaking, and supported React/Node combinations.
- Define public API stability tiers without changing topology, stylesheet, or
  mapper YAML semantics.
- Remove Studio's direct aliases to core source and prove Studio against the
  built and packed package contract.
- Enforce application-to-feature dependency direction and replace broad canvas
  prop wiring with narrow feature models and actions.
- Split project/session, canvas, style, mapper, viewport, and export ownership
  out of the root Studio controller where measurement and existing behavior
  permit.
- Add task-oriented browser journeys and stable visual checks derived from
  real authoring workflows.
- Lower the initial Studio bundle budget only after measured code-splitting
  improvements.

## Capabilities

### New Capabilities

- `core-package-contract`: Consumer-correct package metadata, explicit build
  entries, lean artifacts, canonical package documentation, and packed-package
  compatibility verification.
- `studio-feature-boundaries`: Studio dependency direction, feature-owned
  models and actions, packed-core consumption, task-level browser verification,
  and measured bundle constraints.

### Modified Capabilities

None. The repository currently has no promoted root OpenSpec capability specs;
this change introduces the contracts without changing public YAML semantics.

## Impact

- Core package manifest, build configuration, public entry points, generated
  declarations, package README, artifact inspection, and CI workflows.
- Studio Vite/test resolution, application controller, canvas boundary,
  feature modules, dependency checks, browser tests, and bundle budgets.
- Root development scripts, lockfile, maintainer documentation, and release
  verification.
- MkDocs, Zensical, Grafana, VS Code, and browser embed remain consumers of the
  same topology/style/mapper contracts and must continue to pass parity checks.

External repositories, Containerlab, authentication, hosted persistence, and
deployment infrastructure are not runtime dependencies of this change.
