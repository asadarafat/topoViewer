## Why

TopoViewer already covers the common edge basics: `lineColor`, `lineWidth`, dash styles, basic curves, arrows, center labels, endpoint labels, parallel lanes, and carrier pipes. That is enough for many diagrams, but production topology views need clearer directional, operational, and density cues without forcing users to encode everything through color and width.

Cytoscape.js is a useful reference for edge styling, but TopoViewer should not become a one-to-one Cytoscape style clone. TopoViewer is a TypeScript/YAML library built on React Flow with canonical `camelCase` style keys. The right next step is to add the edge controls that improve network readability: better arrows, better endpoint labels, endpoint spacing, deterministic route shaping, gradient lines, and interaction flags.

## What Changes

### 1. Improve directional arrow styling

Current TopoViewer distinguishes mostly between no arrow and a closed arrow. Add a small, production-useful arrow contract:

- `sourceArrowShape`
- `targetArrowShape`
- `sourceArrowColor`
- `targetArrowColor`
- `sourceArrowSize`
- `targetArrowSize`

Initial supported shapes:

- `none`
- `triangle`
- `vee`
- `tee`
- `circle`
- `diamond`

`arrowColor` remains a shared fallback for existing styles. Unsupported Cytoscape arrow shapes are not part of this change.

### 2. Add richer edge label styling

Endpoint labels are now useful enough to need independent styling. Add label controls that let center, source, and target labels remain readable on dense diagrams:

- `labelBorderColor`
- `labelBorderWidth`
- `labelFontStyle`
- `sourceLabelColor`
- `sourceLabelBackgroundColor`
- `sourceLabelBorderColor`
- `sourceLabelBorderWidth`
- `sourceLabelFontSize`
- `sourceLabelFontWeight`
- `sourceLabelFontStyle`
- `targetLabelColor`
- `targetLabelBackgroundColor`
- `targetLabelBorderColor`
- `targetLabelBorderWidth`
- `targetLabelFontSize`
- `targetLabelFontWeight`
- `targetLabelFontStyle`

Existing global label controls such as `labelColor`, `labelFontSize`, `labelFontWeight`, `textBackgroundColor`, and `textBackgroundOpacity` remain defaults for all edge labels.

### 3. Add endpoint spacing

Add endpoint spacing so thick pipes, arrows, labels, and custom node shapes do not visually collide:

- `sourceDistanceFromNode`
- `targetDistanceFromNode`

These values should move the rendered edge endpoint inward from the computed node boundary toward the opposite endpoint. They should apply to the visible path and its attached arrow marker, without changing the underlying graph source or target.

### 4. Add deterministic routing controls

Add practical route controls for operators who need predictable edge geometry:

- `segmentDistances`
- `segmentWeights`
- `taxiDirection`
- `taxiTurn`
- `taxiTurnMinDistance`

The implementation may adapt these semantics to TopoViewer's React Flow runtime, but the documented TopoViewer behavior must be deterministic and testable. This is not a promise of exact Cytoscape path parity.

### 5. Add linear gradient lines

Add directional gradient support for traffic, ownership, or path state:

- `lineFill: solid | linearGradient`
- `lineGradientStopColors`
- `lineGradientStopPositions`

Initial scope is linear gradients only. Radial gradients are not included unless a concrete topology use case appears.

### 6. Add interaction flags

Add simple interaction control:

- `interactive`
- `labelInteractive`

These should let authors make decorative or background edges non-clickable and prevent labels from capturing pointer events when the graph is dense.

## Capabilities

### New Capabilities

- `edge-style-controls`: enhanced practical edge styling for production topology views.

### Modified Capabilities

- `stylesheet-edge-style`: expands supported canonical `camelCase` edge style keys.
- `topoviewer-renderer`: renders additional arrow, label, endpoint, route, gradient, and interaction behavior.
- `topoviewer-examples`: adds compact edge examples with live viewport, topology YAML, stylesheet YAML, and expected assertions.

## Impact

- `packages/topoviewer/src/core/style.ts` - compile new edge style keys into renderer data and React Flow properties.
- `packages/topoviewer/src/components/FloatingEdge.tsx` - render custom arrow markers, endpoint spacing, gradient strokes, route controls, and label-specific styles.
- `packages/topoviewer/src/styles.css` - support label border/font/interaction states and marker-safe edge paint layers.
- `packages/topoviewer/src/core/validation.ts`, `packages/topoviewer/src/core/lint.ts`, and schemas - validate canonical keys and supported values.
- `packages/topoviewer/examples/test-cases/**` - add compact edge style examples.
- `packages/topoviewer/tests/**` - add unit and Playwright coverage.
- `packages/topoviewer/docs/**`, `docs/**`, and Zensical sync output - document supported public edge controls.
- `packages/mkdocs-topoviewer` - no Python contract change expected; browser asset sync is required after the viewer build.

## Non-Goals

- Full Cytoscape.js edge style parity.
- Full Cytoscape arrow shape parity.
- `haystackRadius`, self-loop controls, ghost effects, overlay/underlay APIs, or full transition APIs.
- Supporting kebab-case style keys. Public TopoViewer style keys remain canonical `camelCase`.
