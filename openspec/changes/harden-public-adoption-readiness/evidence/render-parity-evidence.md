# Render Parity Evidence

Generated on 2026-06-30 with:

```bash
npm run ci:render-parity
npm run render:parity
npm run render:parity
```

The command builds temporary parity pages and captures screenshots under
`.artifacts/render-parity/`. Those screenshots are local review artifacts and
must not be committed.

Representative fixture coverage:

| Fixture | Harness | MkDocs | Zensical | Purpose |
|---|---:|---:|---:|---|
| `graph-basic` | yes | yes | yes | Basic node, glyph, label, and link geometry. |
| `harness/clos-2spine-4leaf` | yes | yes | yes | CLOS fabric icon sizing, regions, and edge attachment. |
| `nodes/label-placement` | yes | yes | yes | Node label vertical spacing, wrapping, and off-body placement. |
| `nodes/icon-fit-and-badges` | yes | yes | yes | Icon fit, badge/status placement, and node shape geometry. |
| `regions/region-label-placement` | yes | yes | yes | Region label placement and docs CSS isolation. |
| `styling/label-z-index` | yes | yes | yes | Label z-index and stacking behavior. |
| `attention/object-focus` | yes | yes | yes | Attention-focused object presentation. |
| `harness/layered-network` | yes | yes | yes | Realistic authoring template with custom SVG icons. |
| `edges/directional-link-strokes` | yes | yes | yes | Directional lanes, arrow offset, line width, and label placement. |

The checker compares DOM metrics and screenshots. It fails on geometry, sizing,
spacing, layout, edge attachment, node shape, icon/glyph, label, region-label,
arrow, and docs CSS leakage drift. Theme-derived color differences are tolerated
only by the screenshot pixel tolerance; geometry and DOM metrics must match.

Current gap:

- Mapper overlays are a Grafana runtime behavior, not a MkDocs/Zensical embed
  behavior. They are covered by Grafana mounted-bundle smoke and mapper tests,
  not by this cross-surface renderer parity command.

Hardening note:

- The checker now waits for declared edge/path fixtures to produce visible edge
  paths after the harness page reaches a loaded state. This caught transient
  node-only harness renders for CLOS and attention examples and prevents false
  parity passes when links silently disappear.
