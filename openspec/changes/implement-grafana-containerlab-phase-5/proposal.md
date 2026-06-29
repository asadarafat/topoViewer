## Why

The Grafana panel now has a deterministic Prometheus injector path and a
mounted TopoViewer mapper workflow. The next risk is whether real lab telemetry
can drive the same mapper contract without hard-coded panel behavior or
Grafana-owned topology copies.

Containerlab should be introduced as a separate phase so device startup,
image pulls, host privileges, scrape target health, gNMI subscriptions, and
metric labels do not hide panel/mapper regressions.

Phase 5 should adapt a compact SR Linux streaming telemetry lab pattern into a
repo-local `topoviewer-grafana` lab profile. The lab goal is not a generic
networking demo. The goal is a production-shaped proof that live telemetry can
flow through Prometheus into the installable TopoViewer Grafana panel and alter
TopoViewer runtime overlays through `*.mapper.tv.yaml`.

## Status

Implementation-ready planning.

The Phase 4 mounted-bundle and mapper foundation has been archived. Phase 5 can
now consume that contract. The synthetic Grafana lab remains the deterministic
debug and CI baseline; Containerlab becomes the real telemetry validation path.

## What Changes

- Add a local `topoviewer-grafana` Containerlab profile under the existing
  `labs/grafana-topoviewer/` lab tree.
- Adapt a small SR Linux CLOS telemetry lab shape with spine/leaf nodes, client
  hosts, gNMIc, Prometheus, and Grafana.
- Keep the existing synthetic Grafana lab as the deterministic CI/debug path.
- Mount TopoViewer bundles into Grafana using `*.topo.tv.yaml`,
  `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
- Install or mount the local TopoViewer Grafana panel plugin into the lab
  Grafana container.
- Scrape live SR Linux telemetry into Prometheus through gNMIc.
- Normalize live telemetry labels into mapper-friendly identities, especially
  `node_id`, `link_id`, `source`, `target`, `protocol`, and optional
  `interface`.
- Prove live link state, interface utilization, and one adjacency or node-health
  signal update TopoViewer runtime overlays through mapper YAML.
- Capture artifacts under `.artifacts/grafana-containerlab/`.

## Out Of Scope

- Codespaces support.
- Large topology stress testing.
- Plugin signing or release packaging.
- Making Grafana the YAML authoring environment.
- Replacing the synthetic injector lab.
- Requiring a runtime clone of an external lab repository.
- Copying external repository URLs into public docs or OpenSpec text.
