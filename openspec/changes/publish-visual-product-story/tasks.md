## 0. Integration Roadmap Inputs

- [ ] 0.1 Review `define-netbox-integration-roadmap` for topology/data import and inventory-driven diagram generation
- [ ] 0.2 Review `define-opsmill-infrahub-integration-roadmap` for graph-native infrastructure data and intended-state topology views
- [ ] 0.3 Review `define-grafana-integration-roadmap` for panel or embeddable runtime integration in operational dashboards
- [ ] 0.4 Review `define-vscode-integration-roadmap` for authoring preview, schema validation, semantic lint, and example workflow
- [ ] 0.5 Decide public roadmap statuses from the standalone integration changes, not assumptions

## 1. Product Story Design

- [ ] 1.1 Audit current README and public docs first-screen experience
- [ ] 1.2 Define the exact README opening structure and visual asset placement
- [ ] 1.3 Define the "Why TopoViewer?" claims and map each claim to shipped behavior or roadmap status
- [ ] 1.4 Define integration roadmap statuses for React/TypeScript, MkDocs, NetBox, OpsMill/Infrahub, Grafana, and VS Code
- [ ] 1.5 Decide whether the README visual is a generated screenshot, a linked live demo, or both

## 2. Before/After Demo

- [ ] 2.1 Create a compact realistic network example for YAML -> rendered diagram
- [ ] 2.2 Include topology YAML, stylesheet YAML, and expected assertions
- [ ] 2.3 Make the visual polished enough for README use without relying on stock imagery
- [ ] 2.4 Add a repeatable screenshot capture or document the source example for manual refresh
- [ ] 2.5 Add focused Playwright assertions for the rendered before/after example

## 3. Real Network Demo Page

- [ ] 3.1 Add or refine an underlay scenario
- [ ] 3.2 Add or refine a BGP/session scenario
- [ ] 3.3 Add or refine a service-path scenario
- [ ] 3.4 Add or refine a failure-view scenario
- [ ] 3.5 Publish the scenarios as one coherent public demo page
- [ ] 3.6 Ensure each scenario follows the live viewport, topology YAML, stylesheet YAML, and expected assertions pattern

## 4. README And Docs

- [ ] 4.1 Rewrite the README opening so visual product proof comes before monorepo/package architecture
- [ ] 4.2 Add a clear "Why TopoViewer?" docs page or section
- [ ] 4.3 Add NetBox, OpsMill/Infrahub, MkDocs, Grafana, and VS Code integration roadmap documentation from the standalone integration changes
- [ ] 4.4 Add navigation entries so the product story and demo are easy to find
- [ ] 4.5 Keep engineering docs, package boundaries, local preview commands, and quality gates available below the product story

## 5. MkDocs And Zensical Sync

- [ ] 5.1 Update source docs under `packages/topoviewer/docs`
- [ ] 5.2 Run `npm run sync:docs`
- [ ] 5.3 Run Zensical docs sync if the selected pages are shared with Zensical
- [ ] 5.4 Verify generated MkDocs and Zensical pages contain equivalent product-story content or documented differences

## 6. Validation

- [ ] 6.1 Run `npm run validate:schemas`
- [ ] 6.2 Run `npm run validate:semantics`
- [ ] 6.3 Run focused Playwright tests for the new demo page and README-linked example
- [ ] 6.4 Run `npm run docs:build:parallel`
- [ ] 6.5 Run `npm run ci`
- [ ] 6.6 Verify local previews with `npm run docs:preview`
