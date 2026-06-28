## Design

### Product Direction

Phase 4 is primarily a mounted-source and mapper-foundation phase. The
user-facing question is:

```text
I already have TopoViewer YAML. How do I turn it into a live Grafana topology
panel and know exactly which telemetry maps to which objects?
```

The answer must not be:

```text
Create a drawing elsewhere, paste it into Grafana, then maintain a separate
graphics-layer element-ID mapping configuration.
```

TopoViewer's advantage is topology-as-code. The panel should use that advantage
directly.

### Target User Workflow

The desired user workflow is intentionally small and supports more than one
topology:

```text
1. Author topology/style in the browser harness or VS Code harness.
2. Author the TopoViewer mapper with schema-backed YAML assist.
3. Save one or more bundles, each containing:
   - `*.topo.tv.yaml`
   - `*.style.tv.yaml`
   - `*.mapper.tv.yaml`
4. Mount the bundle root into the Grafana container that has the TopoViewer
   plugin.
5. Select a bundle in the panel.
6. Configure Grafana queries or use mapper-provided starter queries.
7. The panel validates YAML, validates mapping coverage, and renders the
   operational topology.
```

The user must not need to:

- know this repository's internal content structure;
- edit `packages/topoviewer/content/examples/catalog.yaml`;
- run `npm run grafana:fixtures:sync`;
- rebuild or restart the plugin for every topology or bundle change;
- understand generated fixture internals.

Generated harness fixtures remain useful for examples and regression tests, but
they are not the Phase 4 product workflow.

### Phase Boundary

Phase 4 proves the ergonomic foundation:

- mounted bundle discovery and selection;
- backend delivery of topology, stylesheet, and mapper YAML;
- schema-backed mapper authoring;
- generic metric-to-object mapping;
- target-specific runtime overlays;
- mapping coverage and diagnostics;
- starter PromQL guidance.

It does not require polished production dashboards for every operational
playbook. Node health, service path SLO, and routing adjacency remain important
use cases, but in this phase they are validation examples for the mapper
foundation. Dedicated dashboards, screenshots, and workflow docs for each
playbook should be handled by follow-up implementation specs after this
foundation is stable.

### SVG-First Workflow Benchmark

Generic SVG-first panel workflows usually follow this shape:

```text
drawing tool / SVG diagram
  + panel YAML / site config
  + Grafana data targets
  -> graphics-layer element state changes
```

TopoViewer should be at least two-factor better for topology use cases:

1. The source artifact is topology/style YAML, not an SVG drawing.
2. Telemetry binding uses topology object identity and selectors, not manually
   managed graphics-layer element IDs.

Practical ergonomic targets:

- no external graphics editor for the happy path;
- fewer required artifacts for a working dashboard;
- source validation before telemetry debugging;
- mapping coverage shown in the panel;
- generated starter PromQL and metric-label examples;
- clear unmatched/ambiguous/stale mapping diagnostics.

### Mounted Bundle Source Model

Add an explicit mounted bundle source to panel options.

```ts
export type TopoViewerGrafanaSourceMode =
  | 'mountedBundle'
  | 'fixture';

export interface TopoViewerGrafanaMountedBundleSource {
  bundleRoot: string;
  manifestPath?: string;
  selectedBundleId?: string;
}
```

Initial defaults should point to a conventional mounted bundle root:

```text
/etc/topoviewer/bundles/
```

Each bundle directory contains one complete topology runtime set:

```text
/etc/topoviewer/bundles/
  clos-prod/
    clos-prod.topo.tv.yaml
    clos-prod.style.tv.yaml
    clos-prod.mapper.tv.yaml
  wan-prod/
    wan-prod.topo.tv.yaml
    wan-prod.style.tv.yaml
    wan-prod.mapper.tv.yaml
```

An optional manifest can provide display names, ordering, and explicit paths:

```yaml
version: "0.1"
bundles:
  - id: clos-prod
    name: CLOS Production
    topology: bundles/clos-prod/clos-prod.topo.tv.yaml
    stylesheet: bundles/clos-prod/clos-prod.style.tv.yaml
    mapper: bundles/clos-prod/clos-prod.mapper.tv.yaml
    default: true
  - id: wan-prod
    name: WAN Production
    topology: bundles/wan-prod/wan-prod.topo.tv.yaml
    stylesheet: bundles/wan-prod/wan-prod.style.tv.yaml
    mapper: bundles/wan-prod/wan-prod.mapper.tv.yaml
```

If no manifest exists, the backend should discover immediate child directories
that contain exactly one `*.topo.tv.yaml`, exactly one `*.style.tv.yaml`, and
exactly one `*.mapper.tv.yaml`. Discovery must be deterministic and must not
recurse arbitrarily.

The panel plugin runs in the browser, so it cannot directly read container files
without a delivery mechanism. Phase 4 must therefore provide one of these
implementation paths:

1. A lightweight Grafana backend/resource endpoint in the plugin that serves the
   selected mounted bundle to the panel frontend.
2. A documented Grafana provisioning step that copies mounted bundle YAML into
   panel dashboard JSON before runtime.

The preferred implementation is the backend/resource endpoint because it lets
operators add, remove, or update bundles without rebuilding the plugin or
editing dashboard JSON.

`fixture` mode remains for local demos and CI parity only. It is not the primary
user-facing workflow.

### TopoViewer Mapper YAML

`*.mapper.tv.yaml` is the missing ergonomic artifact. It should make object
binding explicit and reviewable without forcing users to write the normalized
internal mapper shape by hand. The preferred authoring form is `rules:`:

```yaml
version: 1
identity:
  sourceId: clos-prod
  sourceIdLabel: source_id
rules:
  - id: link-utilization
    metric: topoviewer_link_utilization_percent
    select: link
    join: link_id
    value: percent
    states:
      busy: ">=70"
      saturated: ">=90"
    style:
      default:
        lineColor: "#4caf50"
        label: "{{ value | round }}%"
      busy:
        lineColor: "#ff9800"
        lineWidth: 4
      saturated:
        lineColor: "#d32f2f"
        lineWidth: 7
        label: "{{ state }} {{ value | round }}%"
```

The product contract is fixed: telemetry binding is explicit in
`*.mapper.tv.yaml`, not hidden in code or scattered across dashboard JSON. The
implementation may normalize `rules:` into canonical `mappings:` internally,
but the public happy path should remain compact.

The mapper should be any-to-any in the ergonomic sense: any supported Grafana
metric series can target any supported TopoViewer object kind when the mapper
declares how to resolve the object set and which overlay adapter to apply.

The generic mapper pipeline is:

```text
Grafana data frame series
  -> metric selector
  -> object resolver
  -> value extractor
  -> optional state classification
  -> runtime TopoViewer style patch
```

The production mapper should not be limited to fault-management or link
weathermap conventions. Its stronger mental model is state-driven runtime
stylesheet policy:

```text
Grafana data-frame sample
  -> mapper metric
  -> TopoViewer object set
  -> state name from simple expressions such as "==0" or ">=90"
  -> style.default plus style.<state>
```

That lets a user map any supported metric to any available TopoViewer object
set and then change any supported style key at runtime without mutating
`*.style.tv.yaml`. Canonical `mappings:` and conditional style patches remain
available for advanced cases such as label/data joins, endpoint joins,
aggregate targets, or value/label/field conditions.

Supported target kinds should be:

```text
node
link
path
region
layer
graph
```

`layer` and `graph` are aggregate targets. They do not map to a single rendered
element by default; instead they can drive aggregate badges, summary state,
focus, filtering, or child-object propagation.

Resolver modes should include:

```text
id                  metric label equals object id
label               metric label equals object.labels[key]
data                metric label/value equals object.data[key]
endpoint            source/target metric labels resolve a link
selector            TopoViewer selector resolves an object set
aggregate           metric resolves a layer/region/graph aggregate
staticObjectIds     explicit object ID list in mapper YAML
```

Compact examples:

```yaml
rules:
  - id: link-state
    metric: topoviewer_link_up
    select: link
    join: link_id
    value: up
    states:
      down: "==0"
    style:
      default:
        label: UP
        lineColor: "#4caf50"
      down:
        label: DOWN
        lineColor: "#d32f2f"
        lineStyle: dashed

  - id: pe-cpu-runtime-style
    metric: device_cpu_percent
    select: node
    join: node_id
    value: percent
    states:
      busy: ">=80"
      saturated: ">=90"
    style:
      busy:
        label: "{{ target.id }} CPU {{ value | round }}%"
        backgroundColor: "#ff9800"
        borderColor: "#ed6c02"
      saturated:
        label: "{{ target.id }} CPU {{ value | round }}%"
        backgroundColor: "#d32f2f"
        borderColor: "#c62828"
```

This is still controlled, not arbitrary code execution. The user should not
write JavaScript functions in the mapper. The schema defines the resolver modes,
value extraction modes, state expressions, overlay adapters, and conditional
style patches. `rules:` is optimized for hand-authoring; canonical `mappings:`
is the normalized advanced form.

The mapper must be schema-backed. The same schema should power:

- Grafana panel validation;
- browser harness YAML assist;
- VS Code harness YAML assist;
- documentation reference tables;
- unit tests for valid and invalid mapper examples.

Harness suggestions should be topology-aware. When the author edits
`*.mapper.tv.yaml`, suggestions should include:

- metric families and supported overlay modes;
- compact `rules:` keys such as `select`, `join`, `value`, `states`, and
  `style`;
- valid join labels such as `node_id`, `link_id`, `path_id`, and `region_id`;
- discovered topology object IDs;
- discovered labels and data keys from the paired `*.topo.tv.yaml`;
- valid threshold fields and value types;
- valid condition keys for value, label, field, and severity checks;
- TopoViewer style keys and typed style values inside mapper `style:` patches;
- starter PromQL based on the mapper identity and selected object kind.

The end state should feel like authoring help, not just JSON-schema validation.
For example, if a link join rule is being edited, the harness should suggest
`object: link.id`, known link IDs, and warn when endpoint matching is ambiguous
because the topology has parallel links.

### Source Diagnostics

Source diagnostics should distinguish:

- missing mounted bundle root;
- empty bundle root;
- duplicate bundle IDs;
- invalid bundle manifest;
- missing selected bundle;
- missing mounted topology file for the selected bundle;
- missing mounted stylesheet file for the selected bundle;
- missing mounted TopoViewer mapper file for the selected bundle;
- backend/resource endpoint unavailable;
- YAML parse error;
- invalid document shape;
- TopoViewer composition/validation error;
- TopoViewer mapper schema error;
- TopoViewer mapper rule that references missing topology objects, labels, or
  data keys;
- empty graph;
- unsupported renderer limit.

These diagnostics should block misleading telemetry overlays. If source loading
fails, the panel should not pretend telemetry mapping is the issue.

### Mapping Diagnostics

Mapping diagnostics are the primary differentiator.

It should inspect:

- compiled nodes;
- compiled links;
- compiled paths;
- regions;
- layers;
- labels;
- data keys;
- TopoViewer mapper rules;
- Grafana data-frame labels;
- current telemetry mapping results.

It should report:

- matched telemetry samples;
- unmatched telemetry samples;
- topology objects with no current telemetry;
- duplicate metric samples for one object;
- ambiguous endpoint matches;
- stale IDs;
- recommended stable labels;
- mapper rules that do not match any topology object;
- topology objects that receive no telemetry for selected rules.

Recommended canonical metric labels:

```text
node_id
link_id
path_id
region_id
source
target
site
pod
rack
role
service
tenant
```

Stable object IDs are primary. Labels and data selectors are useful for grouping
and filtering, but they should not replace object IDs for precise metric joins.

### Query Starters

The mapper can include starter queries, and the panel should also be able to
suggest them from the mapper/topology pair:

```promql
topoviewer_link_up{source_id="$sourceId"}
topoviewer_link_utilization_percent{source_id="$sourceId"}
topoviewer_node_up{source_id="$sourceId"}
topoviewer_node_cpu_utilization_percent{source_id="$sourceId"}
topoviewer_service_latency_ms{source_id="$sourceId"}
topoviewer_bgp_session_up{source_id="$sourceId"}
```

`source_id` should come from `*.mapper.tv.yaml` identity. This prevents the
old fixture-only model from leaking into production workflows.

### Mapper Overlay Foundation

Phase 4 should make overlay execution generic enough to extend beyond the old
code-only link weathermap path:

- a telemetry sample can target a node, link, path, region, layer, or graph;
- mapper rules decide the target kind, resolver mode, value field, threshold
  policy, and runtime overlay behavior;
- mapper conditions can apply TopoViewer style patches based on value,
  data-frame label, data-frame field, or computed severity;
- mapper style patches can use templates such as `{{ value | round }}`,
  `{{ severity }}`, `{{ metric }}`, `{{ target.id }}`, `{{ label.name }}`, and
  `{{ field.name }}`;
- overlay adapters reject unsupported style controls for a target kind;
- `layer` and `graph` targets can aggregate state and optionally propagate to
  child objects.

All overlays should remain runtime overlays. They must not mutate source YAML.
This follows Grafana's display-policy model: query/data-frame values are
classified by mapper rules, then the visualization changes its presentation.
In TopoViewer terms, `*.style.tv.yaml` remains the static diagram baseline,
while `*.mapper.tv.yaml` owns runtime states and operational style overlays.
Mapper palettes remain available for canonical severity helpers, but compact
rules should prefer explicit `style.default` and `style.<state>` patches.

Dedicated operational playbooks are intentionally deferred:

- node health and capacity dashboard behavior;
- service path SLO and blast-radius dashboard behavior;
- routing adjacency health dashboard behavior.

Those playbooks should reuse this generic mapper foundation rather than adding
hard-coded metric behavior to the panel.

### Documentation

Docs should be written as workflows, not just APIs:

1. Author TopoViewer YAML.
2. Author `*.mapper.tv.yaml` with schema-backed harness suggestions.
3. Save one or more bundles.
4. Mount the bundle root into Grafana.
5. Select a bundle in the panel.
6. Validate source and mapper.
7. Inspect discovered topology objects.
8. Configure Grafana queries from mapper starters.
9. Review mapping coverage.
10. Inject or observe telemetry.
11. Interact with the panel.

### Acceptance

Phase 4 is accepted when a user can mount a bundle root containing at least two
topology bundles into the Grafana container, select either bundle in the panel,
see the selected topology, map Prometheus samples through `*.mapper.tv.yaml` to
at least one link and one node, inspect coverage and starter PromQL, and
diagnose unmatched or ambiguous telemetry without touching repository fixture
catalogs, generated fixture sync, plugin rebuilds, or SVG.

### Production Readiness Gate

Feature acceptance is not the same as production readiness. Before this phase is
archived or treated as production-ready, the current patch set must also prove:

- live Phase 4 Grafana smoke still passes after mounted manifest and source
  diagnostic hardening;
- full `npm run ci` passes with generated-output checks in the intended state;
- generated artifacts are reviewed so build output is not committed by accident;
- the dirty worktree is split into reviewable conventional commits;
- Phase 5 remains blocked until this gate passes.

This gate exists because Phase 4 touches plugin backend delivery, frontend panel
runtime, mapper parsing, docs, generated assets, lab dashboards, and CI. Calling
it production-ready without a final integrated smoke would hide the riskiest
failure mode: the unit-tested mapper foundation working while the real Grafana
dashboard path regresses.
