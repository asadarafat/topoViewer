# Phase 3 Renderer

## Implemented

- Added a `NetworkNode` card rendering branch when compiled `data.nodeLayout.type === "card"`.
- Preserved the existing node icon/body/label path when `nodeLayout` is absent.
- Rendered one outer round-rectangle geometry for the card body.
- Rendered a left icon cell, title, subtitle, icon-scoped badge, and outer status marker.
- Kept React Flow handles on the outer node body so edge anchors use the full card body, not the icon cell.
- Added card CSS classes for shell, inner layout, icon cell, title, and subtitle.
- Added a standalone runtime fixture: `packages/topoviewer/tests/fixtures/card-node-runtime.html`.
- Added a focused Playwright assertion for card DOM and geometry.

## Evidence Commands

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run test:unit -- tests/unit/node-shapes.test.ts
```

Result: `18 passed`, `127 passed`.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run build:types
```

Result: TypeScript build passed.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer exec -- playwright test tests/topoviewer-interactions.spec.js -g "card node layout"
```

Result: `1 passed`.

The Playwright check verified:

- card body rendered at the authored outer size;
- icon cell rendered at the nested `nodeLayout.icon.width` / `height`;
- icon cell is left of title content;
- title and subtitle resolve from `name` and `data.subtitle`;
- badge is attached to the icon cell with `topRight` placement;
- no legacy external node label is rendered for card nodes;
- the edge path is present and not invalid.

## Gate

Renderer behavior is implemented and focused tests pass. Documentation, examples, and authoring-assist updates can proceed.
