import type { StyleDeclaration, StyleRule, StylesheetDocument, TopoDocument, TopologyDocument } from './types';
import {
  TOPOLOGY_OBJECT_PRESENTATION_FIELDS,
  TOPOLOGY_ROOT_STYLESHEET_FIELDS,
  topologyPresentationFieldsForKind,
  type TopologyOwnershipObjectKind,
  type TopologyPresentationObjectKind
} from './topologyOwnership';

export const CURRENT_SCHEMA_VERSION = '0.2';

type RecordValue = Record<string, unknown>;

const GRAPH_COLLECTIONS = [
  ['nodes', 'node'],
  ['links', 'link'],
  ['paths', 'path'],
  ['regions', 'region']
] as const;

const DIAGRAM_COLLECTIONS = [
  ['shapes', 'shape'],
  ['connectors', 'connector'],
  ['callouts', 'callout'],
  ['texts', 'text']
] as const;

function record(value: unknown): RecordValue | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : undefined;
}

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T;
  const source = record(value);
  if (!source) return value;
  return Object.fromEntries(Object.entries(source).map(([key, item]) => [key, clone(item)])) as T;
}

function selectorValue(value: string): string {
  return JSON.stringify(value);
}

function exactIdSelector(kind: string, id: string): string {
  return `${kind}[id = ${selectorValue(id)}]`;
}

function mergeStyleRule(rules: StyleRule[], selector: string, style: StyleDeclaration): void {
  if (!Object.keys(style).length) return;
  const existing = rules.find((rule) => rule.selector === selector);
  if (existing) {
    existing.style = { ...style, ...(existing.style || {}) };
    return;
  }
  rules.push({ selector, style });
}

function sizeStyle(value: unknown): StyleDeclaration {
  if (Array.isArray(value)) return { width: value[0], height: value[1] };
  const size = record(value);
  return size ? { width: size.width, height: size.height } : {};
}

function migratePresentation(entity: RecordValue, kind: string): StyleDeclaration {
  const presentationKind = kind in TOPOLOGY_OBJECT_PRESENTATION_FIELDS
    ? kind as TopologyPresentationObjectKind
    : undefined;
  const style: StyleDeclaration = {};
  if (entity.size !== undefined) Object.assign(style, sizeStyle(entity.size));
  if (presentationKind === 'shape') {
    if (entity.type !== undefined) style.shape = entity.type;
    if (entity.rotation !== undefined) style.rotation = entity.rotation;
  }
  if (presentationKind === 'callout' && entity.align !== undefined) style.textAlign = entity.align;
  if (presentationKind === 'text') {
    if (entity.align !== undefined) style.textAlign = entity.align;
    if (entity.verticalAlign !== undefined) style.verticalAlign = entity.verticalAlign;
    if (entity.rotation !== undefined) style.rotation = entity.rotation;
  }
  if (presentationKind === 'region') {
    for (const field of TOPOLOGY_OBJECT_PRESENTATION_FIELDS.region) {
      if (field !== 'size' && entity[field] !== undefined) style[field] = entity[field];
    }
  }
  const historicalFields = new Set<string>(presentationKind
    ? TOPOLOGY_OBJECT_PRESENTATION_FIELDS[presentationKind]
    : []);
  for (const field of topologyPresentationFieldsForKind(kind as TopologyOwnershipObjectKind)) {
    if (
      field !== 'icon'
      && field !== 'style'
      && !historicalFields.has(field)
      && entity[field] !== undefined
      && style[field] === undefined
    ) {
      style[field] = entity[field];
    }
    delete entity[field];
  }
  return style;
}

function migrateAlias(entity: RecordValue, path: string): void {
  const name = typeof entity.name === 'string' ? entity.name : undefined;
  const genericLabel = typeof entity.label === 'string' ? entity.label : undefined;
  const labels = { ...(record(entity.labels) || {}) };
  const currentAlias = typeof labels.name === 'string' ? labels.name : undefined;
  const preferredAlias = name ?? genericLabel;

  if (preferredAlias !== undefined && currentAlias !== undefined && preferredAlias !== currentAlias) {
    throw new Error(`${path} cannot migrate: name/label "${preferredAlias}" conflicts with labels.name "${currentAlias}".`);
  }
  if (preferredAlias !== undefined && currentAlias === undefined) labels.name = preferredAlias;
  if (name !== undefined && genericLabel !== undefined && genericLabel !== name && labels.label === undefined) {
    labels.label = genericLabel;
  }
  if (Object.keys(labels).length) entity.labels = labels;
  else delete entity.labels;
  delete entity.name;
  delete entity.label;
}

function migrateEntity(
  entity: RecordValue,
  kind: string,
  path: string,
  rules: StyleRule[]
): void {
  migrateAlias(entity, path);
  const id = typeof entity.id === 'string' ? entity.id : undefined;
  if (!id) return;
  const inlineStyle = record(entity.style);
  const icon = typeof entity.icon === 'string' ? entity.icon : undefined;
  const style = { ...migratePresentation(entity, kind), ...(inlineStyle || {}) };
  if (icon !== undefined && style.icon === undefined) style.icon = icon;
  mergeStyleRule(rules, exactIdSelector(kind, id), style);
  delete entity.style;
  delete entity.icon;

  if (kind === 'callout') {
    const leader = record(entity.leader);
    if (leader) mergeStyleRule(rules, exactIdSelector('link', `${id}:leader`), leader);
    delete entity.leader;
  }

  if (kind === 'link') {
    const directions = record(entity.directions);
    Object.entries(directions || {}).forEach(([direction, rawDirection]) => {
      const value = record(rawDirection);
      if (!value) return;
      const directionId = typeof value.id === 'string' && value.id ? value.id : `${id}:${direction}`;
      const directionName = typeof value.name === 'string' ? value.name : undefined;
      const directionLabels = { ...(record(value.labels) || {}) };
      if (directionName !== undefined && directionLabels.name === undefined) directionLabels.name = directionName;
      if (Object.keys(directionLabels).length) value.labels = directionLabels;
      delete value.name;
      const inlineDirectionStyle = record(value.style);
      const directionIcon = typeof value.icon === 'string' ? value.icon : undefined;
      const directionStyle = { ...migratePresentation(value, 'linkDirection'), ...(inlineDirectionStyle || {}) };
      if (directionIcon !== undefined && directionStyle.icon === undefined) directionStyle.icon = directionIcon;
      mergeStyleRule(rules, exactIdSelector('linkDirection', directionId), directionStyle);
    });
  }
}

function migrateNamedDescriptor(value: RecordValue, path: string): void {
  migrateAlias(value, path);
}

function migrateLabelFields(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((field) => String(field) === 'name' ? 'labels.name' : String(field));
}

export function migrateTopoDocument(document: unknown): TopoDocument {
  const source = record(document) || {};
  const migrated = clone(source);
  const rules = Array.isArray(migrated.stylesheet)
    ? migrated.stylesheet.filter((value): value is StyleRule => !!record(value)).map((value) => clone(value))
    : [];
  const graph = record(migrated.graph);
  const diagram = record(migrated.diagram);

  if (graph) {
    migrateNamedDescriptor(graph, 'graph');
    GRAPH_COLLECTIONS.forEach(([collection, kind]) => {
      const values = Array.isArray(graph[collection]) ? graph[collection] as unknown[] : [];
      values.forEach((value, index) => {
        const entity = record(value);
        if (entity) migrateEntity(entity, kind, `graph.${collection}.${index}`, rules);
      });
    });
    const layers = Array.isArray(graph.layers) ? graph.layers : [];
    layers.forEach((value, index) => {
      const layer = record(value);
      if (layer) migrateNamedDescriptor(layer, `graph.layers.${index}`);
    });
  }

  if (diagram) {
    DIAGRAM_COLLECTIONS.forEach(([collection, kind]) => {
      const values = Array.isArray(diagram[collection]) ? diagram[collection] as unknown[] : [];
      values.forEach((value, index) => {
        const entity = record(value);
        if (entity) migrateEntity(entity, kind, `diagram.${collection}.${index}`, rules);
      });
    });
  }

  const toggles = Array.isArray(migrated.toggles) ? migrated.toggles : [];
  toggles.forEach((value, index) => {
    const toggle = record(value);
    if (toggle) migrateNamedDescriptor(toggle, `toggles.${index}`);
  });

  const labelFields = migrateLabelFields(migrated.labelFields);
  if (labelFields) migrated.labelFields = labelFields;

  migrated.version = CURRENT_SCHEMA_VERSION;
  if (rules.length) migrated.stylesheet = rules;
  return migrated as TopoDocument;
}

export interface TopoBundleMigrationInput {
  stylesheet?: unknown;
  topology: unknown;
}

export interface TopoBundleMigrationResult {
  stylesheet?: StylesheetDocument;
  topology: TopologyDocument;
}

/**
 * Migrates a separately-authored topology/stylesheet pair without changing the
 * ownership boundary. Legacy inline appearance is merged into the effective
 * stylesheet and removed from the canonical topology document.
 */
export function migrateTopoBundle(input: TopoBundleMigrationInput): TopoBundleMigrationResult {
  const topologySource = clone(record(input.topology) || {});
  const rawStylesheetSource = clone(record(input.stylesheet) || {});
  const stylesheetSource = migrateTopoDocument(rawStylesheetSource) as RecordValue;
  if (topologySource.toggles === undefined && stylesheetSource.toggles !== undefined) {
    topologySource.toggles = clone(stylesheetSource.toggles);
  }
  delete stylesheetSource.toggles;
  const combined = clone(topologySource);

  TOPOLOGY_ROOT_STYLESHEET_FIELDS.forEach((field) => {
    const value = stylesheetSource[field] ?? topologySource[field];
    if (value !== undefined) combined[field] = clone(value);
  });

  const migrated = migrateTopoDocument(combined);
  const topology = clone(migrated) as RecordValue;
  TOPOLOGY_ROOT_STYLESHEET_FIELDS.forEach((field) => delete topology[field]);

  const stylesheet = clone(stylesheetSource);
  TOPOLOGY_ROOT_STYLESHEET_FIELDS.forEach((field) => {
    if (migrated[field] !== undefined) stylesheet[field] = clone(migrated[field]);
    else delete stylesheet[field];
  });

  const hasStylesheetContent = Object.keys(stylesheet).some((key) => key !== 'version');
  if (hasStylesheetContent) stylesheet.version = CURRENT_SCHEMA_VERSION;
  else delete stylesheet.version;

  return {
    topology: topology as TopologyDocument,
    ...(hasStylesheetContent ? { stylesheet: stylesheet as StylesheetDocument } : {})
  };
}

export function migrateTopoToggles<T>(toggles: T): T {
  if (!toggles || typeof toggles !== 'object' || Array.isArray(toggles)) return toggles;
  const source = toggles as Record<string, unknown>;
  if (source.showChildNodesInsideParents !== undefined || source.showServicesInsideNodes === undefined) return toggles;
  return {
    ...source,
    showChildNodesInsideParents: source.showServicesInsideNodes
  } as T;
}
