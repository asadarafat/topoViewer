import type {
  AuthoringControlHint,
  AuthoringFieldLevel,
  AuthoringFieldMetadata,
  AuthoringNestedFieldMetadata
} from './authoringMetadata';
import {
  styleDefinitions,
  type StyleKeyDefinition,
  type StyleTargetKind,
  type StyleValueDataType
} from './styleDefaults';
import {
  nodeLayoutContentAlignments,
  nodeLayoutDirections,
  nodeLayoutIconPlacements,
  nodeLayoutTypes
} from './nodeStyle';

const noDefault = (description = 'No default; the field is optional.') => ({
  description,
  kind: 'none' as const
});
const valueDefault = (value: string | number | boolean) => ({ kind: 'value' as const, value });

const basicKeys = new Set([
  'shape', 'nodeLayout', 'width', 'height', 'backgroundColor', 'borderColor',
  'borderWidth', 'icon', 'iconColor', 'iconFit', 'iconPadding', 'label',
  'labelPosition', 'labelColor', 'labelFontSize', 'labelFontWeight',
  'labelBackgroundColor', 'metaColor', 'badgeLabel', 'badgePosition',
  'badgeColor', 'badgeBackgroundColor', 'statusColor', 'statusPlacement',
  'lineColor', 'lineWidth', 'lineStyle', 'curveStyle', 'controlPointDistance',
  'controlPointStepSize', 'controlPointWeight', 'targetArrowShape',
  'sourceArrowShape', 'arrowColor', 'sourceLabel', 'targetLabel',
  'directionalStrokes', 'directionCenterGap', 'directionStartGap',
  'directionLabelPlacement', 'fill', 'stroke', 'strokeWidth', 'rotation',
  'titleColor', 'bodyColor', 'color', 'textAlign', 'display', 'draggable', 'selectable'
]);

function groupForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.startsWith('nodelayout')) return 'Layout';
  if (lower.startsWith('icon')) return 'Icon';
  if (lower.startsWith('badge') || lower.startsWith('status')) return 'Badge and status';
  if (lower.startsWith('meta')) return 'Labels and metadata';
  if (lower.includes('label') || lower.startsWith('text')) return 'Labels and metadata';
  if (lower.includes('arrow')) return 'Arrows';
  if (lower.startsWith('direction')) return 'Directional strokes';
  if (
    lower.includes('controlpoint')
    || lower.includes('segment')
    || lower.includes('taxi')
    || lower.includes('distance')
    || key === 'curveStyle'
    || key === 'anchor'
    || key === 'edgeDistances'
  ) return 'Routing';
  if (lower.startsWith('line') || lower.startsWith('lane') || lower.startsWith('pipe')) return 'Stroke';
  if (lower.startsWith('title') || lower.startsWith('body')) return 'Content';
  if (
    lower.includes('border')
    || lower.includes('outline')
    || lower.includes('underlay')
    || lower.includes('background')
    || key === 'fill'
    || key === 'stroke'
  ) return 'Appearance';
  if (['shape', 'shapePolygonPoints', 'width', 'height', 'rotation'].includes(key)) return 'Geometry';
  if (['display', 'draggable', 'selectable', 'interactive', 'labelInteractive'].includes(key)) return 'Interaction';
  if (lower.includes('opacity') || lower.includes('zindex')) return 'Appearance';
  return 'General';
}

function levelForDefinition(definition: StyleKeyDefinition): AuthoringFieldLevel {
  return basicKeys.has(definition.key) ? 'basic' : 'advanced';
}

function controlForDefinition(definition: StyleKeyDefinition): AuthoringControlHint {
  if (definition.key === 'nodeLayout') {
    return { kind: 'nested', specializedEditor: 'node-layout' };
  }
  if (definition.key === 'shapePolygonPoints') {
    return { kind: 'nested', specializedEditor: 'polygon-points' };
  }
  if (definition.key === 'icon') {
    return { kind: 'asset', specializedEditor: 'icon-picker' };
  }
  if (definition.key.toLowerCase().includes('selector')) {
    return { kind: 'selector', specializedEditor: 'selector-builder' };
  }
  if (definition.key === 'lineDashPattern' || definition.key === 'borderDashPattern') {
    return { kind: 'numberList', specializedEditor: 'dash-pattern' };
  }
  if (definition.key === 'segmentDistances' || definition.key === 'segmentWeights') {
    return { kind: 'numberList', specializedEditor: 'route-segments' };
  }
  if (definition.key === 'controlPointDistance' || definition.key === 'controlPointStepSize') {
    return { kind: 'number', minimum: 0, step: 1 };
  }
  if (definition.key === 'controlPointWeight') {
    return { kind: 'number', maximum: 1, minimum: 0, step: 0.05 };
  }
  const kindByType: Record<StyleValueDataType, AuthoringControlHint['kind']> = {
    boolean: 'switch',
    color: 'color',
    enum: 'select',
    integer: 'number',
    number: 'number',
    numberList: 'numberList',
    object: 'nested',
    text: 'text'
  };
  return {
    kind: kindByType[definition.dataType],
    step: definition.dataType === 'number' ? 0.1 : definition.dataType === 'integer' ? 1 : undefined
  };
}

const nodeLayoutFields: AuthoringNestedFieldMetadata[] = [
  {
    control: { kind: 'select' }, default: valueDefault('standard'),
    description: 'Choose the standard node body or a structured card layout.', label: 'Layout type', level: 'basic',
    order: 0, path: 'type', required: true, valueType: 'enum', values: [...nodeLayoutTypes]
  },
  {
    control: { kind: 'select' }, default: valueDefault('horizontal'),
    description: 'Direction of icon and content inside the card.', label: 'Direction', level: 'basic',
    order: 1, path: 'direction', required: false, valueType: 'enum', values: [...nodeLayoutDirections]
  },
  {
    control: { kind: 'select' }, default: valueDefault('left'),
    description: 'Icon position inside the card shell.', label: 'Icon placement', level: 'basic',
    order: 2, path: 'icon.placement', required: false, valueType: 'enum', values: [...nodeLayoutIconPlacements]
  },
  {
    control: { kind: 'number', minimum: 1, step: 1 }, default: valueDefault(44),
    description: 'Icon box width in pixels.', label: 'Icon width', level: 'basic',
    order: 3, path: 'icon.width', required: false, valueType: 'number'
  },
  {
    control: { kind: 'number', minimum: 1, step: 1 }, default: valueDefault(44),
    description: 'Icon box height in pixels.', label: 'Icon height', level: 'basic',
    order: 4, path: 'icon.height', required: false, valueType: 'number'
  },
  {
    control: { kind: 'select' }, default: valueDefault('left'),
    description: 'Horizontal alignment for title and subtitle content.', label: 'Content alignment', level: 'basic',
    order: 5, path: 'content.align', required: false, valueType: 'enum', values: [...nodeLayoutContentAlignments]
  },
  {
    control: { kind: 'text', placeholder: 'name' }, default: valueDefault('name'),
    description: 'Object field path used for the card title.', examples: ['name', 'data.title'],
    label: 'Title field', level: 'basic', order: 6, path: 'content.titleField', required: false, valueType: 'text'
  },
  {
    control: { kind: 'text', placeholder: 'data.subtitle' }, default: noDefault(),
    description: 'Optional object field path used for the card subtitle.', examples: ['data.subtitle', 'labels.role'],
    label: 'Subtitle field', level: 'advanced', order: 7, path: 'content.subtitleField', required: false, valueType: 'text'
  }
];

const aliasesByKey: Record<string, string[]> = {
  backgroundColor: ['fill color'],
  borderColor: ['stroke color'],
  controlPointDistance: ['bezier bend', 'curve amount', 'curve radius'],
  controlPointStepSize: ['parallel curve spacing', 'parallel link spacing'],
  controlPointWeight: ['bezier balance', 'curve midpoint'],
  curveStyle: ['edge routing'],
  directionalStrokes: ['bandwidth lanes', 'direction lanes'],
  icon: ['asset', 'symbol'],
  lineColor: ['edge color', 'link color'],
  lineWidth: ['edge width', 'link width'],
  nodeLayout: ['card layout'],
  sourceLabel: ['source port', 'endpoint label'],
  targetLabel: ['target port', 'endpoint label']
};

function visibilityForKey(key: string) {
  if (key === 'shapePolygonPoints') return { equals: 'polygon', path: 'shape' };
  if (key === 'lineGradientStopColors' || key === 'lineGradientStopPositions') {
    return { equals: 'linearGradient', path: 'lineFill' };
  }
  if (key === 'controlPointDistance' || key === 'controlPointStepSize' || key === 'controlPointWeight') {
    return { equals: 'bezier', path: 'curveStyle' };
  }
  if (key.startsWith('direction') && key !== 'directionalStrokes') {
    return { equals: true, path: 'directionalStrokes' };
  }
  return undefined;
}

function conflictsForDefinition(definition: StyleKeyDefinition): string[] | undefined {
  const pairs: Record<string, string[]> = {
    backgroundColor: ['fill'],
    borderColor: ['stroke'],
    borderWidth: ['strokeWidth'],
    fill: ['backgroundColor'],
    stroke: ['borderColor'],
    strokeWidth: ['borderWidth']
  };
  return pairs[definition.key]?.filter((conflict) => styleDefinitions.some((candidate) => (
    candidate.key === conflict
    && candidate.targets.some((target) => definition.targets.includes(target))
  )));
}

function expandedTargets(definition: StyleKeyDefinition): StyleTargetKind[] {
  return definition.targets.includes('link')
    ? [...new Set([...definition.targets, 'linkDirection' as const])]
    : [...definition.targets];
}

export const styleAuthoringMetadata: readonly AuthoringFieldMetadata[] = styleDefinitions.map((definition, order) => ({
  aliases: aliasesByKey[definition.key],
  conflictsWith: conflictsForDefinition(definition),
  control: controlForDefinition(definition),
  default: definition.default,
  description: definition.use,
  examples: definition.values?.slice(0, 3),
  group: groupForKey(definition.key),
  label: definition.label,
  level: levelForDefinition(definition),
  nestedFields: definition.key === 'nodeLayout' ? nodeLayoutFields : undefined,
  order,
  path: definition.key,
  targets: expandedTargets(definition),
  valueType: definition.dataType,
  values: definition.values ? [...definition.values] : undefined,
  visibleWhen: visibilityForKey(definition.key)
}));

export const styleAuthoringMetadataByTarget: Record<StyleTargetKind, AuthoringFieldMetadata[]> = {
  node: styleAuthoringMetadata.filter((field) => field.targets.includes('node')),
  link: styleAuthoringMetadata.filter((field) => field.targets.includes('link')),
  linkDirection: styleAuthoringMetadata.filter((field) => field.targets.includes('linkDirection')),
  path: styleAuthoringMetadata.filter((field) => field.targets.includes('path')),
  region: styleAuthoringMetadata.filter((field) => field.targets.includes('region')),
  shape: styleAuthoringMetadata.filter((field) => field.targets.includes('shape')),
  callout: styleAuthoringMetadata.filter((field) => field.targets.includes('callout')),
  text: styleAuthoringMetadata.filter((field) => field.targets.includes('text'))
};

export function styleAuthoringFieldForKey(target: StyleTargetKind, key: string): AuthoringFieldMetadata | undefined {
  return styleAuthoringMetadataByTarget[target].find((field) => field.path === key);
}

export function searchStyleAuthoringMetadata(target: StyleTargetKind, query: string): AuthoringFieldMetadata[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return styleAuthoringMetadataByTarget[target];
  return styleAuthoringMetadataByTarget[target].filter((field) => (
    [field.path, field.label, field.description, field.group, ...(field.aliases || [])]
      .some((value) => value.toLowerCase().includes(normalized))
  ));
}
