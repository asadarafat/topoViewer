import type { TopoObjectSelection } from '../shared/topologyMutations';

export type StyleValueDataType = 'text' | 'enum' | 'boolean' | 'integer' | 'number' | 'color';

export interface KeyValueEditorRow {
  id: string;
  key: string;
  value: string;
}

export interface StyleValueDefinition {
  dataType: StyleValueDataType;
  options?: string[];
}


export const styleOptionsByKind: Record<TopoObjectSelection['kind'], Array<{ key: string; label: string }>> = {
  node: [
    { key: 'shape', label: 'Shape' },
    { key: 'shapePolygonPoints', label: 'Polygon points' },
    { key: 'width', label: 'Width' },
    { key: 'height', label: 'Height' },
    { key: 'backgroundColor', label: 'Background color' },
    { key: 'borderColor', label: 'Border color' },
    { key: 'borderWidth', label: 'Border width' },
    { key: 'borderStyle', label: 'Border style' },
    { key: 'borderDashPattern', label: 'Border dash pattern' },
    { key: 'borderOpacity', label: 'Border opacity' },
    { key: 'outlineColor', label: 'Outline color' },
    { key: 'outlineWidth', label: 'Outline width' },
    { key: 'outlineOpacity', label: 'Outline opacity' },
    { key: 'underlayColor', label: 'Underlay color' },
    { key: 'underlayPadding', label: 'Underlay padding' },
    { key: 'underlayOpacity', label: 'Underlay opacity' },
    { key: 'icon', label: 'Icon' },
    { key: 'iconSize', label: 'Icon size' },
    { key: 'iconWidth', label: 'Icon width' },
    { key: 'iconHeight', label: 'Icon height' },
    { key: 'iconColor', label: 'Icon color' },
    { key: 'iconFit', label: 'Icon fit' },
    { key: 'iconPadding', label: 'Icon padding' },
    { key: 'iconBackgroundColor', label: 'Icon background' },
    { key: 'iconOpacity', label: 'Icon opacity' },
    { key: 'labelPosition', label: 'Label position' },
    { key: 'labelColor', label: 'Label color' },
    { key: 'labelFontSize', label: 'Label font size' },
    { key: 'labelFontWeight', label: 'Label font weight' },
    { key: 'labelOpacity', label: 'Label opacity' },
    { key: 'labelBackgroundColor', label: 'Label background' },
    { key: 'labelBackgroundOpacity', label: 'Label background opacity' },
    { key: 'labelBorderColor', label: 'Label border color' },
    { key: 'labelBorderWidth', label: 'Label border width' },
    { key: 'labelPadding', label: 'Label padding' },
    { key: 'labelTextMaxWidth', label: 'Label max width' },
    { key: 'labelTextWrap', label: 'Label wrap' },
    { key: 'labelTextOverflow', label: 'Label overflow' },
    { key: 'labelTextAlign', label: 'Label alignment' },
    { key: 'labelXOffset', label: 'Label X offset' },
    { key: 'labelYOffset', label: 'Label Y offset' },
    { key: 'minZoomedLabelFontSize', label: 'Min zoom label size' },
    { key: 'metaColor', label: 'Meta color' },
    { key: 'metaFontSize', label: 'Meta font size' },
    { key: 'metaFontWeight', label: 'Meta font weight' },
    { key: 'badgeLabel', label: 'Badge label' },
    { key: 'badgePosition', label: 'Badge position' },
    { key: 'badgeColor', label: 'Badge color' },
    { key: 'badgeBackgroundColor', label: 'Badge background' },
    { key: 'badgeBorderColor', label: 'Badge border color' },
    { key: 'statusColor', label: 'Status color' },
    { key: 'statusPlacement', label: 'Status placement' },
    { key: 'statusSize', label: 'Status size' },
    { key: 'display', label: 'Display' },
    { key: 'draggable', label: 'Draggable' },
    { key: 'selectable', label: 'Selectable' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ],
  link: [
    { key: 'label', label: 'Label' },
    { key: 'lineColor', label: 'Line color' },
    { key: 'lineWidth', label: 'Line width' },
    { key: 'lineStyle', label: 'Line style' },
    { key: 'lineDashPattern', label: 'Dash pattern' },
    { key: 'lineDashOffset', label: 'Dash offset' },
    { key: 'lineCap', label: 'Line cap' },
    { key: 'lineOutlineWidth', label: 'Line outline width' },
    { key: 'lineOutlineColor', label: 'Line outline color' },
    { key: 'lineOpacity', label: 'Line opacity' },
    { key: 'lineFill', label: 'Line fill' },
    { key: 'lineGradientStopColors', label: 'Gradient colors' },
    { key: 'lineGradientStopPositions', label: 'Gradient positions' },
    { key: 'curveStyle', label: 'Curve style' },
    { key: 'controlPointStepSize', label: 'Control point step' },
    { key: 'controlPointDistance', label: 'Control point distance' },
    { key: 'controlPointWeight', label: 'Control point weight' },
    { key: 'edgeDistances', label: 'Edge distances' },
    { key: 'segmentDistances', label: 'Segment distances' },
    { key: 'segmentWeights', label: 'Segment weights' },
    { key: 'taxiDirection', label: 'Taxi direction' },
    { key: 'taxiTurn', label: 'Taxi turn' },
    { key: 'taxiTurnMinDistance', label: 'Taxi turn minimum' },
    { key: 'sourceDistanceFromNode', label: 'Source distance' },
    { key: 'targetDistanceFromNode', label: 'Target distance' },
    { key: 'arrowColor', label: 'Arrow color' },
    { key: 'targetArrowShape', label: 'Target arrow' },
    { key: 'targetArrowColor', label: 'Target arrow color' },
    { key: 'targetArrowSize', label: 'Target arrow size' },
    { key: 'sourceArrowShape', label: 'Source arrow' },
    { key: 'sourceArrowColor', label: 'Source arrow color' },
    { key: 'sourceArrowSize', label: 'Source arrow size' },
    { key: 'labelColor', label: 'Label color' },
    { key: 'labelFontSize', label: 'Label font size' },
    { key: 'labelFontWeight', label: 'Label font weight' },
    { key: 'labelFontStyle', label: 'Label font style' },
    { key: 'labelBorderColor', label: 'Label border color' },
    { key: 'labelBorderWidth', label: 'Label border width' },
    { key: 'textBackgroundColor', label: 'Label background' },
    { key: 'textBackgroundOpacity', label: 'Label background opacity' },
    { key: 'sourceLabel', label: 'Source label' },
    { key: 'sourceLabelColor', label: 'Source label color' },
    { key: 'sourceLabelBackgroundColor', label: 'Source label background' },
    { key: 'sourceLabelBorderColor', label: 'Source label border color' },
    { key: 'sourceLabelBorderWidth', label: 'Source label border width' },
    { key: 'sourceLabelFontSize', label: 'Source label font size' },
    { key: 'sourceLabelFontWeight', label: 'Source label font weight' },
    { key: 'sourceLabelFontStyle', label: 'Source label font style' },
    { key: 'targetLabel', label: 'Target label' },
    { key: 'targetLabelColor', label: 'Target label color' },
    { key: 'targetLabelBackgroundColor', label: 'Target label background' },
    { key: 'targetLabelBorderColor', label: 'Target label border color' },
    { key: 'targetLabelBorderWidth', label: 'Target label border width' },
    { key: 'targetLabelFontSize', label: 'Target label font size' },
    { key: 'targetLabelFontWeight', label: 'Target label font weight' },
    { key: 'targetLabelFontStyle', label: 'Target label font style' },
    { key: 'sourceLabelXOffset', label: 'Source label X offset' },
    { key: 'sourceLabelYOffset', label: 'Source label Y offset' },
    { key: 'targetLabelXOffset', label: 'Target label X offset' },
    { key: 'targetLabelYOffset', label: 'Target label Y offset' },
    { key: 'interactive', label: 'Interactive' },
    { key: 'interactionWidth', label: 'Interaction width' },
    { key: 'labelInteractive', label: 'Label interactive' },
    { key: 'display', label: 'Display' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ],
  path: [
    { key: 'label', label: 'Label' },
    { key: 'lineColor', label: 'Line color' },
    { key: 'lineWidth', label: 'Line width' },
    { key: 'lineStyle', label: 'Line style' },
    { key: 'lineDashPattern', label: 'Dash pattern' },
    { key: 'lineDashOffset', label: 'Dash offset' },
    { key: 'lineCap', label: 'Line cap' },
    { key: 'lineOpacity', label: 'Line opacity' },
    { key: 'curveStyle', label: 'Curve style' },
    { key: 'controlPointStepSize', label: 'Control point step' },
    { key: 'controlPointDistance', label: 'Control point distance' },
    { key: 'controlPointWeight', label: 'Control point weight' },
    { key: 'edgeDistances', label: 'Edge distances' },
    { key: 'segmentDistances', label: 'Segment distances' },
    { key: 'segmentWeights', label: 'Segment weights' },
    { key: 'taxiDirection', label: 'Taxi direction' },
    { key: 'taxiTurn', label: 'Taxi turn' },
    { key: 'taxiTurnMinDistance', label: 'Taxi turn minimum' },
    { key: 'arrowColor', label: 'Arrow color' },
    { key: 'targetArrowShape', label: 'Target arrow' },
    { key: 'targetArrowColor', label: 'Target arrow color' },
    { key: 'targetArrowSize', label: 'Target arrow size' },
    { key: 'sourceArrowShape', label: 'Source arrow' },
    { key: 'sourceArrowColor', label: 'Source arrow color' },
    { key: 'sourceArrowSize', label: 'Source arrow size' },
    { key: 'labelColor', label: 'Label color' },
    { key: 'labelFontSize', label: 'Label font size' },
    { key: 'labelFontWeight', label: 'Label font weight' },
    { key: 'labelFontStyle', label: 'Label font style' },
    { key: 'sourceLabel', label: 'Source label' },
    { key: 'targetLabel', label: 'Target label' },
    { key: 'sourceLabelXOffset', label: 'Source label X offset' },
    { key: 'sourceLabelYOffset', label: 'Source label Y offset' },
    { key: 'targetLabelXOffset', label: 'Target label X offset' },
    { key: 'targetLabelYOffset', label: 'Target label Y offset' },
    { key: 'laneWidth', label: 'Lane width' },
    { key: 'laneGap', label: 'Lane gap' },
    { key: 'pipe', label: 'Pipe' },
    { key: 'pipeWidth', label: 'Pipe width' },
    { key: 'pipeFill', label: 'Pipe fill' },
    { key: 'pipeBorderColor', label: 'Pipe border color' },
    { key: 'pipeBorderWidth', label: 'Pipe border width' },
    { key: 'pipeOpacity', label: 'Pipe opacity' },
    { key: 'animated', label: 'Animated' },
    { key: 'interactive', label: 'Interactive' },
    { key: 'display', label: 'Display' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ],
  region: [
    { key: 'shape', label: 'Shape' },
    { key: 'backgroundColor', label: 'Background color' },
    { key: 'borderColor', label: 'Border color' },
    { key: 'borderWidth', label: 'Border width' },
    { key: 'labelPosition', label: 'Label position' },
    { key: 'labelMargin', label: 'Label margin' },
    { key: 'labelColor', label: 'Label color' },
    { key: 'labelBackgroundColor', label: 'Label background' },
    { key: 'labelFontSize', label: 'Label font size' },
    { key: 'labelFontWeight', label: 'Label font weight' },
    { key: 'draggable', label: 'Draggable' },
    { key: 'selectable', label: 'Selectable' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ],
  callout: [
    { key: 'backgroundColor', label: 'Background color' },
    { key: 'borderColor', label: 'Border color' },
    { key: 'borderWidth', label: 'Border width' },
    { key: 'color', label: 'Text color' },
    { key: 'titleColor', label: 'Title color' },
    { key: 'titleBackgroundColor', label: 'Title background' },
    { key: 'titleFontSize', label: 'Title font size' },
    { key: 'titleFontWeight', label: 'Title font weight' },
    { key: 'bodyColor', label: 'Body color' },
    { key: 'bodyFontSize', label: 'Body font size' },
    { key: 'bodyFontWeight', label: 'Body font weight' },
    { key: 'bodyLineHeight', label: 'Body line height' },
    { key: 'textAlign', label: 'Text alignment' },
    { key: 'borderRadius', label: 'Border radius' },
    { key: 'boxShadow', label: 'Box shadow' },
    { key: 'width', label: 'Width' },
    { key: 'height', label: 'Height' },
    { key: 'display', label: 'Display' },
    { key: 'draggable', label: 'Draggable' },
    { key: 'selectable', label: 'Selectable' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ],
  shape: [
    { key: 'shape', label: 'Shape' },
    { key: 'fill', label: 'Fill' },
    { key: 'stroke', label: 'Stroke' },
    { key: 'strokeWidth', label: 'Stroke width' },
    { key: 'backgroundColor', label: 'Background color' },
    { key: 'borderColor', label: 'Border color' },
    { key: 'borderWidth', label: 'Border width' },
    { key: 'rotation', label: 'Rotation' },
    { key: 'boxShadow', label: 'Box shadow' },
    { key: 'width', label: 'Width' },
    { key: 'height', label: 'Height' },
    { key: 'display', label: 'Display' },
    { key: 'draggable', label: 'Draggable' },
    { key: 'selectable', label: 'Selectable' },
    { key: 'opacity', label: 'Opacity' },
    { key: 'zIndex', label: 'Z index' }
  ]
};

const nodeShapeValues = [
  'ellipse',
  'circle',
  'triangle',
  'square',
  'rectangle',
  'roundRectangle',
  'bottomRoundRectangle',
  'cutRectangle',
  'barrel',
  'rhomboid',
  'diamond',
  'pentagon',
  'hexagon',
  'concaveHexagon',
  'heptagon',
  'octagon',
  'star',
  'tag',
  'vee',
  'polygon'
];
const nodeLabelPositionValues = ['top', 'right', 'bottom', 'left', 'center'];
const nodeCornerPositionValues = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
const nodeStatusPlacementValues = [...nodeCornerPositionValues, 'center'];
const regionLabelPositionValues = [
  'topLeft',
  'topCenter',
  'topRight',
  'rightTop',
  'rightCenter',
  'rightBottom',
  'bottomRight',
  'bottomCenter',
  'bottomLeft',
  'leftTop',
  'leftCenter',
  'leftBottom'
];
const edgeCurveStyleValues = ['straight', 'bezier', 'unbundledBezier', 'segments', 'roundSegments', 'taxi', 'roundTaxi', 'smoothTaxi', 'haystack'];
const edgeArrowShapeValues = ['none', 'triangle', 'vee', 'tee', 'circle', 'diamond'];
const edgeTaxiDirectionValues = ['auto', 'vertical', 'downward', 'upward', 'horizontal', 'rightward', 'leftward'];
const diagramShapeValues = [
  'rectangle',
  'circle',
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'octagon',
  'ellipse',
  'semicircle',
  'trapezoid',
  'parallelogram',
  'rhombus',
  'kite',
  'star',
  'cube',
  'cuboid',
  'sphere',
  'cone',
  'cylinder',
  'pyramid',
  'prism'
];
const regionShapeValues = ['rectangle', 'roundRectangle', 'ellipse'];
const booleanStyleKeys = new Set([
  'animated',
  'draggable',
  'interactive',
  'labelInteractive',
  'pipe',
  'selectable'
]);
const integerStyleKeys = new Set([
  'badgeBorderWidth',
  'bodyFontSize',
  'borderRadius',
  'borderWidth',
  'controlPointStepSize',
  'height',
  'iconHeight',
  'iconPadding',
  'iconSize',
  'iconWidth',
  'interactionWidth',
  'labelBorderWidth',
  'labelFontSize',
  'labelMargin',
  'labelPadding',
  'labelTextMaxWidth',
  'labelXOffset',
  'labelYOffset',
  'lineOutlineWidth',
  'lineWidth',
  'minZoomedLabelFontSize',
  'outlineWidth',
  'pipeBorderWidth',
  'pipeWidth',
  'rotation',
  'sourceArrowSize',
  'sourceDistanceFromNode',
  'sourceLabelBorderWidth',
  'sourceLabelFontSize',
  'sourceLabelXOffset',
  'sourceLabelYOffset',
  'statusSize',
  'strokeWidth',
  'targetArrowSize',
  'targetDistanceFromNode',
  'targetLabelBorderWidth',
  'targetLabelFontSize',
  'targetLabelXOffset',
  'targetLabelYOffset',
  'titleFontSize',
  'underlayPadding',
  'width',
  'zIndex'
]);
const numberStyleKeys = new Set([
  'arrowScale',
  'borderOpacity',
  'bodyLineHeight',
  'controlPointDistance',
  'controlPointWeight',
  'iconOpacity',
  'labelBackgroundOpacity',
  'labelOpacity',
  'lineDashOffset',
  'lineOpacity',
  'loopDirection',
  'loopSweep',
  'opacity',
  'outlineOpacity',
  'pipeOpacity',
  'sourceArrowSize',
  'sourceDistanceFromNode',
  'targetArrowSize',
  'targetDistanceFromNode',
  'textBackgroundOpacity',
  'underlayOpacity'
]);
const styleEnumOptionsByKey: Record<string, string[]> = {
  anchor: ['floating', 'center'],
  borderStyle: ['solid', 'dashed', 'dotted'],
  curveStyle: edgeCurveStyleValues,
  display: ['element', 'none'],
  edgeDistances: ['intersection', 'nodePosition', 'endpoints'],
  iconFit: ['contain', 'cover', 'fill'],
  labelTextAlign: ['left', 'center', 'right'],
  labelTextOverflow: ['clip', 'ellipsis'],
  labelTextWrap: ['none', 'wrap'],
  lineCap: ['butt', 'round', 'square'],
  lineFill: ['solid', 'linearGradient'],
  lineStyle: ['solid', 'dashed', 'dotted'],
  badgePosition: nodeCornerPositionValues,
  statusPlacement: nodeStatusPlacementValues,
  sourceArrowShape: edgeArrowShapeValues,
  targetArrowShape: edgeArrowShapeValues,
  taxiDirection: edgeTaxiDirectionValues,
  textAlign: ['left', 'center', 'right'],
  textBackgroundShape: ['rectangle', 'roundRectangle'],
  textBorderStyle: ['solid', 'dashed', 'dotted', 'double'],
  textTransform: ['none', 'uppercase', 'lowercase']
};

export function styleValueDefinitionForKey(kind: TopoObjectSelection['kind'], key: string): StyleValueDefinition {
  if (isColorStyleKey(key)) return { dataType: 'color' };
  if (key === 'shape') {
    if (kind === 'shape') return { dataType: 'enum', options: diagramShapeValues };
    if (kind === 'region') return { dataType: 'enum', options: regionShapeValues };
    return { dataType: 'enum', options: nodeShapeValues };
  }
  if (key === 'labelPosition') {
    return {
      dataType: 'enum',
      options: kind === 'region' ? regionLabelPositionValues : nodeLabelPositionValues
    };
  }
  const options = styleEnumOptionsByKey[key];
  if (options) return { dataType: 'enum', options };
  if (booleanStyleKeys.has(key)) return { dataType: 'boolean' };
  if (integerStyleKeys.has(key)) return { dataType: 'integer' };
  if (numberStyleKeys.has(key)) return { dataType: 'number' };
  return { dataType: 'text' };
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function styleMetadataForYamlIntelligence() {
  const kinds = Object.keys(styleOptionsByKind) as TopoObjectSelection['kind'][];
  return {
    optionsByKind: Object.fromEntries(
      kinds.map((kind) => [kind, styleOptionsByKind[kind]])
    ) as Record<TopoObjectSelection['kind'], Array<{ key: string; label: string }>>,
    valueTypesByKind: Object.fromEntries(
      kinds.map((kind) => [
        kind,
        Object.fromEntries(
          styleOptionsByKind[kind].map((option) => [
            option.key,
            styleValueDefinitionForKey(kind, option.key)
          ])
        )
      ])
    ) as Record<TopoObjectSelection['kind'], Record<string, StyleValueDefinition>>
  };
}

function isColorStyleKey(key: string) {
  return key === 'color' || key.endsWith('Color') || key === 'fill' || key === 'pipeFill' || key === 'stroke';
}

function rowValueToInput(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function keyValueRowsForObject(object: any | undefined, key: 'labels' | 'data'): KeyValueEditorRow[] {
  const record = cloneRecord(object?.[key]) || {};
  const entries = Object.entries(record);
  if (!entries.length) {
    return [{ id: `${key}-new-0`, key: '', value: '' }];
  }
  return entries.map(([entryKey, value], index) => ({
    id: `${key}-${entryKey}-${index}`,
    key: entryKey,
    value: rowValueToInput(value)
  }));
}

export function recordFromRows(rows: KeyValueEditorRow[]): Record<string, unknown> {
  return rows.reduce<Record<string, unknown>>((record, row) => {
    const key = row.key.trim();
    if (!key) return record;
    record[key] = row.value;
    return record;
  }, {});
}

export function styleGroupForKey(kind: TopoObjectSelection['kind'], key: string) {
  if (kind === 'link' || kind === 'path') {
    if (key.includes('Arrow')) return 'Arrows';
    if (key.includes('Label') || key.startsWith('label') || key.startsWith('sourceLabel') || key.startsWith('targetLabel') || key.startsWith('text')) return 'Labels';
    if (key.includes('Distance') || key.includes('control') || key.includes('segment') || key.includes('taxi') || key === 'curveStyle' || key === 'edgeDistances') return 'Routing';
    if (key.startsWith('line')) return 'Line';
    return 'General';
  }
  if (key.startsWith('label') || key.startsWith('meta')) return 'Labels';
  if (key.startsWith('badge') || key.startsWith('status')) return 'Status';
  if (key.startsWith('icon')) return 'Icon';
  if (key.includes('border') || key.includes('outline') || key.includes('underlay')) return 'Border and underlay';
  if (['width', 'height', 'shape', 'shapePolygonPoints', 'zIndex', 'rotation'].includes(key)) return 'Geometry';
  if (['display', 'draggable', 'selectable', 'opacity', 'interactive'].includes(key)) return 'Interaction';
  return 'General';
}
