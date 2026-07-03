# TopoViewer Grafana Lab

This lab starts pinned Grafana, Prometheus, and a deterministic telemetry
injector. Grafana mounts the local exploratory TopoViewer panel plugin from
`packages/grafana-topoviewer-panel/dist`.

This is a disposable local lab, not production guidance. The checked-in defaults
use anonymous Admin, `admin`/`admin` credentials, disabled login flow, unsigned
plugin loading, and published localhost ports so local validation is fast. Do
not copy those settings into a shared or production Grafana deployment.

The synthetic Compose lab keeps regression paths for fixture parity, local
Prometheus overlays, and the mounted-bundle workflow. The Containerlab profile
streams SR Linux telemetry through gNMIc and Prometheus into the same
mounted-bundle mapper path.

## Run

This command sequence starts local-only services with disposable credentials,
anonymous Admin, disabled login, and unsigned plugin loading. It is for local
validation only.

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase4
npm run grafana:lab:smoke:phase1
npm run grafana:lab:smoke:phase2
npm run grafana:lab:down
```

`npm run grafana:lab:up` starts the mounted-bundle lab directly. It does not
run fixture sync or fixture checks; those remain explicit development and CI
commands.

The lab defaults to:

- Grafana: `http://127.0.0.1:3000`
- Phase 4 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles`
- Phase 1 fixture parity dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-1/topoviewer-phase-1`
- Phase 2 legacy weathermap dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-2/topoviewer-phase-2-weathermap`
- Prometheus: `http://127.0.0.1:9090`
- Telemetry injector: `http://127.0.0.1:9108/scenario`

The Docker Compose lab binds Grafana, Prometheus, and the telemetry injector to
`127.0.0.1` only. Override ports only when another local process owns the
default port; do not use the checked-in Compose file as production network
exposure guidance.

The local dashboards are provisioned as editable lab seeds. Grafana UI saves
write the edited dashboard to Grafana's database for the running lab; they do
not rewrite the JSON files under `labs/grafana-topoviewer/grafana/dashboards`.
Update those files separately when an edited dashboard should become the new
checked-in seed.

If the port is busy:

```bash
GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase4
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase1
GRAFANA_URL=http://127.0.0.1:3001 PROMETHEUS_URL=http://127.0.0.1:9091 TELEMETRY_INJECTOR_URL=http://127.0.0.1:9109 npm run grafana:lab:smoke:phase2
```

The Phase 1 smoke test iterates every canonical harness fixture and captures
detailed screenshots for `layered-network` and `clos-2spine-4leaf` under
`.artifacts/grafana-phase-1/`. The Phase 4 smoke test exercises the mounted
bundle source and mapper path.

## Grafana TopoViewer panel lab

The Containerlab profile is intentionally separate from the synthetic lab. It
keeps the streaming-telemetry lab shape recognizable and adds TopoViewer as a
Grafana panel instead of replacing the lab with repo-local plumbing.

This command sequence starts a real local network lab with SR Linux nodes,
gNMIc, Prometheus, Grafana, Alloy, Loki, and the TopoViewer panel. Containerlab
publishes Grafana and Prometheus through Docker for lab access; keep it on a
trusted local host or constrain access with host firewall rules.

```bash
npm run grafana:clab:up
npm run grafana:clab:smoke
npm run grafana:clab:down
```

The lab defaults to:

- Grafana: `http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer`
- Prometheus: `http://127.0.0.1:9090`

The URLs use `127.0.0.1` because the profile is validated as a local lab. If
you run Containerlab on a remote host, explicitly decide how these published
ports are firewalled before sharing the host.

The Containerlab profile lives under:

```text
labs/grafana-topoviewer/containerlab/
  st.clab.yml
  configs/
  scripts/
  traffic.sh
```

The profile is intentionally close to the streaming-telemetry lab: two SR Linux
spines, three SR Linux leaves, three client endpoints, gNMIc, Prometheus,
Grafana, Alloy, and Loki. TopoViewer-specific behavior is limited to:

- mounting the local TopoViewer panel plugin into Grafana;
- mounting `/etc/topoviewer/bundles`;
- provisioning a TopoViewer dashboard beside the telemetry dashboards;
- loading `topoviewer-rules.yml` in Prometheus.

There is no TopoViewer normalizer service. gNMIc exports native SR Linux
metrics. Prometheus recording rules add stable `topology`, `link_id`, and
`direction` labels. `st-clos.mapper.tv.yaml` maps those labels to TopoViewer
links and directional lanes.

The SR Linux nodes use the upstream startup configs:

```text
spine1/spine2
  -> leaf1/leaf2/leaf3
  -> client1/client2/client3
```

For deliberate visible traffic, use:

```bash
npm run grafana:clab:traffic:start
npm run grafana:clab:traffic:status
npm run grafana:clab:traffic:stop
```

The mounted bundle is:

```text
labs/grafana-topoviewer/topoviewer-bundles/st-clos/
  st-clos.topo.tv.yaml
  st-clos.style.tv.yaml
  st-clos.mapper.tv.yaml
```

The Grafana container mounts the same bundle root used by the synthetic lab:

```yaml
volumes:
  - ../topoviewer-bundles:/etc/topoviewer/bundles:ro
```

For local development, Grafana loads the TopoViewer panel from the path in
`TOPOVIEWER_GRAFANA_PLUGIN_DIST`, defaulting to:

```text
../../../packages/grafana-topoviewer-panel/dist
```

Override that variable when testing a copied or unpacked plugin artifact:

```bash
TOPOVIEWER_GRAFANA_PLUGIN_DIST=/absolute/path/to/asadarafat-topoviewer-panel npm run grafana:clab:up
```

The smoke test captures artifacts under:

```text
.artifacts/grafana-containerlab/
  topoviewer-dashboard.png
  mapper-coverage.json
  prometheus-targets.json
  bundle-index.json
```

Host requirements:

- Docker must be running and usable by the current shell.
- Containerlab must be installed as `containerlab` or `clab`.
- The current user must have the privileges required to start Containerlab
  network namespaces and containers.
- Ports `3000` and `9090` must be free. The checked-in `st.clab.yml` keeps the
  same fixed port shape as the streaming-telemetry lab.
- Image pulls can be large on the first run because SR Linux, gNMIc,
  Prometheus, Grafana, Alloy, Loki, and client images are pinned.

If startup fails, run:

```bash
npm run grafana:clab:down
```

Then check for port conflicts, Docker permission errors, failed image pulls,
and Prometheus target health.

Remaining limits before a portable Codespaces-style workflow:

- This profile assumes a local host that can run Docker and Containerlab with
  the required network namespace privileges.
- The default development mode mounts the Grafana plugin from the local `dist`
  build; signing and packaged release-mode installation remain release work.
- SR Linux image pull time and host CPU/memory requirements are not hidden by
  the scripts.
- The synthetic lab remains the light CI baseline; the Containerlab lab is the
  real telemetry validation path.

## Production-Shaped Grafana Baseline

The checked-in labs intentionally optimize for fast local validation. A real
deployment should invert those defaults:

```yaml
environment:
  GF_AUTH_ANONYMOUS_ENABLED: "false"
  GF_AUTH_DISABLE_LOGIN_FORM: "false"
  GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER}
  GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
  TOPOVIEWER_BUNDLE_ROOT: /etc/topoviewer/bundles
volumes:
  - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
```

Unsigned plugin loading is local lab/development only. A production-shaped
deployment should install a reviewed plugin artifact, use the Grafana plugin
signing path once available, authenticate users normally, and publish ports only
through the organization's standard ingress, proxy, or firewall model.

### Upstream-Candidate Validation

The production-grade Containerlab direction is the upstream-candidate lab shape: keep
the existing streaming telemetry lab recognizable, preserve the original
`Network Telemetry` dashboard, add a `Network Telemetry - TopoViewer` B
dashboard, mount one TopoViewer bundle, and use Prometheus recording rules for
stable `link_id` and `direction` labels. That path should not require the
repo-local normalizer service.

The upstream-candidate lab loads the TopoViewer Grafana panel from a plugin
install directory inside the lab checkout:

```text
configs/grafana/plugins/asadarafat-topoviewer-panel/
```

Release mode should unpack a pinned TopoViewer Grafana panel artifact into that
directory. Development mode may symlink or copy
`packages/grafana-topoviewer-panel/dist` into the same directory, but that
repo-relative path must not appear in the upstream-candidate patch.

Fresh-checkout operator workflow:

```bash
# 1. Unpack a pinned TopoViewer Grafana panel artifact into:
#    configs/grafana/plugins/asadarafat-topoviewer-panel/

# 2. Deploy the lab from the upstream-candidate checkout.
containerlab deploy --topo st.clab.yml

# 3. Start visible client traffic.
bash traffic.sh start all

# 4. Compare the dashboards in a browser:
#    Original: http://127.0.0.1:3000/d/ce11ch1funwu8d/network-telemetry
#    B:        http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
```

The mounted bundle lives under:

```text
configs/grafana/topoviewer-bundles/st-clos/
  st-clos.topo.tv.yaml
  st-clos.style.tv.yaml
  st-clos.mapper.tv.yaml
```

The Prometheus recording rules backing the dashboard are:

- `topoviewer_st_link_up{topology="st-clos",link_id="..."}`
- `topoviewer_st_link_direction_bps{topology="st-clos",link_id="...",direction="sourceToTarget|targetToSource"}`

Those rules are generated from telemetry bindings in `st-clos.topo.tv.yaml`.
The raw Prometheus labels stay next to the relevant link or direction:

```yaml
data:
  telemetry:
    up:
      record: topoviewer_st_link_up
      metric: interface_oper_state
      labels:
        source: spine1
        interface_name: e1-1
```

Regenerate the rules after changing those bindings:

```bash
npm run grafana:clab:rules -- \
  --topology "$UPSTREAM_LAB/configs/grafana/topoviewer-bundles/st-clos/st-clos.topo.tv.yaml" \
  --output "$UPSTREAM_LAB/configs/prometheus/topoviewer-rules.yml"
```

Use `--check` in review or CI to detect drift between topology telemetry
bindings and generated Prometheus rules.

The checked-in mapper renders direction bandwidth labels with
`label: "{{ value | bps }}"`, so Grafana rates such as `3580000` are displayed
as `3.58 Mb/s` on the corresponding directional stroke.

If Grafana treats the provisioned dashboard as read-only, persist edits by
copying the dashboard JSON back into
`configs/grafana/dashboards/telemetry-dashboard-topoviewer.json`, or save a
separate dashboard copy in Grafana for local exploration.

After the upstream-candidate lab is deployed and traffic is running, validate it
from this repo with:

```bash
GRAFANA_URL=http://127.0.0.1:3000 \
PROMETHEUS_URL=http://127.0.0.1:9090 \
npm run grafana:clab:smoke:upstream
```

The smoke verifies Grafana health, TopoViewer plugin availability, mounted
bundle discovery, Prometheus targets, `topoviewer_st_link_up`,
`topoviewer_st_link_direction_bps`, mapper coverage, and a Playwright
screenshot. Artifacts are written under `.artifacts/grafana-upstream/`.

This upstream-candidate path is not production grade until a pinned plugin
artifact is available, the artifact can be installed from a fresh lab checkout,
and the smoke can be run without hidden local monorepo state.

## Telemetry Scenarios

```bash
npm run grafana:lab:inject -- healthy
npm run grafana:lab:inject -- high-utilization
npm run grafana:lab:inject -- link-failure
```

The injector exports these Prometheus metrics:

- `topoviewer_link_up`
- `topoviewer_link_utilization_percent`
- `topoviewer_link_rx_bps`
- `topoviewer_link_tx_bps`
- `topoviewer_link_errors_total`
- `topoviewer_metric_timestamp_seconds`

Every metric carries `fixture_id`, `link_id`, `source`, `target`, `site`, and
`pod`. Fixture dashboards use the built-in compatibility mapper. Mounted-bundle
dashboards use the selected bundle's `*.mapper.tv.yaml`, so a metric can target
nodes, links, paths, regions, layers, or the whole graph through explicit
resolver rules.

## Topology Bundle Workflow

The production-shaped workflow is:

1. Author topology and stylesheet YAML in the browser harness or VS Code.
2. Author the mapper YAML that joins telemetry labels to topology objects.
3. Save each topology as one bundle directory containing:
   - `*.topo.tv.yaml`
   - `*.style.tv.yaml`
   - `*.mapper.tv.yaml`
4. Mount the bundle root into Grafana at `/etc/topoviewer/bundles`.
5. Select the bundle in the TopoViewer panel.
6. Wire Prometheus queries to the panel.
7. Inject scenarios and verify mapped objects change through runtime overlays.
8. Open the mapper status details in the panel to inspect coverage,
   diagnostics, and PromQL starters.

Mapper rules are intentionally explicit. A typical link rule looks like:

```yaml
version: 1
identity:
  sourceId: layered-network
  sourceIdLabel: fixture_id
palette:
  success:
    color: "#4caf50"
    accent: "#2e7d32"
  info:
    color: "#42a5f5"
    accent: "#1976d2"
  warning:
    color: "#ff9800"
    accent: "#ed6c02"
  error:
    color: "#d32f2f"
    accent: "#c62828"
mappings:
  - id: link-utilization
    metric: topoviewer_link_utilization_percent
    target:
      kind: link
      resolve:
        by: id
        metricLabel: link_id
    value:
      as: utilizationPercent
    thresholds:
      info: 50
      warning: 80
      error: 90
    overlay:
      lineColorBySeverity: true
      lineWidthBySeverity: true
      statusMarker: true
      outlineBySeverity: true
      label: "{{ value | round }}%"
```

The mapper does not rewrite topology YAML or stylesheet YAML. It behaves like a
Grafana display policy: telemetry samples are evaluated against mapper rules,
then TopoViewer receives runtime overlays for the matched objects. Keep the
normal shape, icon, label, and base color policy in `*.style.tv.yaml`; keep
telemetry thresholds, severity colors, and operational overlays in
`*.mapper.tv.yaml`.

To manually test a color change, edit the `palette.error.color` value in the
mounted mapper file, use the Grafana dashboard refresh button or reload the
browser page, and inject a high-utilization or link-failure scenario.

Use precise IDs for direct joins (`node_id`, `link_id`, `path_id`,
`region_id`) and labels/data keys for grouping or inventory joins.

The panel coverage line answers the first operational debugging question:

```text
Mapper coverage: resolved/source-matched samples · objects overlaid · unresolved · ambiguous · duplicate
```

If endpoint matching is ambiguous, add a stable object ID label such as
`link_id`. If no samples match, compare the mapper `metric` values with the
Grafana query frame names and Prometheus metric names.

This lab mounts:

```text
labs/grafana-topoviewer/topoviewer-bundles/
  layered-network/
    layered-network.topo.tv.yaml
    layered-network.style.tv.yaml
    layered-network.mapper.tv.yaml
  clos-2spine-4leaf/
    clos-2spine-4leaf.topo.tv.yaml
    clos-2spine-4leaf.style.tv.yaml
    clos-2spine-4leaf.mapper.tv.yaml
```

The Docker Compose mount is:

```yaml
volumes:
  - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
```

For production-shaped tests with explicit bundle paths, set the panel option
`mountedBundle.manifestPath` to a manifest file under `/etc/topoviewer/bundles`.
The manifest can name each bundle and point to the exact topology, stylesheet,
and mapper files. If no manifest is configured, the plugin uses strict suffix
discovery and requires exactly one `*.topo.tv.yaml`, one `*.style.tv.yaml`, and
one `*.mapper.tv.yaml` per bundle directory.

The old generated fixture flow remains useful for demo parity and regression
tests. It is not the intended production workflow for user-provided topology,
and it is not required for `npm run grafana:lab:up`.

If the topology renders but no telemetry appears, check:

- Prometheus target status for `telemetry-injector:9108`;
- the identity label in `*.mapper.tv.yaml` matches the selected bundle;
- the mapper metric name matches the Grafana query output;
- the resolver label, such as `link_id`, matches a TopoViewer object ID;
- Grafana query mode is instant or refresh has elapsed long enough for a scrape.
