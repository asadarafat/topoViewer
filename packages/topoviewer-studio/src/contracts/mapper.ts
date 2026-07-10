import type { MapperAuthoringFieldMetadata } from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';

export interface StudioMapperRuleReference {
  collection: 'rules' | 'mappings';
  index: number;
}

export interface StudioMapperFieldEditRequest {
  field: MapperAuthoringFieldMetadata;
  path: Array<string | number>;
  scopePath: Array<string | number>;
  value: unknown;
}

export interface StudioMapperFieldUnsetRequest {
  path: Array<string | number>;
  scopePath: Array<string | number>;
}

export interface StudioMapperStyleEditRequest {
  fieldPath: string[];
  path: Array<string | number>;
  scopePath: Array<string | number>;
  target: StyleTargetKind;
  value: unknown;
}

export interface StudioMapperStyleUnsetRequest {
  path: Array<string | number>;
  scopePath: Array<string | number>;
}
