## Phase 4: Mounted Bundle Source And Mapper Foundation

### Goal

Turn the exploratory fixture-backed panel into an ergonomic topology-as-code
Grafana workflow. The user should be able to mount one or more topology bundles
into the Grafana container, select a bundle, bind telemetry to topology objects
with explicit mapper rules, validate coverage, and apply runtime overlays
without relying on generated fixtures or SVG element IDs.

The benchmark is a generic SVG-first panel workflow. Those workflows can be
appropriate for arbitrary diagrams, but the happy path depends on external
drawing authoring and panel-side mapping glue. TopoViewer should be materially
easier for topology diagrams because topology identity, relationships, labels,
data, style, and attention behavior already exist in TopoViewer YAML.

### Ergonomic Product Contract

Phase 4 must satisfy these product rules:

- The primary artifact is TopoViewer topology/style YAML, not SVG.
- The harness is the authoring tool for topology/style YAML.
- Grafana loads mounted topology bundles from the container.
- Each bundle uses canonical suffixes: `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`.
- Mounted bundles are the default and primary Grafana source mode.
- Generated fixtures remain useful for demos and CI compatibility, but they are
  deprecated as production input.
- `npm run grafana:lab:up` starts the production-shaped mounted bundle lab
  without requiring fixture sync or fixture check.
- The panel validates source loading, YAML parsing, TopoViewer validation, and
  object mapping before the operator has to debug Grafana query output.
- Mapping is topology-native: `node_id`, `link_id`, `path_id`, `region_id`,
  labels, and data fields are first-class.
- `*.mapper.tv.yaml` declares metric selectors, target object kinds, resolver
  modes, value extraction, thresholds, overlays, and starter PromQL.
- Mapper rules are controlled any-to-any: any supported Grafana metric series
  can target any supported TopoViewer target kind through schema-defined
  resolvers and target-specific overlay adapters.
- Supported target kinds include `node`, `link`, `path`, `region`, `layer`, and
  `graph`, where `layer` and `graph` are aggregate targets.
- `*.mapper.tv.yaml` is schema-backed and authored with browser/VS Code harness
  suggestions.
- The panel shows mapping coverage: matched objects, unmatched telemetry,
  unmapped topology objects, duplicate mappings, and stale IDs.
- Runtime interaction remains separate from source YAML.
- Dedicated node-health, service-path, and routing-adjacency dashboards are
  follow-up playbooks. Phase 4 provides the mapper foundation they must reuse.

### Mounted Bundle Source

Phase 4 should add a mounted bundle source model:

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

The panel frontend cannot directly read container files, so implementation must
provide a Grafana backend/resource endpoint or equivalent provisioning mechanism
that discovers bundles and delivers the selected mounted bundle to the panel
runtime.

### TopoViewer Mapper Diagnostics

Telemetry mapper diagnostics should be the main ergonomic differentiator.

They should inspect the compiled topology, mapper YAML, and Grafana data frames:

- available nodes, links, paths, regions, labels, data keys, and layers;
- recommended metric labels for the selected object type;
- starter PromQL from `*.mapper.tv.yaml`;
- current Grafana query coverage;
- unmatched telemetry samples and likely intended objects;
- duplicate or ambiguous mappings;
- threshold policy that will affect visual severity.

Recommended mapping defaults:

```text
node_id   -> graph.nodes[].id
link_id   -> graph.links[].id
path_id   -> graph.paths[].id
region_id -> graph.regions[].id
```

Fallback matching may use `source` + `target` for links, but it must warn when
parallel links exist because endpoint matching is ambiguous.

Generic resolver modes should include ID matching, label matching, data-field
matching, endpoint matching, TopoViewer selector matching, aggregate matching,
and explicit static object ID lists. This keeps the workflow flexible without
allowing arbitrary JavaScript in mapper YAML.

### Follow-Up Playbook: Node Health And Capacity Hotspots

This is not Phase 4 acceptance. It documents a later operational playbook that
should consume the generic mapper foundation.

Candidate metrics:

```text
topoviewer_node_up{node_id,site,pod,role} 0|1
topoviewer_node_cpu_utilization_percent{node_id,site,pod,role} number
topoviewer_node_memory_utilization_percent{node_id,site,pod,role} number
topoviewer_node_temperature_celsius{node_id,site,pod,role} number
```

Expected behavior for the follow-up playbook:

- node status marker maps to health;
- outline color maps to worst active severity;
- badge label shows `CPU`, `MEM`, `DOWN`, or reduced metric value;
- degraded node selection remains stable across telemetry refresh.

### Follow-Up Playbook: Service Path SLO And Blast Radius

This is not Phase 4 acceptance. It documents a later operational playbook that
should consume the generic mapper foundation.

Candidate metrics:

```text
topoviewer_service_error_rate{service,path_id,tenant} number
topoviewer_service_latency_ms{service,path_id,tenant} number
topoviewer_service_packet_loss_percent{service,path_id,tenant} number
```

Expected behavior for the follow-up playbook:

- breached service path is focused;
- endpoints and transit nodes are highlighted;
- unrelated context dims;
- clearing focus restores topology context but keeps telemetry warning styles.

### Follow-Up Playbook: Routing Adjacency Health

This is not Phase 4 acceptance. It documents a later operational playbook that
should consume the generic mapper foundation.

Candidate metrics:

```text
topoviewer_bgp_session_up{node_id,peer,site} 0|1
topoviewer_isis_adjacency_up{node_id,peer,site} 0|1
topoviewer_ospf_neighbor_up{node_id,peer,site} 0|1
```

Expected behavior for the follow-up playbook:

- affected nodes show `BGP`, `ISIS`, or `OSPF` badges;
- matching peer links are highlighted when present;
- protocol overlays can be toggled independently from the weathermap overlay.

### Documentation Workflow

Docs must cover:

1. Author topology in the browser harness or VS Code.
2. Author `*.mapper.tv.yaml` with schema-backed harness suggestions.
3. Save one or more bundles using `*.topo.tv.yaml`, `*.style.tv.yaml`, and
   `*.mapper.tv.yaml`.
4. Mount the bundle root into the Grafana container.
5. Select a bundle in the panel.
6. Validate topology YAML, stylesheet YAML, and mapper YAML inside Grafana.
7. Inspect discovered nodes, links, paths, regions, labels, and data keys.
8. Configure Grafana queries from mapper starter PromQL.
9. Confirm mapping coverage before relying on visuals.
10. Inject telemetry scenario.
11. Confirm Prometheus stores the change.
12. Confirm Grafana query frames carry the data.
13. Confirm TopoViewer visual state changes.
14. Interact with the panel: pan, zoom, select, focus, drag, refresh, reset.

### Documentation Production Bar

The Phase 4 docs are incomplete unless they are usable by someone who has not
worked on the monorepo. They must not assume generated fixtures, internal
source paths, or implicit mapper behavior.

Required pages or sections:

- overview: what Grafana integration is and what status it has;
- quick start: synthetic Prometheus lab with expected screenshots;
- bundle layout: canonical suffixes and Docker mount examples;
- harness workflow: author topology/style/mapper YAML and export the bundle;
- mapper guide: simple rules, states, style overlays, thresholds, and target
  kinds;
- mapper reference: accepted values for target kinds, resolver modes, overlay
  keys, and state expressions;
- Prometheus guide: metric labels, starter PromQL, expected frame shape, and
  common mistakes;
- panel options: source mode, selected bundle, interaction persistence,
  diagnostics, and reset behavior;
- coverage diagnostics: matched, unmatched, duplicate, ambiguous, stale, and
  unsupported overlay examples;
- troubleshooting: source loading, YAML parsing, mapper schema, query shape,
  no data, stale telemetry, version mismatch, and lab startup;
- production boundary: what is lab-only, what is production-shaped, and what
  waits for signed/pinned plugin artifacts.

Every major workflow should include "Expected result" and "What to inspect".
Architecture diagrams are useful only after the copyable workflow is clear.

### Object Identity Mapping

Prefer stable IDs:

```text
node_id -> graph.nodes[].id
link_id -> graph.links[].id
path_id -> graph.paths[].id
region_id -> graph.regions[].id
```

Allow label matching for inventory dimensions:

```text
site, pod, rack, role, service, tenant
```

### Acceptance

- A user can create a dashboard panel from existing TopoViewer YAML without
  creating or editing an SVG.
- A user does not need to edit the repo catalog, run fixture sync, or rebuild
  the plugin for a new topology.
- A user can mount a bundle root containing multiple topology bundles into
  Grafana and select a bundle in the panel.
- The default Grafana lab starts from mounted bundles and does not require
  generated fixture checks.
- Existing fixture dashboards remain compatibility/demo coverage but are not the
  production path.
- A user can see mapping coverage before telemetry is trusted.
- A user can use starter PromQL from `*.mapper.tv.yaml`.
- The panel warns on ambiguous endpoint matching and recommends stable IDs.
- Follow-up operational playbooks can reuse the mapper foundation without
  adding hard-coded metric behavior to the panel.
- Troubleshooting covers version mismatch, missing fixture, missing telemetry
  labels, no telemetry update, stale refresh, source-load failure, YAML parse
  failure, ambiguous mapping, and lab startup failure.
- Documentation lets an early adopter complete the mounted-bundle flow without
  reading source code or knowing monorepo internals.
- Documentation includes expected screenshots or visual states for healthy,
  degraded, and failed mapping scenarios.
