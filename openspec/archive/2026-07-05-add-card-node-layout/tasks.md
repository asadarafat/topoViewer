## Sequencing Rule

Tasks are intentionally sequential. Do not start a later phase until the prior
phase has its required evidence file checked in and reviewed. Each phase must
produce measurable evidence before implementation advances.

## 0. Baseline And Contract Evidence

- [x] 0.1 Audit current `NetworkNode` DOM structure and node style compiler
- [x] 0.2 Confirm current TopoViewer can approximate colors/badges but cannot express true internal card layout
- [x] 0.3 Decide that `card` is a `nodeLayout`, not a `shape`
- [x] 0.4 Decide that `nodeLayout.type: card` requires explicit `shape: roundRectangle`
- [x] 0.5 Write baseline evidence before implementation begins: `evidence/phase-0-current-renderer-audit.md`

## 1. Contract Tests First

- [x] 1.1 Add schema tests that accept the supported nested `nodeLayout` card object
- [x] 1.2 Add schema or semantic-lint tests that reject `nodeLayout.type: card` without `shape: roundRectangle`
- [x] 1.3 Add semantic-lint tests for unsupported nested enum values
- [x] 1.4 Add compiler tests proving absent `nodeLayout` preserves existing compiled node data
- [x] 1.5 Add compiler tests proving card layout compiles title/subtitle/icon-cell/badge-placement data
- [x] 1.6 Write evidence: `evidence/phase-1-contract-tests.md`
- [x] 1.7 Gate: do not implement renderer changes until Phase 1 evidence exists

## 2. Schema, Parser, And Compiler

- [x] 2.1 Add `nodeLayout` to stylesheet and combined JSON schemas
- [x] 2.2 Add TypeScript types for the nested card node layout object
- [x] 2.3 Add parser/normalizer helpers for supported card values
- [x] 2.4 Add field resolver for `id`, `name`, `label`, `labels.*`, and `data.*`
- [x] 2.5 Compile card layout data into `CompiledNodeData`
- [x] 2.6 Preserve existing flat node style compilation when `nodeLayout` is absent
- [x] 2.7 Emit diagnostics for unsupported card shape/value combinations
- [x] 2.8 Run Phase 1 tests and focused schema validation
- [x] 2.9 Write evidence: `evidence/phase-2-schema-compiler.md`
- [x] 2.10 Gate: do not implement renderer changes until Phase 2 evidence exists

## 3. Renderer Implementation

- [x] 3.1 Add a card node rendering branch or internal `CardNodeContent` component
- [x] 3.2 Render left icon cell inside the round-rectangle node body
- [x] 3.3 Render title and subtitle inside the card content area
- [x] 3.4 Render icon-scoped badge placement for card nodes
- [x] 3.5 Preserve default badge/status behavior for non-card nodes
- [x] 3.6 Preserve handles, drag, selection, focus, attention classes, and click behavior
- [x] 3.7 Preserve edge anchors based on the outer card body, not the icon cell
- [x] 3.8 Add renderer tests for card layout DOM and geometry
- [x] 3.9 Write evidence: `evidence/phase-3-renderer.md`
- [x] 3.10 Gate: do not update docs/examples until Phase 3 evidence exists

## 4. Authoring Assist And Metadata

- [x] 4.1 Update style metadata so `nodeLayout` is discoverable as an object style key
- [x] 4.2 Update browser harness YAML assist for nested `nodeLayout` keys and enum values
- [x] 4.3 Update VS Code harness YAML assist for nested `nodeLayout` keys and enum values
- [x] 4.4 Add tests for YAML assist suggestions where feasible
- [x] 4.5 Write evidence: `evidence/phase-4-yaml-assist.md`
- [x] 4.6 Gate: do not mark documentation complete until Phase 4 evidence exists

## 5. Documentation And Examples

- [x] 5.1 Add stylesheet/reference docs for `nodeLayout`
- [x] 5.2 Add a card node layout guide explaining shape versus layout
- [x] 5.3 Add a compact Turbo-style service/workflow example using only TopoViewer YAML
- [x] 5.4 Ensure example includes title, subtitle, left icon cell, icon badge, and links
- [x] 5.5 Sync generated MkDocs and Zensical docs
- [x] 5.6 Write evidence: `evidence/phase-5-docs-examples.md`
- [x] 5.7 Gate: do not run final validation until Phase 5 evidence exists

## 6. Visual And Cross-Surface Verification

- [x] 6.1 Capture Playwright screenshot of the card node example in Harness
- [x] 6.2 Capture Playwright screenshot of the card node example in MkDocs
- [x] 6.3 Capture Playwright screenshot of the card node example in Zensical
- [x] 6.4 Verify icon cell, title, subtitle, badge, and links are visually correct
- [x] 6.5 Verify existing node examples did not regress
- [x] 6.6 Write evidence: `evidence/phase-6-visual-verification.md`
- [x] 6.7 Gate: do not mark implementation complete until Phase 6 evidence exists

## 7. Final Validation

- [x] 7.1 Run `npm run check:content`
- [x] 7.2 Run `npm run validate:schemas`
- [x] 7.3 Run focused unit tests for style/schema/compiler/card renderer
- [x] 7.4 Run focused Playwright tests for card layout example
- [x] 7.5 Run `npm run render:parity`
- [x] 7.6 Run `npm run docs:lint`
- [x] 7.7 Run full `npm run ci`
- [x] 7.8 Write final evidence: `evidence/phase-7-final-validation.md`
- [x] 7.9 Archive gate satisfied: implementation, docs, examples, and final validation evidence are complete; archive only when requested
