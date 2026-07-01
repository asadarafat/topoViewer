# Grafana Mounted Bundle Contract Evidence

## Scope

This evidence covers the production-shaped Grafana adoption path:

1. Author topology, stylesheet, and mapper YAML in the TopoViewer harness.
2. Export or save the files with canonical suffixes:
   - `*.topo.tv.yaml`
   - `*.style.tv.yaml`
   - `*.mapper.tv.yaml`
3. Mount the directory into Grafana under the configured bundle root.
4. Select the bundle in the TopoViewer Grafana panel.

The user must not edit a fixture catalog, run fixture sync, or rebuild the
plugin for normal bundle changes.

## Implemented Checks

### Frontend Runtime

`packages/grafana-topoviewer-panel/tests/runtimeModel.test.ts` includes
`renders a harness-exported canonical bundle without fixture catalog data`.

That test builds a mounted-bundle payload with:

- a canonical topology file path;
- a canonical stylesheet file path;
- a canonical mapper file path;
- compact authoring-oriented mapper `rules`;
- a deliberately present `fixtureId` option.

It verifies:

- the runtime uses `sourceMode: mountedBundle`;
- no fixture catalog entry is used;
- the composed graph ID comes from the mounted topology YAML;
- the mapper identity and rule are parsed from the mounted mapper YAML;
- the rendered TopoViewer props reference the mounted document.

### Grafana Backend Resource

`packages/grafana-topoviewer-panel/pkg/plugin/bundles_test.go` includes
`TestBundleResourceReadsHarnessExportedCanonicalBundle`.

That test writes the three canonical files into a temporary allowed bundle root,
then calls the same plugin resource endpoints used by Grafana:

- `bundles`
- `bundle`

It verifies:

- suffix-based discovery finds the bundle without a manifest;
- the response contains logical, not host-absolute, paths;
- topology, stylesheet, and mapper YAML are returned from the mounted files;
- the response does not leak the mounted filesystem root.

## Validation

Targeted command run:

```bash
npm --workspace grafana-topoviewer-panel run test
```

Result:

- Vitest: 11 files, 59 tests passed.
- Go backend tests: `pkg/plugin` passed.
