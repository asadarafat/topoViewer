## Design

### First integration shape

The first VS Code integration is an experimental authoring extension package at
`packages/vscode-topoviewer`:

```text
topology.yaml + stylesheet.yaml -> schema validation + semantic lint -> live preview webview
```

The extension reuses the current TopoViewer schema validation, semantic lint,
and browser renderer where practical.

### Verified VS Code API references

Verified against the official VS Code extension docs on 2026-06-20:

- Webviews support custom HTML/CSS/JavaScript UIs and extension message passing,
  but VS Code recommends using them only when native APIs are not enough.
- Custom editors can provide read/write editors for workspace resources and are
  implemented with webviews plus a document model.
- Language extensions cover declarative features such as snippets and syntax
  highlighting, plus programmatic features such as completion, diagnostics,
  formatting, and language-server-backed analysis.
- Workspace Trust must be handled explicitly when an extension reads workspace
  files, executes workspace code, or consumes workspace-defined settings.

### Package shape

The package is a private workspace package while the integration is still
experimental. It contributes commands to open a preview from `.yaml` and `.yml`
files, reads the active topology file and a sibling stylesheet file, and sends
that source text into a webview.

The extension host owns VS Code-specific concerns:

- command registration;
- topology/stylesheet file pairing;
- local workspace file reads;
- webview CSP and asset URI generation;
- save-event refreshes;
- docs and export command message handling.

The webview bundle owns browser-rendered concerns:

- YAML composition and validation;
- Monaco-based topology and stylesheet editing;
- diagnostics display;
- layer toggles;
- preview rendering;
- source text editing inside the webview session.

### Webview UI toolkit

The VS Code webview UI uses Material UI (`@mui/material` and
`@mui/icons-material`) for authoring controls, diagnostics panels, toolbar
actions, layer toggles, and preview settings.

Topology and stylesheet source editing uses Monaco rather than a plain text
area, with a bounded scrollable editor, monospace YAML formatting, and automatic
layout inside the webview. The editor column should be wide enough for practical
YAML review, while the preview remains the primary rendered output.

Material UI must be themed from VS Code webview CSS variables where practical so
the extension respects light, dark, and high-contrast editor themes. The
extension should avoid a separate ad hoc component system for controls that
Material UI already covers.

### Local browser test harness

Before relying on VS Code manual testing, the package provides a local
browser-runnable harness for the webview UI. The harness runs outside VS
Code with a normal dev server, load representative topology and stylesheet
fixtures, and exercise the same preview, diagnostics, layer controls, and export
entry points used by the extension webview.

The harness is not a production runtime surface. It exists to make webview UI
iteration, Playwright coverage, screenshot review, and CI debugging possible
without opening VS Code.

The browser harness starts from the browser system color scheme using
`prefers-color-scheme`. It also exposes a toolbar theme toggle so the same
fixture can be reviewed in light and dark modes without changing operating
system settings.

### Browser client/server contract

The local harness uses the same React and Material UI webview app as the VS Code
extension. Runtime behavior is selected through a host
adapter:

```text
shared React/MUI webview app
  -> VsCodeHostAdapter inside VS Code
  -> BrowserHarnessHostAdapter in local browser tests
```

The browser client runs with a mock host adapter that reads fixture data,
calls local validation, and stubs VS Code-only commands such as save, open docs,
and export. The client should still render the real preview, diagnostics panel,
toolbar, layer controls, and preview settings.

The server is a dev/test-only Vite server on fixed strict local port
`127.0.0.1:5174`. If the port is busy, the command fails clearly rather than
silently choosing another port.

The server may be Vite middleware or a small Node server wrapped by Vite, but it
should not become a production backend. Required local routes:

```text
GET /fixtures
GET /fixtures/:id/topology.yaml
GET /fixtures/:id/stylesheet.yaml
POST /validate
```

Expected commands:

```bash
npm run vscode:harness
npm run test:vscode-harness
```

`npm run vscode:harness` starts the strict local server and prints the browser
URL. `npm run test:vscode-harness` starts the same server through
Playwright and assert that fixture loading, validation diagnostics, preview
rendering, Monaco editor rendering, compact scrollable layer controls, top-left
preview actions, export wiring, and browser theme toggling work in a browser.
Harness fixtures should be curated for authoring review: every layer shown in
the layer panel should have at least one topology or diagram object behind it,
and the layer panel should expose compact object counts.

### Roadmap language

Use "experimental package" language while the package is private and not
marketplace-published. Do not mark VS Code as supported until the extension has
a documented install path and release artifact.

### Authoring boundary

VS Code should be the authoring experience, not a production runtime surface.

### Key risk

Webview CSP, local resource loading, renderer asset packaging, workspace trust,
Material UI theme mapping, strict local server behavior, local browser harness
parity, fixture API drift, and multi-file topology/stylesheet pairing remain the
key risks to keep testing before release.
