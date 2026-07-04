# TopoViewer Grafana Containerlab Lab

This lab runs the TopoViewer Grafana panel against a real Containerlab
streaming-telemetry topology. The local stack is SR Linux, gNMIc, Prometheus,
Grafana, Alloy, Loki, and the TopoViewer panel.

This is a disposable local lab, not production deployment guidance. The
checked-in defaults use anonymous Admin, `admin`/`admin` credentials, disabled
login flow, unsigned plugin loading, and published local ports so validation is
fast. Do not copy those settings into a shared or production Grafana
deployment.

Containerlab publishes Grafana and Prometheus host ports through Docker.
Containerlab publishes those ports as disposable local lab endpoints, not
production exposure guidance. Keep the lab on a trusted local host or constrain
access with host firewall rules.

## Run

```bash
npm run grafana:clab:up
npm run grafana:clab:traffic:start
npm run grafana:clab:smoke
npm run grafana:clab:traffic:stop
npm run grafana:clab:down
```

The lab defaults to:

- Grafana: `http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer`
- Prometheus: `http://127.0.0.1:9090`

Use `npm run grafana:clab:clean` if a previous Containerlab run left stale
containers, links, or runtime state.

## What Runs

The profile lives under:

```text
labs/grafana-topoviewer/containerlab/
  st.clab.yml
  configs/
  scripts/
  traffic.sh
```

The topology is intentionally close to the SR Linux streaming telemetry lab:

```text
spine1/spine2
  -> leaf1/leaf2/leaf3
  -> client1/client2/client3
```

TopoViewer-specific behavior is limited to:

- mounting the local TopoViewer Grafana panel plugin into Grafana;
- mounting `/etc/topoviewer/bundles`;
- provisioning a TopoViewer dashboard beside the telemetry dashboards;
- loading `topoviewer-rules.yml` in Prometheus.

There is no TopoViewer normalizer service. gNMIc exports SR Linux telemetry.
Prometheus recording rules add stable `topology`, `link_id`, and `direction`
labels. `st-clos.mapper.tv.yaml` maps those labels to TopoViewer links and
directional lanes.

## Mounted Bundle

The Grafana container mounts:

```text
labs/grafana-topoviewer/topoviewer-bundles/st-clos/
  st-clos.topo.tv.yaml
  st-clos.style.tv.yaml
  st-clos.mapper.tv.yaml
```

Inside Grafana, that bundle is available under:

```text
/etc/topoviewer/bundles/st-clos/
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

## Telemetry Flow

```text
SR Linux nodes
  -> gNMIc subscriptions
  -> Prometheus scrape
  -> recording rules with stable TopoViewer labels
  -> Grafana data frames
  -> TopoViewer mapper overlays
```

The checked-in mapper renders direction bandwidth labels with:

```yaml
label: "{{ value | bps }}"
```

Grafana rates such as `3580000` are displayed as `3.58 Mb/s` on the matching
directional stroke.

## Smoke Artifacts

`npm run grafana:clab:smoke` verifies:

- Grafana health;
- TopoViewer plugin availability;
- mounted bundle discovery;
- Prometheus target health;
- `topoviewer_st_link_up`;
- `topoviewer_st_link_direction_bps`;
- mapper coverage;
- a Playwright screenshot.

Artifacts are written under:

```text
.artifacts/grafana-upstream/
  topoviewer-dashboard.png
  mapper-coverage.json
  prometheus-targets.json
  bundle-index.json
```

## Host Requirements

- Docker must be running and usable by the current shell.
- Containerlab must be installed as `containerlab` or `clab`.
- The current user must have privileges required to start Containerlab network
  namespaces and containers.
- Ports `3000` and `9090` must be free.
- Image pulls can be large on the first run because SR Linux, gNMIc,
  Prometheus, Grafana, Alloy, Loki, and client images are pinned.

If Containerlab is missing, install it on a disposable Linux lab host:

```bash
curl -sL https://containerlab.dev/setup | sudo -E bash -s "all"
```

That command runs an install script with `sudo`; read it first on machines that
matter.

## Production-Shaped Baseline

The checked-in lab optimizes for local validation. A real deployment should
invert those defaults:

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

## Upstream-Candidate Shape

The upstream-candidate direction is intentionally narrow:

- keep the existing streaming telemetry lab recognizable;
- preserve the original `Network Telemetry` dashboard;
- add a `Network Telemetry - TopoViewer` dashboard;
- mount one TopoViewer bundle;
- use Prometheus recording rules for stable `link_id` and `direction` labels;
- avoid a repo-local normalizer service.

The upstream-candidate lab loads the TopoViewer Grafana panel from:

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

# 4. Open Grafana.
open http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
```
