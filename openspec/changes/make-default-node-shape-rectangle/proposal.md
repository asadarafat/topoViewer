## Why

TopoViewer currently has an unclear node default contract: the default shape is
`square`, while the default node dimensions are rectangular. That means a user
can author:

```yaml
width: 96
height: 56
```

without declaring a shape and still be surprised when the renderer preserves a
square aspect ratio. This is not a good beginner experience, and it also makes
renderer internals harder to reason about because the visual body, icon box,
edge anchor, and layout size can drift.

The default should be the least surprising shape for independent width and
height: `rectangle`. Square, circle, and ellipse should remain explicit
presentation choices.

## What Changes

### 1. Make `rectangle` the default node body shape

Change the canonical style defaults registry so omitted node `shape` resolves
to `rectangle`.

The default node contract becomes:

```yaml
shape: rectangle
width: 82
height: 60
```

### 2. Make aspect behavior explicit

Document and enforce this shape contract:

- `rectangle`: uses authored/default width and height independently.
- `ellipse`: uses authored/default width and height independently.
- `square`: uses an equal-width/equal-height body and must not accept two
  unequal authored dimensions.
- `circle`: uses an equal-width/equal-height body and must not accept two
  unequal authored dimensions.

### 3. Centralize resolved node body sizing

Add or consolidate a single runtime helper that resolves the node body box used
by:

- React Flow node dimensions;
- SVG shape dimensions;
- icon/image box defaults;
- edge anchor geometry;
- underlay and outline geometry;
- label positioning assumptions.

This prevents edge attachment and visual body drift.

### 4. Add validation and docs guidance

Add semantic validation for explicit aspect-locked shapes:

- reject `shape: square` when both `width` and `height` are authored and
  unequal;
- reject `shape: circle` when both `width` and `height` are authored and
  unequal;
- allow one authored dimension for `square`/`circle` and derive the missing
  dimension from it;
- recommend `rectangle` or `ellipse` when the author wants a stretched body.

Update stylesheet reference docs, YAML assist metadata, harness examples, and
generated MkDocs/Zensical projections so every surface agrees.

## Capabilities

### Modified Capabilities

- `node-style-defaults`: default node shape is `rectangle`, and aspect-locked
  shapes have explicit authoring guidance.
- `topoviewer-renderer`: node body geometry is resolved once and reused by
  visual body, icon, label, and edge-anchor calculations.
- `stylesheet-reference-docs`: shape defaults and accepted shape behavior are
  described in practical terms.
- `vscode-topoviewer-yaml-authoring`: suggestions and hints tell users when to
  choose rectangle, square, circle, or ellipse.

## Impact

- `packages/topoviewer/src/core/styleDefaults.ts` - change
  `DEFAULT_NODE_SHAPE` from `square` to `rectangle`.
- `packages/topoviewer/src/core/style.ts` - resolve node body dimensions from
  one helper and reuse them for flow style, node style, icon defaults, and edge
  anchor.
- `packages/topoviewer/src/core/lint.ts` - add aspect-lock shape validation
  errors.
- `packages/topoviewer/src/core/nodeShapes.ts` - ensure `rectangle`, `square`,
  `circle`, and `ellipse` remain canonical shape values.
- `packages/topoviewer/content/**` - update canonical docs and examples.
- `docs/**` and `docs-zensical/**` - regenerate from canonical content.
- `packages/vscode-topoviewer/**` - update YAML assist/default hints only
  through package-owned metadata.
- Tests - add default behavior, lint, docs, and renderer parity coverage.

## Non-Goals

- Do not remove `square`, `circle`, or `ellipse`.
- Do not add kebab-case aliases.
- Do not add automatic collision avoidance.
- Do not make arbitrary CSS sizing a public contract.
- Do not silently correct user-authored unequal `width`/`height` for
  `shape: square` or `shape: circle`.
