# Phase 1 Contract Tests

## Scope

Added contract tests in `packages/topoviewer/tests/unit/node-shapes.test.ts` before implementation.

The tests cover:

- default/legacy nodes do not receive card-layout metadata when `nodeLayout` is absent;
- valid `shape: roundRectangle` plus nested `nodeLayout.type: card` is accepted by validation and lint;
- valid card layout compiles title, subtitle, icon dimensions, and icon-scoped badge placement metadata;
- effective node style with `nodeLayout.type: card` and non-`roundRectangle` shape is a semantic lint error;
- unsupported nested enum and numeric values are rejected during document validation.

## Red-Gate Command

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run test:unit -- tests/unit/node-shapes.test.ts
```

## Expected Failures Observed

The focused unit run executed under Node 24 and failed only on the new missing capabilities:

- `data.nodeLayout` was `undefined` for the valid card layout case.
- semantic lint did not yet report `invalid-node-card-layout-shape`.
- `validateTopoDocument` did not yet reject unsupported nested `nodeLayout` values.

This satisfies the contract-test gate: implementation can now proceed against explicit failing tests.
