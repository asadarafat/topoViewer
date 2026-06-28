import type { StyleDeclaration } from 'topoviewer';

export type MapperTargetKind = 'node' | 'link' | 'path' | 'region' | 'layer' | 'graph';
export type MapperResolverMode = 'id' | 'label' | 'data' | 'endpoint' | 'selector' | 'aggregate' | 'staticObjectIds';
export type MapperSeverityDirection = 'above' | 'below';

export interface TopoViewerMapper {
  version: 1;
  identity?: {
    sourceId?: string;
    sourceIdLabel?: string;
  };
  mappings: MapperRule[];
}

export interface MapperRule {
  id: string;
  metric: string;
  target: MapperTarget;
  value?: MapperValueSelector;
  thresholds?: MapperThresholds;
  overlay?: MapperOverlayPolicy;
}

export interface MapperTarget {
  kind: MapperTargetKind;
  resolve: MapperResolver;
}

export interface MapperResolver {
  by: MapperResolverMode;
  metricLabel?: string;
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
