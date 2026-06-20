## 0. Integration Roadmap Inputs

- [x] 0.1 Review `define-netbox-integration-roadmap` for topology/data import and inventory-driven diagram generation
- [x] 0.2 Review `define-opsmill-infrahub-integration-roadmap` for graph-native infrastructure data and intended-state topology views
- [x] 0.3 Review `define-grafana-integration-roadmap` for panel or embeddable runtime integration in operational dashboards
- [x] 0.4 Review `define-vscode-integration-roadmap` for authoring preview, schema validation, semantic lint, and example workflow
- [x] 0.5 Decide public roadmap statuses from the standalone integration changes, not assumptions

## 1. Product Story Design

- [x] 1.1 Audit current README and public docs first-screen experience
- [x] 1.2 Define the exact README opening structure and visual asset placement
- [x] 1.3 Define the "Why TopoViewer?" claims and map each claim to shipped behavior or roadmap status
- [x] 1.4 Define integration roadmap statuses for React/TypeScript, MkDocs, NetBox, OpsMill/Infrahub, Grafana, and VS Code
- [x] 1.5 Decide whether the README visual is a generated screenshot, a linked live demo, or both

## 2. Before/After Demo

- [x] 2.1 Create a compact realistic network example for YAML -> rendered diagram
- [x] 2.2 Include topology YAML, stylesheet YAML, and internal expected assertions
- [x] 2.3 Make the visual polished enough for README use without relying on stock imagery
- [x] 2.4 Add a repeatable screenshot capture or document the source example for manual refresh
- [x] 2.5 Add focused Playwright assertions for the rendered before/after example

## 3. Real Network Demo Page

- [x] 3.1 Add or refine an underlay scenario
- [x] 3.2 Add or refine a BGP/session scenario
- [x] 3.3 Add or refine a service-path scenario
- [x] 3.4 Add or refine a failure-view scenario
- [x] 3.5 Publish the scenarios as one coherent public demo page
- [x] 3.6 Ensure public docs show live viewport, topology YAML, stylesheet YAML, and Attention YAML only when relevant

## 4. README And Docs

- [x] 4.1 Rewrite the README opening so visual product proof comes before monorepo/package architecture
- [x] 4.2 Add a clear "Why TopoViewer?" docs page or section
- [x] 4.3 Add NetBox, OpsMill/Infrahub, MkDocs, Grafana, and VS Code integration roadmap documentation from the standalone integration changes
- [x] 4.4 Add navigation entries so the product story and demo are easy to find
- [x] 4.5 Keep engineering docs, package boundaries, local preview commands, and quality gates available below the product story

## 5. MkDocs And Zensical Sync

- [x] 5.1 Update source docs under `packages/topoviewer/docs`
- [x] 5.2 Run `npm run sync:docs`
- [x] 5.3 Run Zensical docs sync if the selected pages are shared with Zensical
- [x] 5.4 Verify generated MkDocs and Zensical pages contain equivalent product-story content or documented differences

## 6. Validation

- [x] 6.1 Run `npm run validate:schemas`
- [x] 6.2 Run `npm run validate:semantics`
- [x] 6.3 Run focused Playwright tests for the new demo page and README-linked example
- [x] 6.4 Run `npm run docs:build:parallel`
- [x] 6.5 Run `npm run ci`
- [x] 6.6 Verify local previews with `npm run docs:preview`
