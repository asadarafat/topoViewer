# Path Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `path` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `anchor`

Endpoint anchoring model.

**Type:** enum. **Values:** `floating`, `fixed`

**Default:** Defaults to `floating`.

## `arrowColor`

Shared arrow color fallback.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to the edge line color.

## `controlPointDistance`

Base Bezier control-point distance. Parallel lanes add their centered step offset.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `controlPointStepSize`

Distance between same-endpoint Bezier control points.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `controlPointWeight`

Manual Bezier control-point weight.

**Type:** number. **Values:** Finite number.

**Default:** Defaults to `0.5`.

## `curveStyle`

Edge route shape.

**Type:** enum. **Values:** `straight`, `bezier`, `unbundledBezier`, `simpleBezier`, `segments`, `roundSegments`, `taxi`, `roundTaxi`, `smoothTaxi`, `smoothstep`, `haystack`

**Default:** Defaults to `bezier`.

## `display`

Set none to hide the edge.

**Type:** enum. **Values:** `element`, `none`

**Default:** Defaults to `element`.

## `edgeDistances`

Cytoscape-compatible edge distance hint.

**Type:** enum. **Values:** `intersection`, `nodePosition`, `endpoints`

**Default:** No TopoViewer default; authored only.

## `edgeLabelColor`

Center edge label color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to the rendered edge line color.

## `interactive`

Whether edge click handling and focus are enabled.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `label`

Fallback center edge label.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `labelCollisionPolicy`

How center labels, endpoint labels, and direction labels behave when automatic placement cannot avoid overlap.

**Type:** enum. **Values:** `none`, `avoid`, `fade`, `hide`

**Default:** Defaults to `avoid`.

## `labelColor`

Shared legacy label color fallback.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Center labels prefer edgeLabelColor; source/target labels may still use labelColor as a shared fallback.

## `labelFontSize`

Center edge label font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to edge label CSS font size. Fallback: `10`.

## `labelFontStyle`

Center edge label font style.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `labelFontWeight`

Center edge label font weight.

**Type:** text. **Values:** String value.

**Default:** Falls back to edge label CSS font weight. Fallback: `650`.

## `labelXOffset`

Pixel X offset for the center edge label relative to the computed midpoint.

**Type:** integer. **Values:** Finite integer number.

**Default:** Directional links auto-offset the center label away from directional labels. Normal links use the midpoint. Explicit 0 pins the label to the midpoint.

## `labelYOffset`

Pixel Y offset for the center edge label relative to the computed midpoint.

**Type:** integer. **Values:** Finite integer number.

**Default:** Directional links auto-offset the center label away from directional labels. Normal links use the midpoint. Explicit 0 pins the label to the midpoint.

## `labelZIndex`

Draw order for the center edge label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `lineCap`

SVG stroke line cap.

**Type:** enum. **Values:** `butt`, `round`, `square`

**Default:** No TopoViewer default; authored only.

## `lineColor`

Edge stroke color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Defaults to `#6ea8fe`.

## `lineDashOffset`

SVG dash phase offset.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `lineDashPattern`

Explicit SVG line dash pattern.

**Type:** numberList. **Values:** Space-separated string, comma-separated string, number, or number array.

**Default:** No TopoViewer default; authored only.

## `lineOpacity`

Line opacity without changing label opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `lineStyle`

Convenience line dash style.

**Type:** enum. **Values:** `solid`, `dashed`, `dotted`

**Default:** Defaults to `solid`.

## `lineWidth`

Edge stroke width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `1`.

## `opacity`

Edge opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

## `segmentDistances`

Explicit bend distances for segment routing.

**Type:** numberList. **Values:** Space-separated string, comma-separated string, number, or number array.

**Default:** No TopoViewer default; authored only.

## `segmentWeights`

Explicit bend weights for segment routing.

**Type:** numberList. **Values:** Space-separated string, comma-separated string, number, or number array.

**Default:** No TopoViewer default; authored only.

## `sourceArrowBorderColor`

Source arrow marker outline color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `sourceArrowBorderWidth`

Source arrow marker outline width.

**Type:** number. **Values:** Finite number >= 0.

**Default:** Defaults to `0`.

## `sourceArrowColor`

Source arrow marker color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to arrowColor, then lineColor.

## `sourceArrowOffset`

Pixel offset for the source arrowhead. `0` keeps the arrow tip exactly on the rendered stroke endpoint; positive values inset it from that endpoint.

**Type:** number. **Values:** Finite number.

**Default:** Defaults to `0`.

## `sourceArrowShape`

Source arrow marker shape.

**Type:** enum. **Values:** `none`, `triangle`, `vee`, `tee`, `circle`, `square`, `diamond`

**Default:** Defaults to `none`.

## `sourceArrowSize`

Source arrow marker size.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the rendered lineWidth.

## `sourceLabel`

Label rendered near the source endpoint.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `sourceLabelXOffset`

Pixel X offset applied to the source endpoint label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `sourceLabelYOffset`

Pixel Y offset applied to the source endpoint label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `sourceLabelZIndex`

Source endpoint label draw order.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to labelZIndex when omitted.

## `targetArrowBorderColor`

Target arrow marker outline color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `targetArrowBorderWidth`

Target arrow marker outline width.

**Type:** number. **Values:** Finite number >= 0.

**Default:** Defaults to `0`.

## `targetArrowColor`

Target arrow marker color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to arrowColor, then lineColor.

## `targetArrowOffset`

Pixel offset for the target arrowhead. `0` keeps the arrow tip exactly on the rendered stroke endpoint; positive values inset it from that endpoint.

**Type:** number. **Values:** Finite number.

**Default:** Defaults to `0`.

## `targetArrowShape`

Target arrow marker shape.

**Type:** enum. **Values:** `none`, `triangle`, `vee`, `tee`, `circle`, `square`, `diamond`

**Default:** Defaults to `none`.

## `targetArrowSize`

Target arrow marker size.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to the rendered lineWidth.

## `targetLabel`

Label rendered near the target endpoint.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `targetLabelXOffset`

Pixel X offset applied to the target endpoint label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `targetLabelYOffset`

Pixel Y offset applied to the target endpoint label.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `targetLabelZIndex`

Target endpoint label draw order.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to labelZIndex when omitted.

## `taxiDirection`

Primary taxi routing direction.

**Type:** enum. **Values:** `auto`, `vertical`, `downward`, `upward`, `horizontal`, `rightward`, `leftward`

**Default:** Defaults to `auto`.

## `taxiTurn`

Taxi turn placement.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `taxiTurnMinDistance`

Minimum edge length before custom taxi routing applies.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `zIndex`

Draw order for the edge line.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `6`.

## `animated`

Enable React Flow edge animation.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `laneGap`

Child path lane spacing.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `5`.

## `laneWidth`

Child path lane width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to lineWidth, then 3.

## `pipe`

Render a parent path as a pipe corridor.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Automatically enabled when the object has visible child paths.

## `pipeBorderColor`

Outer pipe border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to lineColor.

## `pipeBorderWidth`

Outer pipe border width.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to `2`.

## `pipeFill`

Fill color for the parent pipe.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to lineColor.

## `pipeOpacity`

Parent pipe opacity.

**Type:** number. **Values:** Finite number.

**Default:** Defaults to `0.18`.

## `pipeWidth`

Width of the parent pipe fill.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to lineWidth plus 14, with minimum 18.
