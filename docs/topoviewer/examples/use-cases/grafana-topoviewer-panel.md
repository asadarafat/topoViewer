# Grafana TopoViewer Panel

**Support status:** Lab

Use this lab when you want to see TopoViewer as an operational Grafana panel:
a mounted topology bundle, live telemetry, mapper-driven overlays, panel
interaction, and screenshots that prove what changed.

The important pattern is simple:

```text
topology/style/mapper bundle
        +
Grafana data frames
        =
runtime topology overlay
```

The topology source does not come from Prometheus. The topology source is the
mounted `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundle.
Prometheus only supplies runtime values. The mapper joins those values to known
TopoViewer objects and produces temporary visual state.

## What You Will Run

The local lab starts a disposable Containerlab topology and a Grafana instance
with the TopoViewer panel already provisioned:

```text
Containerlab routers
  -> gNMI telemetry
  -> gNMIc Prometheus exporter
  -> Prometheus
  -> Grafana queries
  -> TopoViewer mapper overlays
```

The shape is intentionally close to a practical SR Linux telemetry lab: a small
CLOS fabric, gNMIc export, Prometheus scrape, Grafana dashboard, and traffic
generator. The difference is the topology panel. Grafana uses TopoViewer, so
the dashboard renders a mounted `*.tv.yaml` bundle and applies mapper-driven
telemetry overlays instead of redrawing the topology inside the dashboard.

Open the dashboard and you should see the `st-clos` bundle rendered as a
fabric map. The panel shows the same streaming-telemetry lab topology, with
TopoViewer added as a Grafana panel. Prometheus recording rules attach stable
`link_id` and `direction` labels to native SR Linux telemetry, and
`st-clos.mapper.tv.yaml` maps those labels to TopoViewer links and directional
lanes.

The cleaned `st-clos` view uses a deliberate label contract:

- node labels identify devices;
- node metadata stays separate from the node name;
- region labels identify spine, leaf, and client groups;
- `sourceLabel` and `targetLabel` identify physical ports;
- `linkDirection` labels carry bandwidth values from telemetry;
- runtime mapper overlays style directional lanes without changing the parent
  link identity.

This is the pattern to copy when building your own Grafana topology panel. Keep
physical connectivity stable in topology YAML, keep the visual contract in
stylesheet YAML, and let mapper YAML apply runtime-only values such as
bandwidth, link state, or status.

## Quick Start

Start the lab:

```bash
npm ci
npm run grafana:clab:up
npm run grafana:clab:traffic:start
npm run grafana:clab:smoke
```

Open Grafana:

```text
http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
```

Stop traffic and destroy the lab cleanly:

```bash
npm run grafana:clab:traffic:stop
npm run grafana:clab:down
```

If you want to remove the runtime smoke artifacts as well:

```bash
npm run grafana:clab:clean
```

The smoke test writes local evidence to the repo's ignored smoke-output
directory, including panel crops, full Grafana dashboard frames, a walkthrough
GIF when ImageMagick is installed, mapper coverage text, Prometheus query
results, and service health checks. The command prints the exact local paths.

## Local Ports

The default ports are pinned in `labs/grafana-topoviewer/containerlab/.env`.

| Service | Default URL |
|---|---|
| Grafana | `http://127.0.0.1:3000` |
| Prometheus | `http://127.0.0.1:9090` |

The lab uses disposable credentials, localhost-published ports, unsigned local
plugin loading, and local-only assumptions. Keep it on a trusted workstation.

## Architecture

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

The diagram uses numbered edges so payloads remain link labels instead of fake
processing nodes:

1. Studio writes a mounted bundle: `*.topo.tv.yaml`,
   `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
2. The TopoViewer plugin backend serves the selected bundle YAML to the plugin
   frontend.
3. Grafana queries Prometheus and returns telemetry data frames.
4. The plugin frontend passes mapper rules and telemetry samples into the
   mapper runtime.
5. The plugin frontend passes topology and stylesheet state to the embedded
   TopoViewer renderer.
6. The mapper runtime produces transient runtime overlays.
7. The frontend reports mapper coverage, ambiguous matches, unsupported
   overlays, and render-facing warnings.
8. The backend reports source diagnostics such as discovery, parse, schema, and
   bundle-selection errors.

## Lab Files

The Containerlab working tree lives under:

```text
labs/grafana-topoviewer/containerlab/
  st.clab.yml
  configs/
    gnmic/gnmic-config.yml
    prometheus/prometheus.yml
    prometheus/topoviewer-rules.yml
    grafana/datasource.yml
    grafana/dashboards.yml
    grafana/dashboards/topoviewer-containerlab.json
  traffic.sh
```

Mounted TopoViewer bundles live under:

```text
labs/grafana-topoviewer/topoviewer-bundles/
  st-clos/
    st-clos.topo.tv.yaml
    st-clos.style.tv.yaml
    st-clos.mapper.tv.yaml
```

Each bundle directory must contain exactly one `*.topo.tv.yaml`, one
`*.style.tv.yaml`, and one `*.mapper.tv.yaml` unless an explicit manifest is
configured.

## Source Bundle Mounting

Grafana mounts bundle files read-only under `/etc/topoviewer/bundles`:

```yaml
grafana:
  binds:
    - ../topoviewer-bundles:/etc/topoviewer/bundles:ro
  env:
    TOPOVIEWER_BUNDLE_ROOT: /etc/topoviewer/bundles
```

The plugin backend scans the mounted bundle root, rejects missing or duplicate
canonical suffix files, parses YAML, validates the TopoViewer documents, and
serves only the selected bundle to the frontend.

Ordinary bundle-file changes should not require fixture catalog edits, fixture
sync, a plugin rebuild, or a Grafana restart. Use dashboard refresh or reselect
the bundle when you need the panel to reload mounted files.

## Authoring Workflow

The practical workflow is:

1. Open the TopoViewer Studio.
2. Edit `Topology YAML`, `Stylesheet YAML`, and `Mapper YAML`.
3. Press `Apply` until the viewport and diagnostics are valid.
4. Use `Download bundle`.
5. Mount the exported bundle directory into Grafana.
6. Select that bundle in the panel options.
7. Bind Grafana queries so their labels match mapper joins.
8. Inspect mapper coverage before trusting the visual state.

Studio is the authoring surface. Grafana is the operational rendering
surface.

## Demo Scenarios

The lab uses the same client traffic pattern as the streaming-telemetry lab.
TopoViewer does not synthesize topology telemetry. It reads Grafana data frames
from Prometheus queries and lets mapper YAML decide which topology objects
receive runtime styles.

| Scenario | Command path | What changes |
|---|---|---|
| Healthy | `npm run grafana:clab:smoke` | Baseline mapper coverage and normal link state. |
| Live traffic | `npm run grafana:clab:traffic:start` | Client traffic produces native SR Linux traffic-rate telemetry. |
| Direction labels | `npm run grafana:clab:smoke` | Directional lanes show formatted bandwidth from `topoviewer_st_link_direction_bps`. |
| Link state | `npm run grafana:clab:smoke` | Link styling is driven by `topoviewer_st_link_up`. |

The topology source still comes from mounted `*.tv.yaml` files, not from
Prometheus.

## How It Works

TopoViewer in Grafana keeps two inputs intentionally separate:

- mounted source files: `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`;
- Grafana data frames produced from Prometheus HTTP query responses or another
  Grafana data source.

The mounted files define the stable diagram. Telemetry only creates runtime
overlays. It can change labels, colors, widths, directional strokes, badges,
and status treatment, but it must not rewrite the mounted topology or
stylesheet.

The mapper runtime performs the same sequence on each refresh:

1. identify the metric and value field;
2. resolve the target kind, such as node, link, link direction, path, region,
   layer, or graph;
3. join the sample by object ID, label, data field, endpoint, selector, or a
   static target;
4. evaluate mapper states;
5. produce runtime-only style deltas;
6. report coverage, unresolved samples, ambiguous matches, duplicates, and
   stale object references.

## Smoke Artifacts And Walkthrough Frames

`npm run grafana:clab:smoke` captures three panel states:

- healthy baseline;
- high-utilization overlay;
- link-failure overlay.

Use those images as walkthrough frames when reviewing the lab or recording a
short GIF. The smoke test also captures full Grafana dashboard frames so the
review shows the real dashboard chrome, query controls, side panels, and
TopoViewer panel together.

With ImageMagick installed, the smoke script automatically combines the
dashboard frames into a local walkthrough GIF. If ImageMagick is not installed,
the smoke output still includes the individual PNG frames and prints enough
information to recreate the GIF locally.

The GIF and screenshots are local review artifacts, not source files. Keep
committed docs focused on the runnable lab and regenerate screenshots from smoke
tests when the topology or panel behavior changes.

??? reference "Mapper contract and attributes"

    Mapper YAML translates telemetry samples into runtime style patches. It
    does not rewrite source topology or stylesheet YAML.

    Prefer one stable label per TopoViewer target kind. Keep these labels in
    recording rules or query aliases so mapper YAML does not depend on
    exporter-specific labels.

    | Label | Maps to |
    |---|---|
    | `node_id` | `graph.nodes[].id` |
    | `link_id` | `graph.links[].id` |
    | `path_id` | `graph.paths[].id` |
    | `region_id` | `graph.regions[].id` |
    | `layer_id` | `graph.layers[].id` |
    | `direction` | `sourceToTarget` or `targetToSource` for `linkDirection` |
    | `source_id` | Optional topology/source identity guard. |

    Compact link rule:

    ```yaml
    rules:
      - id: link-utilization
        metric: interface_utilization_percent
        select: link
        join: link_id
        value: percent
        states:
          busy: ">=70"
          saturated: ">=90"
        style:
          default:
            label: "{{ value | round }}%"
            lineColor: "#4caf50"
          busy:
            label: "busy {{ value | round }}%"
            lineColor: "#ff9800"
            lineWidth: 6
          saturated:
            label: "{{ state }} {{ value | round }}%"
            lineColor: "#d32f2f"
            lineWidth: 8
    ```

    Directional link rule:

    ```yaml
    rules:
      - id: directional-bandwidth
        metric: interface_direction_bps
        select: linkDirection
        join:
          link: link_id
          direction: direction
        states:
          busy: ">=1000000000"
          saturated: ">=5000000000"
        style:
          default:
            label: "{{ label.direction }} {{ value | bps }}"
            lineColor: "#4caf50"
            lineWidth: 4
          busy:
            lineColor: "#ff9800"
            lineWidth: 6
          saturated:
            label: "hot {{ value | bps }}"
            lineColor: "#d32f2f"
            lineWidth: 8
    ```

    Supported style-template tokens include `{{ value }}`,
    `{{ value | round }}`, `{{ value | bps }}`, `{{ severity }}`,
    `{{ state }}`, `{{ metric }}`, `{{ target.id }}`,
    `{{ label.<name> }}`, and `{{ field.<name> }}`.

    Root attributes:

    | Attribute | Use |
    |---|---|
    | `$schema` | Optional editor/schema hint. |
    | `version` | Mapper document version. Use `1`. |
    | `identity.sourceId` | Expected source identity, usually the bundle or topology ID. |
    | `identity.sourceIdLabel` | Telemetry label that must equal `identity.sourceId`. |
    | `palette.*` | Severity palette for default overlay behavior. |
    | `rules` | Preferred compact authoring rules. |
    | `mappings` | Advanced resolver, threshold, aggregate, and condition rules. |

    Compact `rules[]` attributes:

    | Attribute | Use |
    |---|---|
    | `id` | Stable diagnostic ID. |
    | `metric` | Grafana metric/data-frame name. |
    | `select` | Target kind or selector, such as `node`, `link`, `linkDirection`, `path`, `region`, `layer`, or `graph`. |
    | `join` | Telemetry label or direction join object. |
    | `value` | Semantic value type such as `percent`, `up`, `health`, or `latencyMs`. |
    | `states` | Named threshold expressions such as `==0`, `>=70`, or `!=up`. |
    | `style.default` | Baseline runtime style patch. |
    | `style.<state>` | State-specific runtime style patch. |

    Advanced `mappings[]` attributes:

    | Attribute | Use |
    |---|---|
    | `target.kind` | `node`, `link`, `linkDirection`, `path`, `region`, `layer`, or `graph`. |
    | `target.resolve.by` | `id`, `label`, `data`, `endpoint`, `selector`, `aggregate`, or `staticObjectIds`. |
    | `target.resolve.metricLabel` | Primary join label for ID, label, or data resolvers. |
    | `target.resolve.linkMetricLabel` | Parent link ID label for `linkDirection`. |
    | `target.resolve.directionMetricLabel` | Direction label for `linkDirection`. |
    | `target.resolve.key` | TopoViewer label/data key for label/data resolvers. |
    | `target.resolve.sourceLabel` / `target.resolve.targetLabel` | Endpoint labels for link matching. |
    | `target.resolve.selector` | TopoViewer selector for broad overlays. |
    | `target.resolve.objectIds` | Explicit target IDs. |
    | `value.field` | Data-frame field name. |
    | `value.as` | Semantic value type. |
    | `thresholds.*` | Numeric severity thresholds. |
    | `overlay.*` | Built-in overlay helpers such as severity colors, status markers, labels, and propagation. |
    | `conditions[]` | Conditional style patches. |

## Mapper Recipes

Mapper recipes are useful copy-paste starting points, but they should not be
the first thing a Grafana adopter reads. Keep them as examples after the panel
workflow is understood.

??? example "Open mapper recipes"

    ### Node Health

    ```yaml
    rules:
      - id: node-health
        metric: node_health
        select: node
        join: node_id
        value: health
        states:
          down: "==0"
        style:
          default:
            badgeLabel: OK
            statusColor: "#4caf50"
          down:
            badgeLabel: DOWN
            statusColor: "#d32f2f"
            outlineColor: "#d32f2f"
            outlineWidth: 6
    ```

    ### Link State

    ```yaml
    rules:
      - id: link-oper-state
        metric: interface_oper_state
        select: link
        join: link_id
        value: up
        states:
          down: "==0"
        style:
          default:
            label: UP
            lineColor: "#4caf50"
            lineWidth: 3
          down:
            label: DOWN
            lineColor: "#d32f2f"
            lineWidth: 7
            lineStyle: dashed
    ```

    ### Bidirectional Utilization

    ```yaml
    rules:
      - id: link-direction-utilization
        metric: interface_direction_bps
        select: linkDirection
        join:
          link: link_id
          direction: direction
        states:
          busy: ">=1000000000"
          saturated: ">=5000000000"
        style:
          default:
            label: "{{ label.direction }} {{ value | bps }}"
            lineWidth: 4
          busy:
            lineColor: "#ff9800"
            lineWidth: 6
          saturated:
            label: "hot {{ value | bps }}"
            lineColor: "#d32f2f"
            lineWidth: 8
    ```

    ### Path SLO

    ```yaml
    mappings:
      - id: service-path-latency
        metric: service_path_latency_ms
        target:
          kind: path
          resolve:
            by: id
            metricLabel: path_id
        value:
          as: latencyMs
        thresholds:
          warning: 50
          error: 100
        overlay:
          lineColorBySeverity: true
          lineWidthBySeverity: true
          label: "{{ value | round }} ms"
    ```

??? note "Application notes for production panel development"

    ### Mapper Coverage

    Treat mapper coverage as an operator-facing safety signal.

    | Counter | Meaning |
    |---|---|
    | Total samples | Samples received from Grafana data frames. |
    | Source matched | Samples matching the configured source identity. |
    | Metric matched | Samples whose metric name is used by mapper rules. |
    | Resolved | Samples mapped to one or more TopoViewer objects. |
    | Unresolved | Samples that matched a rule but no object. |
    | Applied objects | Unique TopoViewer objects receiving overlays. |
    | Ambiguous | Samples that match too many objects. |
    | Duplicate | Multiple samples/rules write the same overlay target. |
    | Stale | Static object IDs that no longer exist in topology YAML. |

    Non-zero unresolved, ambiguous, duplicate, or stale counts do not always
    mean the panel is broken, but they should trigger mapper review.

    ### Interactivity

    Pan, zoom, selected objects, focus, and dragged node positions are runtime
    interaction state. They do not mutate topology YAML, stylesheet YAML,
    mapper YAML, or Grafana telemetry.

    Dragged positions are local runtime overrides. They are applied after the
    canonical topology and stylesheet layout, and before telemetry overlays.

    When node dragging is enabled, alignment helper lines are also runtime-only.
    They guide object alignment during local panel exploration and snap on drag
    stop without writing back to mounted bundle YAML.

    New panels enable `Enable interaction state` and `Allow node drag` by
    default. Helper lines are therefore available by default while dragging. If
    a dashboard is intentionally read-only, disable either setting and the panel
    will stop exposing drag alignment affordances.

    ### Dashboard Editability

    Provisioned dashboards cannot always be saved back through the Grafana UI.
    If Grafana shows a "cannot be saved" message, save an editable copy for
    local exploration or update the dashboard JSON in the provisioning source.

    ### Containerlab Local Validation

    Use the Containerlab profile when you want to validate the Grafana plugin,
    mounted-bundle workflow, Prometheus recording rules, mapper coverage, and
    directional telemetry overlays against a real local SR Linux topology:

    ```bash
    npm run grafana:clab:up
    npm run grafana:clab:traffic:start
    npm run grafana:clab:smoke
    npm run grafana:clab:traffic:stop
    npm run grafana:clab:down
    ```

    Fixture mode remains a panel-development and regression path only. The
    user-facing Grafana lab path is mounted bundles plus Containerlab telemetry.

    ### Plugin Artifact Trust

    The local lab loads an unsigned plugin build so developers can iterate
    quickly. That is acceptable for local validation only. Do not copy the lab
    settings to an exposed Grafana instance.

    A reviewed installable panel artifact should include a plugin zip built
    from a committed version, checksums, dependency inventory, release notes,
    compatibility notes, and a signed or otherwise trusted distribution path.

    ### Role And Access Checks

    | Role | Expected behavior |
    |---|---|
    | Viewer | Opens dashboards, loads selected mounted bundles, pans/zooms/selects, and sees telemetry overlays. |
    | Editor | Changes panel options, selects a different bundle, and saves dashboard changes when the dashboard is editable. |
    | Admin | Installs/configures the plugin, data sources, and dashboard provisioning. |
    | Anonymous | Local lab only; disable for shared or production environments. |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No topology renders | Bundle missing, duplicate suffix files, YAML parse error, or invalid topology references. | Check source diagnostics and mounted directory shape. |
| Topology renders but overlays do not | Query returns no matching metric or mapper `metric` is wrong. | Compare Grafana query names with `rules[].metric`. |
| Coverage shows unresolved samples | Join label value does not match any TopoViewer object ID. | Check `node_id`, `link_id`, `path_id`, or `region_id` labels. |
| Coverage shows ambiguous samples | Endpoint or selector matching found multiple objects. | Prefer explicit IDs or add stable labels to disambiguate. |
| Coverage shows duplicate mappings | Multiple samples write the same object/state. | Add source labels, rule filters, or aggregate behavior. |
| Directional lanes do not update | Missing parent `link_id`, missing `direction`, or unsupported direction value. | Use `direction: sourceToTarget` or `targetToSource`. |
| Mapper YAML fails | Unsupported key, invalid target kind, invalid resolver, or invalid style key. | Select `mapper.yaml` in Studio project source and use shared-editor assistance and schema diagnostics. |
| Edited mounted files do not appear | Grafana has not refetched the selected bundle. | Use dashboard refresh, reload the page, or change/reselect the bundle. |
| Containerlab command fails before deploy | Missing Docker, Containerlab, occupied ports, or stale lab containers. | Install the required tool, free fixed ports, or run `npm run grafana:clab:clean`. |
