## ADDED Requirements

### Requirement: VS Code feasibility baseline

TopoViewer SHALL treat VS Code as a feasible and high-leverage authoring
integration. While the package is private and experimental, public docs SHALL
describe it as experimental rather than supported.

Research anchors:

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code webviews](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [VS Code language extensions](https://code.visualstudio.com/api/language-extensions/overview)

#### Scenario: VS Code integration status is accurate

- **WHEN** the public integration roadmap mentions VS Code
- **THEN** it SHALL mark VS Code as an experimental package once
  `packages/vscode-topoviewer` exists
- **AND** it SHALL NOT claim VS Code integration is supported until there is a
  documented installation path and release artifact

#### Scenario: VS Code feasibility is authoring-focused

- **WHEN** the roadmap explains why VS Code integration is feasible
- **THEN** it SHALL frame VS Code around authoring preview, schema validation,
  semantic linting, examples, and export workflow
- **AND** it SHALL NOT frame VS Code as a production runtime surface

### Requirement: VS Code first integration shape

TopoViewer SHALL prefer an authoring extension with live preview before broader
IDE workflow automation.

#### Scenario: First VS Code integration is scoped as preview and validation

- **WHEN** VS Code integration work is planned
- **THEN** the first shape SHALL be:

```text
topology.yaml + stylesheet.yaml -> schema validation + semantic lint -> live preview webview
```

- **AND** the extension SHALL reuse the existing schema, semantic lint, example,
  and browser-renderer contracts where possible

#### Scenario: Extension package is implemented in the monorepo

- **WHEN** the first VS Code integration is implemented
- **THEN** the package SHALL live at `packages/vscode-topoviewer`
- **AND** the root workspace SHALL include the package
- **AND** the root build SHALL build the extension package
- **AND** the package SHALL expose commands to open a TopoViewer preview from
  `.yaml` and `.yml` authoring files
- **AND** the package SHALL pair `topology.yaml` and `stylesheet.yaml` through
  explicit configurable defaults
- **AND** the webview authoring surface SHALL use Monaco for topology and
  stylesheet YAML editing rather than a plain textarea

#### Scenario: Webview UI uses Material UI

- **WHEN** the VS Code preview webview UI is designed
- **THEN** authoring controls, diagnostics panels, toolbar actions, layer
  toggles, and preview settings SHALL use Material UI components
- **AND** the webview SHALL map Material UI theme tokens to VS Code webview
  theme variables where practical
- **AND** it SHALL NOT introduce an ad hoc component system for controls that
  Material UI already covers

#### Scenario: Webview UI has a browser-runnable harness

- **WHEN** VS Code integration implementation starts
- **THEN** it SHALL include a local browser-runnable test harness for the
  webview UI before extension-only manual testing is considered sufficient
- **AND** the harness browser client SHALL run the same React and Material UI
  webview app as the VS Code extension
- **AND** the browser client SHALL use a `BrowserHarnessHostAdapter` or
  equivalent mock host instead of `acquireVsCodeApi()`
- **AND** the harness SHALL run with a strict local Vite server on a fixed
  loopback port
- **AND** the harness SHALL load representative topology and stylesheet
  fixtures
- **AND** the harness SHALL exercise the same preview, diagnostics, layer
  controls, and export entry points used by the VS Code webview
- **AND** the harness SHALL keep the YAML editor scrollable and wide enough for
  practical topology review
- **AND** the harness SHALL keep preview actions in the preview's top-left
  corner
- **AND** the harness SHALL keep layer controls compact and scrollable
- **AND** every layer exposed by a harness fixture SHALL have at least one
  topology or diagram object behind it
- **AND** the harness SHALL expose compact object counts for layer controls

#### Scenario: Browser harness server exposes fixture and validation routes

- **WHEN** the browser harness server is implemented
- **THEN** it SHALL expose local fixture discovery and fixture content routes
- **AND** it SHALL expose local validation using the same schema and semantic
  lint contracts as TopoViewer
- **AND** it SHALL fail clearly when the configured local port is already in use
- **AND** it SHALL NOT become a production backend

#### Scenario: Browser harness has local and CI commands

- **WHEN** the browser harness is implemented
- **THEN** it SHALL provide a local run command such as `npm run vscode:harness`
- **AND** it SHALL provide a Playwright test command such as
  `npm run test:vscode-harness`
- **AND** the root CI path SHALL run the browser harness test command
- **AND** the Playwright command SHALL verify fixture loading, validation
  diagnostics, Monaco editor rendering, preview rendering, layer toggles,
  preview action placement, compact layer control styling, fixture layer object
  counts, and export wiring in a browser

#### Scenario: Browser harness supports light and dark review

- **WHEN** the browser harness loads
- **THEN** it SHALL initialize its theme from the browser system
  `prefers-color-scheme`
- **AND** it SHALL expose a toolbar control to switch between light and dark
  modes without changing operating system settings
- **AND** the switch SHALL affect the Material UI shell and the TopoViewer
  preview surface
- **AND** Playwright coverage SHALL verify system-default initialization and
  manual light/dark toggling

#### Scenario: Multi-file authoring is explicit

- **WHEN** VS Code preview behavior is designed
- **THEN** it SHALL define how topology YAML and stylesheet YAML are paired
- **AND** it SHALL handle missing or invalid companion files with diagnostics
  rather than silent fallback

### Requirement: VS Code use cases

TopoViewer SHALL document realistic VS Code use cases before implementation.

#### Scenario: Authoring workflow

- **WHEN** VS Code use cases are documented
- **THEN** they SHALL include live preview, schema validation, completion,
  semantic diagnostics, example creation, docs links, and screenshot/export
  commands
- **AND** they MAY include split-view review for network design documents

#### Scenario: Existing validation remains canonical

- **WHEN** VS Code diagnostics are described
- **THEN** they SHALL reuse or mirror the repo's schema and semantic lint rules
- **AND** the extension SHALL NOT define a divergent TopoViewer language

### Requirement: VS Code risks and non-goals

TopoViewer SHALL make VS Code integration risks explicit in the roadmap or
implementation plan.

#### Scenario: Webview packaging is a known risk

- **WHEN** VS Code preview work is planned
- **THEN** webview CSP, local resource loading, renderer asset packaging, and
  workspace trust behavior SHALL be listed as risks
- **AND** Material UI theme mapping and local browser harness parity SHALL be
  listed as risks
- **AND** strict local server behavior and fixture API drift SHALL be listed as
  risks

#### Scenario: Extension packaging is not included in product-story work

- **WHEN** the visual product story change is implemented
- **THEN** it SHALL NOT build or publish the VS Code extension
- **AND** the roadmap SHALL leave extension packaging, marketplace publishing,
  and versioning as future integration work

#### Scenario: Experimental package has release boundaries

- **WHEN** the VS Code package exists in the repo
- **THEN** marketplace publishing, VSIX release automation, custom editor
  write-back, and full language-server features SHALL remain explicit future
  work until they have their own implementation specs
