# Link Direction Style Keys

[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)

Use the `linkDirection` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.

## `directionalStrokes`

Render declared link directions as opposing strokes on one physical link corridor.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `false`.

## `directionCenterGap`

Gap between opposing directional arrowheads near the center of the link.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Defaults to `48`.

## `directionLabelOffset`

Pixel offset applied to directional labels.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `directionLabelPlacement`

Directional label placement on the link corridor.

**Type:** enum. **Values:** `center`, `source`, `target`, `outside`

**Default:** Defaults to `center`.

## `directionLabelRotation`

Directional label rotation behavior. `auto` aligns labels to the rendered directional segment while keeping text upright.

**Type:** enum. **Values:** `none`, `auto`

**Default:** Defaults to `none`.

## `directionOverlayLayer`

Toggle ID that controls directional strokes and labels without hiding the base link object.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `directionStartGap`

Inset between node boundary and each visible directional stroke.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Defaults to `14`.

## `endpointLabelAutoPosition`

Shared default for source and target endpoint label auto placement.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `endpointLabelDistance`

Shared preferred endpoint label distance.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Defaults to lineWidth plus 14, with minimum 18.

## `endpointLabelMaxDistance`

Shared maximum endpoint label distance during auto placement.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Defaults to endpointLabelDistance plus room for collision resolution.

## `endpointLabelOverlayLayer`

Toggle ID that controls both source and target endpoint labels without hiding the edge object.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `endpointLabelSideOffset`

Shared perpendicular offset used during endpoint label auto placement. This is applied before the final sourceLabelXOffset/YOffset and targetLabelXOffset/YOffset nudges.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `interactionWidth`

Pointer hit area.

**Type:** integer. **Values:** Finite integer number.

**Default:** Defaults to max(12, lineWidth + 10).

## `labelBorderColor`

Shared edge label border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to --topoviewer-edge-label-border.

## `labelBorderWidth`

Shared edge label border width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to edge label CSS border width. Fallback: `1`.

## `labelInteractive`

Whether edge labels receive pointer events.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Defaults to `true`.

## `lineFill`

Line fill model.

**Type:** enum. **Values:** `solid`, `linearGradient`

**Default:** Defaults to `solid`.

## `lineGradientStopColors`

Gradient stop colors when lineFill is linearGradient.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `lineGradientStopPositions`

Gradient stop positions when lineFill is linearGradient.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `lineOutlineColor`

Outline color behind the edge line.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `lineOutlineWidth`

Outline width behind the edge line.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `sourceDistanceFromNode`

Move rendered source endpoint inward from node boundary.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `sourceLabelAutoPosition`

Whether the source endpoint label is automatically positioned near its endpoint.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Falls back to endpointLabelAutoPosition, then true.

## `sourceLabelBackgroundColor`

Source endpoint label background.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `sourceLabelBorderColor`

Source endpoint label border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `sourceLabelBorderWidth`

Source endpoint label border width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `sourceLabelColor`

Source endpoint label color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `sourceLabelDistance`

Preferred distance between the source endpoint and its label.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to endpointLabelDistance.

## `sourceLabelFontSize`

Source endpoint label font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `sourceLabelFontStyle`

Source endpoint label font style.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `sourceLabelFontWeight`

Source endpoint label font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `sourceLabelMaxDistance`

Maximum distance the source endpoint label may move from its endpoint during auto placement.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to endpointLabelMaxDistance.

## `sourceLabelOpacity`

Source endpoint label opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** Defaults to `1`.

## `sourceLabelOverlayLayer`

Toggle ID that controls the source endpoint label.

**Type:** text. **Values:** String value.

**Default:** Falls back to endpointLabelOverlayLayer.

## `sourceLabelSideOffset`

Side offset applied perpendicular to the link direction during source label auto placement.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to endpointLabelSideOffset.

## `targetDistanceFromNode`

Move rendered target endpoint inward from node boundary.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `targetLabelAutoPosition`

Whether the target endpoint label is automatically positioned near its endpoint.

**Type:** boolean. **Values:** `true`, `false`

**Default:** Falls back to endpointLabelAutoPosition, then true.

## `targetLabelBackgroundColor`

Target endpoint label background.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `targetLabelBorderColor`

Target endpoint label border color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `targetLabelBorderWidth`

Target endpoint label border width.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** No TopoViewer default; authored only.

## `targetLabelColor`

Target endpoint label color.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** No TopoViewer default; authored only.

## `targetLabelDistance`

Preferred distance between the target endpoint and its label.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to endpointLabelDistance.

## `targetLabelFontSize`

Target endpoint label font size.

**Type:** integer. **Values:** Finite integer number.

**Default:** No TopoViewer default; authored only.

## `targetLabelFontStyle`

Target endpoint label font style.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `targetLabelFontWeight`

Target endpoint label font weight.

**Type:** text. **Values:** String value.

**Default:** No TopoViewer default; authored only.

## `targetLabelMaxDistance`

Maximum distance the target endpoint label may move from its endpoint during auto placement.

**Type:** integer. **Values:** Finite integer >= 0.

**Default:** Falls back to endpointLabelMaxDistance.

## `targetLabelOpacity`

Target endpoint label opacity.

**Type:** number. **Values:** Finite number from 0 to 1, inclusive.

**Default:** Defaults to `1`.

## `targetLabelOverlayLayer`

Toggle ID that controls the target endpoint label.

**Type:** text. **Values:** String value.

**Default:** Falls back to endpointLabelOverlayLayer.

## `targetLabelSideOffset`

Side offset applied perpendicular to the link direction during target label auto placement.

**Type:** integer. **Values:** Finite integer number.

**Default:** Falls back to endpointLabelSideOffset.

## `textBackgroundColor`

Shared edge label background.

**Type:** color. **Values:** Any CSS color or supported theme variable.

**Default:** Falls back to --topoviewer-edge-label-bg.

## `textBackgroundOpacity`

Shared edge label background opacity.

**Type:** number. **Values:** Finite number.

**Default:** No TopoViewer default; authored only.

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
