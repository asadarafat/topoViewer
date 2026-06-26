## Why

TopoViewer can already render manual and force-directed layouts, but CLOS-like
topologies need a different layout contract. A CLOS graph is best understood as
ordered connection stages with dense, mostly stage-to-stage links. Force layout
often obscures that structure, while manual coordinates do not scale.

The requested capability is an automatic graph layout directive that infers a
CLOS-style stage model from graph structure. It must not be tied to a data
center, network vendor, or fixed role vocabulary. Terms like leaf, spine, and
super-spine are useful examples of common CLOS stages, but the engine must
operate on generic graph topology and support more than three stages, including
large multi-stage fabrics.

## What Changes

Add a new `layout.mode: clos` directive that computes node positions using a
deterministic multi-stage CLOS layout algorithm.

The algorithm should:

- infer likely stages from graph structure when the author provides no layout
  metadata;
- treat directed `source` -> `target` hierarchy as the strongest automatic
  root-to-leaf signal when links form an acyclic staged graph;
- use endpoint count only as a fuzzy fallback when link direction cannot be
  used, with lower endpoint-count boundary nodes treated as root-side
  candidates;
- support up to at least ten inferred or declared stages;
- optionally consume generic author hints such as stage, group, pinned nodes,
  and orientation;
- keep `inferLabelRole` strictly opt-in and never infer stage order from
  ordinary role labels by default;
- place nodes by stage on one axis and by inferred group/order on the other;
- reduce edge crossings with stage-aware barycentric ordering;
- preserve existing manual node positions when pinned;
- remain renderer-agnostic and calculate positions only.

## Capabilities

### New Capabilities

- `graph-clos-layout-directive`: a schema, compiler, and layout algorithm
  contract for CLOS-style staged graph layouts.

### Modified Capabilities

- `topoviewer-layout`: adds `clos` as a layout mode beside `manual` and `force`.
- `topoviewer-schema`: validates CLOS layout options.
- `topoviewer-docs`: documents the directive and provides examples.
- `vscode-topoviewer-yaml-authoring`: suggests CLOS layout keys and values.

## Impact

- `packages/topoviewer/src/core/types.ts` - extend `LayoutConfig`.
- `packages/topoviewer/src/core/validation.ts` - validate CLOS layout options.
- `packages/topoviewer/src/core/layout.ts` or a new layout module - implement
  deterministic CLOS positioning.
- `packages/topoviewer/src/core/compiler.ts` - route `layout.mode: clos` through
  the new layout implementation.
- schemas under `packages/topoviewer/schemas/**` - expose the new contract.
- canonical content under `packages/topoviewer/content/**` - add docs and a
  small clear example.
- harness fixtures - add or update a CLOS example that relies on auto layout.
- tests - add unit, schema, docs, and Playwright coverage.

## Non-Goals

- Do not add an environment-specific role model.
- Do not require labels such as `leaf`, `spine`, or `super-spine`.
- Do not add a YAML root marker such as `rootNodeIds`; root detection should be
  inferred from graph structure.
- Do not treat `labels.role`, `labels.node`, or similar domain metadata as
  stage semantics unless the author explicitly configures `stageKey` or
  `inferLabelRole`.
- Do not render UI inside the layout engine.
- Do not replace manual or force layout.
- Do not guarantee mathematically optimal crossing minimization.
- Do not add a force-refinement step in this change; keep that as a later
  optional enhancement.
