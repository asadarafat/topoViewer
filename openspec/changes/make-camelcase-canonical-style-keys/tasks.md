## 1. Contract And Tests

- [x] 1.1 Add tests for canonical `camelCase` style keys across node, edge, region, shape, and callout styles
- [x] 1.2 Add tests proving `kebab-case` style keys are rejected by validation or semantic lint
- [x] 1.3 Add tests proving the renderer compiles canonical keys without alias normalization
- [x] 1.4 Add tests proving first-party examples contain no kebab-case style keys

## 2. Style Contract

- [x] 2.1 Define canonical style keys for node, edge, region, shape, and callout styles
- [x] 2.2 Remove kebab-case style key handling from compiler paths
- [x] 2.3 Ensure any foreign-style importer translates into canonical keys before rendering
- [x] 2.4 Keep object model fields and selector syntax unchanged

## 3. Schemas And Lint

- [x] 3.1 Update stylesheet and combined-document schemas so canonical keys are the preferred documented keys
- [x] 3.2 Reject kebab-case style keys in schemas or semantic lint
- [x] 3.3 Add semantic lint diagnostics for unsupported or misspelled style keys
- [x] 3.4 Make first-party examples fail validation or lint when they use kebab-case style keys

## 4. Docs And Examples

- [x] 4.1 Update `packages/topoviewer/docs/stylesheet.md` to list canonical `camelCase` keys in primary tables
- [x] 4.2 Remove kebab-case alternatives from primary docs
- [x] 4.3 Update generated docs through `npm run sync:docs`
- [x] 4.4 Update first-party example stylesheet YAML to prefer `camelCase`
- [x] 4.5 Remove alias-focused examples unless they are importer tests outside TopoViewer stylesheet authoring

## 5. Validation

- [x] 5.1 Run `npm run validate:schemas`
- [x] 5.2 Run focused style/compiler tests
- [x] 5.3 Run focused MkDocs embed tests for examples touched by casing updates
- [x] 5.4 Run `npm run docs:build`
- [x] 5.5 Run `npm run ci`
- [ ] 5.6 Verify remote CI and Docs after pushing implementation milestones
