## Why

TopoViewer nodes currently expose only a small visual shape set. That is enough for generic diagrams, but it is weak for production topology views where operators need to distinguish routers, switches, firewalls, services, clients, aggregates, and custom site markers without relying only on color or icon choice.

The Cytoscape node types model is a useful reference because it treats node body shape as a first-class stylesheet property, including named geometric shapes and custom polygon points. TopoViewer should support the same authoring idea while preserving its own selector stylesheet, React Flow runtime, and graph/topology separation.

## What Changes

### 1. Expand node `shape` values

Support a broader declarative node body shape set through stylesheet rules and per-node style overrides:

- `ellipse`
- `triangle`
- `rectangle`
- `roundRectangle`
- `bottomRoundRectangle`
- `cutRectangle`
- `barrel`
- `rhomboid`
- `diamond`
- `pentagon`
- `hexagon`
- `concaveHexagon`
- `heptagon`
- `octagon`
- `star`
- `tag`
- `vee`
- `polygon`

### 2. Add custom polygon points

When `shape: polygon` is used, support `shapePolygonPoints` as the only TopoViewer style key. Values may be either an array of numbers or a space-separated string of x/y pairs in the Cytoscape-compatible `[-1, 1]` coordinate space.

### 3. Keep style policy in the stylesheet

The preferred authoring model remains:

```yaml
stylesheet:
  - selector: node[labels.role = "pe"]
    style:
      shape: hexagon
      backgroundColor: "#e0f2fe"
      borderColor: "#0369a1"
```

Per-object `style` remains an escape hatch for one-off overrides, not the recommended primary model.

### 4. Render node bodies with geometry-aware shapes

Replace the current border-radius-only node icon container behavior with a renderer that can draw the supported node body geometries. Existing labels, icons, edge anchors, dragging, selection, attention states, and exports must continue to work.

### 5. Document and example the capability

Add compact examples that show shape-driven device semantics and custom polygon support. The examples should expose live viewport, topology YAML, and stylesheet YAML like the existing reference examples.

## Capabilities

### New Capabilities

- `declarative-node-shapes`: stylesheet-driven node body geometry and custom polygon points.

### Modified Capabilities

- `stylesheet-node-style`: expands valid node `shape` values and documents `shapePolygonPoints`.
- `topoviewer-renderer`: renders geometric node bodies without breaking labels, icons, selection, attention, export, or edge anchoring.
- `topoviewer-examples`: adds node shape examples with generated docs and tests.

## Impact

- `packages/topoviewer/src/core/style.ts` - compile canonical shape values and polygon points.
- `packages/topoviewer/src/core/types.ts` - add compiled node shape metadata if needed.
- `packages/topoviewer/src/components/NetworkNode.tsx` - render node body geometry beyond CSS border-radius.
- `packages/topoviewer/src/styles.css` - support geometry containers, icon placement, focus state, and selected state.
- `packages/topoviewer/src/core/validation.ts` and `packages/topoviewer/schemas/*` - validate supported values and polygon point shape.
- `packages/topoviewer/examples/test-cases/*` - add canonical examples and expected assertions.
- `packages/topoviewer/tests/*` - add unit and Playwright coverage for shape rendering and exports.
- `packages/topoviewer/docs/*` and `docs/*` - document authoring and generated examples.
- `packages/mkdocs-topoviewer` - no runtime contract change expected; asset sync updates may be needed after build.
