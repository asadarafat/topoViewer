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

## Open Questions

- Should grouping eventually have a first-class `graph.groups` model, or should regions, parent-child nodes, labels, and paths remain sufficient?
- Which `data.*` keys should receive built-in severity semantics versus staying host-defined?
- How much default UI belongs in `TopoViewer` versus `TopoViewerWorkbench`?
- How should attention state be represented in embeddable URLs or Markdown blocks?
- Which export formats can reliably preserve dimming, aggregation, and label-priority state without host-specific behavior?
