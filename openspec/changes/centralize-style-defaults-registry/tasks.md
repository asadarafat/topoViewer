## 1. Audit And Contract

- [x] 1.1 Inventory all style keys currently accepted by compiler, schema, docs, lint, and harness metadata
- [x] 1.2 Classify each key as explicit default, derived default, or no TopoViewer default
- [x] 1.3 Decide the exact registry module name and whether any metadata is public API
- [x] 1.4 Confirm the node `shape` default is represented as `square`

## 2. Registry Implementation

- [x] 2.1 Add canonical style key/default metadata in `packages/topoviewer`
- [x] 2.2 Add typed helpers for default lookup and style definitions by target kind
- [x] 2.3 Ensure every registry entry has data type, accepted values when relevant, use text, target kinds, and default state
- [x] 2.4 Add unit tests that reject incomplete registry entries

## 3. Runtime Alignment

- [x] 3.1 Update node style compilation to consume registry-backed defaults where practical
- [x] 3.2 Update edge/link/path style compilation to consume registry-backed defaults where practical
- [x] 3.3 Update region style compilation to consume registry-backed defaults where practical
- [x] 3.4 Update shape and callout style compilation to consume registry-backed defaults where practical
- [x] 3.5 Add regression tests proving omitted keys render according to registry defaults
- [x] 3.6 Add tests for derived defaults such as icon-derived node colors and arrow-color fallbacks

## 4. Schema, Lint, And Metadata Alignment

- [x] 4.1 Add schema/style-key alignment tests against the registry
- [x] 4.2 Update semantic lint to use registry key knowledge where it reduces duplication
- [x] 4.3 Ensure canonical camelCase validation still rejects aliases and non-canonical casing
- [x] 4.4 Ensure `labelZIndex`, `sourceLabelZIndex`, and `targetLabelZIndex` metadata remains numeric and canonical

## 5. YAML Assist And Harness

- [x] 5.1 Replace duplicated harness style key metadata with registry-backed metadata or generated metadata
- [x] 5.2 Keep harness UI grouping as a view layer over canonical registry keys
- [x] 5.3 Show default hints in YAML assist/hover/help without making suggestions noisy
- [x] 5.4 Add harness/YAML-assist tests for default hints, enum values, color keys, numeric keys, and no-default keys

## 6. Documentation

- [x] 6.1 Update canonical stylesheet reference content so default behavior comes from the registry
- [x] 6.2 Keep the public table structure as `Key | Values | Use`
- [x] 6.3 Include explicit defaults in `Use` text or compact default-behavior sections
- [x] 6.4 Avoid repeating noisy "no default" prose for every optional key
- [x] 6.5 Regenerate package docs, MkDocs docs, and Zensical docs
- [x] 6.6 Add docs build or content checks that fail when registry keys are undocumented

## 7. Validation

- [x] 7.1 Run focused style/default unit tests
- [x] 7.2 Run schema and semantic validation
- [x] 7.3 Run YAML authoring/harness tests that cover style suggestions
- [x] 7.4 Run `npm run sync:docs`
- [x] 7.5 Run `npm run docs:build:fast`
- [ ] 7.6 Run `npm run ci`

Note: `npm run ci` currently stops at generated-file cleanliness gates because
this implementation intentionally changes generated docs/assets that are not
committed yet. The underlying lanes were validated individually where possible:
quality, schemas, semantic validation, MkDocs build, Zensical build, harness
build, TopoViewer Playwright tests, and VS Code harness Playwright tests.
