import '@xyflow/react/dist/style.css';
import '../../../topoviewer/src/styles.css';
import Editor from '@monaco-editor/react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputLabel,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightModeIcon from '@mui/icons-material/LightMode';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RefreshIcon from '@mui/icons-material/Refresh';
import { applyStyle, TopoViewer, type StyleDeclaration, type TopoDocument, type TopoViewerNodePositionChange, type TopoViewerObjectClick } from 'topoviewer';
import type { HarnessFixture, TopoViewerWebviewHost, ValidationResult, WebviewState } from '../shared/types';
import {
  clearAttention,
  defaultLayerId,
  deleteTopoObjects,
  findObject,
  focusKindForSelection,
  insertTopoObject,
  insertTopoPreset,
  objectDisplayName,
  objectExists,
  objectIdsByKind,
  resolveSelectionFromObject,
  sameSelection,
  updateGraphNodePosition,
  updateAttentionFocus,
  updateAttentionInteraction,
  updateAttentionLinkGrouping,
  updateAttentionMatcher,
  updateAttentionRegionAggregation,
  updateTopoObject,
  upsertGraphLink,
  upsertGraphPath,
  type AttentionFocusKind,
  type InsertObjectType,
  type TopoObjectPreset,
  type TopoObjectSelection
} from '../shared/topologyMutations';
import './webview.css';

interface WebviewAppProps {
  host: TopoViewerWebviewHost;
  themeMode?: 'light' | 'dark';
  onToggleThemeMode?: () => void;
}

type HarnessMode = 'build' | 'inspect' | 'yaml' | 'attention' | 'layers';

interface HarnessTabPanelProps {
  children?: ReactNode;
  className?: string;
  index: number;
  value: number;
}

interface TopologyTransaction {
  label: string;
  previousText: string;
  nextText: string;
}

interface StyleEditorRow {
  id: string;
  key: string;
  originalKey: string;
  originalValue: string;
  source: 'inline' | 'stylesheet' | 'new';
  value: string;
}

type StyleValueDataType = 'text' | 'enum' | 'boolean' | 'integer' | 'number' | 'color';

interface KeyValueEditorRow {
  id: string;
  key: string;
  value: string;
}

interface StyleValueDefinition {
  dataType: StyleValueDataType;
  options?: string[];
}

const splitStorageKey = 'topoviewer.vscodeHarness.splitPercent.v2';
const presetStorageKey = 'topoviewer.vscodeHarness.presets.v1';
const defaultSplitPercent = 33.333;
const minSplitPercent = 24;
const maxSplitPercent = 55;
const harnessModes: HarnessMode[] = ['build', 'inspect', 'yaml', 'attention', 'layers'];

const primitiveObjects: Array<{ type: InsertObjectType; label: string }> = [
  { type: 'node', label: 'Node' },
  { type: 'link', label: 'Connection' },
  { type: 'path', label: 'Path' },
  { type: 'region', label: 'Region' },
  { type: 'callout', label: 'Callout' }
];

const presetObjects: Array<{ type: InsertObjectType; label: string }> = [
  { type: 'router', label: 'Router' },
  { type: 'service', label: 'Service' },
  { type: 'controller', label: 'Controller' },
  { type: 'external', label: 'External' }
];

type InsertPaletteItem =
  | { kind: 'insert'; label: string; type: InsertObjectType }
  | { kind: 'preset'; label: string; preset: TopoObjectPreset };

const baseInsertObjectGroups: Array<{
  description: string;
  objects: InsertPaletteItem[];
  title: string;
}> = [
  {
    title: 'Primitives',
    description: 'Generic topology building blocks',
    objects: primitiveObjects.map((object) => ({ kind: 'insert' as const, ...object }))
  },
  {
    title: 'Presets',
    description: 'Optional starting labels for common environments',
    objects: presetObjects.map((object) => ({ kind: 'insert' as const, ...object }))
  }
];

const styleOptionsByKind: Record<TopoObjectSelection['kind'], Array<{ key: string; label: string }>> = {
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
  'triangle',
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

function styleValueDefinitionForKey(kind: TopoObjectSelection['kind'], key: string): StyleValueDefinition {
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

function isColorStyleKey(key: string) {
  return key === 'color' || key.endsWith('Color') || key === 'fill' || key === 'pipeFill' || key === 'stroke';
}

function colorInputValue(value: string) {
  return colorPickerValue(value) || '#1976d2';
}

function colorPickerValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '#1976d2';
  const shortHex = trimmed.match(/^#([0-9a-fA-F]{3})$/);
  if (shortHex) {
    return `#${shortHex[1].split('').map((char) => char + char).join('')}`.toLowerCase();
  }
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : undefined;
}

function styleValueToInput(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.join(' ');
  return String(value);
}

function rowValueToInput(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseStyleValue(key: string, value: string): unknown {
  const trimmed = value.trim();
  if (booleanStyleKeys.has(key)) {
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
  }
  if (integerStyleKeys.has(key)) {
    const numberValue = Number(trimmed);
    if (Number.isFinite(numberValue)) return Math.round(numberValue);
  }
  if (numberStyleKeys.has(key)) {
    const numberValue = Number(trimmed);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return trimmed;
}

function effectiveStyleForObject(kind: TopoObjectSelection['kind'], object: any | undefined, document?: TopoDocument): StyleDeclaration {
  if (!object || !document) return {};
  return applyStyle(kind, object, document);
}

function inlineStyleForObject(object: any | undefined): Record<string, unknown> {
  return cloneRecord(object?.style) || {};
}

function styleSourceForKey(object: any | undefined, key: string): StyleEditorRow['source'] {
  return Object.prototype.hasOwnProperty.call(inlineStyleForObject(object), key) ? 'inline' : 'stylesheet';
}

function styleRowsForObject(kind: TopoObjectSelection['kind'], object: any | undefined, document?: TopoDocument): StyleEditorRow[] {
  const style = effectiveStyleForObject(kind, object, document);
  const entries = Object.entries(style);
  if (entries.length) {
    return entries.map(([key, value], index) => ({
      id: `style-${key}-${index}`,
      key,
      originalKey: key,
      originalValue: styleValueToInput(value),
      source: styleSourceForKey(object, key),
      value: styleValueToInput(value)
    }));
  }
  return [{
    id: 'style-new-0',
    key: styleOptionsByKind[kind][0]?.key || '',
    originalKey: '',
    originalValue: '',
    source: 'new',
    value: ''
  }];
}

function keyValueRowsForObject(object: any | undefined, key: 'labels' | 'data'): KeyValueEditorRow[] {
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

function recordFromRows(rows: KeyValueEditorRow[]): Record<string, unknown> {
  return rows.reduce<Record<string, unknown>>((record, row) => {
    const key = row.key.trim();
    if (!key) return record;
    record[key] = row.value;
    return record;
  }, {});
}

function styleOptionLabel(kind: TopoObjectSelection['kind'], key: string) {
  return styleOptionsByKind[kind].find((option) => option.key === key)?.label || key;
}

function styleGroupForKey(kind: TopoObjectSelection['kind'], key: string) {
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

function groupedStyleOptions(kind: TopoObjectSelection['kind']) {
  const groups = new Map<string, Array<{ key: string; label: string }>>();
  styleOptionsByKind[kind].forEach((option) => {
    const group = styleGroupForKey(kind, option.key);
    groups.set(group, [...(groups.get(group) || []), option]);
  });
  return Array.from(groups.entries());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function initialSplitPercent() {
  if (typeof window === 'undefined') return defaultSplitPercent;
  const raw = window.localStorage.getItem(splitStorageKey);
  if (raw === null) return defaultSplitPercent;
  const stored = Number(raw);
  return Number.isFinite(stored) ? clamp(stored, minSplitPercent, maxSplitPercent) : defaultSplitPercent;
}

function initialSavedPresets(): TopoObjectPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(presetStorageKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter((preset) => preset?.id && preset?.name && preset?.kind) : [];
  } catch {
    return [];
  }
}

function mergeLayerSelection(previous: string[], layers: Array<{ id: string }>) {
  if (!layers.length) return [];
  const known = new Set(layers.map((layer) => layer.id));
  const kept = previous.filter((id) => known.has(id));
  return kept.length ? kept : layers.map((layer) => layer.id);
}

function modeLabel(mode: HarnessMode) {
  if (mode === 'build') return 'Build';
  if (mode === 'yaml') return 'YAML';
  if (mode === 'inspect') return 'Inspect';
  if (mode === 'attention') return 'Attention';
  return 'Layers';
}

function modeIndex(mode: HarnessMode) {
  return harnessModes.indexOf(mode);
}

function tabId(index: number) {
  return `topoviewer-authoring-tab-${index}`;
}

function tabPanelId(index: number) {
  return `topoviewer-authoring-tabpanel-${index}`;
}

function a11yProps(index: number) {
  return {
    id: tabId(index),
    'aria-controls': tabPanelId(index)
  };
}

function HarnessTabPanel({ children, value, index, className }: HarnessTabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={tabPanelId(index)}
      aria-labelledby={tabId(index)}
      className={className}
    >
      {children}
    </Box>
  );
}

function selectionSummary(selection: TopoObjectSelection[]) {
  if (!selection.length) return 'No selection';
  const kinds = [...new Set(selection.map((object) => object.kind))];
  return `${selection.length} ${kinds.length === 1 ? kinds[0] : 'objects'} selected`;
}

function selectedObjectIds(selection: TopoObjectSelection[]) {
  return selection.map((object) => object.id);
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneUnknown(value: unknown): unknown {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function presetFromObject(selection: TopoObjectSelection, object: any, presetName: string): TopoObjectPreset {
  return {
    id: `preset-${Date.now()}`,
    name: presetName || object?.name || object?.label || selection.id,
    kind: selection.kind,
    ...(object?.labels ? { labels: cloneRecord(object.labels) } : {}),
    ...(object?.data ? { data: cloneRecord(object.data) } : {}),
    ...(object?.style ? { style: cloneRecord(object.style) } : {}),
    ...(object?.icon ? { icon: String(object.icon) } : {}),
    ...(object?.type ? { type: String(object.type) } : {}),
    ...(object?.title ? { title: String(object.title) } : {}),
    ...(object?.body !== undefined ? { body: cloneUnknown(object.body) } : {})
  };
}

function focusKindLabel(focusKind: AttentionFocusKind) {
  if (focusKind === 'nodeIds') return 'Nodes';
  if (focusKind === 'linkIds') return 'Links';
  if (focusKind === 'pathIds') return 'Paths';
  return 'Regions';
}

function selectedNodeIds(selection: TopoObjectSelection[]) {
  return selection.filter((object) => object.kind === 'node').map((object) => object.id);
}

function positionOf(value: unknown): { x: number; y: number } | undefined {
  if (Array.isArray(value)) return { x: Number(value[0] || 0), y: Number(value[1] || 0) };
  if (value && typeof value === 'object') {
    const position = value as { x?: number; y?: number };
    return { x: Number(position.x || 0), y: Number(position.y || 0) };
  }
  return undefined;
}

function pathSequenceFromObject(path: any): string[] {
  if (Array.isArray(path?.sequence)) return path.sequence.map(String);
  return [path?.source, path?.target].map((id) => String(id || '')).filter(Boolean);
}

function sequenceFromControls(source: string, transitIds: string[], target: string) {
  const transit = transitIds.filter((id, index) => id && id !== source && id !== target && transitIds.indexOf(id) === index);
  return [source, ...transit, target].filter(Boolean);
}

function sameRoundedPosition(a: { x: number; y: number } | undefined, b: { x: number; y: number }) {
  return !!a && Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);
}

function editorDocumentForTab(tab: number): 'topology' | 'stylesheet' {
  return tab === 0 ? 'topology' : 'stylesheet';
}

function clampLine(line: number | undefined, maxLine: number) {
  if (!line || !Number.isFinite(line)) return 1;
  return Math.min(maxLine, Math.max(1, Math.round(line)));
}

export function WebviewApp({ host, themeMode, onToggleThemeMode }: WebviewAppProps) {
  const [state, setState] = useState<WebviewState>();
  const [fixtures, setFixtures] = useState<HarnessFixture[]>([]);
  const [validation, setValidation] = useState<ValidationResult>({ diagnostics: [], layers: [] });
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<TopoObjectSelection[]>([]);
  const [savedPresets, setSavedPresets] = useState<TopoObjectPreset[]>(initialSavedPresets);
  const [tab, setTab] = useState(0);
  const [mode, setMode] = useState<HarnessMode>('build');
  const [splitPercent, setSplitPercent] = useState(initialSplitPercent);
  const [resizing, setResizing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>();
  const [undoStack, setUndoStack] = useState<TopologyTransaction[]>([]);
  const [redoStack, setRedoStack] = useState<TopologyTransaction[]>([]);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorLayerId, setInspectorLayerId] = useState('');
  const [inspectorX, setInspectorX] = useState('');
  const [inspectorY, setInspectorY] = useState('');
  const [labelRows, setLabelRows] = useState<KeyValueEditorRow[]>([]);
  const [dataRows, setDataRows] = useState<KeyValueEditorRow[]>([]);
  const [styleRows, setStyleRows] = useState<StyleEditorRow[]>([]);
  const [presetName, setPresetName] = useState('');
  const [relationshipComposer, setRelationshipComposer] = useState<'link' | 'path'>();
  const [linkSourceId, setLinkSourceId] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [pathSourceId, setPathSourceId] = useState('');
  const [pathTargetId, setPathTargetId] = useState('');
  const [pathTransitIds, setPathTransitIds] = useState<string[]>([]);
  const [pathTransitCandidate, setPathTransitCandidate] = useState('');
  const [attentionFocusKind, setAttentionFocusKind] = useState<AttentionFocusKind>('pathIds');
  const [attentionFocusId, setAttentionFocusId] = useState('');
  const [attentionMode, setAttentionMode] = useState('dim-context');
  const [attentionInteractive, setAttentionInteractive] = useState(false);
  const [attentionClickMode, setAttentionClickMode] = useState('dim-context');
  const [attentionLabelKey, setAttentionLabelKey] = useState('');
  const [attentionLabelValue, setAttentionLabelValue] = useState('');
  const [attentionDataKey, setAttentionDataKey] = useState('');
  const [attentionDataValue, setAttentionDataValue] = useState('');
  const [attentionRegionId, setAttentionRegionId] = useState('');
  const [attentionExpandOnClick, setAttentionExpandOnClick] = useState(true);
  const [linkGroupingThreshold, setLinkGroupingThreshold] = useState('2');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const diagnosticDecorationsRef = useRef<any>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [initialState, availableFixtures] = await Promise.all([
          host.loadInitialState(),
          host.listFixtures?.() || Promise.resolve([])
        ]);
        if (!mounted) return;
        setState(initialState);
        setFixtures(availableFixtures);
      } catch (error) {
        if (mounted) {
          setValidation({
            diagnostics: [{
              severity: 'error',
              source: 'host',
              code: 'host-load-failed',
              message: error instanceof Error ? error.message : String(error)
            }],
            layers: []
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [host]);

  useEffect(() => {
    if (host.kind !== 'browser') return undefined;
    (window as unknown as { __topoviewerHarnessState?: WebviewState }).__topoviewerHarnessState = state;
    return () => {
      delete (window as unknown as { __topoviewerHarnessState?: WebviewState }).__topoviewerHarnessState;
    };
  }, [host.kind, state]);

  useEffect(() => {
    if (!state || !host.saveState) return;
    host.saveState(state);
  }, [host, state]);

  useEffect(() => {
    let mounted = true;
    async function validate() {
      if (!state) return;
      try {
        const result = await host.validate(state);
        if (!mounted) return;
        setValidation(result);
        setSelectedLayerIds((current) => mergeLayerSelection(current, result.layers));
      } catch (error) {
        if (!mounted) return;
        setValidation({
          diagnostics: [{
            severity: 'error',
            source: 'host',
            code: 'host-validation-failed',
            message: error instanceof Error ? error.message : String(error)
          }],
          layers: []
        });
      }
    }
    validate();
    return () => {
      mounted = false;
    };
  }, [host, state]);

  const visibleDocument = useMemo(() => validation.document as TopoDocument | undefined, [validation.document]);
  const graphNodes = visibleDocument?.graph?.nodes || [];
  const nodeNameById = useMemo(() => new Map(graphNodes.map((node) => [node.id, node.name || node.label || node.id])), [graphNodes]);
  const hasErrors = validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const diagnosticSeverity: 'success' | 'warning' | 'error' = hasErrors ? 'error' : validation.diagnostics.length > 0 ? 'warning' : 'success';
  const diagnosticSummary = validation.diagnostics.length === 0
    ? 'No diagnostics'
    : `${validation.diagnostics.length} diagnostic${validation.diagnostics.length === 1 ? '' : 's'}: ${validation.diagnostics[0]?.code}`;
  const messageSeverity: 'success' | 'warning' = message?.toLowerCase().includes('requires') || message?.toLowerCase().includes('must') ? 'warning' : 'success';
  const statusSeverity = hasErrors ? diagnosticSeverity : message ? messageSeverity : diagnosticSeverity;
  const statusSummary = hasErrors ? diagnosticSummary : message || diagnosticSummary;
  const shellClassName = `topoviewer-vscode-shell${themeMode ? ` topoviewer-vscode-shell--${themeMode}` : ''}`;
  const nextThemeMode = themeMode === 'dark' ? 'light' : 'dark';
  const editorTheme = themeMode === 'light' ? 'light' : 'vs-dark';
  const editorValue = tab === 0 ? state?.topologyText || '' : state?.stylesheetText || '';
  const editorLabel = tab === 0 ? 'Topology YAML' : 'Stylesheet YAML';
  const selectedPrimary = selectedObjects[0];
  const selectedPrimaryObject = useMemo(() => findObject(visibleDocument, selectedPrimary), [selectedPrimary, visibleDocument]);
  const selectedPrimaryStyle = useMemo(() => (
    selectedPrimary
      ? effectiveStyleForObject(selectedPrimary.kind, selectedPrimaryObject, visibleDocument)
      : {}
  ), [selectedPrimary, selectedPrimaryObject, visibleDocument]);
  const selectedFixture = fixtures.find((fixture) => fixture.id === state?.fixtureId);
  const currentAttention = visibleDocument?.attention;
  const attentionSummary = currentAttention
    ? [
      currentAttention.query ? 'focus' : undefined,
      currentAttention.interactive ? 'interactive' : undefined,
      currentAttention.aggregate?.groups?.length ? 'aggregate' : undefined,
      currentAttention.links?.grouping ? 'links' : undefined
    ].filter(Boolean).join(' / ') || 'configured'
    : 'off';
  const availableFocusIds = objectIdsByKind(visibleDocument, attentionFocusKind);
  const selectedGraphNodeIds = selectedNodeIds(selectedObjects);
  const pathTransitOptions = graphNodes.filter((node) => node.id !== pathSourceId && node.id !== pathTargetId && !pathTransitIds.includes(node.id));
  const activeModeIndex = modeIndex(mode);
  const availableStyleOptions = selectedPrimary ? styleOptionsByKind[selectedPrimary.kind] : [];
  const availableStyleOptionGroups = selectedPrimary ? groupedStyleOptions(selectedPrimary.kind) : [];
  const insertObjectGroups = useMemo(() => baseInsertObjectGroups.map((group) => (
    group.title !== 'Presets'
      ? group
      : {
        ...group,
        objects: [
          ...group.objects,
          ...savedPresets.map((preset) => ({
            kind: 'preset' as const,
            label: preset.name,
            preset
          }))
        ]
      }
  )), [savedPresets]);

  const updateEditorDiagnostics = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel?.();
    if (!editor || !monaco || !model) return;

    const targetDocument = editorDocumentForTab(tab);
    const diagnostics = validation.diagnostics.filter((diagnostic) => (
      diagnostic.document ? diagnostic.document === targetDocument : targetDocument === 'topology'
    ));
    const lineCount = Math.max(1, model.getLineCount?.() || 1);
    const markers = diagnostics.map((diagnostic) => {
      const lineNumber = clampLine(diagnostic.line, lineCount);
      const maxColumn = Math.max(2, model.getLineMaxColumn?.(lineNumber) || 2);
      const startColumn = Math.min(maxColumn - 1, Math.max(1, Math.round(diagnostic.column || 1)));
      return {
        severity: diagnostic.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
        message: diagnostic.message,
        source: 'TopoViewer',
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn: maxColumn
      };
    });

    monaco.editor.setModelMarkers(model, 'topoviewer', markers);
    const decorations = diagnostics.map((diagnostic) => {
      const lineNumber = clampLine(diagnostic.line, lineCount);
      return {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          className: diagnostic.severity === 'error'
            ? 'topoviewer-vscode-diagnostic-line topoviewer-vscode-diagnostic-line--error'
            : 'topoviewer-vscode-diagnostic-line topoviewer-vscode-diagnostic-line--warning',
          glyphMarginClassName: diagnostic.severity === 'error'
            ? 'topoviewer-vscode-diagnostic-glyph topoviewer-vscode-diagnostic-glyph--error'
            : 'topoviewer-vscode-diagnostic-glyph topoviewer-vscode-diagnostic-glyph--warning',
          isWholeLine: true,
          overviewRuler: {
            color: diagnostic.severity === 'error' ? '#d32f2f' : '#ed6c02',
            position: monaco.editor.OverviewRulerLane.Right
          }
        }
      };
    });
    if (diagnosticDecorationsRef.current?.set) {
      diagnosticDecorationsRef.current.set(decorations);
    } else if (editor.createDecorationsCollection) {
      diagnosticDecorationsRef.current = editor.createDecorationsCollection(decorations);
    }
  }, [tab, validation.diagnostics]);

  useEffect(() => {
    updateEditorDiagnostics();
  }, [editorValue, updateEditorDiagnostics]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(splitStorageKey, String(splitPercent));
    }
  }, [splitPercent]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(presetStorageKey, JSON.stringify(savedPresets));
    }
  }, [savedPresets]);

  useEffect(() => {
    if (!visibleDocument) return;
    setSelectedObjects((current) => current.filter((selection) => objectExists(visibleDocument, selection)));
  }, [visibleDocument]);

  useEffect(() => {
    if (!selectedPrimaryObject || !selectedPrimary) {
      setInspectorName('');
      setInspectorLayerId(defaultLayerId(visibleDocument, selectedLayerIds));
      setInspectorX('');
      setInspectorY('');
      setPresetName('');
      setLabelRows([]);
      setDataRows([]);
      setStyleRows([]);
      return;
    }
    setInspectorName(selectedPrimaryObject.name || '');
    setInspectorLayerId(selectedPrimaryObject.layers?.[0] || defaultLayerId(visibleDocument, selectedLayerIds));
    setPresetName(`${selectedPrimaryObject.name || selectedPrimaryObject.label || selectedPrimary.id} preset`);
    setLabelRows(keyValueRowsForObject(selectedPrimaryObject, 'labels'));
    setDataRows(keyValueRowsForObject(selectedPrimaryObject, 'data'));
    setStyleRows(styleRowsForObject(selectedPrimary.kind, selectedPrimaryObject, visibleDocument));
    const position = positionOf(selectedPrimaryObject.position);
    setInspectorX(position?.x !== undefined ? String(position.x) : '');
    setInspectorY(position?.y !== undefined ? String(position.y) : '');
    if (selectedPrimary.kind === 'link') {
      setLinkSourceId(String(selectedPrimaryObject.source || ''));
      setLinkTargetId(String(selectedPrimaryObject.target || ''));
    }
    if (selectedPrimary.kind === 'path') {
      const sequence = pathSequenceFromObject(selectedPrimaryObject);
      setPathSourceId(sequence[0] || '');
      setPathTargetId(sequence[sequence.length - 1] || '');
      setPathTransitIds(sequence.slice(1, -1));
      setPathTransitCandidate('');
    }
  }, [selectedLayerIds, selectedPrimary, selectedPrimaryObject, visibleDocument]);

  useEffect(() => {
    const query = currentAttention?.query as Record<string, any> | undefined;
    if (!query) return;
    const explicitIds = Array.isArray(query.ids) ? query.ids.map(String) : [];
    const explicitKind = explicitIds.length && explicitIds.every((id) => (visibleDocument?.graph?.links || []).some((link) => link.id === id))
      ? 'linkIds'
      : explicitIds.length
        ? 'nodeIds'
        : undefined;
    const nextKind = explicitKind || (['pathIds', 'regionIds'] as AttentionFocusKind[]).find((kind) => Array.isArray(query[kind]));
    if (nextKind) {
      setAttentionFocusKind(nextKind);
      setAttentionFocusId(String((nextKind === 'nodeIds' || nextKind === 'linkIds' ? query.ids : query[nextKind])?.[0] || ''));
    }
    if (query.mode) setAttentionMode(String(query.mode));
    const labelEntry = Object.entries(query.labels || {})[0];
    const dataEntry = Object.entries(query.data || {})[0];
    setAttentionLabelKey(labelEntry ? String(labelEntry[0]) : '');
    setAttentionLabelValue(labelEntry ? String(labelEntry[1]) : '');
    setAttentionDataKey(dataEntry ? String(dataEntry[0]) : '');
    setAttentionDataValue(dataEntry ? String(dataEntry[1]) : '');
    if (currentAttention?.interactive !== undefined) setAttentionInteractive(!!currentAttention.interactive);
    if (currentAttention?.clickMode) setAttentionClickMode(String(currentAttention.clickMode));
    if (currentAttention?.links?.grouping?.threshold !== undefined) {
      setLinkGroupingThreshold(String(currentAttention.links.grouping.threshold));
    }
  }, [currentAttention, visibleDocument?.graph?.links]);

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const next = ((clientX - bounds.left) / bounds.width) * 100;
    setSplitPercent(clamp(next, minSplitPercent, maxSplitPercent));
  }, []);

  useEffect(() => {
    if (!resizing) return undefined;
    const onPointerMove = (event: PointerEvent) => updateSplitFromClientX(event.clientX);
    const onPointerUp = () => setResizing(false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [resizing, updateSplitFromClientX]);

  function flash(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(undefined), 1800);
  }

  function applyTopologyTransaction(label: string, update: (topologyText: string) => { text: string }) {
    setState((current) => {
      if (!current) return current;
      try {
        const result = update(current.topologyText);
        setUndoStack((stack) => [...stack, { label, previousText: current.topologyText, nextText: result.text }]);
        setRedoStack([]);
        flash(label);
        return { ...current, topologyText: result.text };
      } catch (error) {
        flash(error instanceof Error ? error.message : String(error));
        return current;
      }
    });
  }

  function undoTopology() {
    const transaction = undoStack[undoStack.length - 1];
    if (!transaction) return;
    setUndoStack((stack) => stack.slice(0, -1));
    setRedoStack((stack) => [...stack, transaction]);
    setState((current) => current ? { ...current, topologyText: transaction.previousText } : current);
    flash(`Undo ${transaction.label}`);
  }

  function redoTopology() {
    const transaction = redoStack[redoStack.length - 1];
    if (!transaction) return;
    setRedoStack((stack) => stack.slice(0, -1));
    setUndoStack((stack) => [...stack, transaction]);
    setState((current) => current ? { ...current, topologyText: transaction.nextText } : current);
    flash(`Redo ${transaction.label}`);
  }

  async function reloadFixture(id: string) {
    if (!host.loadFixture) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      setState(await host.loadFixture(id));
    } finally {
      setLoading(false);
    }
  }

  async function refreshFixtures() {
    if (!host.listFixtures) return;
    setFixtures(await host.listFixtures());
  }

  async function createTopology() {
    if (!host.createTopology) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      const nextState = await host.createTopology();
      await refreshFixtures();
      setState(nextState);
      flash('Created topology');
    } finally {
      setLoading(false);
    }
  }

  async function saveTopology() {
    if (!state || !host.saveState) return;
    await host.saveState(state);
    await refreshFixtures();
    flash('Saved topology');
  }

  async function revertTopology() {
    if (!state || !host.revertState) return;
    setLoading(true);
    try {
      setSelectedObjects([]);
      setUndoStack([]);
      setRedoStack([]);
      const nextState = await host.revertState(state);
      await refreshFixtures();
      setState(nextState);
      flash(selectedFixture?.kind === 'saved' ? 'Removed saved topology' : 'Reverted template');
    } finally {
      setLoading(false);
    }
  }

  async function exportImage() {
    await host.exportImage();
    flash('Export command sent');
  }

  async function copyYamlToClipboard() {
    try {
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(editorValue);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const textarea = document.createElement('textarea');
        textarea.value = editorValue;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      flash(`Copied ${editorLabel}`);
    } catch (error) {
      flash(error instanceof Error ? error.message : 'Copy failed');
    }
  }

  function handleEditorMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    diagnosticDecorationsRef.current = editor.createDecorationsCollection?.([]);
    updateEditorDiagnostics();
  }

  function selectObject(selection: TopoObjectSelection, modifiers?: TopoViewerObjectClick['modifiers']) {
    const additive = !!(modifiers?.ctrlKey || modifiers?.metaKey || modifiers?.shiftKey);
    setSelectedObjects((current) => {
      if (!additive) return [selection];
      return current.some((candidate) => sameSelection(candidate, selection))
        ? current.filter((candidate) => !sameSelection(candidate, selection))
        : [...current, selection];
    });
    if (mode !== 'attention') setMode('inspect');
  }

  function handleObjectClick(object: TopoViewerObjectClick) {
    const selection = resolveSelectionFromObject(visibleDocument, object.id);
    if (!selection) return;
    selectObject(selection, object.modifiers);
    if (mode === 'attention') {
      const focusKind = focusKindForSelection(selection.kind);
      if (!focusKind) return;
      setAttentionFocusKind(focusKind);
      setAttentionFocusId(selection.id);
      applyAttentionFocus([selection.id], focusKind);
    }
  }

  function openRelationshipComposer(kind: 'link' | 'path') {
    const selectedNodes = selectedGraphNodeIds;
    setRelationshipComposer(kind);
    if (kind === 'link') {
      if (selectedNodes.length >= 2) {
        setLinkSourceId(selectedNodes[0]);
        setLinkTargetId(selectedNodes[1]);
      } else {
        setLinkSourceId((current) => current || graphNodes[0]?.id || '');
        setLinkTargetId((current) => current || graphNodes.find((node) => node.id !== (selectedNodes[0] || linkSourceId || graphNodes[0]?.id))?.id || '');
      }
      return;
    }

    if (selectedNodes.length >= 2) {
      setPathSourceId(selectedNodes[0]);
      setPathTargetId(selectedNodes[selectedNodes.length - 1]);
      setPathTransitIds(selectedNodes.slice(1, -1));
    } else {
      setPathSourceId((current) => current || graphNodes[0]?.id || '');
      setPathTargetId((current) => current || graphNodes.find((node) => node.id !== (selectedNodes[0] || pathSourceId || graphNodes[0]?.id))?.id || '');
      setPathTransitIds([]);
    }
    setPathTransitCandidate('');
  }

  function insertObject(type: InsertObjectType) {
    if (type === 'link' || type === 'path') {
      openRelationshipComposer(type);
      return;
    }
    setTab(0);
    applyTopologyTransaction(`Insert ${type}`, (topologyText) => insertTopoObject(topologyText, {
      type,
      selectedLayerIds,
      selectedObjects
    }));
  }

  function createConnection() {
    setTab(0);
    applyTopologyTransaction('Create connection', (topologyText) => upsertGraphLink(topologyText, {
      selectedLayerIds,
      source: linkSourceId,
      target: linkTargetId
    }));
  }

  function createPath() {
    setTab(0);
    applyTopologyTransaction('Create path', (topologyText) => upsertGraphPath(topologyText, {
      selectedLayerIds,
      sequence: sequenceFromControls(pathSourceId, pathTransitIds, pathTargetId)
    }));
  }

  function applyRelationshipInspector() {
    if (!selectedPrimary) return;
    setTab(0);
    if (selectedPrimary.kind === 'link') {
      applyTopologyTransaction('Update link endpoints', (topologyText) => upsertGraphLink(topologyText, {
        id: selectedPrimary.id,
        name: inspectorName,
        selectedLayerIds,
        source: linkSourceId,
        target: linkTargetId
      }));
      return;
    }
    if (selectedPrimary.kind === 'path') {
      applyTopologyTransaction('Update path sequence', (topologyText) => upsertGraphPath(topologyText, {
        id: selectedPrimary.id,
        name: inspectorName,
        selectedLayerIds,
        sequence: sequenceFromControls(pathSourceId, pathTransitIds, pathTargetId)
      }));
    }
  }

  function addPathTransitNode() {
    if (!pathTransitCandidate || pathTransitIds.includes(pathTransitCandidate)) return;
    if (pathTransitCandidate === pathSourceId || pathTransitCandidate === pathTargetId) return;
    setPathTransitIds((current) => [...current, pathTransitCandidate]);
    setPathTransitCandidate('');
  }

  function movePathTransitNode(index: number, direction: -1 | 1) {
    setPathTransitIds((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function removePathTransitNode(id: string) {
    setPathTransitIds((current) => current.filter((candidate) => candidate !== id));
  }

  function insertPreset(preset: TopoObjectPreset) {
    setTab(0);
    applyTopologyTransaction(`Insert preset ${preset.name}`, (topologyText) => insertTopoPreset(topologyText, {
      preset,
      selectedLayerIds,
      selectedObjects
    }));
  }

  function handleNodePositionChange(change: TopoViewerNodePositionChange) {
    if (hasErrors) return;
    const selection: TopoObjectSelection = { kind: 'node', id: change.id };
    const node = findObject(visibleDocument, selection);
    if (!node || sameRoundedPosition(positionOf(node.position), change.position)) return;
    setTab(0);
    applyTopologyTransaction('Move node', (topologyText) => updateGraphNodePosition(topologyText, {
      nodeId: change.id,
      position: change.position
    }));
  }

  function saveSelectionAsPreset() {
    if (!selectedPrimary || !selectedPrimaryObject) return;
    const nextPreset = presetFromObject(selectedPrimary, selectedPrimaryObject, presetName.trim());
    setSavedPresets((current) => [...current, nextPreset]);
    flash(`Saved preset ${nextPreset.name}`);
  }

  function applyInspector() {
    if (!selectedPrimary) return;
    setTab(0);
    applyTopologyTransaction('Update properties', (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      name: inspectorName,
      layerId: inspectorLayerId,
      position: inspectorX && inspectorY ? { x: Number(inspectorX), y: Number(inspectorY) } : undefined
    }));
  }

  function updateKeyValueRow(kind: 'labels' | 'data', rowId: string, patch: Partial<KeyValueEditorRow>) {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addKeyValueRow(kind: 'labels' | 'data') {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => [...current, {
      id: `${kind}-new-${Date.now()}`,
      key: '',
      value: ''
    }]);
  }

  function removeKeyValueRow(kind: 'labels' | 'data', rowId: string) {
    const updateRows = kind === 'labels' ? setLabelRows : setDataRows;
    updateRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length ? next : [{ id: `${kind}-new-${Date.now()}`, key: '', value: '' }];
    });
  }

  function applyKeyValueRows(kind: 'labels' | 'data') {
    if (!selectedPrimary) return;
    const rows = kind === 'labels' ? labelRows : dataRows;
    const record = recordFromRows(rows);
    setTab(0);
    applyTopologyTransaction(`Update ${kind}`, (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      ...(kind === 'labels'
        ? { labelsReplace: record }
        : { dataReplace: record })
    }));
  }

  function updateStyleRow(rowId: string, patch: Partial<StyleEditorRow>) {
    setStyleRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function updateStyleRowKey(rowId: string, key: string) {
    const existingValue = styleValueToInput(selectedPrimaryStyle[key]);
    updateStyleRow(rowId, {
      key,
      originalKey: key,
      originalValue: existingValue,
      source: existingValue ? styleSourceForKey(selectedPrimaryObject, key) : 'new',
      value: existingValue || (isColorStyleKey(key) ? colorInputValue('') : '')
    });
  }

  function addStyleRow() {
    if (!selectedPrimary) return;
    const usedKeys = new Set(styleRows.map((row) => row.key).filter(Boolean));
    const nextKey = availableStyleOptions.find((option) => !usedKeys.has(option.key))?.key || availableStyleOptions[0]?.key || '';
    setStyleRows((current) => [
      ...current,
      {
        id: `style-new-${Date.now()}`,
        key: nextKey,
        originalKey: nextKey,
        originalValue: styleValueToInput(selectedPrimaryStyle[nextKey]),
        source: selectedPrimaryStyle[nextKey] !== undefined ? styleSourceForKey(selectedPrimaryObject, nextKey) : 'new',
        value: styleValueToInput(selectedPrimaryStyle[nextKey])
      }
    ]);
  }

  function removeStyleRow(rowId: string) {
    setStyleRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length ? next : [{
        id: `style-new-${Date.now()}`,
        key: availableStyleOptions[0]?.key || '',
        originalKey: '',
        originalValue: '',
        source: 'new',
        value: ''
      }];
    });
  }

  function applyStyleRows() {
    if (!selectedPrimary || !selectedPrimaryObject) return;
    const style = inlineStyleForObject(selectedPrimaryObject);
    let changed = false;
    styleRows.forEach((row) => {
      const key = row.key.trim();
      if (!key) return;
      if (row.originalKey && row.originalKey !== key && row.source === 'inline') {
        delete style[row.originalKey];
        changed = true;
      }
      if (row.source === 'new' && !row.value.trim()) return;
      if (row.source === 'new' || row.value !== row.originalValue || row.originalKey !== key) {
        style[key] = parseStyleValue(key, row.value);
        changed = true;
      }
    });
    if (!changed) {
      flash('No style changes');
      return;
    }
    setTab(0);
    applyTopologyTransaction('Update style', (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      styleReplace: style
    }));
  }

  function resetStyleRow(row: StyleEditorRow) {
    if (!selectedPrimary || !selectedPrimaryObject) return;
    if (row.source !== 'inline') {
      updateStyleRow(row.id, { value: row.originalValue });
      return;
    }
    const key = row.originalKey || row.key;
    const style = inlineStyleForObject(selectedPrimaryObject);
    delete style[key];
    setTab(0);
    applyTopologyTransaction(`Reset ${styleOptionLabel(selectedPrimary.kind, key)}`, (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      styleReplace: style
    }));
  }

  function renderStyleValueInput(row: StyleEditorRow, definition: StyleValueDefinition) {
    const labelId = `inspector-style-value-${row.id}`;
    if (definition.dataType === 'enum' || definition.dataType === 'boolean') {
      const options = definition.dataType === 'boolean' ? ['true', 'false'] : definition.options || [];
      return (
        <FormControl fullWidth size="small">
          <InputLabel id={labelId}>Style value</InputLabel>
          <Select
            labelId={labelId}
            label="Style value"
            value={row.value}
            onChange={(event) => updateStyleRow(row.id, { value: String(event.target.value) })}
          >
            <MenuItem value="">Unset</MenuItem>
            {options.map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (definition.dataType === 'color') {
      const pickerValue = colorPickerValue(row.value);
      if (!pickerValue) {
        return (
          <TextField
            fullWidth
            size="small"
            label="Style value"
            value={row.value}
            onChange={(event) => updateStyleRow(row.id, { value: event.target.value })}
          />
        );
      }
      return (
        <TextField
          fullWidth
          size="small"
          label="Style value"
          type="color"
          value={pickerValue}
          onChange={(event) => updateStyleRow(row.id, { value: event.target.value })}
        />
      );
    }

    if (definition.dataType === 'integer' || definition.dataType === 'number') {
      return (
        <TextField
          fullWidth
          size="small"
          label="Style value"
          type="number"
          value={row.value}
          onChange={(event) => updateStyleRow(row.id, { value: event.target.value })}
        />
      );
    }

    return (
      <TextField
        fullWidth
        size="small"
        label="Style value"
        value={row.value}
        onChange={(event) => updateStyleRow(row.id, { value: event.target.value })}
      />
    );
  }

  function deleteSelection() {
    if (!selectedObjects.length) return;
    setTab(0);
    const deletion = [...selectedObjects];
    applyTopologyTransaction('Delete selection', (topologyText) => deleteTopoObjects(topologyText, deletion));
    setSelectedObjects([]);
  }

  function applyAttentionFocus(ids = attentionFocusId ? [attentionFocusId] : [], focusKind = attentionFocusKind) {
    if (!ids.length) return;
    setTab(0);
    applyTopologyTransaction('Update attention focus', (topologyText) => updateAttentionFocus(topologyText, {
      focusKind,
      ids,
      mode: attentionMode
    }));
  }

  function applyAttentionMatcher(kind: 'labels' | 'data') {
    const key = (kind === 'labels' ? attentionLabelKey : attentionDataKey).trim();
    const value = (kind === 'labels' ? attentionLabelValue : attentionDataValue).trim();
    if (!key) return;
    setTab(0);
    applyTopologyTransaction(`Update attention ${kind}`, (topologyText) => updateAttentionMatcher(topologyText, {
      matcherKind: kind,
      key,
      value,
      mode: attentionMode
    }));
  }

  function useSelectionForAttention() {
    const focusKind = selectedObjects.length ? focusKindForSelection(selectedObjects[0].kind) : undefined;
    if (!focusKind) {
      flash('Select nodes, links, paths, or regions first');
      return;
    }
    const ids = selectedObjects
      .filter((selection) => focusKindForSelection(selection.kind) === focusKind)
      .map((selection) => selection.id);
    setAttentionFocusKind(focusKind);
    setAttentionFocusId(ids[0] || '');
    applyAttentionFocus(ids, focusKind);
  }

  function applyInteraction() {
    setTab(0);
    applyTopologyTransaction('Update attention interaction', (topologyText) => updateAttentionInteraction(
      topologyText,
      attentionInteractive,
      attentionClickMode
    ));
  }

  function applyAggregation() {
    const regionId = attentionRegionId || (visibleDocument?.graph?.regions || [])[0]?.id;
    if (!regionId) return;
    setTab(0);
    applyTopologyTransaction('Update attention aggregation', (topologyText) => updateAttentionRegionAggregation(
      topologyText,
      [regionId],
      attentionExpandOnClick
    ));
  }

  function applyLinkGrouping() {
    setTab(0);
    applyTopologyTransaction('Update link grouping', (topologyText) => updateAttentionLinkGrouping(
      topologyText,
      Math.max(2, Number(linkGroupingThreshold || 2))
    ));
  }

  function resetAttention() {
    setTab(0);
    applyTopologyTransaction('Clear attention', (topologyText) => clearAttention(topologyText));
  }

  return (
    <Box
      className={shellClassName}
      data-color-mode={themeMode}
      sx={(theme) => ({
        '--topoviewer-vscode-canvas-min': theme.spacing(60),
        '--topoviewer-vscode-control-min': theme.spacing(3.75),
        '--topoviewer-vscode-divider-size': theme.spacing(1),
        '--topoviewer-vscode-focus-width': theme.spacing(0.25),
        '--topoviewer-vscode-radius': theme.spacing(0.75),
        '--topoviewer-vscode-radius-lg': theme.spacing(1),
        '--topoviewer-vscode-space-half': theme.spacing(0.5),
        '--topoviewer-vscode-space-1': theme.spacing(1),
        '--topoviewer-vscode-space-1-5': theme.spacing(1.5),
        '--topoviewer-vscode-space-2': theme.spacing(2),
        '--topoviewer-vscode-space-3-5': theme.spacing(3.5),
        '--topoviewer-vscode-stacked-preview-min': theme.spacing(65)
      })}
    >
      <AppBar position="static" elevation={0} color="default">
        <Toolbar variant="dense" className="topoviewer-vscode-toolbar">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>TopoViewer</Typography>
          <Chip size="small" label={host.kind === 'browser' ? 'Browser harness' : 'VS Code webview'} color={host.kind === 'browser' ? 'info' : 'primary'} />
          <Box sx={{ flex: 1 }} />
          {themeMode && onToggleThemeMode && (
            <Tooltip title={`Switch to ${nextThemeMode} mode`}>
              <IconButton
                aria-label={`Switch to ${nextThemeMode} mode`}
                color="inherit"
                size="small"
                onClick={onToggleThemeMode}
              >
                {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      <Box
        ref={workspaceRef}
        className={`topoviewer-vscode-workspace${resizing ? ' topoviewer-vscode-workspace--resizing' : ''}`}
        style={{ '--topoviewer-vscode-rail-width': `${splitPercent}%` } as CSSProperties}
      >
        <Box className="topoviewer-vscode-rail">
          <Paper className={`topoviewer-vscode-source topoviewer-vscode-source--${mode}`} elevation={0}>
            {host.kind === 'browser' && (
              <Stack className="topoviewer-vscode-template-control" spacing={1}>
                <FormControl size="small" className="topoviewer-vscode-fixture">
                  <InputLabel id="fixture-label" shrink>Template</InputLabel>
                  <Select
                    labelId="fixture-label"
                    label="Template"
                    notched
                    value={state?.fixtureId || ''}
                    onChange={(event) => reloadFixture(String(event.target.value))}
                  >
                    {fixtures.map((fixture) => (
                      <MenuItem key={fixture.id} value={fixture.id}>{fixture.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  <Button size="small" onClick={createTopology}>New topology</Button>
                  <Button size="small" onClick={saveTopology}>Save</Button>
                  <Button size="small" disabled={!state?.fixtureId} onClick={revertTopology}>
                    {selectedFixture?.kind === 'saved' ? 'Remove saved' : 'Revert template'}
                  </Button>
                </Stack>
              </Stack>
            )}

            <Box className="topoviewer-vscode-mode-tabs">
              <Tabs
                value={activeModeIndex}
                onChange={(_event, nextIndex: number) => setMode(harnessModes[nextIndex])}
                allowScrollButtonsMobile
                scrollButtons="auto"
                variant="scrollable"
                aria-label="Authoring mode"
              >
                {harnessModes.map((candidate, index) => (
                  <Tab key={candidate} label={modeLabel(candidate)} {...a11yProps(index)} />
                ))}
              </Tabs>
            </Box>
            <Alert severity={statusSeverity} className="topoviewer-vscode-diagnostic-strip">
              <Box className="topoviewer-vscode-status-row">
                <Typography className="topoviewer-vscode-status-summary" variant="caption">{statusSummary}</Typography>
                {selectedObjects.length > 0 && (
                  <Typography className="topoviewer-vscode-selection-summary" variant="caption">{selectionSummary(selectedObjects)}</Typography>
                )}
              </Box>
            </Alert>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('build')} className="topoviewer-vscode-mode-pane topoviewer-vscode-build-pane">
              <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={2}>
                {insertObjectGroups.map((group) => (
                  <Stack key={group.title} spacing={1}>
                    <Box>
                      <Typography variant="subtitle2">{group.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{group.description}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {group.objects.map((object) => (
                        <Tooltip
                          key={object.kind === 'insert' ? object.type : object.preset.id}
                          title={object.kind === 'insert' ? `Insert ${object.label}` : `Insert ${object.label} preset`}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            aria-label={`Insert ${object.label}`}
                            onClick={() => object.kind === 'insert' ? insertObject(object.type) : insertPreset(object.preset)}
                          >
                            + {object.label}
                          </Button>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Stack>
                ))}
                {relationshipComposer && (
                  <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="subtitle2">
                          {relationshipComposer === 'link' ? 'Connection endpoints' : 'Path sequence'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {relationshipComposer === 'link'
                            ? 'Choose source and target nodes.'
                            : 'Choose source, optional transit nodes, and target.'}
                        </Typography>
                      </Box>
                      <Button size="small" onClick={() => setRelationshipComposer(undefined)}>Close</Button>
                    </Stack>

                    {relationshipComposer === 'link' ? (
                      <Stack spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="connection-source-label">Connection source</InputLabel>
                          <Select labelId="connection-source-label" label="Connection source" value={linkSourceId} onChange={(event) => setLinkSourceId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel id="connection-target-label">Connection target</InputLabel>
                          <Select labelId="connection-target-label" label="Connection target" value={linkTargetId} onChange={(event) => setLinkTargetId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={hasErrors || !linkSourceId || !linkTargetId || linkSourceId === linkTargetId}
                          onClick={createConnection}
                        >
                          Create connection
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="path-source-label">Path source</InputLabel>
                          <Select labelId="path-source-label" label="Path source" value={pathSourceId} onChange={(event) => setPathSourceId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <FormControl fullWidth size="small">
                            <InputLabel id="path-transit-label">Add transit node</InputLabel>
                            <Select labelId="path-transit-label" label="Add transit node" value={pathTransitCandidate} onChange={(event) => setPathTransitCandidate(String(event.target.value))}>
                              {pathTransitOptions.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                            </Select>
                          </FormControl>
                          <Button size="small" disabled={!pathTransitCandidate} onClick={addPathTransitNode}>Add</Button>
                        </Stack>
                        {pathTransitIds.map((nodeId, index) => (
                          <Stack key={nodeId} className="topoviewer-vscode-transit-row" direction="row" spacing={0.5}>
                            <Typography variant="caption">{nodeNameById.get(nodeId) || nodeId}</Typography>
                            <Button size="small" disabled={index === 0} onClick={() => movePathTransitNode(index, -1)}>Up</Button>
                            <Button size="small" disabled={index === pathTransitIds.length - 1} onClick={() => movePathTransitNode(index, 1)}>Down</Button>
                            <Button size="small" onClick={() => removePathTransitNode(nodeId)}>Remove</Button>
                          </Stack>
                        ))}
                        <FormControl fullWidth size="small">
                          <InputLabel id="path-target-label">Path target</InputLabel>
                          <Select labelId="path-target-label" label="Path target" value={pathTargetId} onChange={(event) => setPathTargetId(String(event.target.value))}>
                            {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={hasErrors || !pathSourceId || !pathTargetId || pathSourceId === pathTargetId}
                          onClick={createPath}
                        >
                          Create path
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                )}
              </Stack>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('inspect')} className="topoviewer-vscode-mode-pane topoviewer-vscode-inspector-pane">
              {!selectedPrimary ? (
                <Stack className="topoviewer-vscode-empty-state" spacing={1}>
                  <Typography variant="subtitle2">Select a canvas object</Typography>
                  <Typography variant="body2" color="text.secondary">Properties and style controls will appear here.</Typography>
                </Stack>
              ) : (
                <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={1}>
                  <TextField
                    size="small"
                    label="Object name"
                    value={`${selectedPrimary.kind}:${selectedPrimary.id}`}
                    slotProps={{ input: { readOnly: true } }}
                  />
                  <TextField size="small" label="Display name" value={inspectorName} onChange={(event) => setInspectorName(event.target.value)} />
                  <FormControl size="small">
                    <InputLabel id="inspector-layer-label">Layer</InputLabel>
                    <Select labelId="inspector-layer-label" label="Layer" value={inspectorLayerId} onChange={(event) => setInspectorLayerId(String(event.target.value))}>
                      {validation.layers.map((layer) => <MenuItem key={layer.id} value={layer.id}>{layer.name || layer.id}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {selectedPrimary.kind === 'link' && (
                    <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                      <Typography variant="subtitle2">Link endpoints</Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id="link-source-label">Link source</InputLabel>
                        <Select labelId="link-source-label" label="Link source" value={linkSourceId} onChange={(event) => setLinkSourceId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="link-target-label">Link target</InputLabel>
                        <Select labelId="link-target-label" label="Link target" value={linkTargetId} onChange={(event) => setLinkTargetId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        disabled={hasErrors || !linkSourceId || !linkTargetId || linkSourceId === linkTargetId}
                        onClick={applyRelationshipInspector}
                      >
                        Apply relationship
                      </Button>
                    </Stack>
                  )}
                  {selectedPrimary.kind === 'path' && (
                    <Stack className="topoviewer-vscode-relationship-composer" spacing={1}>
                      <Typography variant="subtitle2">Path sequence</Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel id="inspector-path-source-label">Path source</InputLabel>
                        <Select labelId="inspector-path-source-label" label="Path source" value={pathSourceId} onChange={(event) => setPathSourceId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1}>
                        <FormControl fullWidth size="small">
                          <InputLabel id="inspector-path-transit-label">Add transit node</InputLabel>
                          <Select labelId="inspector-path-transit-label" label="Add transit node" value={pathTransitCandidate} onChange={(event) => setPathTransitCandidate(String(event.target.value))}>
                            {pathTransitOptions.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <Button size="small" disabled={!pathTransitCandidate} onClick={addPathTransitNode}>Add</Button>
                      </Stack>
                      {pathTransitIds.map((nodeId, index) => (
                        <Stack key={nodeId} className="topoviewer-vscode-transit-row" direction="row" spacing={0.5}>
                          <Typography variant="caption">{nodeNameById.get(nodeId) || nodeId}</Typography>
                          <Button size="small" disabled={index === 0} onClick={() => movePathTransitNode(index, -1)}>Up</Button>
                          <Button size="small" disabled={index === pathTransitIds.length - 1} onClick={() => movePathTransitNode(index, 1)}>Down</Button>
                          <Button size="small" onClick={() => removePathTransitNode(nodeId)}>Remove</Button>
                        </Stack>
                      ))}
                      <FormControl fullWidth size="small">
                        <InputLabel id="inspector-path-target-label">Path target</InputLabel>
                        <Select labelId="inspector-path-target-label" label="Path target" value={pathTargetId} onChange={(event) => setPathTargetId(String(event.target.value))}>
                          {graphNodes.map((node) => <MenuItem key={node.id} value={node.id}>{nodeNameById.get(node.id)}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <Button
                        size="small"
                        disabled={hasErrors || !pathSourceId || !pathTargetId || pathSourceId === pathTargetId}
                        onClick={applyRelationshipInspector}
                      >
                        Apply relationship
                      </Button>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" label="X" value={inspectorX} onChange={(event) => setInspectorX(event.target.value)} />
                    <TextField size="small" label="Y" value={inspectorY} onChange={(event) => setInspectorY(event.target.value)} />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Labels</Typography>
                    {labelRows.map((row, index) => (
                      <Stack key={row.id} className="topoviewer-vscode-key-value-row" direction="row" spacing={1} data-label-row-key={row.key}>
                        <TextField size="small" label="Label key" value={row.key} onChange={(event) => updateKeyValueRow('labels', row.id, { key: event.target.value })} />
                        <TextField size="small" label="Label value" value={row.value} onChange={(event) => updateKeyValueRow('labels', row.id, { value: event.target.value })} />
                        <Button size="small" disabled={labelRows.length === 1 && index === 0 && !row.key} onClick={() => removeKeyValueRow('labels', row.id)}>Remove</Button>
                      </Stack>
                    ))}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => addKeyValueRow('labels')}>Add label row</Button>
                      <Button size="small" onClick={() => applyKeyValueRows('labels')}>Apply labels</Button>
                    </Stack>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Data</Typography>
                    {dataRows.map((row, index) => (
                      <Stack key={row.id} className="topoviewer-vscode-key-value-row" direction="row" spacing={1} data-data-row-key={row.key}>
                        <TextField size="small" label="Data key" value={row.key} onChange={(event) => updateKeyValueRow('data', row.id, { key: event.target.value })} />
                        <TextField size="small" label="Data value" value={row.value} onChange={(event) => updateKeyValueRow('data', row.id, { value: event.target.value })} />
                        <Button size="small" disabled={dataRows.length === 1 && index === 0 && !row.key} onClick={() => removeKeyValueRow('data', row.id)}>Remove</Button>
                      </Stack>
                    ))}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => addKeyValueRow('data')}>Add data row</Button>
                      <Button size="small" onClick={() => applyKeyValueRows('data')}>Apply data</Button>
                    </Stack>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Style</Typography>
                    {styleRows.map((row, index) => {
                      const valueDefinition = selectedPrimary
                        ? styleValueDefinitionForKey(selectedPrimary.kind, row.key)
                        : { dataType: 'text' as const };
                      const keyLabelId = `inspector-style-key-${row.id}`;
                      return (
                        <Stack key={row.id} className="topoviewer-vscode-style-row" direction="row" spacing={1} data-style-row-key={row.key}>
                          <FormControl fullWidth size="small">
                            <InputLabel id={keyLabelId}>Style key</InputLabel>
                            <Select
                              labelId={keyLabelId}
                              label="Style key"
                              value={row.key}
                              onChange={(event) => updateStyleRowKey(row.id, String(event.target.value))}
                            >
                              {availableStyleOptionGroups.flatMap(([group, options]) => [
                                <ListSubheader key={`${group}-header`}>{group}</ListSubheader>,
                                ...options.map((option) => (
                                  <MenuItem key={option.key} value={option.key}>{option.label}</MenuItem>
                                ))
                              ])}
                            </Select>
                          </FormControl>
                          {renderStyleValueInput(row, valueDefinition)}
                          <Chip size="small" label={row.source} variant={row.source === 'inline' ? 'filled' : 'outlined'} />
                          <Button
                            size="small"
                            aria-label={`Reset ${styleOptionLabel(selectedPrimary.kind, row.key)} style override`}
                            disabled={row.source !== 'inline' && row.value === row.originalValue}
                            onClick={() => resetStyleRow(row)}
                          >
                            Reset
                          </Button>
                          <Button size="small" disabled={styleRows.length === 1 && index === 0 && !selectedPrimaryObject?.style} onClick={() => removeStyleRow(row.id)}>Remove</Button>
                        </Stack>
                      );
                    })}
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={addStyleRow}>Add style row</Button>
                      <Button size="small" onClick={applyStyleRows}>Apply styles</Button>
                    </Stack>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Preset</Typography>
                    <TextField fullWidth size="small" label="Preset name" value={presetName} onChange={(event) => setPresetName(event.target.value)} />
                    <Button size="small" onClick={saveSelectionAsPreset}>Save as preset</Button>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={applyInspector}>Apply properties</Button>
                    <Button size="small" color="error" onClick={deleteSelection}>Delete</Button>
                  </Stack>
                </Stack>
              )}
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('yaml')} className="topoviewer-vscode-mode-pane topoviewer-vscode-yaml-pane">
              <Tabs value={tab} onChange={(_event, next) => setTab(next)} variant="fullWidth" className="topoviewer-vscode-yaml-tabs">
                <Tab label="Topology YAML" />
                <Tab label="Stylesheet YAML" />
              </Tabs>
              <Box className="topoviewer-vscode-editor">
                <Tooltip title={`Copy ${editorLabel}`}>
                  <IconButton
                    aria-label={`Copy ${editorLabel}`}
                    className="topoviewer-vscode-yaml-copy"
                    size="small"
                    onClick={copyYamlToClipboard}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Editor
                  height="100%"
                  language="yaml"
                  theme={editorTheme}
                  value={editorValue}
                  onMount={handleEditorMount}
                  onChange={(value) => setState((current) => current
                    ? (tab === 0 ? { ...current, topologyText: value || '' } : { ...current, stylesheetText: value || '' })
                    : current)}
                  options={{
                    automaticLayout: true,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    glyphMargin: true,
                    minimap: { enabled: false },
                    padding: { top: 40 },
                    renderLineHighlight: 'gutter',
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    wordWrap: 'off',
                    scrollbar: {
                      horizontal: 'auto',
                      vertical: 'auto',
                      useShadows: true
                    }
                  }}
                />
              </Box>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('attention')} className="topoviewer-vscode-mode-pane topoviewer-vscode-attention-pane">
              <Stack className="topoviewer-vscode-mode-pane-scroll" spacing={1}>
                <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                  <Chip size="small" label={attentionSummary} />
                </Stack>

                <Accordion className="topoviewer-vscode-attention-section" defaultExpanded disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Object focus</Typography>
                      <Typography variant="caption" color="text.secondary">Pick one object to keep prominent.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-focus-kind">Focus</InputLabel>
                        <Select labelId="attention-focus-kind" label="Focus" value={attentionFocusKind} onChange={(event) => {
                          setAttentionFocusKind(event.target.value as AttentionFocusKind);
                          setAttentionFocusId('');
                        }}>
                        {(['nodeIds', 'linkIds', 'pathIds', 'regionIds'] as AttentionFocusKind[]).map((kind) => (
                          <MenuItem key={kind} value={kind}>{focusKindLabel(kind)}</MenuItem>
                        ))}
                        </Select>
                        <FormHelperText>Choose the object type. This decides which ID list is available.</FormHelperText>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-focus-id">Object</InputLabel>
                        <Select labelId="attention-focus-id" label="Object" value={attentionFocusId} onChange={(event) => setAttentionFocusId(String(event.target.value))}>
                        {availableFocusIds.map((id) => <MenuItem key={id} value={id}>{id}</MenuItem>)}
                        </Select>
                        <FormHelperText>Pick the object ID to emphasize in the canvas.</FormHelperText>
                      </FormControl>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-mode">Mode</InputLabel>
                        <Select labelId="attention-mode" label="Mode" value={attentionMode} onChange={(event) => setAttentionMode(String(event.target.value))}>
                        <MenuItem value="dim-context">Dim</MenuItem>
                        <MenuItem value="hide-context">Hide</MenuItem>
                        </Select>
                        <FormHelperText>Dim keeps context visible. Hide removes non-matching objects.</FormHelperText>
                      </FormControl>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <Button size="small" variant="contained" disabled={hasErrors || !attentionFocusId} onClick={() => applyAttentionFocus()}>Apply focus</Button>
                        <Button size="small" disabled={hasErrors || !selectedObjects.length} onClick={useSelectionForAttention}>Use selection</Button>
                        <Button size="small" disabled={hasErrors || !currentAttention} onClick={resetAttention}>Clear</Button>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Match by metadata</Typography>
                      <Typography variant="caption" color="text.secondary">Focus every object with a matching label or data value.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Label key"
                        helperText="Topology label name, for example role."
                        value={attentionLabelKey}
                        onChange={(event) => setAttentionLabelKey(event.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        helperText="Label value to match, for example pe."
                        value={attentionLabelValue}
                        onChange={(event) => setAttentionLabelValue(event.target.value)}
                      />
                      <Button
                        size="small"
                        aria-label="Apply attention label focus"
                        disabled={hasErrors || !attentionLabelKey.trim()}
                        onClick={() => applyAttentionMatcher('labels')}
                      >
                        Focus matching labels
                      </Button>
                      <TextField
                        fullWidth
                        size="small"
                        label="Data key"
                        helperText="Operational data key, for example severity."
                        value={attentionDataKey}
                        onChange={(event) => setAttentionDataKey(event.target.value)}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        helperText="Data value to match, for example major."
                        value={attentionDataValue}
                        onChange={(event) => setAttentionDataValue(event.target.value)}
                      />
                      <Button
                        size="small"
                        aria-label="Apply attention data focus"
                        disabled={hasErrors || !attentionDataKey.trim()}
                        onClick={() => applyAttentionMatcher('data')}
                      >
                        Focus matching data
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Click behavior</Typography>
                      <Typography variant="caption" color="text.secondary">Let canvas clicks change attention focus.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={attentionInteractive} onChange={(_event, checked) => setAttentionInteractive(checked)} />}
                        label="Interactive"
                      />
                      <FormHelperText>When enabled, object clicks update focus without editing YAML by hand.</FormHelperText>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-click-mode">Click mode</InputLabel>
                        <Select labelId="attention-click-mode" label="Click mode" value={attentionClickMode} onChange={(event) => setAttentionClickMode(String(event.target.value))}>
                        <MenuItem value="dim-context">Dim</MenuItem>
                        <MenuItem value="hide-context">Hide</MenuItem>
                        </Select>
                        <FormHelperText>Controls what happens to non-clicked context after a canvas click.</FormHelperText>
                      </FormControl>
                      <Button size="small" disabled={hasErrors} onClick={applyInteraction}>Apply click behavior</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion className="topoviewer-vscode-attention-section" disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Stack spacing={0.25}>
                      <Typography variant="subtitle2">Dense summaries</Typography>
                      <Typography variant="caption" color="text.secondary">Collapse busy regions or group parallel links.</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="attention-region">Region</InputLabel>
                        <Select labelId="attention-region" label="Region" value={attentionRegionId} onChange={(event) => setAttentionRegionId(String(event.target.value))}>
                        {(visibleDocument?.graph?.regions || []).map((region) => <MenuItem key={region.id} value={region.id}>{region.name || region.id}</MenuItem>)}
                        </Select>
                        <FormHelperText>Choose a region whose members should collapse into a summary.</FormHelperText>
                      </FormControl>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={attentionExpandOnClick} onChange={(_event, checked) => setAttentionExpandOnClick(checked)} />}
                        label="Expand on click"
                      />
                      <Button size="small" disabled={hasErrors} onClick={applyAggregation}>Aggregate region</Button>
                      <TextField
                        fullWidth
                        size="small"
                        label="Link threshold"
                        helperText="Minimum parallel links before grouping. Use 2 or higher."
                        value={linkGroupingThreshold}
                        onChange={(event) => setLinkGroupingThreshold(event.target.value)}
                      />
                      <Button size="small" disabled={hasErrors} onClick={applyLinkGrouping}>Group links</Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Stack>
            </HarnessTabPanel>

            <HarnessTabPanel value={activeModeIndex} index={modeIndex('layers')} className="topoviewer-vscode-mode-pane topoviewer-vscode-layers-pane">
              <Stack className="topoviewer-vscode-layer-list">
                {validation.layers.map((layer) => (
                  <FormControlLabel
                    key={layer.id}
                    control={(
                      <Checkbox
                        checked={selectedLayerIds.includes(layer.id)}
                        slotProps={{ input: { 'aria-label': layer.name || layer.id } }}
                        onChange={(_event, checked) => {
                          setSelectedLayerIds((current) => checked
                            ? [...new Set([...current, layer.id])]
                            : current.filter((id) => id !== layer.id));
                        }}
                      />
                    )}
                    label={(
                      <Box component="span" className="topoviewer-vscode-layer-label">
                        <span>{layer.name || layer.id}</span>
                        <Chip component="span" size="small" className="topoviewer-vscode-layer-count" label={layer.objectCount} />
                      </Box>
                    )}
                  />
                ))}
              </Stack>
            </HarnessTabPanel>

          </Paper>
        </Box>

        <Box
          className="topoviewer-vscode-divider"
          role="separator"
          aria-label="Resize authoring column and canvas"
          aria-orientation="vertical"
          aria-valuemin={minSplitPercent}
          aria-valuemax={maxSplitPercent}
          aria-valuenow={Math.round(splitPercent)}
          tabIndex={0}
          onPointerDown={(event) => {
            if (event.detail > 1) return;
            event.preventDefault();
            setResizing(true);
            updateSplitFromClientX(event.clientX);
          }}
          onClick={(event) => {
            if (event.detail === 2) setSplitPercent(defaultSplitPercent);
          }}
          onDoubleClick={() => setSplitPercent(defaultSplitPercent)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') setSplitPercent((current) => clamp(current - 2, minSplitPercent, maxSplitPercent));
            if (event.key === 'ArrowRight') setSplitPercent((current) => clamp(current + 2, minSplitPercent, maxSplitPercent));
            if (event.key === 'Home') setSplitPercent(defaultSplitPercent);
          }}
        />

        <Paper className="topoviewer-vscode-preview" elevation={0}>
          <Box className="topoviewer-vscode-preview-actions">
            <Button size="small" startIcon={<RefreshIcon />} onClick={() => state && setState({ ...state })}>Validate</Button>
            <Button size="small" disabled={!undoStack.length} onClick={undoTopology}>Undo</Button>
            <Button size="small" disabled={!redoStack.length} onClick={redoTopology}>Redo</Button>
            <Button size="small" startIcon={<OpenInNewIcon />} onClick={() => host.openDocs('topoviewer/integration-roadmap/')}>Docs</Button>
            <Button size="small" variant="contained" startIcon={<PhotoCameraIcon />} onClick={exportImage}>Export</Button>
          </Box>
          {loading && <CircularProgress />}
          {!loading && hasErrors && <Alert severity="error">Fix diagnostics before the preview can render.</Alert>}
          {!loading && !hasErrors && visibleDocument && (
            <TopoViewer
              document={visibleDocument}
              selectedLayerIds={selectedLayerIds}
              selectedObjectIds={selectedObjectIds(selectedObjects)}
              toggles={{ showRegions: true }}
              onObjectClick={handleObjectClick}
              onPaneClick={() => setSelectedObjects([])}
              onNodePositionChange={handleNodePositionChange}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
