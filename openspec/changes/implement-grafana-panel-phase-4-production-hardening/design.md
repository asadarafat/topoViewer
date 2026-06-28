## Design

### Product Contract

The Grafana plugin should be production-shaped around mounted topology bundles:

```text
/etc/topoviewer/bundles/
  bundle-a/
    bundle-a.topo.tv.yaml
    bundle-a.style.tv.yaml
    bundle-a.mapper.tv.yaml
```

The panel backend discovers bundles and serves selected YAML to the browser
panel. The browser panel composes TopoViewer YAML and applies mapper-driven
runtime overlays from Grafana data frames.

Generated harness fixtures are not production input. They are a test and demo
projection derived from canonical TopoViewer content.

### Source Modes

Source modes remain:

```ts
sourceMode: "mountedBundle" | "fixture"
```

Production defaults should use:

```yaml
sourceMode: mountedBundle
mountedBundle:
  bundleRoot: /etc/topoviewer/bundles
```

Fixture mode remains accepted for existing dashboards, but UI and docs should
label it as a bundled example or legacy compatibility mode, not as the normal
user workflow.

### Lab Startup

`npm run grafana:lab:up` should be production-shaped:

```text
check pinned versions
check ports
build Grafana plugin
start Grafana + Prometheus + telemetry injector
mount labs/grafana-topoviewer/topoviewer-bundles as /etc/topoviewer/bundles
print Phase 4 topology bundle dashboard URL
```

It should not run:

```text
npm run grafana:fixtures:check
```

Fixture parity belongs to explicit commands and CI:

```text
npm run grafana:fixtures:check
npm run grafana:fixtures:sync
npm run grafana:lab:smoke:phase1
```

If a local command for legacy fixture dashboards is still useful, it should be
named explicitly, for example:

```text
npm run grafana:lab:up:fixtures
```

### Dashboard Shape

Phase 4 should be the default dashboard in the local Grafana lab. Phase 1/2
dashboards can stay provisioned for regression visibility, but docs and startup
output should clearly identify Phase 4 as the production-shaped workflow.

Static Grafana panel titles should stay generic because the selected topology is
dynamic inside the panel. The plugin header should show the selected topology
name without repeating the static Grafana panel title. For example, Grafana may
show `TopoViewer` as the panel title while the plugin body shows only
`Clos 2spine 4leaf`.

Local lab dashboards should be editable from the Grafana UI. Provisioning still
seeds the dashboards from checked-in JSON, but `allowUiUpdates` lets operators
experiment and save edits into the running Grafana database. Those UI edits are
lab state, not automatic source-file updates.

Mounted bundle YAML should be refetched when the Grafana dashboard refreshes
data, when the browser page reloads, or when the selected bundle changes. This
keeps the lab workflow ergonomic for editing `*.topo.tv.yaml`,
`*.style.tv.yaml`, and `*.mapper.tv.yaml` on disk without restarting Grafana.

### Compatibility

Existing dashboards with `sourceMode: fixture` should continue to render. The
compatibility path must not block production lab startup or mounted-bundle
validation.

### Validation

Acceptance requires:

- `npm run grafana:lab:up` succeeds without generated fixture checks;
- Phase 4 smoke validates mounted bundle discovery, rendering, mapper parsing,
  and telemetry overlay behavior;
- the local provisioned dashboard can be edited and saved from the Grafana UI;
- mounted YAML edits are visible after a Grafana dashboard refresh without
  restarting Grafana;
- fixture parity still has a dedicated CI/dev check;
- docs make mounted bundles the primary Grafana workflow;
- full CI and generated-output checks pass before archiving Phase 4.
