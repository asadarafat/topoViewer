# TopoViewer VS Code Extension

Experimental VS Code authoring preview for TopoViewer topology YAML.

## Extension Package

The extension contributes:

- `TopoViewer: Open Preview`
- `TopoViewer: Open Preview to Side`

Open a `topology.yaml`, `stylesheet.yaml`, or `mapper.tv.yaml` file and run one
of the commands. The preview pairs the active file with sibling files using
these default names:

- `topology.yaml`
- `stylesheet.yaml`
- `mapper.tv.yaml`

The defaults are configurable through `topoviewer.preview.defaultTopology` and
`topoviewer.preview.defaultStylesheet`. Mapper pairing is configurable through
`topoviewer.preview.defaultMapper`.

## Build

```bash
npm --workspace vscode-topoviewer run build
```

## Local Browser Harness

```bash
npm run vscode:harness
```

Open `http://127.0.0.1:5174/` to exercise the same React and Material UI
webview app outside VS Code.

The harness uses curated fixtures, a wide Monaco YAML editor for topology,
stylesheet, and mapper editing, a top-left preview action bar, compact scrollable layer
controls with object counts, diagnostics, and the real TopoViewer preview
surface.

Harness fixtures are intentionally stricter than narrative docs examples: every
layer shown in the layer panel must have at least one topology object behind it.

The harness starts in the browser system color scheme from
`prefers-color-scheme`. Use the toolbar theme button to switch between light and
dark while reviewing the webview UI.

### Authoring Workflow

YAML edits are drafts. Editing `Topology YAML`, `Stylesheet YAML`, or `Mapper
YAML` does not immediately mutate the canvas. Use `Apply` to validate and render
the draft, or `Revert draft` to restore the last applied YAML. Build, Inspect,
and Attention mutations are blocked while a draft is dirty so UI edits do not
race with unapplied text edits.

`YAML assist` opens Monaco completions for the current cursor context. Pressing
Space keeps normal text entry behavior. Press `Ctrl+Space` or `?` at structural
YAML locations for help; literal `?` remains editable inside comments, quoted
strings, and scalar values.

Diagnostics are durable below the fixture selector. Click a diagnostic to switch
to the matching YAML document and reveal the reported line.

Use `Download bundle` to export the current valid draft as Grafana-ready files:
`<graph>.topo.tv.yaml`, `<graph>.style.tv.yaml`, and `<graph>.mapper.tv.yaml`.

### Export

In the browser harness, the viewport export control downloads a PNG named from
the graph or fixture ID. In VS Code, the webview generates the PNG payload and
the extension host opens a save dialog before writing the file.

## Test

```bash
npm run test:vscode-harness
```

The Playwright harness verifies fixture loading, diagnostics, preview rendering,
Monaco editor rendering, layer toggles, preview action placement, export wiring,
YAML assist behavior, candidate Apply/Revert behavior, missing companion-file
diagnostics, and browser theme-mode behavior.
