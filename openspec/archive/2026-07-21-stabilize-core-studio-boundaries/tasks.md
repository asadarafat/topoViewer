## 1. Audit And Baseline

- [x] 1.1 Record core package entry ownership, package-lint/type-resolution failures, tarball size/content, declaration shape, and dirty-worktree boundaries.
- [x] 1.2 Record Studio source-alias coupling, feature-to-app imports, controller/canvas module sizes, boundary-check result, and initial/lazy bundle sizes.
- [x] 1.3 Validate the proposal, design, capability specs, and sequential task contract with the OpenSpec CLI before implementation.

## 2. Core Contract Tests

- [x] 2.1 Add a deterministic package-contract check covering manifest conditions, explicit artifacts, forbidden npm content, README drift, and artifact budgets; prove it fails against the baseline.
- [x] 2.2 Add packed ESM, CommonJS, SSR, TypeScript, CSS/schema, and minimal Vite consumer fixtures; prove the relevant baseline failures.
- [x] 2.3 Add focused tests proving root static-export compatibility functions load the export implementation lazily and preserve output behavior.

## 3. Core Build And Package Implementation

- [x] 3.1 Consolidate duplicated Vite library policy behind one shared configuration owner while preserving renderer, authoring, integration, security, and embed outputs.
- [x] 3.2 Produce explicit ESM and CommonJS runtime/declaration artifacts for supported entries and make `publint` plus Are The Types Wrong pass.
- [x] 3.3 Remove component-level CSS declaration leakage, preserve the explicit `topoviewer/style.css` contract, and verify every supported host still renders styled content.
- [x] 3.4 Add `topoviewer/export`, move export dependencies behind that entry, and retain lazy root compatibility wrappers.
- [x] 3.5 Exclude `content/pages` from npm, synchronize the npm README from the canonical fragment, and ratchet package size/file-count budgets from the improved artifact.
- [x] 3.6 Broaden the consumer Node engine only to combinations proven by fixtures while retaining Node 24 as the repository development runtime.

## 4. Core Consumer And CI Gates

- [x] 4.1 Wire package lint, type-resolution, packed-consumer, SSR, tree-shaking, and artifact-budget checks into local package CI.
- [x] 4.2 Add a required GitHub compatibility matrix for the documented Node and React combinations without duplicating the full repository CI workload.
- [x] 4.3 Document supported, advanced, browser-only, and internal API tiers in canonical TypeScript/package documentation and regenerate projections.
- [x] 4.4 Run focused core unit, build, API, package, install, embed, and cross-surface checks; do not begin Studio migration until this gate passes.

## 5. Studio Package Consumption

- [x] 5.1 Extend boundary tests to reject Studio core-source aliases and feature imports from `src/app`; prove the new rules fail against the baseline.
- [x] 5.2 Remove Studio Vite source aliases, update supported root dev/build commands, and make normal Studio builds resolve public package exports.
- [x] 5.3 Add a required packed-core Studio typecheck/build lane and verify it fails when a consumed export is absent from the tarball.
- [x] 5.4 Move Studio image export to `topoviewer/export` and verify the export workflow remains lazy and functional.

## 6. Studio Feature Boundaries

- [x] 6.1 Define immutable `StudioCanvasModel` and `StudioCanvasActions` contracts with focused type/unit tests.
- [x] 6.2 Replace `CanvasSurface`'s broad prop surface with the model/action contract without changing selection, drag, connect, resize, context-menu, or presentation behavior.
- [x] 6.3 Move canvas domain helpers out of `src/app`, enforce app-to-feature dependency direction, and pass the strengthened boundary check.
- [x] 6.4 Extract project/session, canvas, style, mapper, viewport, and export capability composition from the root controller one measured boundary at a time.
- [x] 6.5 Record before/after render-count evidence for selection, drag stop, style edit, and viewport changes; remove broad invalidation demonstrated by the baseline.

## 7. Studio Product And Performance Gates

- [x] 7.1 Add complete Playwright journeys for link creation/editing, multi-select alignment, region move/resize, visual style editing, and project export/reopen with YAML assertions.
- [x] 7.2 Add stable visual regression coverage for the palette, Edit/Inspector, Mapper, dialogs, toolbars, and representative narrow/desktop viewports.
- [x] 7.3 Split optional first-paint work at feature boundaries, measure the improved Studio/VS Code payloads, and ratchet initial bundle budgets with documented tolerance.
- [x] 7.4 Run startup, drag, Inspector, mapper, memory, accessibility, browser-parity, and dense-graph performance gates; reject payload improvements that regress interaction behavior.

## 8. Documentation And Generated Projections

- [x] 8.1 Update architecture, package-consumer, Studio development, API stability, compatibility, and release documentation from canonical sources.
- [x] 8.2 Synchronize root/package README, object references, MkDocs, Zensical, embed assets, and examples; review generated diffs for unrelated churn.

## 9. Final Validation

- [x] 9.1 Run strict OpenSpec validation and all focused core/Studio gates with no unchecked prerequisite tasks.
- [x] 9.2 Run full `npm run ci`, fix fallout, and record final package/bundle before-and-after measurements.
- [x] 9.3 Review the final diff and remaining compatibility risks; archive only after a clean committed tree and required remote gates, which require explicit user approval.
