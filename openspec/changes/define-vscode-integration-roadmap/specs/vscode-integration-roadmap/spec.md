## ADDED Requirements

### Requirement: VS Code feasibility baseline

TopoViewer SHALL treat VS Code as a feasible and high-leverage authoring
integration, not as a currently supported integration.

Research anchors:

- [VS Code Extension API](https://code.visualstudio.com/api)
- [VS Code webviews](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code custom editors](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [VS Code language extensions](https://code.visualstudio.com/api/language-extensions/overview)

#### Scenario: VS Code roadmap status is accurate

- **WHEN** the public integration roadmap mentions VS Code
- **THEN** it SHALL mark VS Code as planned or feasibility until an
  extension package exists
- **AND** it SHALL NOT claim VS Code integration is supported

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

#### Scenario: Extension packaging is not included in product-story work

- **WHEN** the visual product story change is implemented
- **THEN** it SHALL NOT build or publish the VS Code extension
- **AND** the roadmap SHALL leave extension packaging, marketplace publishing,
  and versioning as future integration work
