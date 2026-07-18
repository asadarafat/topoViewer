import type { StyleDeclaration, StyleRule, StylesheetDocument, TopoDocument, TopologyDocument } from './types';

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
    existing.style = { ...(existing.style || {}), ...style };
    return;
  }
  rules.push({ selector, style });
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
  const style = { ...(record(entity.style) || {}) };
  if (typeof entity.icon === 'string' && style.icon === undefined) style.icon = entity.icon;
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
      const directionStyle = record(value.style);
      if (directionStyle) mergeStyleRule(rules, exactIdSelector('linkDirection', directionId), directionStyle);
      delete value.style;
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
  if (source.version === CURRENT_SCHEMA_VERSION) return source as TopoDocument;

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

const STYLESHEET_OWNED_FIELDS = ['icons', 'labelFields', 'stylesheet'] as const;

/**
 * Migrates a separately-authored topology/stylesheet pair without changing the
 * ownership boundary. Legacy inline appearance is merged into the effective
 * stylesheet and removed from the canonical topology document.
 */
export function migrateTopoBundle(input: TopoBundleMigrationInput): TopoBundleMigrationResult {
  const topologySource = clone(record(input.topology) || {});
  const rawStylesheetSource = clone(record(input.stylesheet) || {});
  const stylesheetSource = rawStylesheetSource.version === CURRENT_SCHEMA_VERSION
    ? rawStylesheetSource
    : migrateTopoDocument(rawStylesheetSource) as RecordValue;
  const combined = clone(topologySource);

  STYLESHEET_OWNED_FIELDS.forEach((field) => {
    const value = stylesheetSource[field] ?? topologySource[field];
    if (value !== undefined) combined[field] = clone(value);
  });

  const migrated = topologySource.version === CURRENT_SCHEMA_VERSION
    ? combined as TopoDocument
    : migrateTopoDocument(combined);
  const topology = clone(migrated) as RecordValue;
  STYLESHEET_OWNED_FIELDS.forEach((field) => delete topology[field]);

  const stylesheet = clone(stylesheetSource);
  STYLESHEET_OWNED_FIELDS.forEach((field) => {
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
