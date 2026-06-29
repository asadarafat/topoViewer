import type { StyleDeclaration } from 'topoviewer';

export type MapperTargetKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'layer' | 'graph';
export type MapperResolverMode = 'id' | 'label' | 'data' | 'endpoint' | 'selector' | 'aggregate' | 'staticObjectIds';
export type MapperSeverityDirection = 'above' | 'below';
export type MapperSeverityName = 'success' | 'info' | 'warning' | 'error';
export type MapperConditionScalar = string | number | boolean;

export interface MapperSeverityColor {
  color?: string;
  accent?: string;
}

export type MapperSeverityPalette = Partial<Record<MapperSeverityName, string | MapperSeverityColor>>;

export interface TopoViewerMapper {
  version: 1;
  identity?: {
    sourceId?: string;
    sourceIdLabel?: string;
  };
  palette?: MapperSeverityPalette;
  mappings: MapperRule[];
}

export interface MapperRule {
  id: string;
  metric: string;
  target: MapperTarget;
  value?: MapperValueSelector;
  thresholds?: MapperThresholds;
  overlay?: MapperOverlayPolicy;
  conditions?: MapperConditionalStyle[];
}

export interface MapperTarget {
  kind: MapperTargetKind;
  resolve: MapperResolver;
}

export interface MapperResolver {
  by: MapperResolverMode;
  metricLabel?: string;
  linkMetricLabel?: string;
  directionMetricLabel?: string;
  key?: string;
  sourceLabel?: string;
  targetLabel?: string;
  selector?: string;
  objectIds?: string[];
}

export interface MapperValueSelector {
  field?: string;
  as?: string;
}

export interface MapperThresholds {
  info?: number;
  warning?: number;
  error?: number;
  direction?: MapperSeverityDirection;
}

export interface MapperOverlayPolicy {
  lineColorBySeverity?: boolean;
  lineWidthBySeverity?: boolean;
  sourceArrowColorBySeverity?: boolean;
  targetArrowColorBySeverity?: boolean;
  outlineBySeverity?: boolean;
  statusMarker?: boolean;
  backgroundColorBySeverity?: boolean;
  borderColorBySeverity?: boolean;
  badgeLabel?: string;
  label?: string;
  propagateToLayerMembers?: boolean;
  style?: StyleDeclaration;
}

export interface MapperScalarCondition {
  contains?: string;
  eq?: MapperConditionScalar;
  exists?: boolean;
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
  ne?: MapperConditionScalar;
}

export interface MapperKeyedCondition extends MapperScalarCondition {
  key: string;
}

export interface MapperCondition {
  field?: MapperKeyedCondition;
  label?: MapperKeyedCondition;
  severity?: MapperSeverityName | 'none';
  value?: MapperScalarCondition;
}

export interface MapperConditionalStyle {
  id?: string;
  style: StyleDeclaration;
  when?: MapperCondition;
}

export interface MapperTelemetrySample {
  metric: string;
  value: unknown;
  labels: Record<string, string>;
  fields: Record<string, unknown>;
}

export interface MapperOverlayEntity {
  kind: MapperTargetKind;
  id: string;
}
