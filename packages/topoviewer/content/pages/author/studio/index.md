# Studio

**Support status:** Experimental

TopoViewer Studio is the canvas-first authoring application for portable
TopoViewer projects. It edits the same topology, stylesheet, mapper, and asset
files consumed by documentation, React applications, exports, and Grafana.
Studio does not ask where the bundle will be used before authoring it.

```text
palette + canvas + Inspector + YAML drawer
                      |
                      v
topology.yaml + stylesheet.yaml + optional mapper.yaml + assets
```

The canvas is the primary workspace. Drag objects from the palette, connect and
arrange them directly, then use the Inspector for exact fields. Open the YAML
drawer when source-level control or recovery is needed. Mapper authoring stays
inside the same project because telemetry binding is part of the portable
bundle, not a separate Grafana-only project.

## Run The Experimental App

From a repository checkout:

```bash
npm ci
npm run studio:dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5175/`.

Studio is not yet the default public authoring route. The Browser Harness
remains available while Studio completes preview-release and cutover gates.

## Workspace Areas

- **Object palette:** searchable node, path, region, annotation, asset, and
  preset templates.
- **Topology canvas:** selection, connection, movement, resize, grouping,
  alignment, layers, overlays, and presentation.
- **Inspector:** object facts and generated Basic, Advanced, All, and Modified
  style controls.
- **Workspace drawer:** lazy topology, stylesheet, and mapper YAML editors with
  diagnostics and recovery actions.
- **Telemetry mapper:** optional mapper rules, local sample analysis, coverage,
  and object-aware suggestions.
- **Project menu:** browser projects, portable archives, and host-owned project
  lifecycle operations.
- **Export panel:** image output, documentation snippets, project archives, and
  Grafana bundle packaging.

Studio internal state is not a runtime dependency. Exported source remains
valid TopoViewer YAML and can render without Studio.
