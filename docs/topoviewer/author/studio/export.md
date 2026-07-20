# Export

**Support status:** Beta Preview

Export reads an immutable snapshot of the current valid project. It never
normalizes or mutates authoring source as a side effect.

## Project Archive

Open **Project menu**, open the project's action menu, and choose **Export
archive** for a deterministic `.tvstudio` project. This is the portable Studio
interchange format and includes source, metadata, and validated local assets.

## Images

Open **Export project > Image** to select PNG or SVG, bounded output dimensions,
and the canvas, transparent, light, or dark background. Studio reports the
resulting file name and size after download. SVG exports keep font references
instead of embedding the complete application font surface, which keeps the
artifact portable and bounded. Remote assets are not fetched during export.
Presentation mode can be used to inspect framing; leaving it restores authoring
selection and viewport.

## Documentation Bundle

Open **Export project > Documentation** and choose MkDocs or Static HTML. Copying
the embed snippet is useful when the destination already owns the YAML files.
Exporting the documentation bundle produces a deterministic ZIP containing:

```text
topology.yaml
stylesheet.yaml
mapper.yaml, when needed
project assets
embed.mkdocs.md or embed.static.html
README.md
manifest.json
```

The embed file and its referenced YAML paths share the bundle root. The README
records the target-specific deployment steps. Private Studio state is not
included.

## Grafana Bundle

Open **Export project > Grafana** to see bundle readiness before export. Grafana
packaging requires valid mapper YAML. When it is missing or invalid, Studio
links directly to the Mapper workspace instead of starting an export that must
fail. A ready project emits the mounted-bundle filenames and manifest expected
by the TopoViewer panel. Containerlab is not a runtime requirement; it is only
used by the repository demo to produce telemetry.

Export errors keep the project dirty and editable. Correct the reported limit
or host failure, then retry without recreating the project.
