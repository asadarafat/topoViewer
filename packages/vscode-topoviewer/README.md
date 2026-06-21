# TopoViewer VS Code Extension

Experimental VS Code authoring preview for TopoViewer topology YAML.

## Extension Package

The extension contributes:

- `TopoViewer: Open Preview`
- `TopoViewer: Open Preview to Side`

Open a `topology.yaml` or `stylesheet.yaml` file and run one of the commands.
The preview pairs the active file with a sibling file using these default names:

- `topology.yaml`
- `stylesheet.yaml`

The defaults are configurable through `topoviewer.preview.defaultTopology` and
`topoviewer.preview.defaultStylesheet`.

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

The harness uses curated fixtures, a wide Monaco YAML editor for topology and
stylesheet editing, a top-left preview action bar, compact scrollable layer
controls with object counts, diagnostics, and the real TopoViewer preview
surface.

Harness fixtures are intentionally stricter than narrative docs examples: every
layer shown in the layer panel must have at least one topology object behind it.

The harness starts in the browser system color scheme from
`prefers-color-scheme`. Use the toolbar theme button to switch between light and
dark while reviewing the webview UI.

## Test

```bash
npm run test:vscode-harness
```

The Playwright harness verifies fixture loading, diagnostics, preview rendering,
Monaco editor rendering, layer toggles, preview action placement, export wiring,
missing companion-file diagnostics, and browser theme-mode behavior.
