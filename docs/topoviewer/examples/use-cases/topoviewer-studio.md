# TopoViewer Studio

**Support status:** Beta Preview

This example keeps one portable bundle intact while changing the surface around
it. The graph below is the documentation consumer. The same three source files
are also the Studio import fixture and the Grafana consumer contract fixture.

```topoviewer
topology: examples/integration/studio-portable-bundle/topology.yaml
stylesheet: examples/integration/studio-portable-bundle/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: Studio portable bundle
```

## Try The Authoring Loop

Start Studio from the repository:

```bash
npm run studio:dev
```

In a browser that supports directory selection, open **Project menu**, choose
**Open folder**, and select:

```text
packages/topoviewer/content/examples/integration/studio-portable-bundle
```

Select `edge-a`, edit its name in the Inspector, inspect the generated source
diff, then undo the change. Open **Telemetry mapper** and paste a sample:

```json
{
  "metric": "topoviewer_link_up",
  "source_id": "studio-portable-consumer",
  "link_id": "edge-a-core-b",
  "up": 0
}
```

Coverage should resolve the sample to `edge-a-core-b` and classify the `down`
state. The topology ID and link ID do not change when runtime state changes.

??? example "Use archive import when folder access is unavailable"

    Browser folder access is not available everywhere. Create a Studio project,
    use **Edit > Code** for topology and stylesheet source and **Mapper > Code**
    for mapper source. Export a `.tvstudio` archive after validation so the
    complete project can move as one file.

## Publish The Documentation

This page is authored once in the canonical docs tree. `npm run sync:docs`
projects it into both MkDocs and Zensical. The live viewport references the same
example files rather than copying YAML into each documentation page.

??? example "Inspect the canonical mapper"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/studio-portable-bundle/mapper.yaml"
    ```

## Package It For Grafana

In Studio, open **Export project > Grafana**. The readiness check confirms that
`mapper.yaml` is present and valid before **Export Grafana bundle** becomes
the production action. Studio then emits the mounted-bundle layout:

```text
studio-portable-consumer/
  studio-portable-consumer.topo.tv.yaml
  studio-portable-consumer.style.tv.yaml
  studio-portable-consumer.mapper.tv.yaml
  manifest.json
```

Grafana receives runtime data frames and applies mapper overlays, but it does
not own a different topology. Tests compile this canonical bundle through both
the core renderer and the Grafana runtime model to detect semantic drift.

## Reuse The Pattern

Keep one directory as the canonical bundle owner. Make authoring tools read and
write those files, make docs embed them, and make operational packaging rename
or wrap them without changing graph identity. Add a source-specific converter
before the bundle when inventory comes from Kubernetes, NetBox, Infrahub, or an
internal API; do not put source normalization inside each render surface.
