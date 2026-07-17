# Studio

**Support status:** Experimental

TopoViewer Studio is the canvas-first authoring application for portable
TopoViewer projects. It edits the same topology, stylesheet, mapper, and asset
files consumed by documentation, React applications, exports, and Grafana.
Studio does not ask where the bundle will be used before authoring it.

```text
Objects | Edit | Viewport | Mapper  +  canvas
                            |
                            v
topology.yaml + stylesheet.yaml + optional mapper.yaml + assets
```

The canvas is the primary workspace. Drag objects from Objects, connect and
arrange them directly, then select an object to open Edit. Visual presents
topology fields and appearance together; Code exposes `topology.yaml` and
candidate `stylesheet.yaml` as file tabs. Open Mapper for telemetry rules and
its optional `mapper.yaml` Code view. Switch workspaces from the persistent
vertical rail without losing selection or canvas position. Mapper authoring
stays inside the same project because telemetry binding is part of the portable
bundle, not a separate Grafana-only project.

## Run The Experimental App

Open the opt-in [Studio preview](https://asadarafat.github.io/topoviewer/studio/)
in a current desktop browser. The preview stores browser projects locally and
does not replace the published Harness.

Use the **Preview feedback** action in Studio to report the completed workflow,
hesitation points, recovery behavior, and unsupported expectations through the
structured [Studio preview feedback form](https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml).

To run the same application from a repository checkout:

```bash
npm ci
npm run studio:dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5175/`.

Studio is not yet the default public authoring route. The Browser Harness
remains available while Studio completes preview-release and cutover gates.

## Workspace Areas

- **Workspace rail:** switches one left panel between Objects, Edit, Viewport,
  and Mapper while preserving canvas context.
- **Objects workspace:** searchable canonical object families with basic, styled,
  and user-preset templates.
- **Topology canvas:** selection, connection, movement, resize, grouping,
  alignment, layers, overlays, and presentation.
- **Edit workspace:** selection-scoped topology and appearance fields, a
  `Visual | Code` representation switch, project file
  tabs, latest-valid preview, diagnostics, Apply, and Revert.
- **Telemetry mapper:** optional mapper rules, local sample analysis, coverage,
  object-aware suggestions, and a `Visual | Code` switch for `mapper.yaml`.
- **Project menu:** browser projects, portable archives, and host-owned project
  lifecycle operations.
- **Export panel:** image output, documentation snippets, project archives, and
  Grafana bundle packaging.

Studio internal state is not a runtime dependency. Exported source remains
valid TopoViewer YAML and can render without Studio.
