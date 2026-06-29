## Why

The Grafana panel now has a deterministic Prometheus injector path and a
mounted TopoViewer mapper workflow. The next risk is whether real lab telemetry
can drive the same mapper contract without hard-coded panel behavior or
Grafana-owned topology copies.

Containerlab should be introduced as a separate phase so device startup,
image pulls, host privileges, scrape target health, gNMI subscriptions, and
metric labels do not hide panel/mapper regressions.

Phase 5 should first adapt the existing SR Linux streaming telemetry lab shape
with the smallest possible delta. The goal is not a generic networking demo or a
parallel TopoViewer-only lab. The goal is a production-shaped proof that live
telemetry can flow through gNMIc and Prometheus into the installable TopoViewer
Grafana panel and alter TopoViewer runtime overlays through `*.mapper.tv.yaml`.

## Status

Validated as a working upstream-candidate demo, but not production grade yet.
The lab proves that live gNMIc/Prometheus telemetry can drive TopoViewer
runtime overlays through mounted topology, stylesheet, and mapper YAML. That is
not enough to archive this phase as production-ready.

The current demo still has production blockers: the Grafana plugin is
bind-mounted from this repository, the validation flow depends on local
operator knowledge, the upstream-candidate patch has not been reduced into a
fresh-clone one-command workflow, and the Containerlab smoke is not yet a
repeatable gate.

The Phase 4 mounted-bundle and mapper foundation has been archived. Phase 5 can
now consume that contract. The synthetic Grafana lab remains the deterministic
debug and CI baseline; Containerlab becomes the real telemetry validation path.

The current upstream-candidate delta is intentionally small: it keeps the
original `Network Telemetry` dashboard unchanged, adds a `Network Telemetry -
TopoViewer` B dashboard where only the `Network Telemetry` topology panel is
swapped to TopoViewer, adds one mounted TopoViewer bundle, adds one Prometheus
recording-rules file, and adds minimal mounts/env changes to the existing lab
definition. The live data path is gNMIc -> Prometheus -> recording rules ->
Grafana -> TopoViewer mapper. There is no TopoViewer-specific telemetry
normalizer in the production path.

Production readiness for Phase 5 means an engineer can start from a fresh lab
checkout, install or mount the TopoViewer plugin through a documented contract,
deploy the lab, generate traffic, and observe the TopoViewer dashboard without
knowing this monorepo's internal paths.

## What Changes

- Keep a local clone of the upstream telemetry lab as the PR candidate working
  tree and keep the delta easy to review.
- Adapt the existing spine/leaf/client topology, gNMIc, Prometheus, Grafana, and
  traffic flow instead of inventing a separate Containerlab stack.
- Keep the existing synthetic Grafana lab as the deterministic CI/debug path.
- Mount TopoViewer bundles into Grafana using `*.topo.tv.yaml`,
  `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
- Load the TopoViewer Grafana panel through a documented release-mode or
  development-mode plugin install contract.
- Replace the repo-relative plugin bind mount with a production-grade install
  contract before the phase is archived. A local dev mount may remain, but it
  must be explicit and optional.
- Scrape live SR Linux telemetry into Prometheus through gNMIc.
- Generate Prometheus recording rules from topology-authored telemetry bindings
  so mapper-friendly identities such as `link_id` and `direction` are produced
  without hand-maintaining a second object mapping table.
- Do not add a custom normalizer service as the production path.
- Prove live link state and bidirectional interface utilization update
  TopoViewer runtime overlays through mapper YAML.
- Add adjacency or node-health overlays only if the lab exposes stable metrics
  without making the first upstream-candidate patch brittle.
- Capture artifacts under `.artifacts/grafana-containerlab/`.
- Add a repeatable smoke command that validates Containerlab startup,
  Prometheus recording rules, Grafana plugin availability, bundle discovery,
  mapper coverage, rendered dashboard output, and traffic-driven overlay
  changes.
- Produce an upstream-ready patch that avoids repository-local paths and keeps
  the TopoViewer addition small enough for review.

## Out Of Scope

- Codespaces support.
- Large topology stress testing.
- Actual Grafana marketplace publication. The phase still needs a realistic
  release-artifact or plugin-install contract; it cannot depend only on a
  developer's local `dist` directory.
- Making Grafana the YAML authoring environment.
- Replacing the synthetic injector lab.
- Vendoring the TopoViewer Grafana plugin dist into the upstream lab repository.
- Adding a TopoViewer-specific normalizer sidecar to the upstream lab.
- Copying external repository URLs into public docs or OpenSpec text.
