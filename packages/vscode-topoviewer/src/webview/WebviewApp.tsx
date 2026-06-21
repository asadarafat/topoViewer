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
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightModeIcon from '@mui/icons-material/LightMode';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TopoViewer, type TopoDocument, type TopoViewerObjectClick } from 'topoviewer';
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
  updateAttentionFocus,
  updateAttentionInteraction,
  updateAttentionLinkGrouping,
  updateAttentionMatcher,
  updateAttentionRegionAggregation,
  updateTopoObject,
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
  const [labelKey, setLabelKey] = useState('');
  const [labelValue, setLabelValue] = useState('');
  const [dataKey, setDataKey] = useState('');
  const [dataValue, setDataValue] = useState('');
  const [styleKey, setStyleKey] = useState('');
  const [styleValue, setStyleValue] = useState('');
  const [presetName, setPresetName] = useState('');
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
  const hasErrors = validation.diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  const diagnosticSeverity: 'success' | 'warning' | 'error' = hasErrors ? 'error' : validation.diagnostics.length > 0 ? 'warning' : 'success';
  const diagnosticSummary = validation.diagnostics.length === 0
    ? 'No diagnostics'
    : `${validation.diagnostics.length} diagnostic${validation.diagnostics.length === 1 ? '' : 's'}: ${validation.diagnostics[0]?.code}`;
  const shellClassName = `topoviewer-vscode-shell${themeMode ? ` topoviewer-vscode-shell--${themeMode}` : ''}`;
  const nextThemeMode = themeMode === 'dark' ? 'light' : 'dark';
  const editorTheme = themeMode === 'light' ? 'light' : 'vs-dark';
  const editorValue = tab === 0 ? state?.topologyText || '' : state?.stylesheetText || '';
  const selectedPrimary = selectedObjects[0];
  const selectedPrimaryObject = useMemo(() => findObject(visibleDocument, selectedPrimary), [selectedPrimary, visibleDocument]);
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
  const activeModeIndex = modeIndex(mode);
  const availableStyleOptions = selectedPrimary ? styleOptionsByKind[selectedPrimary.kind] : [];
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
      return;
    }
    setInspectorName(selectedPrimaryObject.name || '');
    setInspectorLayerId(selectedPrimaryObject.layers?.[0] || defaultLayerId(visibleDocument, selectedLayerIds));
    setPresetName(`${selectedPrimaryObject.name || selectedPrimaryObject.label || selectedPrimary.id} preset`);
    setStyleKey((current) => styleOptionsByKind[selectedPrimary.kind].some((option) => option.key === current)
      ? current
      : styleOptionsByKind[selectedPrimary.kind][0]?.key || '');
    const position = Array.isArray(selectedPrimaryObject.position)
      ? { x: selectedPrimaryObject.position[0], y: selectedPrimaryObject.position[1] }
      : selectedPrimaryObject.position;
    setInspectorX(position?.x !== undefined ? String(position.x) : '');
    setInspectorY(position?.y !== undefined ? String(position.y) : '');
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

  async function exportImage() {
    await host.exportImage();
    flash('Export command sent');
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
  }

  function insertObject(type: InsertObjectType) {
    setTab(0);
    applyTopologyTransaction(`Insert ${type}`, (topologyText) => insertTopoObject(topologyText, {
      type,
      selectedLayerIds,
      selectedObjects
    }));
  }

  function insertPreset(preset: TopoObjectPreset) {
    setTab(0);
    applyTopologyTransaction(`Insert preset ${preset.name}`, (topologyText) => insertTopoPreset(topologyText, {
      preset,
      selectedLayerIds,
      selectedObjects
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

  function applyKeyValue(kind: 'labels' | 'data' | 'style') {
    if (!selectedPrimary) return;
    const key = kind === 'labels' ? labelKey.trim() : kind === 'data' ? dataKey.trim() : styleKey.trim();
    const value = kind === 'labels' ? labelValue.trim() : kind === 'data' ? dataValue.trim() : styleValue.trim();
    if (!key) return;
    setTab(0);
    applyTopologyTransaction(`Update ${kind}`, (topologyText) => updateTopoObject(topologyText, {
      selection: selectedPrimary,
      ...(kind === 'labels'
        ? { labels: { [key]: value } }
        : kind === 'data'
          ? { data: { [key]: value } }
          : { style: { [key]: value } })
    }));
    if (kind === 'labels') {
      setLabelKey('');
      setLabelValue('');
    } else if (kind === 'data') {
      setDataKey('');
      setDataValue('');
    } else {
      setStyleValue('');
    }
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

      {message && <Alert severity={message.toLowerCase().includes('requires') || message.toLowerCase().includes('must') ? 'warning' : 'success'} className="topoviewer-vscode-message">{message}</Alert>}

      <Box
        ref={workspaceRef}
        className={`topoviewer-vscode-workspace${resizing ? ' topoviewer-vscode-workspace--resizing' : ''}`}
        style={{ '--topoviewer-vscode-rail-width': `${splitPercent}%` } as CSSProperties}
      >
        <Box className="topoviewer-vscode-rail">
          <Paper className={`topoviewer-vscode-source topoviewer-vscode-source--${mode}`} elevation={0}>
            {host.kind === 'browser' && (
              <FormControl size="small" className="topoviewer-vscode-fixture">
                <InputLabel id="fixture-label" shrink>Fixture</InputLabel>
                <Select
                  labelId="fixture-label"
                  label="Fixture"
                  notched
                  value={state?.fixtureId || ''}
                  onChange={(event) => reloadFixture(String(event.target.value))}
                >
                  {fixtures.map((fixture) => (
                    <MenuItem key={fixture.id} value={fixture.id}>{fixture.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Alert severity={diagnosticSeverity} className="topoviewer-vscode-diagnostic-strip">
              <Typography variant="caption">{diagnosticSummary}</Typography>
            </Alert>
            {selectedObjects.length > 0 && (
              <Typography className="topoviewer-vscode-selection-summary" variant="caption">{selectionSummary(selectedObjects)}</Typography>
            )}

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
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" label="X" value={inspectorX} onChange={(event) => setInspectorX(event.target.value)} />
                    <TextField size="small" label="Y" value={inspectorY} onChange={(event) => setInspectorY(event.target.value)} />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" label="Label key" value={labelKey} onChange={(event) => setLabelKey(event.target.value)} />
                    <TextField size="small" label="Value" value={labelValue} onChange={(event) => setLabelValue(event.target.value)} />
                    <Button size="small" onClick={() => applyKeyValue('labels')}>Add</Button>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField size="small" label="Data key" value={dataKey} onChange={(event) => setDataKey(event.target.value)} />
                    <TextField size="small" label="Value" value={dataValue} onChange={(event) => setDataValue(event.target.value)} />
                    <Button size="small" onClick={() => applyKeyValue('data')}>Add</Button>
                  </Stack>
                  <Stack spacing={1}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="inspector-style-key-label">Style key</InputLabel>
                      <Select
                        labelId="inspector-style-key-label"
                        label="Style key"
                        value={styleKey}
                        onChange={(event) => setStyleKey(String(event.target.value))}
                      >
                        {availableStyleOptions.map((option) => (
                          <MenuItem key={option.key} value={option.key}>{option.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField fullWidth size="small" label="Style value" value={styleValue} onChange={(event) => setStyleValue(event.target.value)} />
                    <Button size="small" onClick={() => applyKeyValue('style')}>Add style</Button>
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
                <Editor
                  height="100%"
                  language="yaml"
                  theme={editorTheme}
                  value={editorValue}
                  onChange={(value) => setState((current) => current
                    ? (tab === 0 ? { ...current, topologyText: value || '' } : { ...current, stylesheetText: value || '' })
                    : current)}
                  options={{
                    automaticLayout: true,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    minimap: { enabled: false },
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
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
