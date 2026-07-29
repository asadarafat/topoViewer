# Studio

**Support status:** Beta Preview

TopoViewer Studio is the canvas-first authoring application for portable
TopoViewer projects. It edits the same topology, stylesheet, mapper, and asset
files consumed by documentation, React applications, exports, and Grafana.
Studio does not ask where the bundle will be used before authoring it.

```text
canvas  +  rail: Add | Properties | Mapper | Project
                         |
                         v
topology.yaml + stylesheet.yaml + optional mapper.yaml + assets
```

The canvas is the primary workspace and occupies one unbroken rectangle. A rail
on the trailing edge names four destinations, and the panel beside it shows one
of them at a time. Drag objects from Add, connect and arrange them directly,
then select an object to point the panel at Properties. Properties Visual
presents topology fields and appearance together; Properties Code exposes
`topology.yaml` and candidate `stylesheet.yaml` as file tabs. Clicking empty
canvas opens canvas Properties for grid, alignment, and viewport settings.
Open Mapper for telemetry rules and its optional `mapper.yaml` Code view.
Mapper remains active while the selection changes so rules can be bound across
objects without repeatedly reopening it. Selection, canvas position, and
Visual or Code state survive workspace changes.

## Open Studio

Open [TopoViewer Studio](https://asadarafat.github.io/topoviewer/studio/) in a
current desktop Chrome or Edge browser. Studio stores browser projects locally;
export a portable project archive or source bundle before moving work between
browsers or machines.

Use the **Preview feedback** action in Studio to report the completed workflow,
hesitation points, recovery behavior, and unsupported expectations through the
structured [Studio preview feedback form](https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml).

To run the same application from a repository checkout:

```bash
npm ci
npm run studio:dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5175/`.

Browser Studio is available as a Beta Preview. Desktop Studio is an
Experimental Wails distribution of the same application for native directory
projects. The exported TopoViewer YAML bundle is the compatibility boundary;
Studio's internal React and native bridge APIs are not public, and
collaborative editing is not provided. Firefox and WebKit run the golden
compatibility journey, but they are not yet primary supported browser targets;
use archive import/export where directory access is unavailable.

## Workspace Areas

- **Workspace rail:** switches the one authoring panel between Add, Properties,
  Mapper, and Project while preserving canvas context. Selecting a destination
  always shows it; a separate control on the rail, and a close control in each
  panel header, hide the panel. The panel resizes between 320 and 560 pixels,
  and its width, destination, and collapsed state are restored on relaunch.
- **Add workspace:** searchable canonical object families with basic, styled,
  and user-preset templates.
- **Topology canvas:** selection, connection, movement, resize, grouping,
  alignment, layers, overlays, and presentation.
- **Properties workspace:** selection-scoped topology and appearance fields, or
  canvas settings when no object is selected. It has a
  `Visual | Code` representation switch, project file
  tabs, latest-valid preview, diagnostics, Apply, and Revert.
- **Telemetry mapper:** optional mapper rules, local sample analysis, coverage,
  object-aware suggestions, and a `Visual | Code` switch for `mapper.yaml`.
- **Appearance menu:** follows the operating system or pins Studio to Light or
  Dark without changing project YAML.
- **Project menu:** browser projects or native directory projects, portable
  archives, and host-owned project lifecycle operations.
- **Project workspace:** the project's source files with invalid-draft badges,
  plus layer creation, ordering, and visibility.
- **Export panel:** image output, documentation snippets, project archives, and
  Grafana bundle packaging.
- **Readout:** problem count, object and link counts, zoom, and the active host.
  Save state stays beside the Save action in the command bar.

Studio internal state is not a runtime dependency. Exported source remains
valid TopoViewer YAML and can render without Studio.
