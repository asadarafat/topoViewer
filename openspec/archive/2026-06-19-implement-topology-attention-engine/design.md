## Context

TopoViewer currently renders authored graph facts through compiler, layout, style, and React component layers. It has validation and renderer limits, but dense environments still depend on authors manually reducing the graph before rendering.

The attention engine should add derived views over complete source topology. It must not make TopoViewer responsible for polling, inventory collection, alarm transport, or live operational data storage. Hosts can provide those facts through existing `labels` and `data.*` fields or future schema extensions.

## Goals / Non-Goals

**Goals:**

- Keep dense source graphs complete while deriving operator-focused views.
- Add a reusable semantic index shared by React, embed, export, and MkDocs use cases.
- Add a runtime focus contract before adding UI controls.
- Make scoring deterministic and explainable.
- Build with TDD: fixtures, unit tests, Playwright scenarios, and benchmarks before or alongside implementation.
- Preserve compatibility with existing authored topology documents.

**Non-Goals:**

- Replacing the entire renderer in the first implementation.
- Requiring Canvas or WebGL before benchmarks justify it.
- Adding live data transport, polling, inventory adapters, or alarm-source integrations.
- Requiring authors to model every grouping in a new schema before existing regions, parent-child nodes, labels, and paths are used.

## Decisions

### 1. Add attention as core runtime modules

Create a focused core area, for example:

```text
packages/topoviewer/src/core/attention/
  index.ts
  focus.ts
  reduction.ts
  scoring.ts
  labels.ts
  types.ts
```

The module boundary keeps attention behavior testable without requiring React rendering. React components consume derived view state after core logic is covered by unit tests.

Alternatives considered:

- Put all behavior in `TopoViewer.tsx`: faster initial wiring, but hard to test and reuse in exports.
- Add attention only through stylesheets: useful for presentation, but insufficient for dependency traversal, aggregation, scoring, and caching.

### 2. Runtime API first, schema shortcuts later

The first stable contract should be a TypeScript runtime API:

```ts
type FocusQuery = {
  ids?: string[];
  labels?: Record<string, string | string[]>;
  data?: Record<string, unknown>;
  pathIds?: string[];
  regionIds?: string[];
  dependency?: {
    from: string[];
    direction: 'upstream' | 'downstream' | 'both';
    depth: number;
  };
  mode?: 'highlight' | 'dim-context' | 'hide-context';
};

type FocusResult = {
  focusedIds: Set<string>;
  relatedIds: Set<string>;
  contextIds: Set<string>;
  reasons: Map<string, string[]>;
};
```

Schema-level authored defaults can be added after runtime behavior is proven.

Alternatives considered:

- Add YAML schema fields first: makes authoring visible early, but risks locking the model before behavior is measured.
- Expose only UI state: easier for one app, but not reusable by MkDocs, embed, or exports.

### 3. Treat reduction as a derived graph, not source mutation

Reduction produces a derived view model with aggregate nodes/links and membership metadata. It does not rewrite the source graph. Expand/collapse state selects which derived objects are visible.

This allows:

- Stable source validation.
- Repeatable exports.
- Cache invalidation keyed by source hash plus focus/reduction state.
- Future comparison between raw and aggregate views.

Public examples should teach the operator workflow with compact authored
topologies. Large generated graphs belong in stress fixtures and benchmarks, not
as the primary documentation surface. The public dense-collapse example should
show summary metadata, counted aggregate links, and drill-down behavior without
making users read hundreds of generated YAML lines.

Explicit click-to-expand behavior should be the primary dense-topology pattern.
Zoom-driven expansion is useful only as an advanced host policy for experiences
that deliberately mimic map-scale overview/detail transitions; it is too
implicit for the default operator workflow.

### 4. Keep scoring deterministic and inspectable

Scoring should start with explicit weighted factors, not machine-learned or host-specific heuristics. Each score includes reasons. This supports author debugging and test assertions.

Initial factors:

- Direct focus match.
- Path membership.
- Operational severity from known `data.*` fields.
- Dependency fanout.
- Recent change marker.
- Context proximity to focused objects.

### 5. Separate attention state from style overrides

Core attention state should classify objects as focused, related, context, dimmed, hidden, aggregate, or suppressed. Stylesheets can override presentation, but they should not be required for useful defaults.

### 6. Benchmark before renderer backend changes

SVG/React Flow may be enough for aggregate overviews and focused subgraphs. Canvas/WebGL, workers, and viewport culling should be introduced only after probes show the bottleneck.

## SDD / TDD Workflow

The implementation should use OpenSpec artifacts as the SDD source of truth:

1. Requirements in `specs/topology-attention-engine/spec.md` define expected behavior.
2. Tests are written from scenarios before or alongside code.
3. Design decisions in this file guide module boundaries and trade-offs.
4. `tasks.md` is updated as tasks complete or scope changes.

Test layers:

- Unit tests for index, focus, reduction, scoring, and label priority.
- Semantic tests for dense fixtures and invalid attention metadata.
- Playwright tests for operator workflows.
- Benchmark scripts that write JSON for scale comparisons.
- Export tests for focused SVG/PNG/PDF state where practical.

## Migration Plan

1. Add dense fixtures and benchmarks without changing renderer output.
2. Add index and focus APIs as exported core utilities.
3. Integrate focus-derived visual state with the React component behind optional props.
4. Add reduction and aggregate rendering behind explicit runtime options.
5. Add default controls only after the runtime contract is stable.
6. Add schema shortcuts or authored defaults only after runtime behavior is proven.

Rollback is straightforward for early phases because new behavior can remain opt-in. Once defaults change for dense graphs, keep an escape hatch that renders the raw graph with current behavior.

## Risks / Trade-offs

**Risk: Attention behavior becomes too product-specific**
-> Mitigation: keep core primitives generic and let hosts supply domain-specific `labels` and `data.*` conventions.

**Risk: Aggregation hides important detail**
-> Mitigation: aggregate summaries include severity and counts; focused or high-severity children can force visibility.

**Risk: Scoring feels opaque**
-> Mitigation: every score has reason metadata and debug output.

**Risk: Renderer optimization work starts too early**
-> Mitigation: require benchmark evidence before worker, Canvas, or WebGL work.

**Risk: Existing diagrams change unexpectedly**
-> Mitigation: make attention features opt-in until defaults are explicitly changed and covered by visual regression tests.

## Resolved Design Questions

### Grouping model

Use existing regions, parent-child nodes, labels, and paths first. Do not add a first-class `graph.groups` model in the initial attention-engine implementation.

The current model already gives authors several grouping tools:

- `graph.regions` for spatial, administrative, or operational boundaries.
- Parent-child nodes for containment.
- Labels for semantic groups such as role, tenant, site, service, vendor, or failure domain.
- Paths for ordered service, traffic, or dependency relationships.

Only add `graph.groups` later if implementation work exposes real cases that cannot be modeled cleanly with those primitives. Deferring this keeps the schema smaller while the runtime attention behavior is proven.

### Built-in severity semantics

Provide a small default convention for common `data.*` severity fields, but keep it host-overrideable.

Initial built-in scoring hints should recognize:

- `data.severity`
- `data.status`
- `data.health`
- `data.alarmSeverity`
- `data.operState`
- `data.adminState`
- `data.changedAt`
- `data.revision`

Common values such as `critical`, `major`, `minor`, `warning`, `degraded`, `down`, `maintenance`, and `changed` can contribute to attention scoring. Hosts must be able to override or extend the mapping because inventory, alarm, and observability systems use different field names and value vocabularies.

### Default UI boundary

Keep `TopoViewer` focused on runtime state, rendering, callbacks, and default visual treatment. Put richer controls in `TopoViewerWorkbench`.

`TopoViewer` should accept attention props and render focused, related, context, dimmed, hidden, aggregate, and suppressed states. It should not force embedders to accept a built-in investigation UI.

`TopoViewerWorkbench` should own operator controls such as focus mode, dependency depth, dim/hide mode, label density, aggregate expansion, search, and focused-result navigation.

### URL and Markdown representation

Represent attention state as a compact serializable object.

URLs should encode lightweight, shareable current-view state, for example:

```text
#focus=path:svc-1001&mode=dim-context&depth=2
```

Markdown blocks should encode authored default state explicitly:

```yaml
attention:
  focus:
    pathIds: [svc-1001]
    mode: dim-context
    dependency:
      direction: both
      depth: 2
  labels:
    density: focused
```

Use URLs for transient sharing and Markdown for durable documentation defaults.

### Export formats

Make SVG the first reliable export target for preserving attention state. SVG is closest to the current rendered visual model and can preserve dimming, aggregation, label priority, and styling as inspectable vector output.

Support PNG as a rendered snapshot after SVG/DOM export is stable. Treat PDF as a later hardening target, likely through SVG or image embedding, unless explicit layout guarantees are added.

Export reliability target:

- SVG: must preserve active attention state.
- PNG: should preserve active attention state as a snapshot.
- PDF: best effort until the export pipeline has explicit layout guarantees.
