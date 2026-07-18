export type AuthoringObjectKind = 'layer' | 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'callout' | 'shape' | 'text';

export interface AuthoringObjectSelection {
  id: string;
  kind: AuthoringObjectKind;
}

export type AuthoringGraphObject = Record<string, unknown> & {
  id?: string;
  labels?: Record<string, unknown>;
};
export type AuthoringSourcePath = Array<string | number>;

export interface AuthoringInsertion {
  path: AuthoringSourcePath;
  selection: AuthoringObjectSelection;
  value: AuthoringGraphObject;
}

export interface AuthoringRemoval {
  path: AuthoringSourcePath;
  scopePath: AuthoringSourcePath;
  selection: AuthoringObjectSelection;
}

export interface AuthoringValueUpdate {
  path: AuthoringSourcePath;
  scopePath: AuthoringSourcePath;
  value: unknown;
}

export interface AuthoringEditPlan {
  insertions: AuthoringInsertion[];
  removals: AuthoringRemoval[];
  updates: AuthoringValueUpdate[];
}
