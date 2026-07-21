import {
  styleDefinitions,
  styleDefinitionsByKind,
  type StyleTargetKind
} from './styleDefaults';

export const TOPOLOGY_ROOT_STYLESHEET_FIELDS = [
  'icons',
  'labelFields',
  'layout',
  'limits',
  'stylesheet'
] as const;

export const TOPOLOGY_OBJECT_PRESENTATION_FIELDS = {
  callout: ['align', 'size'],
  region: [
    'headerPadding',
    'minHeight',
    'minWidth',
    'nodeHeight',
    'nodeWidth',
    'padding',
    'paddingX',
    'paddingY',
    'parentPadding',
    'parentPaddingX',
    'parentPaddingY',
    'size'
  ],
  shape: ['rotation', 'size', 'type'],
  text: ['align', 'rotation', 'size', 'verticalAlign']
} as const;

export const TOPOLOGY_COMMON_PRESENTATION_FIELDS = ['icon', 'style'] as const;

export type TopologyPresentationObjectKind = keyof typeof TOPOLOGY_OBJECT_PRESENTATION_FIELDS;
export type TopologyOwnershipObjectKind =
  | 'callout'
  | 'connector'
  | 'graph'
  | 'layer'
  | 'link'
  | 'linkDirection'
  | 'node'
  | 'path'
  | 'region'
  | 'shape'
  | 'text'
  | 'toggle';

export interface TopologyOwnershipIssue {
  field: string;
  message: string;
  path: Array<string | number>;
}

export class TopologyOwnershipError extends Error {
  readonly code = 'topology-presentation-leak';

  constructor(context: string, readonly issues: TopologyOwnershipIssue[]) {
    super(`${context} is invalid: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'TopologyOwnershipError';
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function values(value: Record<string, unknown> | undefined, field: string): unknown[] {
  return Array.isArray(value?.[field]) ? value[field] as unknown[] : [];
}

function hasOwn(value: Record<string, unknown>, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, field);
}

const presentationFieldsByKind: Partial<Record<TopologyOwnershipObjectKind, readonly string[]>> = {};

export function topologyPresentationFieldsForKind(kind: TopologyOwnershipObjectKind): readonly string[] {
  const cached = presentationFieldsByKind[kind];
  if (cached) return cached;
  const historical = kind in TOPOLOGY_OBJECT_PRESENTATION_FIELDS
    ? TOPOLOGY_OBJECT_PRESENTATION_FIELDS[kind as TopologyPresentationObjectKind]
    : [];
  const definitions = kind === 'graph' || kind === 'layer' || kind === 'toggle'
    ? styleDefinitions
    : styleDefinitionsByKind[(kind === 'connector' ? 'link' : kind) as StyleTargetKind];
  const fields = [...new Set([
    ...TOPOLOGY_COMMON_PRESENTATION_FIELDS,
    ...historical,
    ...definitions.map((definition) => definition.key)
  ])].filter((field) => (
    kind !== 'link' || (field !== 'sourceLabel' && field !== 'targetLabel')
  ) && (kind !== 'linkDirection' || field !== 'label'));
  presentationFieldsByKind[kind] = fields;
  return fields;
}

function pushPresentationIssues(
  issues: TopologyOwnershipIssue[],
  value: Record<string, unknown>,
  kind: TopologyOwnershipObjectKind,
  path: Array<string | number>
): void {
  for (const field of topologyPresentationFieldsForKind(kind)) {
    if (!hasOwn(value, field)) continue;
    const fieldPath = [...path, field];
    issues.push({
      field,
      message: `${fieldPath.join('.')} is presentation policy; put it in stylesheet YAML.`,
      path: fieldPath
    });
  }
}

const topologyCollections = [
  ['graph', 'layers', 'layer'],
  ['graph', 'nodes', 'node'],
  ['graph', 'links', 'link'],
  ['graph', 'paths', 'path'],
  ['graph', 'regions', 'region'],
  ['diagram', 'shapes', 'shape'],
  ['diagram', 'connectors', 'connector'],
  ['diagram', 'callouts', 'callout'],
  ['diagram', 'texts', 'text']
] as const satisfies ReadonlyArray<readonly ['diagram' | 'graph', string, TopologyOwnershipObjectKind]>;

export function topologyOwnershipIssues(value: unknown): TopologyOwnershipIssue[] {
  const document = record(value);
  if (!document) return [];
  const issues: TopologyOwnershipIssue[] = [];

  for (const field of TOPOLOGY_ROOT_STYLESHEET_FIELDS) {
    if (!hasOwn(document, field)) continue;
    issues.push({
      field,
      message: `${field} is stylesheet-owned and is not allowed in topology YAML.`,
      path: [field]
    });
  }

  pushPresentationIssues(issues, document, 'graph', []);
  for (const root of ['graph', 'diagram'] as const) {
    const owner = record(document[root]);
    if (owner) pushPresentationIssues(issues, owner, 'graph', [root]);
  }

  for (const [root, collection, kind] of topologyCollections) {
    const entries = values(record(document[root]), collection);
    for (let index = 0; index < entries.length; index += 1) {
      const entity = record(entries[index]);
      if (entity) pushPresentationIssues(issues, entity, kind, [root, collection, index]);
    }
  }

  const links = values(record(document.graph), 'links');
  for (let linkIndex = 0; linkIndex < links.length; linkIndex += 1) {
    const directions = record(record(links[linkIndex])?.directions);
    for (const [direction, rawDirection] of Object.entries(directions || {})) {
      const directionValue = record(rawDirection);
      if (directionValue) {
        pushPresentationIssues(issues, directionValue, 'linkDirection', [
          'graph', 'links', linkIndex, 'directions', direction
        ]);
      }
    }
  }

  const callouts = values(record(document.diagram), 'callouts');
  for (let index = 0; index < callouts.length; index += 1) {
    const callout = record(callouts[index]);
    if (!callout || !hasOwn(callout, 'leader')) continue;
    issues.push({
      field: 'leader',
      message: `diagram.callouts[${index}].leader is presentation policy; style the generated leader link in stylesheet YAML.`,
      path: ['diagram', 'callouts', index, 'leader']
    });
  }

  const toggles = Array.isArray(document.toggles) ? document.toggles : [];
  for (let index = 0; index < toggles.length; index += 1) {
    const toggle = record(toggles[index]);
    if (toggle) pushPresentationIssues(issues, toggle, 'toggle', ['toggles', index]);
  }
  return issues;
}
