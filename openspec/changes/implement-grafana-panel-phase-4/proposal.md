# Implement Grafana Panel Phase 4: Mounted Bundle Mapper Foundation

## Why

Phase 1 proved the panel can render canonical fixtures. Phase 2 proved
Prometheus can drive link-state visuals. Phase 3 proved local interaction state
can survive refresh without rewriting YAML.

Phase 4 must make the workflow ergonomic enough to be useful outside the lab,
but its acceptance boundary is the mounted-bundle and mapper foundation rather
than dedicated operational dashboard playbooks.
The current fixture selector is too narrow: a real user should mount one bundle
root into the Grafana container and be done. Each bundle contains one complete
TopoViewer runtime set:

```text
*.topo.tv.yaml
*.style.tv.yaml
*.mapper.tv.yaml
```

The browser harness and VS Code harness are the authoring tools. Grafana is the
runtime dashboard surface that discovers mounted bundles, loads the selected
bundle, validates it, binds telemetry to topology objects, and shows mapping
coverage.

The benchmark is a generic SVG-first panel workflow. That model can be valuable
for arbitrary process diagrams, but TopoViewer should be easier for topology
diagrams because the topology model already has object IDs, links, paths,
regions, labels, data, layers, and styles.

## What Changes

- Add a mounted bundle source model to the Grafana panel.
- Load topology, stylesheet, and TopoViewer mapper YAML from the selected
  mounted bundle inside the Grafana container.
- Support multiple mounted bundles with deterministic discovery and panel
  selection.
- Keep generated harness fixtures only as a demo/test fallback, not the primary
  user workflow.
- Add a TopoViewer mapper schema that declares metric selectors, target object
  kinds, resolver modes, value extraction, thresholds, overlay behavior, and
  optional starter queries.
- Make mapper rules controlled any-to-any: any supported Grafana metric series
  can target any supported TopoViewer object kind through schema-defined
  resolvers and target-specific overlay adapters.
- Add topology source validation diagnostics for loading, parsing, composing,
  and semantic validation.
- Add mapping diagnostics that inspect compiled TopoViewer objects, mapper YAML,
  and Grafana data frames.
- Add generic target-specific runtime overlay support for nodes, links, paths,
  regions, layers, and graphs.
- Record node health, service path SLO, and routing adjacency as follow-up
  operational playbooks that consume this mapper foundation.
- Document the end-to-end workflow from authored YAML to operational Grafana
  panel.

## Non-Goals

- No external SVG import or graphics-layer element-ID mapping workflow.
- No Grafana-as-primary-authoring-environment behavior.
- No silent mutation of canonical topology or stylesheet YAML.
- No requirement for users to edit `catalog.yaml`, run fixture sync, or rebuild
  the plugin to use their own topology bundles.
- No plugin signing or marketplace release.
- No Containerlab/Codespaces work in this phase.
- No claim that dedicated node-health, service-path, or routing-adjacency
  dashboards are complete in this phase.
