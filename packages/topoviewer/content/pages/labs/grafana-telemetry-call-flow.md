# Grafana Telemetry Call Flow

**Support status:** Lab

TopoViewer in Grafana has two inputs that stay intentionally separate:

- mounted source files: `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`;
- Grafana data frames produced from Prometheus HTTP query responses or another
  Grafana data source.

The source files define the stable diagram. Telemetry only creates runtime
overlays. It can change labels, colors, widths, directional strokes, badges, and
status treatment, but it must not rewrite the mounted topology or stylesheet.

This diagram uses a strict modeling rule: nodes are processing systems or
runtime components only. Files, mounted bundles, Grafana data frames, selected
source documents, mapper output, diagnostics payloads, and overlays are shown as
numbered edge labels or region context.

## Architecture Diagram

```topoviewer
topology: examples/integration/grafana-telemetry-call-flow/topology.yaml
stylesheet: examples/integration/grafana-telemetry-call-flow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Grafana telemetry call flow
selectedLayerIds:
  - source
  - telemetry
  - runtime
  - diagnostics
```

!!! note "Numbered edge legend"

    1. The harness writes a mounted TopoViewer bundle: `*.topo.tv.yaml`,
       `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
    2. The TopoViewer plugin backend serves the selected topology, stylesheet,
       and mapper source to the TopoViewer plugin frontend.
    3. The Grafana query path calls the Prometheus HTTP API and returns
       telemetry query responses through the Grafana runtime.
    4. The TopoViewer plugin frontend passes mapper rules and telemetry samples
       into the mapper runtime.
    5. The TopoViewer plugin frontend passes topology and stylesheet state to
       the embedded renderer.
    6. The mapper runtime produces transient runtime overlays for matching
       TopoViewer objects.
    7. The mapper runtime emits frontend runtime diagnostics: coverage,
       ambiguous matches, unsupported overlays, and render-facing warnings.
    8. The TopoViewer plugin backend emits source diagnostics: discovery,
       parse, schema, and bundle-selection errors.

## Source Loading

Users author TopoViewer YAML in the harness, VS Code, or another editor, then
mount one bundle directory into Grafana:

```text
/etc/topoviewer/bundles/<bundle-id>/
  topology.topo.tv.yaml
  stylesheet.style.tv.yaml
  mapper.mapper.tv.yaml
```

The TopoViewer plugin backend owns source discovery. It scans the mounted bundle
root, rejects missing or duplicate canonical suffixes, parses the YAML,
validates the TopoViewer documents, and serves the selected bundle to the
TopoViewer plugin frontend.

The TopoViewer plugin frontend should not require fixture catalog edits, a
plugin rebuild, or a Grafana restart for ordinary bundle-file changes. At most,
it refreshes or reloads the selected bundle from the backend resource endpoint.

## Telemetry Flow

The Grafana query path calls the Prometheus HTTP API and returns query responses
through the Grafana runtime. The TopoViewer plugin frontend consumes those
results as Grafana data frames. The plugin does not infer topology from
Prometheus. Instead, it compiles the mapper YAML and resolves each telemetry
sample against the already-loaded TopoViewer inventory:

1. identify the metric and value field;
2. resolve the target kind, such as node, link, path, region, layer, or graph;
3. join the sample by object ID, label, data field, endpoint, selector, or a
   static target;
4. evaluate mapper states;
5. produce runtime-only style deltas.

## Overlay Application

The TopoViewer renderer is embedded inside the TopoViewer plugin frontend. It
receives three inputs in order:

1. topology YAML;
2. stylesheet YAML;
3. mapper-produced runtime overlays.

That order matters. The topology and stylesheet remain the source of truth.
Overlays are transient operational state, so the same topology can show normal,
degraded, congested, or failed conditions without changing the authored YAML.

## Diagnostics

Production behavior must be explicit when source loading or telemetry mapping
cannot be trusted. Diagnostics are split by owner:

- the plugin backend reports source diagnostics for mounted bundle discovery,
  canonical suffix validation, YAML parsing, schema validation, and selected
  bundle loading;
- the plugin frontend reports runtime diagnostics for mapper coverage,
  telemetry matching, unsupported overlay styles, render limits, and panel
  state.

Together they should surface:

- source parse or schema errors;
- unsupported style keys for a target kind;
- empty topology or renderer-limit violations;
- mapper rules that match no objects;
- ambiguous matches, especially parallel links resolved only by endpoints;
- duplicate telemetry samples for the same object and state;
- stale mapper references to objects that no longer exist.

Diagnostics are not cosmetic. They are part of the operator contract because a
silent missing overlay can be worse than a visible error.
