# Topology Attention Roadmap

TopoViewer should distinguish itself in very large, densely populated environments by showing what matters first. It should not behave like a generic graph canvas that happens to accept network-shaped data. The product direction is a topology attention engine: preserve dense graph context, but make the relevant service, path, failure domain, or operational signal obvious.

## Product Thesis

Large topology views fail when every node, link, label, and metric competes for attention at the same priority. TopoViewer should keep the source graph complete while deriving focused views that answer operator questions quickly:

- What is important right now?
- What changed?
- What depends on this object?
- What does this object depend on?
- Which path, service, region, or failure domain explains the current view?

The renderer should support three simultaneous goals:

- Keep spatial context so users do not get lost.
- Reduce visual noise without deleting the underlying graph facts.
- Make focus changes fast enough for repeated investigation.

## Attention Capabilities

### Semantic Filtering

Users should be able to focus by topology meaning, not only by text search. Filters should operate over stable graph facts:

- Node, link, path, and region kind.
- Labels such as `site`, `role`, `vendor`, `service`, `tenant`, `protocol`, and `failure-domain`.
- `data.*` fields such as alarm state, utilization, ownership, SLA, maintenance state, or last-change timestamp.
- Path membership and region membership.
- Neighbor, dependency, or blast-radius depth.

The first implementation should expose this as a runtime API and a stylesheet-compatible selector model. UI controls can come after the semantic contract is stable.

### Progressive Disclosure

Densely populated views should start from useful aggregates:

- Collapse regions, sites, pods, racks, VRFs, service chains, or device groups.
- Show counts and severity summaries on collapsed objects.
- Expand selectively without recomputing the whole layout.
- Preserve parent-child and region membership relationships as the reduction source of truth.

The target behavior is overview first, drill-down second, with the source graph still available for exact inspection.

### Importance Scoring

TopoViewer should derive an importance score per visible object. Initial scoring should be deterministic and explainable:

- Direct match to the active focus query.
- Alarm, degraded, or maintenance state.
- Path membership for the selected service or flow.
- Dependency fanout and blast-radius centrality.
- Recent change markers.
- Traffic, utilization, or SLA severity when present in `data.*`.

Scores should drive default visibility, label priority, stroke weight, opacity, and z-order. The score must be inspectable in debug output so authors can understand why something is prominent.

### Context-Aware Labels

Labels should be treated as scarce attention budget:

- Always show labels for focused objects.
- Prefer labels for high-score objects.
- Suppress low-priority labels at wide zoom levels.
- Switch from detailed labels to count/severity labels on collapsed aggregates.
- Avoid overlapping labels where possible.

This should be implemented as deterministic label priority before adding any advanced layout heuristics.

### Path And Blast-Radius Views

Operator workflows should include first-class focus modes:

- Show a path and dim non-path context.
- Show upstream dependencies.
- Show downstream dependents.
- Show N-hop blast radius.
- Show objects changed since a selected timestamp or revision marker.

These modes should de-emphasize irrelevant graph areas rather than remove all context by default.

### Scale-First Rendering

The renderer should be designed around visible work:

- Build graph indexes once per document.
- Cache derived focus/reduction views by query.
- Cache layout for stable aggregates and expanded subgraphs.
- Cull off-viewport objects.
- Keep expensive derivation off the interaction path.
- Evaluate workers and Canvas/WebGL rendering once DOM/SVG limits are measurable.

## Implementation Plan

### Phase 0: Scale Baseline

Goal: make dense environments measurable before adding behavior.

Deliverables:

- Add generated large-topology fixtures for 1k, 5k, and 10k raw nodes with realistic labels, regions, paths, and links.
- Add performance probes for parse, semantic validation, index build, reduction, layout, first render, and focus updates.
- Add CI-friendly smoke thresholds for the 1k fixture and local-only benchmark scripts for larger fixtures.
- Document current bottlenecks before changing rendering internals.

Acceptance:

- A repeatable benchmark command exists.
- Results are saved as structured JSON.
- At least one dense fixture is rendered in Playwright without timing out.

### Phase 1: Semantic Index And Focus API

Goal: give TopoViewer a queryable graph core.

Deliverables:

- Build an immutable runtime index for IDs, labels, `data.*` fields, regions, paths, adjacency, reverse adjacency, and parent-child membership.
- Add a typed focus query API covering selectors, object IDs, labels, data predicates, path membership, region membership, and dependency depth.
- Return focus results as object sets plus reasons, not only booleans.
- Add semantic lint checks for attention-specific metadata where needed.

Acceptance:

- Unit tests prove the index handles nested regions, child nodes, paths, and broken references.
- Focus queries return stable object sets and reason metadata.
- No renderer behavior changes are required to use the API.

### Phase 2: Reduction And Progressive Disclosure

Goal: render useful overview graphs from dense source graphs.

Deliverables:

- Add a reduction pipeline that can collapse regions, parent nodes, or label-defined groups into aggregate objects.
- Preserve counts, severity summaries, and membership references on aggregate nodes and links.
- Support expand/collapse state without mutating the source graph.
- Add stylesheet hooks for aggregate objects.

Acceptance:

- A dense fixture can open as an aggregate overview.
- Expanding one region leaves unrelated layout stable.
- Aggregates expose count and severity summaries in labels and tooltips.

### Phase 3: Importance Scoring And Attention Styling

Goal: make the important objects visually dominant by default.

Deliverables:

- Add deterministic scoring weights for focus match, alarms, path membership, dependency centrality, recent changes, and operational severity.
- Add score outputs to debug tooling.
- Add default style mappings for focused, related, context, dimmed, and suppressed objects.
- Add label priority based on score and zoom level.

Acceptance:

- Focused objects are visually prominent without custom stylesheets.
- Authors can override scoring presentation through stylesheets.
- Debug output explains the top contributing score reasons.

### Phase 4: Interaction And Operator Workflows

Goal: turn attention primitives into repeatable workflows.

Deliverables:

- Add public APIs for path focus, upstream/downstream dependency focus, blast-radius focus, and change focus.
- Add embeddable controls for focus mode, depth, region expansion, label density, and dim/hide behavior.
- Add keyboard and accessibility support for moving through focused results.
- Add export support for the current focused view.

Acceptance:

- A user can select a service path and see it highlighted with surrounding context dimmed.
- A user can select a node and inspect upstream or downstream blast radius.
- Exported SVG/PNG/PDF reflects the active focus view.

### Phase 5: Rendering Scale Optimization

Goal: keep dense views interactive after the attention model is useful.

Deliverables:

- Add viewport culling for nodes, links, labels, callouts, and shapes.
- Cache layout and reduced graph results by source hash plus focus state.
- Move expensive index/reduction/layout work into a worker where measurement justifies it.
- Evaluate Canvas/WebGL for high-volume link and label layers while preserving React/SVG ergonomics for selected objects and controls.

Acceptance:

- Dense overview interactions stay responsive on representative hardware.
- Focus updates avoid full graph recomputation when only the query changes.
- Rendering backend decisions are backed by benchmark data.

## API Shape To Target

The first stable contract should be runtime-first:

```ts
type FocusQuery = {
  ids?: string[];
  labels?: Record<string, string | string[]>;
  data?: Record<string, unknown>;
  pathIds?: string[];
  regionIds?: string[];
  dependency?: {
    from: string[];
    direction: "upstream" | "downstream" | "both";
    depth: number;
  };
  mode?: "highlight" | "dim-context" | "hide-context";
};

type FocusResult = {
  focusedIds: Set<string>;
  relatedIds: Set<string>;
  contextIds: Set<string>;
  reasons: Map<string, string[]>;
};
```

Schema-level shortcuts can be added later, but the runtime API should come first so React, MkDocs, and future hosts share one behavior.

## Testing Strategy

- Unit tests for index construction, query results, scoring, and reduction.
- Semantic fixture tests for invalid attention metadata.
- Playwright tests for dense overview, expand/collapse, path focus, blast radius, and label density.
- Screenshot tests for default attention styling.
- Benchmark scripts that write JSON so regressions can be compared over time.

## Open Decisions

- Whether grouping should be modeled as new `graph.groups` objects or derived from existing regions, parent-child nodes, labels, and paths.
- Whether attention scoring belongs entirely in runtime options or can be partially declared in YAML.
- When to introduce Canvas/WebGL, if SVG plus culling is sufficient for the target graph sizes.
- How much UI belongs in the core React component versus host applications.
- How to encode live operational state updates without making TopoViewer responsible for polling or data transport.
