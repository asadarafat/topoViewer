# Browser Harness

**Support status:** Experimental

The browser harness is the fastest way to author and inspect TopoViewer YAML
without embedding it in another product.

## Run It

```bash
npm run vscode:harness
```

For the full docs preview, the harness is also available under the generated
site:

```bash
npm run docs:preview
```

Open `http://127.0.0.1:8001/topoviewer/harness/`.

## Authoring Workflow

1. Choose a template.
2. Edit topology, stylesheet, or mapper YAML.
3. Press `Apply` to validate and render the draft.
4. Use `Revert draft` to discard un-applied edits.
5. Drag nodes only when the layout is manual or pinned.
6. Use `Save` when the topology should survive browser refresh.
7. Use `Download bundle` when you need Grafana-ready source files.
8. Export the viewport when the rendered state is valid.

The canvas always keeps the last valid applied document. A broken draft should
show diagnostics without destroying the current viewport.

The YAML tab has three documents:

| Tab | File role | Grafana bundle suffix |
| --- | --- | --- |
| `Topology YAML` | Graph objects, layers, labels, data, layout hints, attention declarations. | `*.topo.tv.yaml` |
| `Stylesheet YAML` | Icons, label fields, layout options, and selector-driven visual style. | `*.style.tv.yaml` |
| `Mapper YAML` | Runtime telemetry rules that map Grafana data frames to TopoViewer object overlays. | `*.mapper.tv.yaml` |

`Download bundle` validates the draft and writes all three canonical files using
the current graph ID as the filename base. Use those files directly under a
Grafana mounted bundle directory.

## Mapper Coverage Preview

When `Mapper YAML` is active, the harness shows synthetic coverage against the
currently applied topology. It checks whether mapper rules can resolve objects
by ID, selector, labels, data keys, endpoints, aggregate targets, or static
object IDs before the bundle is mounted in Grafana.

The preview reports matched objects, unmatched rules, ambiguous endpoint rules,
duplicate targets, and stale object references. It does not replace Grafana
runtime coverage: Grafana recomputes coverage from real data frames and
Prometheus labels when the panel refreshes.

Use `Presets` in the Mapper YAML action row to insert a starter mapper document.
The comprehensive starter demonstrates ID matching, label matching, data
matching, endpoint matching, selector matching, status and badge overlays, label
overlays, layer aggregates, and graph summary overlays. Presets edit only the
draft; use `Apply` to accept them or `Revert draft` to discard them.

## Mapper Rule Builder

Use the Mapper YAML rule builder when you know the telemetry metric but do not
want to hand-write the full mapper shape. It inserts a canonical `mappings`
entry into the mapper draft.

The builder is topology-aware:

| Control | Uses topology data from | Mapper output |
|---|---|---|
| Target | graph object families | `target.kind` |
| Match by | resolver mode | `target.resolve.by` |
| Object | node, link, path, region, layer, or graph IDs | `objectIds` or an ID-oriented preview selector |
| Label key/value | existing `labels.*` keys and values | `resolve.by: label` |
| Data key | existing `data.*` keys | `resolve.by: data` |
| Endpoint pair | existing link source/target pairs | endpoint matching guidance |
| Value as | supported mapper value categories | `value.as` |
| Warning/error threshold | numeric thresholds | `thresholds.warning` and `thresholds.error` |
| Label and badge templates | mapper templates | `overlay.label` and `overlay.badgeLabel` |
| Default/state styles | TopoViewer style keys | `overlay.style` and `conditions[].style` |
| Propagate aggregate state | layer and graph aggregate workflows | `overlay.propagateToLayerMembers` |

The builder edits the mapper draft only. The canvas and coverage preview use the
last applied document until `Apply` succeeds.

## YAML Assist

Use `Ctrl+Space` or `Cmd+Space` in the editor for completions. Use `?` at
structural YAML positions for candidate keys and short explanations.

The assist model should be indentation-aware:

- root keys are suggested only at root indentation;
- graph keys are suggested under `graph`;
- node, link, path, and region fields are suggested in their own arrays;
- style keys and style values are suggested from the canonical style registry;
- mapper keys, target kinds, resolver modes, object IDs, layer IDs, labels, data
  keys, and overlay style keys are suggested from the mapper schema, style
  metadata, and currently applied topology.

## Export

The harness export button writes a PNG of the current viewport. Export is
disabled when blocking diagnostics prevent a reliable render.

## Harness Templates

The harness ships with templates that exercise the authoring workflow. Use them
as starting points for topology editing, mapper authoring, layout checks, and
attention behavior.

### Layered Network Authoring

The default template combines underlay, BGP, service, and operations layers so
the harness can demonstrate layer toggles, relationship editing, attention, and
diagnostics without starting from an empty graph.

```topoviewer
topology: examples/harness/layered-network/topology.yaml
stylesheet: examples/harness/layered-network/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Layered network authoring
```

### CLOS 2-Spine 4-Leaf

This template is the smallest practical automatic-layout fabric: two spines,
four leaves, and full leaf-to-spine mesh links.

```topoviewer
topology: examples/harness/clos-2spine-4leaf/topology.yaml
stylesheet: examples/harness/clos-2spine-4leaf/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: CLOS 2-spine 4-leaf
```

### Insert Workflow

Use this template to exercise node, link, region, path, and note creation from
the Build panel while keeping declared layers populated.

```topoviewer
topology: examples/harness/insert-workflow/topology.yaml
stylesheet: examples/harness/insert-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Insert workflow
```

### Attention Workflow

Use this template to edit object focus, path focus, dense-link grouping, and
region aggregation against a small multi-layer service topology.

```topoviewer
topology: examples/harness/attention-workflow/topology.yaml
stylesheet: examples/harness/attention-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Attention workflow
selectedLayerIds:
  - underlay
  - service
  - operations
```

### Inspector Workflow

Use this template to inspect and edit labels, data, positions, and relationship
endpoints across routers, a firewall, a service, links, and a callout.

```topoviewer
topology: examples/harness/inspector-workflow/topology.yaml
stylesheet: examples/harness/inspector-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Inspector workflow
```

### Dense Link Grouping

Use this template to tune parallel-link grouping and bundle threshold behavior
without loading a large topology.

```topoviewer
topology: examples/harness/dense-links/topology.yaml
stylesheet: examples/harness/dense-links/stylesheet.yaml
height: 500px
controls: true
controlsOpen: false
title: Dense link grouping
```
