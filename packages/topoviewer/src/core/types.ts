import type { ComponentType, CSSProperties } from 'react';
import type {
  AggregateGroupDefinition,
  AttentionPresentationResult,
  AttentionViewportPolicy,
  FocusQuery,
  LinkGroupingOptions
} from './attention/types';
import type { NodeShapeName } from './nodeShapes';

export type Scalar = string | number | boolean;
export type Labels = Record<string, Scalar>;
export type DataBag = Record<string, unknown>;
export type PositionTuple = [number, number];

export interface LayerDefinition {
  id: string;
  name?: string;
}

export interface GraphEntity {
  id: string;
  name?: string;
  label?: string;
  labels?: Labels;
  data?: DataBag;
  layers?: string[];
  style?: StyleDeclaration;
  icon?: string;
}

export interface GraphNode extends GraphEntity {
  position?: PositionTuple | { x: number; y: number };
  parent?: string;
  pins?: DiagramPin[];
}

export interface GraphLink extends GraphEntity {
  source: string;
  target: string;
  parent?: string;
}

export interface GraphPath extends GraphEntity {
  sequence?: string[];
  source?: string;
  target?: string;
  parent?: string;
}

export interface GraphRegion extends GraphEntity {
  members?: string[];
  parent?: string;
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  headerPadding?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  minWidth?: number;
  minHeight?: number;
  parentPadding?: number;
  parentPaddingX?: number;
  parentPaddingY?: number;
}

export interface DiagramPin {
  id: string;
  position?: PositionTuple | { x: number; y: number };
  x?: number;
  y?: number;
}

export const GEOMETRY_SHAPES = [
  'circle',
  'triangle',
  'square',
  'rectangle',
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
] as const;

export type GeometryShape = typeof GEOMETRY_SHAPES[number];

export interface DiagramShape extends GraphEntity {
  type?: GeometryShape;
  position?: PositionTuple | { x: number; y: number };
  size?: PositionTuple | { width: number; height: number };
  rotation?: number;
  locked?: boolean;
  pins?: DiagramPin[];
}

export interface DiagramConnector extends GraphEntity {
  source?: string;
  target?: string;
  sourcePin?: string;
  targetPin?: string;
  sourcePosition?: PositionTuple | { x: number; y: number };
  targetPosition?: PositionTuple | { x: number; y: number };
}

export interface DiagramCallout extends GraphEntity {
  position?: PositionTuple | { x: number; y: number };
  size?: PositionTuple | { width: number; height: number };
  title?: string;
  body?: string | string[];
  markdown?: string | string[];
  align?: 'left' | 'center' | 'right';
  source?: string;
  sourcePosition?: PositionTuple | { x: number; y: number };
  target?: string;
  targetPin?: string;
  targetPosition?: PositionTuple | { x: number; y: number };
  sourcePin?: string;
  leader?: StyleDeclaration;
  locked?: boolean;
  pins?: DiagramPin[];
}

export interface DiagramDefinition {
  shapes?: DiagramShape[];
  /** @deprecated Use diagram.callouts with target/source pins for new authoring. */
  connectors?: DiagramConnector[];
  callouts?: DiagramCallout[];
}

export interface ToggleDefinition {
  id: string;
  name?: string;
  default?: boolean;
}

export interface LayoutConfig {
  mode?: 'manual' | 'force';
  width?: number;
  height?: number;
  iterations?: number;
  linkDistance?: number;
  chargeStrength?: number;
  collideRadius?: number;
  centerStrength?: number;
}

export interface RendererLimits {
  maxNodes?: number;
  maxEdges?: number;
  maxPathSegments?: number;
  maxLabels?: number;
  maxCallouts?: number;
  maxShapes?: number;
  maxImageBytes?: number;
}

export interface TopoDocumentAttention {
  query?: FocusQuery;
  interactive?: boolean;
  clickMode?: FocusQuery['mode'];
  aggregate?: {
    groups?: AggregateGroupDefinition[];
    expandedGroupIds?: string[];
    expandOnClick?: boolean;
    viewport?: AttentionViewportPolicy;
  };
  links?: {
    grouping?: LinkGroupingOptions;
  };
}

export interface GraphDefinition {
  id?: string;
  layers?: LayerDefinition[];
  nodes?: GraphNode[];
  links?: GraphLink[];
  paths?: GraphPath[];
  regions?: GraphRegion[];
}

export interface TopologyDocument {
  version?: string;
  graph?: GraphDefinition;
  diagram?: DiagramDefinition;
  toggles?: ToggleDefinition[];
  layout?: LayoutConfig;
  limits?: RendererLimits;
  attention?: TopoDocumentAttention;
}

export interface IconSpec {
  glyph?: string;
  fill?: string;
  stroke?: string;
  svg?: string;
  src?: string;
  alt?: string;
}

export interface StyleRule {
  selector: string;
  style?: StyleDeclaration;
}

export type StyleDeclaration = Record<string, unknown>;

export interface StylesheetDocument {
  version?: string;
  icons?: Record<string, IconSpec>;
  labelFields?: string[];
  layout?: LayoutConfig;
  limits?: RendererLimits;
  stylesheet?: StyleRule[];
}

export type TopoDocument = TopologyDocument & StylesheetDocument;

export interface TopoViewerToggles {
  showRegions?: boolean;
  showChildNodesInsideParents?: boolean;
  showServicesInsideNodes?: boolean;
  showEdgeLabels?: boolean;
  [key: string]: boolean | undefined;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompiledNodeData extends GraphNode {
  iconSpec?: IconSpec;
  edgeAnchor?: Bounds;
  nodeStyle?: CSSProperties;
  iconStyle?: CSSProperties;
  iconContentStyle?: CSSProperties;
  iconImageStyle?: CSSProperties;
  nodeShapeType?: NodeShapeName;
  nodeShapePoints?: string;
  nodeShapeStyle?: CSSProperties;
  nodeOutlineStyle?: CSSProperties;
  nodeUnderlayStyle?: CSSProperties;
  labelHtml?: string;
  labelStyle?: CSSProperties;
  labelPosition?: string;
  labelMinZoom?: number;
  metaStyle?: CSSProperties;
  badgeLabel?: string;
  badgePosition?: string;
  badgeStyle?: CSSProperties;
  statusPlacement?: string;
  statusStyle?: CSSProperties;
  containedChildCount?: number;
  isContainedChild?: boolean;
  fill?: string;
  stroke?: string;
  borderWidth?: number;
  borderRadius?: number | string;
  shapeType?: string;
  rotation?: number;
  title?: string;
  body?: string[];
  shapeStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  bodyHtml?: string;
  attentionState?: string;
  attentionScore?: number;
  attentionReasons?: readonly string[];
  attentionLabelPriority?: string;
}

export interface CompiledGraph {
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
  selectedLayerIds: string[];
}

export interface TopoViewerExtensionContext {
  document: TopoDocument;
  selectedLayerIds: string[];
  toggles: TopoViewerToggles;
}

export interface TopoViewerExtension {
  name: string;
  nodeTypes?: Record<string, ComponentType<any>>;
  edgeTypes?: Record<string, ComponentType<any>>;
  beforeCompile?: (document: TopoDocument, context: TopoViewerExtensionContext) => TopoDocument;
  afterCompile?: (graph: CompiledGraph, context: TopoViewerExtensionContext) => CompiledGraph;
  toolbarActions?: unknown[];
}

export interface TopoViewerObjectClick {
  id: string;
  runtimeId: string;
  element: 'node' | 'edge';
  data: Record<string, unknown>;
  modifiers?: {
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  };
}

export interface TopoViewerViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface TopoViewerProps {
  document: TopoDocument;
  selectedLayerIds?: string[];
  selectedObjectIds?: string[];
  toggles?: TopoViewerToggles;
  layout?: LayoutConfig;
  attention?: {
    query?: FocusQuery;
    presentation?: AttentionPresentationResult;
  };
  extensions?: TopoViewerExtension[];
  controlPanelToggle?: {
    enabled?: boolean;
    open?: boolean;
    onToggle?: () => void;
  };
  onObjectClick?: (object: TopoViewerObjectClick) => void;
  onPaneClick?: () => void;
  onViewportChange?: (viewport: TopoViewerViewport) => void;
  className?: string;
  style?: CSSProperties;
}
