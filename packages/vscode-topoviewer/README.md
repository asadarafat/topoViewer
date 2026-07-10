# TopoViewer Studio For VS Code

**Support status:** Experimental

This package is the VS Code workspace host for the shared TopoViewer Studio
application. Studio owns canvas, Inspector, mapper, YAML, history, recovery,
and export behavior. The extension owns only workspace files, VS Code dialogs,
preferences, file watches, trust checks, CSP, and typed webview transport.

## Open A Bundle

Open a topology, stylesheet, or mapper YAML file and run one of these commands:

- `TopoViewer: Open Studio`
- `TopoViewer: Open Studio to Side`

The stable command IDs remain `topoviewer.openPreview` and
`topoviewer.openPreviewToSide` for compatibility. Companion files are resolved
from the active file's directory using these configurable defaults:

- `topology.yaml`
- `stylesheet.yaml`
- `mapper.tv.yaml`

Studio reads only inside that bundle root. Saving and asset/export operations
are disabled when the workspace is untrusted. A disk change refreshes a clean
session; a dirty session keeps both versions and offers diff, keep-draft, and
reload-disk decisions.

## Build And Verify

```bash
npm --workspace vscode-topoviewer run build
npm --workspace vscode-topoviewer run test:unit
npm --workspace vscode-topoviewer run test:studio-host
npm --workspace vscode-topoviewer run test:extension
```

`test:studio-host` runs the shared authoring journey through the typed VS Code
message bridge in Chromium. `test:extension` runs activation, command, workspace,
and webview checks in an isolated VS Code Extension Development Host.

The legacy Browser Harness remains a separate rollback surface during Studio's
experimental cutover. It is not the extension webview implementation.
