## Why

TopoViewer needs to stand out in very large, densely populated environments. Rendering every object with equal priority does not help operators find service impact, blast radius, or the reason a topology matters.

The attention engine makes dense topology usable by deriving focused, explainable views from complete graph facts.

## What Changes

### 1. Add dense-topology measurement before feature work

Create generated dense fixtures and benchmark probes so scale regressions are visible before renderer internals change.

### 2. Add a semantic graph index

Build an immutable runtime index over IDs, labels, `data.*` fields, regions, paths, parent-child membership, adjacency, and reverse adjacency.

### 3. Add a focus query API

Expose a runtime API for selecting focused, related, and context objects by selectors, labels, data predicates, paths, regions, and dependency depth.

### 4. Add progressive disclosure

Support aggregate overview graphs for dense environments without mutating the source graph. Aggregates preserve counts, severity summaries, and membership references.
Explicit click-to-expand drill-down is the primary operator workflow because it preserves user intent. Viewport thresholds can remain as an optional host policy for map-style overview/detail transitions. Parallel-link grouping can summarize dense link bundles by endpoint and layer thresholds.

### 5. Add explainable importance scoring

Rank visible objects using deterministic scoring factors such as focus match, path membership, operational severity, dependency fanout, recent changes, and context proximity.

### 6. Add operator focus workflows

Support object focus, path focus as a specific object workflow, upstream/downstream dependency focus, blast-radius focus, and change focus while retaining dimmed context by default.

### 7. Add scale-first rendering guardrails

Cache indexes and derived views, preserve layout stability, and add rendering optimizations only after benchmark data shows where they are needed.

## Capabilities

### New Capabilities

- `topology-attention-engine`: Semantic focus, progressive disclosure, importance scoring, operator focus modes, and dense topology performance guardrails.

### Modified Capabilities

- None for the initial planning change. Existing rendering, stylesheet, schema, export, and MkDocs behavior should remain compatible unless later implementation tasks explicitly modify their specs.

## Impact

- `packages/topoviewer/src/core/*` - new attention/index/focus/reduction/scoring modules and integration with compiler/layout/rendering.
- `packages/topoviewer/src/components/*` - optional focus controls and visual state integration.
- `packages/topoviewer/examples/test-cases` - dense topology fixtures and focus workflow examples.
- `packages/topoviewer/scripts/*` - benchmark and validation scripts.
- `packages/topoviewer/docs/*` and `docs/*` - high-level product docs plus generated examples.
- `packages/topoviewer/schemas/*` - only if runtime options or authored attention metadata need schema support.
- `packages/mkdocs-topoviewer` - asset sync and embed support for focused views when renderer behavior changes.
