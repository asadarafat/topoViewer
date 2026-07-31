# Studio

**Support status:** Beta Preview

TopoViewer Studio is the YAML-first authoring application for portable
TopoViewer projects. It edits the same topology, stylesheet, mapper, and asset
files consumed by documentation, React applications, exports, and Grafana.
Studio does not ask where the bundle will be used before authoring it.

```text
project source + shared YAML editor + real TopoViewer preview
                              |
                              v
topology.yaml + stylesheet.yaml + optional mapper.yaml + assets
```

Project source is persistent on desktop. One shared Monaco editor opens
`topology.yaml`, candidate `stylesheet.yaml`, and optional `mapper.yaml`.
**Source**, **Split**, and **Preview** change only presentation; Split defaults
to one-quarter source and three-quarters preview. The preview is the public
TopoViewer renderer, not a Studio-specific approximation.

Open **Object drawer** to add objects. Selecting an object opens preview-local
Properties for topology and appearance; selecting empty preview opens canvas,
grid, interaction, and layer settings. Mapper Visual can remain pinned while
selection changes. Every visual mutation commits through the same document
session and appears in the shared source editor.

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

- **Project source:** project identity, YAML documents, optional mapper, assets,
  layers, problems, topology outline, and authoring entry points.
- **Shared source workspace:** one lazy Monaco editor with schema assistance,
  diagnostics, search, context help, Apply, Revert, and source-range
  navigation.
- **Source/Split/Preview:** one presentation choice that preserves source
  drafts, selection, viewport, history, and contextual authoring state.
- **Topology preview:** selection, connection, movement, resize, grouping,
  alignment, layers, overlays, and presentation through the public renderer.
- **Contextual drawer:** exactly one preview-local Add, Properties, canvas
  Properties, or Mapper Visual surface at a time; it never embeds another
  source editor.
- **Telemetry mapper:** optional rule forms, local sample analysis, coverage,
  object-aware suggestions, and source navigation to shared `mapper.yaml`.
- **Appearance menu:** follows the operating system or pins Studio to Light or
  Dark without changing project YAML.
- **Project menu:** browser projects or native directory projects, portable
  archives, and host-owned project lifecycle operations.
- **Export panel:** image output, documentation snippets, project archives, and
  Grafana bundle packaging.
- **Session dock:** Problems, Changes, Selection, History, and Host evidence
  derived from the authoritative session and host.
- **Status bar:** problem count, project revision, selection, source position,
  zoom, and active host. Save state stays beside Save in the command bar.

Studio internal state is not a runtime dependency. Exported source remains
valid TopoViewer YAML and can render without Studio.
