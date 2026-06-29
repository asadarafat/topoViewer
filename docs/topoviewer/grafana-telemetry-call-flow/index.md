---
hide:
  - toc
---

# Grafana telemetry call flow

## What This Demonstrates

This example documents the production Grafana data path for TopoViewer. It uses
TopoViewer primitives to show the system boundaries: authoring, mounted source
files, Grafana plugin backend, Grafana panel runtime, Prometheus data frames,
mapper execution, runtime overlays, diagnostics, and local interaction state.

The important contract is that users author three files outside Grafana:

- `*.topo.tv.yaml` for topology facts;
- `*.style.tv.yaml` for the visual policy;
- `*.mapper.tv.yaml` for telemetry-to-object mapping rules.

Those files are mounted into Grafana under a bundle directory such as
`/etc/topoviewer/bundles/<bundle-id>/`. The Grafana plugin backend discovers the
bundle, validates that each canonical suffix is present once, parses the YAML,
and exposes the selected source documents to the panel frontend. Users should
not need to rebuild the plugin, edit a fixture catalog, or restart Grafana to
change ordinary topology, style, or mapper files.

Prometheus is the telemetry source, but it is not the source of topology truth.
Grafana queries Prometheus and passes the result as data frames to the panel. The
panel compiles the mapper rules, resolves each sample to TopoViewer objects, and
produces runtime-only overlays. These overlays can change style properties such
as link color, directional stroke width, labels, status markers, badges, or
outline treatment. They must not mutate the mounted topology or stylesheet YAML.

Optional recording rules can normalize raw metrics before Grafana queries them.
That normalization is integration glue, not the TopoViewer contract. A production
mapper should still be explicit about the metric, join labels, target kind, value
field, states, and style deltas it applies.

## Expected Result

The live viewport should render a bounded production call flow with four visible
responsibility areas:

- authoring and mounted source files on the left;
- Prometheus telemetry and optional normalization below the source path;
- the Grafana TopoViewer plugin boundary on the right;
- diagnostics and interaction state as separate runtime concerns.

The main source path should read:

`Harness authoring -> *.tv.yaml bundle -> /etc/topoviewer -> Plugin backend -> Panel runtime -> TopoViewer renderer`.

The main telemetry path should read:

`Prometheus -> Grafana data frames -> Panel runtime -> Mapper engine -> Runtime overlays -> TopoViewer renderer`.

Diagnostics should be visibly separate from rendering. Source validation,
mapper-schema errors, missing PromQL data, unresolved samples, duplicate matches,
ambiguous link endpoint matches, and unsupported style overlays should be shown
as diagnostics instead of silently changing the rendered topology.

## What To Inspect

- Inspect the `authoring`, `source`, `telemetry`, `runtime`, and `diagnostics`
  layers. They are intentionally separate because production failures are easier
  to debug when source loading, telemetry query results, mapping coverage, and
  rendering are not collapsed into one concept.
- Inspect the mounted source flow. This is the user workflow: write TopoViewer
  YAML in the harness or editor, mount it into Grafana, select the bundle, and
  render it.
- Inspect the telemetry overlay flow. Prometheus samples become Grafana data
  frames, data frames become mapper inputs, mapper results become runtime
  overlays, and overlays are applied after the canonical topology and stylesheet.
- Inspect the optional recording-rule node. It is deliberately marked optional
  because production deployments may query raw metrics directly or may normalize
  vendor-specific metrics into stable TopoViewer-oriented metrics.
- Inspect the diagnostics node. A production panel should make mapping coverage
  visible: matched samples, unresolved samples, ambiguous samples, duplicates,
  stale object references, unsupported target kinds, and invalid style keys.
- Inspect the interaction-state node. Dragged positions, pan, zoom, focus, and
  selection are runtime state. They may be persisted by Grafana/user settings,
  but they are distinct from the mounted source YAML.

## Use When

Use this pattern when explaining or validating a Grafana integration where
TopoViewer is installed as a panel plugin and receives mounted topology, style,
and mapper YAML. It is especially useful for operational topology panels where
Prometheus telemetry changes link direction strokes, node health, service-path
state, or failure emphasis without rewriting the topology source.

=== "Live Viewport"

    ```topoviewer
    topology: ../examples/integration/grafana-telemetry-call-flow/topology.yaml
    stylesheet: ../examples/integration/grafana-telemetry-call-flow/stylesheet.yaml
    height: 620px
    controls: true
    controlsOpen: false
    title: Grafana telemetry call flow
    selectedLayerIds:
      - authoring
      - source
      - telemetry
      - runtime
      - diagnostics
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/grafana-telemetry-call-flow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/grafana-telemetry-call-flow/stylesheet.yaml"
    ```
