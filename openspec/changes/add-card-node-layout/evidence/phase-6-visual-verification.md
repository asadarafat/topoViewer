# Phase 6 Visual And Cross-Surface Verification

## Screenshots

Captured Playwright screenshots from the combined local Pages artifact:

- `.artifacts/card-node-layout/harness-page.png`
- `.artifacts/card-node-layout/harness-viewport.png`
- `.artifacts/card-node-layout/mkdocs-page.png`
- `.artifacts/card-node-layout/mkdocs-viewport.png`
- `.artifacts/card-node-layout/zensical-page.png`
- `.artifacts/card-node-layout/zensical-viewport.png`
- `.artifacts/card-node-layout/summary.json`

The visual check uses the same topology and stylesheet bundle across:

- Browser Harness parity route;
- MkDocs generated card-node-layout page;
- Zensical generated nodes page at `#card-node-layout`.

## Evidence Commands

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && npm run docs:build:parallel
```

Result: combined local Pages artifact rebuilt successfully. MkDocs, Zensical,
and the Browser Harness were regenerated from current sources.

```bash
source ~/.nvm/nvm.sh && nvm use 24 >/dev/null && node --input-type=module <playwright screenshot script>
```

Result:

```json
[
  {
    "name": "harness",
    "cards": 3,
    "edges": 8,
    "badges": ["4", "12", "1"],
    "firstCard": { "width": 190, "height": 64 },
    "firstGeometry": { "width": 190, "height": 64 }
  },
  {
    "name": "mkdocs",
    "cards": 3,
    "edges": 8,
    "badges": ["4", "12", "1"],
    "firstCard": { "width": 190, "height": 64 },
    "firstGeometry": { "width": 190, "height": 64 }
  },
  {
    "name": "zensical",
    "cards": 3,
    "edges": 61,
    "badges": ["4", "12", "1"],
    "firstCard": { "width": 183.76123046875, "height": 61.8984375 },
    "firstGeometry": { "width": 183.76123046875, "height": 61.8984375 }
  }
]
```

## Finding And Fix

Initial MkDocs/Zensical screenshots exposed a host-CSS regression: card geometry
SVGs inherited documentation-site SVG sizing and rendered as square 190px
shapes even though the node body was 64px tall.

Fix applied: extend the TopoViewer SVG reset to
`.topoviewer-node-card > .topoviewer-node-geometry`.

## Gate

Visual verification is complete. Final validation can proceed.
