# Phase 2 Schema, Parser, And Compiler

## Implemented

- Added the nested `nodeLayout` public schema contract to `topoviewer.schema.json`.
- Added Zod validation for supported card values.
- Added canonical style metadata for `nodeLayout`.
- Added TypeScript card layout types and package exports.
- Added node layout normalizers for type, direction, icon placement, content alignment, and icon size.
- Added semantic lint for invalid nested values and effective-style shape gate:
  `nodeLayout.type: card` requires `shape: roundRectangle`.
- Added compiler field resolution for `id`, `name`, `label`, `labels.*`, `data.*`, and direct data fields.
- Added compiled renderer metadata: `nodeLayout`, `cardTitle`, `cardSubtitle`, `cardIconStyle`, `cardIconContentStyle`, `cardIconImageStyle`, and `cardContentStyle`.
- Synced generated object/style reference docs because the style registry guard requires public style-key discoverability.

## Evidence Commands

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run test:unit -- tests/unit/node-shapes.test.ts
```

Result: `18 passed`, `127 passed`.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run validate:schemas
```

Result: schema validation passed across canonical examples, generated examples catalog, and Grafana bundle mapper YAML.

## Gate

The schema/compiler phase is complete enough to start renderer work. Existing nodes without `nodeLayout` keep legacy compiled data, while valid card nodes produce explicit card metadata for the renderer.
