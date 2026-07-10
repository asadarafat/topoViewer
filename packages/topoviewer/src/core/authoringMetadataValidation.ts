import { mapperAuthoringMetadata } from './mapperAuthoringMetadata';
import { styleAuthoringMetadata } from './styleAuthoringMetadata';
import { styleDefinitions } from './styleDefaults';
import type { AuthoringControlKind, AuthoringFieldMetadata } from './authoringMetadata';

const validGroups = new Set([
  'Appearance', 'Arrows', 'Badge and status', 'Content', 'Directional strokes',
  'General', 'Geometry', 'Icon', 'Interaction', 'Labels and metadata', 'Layout',
  'Routing', 'Stroke'
]);
const compatibleControls: Record<AuthoringFieldMetadata['valueType'], Set<AuthoringControlKind>> = {
  boolean: new Set(['switch']),
  color: new Set(['color']),
  enum: new Set(['select']),
  integer: new Set(['number']),
  number: new Set(['number']),
  numberList: new Set(['numberList']),
  object: new Set(['nested']),
  text: new Set(['text', 'asset', 'selector', 'raw'])
};

function controlIsCompatible(
  valueType: AuthoringFieldMetadata['valueType'],
  control: NonNullable<AuthoringFieldMetadata['control']>
): boolean {
  return compatibleControls[valueType].has(control.kind)
    || (control.kind === 'nested' && Boolean(control.specializedEditor));
}

function conditionIsPossible(field: AuthoringFieldMetadata, fields: readonly AuthoringFieldMetadata[]): boolean {
  if (!field.visibleWhen) return true;
  const conditionField = fields.find((candidate) => (
    candidate.path === field.visibleWhen?.path
    && candidate.targets.some((target) => field.targets.includes(target))
  ));
  if (!conditionField) return false;
  if (field.visibleWhen.equals === undefined || !conditionField.values) return true;
  return conditionField.values.includes(String(field.visibleWhen.equals));
}

export interface AuthoringMetadataIssue {
  code: string;
  message: string;
  path: string;
}

export function validateAuthoringMetadata(): AuthoringMetadataIssue[] {
  const issues: AuthoringMetadataIssue[] = [];
  const styleKeys = new Set(styleDefinitions.map((definition) => definition.key));
  const metadataKeys = new Set(styleAuthoringMetadata.map((field) => field.path));
  const styleTargetPaths = new Set<string>();

  for (const key of styleKeys) {
    if (!metadataKeys.has(key)) {
      issues.push({ code: 'missing-style-field', message: `Style field ${key} has no authoring metadata.`, path: key });
    }
  }
  for (const field of styleAuthoringMetadata) {
    if (!styleKeys.has(field.path)) {
      issues.push({ code: 'stale-style-field', message: `Authoring metadata ${field.path} is not a public style field.`, path: field.path });
    }
    if (!field.description.trim()) {
      issues.push({ code: 'missing-description', message: `Style field ${field.path} has no description.`, path: field.path });
    }
    if (!field.group.trim() || !Number.isFinite(field.order) || !field.control) {
      issues.push({ code: 'invalid-style-disposition', message: `Style field ${field.path} has incomplete UI disposition.`, path: field.path });
    }
    if (!validGroups.has(field.group)) {
      issues.push({ code: 'invalid-style-group', message: `Style field ${field.path} uses unknown group ${field.group}.`, path: field.path });
    }
    if (field.control && !controlIsCompatible(field.valueType, field.control)) {
      issues.push({ code: 'incompatible-control', message: `Style field ${field.path} cannot use ${field.control.kind} for ${field.valueType}.`, path: field.path });
    }
    if (!conditionIsPossible(field, styleAuthoringMetadata)) {
      issues.push({ code: 'impossible-condition', message: `Style field ${field.path} has an impossible visibility condition.`, path: field.path });
    }
    for (const alias of field.aliases || []) {
      if (!alias.trim() || alias === field.path || styleKeys.has(alias)) {
        issues.push({ code: 'stale-alias', message: `Style field ${field.path} has invalid alias ${alias}.`, path: field.path });
      }
    }
    for (const conflict of field.conflictsWith || []) {
      const compatible = styleAuthoringMetadata.some((candidate) => (
        candidate.path === conflict && candidate.targets.some((target) => field.targets.includes(target))
      ));
      if (!compatible) {
        issues.push({ code: 'invalid-conflict', message: `Style field ${field.path} conflicts with incompatible field ${conflict}.`, path: field.path });
      }
    }
    const nestedPaths = new Set<string>();
    for (const nested of field.nestedFields || []) {
      if (nestedPaths.has(nested.path) || !nested.description.trim() || !nested.control) {
        issues.push({ code: 'invalid-nested-field', message: `Style field ${field.path}.${nested.path} is incomplete or duplicated.`, path: `${field.path}.${nested.path}` });
      }
      nestedPaths.add(nested.path);
      if (!controlIsCompatible(nested.valueType, nested.control)) {
        issues.push({ code: 'incompatible-nested-control', message: `Style field ${field.path}.${nested.path} has an incompatible control.`, path: `${field.path}.${nested.path}` });
      }
    }
    for (const target of field.targets) {
      const identity = `${target}:${field.path}`;
      if (styleTargetPaths.has(identity)) {
        issues.push({ code: 'duplicate-style-field', message: `Style field ${identity} is duplicated.`, path: field.path });
      }
      styleTargetPaths.add(identity);
    }
  }

  for (const definition of styleDefinitions) {
    const expectedTargets = new Set(definition.targets.includes('link')
      ? [...definition.targets, 'linkDirection']
      : definition.targets);
    const field = styleAuthoringMetadata.find((candidate) => (
      candidate.path === definition.key
      && candidate.targets.length === expectedTargets.size
      && candidate.targets.every((target) => expectedTargets.has(target))
    ));
    if (!field || field.targets.length !== expectedTargets.size || field.targets.some((target) => !expectedTargets.has(target))) {
      issues.push({ code: 'style-target-mismatch', message: `Style field ${definition.key} target metadata drifted from runtime definitions.`, path: definition.key });
    }
  }

  const mapperPaths = new Set<string>();
  for (const field of mapperAuthoringMetadata) {
    if (mapperPaths.has(field.path)) {
      issues.push({ code: 'duplicate-mapper-field', message: `Mapper field ${field.path} is duplicated.`, path: field.path });
    }
    mapperPaths.add(field.path);
    if (!field.description.trim() || !field.group.trim() || !Number.isFinite(field.order) || !field.control) {
      issues.push({ code: 'invalid-mapper-disposition', message: `Mapper field ${field.path} has incomplete UI disposition.`, path: field.path });
    }
    if (field.descriptionGenerated) {
      issues.push({ code: 'missing-mapper-description', message: `Mapper field ${field.path} needs a schema description.`, path: field.path });
    }
  }

  return issues;
}
