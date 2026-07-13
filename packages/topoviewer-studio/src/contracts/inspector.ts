import type { StudioDocumentKind } from './project';
import type { StudioSourceRange } from '../session';

export type StudioStyleEditScope =
  | { kind: 'object' }
  | { kind: 'rule'; ruleIndex: number; selector: string }
  | { kind: 'new-rule'; selector: string };

export interface StudioStyleEditRequest {
  fieldPath: string[];
  objectPath?: Array<string | number>;
  scope: StudioStyleEditScope;
  value: unknown;
}

export interface StudioStyleUnsetRequest {
  fieldPath: string[];
  objectPath?: Array<string | number>;
  scope: Exclude<StudioStyleEditScope, { kind: 'new-rule' }>;
}

export type StudioSourceRangeLookup = (
  document: StudioDocumentKind,
  path: Array<string | number>
) => StudioSourceRange | undefined;
