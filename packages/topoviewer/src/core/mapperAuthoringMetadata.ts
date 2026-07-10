import mapperSchema from '../../schemas/topoviewer-mapper.schema.json';
import type {
  AuthoringControlHint,
  AuthoringFieldLevel,
  MapperAuthoringCapability,
  MapperAuthoringFieldMetadata
} from './authoringMetadata';
import type { StyleTargetKind } from './styleDefaults';

interface JsonSchemaNode {
  $ref?: string;
  additionalProperties?: boolean | JsonSchemaNode;
  anyOf?: JsonSchemaNode[];
  const?: unknown;
  default?: unknown;
  description?: string;
  enum?: unknown[];
  items?: JsonSchemaNode;
  oneOf?: JsonSchemaNode[];
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  type?: string;
}

const schema = mapperSchema as unknown as JsonSchemaNode & { definitions: Record<string, JsonSchemaNode> };
const mapperStyleTargets: StyleTargetKind[] = ['node', 'link', 'linkDirection', 'path', 'region'];

function resolve(node: JsonSchemaNode): JsonSchemaNode {
  if (!node.$ref) return node;
  const name = node.$ref.match(/^#\/definitions\/(.+)$/)?.[1];
  return name && schema.definitions[name] ? schema.definitions[name] : node;
}

function branches(node: JsonSchemaNode): JsonSchemaNode[] {
  return [...(node.oneOf || []), ...(node.anyOf || [])].map(resolve);
}

function valueType(node: JsonSchemaNode, path: string): MapperAuthoringFieldMetadata['valueType'] {
  const resolved = resolve(node);
  if (resolved.enum || resolved.const !== undefined) return 'enum';
  if (resolved.type === 'array') return 'array';
  if (resolved.type === 'object' || resolved.properties || resolved.additionalProperties) return 'object';
  if (resolved.type === 'boolean') return 'boolean';
  if (resolved.type === 'number') return 'number';
  if (resolved.type === 'integer') return 'integer';
  if (/(?:color|accent)$/i.test(path)) return 'color';
  const alternatives = branches(resolved);
  if (alternatives.some((branch) => branch.type === 'object' || branch.properties)) return 'object';
  return 'text';
}

function labelForPath(path: string): string {
  const leaf = path.replace(/\.\*$/, '').split('.').at(-1)?.replace(/\[\]$/, '') || path;
  return leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
}

function groupForPath(path: string): string {
  if (path.startsWith('identity')) return 'Identity';
  if (path.startsWith('palette')) return 'Severity palette';
  if (path.startsWith('rules')) return 'Rules';
  if (path.startsWith('mappings')) return 'Canonical mappings';
  return 'Document';
}

function levelForPath(path: string): AuthoringFieldLevel {
  if (path.startsWith('mappings') || path.startsWith('palette') || path.includes('.style')) return 'advanced';
  return 'basic';
}

function controlForField(path: string, type: MapperAuthoringFieldMetadata['valueType']): AuthoringControlHint {
  if (path.endsWith('.style') || path.includes('.style.*')) {
    return { kind: 'nested', specializedEditor: 'target-style' };
  }
  if (path.endsWith('.join') || path.endsWith('.resolve')) {
    return { kind: 'nested', specializedEditor: 'mapper-join' };
  }
  if (path === 'rules' || path === 'mappings' || path.endsWith('.conditions')) {
    return { kind: 'nested', specializedEditor: 'repeatable-rules' };
  }
  if (path.endsWith('.select')) return { kind: 'selector', specializedEditor: 'selector-builder' };
  const kinds: Record<MapperAuthoringFieldMetadata['valueType'], AuthoringControlHint['kind']> = {
    array: 'nested',
    boolean: 'switch',
    color: 'color',
    enum: 'select',
    integer: 'number',
    number: 'number',
    numberList: 'numberList',
    object: 'nested',
    text: 'text'
  };
  return { kind: kinds[type] };
}

function collectFields() {
  const fields = new Map<string, MapperAuthoringFieldMetadata>();
  let order = 0;

  function visitObject(node: JsonSchemaNode, basePath: string) {
    const resolved = resolve(node);
    const required = new Set(resolved.required || []);
    for (const [key, rawChild] of Object.entries(resolved.properties || {})) {
      const child = resolve(rawChild);
      const path = basePath ? `${basePath}.${key}` : key;
      const type = valueType(rawChild, path);
      const description = child.description || rawChild.description;
      fields.set(path, {
        control: controlForField(path, type),
        description: description || `${labelForPath(path)} mapper field.`,
        descriptionGenerated: !description,
        group: groupForPath(path),
        label: labelForPath(path),
        level: levelForPath(path),
        order: order++,
        path,
        required: required.has(key),
        targetKinds: path.endsWith('.style') || path.includes('.style.*') ? mapperStyleTargets : undefined,
        valueType: type,
        values: (child.enum || rawChild.enum || (child.const !== undefined ? [child.const] : undefined))
          ?.map(String)
      });

      if (child.type === 'array' && child.items) {
        visitObject(child.items, `${path}[]`);
      } else {
        visitObject(child, path);
        for (const branch of branches(rawChild)) visitObject(branch, path);
      }

      const additional = child.additionalProperties;
      if (additional && typeof additional === 'object') {
        const dynamicPath = `${path}.*`;
        const dynamicType = valueType(additional, dynamicPath);
        const description = additional.description;
        fields.set(dynamicPath, {
          control: controlForField(dynamicPath, dynamicType),
          description: description || `Dynamic ${labelForPath(path)} entry.`,
          descriptionGenerated: !description,
          group: groupForPath(path),
          label: `${labelForPath(path)} entry`,
          level: levelForPath(dynamicPath),
          order: order++,
          path: dynamicPath,
          required: false,
          targetKinds: dynamicPath.includes('.style') ? mapperStyleTargets : undefined,
          valueType: dynamicType
        });
        visitObject(additional, dynamicPath);
      }
    }
  }

  visitObject(schema, '');
  return [...fields.values()].sort((left, right) => left.order - right.order);
}

export const mapperAuthoringMetadata: readonly MapperAuthoringFieldMetadata[] = collectFields();

/**
 * Maps product-level mapper workflows to the installed version 1 contract.
 * Ordering and diagnostics are runtime behavior, not invented mapper keys.
 */
export const mapperAuthoringCapabilities: readonly MapperAuthoringCapability[] = [
  {
    description: 'Human-friendly rules compile to canonical mappings.',
    disposition: 'specialized-editor',
    fieldPaths: ['rules', 'rules[].id', 'rules[].metric', 'rules[].select', 'rules[].join', 'rules[].value'],
    id: 'compact-rules'
  },
  {
    description: 'Canonical mappings expose target resolution, extraction, thresholds, overlays, and conditions.',
    disposition: 'generated-controls',
    fieldPaths: ['mappings', 'mappings[].target', 'mappings[].value', 'mappings[].thresholds', 'mappings[].overlay', 'mappings[].conditions'],
    id: 'canonical-mappings'
  },
  {
    description: 'Source identity filters samples before rule evaluation.',
    disposition: 'generated-controls',
    fieldPaths: ['identity.sourceId', 'identity.sourceIdLabel'],
    id: 'identity'
  },
  {
    description: 'Value field selection and semantic interpretation provide the installed normalization transform contract.',
    disposition: 'generated-controls',
    fieldPaths: ['mappings[].value.field', 'mappings[].value.as'],
    id: 'transforms'
  },
  {
    description: 'Compact states, canonical thresholds, and conditional styles express runtime state.',
    disposition: 'specialized-editor',
    fieldPaths: ['rules[].states', 'rules[].style', 'mappings[].thresholds', 'mappings[].conditions'],
    id: 'states'
  },
  {
    description: 'Overlay and conditional style templates format runtime labels and badges.',
    disposition: 'specialized-editor',
    fieldPaths: ['mappings[].overlay.label', 'mappings[].overlay.badgeLabel', 'mappings[].conditions[].style'],
    id: 'formatting'
  },
  {
    description: 'Mapping and condition sequence order is the version 1 precedence contract.',
    disposition: 'ordered-sequence',
    fieldPaths: ['mappings', 'mappings[].conditions'],
    id: 'priority'
  },
  {
    description: 'Resolution coverage and parser findings are computed from the mapper and local samples.',
    disposition: 'runtime-diagnostics',
    fieldPaths: [],
    id: 'diagnostics'
  },
  {
    description: 'Unknown future fields remain source-preserved and are edited through reviewed raw YAML.',
    disposition: 'raw-yaml-fallback',
    fieldPaths: [],
    id: 'unknown-extensions'
  }
];

export function mapperAuthoringField(path: string): MapperAuthoringFieldMetadata | undefined {
  return mapperAuthoringMetadata.find((field) => field.path === path);
}

export function searchMapperAuthoringMetadata(query: string): MapperAuthoringFieldMetadata[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...mapperAuthoringMetadata];
  return mapperAuthoringMetadata.filter((field) => (
    [field.path, field.label, field.description, field.group]
      .some((value) => value.toLowerCase().includes(normalized))
  ));
}
