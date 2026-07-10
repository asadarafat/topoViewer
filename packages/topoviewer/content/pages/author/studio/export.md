# Export

**Support status:** Experimental

Export reads an immutable snapshot of the current valid project. It never
normalizes or mutates authoring source as a side effect.

## Project Archive

Use **Project menu > Export archive** for a deterministic `.tvstudio` project.
This is the portable Studio interchange format and includes source, metadata,
and validated local assets.

## Images

Open **Export project** to select PNG or SVG and bounded output dimensions.
Remote assets are not fetched during export. Presentation mode can be used to
inspect framing; leaving it restores authoring selection and viewport.

## Documentation Snippets

MkDocs and static HTML snippets reference the canonical YAML files. They do not
embed private Studio state:

```text
topology.yaml
stylesheet.yaml
mapper.yaml, when needed
```

## Grafana Bundle

Grafana packaging requires valid mapper YAML. It emits the mounted-bundle
filenames and manifest expected by the TopoViewer panel. Containerlab is not a
runtime requirement; it is only used by the repository demo to produce
telemetry.

Export errors keep the project dirty and editable. Correct the reported limit
or host failure, then retry without recreating the project.
