## 1. Audit Baseline

- [x] 1.1 Inspect current MkDocs nav, Zensical nav, README, generated docs index, and canonical content pages
- [x] 1.2 Inventory major content page lengths and headings
- [x] 1.3 Inventory public example README depth and identify thin examples
- [x] 1.4 Inspect package exports that need TypeScript API documentation coverage
- [x] 1.5 Capture current docs build warning/noise risk
- [x] 1.6 Record findings in `audit.md`

## 2. Documentation Contract

- [x] 2.1 Add a public documentation standard page under canonical content
- [x] 2.2 Define required docs artifacts for a new feature: concept/task docs, reference updates, examples, tests, and generated projections
- [x] 2.3 Define page jobs for README, docs home, and Why TopoViewer
- [x] 2.4 Define example README section requirements
- [x] 2.5 Define supported vs experimental vs roadmap wording rules

## 3. Information Architecture

- [x] 3.1 Redesign MkDocs nav around overview, get started, concepts, guides, reference, examples, integrations, production, and contributing
- [x] 3.2 Generate matching Zensical nav from the MkDocs nav subset
- [x] 3.3 Split oversized mixed-intent pages where needed, especially authoring, stylesheet, attention, and production
- [x] 3.4 Remove or rewrite duplicate product pitch between README, docs home, and Why TopoViewer
- [x] 3.5 Add explicit next-step links at the end of major guide pages

## 4. Get Started And Task Guides

- [x] 4.1 Add "First topology" quickstart with topology YAML, stylesheet YAML, live output, and validation
- [x] 4.2 Add "Style a topology" guide covering selectors, labels, data, and reusable rules
- [x] 4.3 Add "Use the browser harness" guide for template selection, Apply/Revert, validation, save, and export
- [x] 4.4 Add "Embed in MkDocs" guide with installation, config, fenced block, local preview, GitHub Pages path notes, and troubleshooting
- [x] 4.5 Add "Embed in React" guide with install, CSS import, validation, error handling, SSR notes, and export
- [x] 4.6 Add "Validate YAML" guide covering schemas, semantic lint, CI commands, and editor setup
- [x] 4.7 Add "Debug rendering" guide covering blank viewport, missing links, bad selectors, unsafe images, CSS/theme issues, generated drift, and GitHub Pages paths

## 5. Complete References

- [x] 5.1 Expand topology YAML reference with full field tables for graph, diagram, toggles, layout, limits, icons, labels, data, and attention
- [x] 5.2 Expand layout reference into manual, force, and generic CLOS sections with accepted options, defaults, diagnostics, and examples
- [x] 5.3 Restructure stylesheet reference by target kind and ensure every style registry key appears with accepted values and default behavior
- [x] 5.4 Add MkDocs fenced block option reference
- [x] 5.5 Add Zensical adapter reference for generated output, path rewriting, assets, and limitations
- [x] 5.6 Add TypeScript API reference and classify all exports by stability
- [x] 5.7 Add glossary / terminology page for topology, graph, diagram, layer, path, region, attention, aggregate, harness, adapter, and schema

## 6. Example Quality

- [x] 6.1 Update example generation to require or render "What this demonstrates", "Expected result", "What to inspect", and "Use when"
- [x] 6.2 Upgrade all public example READMEs under 40 words first
- [x] 6.3 Add expected visual/interaction prose to attention, region, layout, icon, edge, and renderer-parity-sensitive examples
- [x] 6.4 Keep expected YAML internal to CI and absent from MkDocs/Zensical public pages
- [x] 6.5 Add visual acceptance notes for examples that previously caused confusion: icon fit, label placement, link attachment, CLOS layout, region labels, and renderer parity

## 7. Integration Handbooks

- [x] 7.1 Update React docs into a supported integration handbook
- [x] 7.2 Update MkDocs docs into a supported integration handbook
- [x] 7.3 Update Zensical docs into an adapter handbook with supported-current vs future-plugin boundary
- [x] 7.4 Add browser harness authoring handbook
- [x] 7.5 Keep VS Code marked experimental until installation, release artifact, and validation path exist
- [x] 7.6 Keep NetBox, OpsMill/Infrahub, and Grafana as roadmap/feasibility unless implemented

## 8. Docs Quality Gates

- [x] 8.1 Add local link and anchor validation for canonical docs and generated MkDocs pages
- [x] 8.2 Add example README section coverage checks
- [x] 8.3 Add style registry to stylesheet docs coverage check
- [x] 8.4 Add TypeScript export to API docs coverage check
- [x] 8.5 Add MkDocs nav/orphan warning allowlist and fail on unexpected unnaved pages
- [x] 8.6 Add MkDocs/Zensical critical-page parity check
- [x] 8.7 Add docs smoke checks for live viewport presence on key pages
- [x] 8.8 Wire docs lint into `npm run ci:docs`

## 9. Validation

- [x] 9.1 Run `npm run sync:docs`
- [x] 9.2 Run `npm run docs:build:fast`
- [x] 9.3 Run `npm run zensical:build`
- [x] 9.4 Run `npm run ci:docs`
- [x] 9.5 Run `npm run ci:quality`
- [x] 9.6 Run `npm run ci`
- [x] 9.7 Review generated MkDocs and Zensical pages visually for top-level navigation and representative examples
