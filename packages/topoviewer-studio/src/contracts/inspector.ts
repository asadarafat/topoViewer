export type StudioStyleEditScope = { kind: 'object' } | { kind: 'rule'; ruleIndex: number; selector: string } | { kind: 'new-rule'; selector: string };

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

export interface StudioIdentityRenamePreview {
  affectedDocuments: number;
  affectedReferences: number;
  error?: string;
  externalRisks: number;
}
