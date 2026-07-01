# Docs Reference Split Evidence

Date: 2026-06-30

## Implemented

- Split oversized `authoring.md` into:
  - task guide: `packages/topoviewer/content/pages/authoring.md`;
  - model details: `packages/topoviewer/content/pages/topology-model.md`;
  - generated exact contract: `packages/topoviewer/content/pages/object-reference.md`.
- Split stylesheet material into:
  - practical guide: `packages/topoviewer/content/pages/stylesheet.md`;
  - generated exact contract: `packages/topoviewer/content/pages/stylesheet-reference.md`.
- Updated `scripts/sync-object-reference.mjs` so the Stylesheet Reference is generated from `packages/topoviewer/src/core/styleDefaults.ts`.
- Updated `scripts/lint-docs.mjs` so style-key drift is checked against the generated Stylesheet Reference page.
- Split attention material into:
  - use-case/YAML guide: `packages/topoviewer/content/pages/attention.md`;
  - exact contract: `packages/topoviewer/content/pages/attention-reference.md`;
  - host integration API: `packages/topoviewer/content/pages/attention-typescript-api.md`.
- Added `packages/topoviewer/content/pages/object-family-examples.md` to map every public object family to a focused rendered example and exact reference contract.
- Added MkDocs nav entries for the new guide/reference pages.

## Validation

```bash
npm run sync:content
npm run sync:docs-site
npm run sync:zensical-docs
npm run docs:lint
```

Result: passed.
