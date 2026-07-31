import type { GraphLink, StyleRule, StyleTargetKind, TopoDocument } from 'topoviewer';
import {
  createAuthoringCallout,
  createAuthoringLink,
  createAuthoringNode,
  createAuthoringPath,
  createAuthoringRegion,
  createAuthoringShape,
  createAuthoringText,
  pasteAuthoringClipboard,
  resolveAuthoringCalloutSize,
  resolveAuthoringRegionSize,
  resolveAuthoringShapeSize,
  styleExactIdSelector,
  type AuthoringEditPlan,
  type CreateAuthoringPathOptions
} from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../../contracts/commands';
import type { StudioSelection } from '../../contracts/project';
import type { StudioEdgeAuthoringTemplateId, StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from './types';
import { createStudioPaletteNodePlan } from './paletteTemplates';
import { insertionPlan } from '../../commands/authoringPlans';
import { studioPosition } from '../../contracts/geometry';

export interface StudioPaletteCreationPlan {
  additionalMutations?: StudioSourceMutation[];
  commandId: string;
  label: string;
  plan: AuthoringEditPlan;
}

interface StudioPaletteDraftPlan extends StudioPaletteCreationPlan {
  appearanceRules?: StyleRule[];
}

interface StudioPaletteCreationOptions {
  document: TopoDocument;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
  position?: { x: number; y: number };
  presets: StudioUserPreset[];
  selection: StudioSelection[];
  stylesheet?: Record<string, unknown>;
  templateId: StudioPaletteTemplateId;
}

interface StudioEdgeCreationOptions {
  document: TopoDocument;
  presets?: StudioUserPreset[];
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  stylesheet?: Record<string, unknown>;
  templateId: StudioEdgeAuthoringTemplateId;
}

export interface StudioRegionCreationOptions {
  document: TopoDocument;
  members?: string[];
  parentId?: string;
  position: { x: number; y: number };
  size?: { height: number; width: number };
  stylesheet?: Record<string, unknown>;
}

const DEFAULT_LAYER_NAMES: Record<string, string> = {
  annotations: 'Annotations',
  paths: 'Paths',
  physical: 'Physical'
};

const PARALLEL_LINK_SELECTOR = 'link[labels.link = "parallel"]';
const STYLED_OBJECT_KINDS = new Set<StyleTargetKind>(['callout', 'link', 'linkDirection', 'node', 'path', 'region', 'shape', 'text']);

function objectRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function takeObjectStyle(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const inline = objectRecord(value.style);
  const style = inline ? structuredClone(inline) : {};
  if (value.icon !== undefined) style.icon = structuredClone(value.icon);
  delete value.icon;
  delete value.style;
  return Object.keys(style).length > 0 ? style : undefined;
}

function stylesheetRuleMutations(stylesheet: Record<string, unknown> | undefined, rules: StyleRule[]): StudioSourceMutation[] {
  if (rules.length === 0) return [];
  if (Array.isArray(stylesheet?.stylesheet)) {
    return rules.map((rule) => ({
      document: 'stylesheet' as const,
      kind: 'insert-value' as const,
      path: ['stylesheet'],
      value: rule
    }));
  }
  return [
    {
      document: 'stylesheet',
      kind: 'upsert-value',
      path: ['stylesheet'],
      scopePath: [],
      value: rules
    }
  ];
}

function stylesheetRulesForCreation(creation: StudioPaletteCreationPlan): StyleRule[] {
  return creation.plan.insertions.flatMap((insertion) => {
    const kind = insertion.selection.kind as StyleTargetKind;
    if (!STYLED_OBJECT_KINDS.has(kind)) return [];
    const value = insertion.value;
    const id = String(value.id || insertion.selection.id);
    const style = takeObjectStyle(value);
    const rules: StyleRule[] = style ? [{ selector: styleExactIdSelector(kind, id), style }] : [];

    if (kind !== 'link') return rules;
    const directions = objectRecord(value.directions);
    for (const [directionKey, directionValue] of Object.entries(directions || {})) {
      const direction = objectRecord(directionValue);
      if (!direction) continue;
      const directionStyle = takeObjectStyle(direction);
      if (!directionStyle) continue;
      const directionId = String(direction.id || `${id}:${directionKey}`);
      rules.push({
        selector: styleExactIdSelector('linkDirection', directionId),
        style: directionStyle
      });
    }
    return rules;
  });
}

function presetIconMutations(stylesheet: Record<string, unknown> | undefined, preset: StudioUserPreset): StudioSourceMutation[] {
  const sourceIcons = preset.icons || {};
  const targetIcons = objectRecord(stylesheet?.icons);
  return Object.entries(sourceIcons).flatMap(([key, value]) => {
    if (targetIcons?.[key] && JSON.stringify(targetIcons[key]) === JSON.stringify(value)) return [];
    return [
      {
        document: 'stylesheet' as const,
        kind: 'upsert-value' as const,
        path: ['icons', key],
        scopePath: targetIcons ? ['icons'] : [],
        value: structuredClone(value)
      }
    ];
  });
}

function requiredLayerMutations(document: TopoDocument, plan: AuthoringEditPlan): StudioSourceMutation[] {
  const declared = new Set((document.graph?.layers || []).map((layer) => layer.id));
  const required = new Set(
    plan.insertions.flatMap((insertion) => {
      const layers = insertion.value.layers;
      return Array.isArray(layers) ? layers.filter((layerId): layerId is string => typeof layerId === 'string' && Boolean(layerId.trim())) : [];
    })
  );

  return [...required]
    .filter((layerId) => !declared.has(layerId))
    .map((layerId) => ({
      document: 'topology' as const,
      kind: 'insert-value' as const,
      path: ['graph', 'layers'],
      value: { id: layerId, labels: { name: DEFAULT_LAYER_NAMES[layerId] || layerId } }
    }));
}

function withRequiredLayers(document: TopoDocument, creation: StudioPaletteDraftPlan): StudioPaletteDraftPlan {
  const layerMutations = requiredLayerMutations(document, creation.plan);
  if (layerMutations.length === 0) return creation;
  return {
    ...creation,
    additionalMutations: [...layerMutations, ...(creation.additionalMutations || [])]
  };
}

function finalizeStudioCreation(document: TopoDocument, stylesheet: Record<string, unknown> | undefined, creation: StudioPaletteDraftPlan): StudioPaletteCreationPlan {
  const layered = withRequiredLayers(document, creation);
  const styleMutations = stylesheetRuleMutations(stylesheet, [...(layered.appearanceRules || []), ...stylesheetRulesForCreation(layered)]);
  const additionalMutations = [...(layered.additionalMutations || []), ...styleMutations];
  const finalized: StudioPaletteCreationPlan = {
    commandId: layered.commandId,
    label: layered.label,
    plan: layered.plan
  };
  if (additionalMutations.length === 0) {
    return finalized;
  }
  return { ...finalized, additionalMutations };
}

export function planStudioRegionCreation(options: StudioRegionCreationOptions): StudioPaletteCreationPlan {
  const dimensions = resolveAuthoringRegionSize(options.size);
  const value = createAuthoringRegion(options.document, {
    members: options.members,
    parentId: options.parentId,
    position: options.position,
    size: dimensions
  });
  return finalizeStudioCreation(options.document, options.stylesheet, {
    appearanceRules: [{
      selector: styleExactIdSelector('region', value.id),
      style: {
        draggable: true,
        height: dimensions.height,
        selectable: true,
        width: dimensions.width
      }
    }],
    commandId: `create-${value.id}`,
    label: options.parentId ? 'Create nested region' : 'Create region',
    plan: insertionPlan(['graph', 'regions'], { id: value.id, kind: 'region' }, value as unknown as Record<string, unknown>)
  });
}

function defaultPalettePosition(document: TopoDocument) {
  const count = (document.graph?.nodes?.length || 0) + (document.graph?.regions?.length || 0) + (document.diagram?.shapes?.length || 0) + (document.diagram?.callouts?.length || 0) + (document.diagram?.texts?.length || 0);
  return { x: 120 + (count % 3) * 240, y: 120 + Math.floor(count / 3) * 160 };
}

export function applyStudioEdgeTemplate(_document: TopoDocument, value: GraphLink, templateId: StudioEdgeTemplateId): Record<string, unknown> | undefined {
  if (templateId === 'parallel-link') {
    value.labels = { ...value.labels, link: 'parallel' };
  }
  if (templateId === 'parent-link-pipe') {
    value.labels = { ...value.labels, name: 'Parent Link Pipe' };
    value.labels = { ...value.labels, link: 'carrier' };
    return {
      curveStyle: 'smooth-taxi',
      pipe: true,
      pipeOpacity: 0.18,
      pipeWidth: 24,
      targetArrowShape: 'none'
    };
  }
  if (templateId === 'directional-link') {
    value.labels = { ...value.labels, name: 'Directional Traffic' };
    value.directions = {
      sourceToTarget: { label: 'A to B' },
      targetToSource: { label: 'B to A' }
    };
    return {
      directionalStrokes: true,
      directionCenterGap: 60,
      directionStartGap: 14
    };
  }
  return undefined;
}

function insertionForLink(value: GraphLink) {
  return {
    path: ['graph', 'links'],
    selection: { id: value.id, kind: 'link' as const },
    value: value as unknown as Record<string, unknown>
  };
}

function linkGroupingMutation(document: TopoDocument): StudioSourceMutation {
  const current = document.attention?.links?.grouping;
  const scopePath = document.attention?.links ? ['attention', 'links'] : document.attention ? ['attention'] : [];
  return {
    document: 'topology',
    kind: 'upsert-value',
    path: ['attention', 'links', 'grouping'],
    scopePath,
    value: {
      ...(current ? structuredClone(current) : {}),
      enabled: true,
      threshold: 2,
      by: ['endpoints', 'layer'],
      selector: PARALLEL_LINK_SELECTOR,
      expandOnClick: true
    }
  };
}

function legacyStudioLinkGroupingMutation(document: TopoDocument): StudioSourceMutation[] | undefined {
  const grouping = document.attention?.links?.grouping;
  const by = grouping?.by;
  const parallelLinkCount = (document.graph?.links || []).filter((link) => link.labels?.link === 'parallel').length;
  const isLegacyStudioGrouping =
    grouping !== undefined &&
    grouping.selector === undefined &&
    grouping.enabled === true &&
    grouping.threshold === 2 &&
    by?.length === 2 &&
    by[0] === 'endpoints' &&
    by[1] === 'layer' &&
    grouping.expandOnClick === true &&
    parallelLinkCount >= 3;
  return isLegacyStudioGrouping ? [linkGroupingMutation(document)] : undefined;
}

export function planStudioEdgeCreation(options: StudioEdgeCreationOptions): StudioPaletteCreationPlan {
  const { document, presets = [], source, sourceHandle, stylesheet, target, targetHandle, templateId } = options;
  const working = structuredClone(document);
  const links: GraphLink[] = [];
  const appearanceRules: StyleRule[] = [];
  const createLink = (configure?: (value: GraphLink) => void) => {
    const value = createAuthoringLink(working, {
      selectedLayerIds: ['physical'],
      source,
      sourceHandle,
      target,
      targetHandle
    });
    configure?.(value);
    working.graph = {
      ...working.graph,
      links: [...(working.graph?.links || []), value]
    };
    links.push(value);
    return value;
  };

  if (templateId.startsWith('preset:')) {
    const preset = presets.find((candidate) => `preset:${candidate.id}` === templateId);
    if (!preset) throw new Error(`Link preset "${templateId}" does not exist.`);
    if (preset.item.selection.kind !== 'link') throw new Error(`Object Palette item "${preset.name}" is not a link preset.`);
    const value = createLink((link) => {
      const presetValue = structuredClone(preset.item.value) as Record<string, unknown>;
      const endpoints = {
        id: link.id,
        source: link.source,
        sourceHandle: link.sourceHandle,
        target: link.target,
        targetHandle: link.targetHandle
      };
      Object.assign(link, presetValue, endpoints);
      delete (link as unknown as Record<string, unknown>).parent;
      delete (link as unknown as Record<string, unknown>).position;
      if (!endpoints.sourceHandle) delete link.sourceHandle;
      if (!endpoints.targetHandle) delete link.targetHandle;
    });
    return finalizeStudioCreation(document, stylesheet, {
      commandId: `create-${value.id}`,
      label: `Create ${preset.name}`,
      plan: insertionPlan(['graph', 'links'], { id: value.id, kind: 'link' }, value as unknown as Record<string, unknown>)
    });
  }

  if (templateId === 'parallel-link') {
    const laneNames = ['Link A', 'Link B', 'Link C'];
    const laneColors = ['#0f766e', '#2563eb', '#dc2626'];
    for (let index = 0; index < 3; index += 1) {
      createLink((value) => {
        applyStudioEdgeTemplate(working, value, templateId);
        value.labels = { ...value.labels, name: laneNames[index] };
        appearanceRules.push({
          selector: styleExactIdSelector('link', value.id),
          style: {
            controlPointStepSize: 34,
            curveStyle: 'bezier',
            lineColor: laneColors[index],
            lineWidth: 3,
            targetArrowShape: 'none'
          }
        });
      });
    }
    return finalizeStudioCreation(document, stylesheet, {
      additionalMutations: [linkGroupingMutation(document)],
      appearanceRules,
      commandId: `create-${links.map((link) => link.id).join('-')}`,
      label: 'Create parallel link group',
      plan: {
        insertions: links.map(insertionForLink),
        removals: [],
        updates: []
      }
    });
  }

  if (templateId === 'parent-link-pipe') {
    const carrier = createLink((value) => {
      const style = applyStudioEdgeTemplate(working, value, templateId);
      if (style) appearanceRules.push({ selector: styleExactIdSelector('link', value.id), style });
    });
    createLink((value) => {
      value.labels = { ...value.labels, name: 'Child Link Lane' };
      value.parent = carrier.id;
      value.labels = { ...value.labels, link: 'child' };
      appearanceRules.push({
        selector: styleExactIdSelector('link', value.id),
        style: {
          curveStyle: 'smooth-taxi',
          laneGap: 8,
          laneWidth: 6,
          lineWidth: 3,
          targetArrowShape: 'triangle'
        }
      });
    });
    return finalizeStudioCreation(document, stylesheet, {
      commandId: `create-${links.map((link) => link.id).join('-')}`,
      appearanceRules,
      label: 'Create parent link pipe',
      plan: {
        insertions: links.map(insertionForLink),
        removals: [],
        updates: []
      }
    });
  }

  const builtInTemplateId = templateId as StudioEdgeTemplateId;
  const value = createLink((link) => {
    const style = applyStudioEdgeTemplate(working, link, builtInTemplateId);
    if (style) appearanceRules.push({ selector: styleExactIdSelector('link', link.id), style });
  });
  return finalizeStudioCreation(document, stylesheet, {
    additionalMutations: legacyStudioLinkGroupingMutation(document),
    appearanceRules,
    commandId: `create-${value.id}`,
    label: templateId === 'directional-link' ? 'Create directional traffic link' : 'Create link',
    plan: insertionPlan(['graph', 'links'], { id: value.id, kind: 'link' }, value as unknown as Record<string, unknown>)
  });
}

export function planStudioPaletteCreation(options: StudioPaletteCreationOptions): StudioPaletteCreationPlan {
  const { document, pathMode, presets, selection, stylesheet, templateId } = options;
  const target = options.position || defaultPalettePosition(document);
  if (templateId.startsWith('preset:')) {
    const preset = presets.find((candidate) => `preset:${candidate.id}` === templateId);
    if (!preset) throw new Error(`Palette preset "${templateId}" does not exist.`);
    if (preset.item.selection.kind === 'link') throw new Error('Link presets require source and target endpoints. Activate the saved link in the Object Palette, then connect two nodes.');
    const sourcePosition = studioPosition(preset.item.value.position) || {
      x: 0,
      y: 0
    };
    const plan = pasteAuthoringClipboard(document, [preset.item], {
      x: target.x - sourcePosition.x,
      y: target.y - sourcePosition.y
    });
    const insertion = plan.insertions[0];
    if (insertion && objectRecord(preset.item.value.labels)?.name !== undefined) {
      insertion.value.labels = structuredClone(preset.item.value.labels);
    }
    return finalizeStudioCreation(document, stylesheet, {
      additionalMutations: presetIconMutations(stylesheet, preset),
      commandId: `create-${preset.id}`,
      label: `Create ${preset.name}`,
      plan
    });
  }
  if (templateId === 'link' || templateId === 'parallel-link' || templateId === 'parent-link-pipe' || templateId === 'directional-link') {
    const nodes = selection.filter((item) => item.kind === 'node');
    if (nodes.length !== 2) throw new Error('Link creation requires exactly two selected nodes.');
    return planStudioEdgeCreation({
      document,
      source: nodes[0].id,
      stylesheet,
      target: nodes[1].id,
      templateId
    });
  }
  if (templateId === 'path') {
    const value = createAuthoringPath(document, {
      mode: pathMode,
      sequence: selection.filter((item) => item.kind === 'node').map((item) => item.id)
    });
    return finalizeStudioCreation(document, stylesheet, {
      commandId: `create-${value.id}`,
      label: 'Create path',
      plan: insertionPlan(['graph', 'paths'], { id: value.id, kind: 'path' }, value as unknown as Record<string, unknown>)
    });
  }
  if (templateId === 'parent-child') {
    const parent = createAuthoringNode(document, {
      kind: 'node',
      position: target,
      selectedLayerIds: ['physical']
    });
    parent.labels = { ...parent.labels, name: 'Parent Node', role: 'parent' };
    const withParent = structuredClone(document);
    withParent.graph = {
      ...withParent.graph,
      nodes: [...(withParent.graph?.nodes || []), parent]
    };
    const child = createAuthoringNode(withParent, {
      kind: 'node',
      position: { x: target.x + 36, y: target.y + 62 },
      selectedLayerIds: ['physical']
    });
    child.labels = { ...child.labels, name: 'Child Node', role: 'child' };
    child.parent = parent.id;
    return finalizeStudioCreation(document, stylesheet, {
      appearanceRules: [
        { selector: styleExactIdSelector('node', parent.id), style: { height: 150, shape: 'roundRectangle', width: 260 } },
        { selector: styleExactIdSelector('node', child.id), style: { height: 54, width: 112 } }
      ],
      commandId: `create-${parent.id}`,
      label: 'Create parent with child',
      plan: {
        insertions: [
          {
            path: ['graph', 'nodes'],
            selection: { id: parent.id, kind: 'node' },
            value: parent as unknown as Record<string, unknown>
          },
          {
            path: ['graph', 'nodes'],
            selection: { id: child.id, kind: 'node' },
            value: child as unknown as Record<string, unknown>
          }
        ],
        removals: [],
        updates: []
      }
    });
  }
  if (templateId === 'region') {
    return planStudioRegionCreation({
      document,
      members: selection.filter((item) => item.kind === 'node').map((item) => item.id),
      position: target,
      stylesheet
    });
  }
  if (templateId === 'shape' || templateId === 'callout' || templateId === 'text') {
    const value = templateId === 'shape' ? createAuthoringShape(document, { position: target }) : templateId === 'callout' ? createAuthoringCallout(document, { position: target }) : createAuthoringText(document, { position: target });
    const shapeSize = templateId === 'shape' ? resolveAuthoringShapeSize() : undefined;
    const calloutSize = templateId === 'callout' ? resolveAuthoringCalloutSize() : undefined;
    const appearanceRules = shapeSize
      ? [{ selector: styleExactIdSelector('shape', value.id), style: { height: shapeSize.height, shape: 'rectangle', width: shapeSize.width } }]
      : calloutSize
        ? [{ selector: styleExactIdSelector('callout', value.id), style: { height: calloutSize.height, width: calloutSize.width } }]
        : undefined;
    return finalizeStudioCreation(document, stylesheet, {
      appearanceRules,
      commandId: `create-${value.id}`,
      label: `Create ${templateId}`,
      plan: insertionPlan(['diagram', `${templateId}s`], { id: value.id, kind: templateId }, value as unknown as Record<string, unknown>)
    });
  }
  const { additionalMutations, style, value } = createStudioPaletteNodePlan(document, stylesheet, templateId, target);
  return finalizeStudioCreation(document, stylesheet, {
    additionalMutations,
    appearanceRules: style ? [{ selector: styleExactIdSelector('node', value.id), style }] : undefined,
    commandId: `create-${value.id}`,
    label: `Create ${String(value.labels?.name || value.id)}`,
    plan: insertionPlan(['graph', 'nodes'], { id: value.id, kind: 'node' }, value as unknown as Record<string, unknown>)
  });
}
