## Why

TopoViewer now has three public rendering surfaces:

- the browser harness / VS Code webview;
- MkDocs live viewport blocks;
- Zensical mirrored live viewport blocks.

They all use the same renderer package, but they do not yet have a formal
parity contract. The same topology and stylesheet can look different because
each surface owns part of the lifecycle: YAML composition, layer/toggle state,
theme variables, viewport dimensions, and bundled asset freshness.

This matters because the harness is becoming the authoring surface. A user who
authors a diagram in the harness expects the copied YAML to render the same way
in MkDocs and Zensical.

## What Changes

Create a formal renderer-surface parity contract and test strategy.

The change should:

- make topology/stylesheet composition a single shared runtime function;
- make the harness, MkDocs embed, and Zensical adapter consume that function;
- define a viewer-only visual parity test harness that crops to the TopoViewer
  viewport, not the surrounding documentation page;
- define a fixed parity viewport size and color scheme so React Flow `fitView`
  scale is comparable;
- keep normal product surfaces free to have different page chrome, but prevent
  graph geometry, node/icon sizing, edge visibility, label placement, and CSS
  variable resolution from diverging;
- add regression coverage for examples that previously exposed differences,
  including `graph/basic`, `harness/clos-2spine-4leaf`, SVG icon fixtures,
  region label placement, and label z-index;
- audit and fix viewport scale defaults so React Flow's default scale is the
  upper bound for automatic fit, preventing small diagrams from being enlarged
  differently in the harness than in docs;
- audit and fix aspect-sensitive node shapes so `square` and `circle` keep a
  1:1 body while `rectangle` and `ellipse` remain the intentional stretched
  forms;
- audit and fix region hull recomputation so draggable regions use the
  compiled node stack dimensions instead of stale hardcoded node defaults.
- define a documentation CSS boundary: MkDocs and Zensical may derive
  TopoViewer colors through `--topoviewer-*` variables, but they must not leak
  page-level sizing, padding, line-height, SVG/image sizing, or shape geometry
  into the rendered graph surface.

## Investigation Baseline

Current local checks after the CLOS diagnostic work:

- `npm run ci` stops at the generated-file gate because generated docs/examples
  are uncommitted. This is expected for the current worktree.
- The substantive CI lanes pass locally on Node 24:
  quality, schemas/semantics, TopoViewer tests, harness tests, perf smoke,
  package, build, MkDocs build, Zensical build, harness build, and docs smoke.
- Current built `harness/clos-2spine-4leaf`, MkDocs, and Zensical render the
  same graph object counts and the same CLOS edge path data. The visible scale
  differs because the harness canvas is taller and React Flow `fitView` scales
  the graph differently.
- Current built MkDocs and Zensical `graph/basic` do include edge DOM paths.
  The older audit screenshot that showed a missing link is therefore either a
  stale bundle/build issue or a visual regression not covered by current smoke
  assertions.
- A follow-up Playwright probe for `graph/basic` showed that harness and docs
  had proportional node-label stack geometry but different React Flow zoom:
  harness `2.30208`, docs `1.6875`. That means the label/icon vertical spacing
  difference came from auto-fit scale, not from different CSS spacing.
- The same probe clarified that React Flow zoom is uniform and cannot turn a
  square into a rectangle. The square/circle distortion came from TopoViewer
  applying unequal authored `width` and `height` to aspect-sensitive shapes.
- The scale fix exposed a related runtime assumption: draggable region hulls
  still recomputed member containment from static node defaults. That can put
  visible label/meta stacks outside a recomputed region after drag even when
  the node body is technically inside.
- A normal docs-page Playwright probe for `graph/basic` confirmed that MkDocs
  and Zensical both inherited documentation SVG sizing rules into node geometry:
  the authored node icon box stayed `84 x 60`, but the inner SVG and visible
  shape expanded to `84 x 84`. Harness kept the expected `84 x 60` SVG and
  `60 x 60` aspect-preserved shape. This is a host CSS leak, not a YAML or
  composition difference.

## Capabilities

### New Capabilities

- `renderer-surface-parity`: a shared composition, theme, viewport, and
  regression-test contract across harness, MkDocs, and Zensical.

### Modified Capabilities

- `topoviewer-embed`: must use the shared composition contract.
- `vscode-topoviewer-harness`: must expose a parity render route or mode that
  renders a selected fixture with the same viewer dimensions/theme as docs.
- `mkdocs-topoviewer`: must participate in parity tests with current vendored
  embed assets.
- `zensical-docs`: must participate in parity tests with synced embed assets.
- `ci-docs`: must include deterministic parity checks before publishing docs.
- `topoviewer-node-style`: must distinguish aspect-preserving `square` and
  `circle` from intentionally stretched `rectangle` and `ellipse`.
- `topoviewer-regions`: must recompute hulls from compiled member dimensions.
- `topoviewer-css-boundary`: must scope renderer geometry so documentation
  host CSS can only affect approved color variables, not graph dimensions,
  shape geometry, icon fit, labels, edge paths, controls, or padding.

## Non-Goals

- Do not make MkDocs, Zensical, and the harness page chrome identical.
- Do not compare full-page screenshots for parity; compare only the viewer
  viewport.
- Do not block product-specific theme wrappers when they resolve to the same
  graph geometry and supported style values under the parity theme.
- Do not replace existing smoke tests; add stricter parity tests beside them.
