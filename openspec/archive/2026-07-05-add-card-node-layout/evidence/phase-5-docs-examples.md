# Phase 5 Documentation And Examples

## Implemented

- Added a card-node-layout canonical example:
  `packages/topoviewer/content/examples/nodes/card-node-layout/`.
- Added the example to `packages/topoviewer/content/examples/catalog.yaml`.
- Example includes:
  - `shape: roundRectangle`;
  - nested `nodeLayout.type: card`;
  - left icon cell;
  - title from `name`;
  - subtitle from `data.subtitle`;
  - node-shell badge through `badgePosition`;
  - node-shell status marker through `statusPlacement`;
  - inline SVG router icon in the card icon cell;
  - two links connecting three card nodes.
- Expanded `topoviewer-stylesheet.md` with a dedicated card node layout section that explains `shape` versus `nodeLayout`.
- Regenerated projected docs and examples.

## Evidence Commands

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run sync:docs
```

Result: projected docs and generated examples synced, including:

- `docs/topoviewer/examples/nodes/card-node-layout/index.md`
- `docs/topoviewer/examples/nodes/card-node-layout/topology.yaml`
- `docs/topoviewer/examples/nodes/card-node-layout/stylesheet.yaml`
- `docs/topoviewer/examples/nodes/index.md`

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm --workspace topoviewer run check:examples
```

Result: content projections and generated examples are in sync.

## Gate

Documentation and examples are generated from canonical content. Visual verification and final validation can proceed.
