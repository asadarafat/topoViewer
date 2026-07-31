import { edgeArrowShapes, taxiDirections } from './edgeStyle';
import { NODE_SHAPES, type NodeShapeName } from './nodeShapes';
import {
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements
} from './nodeStyle';
import { regionLabelPositions } from './regionStyle';
import { GEOMETRY_SHAPES } from './types';

export type StyleTargetKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'shape' | 'callout' | 'text';
export type StyleValueDataType = 'text' | 'enum' | 'boolean' | 'integer' | 'number' | 'color' | 'numberList' | 'object';

export type StyleDefault =
  | { kind: 'value'; value: string | number | boolean }
  | { description: string; fallback?: string | number | boolean; from: string; kind: 'derived' }
  | { description: string; kind: 'none' };

export interface StyleKeyDefinition {
  dataType: StyleValueDataType;
  default: StyleDefault;
  key: string;
  label: string;
  targets: StyleTargetKind[];
  use: string;
  values?: string[];
}

export const DEFAULT_NODE_SHAPE: NodeShapeName = 'rectangle';

const edgeCurveStyleValues = ['straight', 'bezier', 'unbundledBezier', 'simpleBezier', 'segments', 'roundSegments', 'taxi', 'roundTaxi', 'smoothTaxi', 'smoothstep', 'haystack'];
const edgeAnchorValues = ['floating', 'fixed'];
const edgeLineFillValues = ['solid', 'linearGradient'];
const directionLabelPlacementValues = ['center', 'source', 'target', 'outside'];
const directionLabelRotationValues = ['none', 'auto'];
const lineStyleValues = ['solid', 'dashed', 'dotted'];
const lineCapValues = ['butt', 'round', 'square'];
const displayValues = ['element', 'none'];
const textAlignValues = ['left', 'center', 'right'];
const verticalAlignValues = ['top', 'middle', 'bottom'];
const labelCollisionPolicyValues = ['none', 'avoid', 'fade', 'hide'];
const commonLabelKeys = new Set(['labelColor', 'labelFontSize', 'labelFontWeight', 'labelFontStyle', 'labelZIndex']);

const none = (description = 'No TopoViewer default; the key only applies when authored.'): StyleDefault => ({ kind: 'none', description });
const value = (next: string | number | boolean): StyleDefault => ({ kind: 'value', value: next });
const derived = (from: string, description: string, fallback?: string | number | boolean): StyleDefault => ({ kind: 'derived', from, description, fallback });

function def(
  targets: StyleTargetKind[],
  key: string,
  label: string,
  dataType: StyleValueDataType,
  use: string,
  defaultValue: StyleDefault = none(),
  values?: readonly string[]
): StyleKeyDefinition {
  return {
    dataType,
    default: defaultValue,
    key,
    label,
    targets,
    use,
    values: values ? [...values] : undefined
  };
}

const nodeDefinitions = [
  def(['node'], 'shape', 'Shape', 'enum', 'Node body shape.', value(DEFAULT_NODE_SHAPE), NODE_SHAPES),
  def(['node'], 'nodeLayout', 'Node layout', 'object', 'Nested node content layout. Use type standard for the normal node body or type card with explicit shape: roundRectangle. Supported values are type standard or card, horizontal direction, left icon placement, and left, center, or right content alignment.'),
  def(['node'], 'shapePolygonPoints', 'Polygon points', 'text', 'Custom polygon points when shape is polygon.'),
  def(['node'], 'width', 'Body width', 'integer', 'Visible node body width.', value(82)),
  def(['node'], 'height', 'Body height', 'integer', 'Visible node body height.', value(60)),
  def(['node'], 'backgroundColor', 'Background color', 'color', 'Node body fill.', derived('icon.fill', 'Falls back to the selected icon fill.', '#6ea8fe')),
  def(['node'], 'borderColor', 'Border color', 'color', 'Node body border color.', derived('icon.stroke', 'Falls back to the selected icon stroke.', '#d8e8ff')),
  def(['node'], 'borderWidth', 'Border width', 'integer', 'Node body border width.', value(4)),
  def(['node'], 'borderStyle', 'Border style', 'enum', 'Node body border pattern.', value('solid'), nodeBorderStyles),
  def(['node'], 'borderDashPattern', 'Border dash pattern', 'numberList', 'Explicit SVG dash pattern for the node body border.'),
  def(['node'], 'borderOpacity', 'Border opacity', 'number', 'Node body border opacity.'),
  def(['node'], 'outlineColor', 'Outline color', 'color', 'Visual outline color around the node body.'),
  def(['node'], 'outlineWidth', 'Outline width', 'integer', 'Visual outline width around the node body.'),
  def(['node'], 'outlineOpacity', 'Outline opacity', 'number', 'Visual outline opacity around the node body.'),
  def(['node'], 'underlayColor', 'Underlay color', 'color', 'Visual underlay fill behind the node body.'),
  def(['node'], 'underlayPadding', 'Underlay padding', 'integer', 'Visual underlay padding around the node body.'),
  def(['node'], 'underlayOpacity', 'Underlay opacity', 'number', 'Visual underlay opacity.'),
  def(['node'], 'icon', 'Icon', 'text', 'Icon key selected from icons.', derived('style.icon', 'Falls back to router.generic when no icon is selected.', 'router.generic')),
  def(['node'], 'iconSize', 'Legacy icon size', 'integer', 'Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.'),
  def(['node'], 'iconWidth', 'Legacy icon width', 'integer', 'Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.'),
  def(['node'], 'iconHeight', 'Legacy icon height', 'integer', 'Accepted for compatibility; the current renderer fits icons to the node body. Prefer iconPadding.'),
  def(['node'], 'iconColor', 'Icon color', 'color', 'Text glyph color.'),
  def(['node'], 'iconFit', 'Icon fit', 'enum', 'Object-fit behavior for SVG/image icons.', derived('CSS', 'Falls back to the stylesheet image default.', 'contain'), nodeIconFitValues),
  def(['node'], 'iconPadding', 'Icon padding', 'integer', 'Insets icon content inside the node body.'),
  def(['node'], 'iconBackgroundColor', 'Icon background', 'color', 'Background behind icon content inside the node body.'),
  def(['node'], 'iconOpacity', 'Icon opacity', 'number', 'Icon glyph/image opacity.'),
  def(['node'], 'labelPosition', 'Label position', 'enum', 'Node label placement.', value('bottom'), nodeLabelPositions),
  def(['node'], 'labelColor', 'Label color', 'color', 'Node label color.', derived('CSS theme', 'Falls back to --topoviewer-fg-strong.')),
  def(['node'], 'labelFontSize', 'Label font size', 'integer', 'Node label font size.', derived('CSS', 'Falls back to the node label CSS font size.', 10)),
  def(['node'], 'labelFontWeight', 'Label font weight', 'text', 'Node label font weight.', derived('CSS', 'Falls back to the node label CSS font weight.', 620)),
  def(['node'], 'labelOpacity', 'Label opacity', 'number', 'Node label opacity.'),
  def(['node'], 'labelBackgroundColor', 'Label background', 'color', 'Node label background color.'),
  def(['node'], 'labelBackgroundOpacity', 'Label background opacity', 'number', 'Node label background opacity.'),
  def(['node'], 'labelBorderColor', 'Label border color', 'color', 'Node label border color.'),
  def(['node'], 'labelBorderWidth', 'Label border width', 'integer', 'Node label border width.', derived('CSS', 'Falls back to the node label CSS border width.', 0)),
  def(['node'], 'labelPadding', 'Label padding', 'integer', 'Node label padding.'),
  def(['node'], 'labelTextMaxWidth', 'Label max width', 'integer', 'Node label maximum width.'),
  def(['node'], 'labelTextWrap', 'Label wrap', 'enum', 'Node label wrapping behavior.', none(), nodeLabelTextWrapValues),
  def(['node'], 'labelTextOverflow', 'Label overflow', 'enum', 'Node label overflow behavior.', none(), nodeLabelTextOverflowValues),
  def(['node'], 'labelTextAlign', 'Label alignment', 'enum', 'Node label text alignment.', derived('CSS', 'Falls back to centered node label text.', 'center'), textAlignValues),
  def(['node'], 'labelXOffset', 'Label X offset', 'integer', 'Pixel X offset after node label placement.', value(0)),
  def(['node'], 'labelYOffset', 'Label Y offset', 'integer', 'Pixel Y offset after node label placement.', value(0)),
  def(['node'], 'labelCollisionPolicy', 'Label collision policy', 'enum', 'How node labels and metadata behave when automatic placement cannot avoid overlap.', value('avoid'), labelCollisionPolicyValues),
  def(['link', 'path'], 'labelXOffset', 'Label X offset', 'integer', 'Pixel X offset for the center edge label relative to the computed midpoint.', none('Directional links auto-offset the center label away from directional labels. Normal links use the midpoint. Explicit 0 pins the label to the midpoint.')),
  def(['link', 'path'], 'labelYOffset', 'Label Y offset', 'integer', 'Pixel Y offset for the center edge label relative to the computed midpoint.', none('Directional links auto-offset the center label away from directional labels. Normal links use the midpoint. Explicit 0 pins the label to the midpoint.')),
  def(['node'], 'labelZIndex', 'Label z index', 'integer', 'Independent draw order for the node label.'),
  def(['node'], 'minZoomedLabelFontSize', 'Min zoom label size', 'integer', 'Hide label below this effective zoomed font size.'),
  def(['node'], 'metaColor', 'Meta color', 'color', 'Node metadata color.'),
  def(['node'], 'metaFontSize', 'Meta font size', 'integer', 'Node metadata font size.'),
  def(['node'], 'metaFontWeight', 'Meta font weight', 'text', 'Node metadata font weight.'),
  def(['node'], 'metaZIndex', 'Meta z index', 'integer', 'Independent draw order for node metadata when rendered as a collision-managed overlay.'),
  def(['node'], 'badgeLabel', 'Badge label', 'text', 'Compact node badge label.', derived('aggregate childCount', 'Aggregate nodes can derive badge text from hidden member count.')),
  def(['node'], 'badgePosition', 'Badge position', 'enum', 'Compact node badge placement.', value('topRight'), nodeBadgePositions),
  def(['node'], 'badgeColor', 'Badge color', 'color', 'Compact node badge text color.'),
  def(['node'], 'badgeBackgroundColor', 'Badge background', 'color', 'Compact node badge background color.'),
  def(['node'], 'badgeBorderColor', 'Badge border color', 'color', 'Compact node badge border color.'),
  def(['node'], 'badgeBorderWidth', 'Badge border width', 'integer', 'Compact node badge border width.', derived('CSS', 'Falls back to the compact badge CSS border width.', 1)),
  def(['node'], 'badgeFontSize', 'Badge font size', 'integer', 'Compact node badge font size.', derived('CSS', 'Falls back to the compact badge CSS font size.', 9)),
  def(['node'], 'badgeFontWeight', 'Badge font weight', 'text', 'Compact node badge font weight.', derived('CSS', 'Falls back to the compact badge CSS font weight.', 850)),
  def(['node'], 'badgeMinWidth', 'Badge min width', 'integer', 'Compact node badge minimum width.', derived('CSS', 'Falls back to the compact badge CSS minimum width.', 16)),
  def(['node'], 'badgeMinHeight', 'Badge min height', 'integer', 'Compact node badge minimum height.', derived('CSS', 'Falls back to the compact badge CSS minimum height.', 16)),
  def(['node'], 'badgePadding', 'Badge padding', 'integer', 'Compact node badge padding.', derived('CSS', 'Falls back to the compact badge CSS padding.', 2)),
  def(['node'], 'badgeOffset', 'Badge offset', 'integer', 'Corner offset used for positioned node badges.', derived('CSS', 'Falls back to the compact badge CSS corner offset.', 7)),
  def(['node'], 'statusColor', 'Status color', 'color', 'Compact status marker color.', derived('normalized status', 'Falls back to the semantic severity resolved from status, severity, or legacy health fields.')),
  def(['node'], 'statusPlacement', 'Status placement', 'enum', 'Compact status marker placement.', value('bottomRight'), nodeStatusPlacements),
  def(['node'], 'statusSize', 'Status size', 'integer', 'Compact status marker size.'),
  def(['node'], 'display', 'Display', 'enum', 'Set none to hide the node.', value('element'), displayValues),
  def(['node'], 'draggable', 'Draggable', 'boolean', 'Whether the node can be dragged.', value(true)),
  def(['node'], 'selectable', 'Selectable', 'boolean', 'Whether the node can be selected.', value(true)),
  def(['node'], 'opacity', 'Opacity', 'number', 'Node opacity.'),
  def(['node'], 'zIndex', 'Z index', 'integer', 'Draw order for the node body.', value(10))
] satisfies StyleKeyDefinition[];

const edgeDefinitions = [
  def(['link'], 'directionalStrokes', 'Directional strokes', 'boolean', 'Render declared link directions as opposing strokes on one physical link corridor.', value(false)),
  def(['link'], 'directionCenterGap', 'Direction center gap', 'integer', 'Gap between opposing directional arrowheads near the center of the link.', value(48)),
  def(['link'], 'directionStartGap', 'Direction start gap', 'integer', 'Inset between node boundary and each visible directional stroke.', value(14)),
  def(['link'], 'directionLabelPlacement', 'Direction label placement', 'enum', 'Directional label placement on the link corridor.', value('center'), directionLabelPlacementValues),
  def(['link'], 'directionLabelOffset', 'Direction label offset', 'integer', 'Pixel offset applied to directional labels.'),
  def(['link'], 'directionLabelRotation', 'Direction label rotation', 'enum', 'Directional label rotation behavior. `auto` aligns labels to the rendered directional segment while keeping text upright.', value('none'), directionLabelRotationValues),
  def(['link'], 'directionOverlayLayer', 'Direction overlay layer', 'text', 'Toggle ID that controls directional strokes and labels without hiding the base link object.'),
  def(['link', 'path'], 'label', 'Label', 'text', 'Fallback center edge label.'),
  def(['link', 'path'], 'lineColor', 'Line color', 'color', 'Edge stroke color.', value('#6ea8fe')),
  def(['link', 'path'], 'lineWidth', 'Line width', 'integer', 'Edge stroke width.', value(1)),
  def(['link', 'path'], 'lineStyle', 'Line style', 'enum', 'Convenience line dash style.', value('solid'), lineStyleValues),
  def(['link', 'path'], 'lineDashPattern', 'Dash pattern', 'numberList', 'Explicit SVG line dash pattern.'),
  def(['link', 'path'], 'lineDashOffset', 'Dash offset', 'number', 'SVG dash phase offset.'),
  def(['link', 'path'], 'lineCap', 'Line cap', 'enum', 'SVG stroke line cap.', none(), lineCapValues),
  def(['link'], 'lineOutlineWidth', 'Line outline width', 'integer', 'Outline width behind the edge line.'),
  def(['link'], 'lineOutlineColor', 'Line outline color', 'color', 'Outline color behind the edge line.'),
  def(['link', 'path'], 'lineOpacity', 'Line opacity', 'number', 'Line opacity without changing label opacity.'),
  def(['link'], 'lineFill', 'Line fill', 'enum', 'Line fill model.', value('solid'), edgeLineFillValues),
  def(['link'], 'lineGradientStopColors', 'Gradient colors', 'text', 'Gradient stop colors when lineFill is linearGradient.'),
  def(['link'], 'lineGradientStopPositions', 'Gradient positions', 'text', 'Gradient stop positions when lineFill is linearGradient.'),
  def(['link', 'path'], 'curveStyle', 'Curve style', 'enum', 'Edge route shape.', value('bezier'), edgeCurveStyleValues),
  def(['link', 'path'], 'anchor', 'Anchor', 'enum', 'Endpoint anchoring model.', value('floating'), edgeAnchorValues),
  def(['link', 'path'], 'controlPointStepSize', 'Control point step', 'integer', 'Distance between same-endpoint Bezier control points.'),
  def(['link', 'path'], 'controlPointDistance', 'Control point distance', 'number', 'Base Bezier control-point distance. Parallel lanes add their centered step offset.'),
  def(['link', 'path'], 'controlPointWeight', 'Control point weight', 'number', 'Manual Bezier control-point weight.', value(0.5)),
  def(['link', 'path'], 'edgeDistances', 'Edge distances', 'enum', 'Cytoscape-compatible edge distance hint.', none(), ['intersection', 'nodePosition', 'endpoints']),
  def(['link', 'path'], 'segmentDistances', 'Segment distances', 'numberList', 'Explicit bend distances for segment routing.'),
  def(['link', 'path'], 'segmentWeights', 'Segment weights', 'numberList', 'Explicit bend weights for segment routing.'),
  def(['link', 'path'], 'taxiDirection', 'Taxi direction', 'enum', 'Primary taxi routing direction.', value('auto'), taxiDirections),
  def(['link', 'path'], 'taxiTurn', 'Taxi turn', 'text', 'Taxi turn placement.'),
  def(['link', 'path'], 'taxiTurnMinDistance', 'Taxi turn minimum', 'integer', 'Minimum edge length before custom taxi routing applies.'),
  def(['link'], 'sourceDistanceFromNode', 'Source distance', 'integer', 'Move rendered source endpoint inward from node boundary.'),
  def(['link'], 'targetDistanceFromNode', 'Target distance', 'integer', 'Move rendered target endpoint inward from node boundary.'),
  def(['link', 'path'], 'arrowColor', 'Arrow color', 'color', 'Shared arrow color fallback.', derived('lineColor', 'Falls back to the edge line color.')),
  def(['link', 'path'], 'targetArrowShape', 'Target arrow', 'enum', 'Target arrow marker shape.', value('none'), edgeArrowShapes),
  def(['link', 'path'], 'targetArrowColor', 'Target arrow color', 'color', 'Target arrow marker color.', derived('arrowColor or lineColor', 'Falls back to arrowColor, then lineColor.')),
  def(['link', 'path'], 'targetArrowBorderColor', 'Target arrow border color', 'color', 'Target arrow marker outline color.'),
  def(['link', 'path'], 'targetArrowBorderWidth', 'Target arrow border width', 'number', 'Target arrow marker outline width.', value(0)),
  def(['link', 'path'], 'targetArrowSize', 'Target arrow size', 'integer', 'Target arrow marker size.', derived('lineWidth', 'Falls back to the rendered lineWidth.')),
  def(['link', 'path'], 'targetArrowOffset', 'Target arrow offset', 'number', 'Pixel offset for the target arrowhead. `0` keeps the arrow tip exactly on the rendered stroke endpoint; positive values inset it from that endpoint.', value(0)),
  def(['link', 'path'], 'sourceArrowShape', 'Source arrow', 'enum', 'Source arrow marker shape.', value('none'), edgeArrowShapes),
  def(['link', 'path'], 'sourceArrowColor', 'Source arrow color', 'color', 'Source arrow marker color.', derived('arrowColor or lineColor', 'Falls back to arrowColor, then lineColor.')),
  def(['link', 'path'], 'sourceArrowBorderColor', 'Source arrow border color', 'color', 'Source arrow marker outline color.'),
  def(['link', 'path'], 'sourceArrowBorderWidth', 'Source arrow border width', 'number', 'Source arrow marker outline width.', value(0)),
  def(['link', 'path'], 'sourceArrowSize', 'Source arrow size', 'integer', 'Source arrow marker size.', derived('lineWidth', 'Falls back to the rendered lineWidth.')),
  def(['link', 'path'], 'sourceArrowOffset', 'Source arrow offset', 'number', 'Pixel offset for the source arrowhead. `0` keeps the arrow tip exactly on the rendered stroke endpoint; positive values inset it from that endpoint.', value(0)),
  def(['link', 'path'], 'edgeLabelColor', 'Edge label color', 'color', 'Center edge label color.', derived('lineColor', 'Falls back to the rendered edge line color.')),
  def(['link', 'path'], 'labelColor', 'Label color', 'color', 'Shared legacy label color fallback.', derived('edgeLabelColor or lineColor', 'Center labels prefer edgeLabelColor; source/target labels may still use labelColor as a shared fallback.')),
  def(['link', 'path'], 'labelFontSize', 'Label font size', 'integer', 'Center edge label font size.', derived('CSS', 'Falls back to edge label CSS font size.', 10)),
  def(['link', 'path'], 'labelFontWeight', 'Label font weight', 'text', 'Center edge label font weight.', derived('CSS', 'Falls back to edge label CSS font weight.', 650)),
  def(['link', 'path'], 'labelFontStyle', 'Label font style', 'text', 'Center edge label font style.'),
  def(['link', 'path'], 'labelCollisionPolicy', 'Label collision policy', 'enum', 'How center labels, endpoint labels, and direction labels behave when automatic placement cannot avoid overlap.', value('avoid'), labelCollisionPolicyValues),
  def(['link'], 'labelBorderColor', 'Label border color', 'color', 'Shared edge label border color.', derived('CSS theme', 'Falls back to --topoviewer-edge-label-border.')),
  def(['link'], 'labelBorderWidth', 'Label border width', 'integer', 'Shared edge label border width.', derived('CSS', 'Falls back to edge label CSS border width.', 1)),
  def(['link'], 'textBackgroundColor', 'Label background', 'color', 'Shared edge label background.', derived('CSS theme', 'Falls back to --topoviewer-edge-label-bg.')),
  def(['link'], 'textBackgroundOpacity', 'Label background opacity', 'number', 'Shared edge label background opacity.'),
  def(['link', 'path'], 'labelZIndex', 'Label z index', 'integer', 'Draw order for the center edge label.'),
  def(['link', 'path'], 'sourceLabel', 'Source label', 'text', 'Label rendered near the source endpoint.'),
  def(['link'], 'sourceLabelColor', 'Source label color', 'color', 'Source endpoint label color.'),
  def(['link'], 'sourceLabelBackgroundColor', 'Source label background', 'color', 'Source endpoint label background.'),
  def(['link'], 'sourceLabelBorderColor', 'Source label border color', 'color', 'Source endpoint label border color.'),
  def(['link'], 'sourceLabelBorderWidth', 'Source label border width', 'integer', 'Source endpoint label border width.'),
  def(['link'], 'sourceLabelFontSize', 'Source label font size', 'integer', 'Source endpoint label font size.'),
  def(['link'], 'sourceLabelFontWeight', 'Source label font weight', 'text', 'Source endpoint label font weight.'),
  def(['link'], 'sourceLabelFontStyle', 'Source label font style', 'text', 'Source endpoint label font style.'),
  def(['link'], 'sourceLabelOpacity', 'Source label opacity', 'number', 'Source endpoint label opacity.', value(1)),
  def(['link'], 'sourceLabelAutoPosition', 'Source label auto position', 'boolean', 'Whether the source endpoint label is automatically positioned near its endpoint.', derived('endpointLabelAutoPosition', 'Falls back to endpointLabelAutoPosition, then true.')),
  def(['link'], 'sourceLabelDistance', 'Source label distance', 'integer', 'Preferred distance between the source endpoint and its label.', derived('endpointLabelDistance', 'Falls back to endpointLabelDistance.')),
  def(['link'], 'sourceLabelMaxDistance', 'Source label max distance', 'integer', 'Maximum distance the source endpoint label may move from its endpoint during auto placement.', derived('endpointLabelMaxDistance', 'Falls back to endpointLabelMaxDistance.')),
  def(['link'], 'sourceLabelSideOffset', 'Source label side offset', 'integer', 'Side offset applied perpendicular to the link direction during source label auto placement.', derived('endpointLabelSideOffset', 'Falls back to endpointLabelSideOffset.')),
  def(['link', 'path'], 'sourceLabelZIndex', 'Source label z index', 'integer', 'Source endpoint label draw order.', derived('labelZIndex', 'Falls back to labelZIndex when omitted.')),
  def(['link', 'path'], 'targetLabel', 'Target label', 'text', 'Label rendered near the target endpoint.'),
  def(['link'], 'targetLabelColor', 'Target label color', 'color', 'Target endpoint label color.'),
  def(['link'], 'targetLabelBackgroundColor', 'Target label background', 'color', 'Target endpoint label background.'),
  def(['link'], 'targetLabelBorderColor', 'Target label border color', 'color', 'Target endpoint label border color.'),
  def(['link'], 'targetLabelBorderWidth', 'Target label border width', 'integer', 'Target endpoint label border width.'),
  def(['link'], 'targetLabelFontSize', 'Target label font size', 'integer', 'Target endpoint label font size.'),
  def(['link'], 'targetLabelFontWeight', 'Target label font weight', 'text', 'Target endpoint label font weight.'),
  def(['link'], 'targetLabelFontStyle', 'Target label font style', 'text', 'Target endpoint label font style.'),
  def(['link'], 'targetLabelOpacity', 'Target label opacity', 'number', 'Target endpoint label opacity.', value(1)),
  def(['link'], 'targetLabelAutoPosition', 'Target label auto position', 'boolean', 'Whether the target endpoint label is automatically positioned near its endpoint.', derived('endpointLabelAutoPosition', 'Falls back to endpointLabelAutoPosition, then true.')),
  def(['link'], 'targetLabelDistance', 'Target label distance', 'integer', 'Preferred distance between the target endpoint and its label.', derived('endpointLabelDistance', 'Falls back to endpointLabelDistance.')),
  def(['link'], 'targetLabelMaxDistance', 'Target label max distance', 'integer', 'Maximum distance the target endpoint label may move from its endpoint during auto placement.', derived('endpointLabelMaxDistance', 'Falls back to endpointLabelMaxDistance.')),
  def(['link'], 'targetLabelSideOffset', 'Target label side offset', 'integer', 'Side offset applied perpendicular to the link direction during target label auto placement.', derived('endpointLabelSideOffset', 'Falls back to endpointLabelSideOffset.')),
  def(['link', 'path'], 'targetLabelZIndex', 'Target label z index', 'integer', 'Target endpoint label draw order.', derived('labelZIndex', 'Falls back to labelZIndex when omitted.')),
  def(['link', 'path'], 'sourceLabelXOffset', 'Source label X offset', 'integer', 'Pixel X offset applied to the source endpoint label.'),
  def(['link', 'path'], 'sourceLabelYOffset', 'Source label Y offset', 'integer', 'Pixel Y offset applied to the source endpoint label.'),
  def(['link', 'path'], 'targetLabelXOffset', 'Target label X offset', 'integer', 'Pixel X offset applied to the target endpoint label.'),
  def(['link', 'path'], 'targetLabelYOffset', 'Target label Y offset', 'integer', 'Pixel Y offset applied to the target endpoint label.'),
  def(['link'], 'endpointLabelAutoPosition', 'Endpoint label auto position', 'boolean', 'Shared default for source and target endpoint label auto placement.', value(true)),
  def(['link'], 'endpointLabelDistance', 'Endpoint label distance', 'integer', 'Shared preferred endpoint label distance.', derived('lineWidth', 'Defaults to lineWidth plus 14, with minimum 18.')),
  def(['link'], 'endpointLabelMaxDistance', 'Endpoint label max distance', 'integer', 'Shared maximum endpoint label distance during auto placement.', derived('endpointLabelDistance', 'Defaults to endpointLabelDistance plus room for collision resolution.')),
  def(['link'], 'endpointLabelSideOffset', 'Endpoint label side offset', 'integer', 'Shared perpendicular offset used during endpoint label auto placement. This is applied before the final sourceLabelXOffset/YOffset and targetLabelXOffset/YOffset nudges.'),
  def(['link'], 'endpointLabelOverlayLayer', 'Endpoint label overlay layer', 'text', 'Toggle ID that controls both source and target endpoint labels without hiding the edge object.'),
  def(['link'], 'sourceLabelOverlayLayer', 'Source label overlay layer', 'text', 'Toggle ID that controls the source endpoint label.', derived('endpointLabelOverlayLayer', 'Falls back to endpointLabelOverlayLayer.')),
  def(['link'], 'targetLabelOverlayLayer', 'Target label overlay layer', 'text', 'Toggle ID that controls the target endpoint label.', derived('endpointLabelOverlayLayer', 'Falls back to endpointLabelOverlayLayer.')),
  def(['path'], 'laneWidth', 'Lane width', 'integer', 'Child path lane width.', derived('lineWidth', 'Falls back to lineWidth, then 3.')),
  def(['path'], 'laneGap', 'Lane gap', 'integer', 'Child path lane spacing.', value(5)),
  def(['path'], 'pipe', 'Pipe', 'boolean', 'Render a parent path as a pipe corridor.', derived('child paths', 'Automatically enabled when the object has visible child paths.')),
  def(['path'], 'pipeWidth', 'Pipe width', 'integer', 'Width of the parent pipe fill.', derived('lineWidth', 'Falls back to lineWidth plus 14, with minimum 18.')),
  def(['path'], 'pipeFill', 'Pipe fill', 'color', 'Fill color for the parent pipe.', derived('lineColor', 'Falls back to lineColor.')),
  def(['path'], 'pipeBorderColor', 'Pipe border color', 'color', 'Outer pipe border color.', derived('lineColor', 'Falls back to lineColor.')),
  def(['path'], 'pipeBorderWidth', 'Pipe border width', 'integer', 'Outer pipe border width.', value(2)),
  def(['path'], 'pipeOpacity', 'Pipe opacity', 'number', 'Parent pipe opacity.', value(0.18)),
  def(['path'], 'animated', 'Animated', 'boolean', 'Enable React Flow edge animation.', value(false)),
  def(['link', 'path'], 'interactive', 'Interactive', 'boolean', 'Whether edge click handling and focus are enabled.', value(true)),
  def(['link'], 'interactionWidth', 'Interaction width', 'integer', 'Pointer hit area.', derived('lineWidth', 'Defaults to max(12, lineWidth + 10).')),
  def(['link'], 'labelInteractive', 'Label interactive', 'boolean', 'Whether edge labels receive pointer events.', value(true)),
  def(['link', 'path'], 'display', 'Display', 'enum', 'Set none to hide the edge.', value('element'), displayValues),
  def(['link', 'path'], 'opacity', 'Opacity', 'number', 'Edge opacity.'),
  def(['link', 'path'], 'zIndex', 'Z index', 'integer', 'Draw order for the edge line.', value(6))
] satisfies StyleKeyDefinition[];

const regionDefinitions = [
  def(['region'], 'shape', 'Shape', 'enum', 'Region hull shape.', value('roundRectangle'), ['roundRectangle', 'rectangle', 'ellipse']),
  def(['region'], 'backgroundColor', 'Background color', 'color', 'Region fill.', value('rgba(76, 201, 240, 0.12)')),
  def(['region'], 'borderColor', 'Border color', 'color', 'Region border color.', value('rgba(76, 201, 240, 0.62)')),
  def(['region'], 'borderWidth', 'Border width', 'integer', 'Region border width.', value(1)),
  def(['region'], 'labelPosition', 'Label position', 'enum', 'Region label anchor.', value('topLeft'), regionLabelPositions),
  def(['region'], 'labelMargin', 'Label margin', 'integer', 'Region label margin from the selected region edge.', value(12)),
  def(['region'], 'labelColor', 'Label color', 'color', 'Region label color.', derived('CSS theme', 'Falls back to region label CSS/theme styling.')),
  def(['region'], 'labelBackgroundColor', 'Label background', 'color', 'Region label background.'),
  def(['region'], 'labelFontSize', 'Label font size', 'integer', 'Region label font size.'),
  def(['region'], 'labelFontWeight', 'Label font weight', 'text', 'Region label font weight.'),
  def(['region'], 'labelZIndex', 'Label z index', 'integer', 'Independent draw order for the region label.'),
  def(['region'], 'labelCollisionPolicy', 'Label collision policy', 'enum', 'How the region label behaves when automatic placement cannot avoid overlap.', value('avoid'), labelCollisionPolicyValues),
  def(['region'], 'width', 'Width', 'integer', 'Explicit region width. Author both width and height to replace member-derived auto-fit geometry.'),
  def(['region'], 'height', 'Height', 'integer', 'Explicit region height. Author both width and height to replace member-derived auto-fit geometry.'),
  def(['region'], 'padding', 'Hull padding', 'integer', 'Shared auto-fit space around region members.', value(88)),
  def(['region'], 'paddingX', 'Horizontal hull padding', 'integer', 'Horizontal auto-fit space around region members.', derived('padding', 'Falls back to hull padding.', 88)),
  def(['region'], 'paddingY', 'Vertical hull padding', 'integer', 'Vertical auto-fit space around region members.', derived('padding', 'Falls back to hull padding.', 88)),
  def(['region'], 'headerPadding', 'Header padding', 'integer', 'Extra auto-fit space above members for the region label or nested content.', derived('nested regions', 'Defaults to 88 for an auto-fit region with child regions and 0 otherwise.', 0)),
  def(['region'], 'nodeWidth', 'Member fallback width', 'integer', 'Fallback member width used only when auto-fitting a region cannot read a rendered node width.', value(88)),
  def(['region'], 'nodeHeight', 'Member fallback height', 'integer', 'Fallback member height used only when auto-fitting a region cannot read a rendered node height.', value(74)),
  def(['region'], 'minWidth', 'Minimum auto-fit width', 'integer', 'Minimum width of a member-derived region hull.', value(180)),
  def(['region'], 'minHeight', 'Minimum auto-fit height', 'integer', 'Minimum height of a member-derived region hull.', value(120)),
  def(['region'], 'parentPadding', 'Nested region padding', 'integer', 'Shared auto-fit space around child regions.', value(42)),
  def(['region'], 'parentPaddingX', 'Horizontal nested padding', 'integer', 'Horizontal auto-fit space around child regions.', derived('parentPadding', 'Falls back to nested region padding.', 42)),
  def(['region'], 'parentPaddingY', 'Vertical nested padding', 'integer', 'Vertical auto-fit space around child regions.', derived('parentPadding', 'Falls back to nested region padding.', 42)),
  def(['region'], 'draggable', 'Draggable', 'boolean', 'Whether the region hull can be dragged.', value(false)),
  def(['region'], 'selectable', 'Selectable', 'boolean', 'Whether the region hull can be selected.', value(false)),
  def(['region'], 'opacity', 'Opacity', 'number', 'Region opacity.'),
  def(['region'], 'zIndex', 'Z index', 'integer', 'Draw order for the region hull.', value(-20))
] satisfies StyleKeyDefinition[];

const shapeDefinitions = [
  def(['shape'], 'shape', 'Shape', 'enum', 'Diagram shape geometry.', value('rectangle'), GEOMETRY_SHAPES),
  def(['shape'], 'fill', 'Fill', 'color', 'Shape fill.', value('rgba(38, 54, 72, 0.82)')),
  def(['shape'], 'stroke', 'Stroke', 'color', 'Shape stroke.', value('rgba(148, 163, 184, 0.64)')),
  def(['shape'], 'strokeWidth', 'Stroke width', 'integer', 'Shape stroke width.', value(2)),
  def(['shape'], 'backgroundColor', 'Background color', 'color', 'Alias-style fill input for shape fill.', derived('fill', 'Falls back to fill when authored.')),
  def(['shape'], 'borderColor', 'Border color', 'color', 'Alias-style stroke input for shape stroke.', derived('stroke', 'Falls back to stroke when authored.')),
  def(['shape'], 'borderWidth', 'Border width', 'integer', 'Alias-style stroke width input for shape stroke width.', derived('strokeWidth', 'Falls back to strokeWidth when authored.')),
  def(['shape'], 'rotation', 'Rotation', 'integer', 'Geometry rotation in degrees.', value(0)),
  def(['shape'], 'boxShadow', 'Box shadow', 'text', 'Presentation depth for the shape container.'),
  def(['shape'], 'width', 'Width', 'integer', 'Diagram shape width.', value(180)),
  def(['shape'], 'height', 'Height', 'integer', 'Diagram shape height.', value(72)),
  def(['shape'], 'display', 'Display', 'enum', 'Set none to hide the shape.', value('element'), displayValues),
  def(['shape'], 'draggable', 'Draggable', 'boolean', 'Whether the shape can be dragged unless locked.', value(true)),
  def(['shape'], 'selectable', 'Selectable', 'boolean', 'Whether the shape can be selected unless locked.', value(false)),
  def(['shape'], 'opacity', 'Opacity', 'number', 'Shape opacity.'),
  def(['shape'], 'zIndex', 'Z index', 'integer', 'Draw order for the shape.', value(-10)),
  def(['shape'], 'labelZIndex', 'Label z index', 'integer', 'Independent draw order for a shape label where rendered.')
] satisfies StyleKeyDefinition[];

const calloutDefinitions = [
  def(['callout'], 'backgroundColor', 'Background color', 'color', 'Callout body fill.'),
  def(['callout'], 'borderColor', 'Border color', 'color', 'Callout border color.'),
  def(['callout'], 'borderWidth', 'Border width', 'integer', 'Callout border width.'),
  def(['callout'], 'color', 'Text color', 'color', 'Shared callout text color.'),
  def(['callout'], 'titleColor', 'Title color', 'color', 'Callout title color.', derived('color', 'Falls back to shared text color.')),
  def(['callout'], 'titleBackgroundColor', 'Title background', 'color', 'Callout title background.'),
  def(['callout'], 'titleFontSize', 'Title font size', 'integer', 'Callout title font size.'),
  def(['callout'], 'titleFontWeight', 'Title font weight', 'text', 'Callout title font weight.'),
  def(['callout'], 'bodyColor', 'Body color', 'color', 'Callout body text color.', derived('color', 'Falls back to shared text color.')),
  def(['callout'], 'bodyFontSize', 'Body font size', 'integer', 'Callout body font size.'),
  def(['callout'], 'bodyFontWeight', 'Body font weight', 'text', 'Callout body font weight.'),
  def(['callout'], 'bodyLineHeight', 'Body line height', 'number', 'Callout body line height.'),
  def(['callout'], 'textAlign', 'Text alignment', 'enum', 'Callout markdown text alignment.', value('left'), textAlignValues),
  def(['callout'], 'borderRadius', 'Border radius', 'integer', 'Callout border radius.'),
  def(['callout'], 'boxShadow', 'Box shadow', 'text', 'Presentation depth for the callout box.'),
  def(['callout'], 'width', 'Width', 'integer', 'Callout width.', value(320)),
  def(['callout'], 'height', 'Height', 'integer', 'Callout height.', value(120)),
  def(['callout'], 'display', 'Display', 'enum', 'Set none to hide the callout.', value('element'), displayValues),
  def(['callout'], 'draggable', 'Draggable', 'boolean', 'Whether the callout can be dragged unless locked.', value(true)),
  def(['callout'], 'selectable', 'Selectable', 'boolean', 'Whether the callout can be selected unless locked.', value(false)),
  def(['callout'], 'opacity', 'Opacity', 'number', 'Callout opacity.'),
  def(['callout'], 'zIndex', 'Z index', 'integer', 'Draw order for the callout.', value(30)),
  def(['callout'], 'labelZIndex', 'Label z index', 'integer', 'Independent draw order for a callout label where rendered.')
] satisfies StyleKeyDefinition[];

const textDefinitions = [
  def(['text'], 'color', 'Text color', 'color', 'Standalone text color.', value('#172033')),
  def(['text'], 'backgroundColor', 'Background color', 'color', 'Optional text-box background color.', value('transparent')),
  def(['text'], 'borderColor', 'Border color', 'color', 'Optional text-box border color.', value('transparent')),
  def(['text'], 'borderWidth', 'Border width', 'integer', 'Text-box border width.', value(0)),
  def(['text'], 'borderRadius', 'Border radius', 'integer', 'Text-box corner radius.', value(0)),
  def(['text'], 'fontFamily', 'Font family', 'text', 'Standalone text font family.', derived('CSS theme', 'Falls back to the host sans-serif stack.')),
  def(['text'], 'fontSize', 'Font size', 'integer', 'Standalone text font size.', value(18)),
  def(['text'], 'fontWeight', 'Font weight', 'text', 'Standalone text font weight.', value(500)),
  def(['text'], 'fontStyle', 'Font style', 'enum', 'Standalone text font style.', value('normal'), ['normal', 'italic', 'oblique']),
  def(['text'], 'lineHeight', 'Line height', 'number', 'Standalone text line-height multiplier.', value(1.25)),
  def(['text'], 'textAlign', 'Text alignment', 'enum', 'Horizontal alignment inside the text box.', value('left'), textAlignValues),
  def(['text'], 'verticalAlign', 'Vertical alignment', 'enum', 'Vertical alignment inside the text box.', value('top'), verticalAlignValues),
  def(['text'], 'padding', 'Padding', 'integer', 'Text-box inner padding.', value(4)),
  def(['text'], 'rotation', 'Rotation', 'integer', 'Text-box rotation in degrees.', value(0)),
  def(['text'], 'width', 'Width', 'integer', 'Optional fixed text-box width; unset text auto-fits its content.', derived('content', 'Auto-fits content until a width is set.')),
  def(['text'], 'height', 'Height', 'integer', 'Optional fixed text-box height; unset text auto-fits its content.', derived('content', 'Auto-fits content until a height is set.')),
  def(['text'], 'display', 'Display', 'enum', 'Set none to hide the text object.', value('element'), displayValues),
  def(['text'], 'draggable', 'Draggable', 'boolean', 'Whether the text object can be dragged unless locked.', value(true)),
  def(['text'], 'selectable', 'Selectable', 'boolean', 'Whether the text object can be selected unless locked.', value(true)),
  def(['text'], 'opacity', 'Opacity', 'number', 'Text-object opacity.'),
  def(['text'], 'zIndex', 'Z index', 'integer', 'Draw order for the text object.', value(20))
] satisfies StyleKeyDefinition[];

export const styleDefinitions = [
  ...nodeDefinitions,
  ...edgeDefinitions,
  ...regionDefinitions,
  ...shapeDefinitions,
  ...calloutDefinitions,
  ...textDefinitions
] as const satisfies readonly StyleKeyDefinition[];

export const styleDefinitionsByKind: Record<StyleTargetKind, StyleKeyDefinition[]> = {
  node: styleDefinitions.filter((definition) => definition.targets.includes('node')),
  link: styleDefinitions.filter((definition) => definition.targets.includes('link')),
  linkDirection: styleDefinitions.filter((definition) => definition.targets.includes('link')),
  path: styleDefinitions.filter((definition) => definition.targets.includes('path')),
  region: styleDefinitions.filter((definition) => definition.targets.includes('region')),
  shape: styleDefinitions.filter((definition) => definition.targets.includes('shape')),
  callout: styleDefinitions.filter((definition) => definition.targets.includes('callout')),
  text: styleDefinitions.filter((definition) => definition.targets.includes('text'))
};

const definitionByKindAndKey = new Map<string, StyleKeyDefinition>();
styleDefinitionsByKind.node.concat(
  styleDefinitionsByKind.link,
  styleDefinitionsByKind.linkDirection,
  styleDefinitionsByKind.path,
  styleDefinitionsByKind.region,
  styleDefinitionsByKind.shape,
  styleDefinitionsByKind.callout,
  styleDefinitionsByKind.text
).forEach((definition) => {
  definition.targets.forEach((kind) => {
    definitionByKindAndKey.set(`${kind}:${definition.key}`, definition);
  });
  if (styleDefinitionsByKind.linkDirection.includes(definition)) {
    definitionByKindAndKey.set(`linkDirection:${definition.key}`, definition);
  }
});

export const canonicalStyleKeyByLowercase = new Map<string, string>();
styleDefinitions.forEach((definition) => {
  canonicalStyleKeyByLowercase.set(definition.key.toLowerCase(), definition.key);
});

export function styleDefinitionForKey(kind: StyleTargetKind, key: string): StyleKeyDefinition | undefined {
  return definitionByKindAndKey.get(`${kind}:${key}`);
}

export function styleDefaultDefinition(kind: StyleTargetKind, key: string): StyleDefault | undefined {
  return styleDefinitionForKey(kind, key)?.default;
}

export function styleDefaultValue(kind: StyleTargetKind, key: string): string | number | boolean | undefined {
  const defaultDefinition = styleDefaultDefinition(kind, key);
  return defaultDefinition?.kind === 'value' ? defaultDefinition.value : undefined;
}

export function styleDefaultNumber(kind: StyleTargetKind, key: string, fallback: number): number {
  const next = styleDefaultValue(kind, key);
  return typeof next === 'number' ? next : fallback;
}

export function styleDefaultSummary(definition: StyleKeyDefinition): string {
  if (definition.default.kind === 'value') return `Defaults to ${String(definition.default.value)}.`;
  if (definition.default.kind === 'derived') {
    const fallback = definition.default.fallback === undefined ? '' : ` Fallback: ${String(definition.default.fallback)}.`;
    return `${definition.default.description}${fallback}`;
  }
  return definition.default.description;
}

export function styleValueDefinitionForKey(kind: StyleTargetKind, key: string): { dataType: StyleValueDataType; options?: string[] } {
  const definition = styleDefinitionForKey(kind, key);
  return {
    dataType: definition?.dataType || 'text',
    options: definition?.values
  };
}

export function isColorStyleKey(key: string): boolean {
  const definition = styleDefinitions.find((candidate) => candidate.key === key);
  return definition?.dataType === 'color'
    || key === 'color'
    || key.endsWith('Color')
    || key.endsWith('Colors')
    || key === 'fill'
    || key === 'pipeFill'
    || key === 'stroke';
}

export function isCommonLabelStyleKey(key: string): boolean {
  return commonLabelKeys.has(key);
}
