import type { GraphLink, TopoDocument } from 'topoviewer';
import {
  createAuthoringCallout,
  createAuthoringLink,
  createAuthoringNode,
  createAuthoringPath,
  createAuthoringRegion,
  createAuthoringShape,
  createAuthoringText,
  pasteAuthoringClipboard,
  type AuthoringEditPlan,
  type CreateAuthoringPathOptions
} from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioSelection } from '../contracts/project';
import type { StudioEdgeTemplateId, StudioPaletteTemplateId, StudioUserPreset } from '../features/palette/types';
import { createStudioPaletteNodePlan } from './controllerTemplates';
import { insertionPlan, positionOf } from './controllerUtils';

export interface StudioPaletteCreationPlan {
  additionalMutations?: StudioSourceMutation[];
  commandId: string;
  label: string;
  plan: AuthoringEditPlan;
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
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
  templateId: StudioEdgeTemplateId;
}

function defaultPalettePosition(document: TopoDocument) {
  const count = (document.graph?.nodes?.length || 0)
    + (document.graph?.regions?.length || 0)
    + (document.diagram?.shapes?.length || 0)
    + (document.diagram?.callouts?.length || 0)
    + (document.diagram?.texts?.length || 0);
  return { x: 120 + (count % 3) * 240, y: 120 + Math.floor(count / 3) * 160 };
}

export function applyStudioEdgeTemplate(
  _document: TopoDocument,
  value: GraphLink,
  templateId: StudioEdgeTemplateId
): GraphLink {
  if (templateId === 'parallel-link') {
    value.name = 'New Parallel Link';
    value.labels = { ...value.labels, link: 'parallel' };
  }
  if (templateId === 'parent-link-pipe') {
    value.name = 'Parent Link Pipe';
    value.labels = { ...value.labels, link: 'carrier' };
    value.style = {
      ...value.style,
      curveStyle: 'smooth-taxi',
      lineColor: '#fb7185',
      pipe: true,
      pipeOpacity: 0.18,
      pipeWidth: 24,
      targetArrowShape: 'none'
    };
  }
  if (templateId === 'directional-link') {
    value.name = 'Directional Traffic';
    value.directions = {
      sourceToTarget: { label: 'A to B' },
      targetToSource: { label: 'B to A' }
    };
    value.style = {
      ...value.style,
      directionalStrokes: true,
      directionCenterGap: 60,
      directionStartGap: 14
    };
  }
  return value;
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
  const scopePath = document.attention?.links
    ? ['attention', 'links']
    : document.attention
      ? ['attention']
      : [];
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
      expandOnClick: true
    }
  };
}

export function planStudioEdgeCreation(options: StudioEdgeCreationOptions): StudioPaletteCreationPlan {
  const { document, source, sourceHandle, target, targetHandle, templateId } = options;
  const working = structuredClone(document);
  const links: GraphLink[] = [];
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

  if (templateId === 'parallel-link') {
    const laneNames = ['Link A', 'Link B', 'Link C'];
    const laneColors = ['#0f766e', '#2563eb', '#dc2626'];
    for (let index = 0; index < 3; index += 1) {
      createLink((value) => {
        applyStudioEdgeTemplate(working, value, templateId);
        value.name = laneNames[index];
        value.style = {
          ...value.style,
          controlPointStepSize: 34,
          curveStyle: 'bezier',
          lineColor: laneColors[index],
          lineWidth: 3,
          targetArrowShape: 'none'
        };
      });
    }
    return {
      additionalMutations: [linkGroupingMutation(document)],
      commandId: `create-${links.map((link) => link.id).join('-')}`,
      label: 'Create parallel link group',
      plan: { insertions: links.map(insertionForLink), removals: [], updates: [] }
    };
  }

  if (templateId === 'parent-link-pipe') {
    const carrier = createLink((value) => applyStudioEdgeTemplate(working, value, templateId));
    createLink((value) => {
      value.name = 'Child Link Lane';
      value.parent = carrier.id;
      value.labels = { ...value.labels, link: 'child' };
      value.style = {
        ...value.style,
        curveStyle: 'smooth-taxi',
        laneGap: 8,
        laneWidth: 6,
        lineColor: '#22c55e',
        lineWidth: 3,
        targetArrowShape: 'triangle'
      };
    });
    return {
      commandId: `create-${links.map((link) => link.id).join('-')}`,
      label: 'Create parent link pipe',
      plan: { insertions: links.map(insertionForLink), removals: [], updates: [] }
    };
  }

  const value = createLink((link) => applyStudioEdgeTemplate(working, link, templateId));
  return {
    commandId: `create-${value.id}`,
    label: templateId === 'directional-link' ? 'Create directional traffic link' : 'Create link',
    plan: insertionPlan(['graph', 'links'], { id: value.id, kind: 'link' }, value as unknown as Record<string, unknown>)
  };
}

export function planStudioPaletteCreation(options: StudioPaletteCreationOptions): StudioPaletteCreationPlan {
  const { document, pathMode, presets, selection, stylesheet, templateId } = options;
  const target = options.position || defaultPalettePosition(document);
  if (templateId.startsWith('preset:')) {
    const preset = presets.find((candidate) => `preset:${candidate.id}` === templateId);
    if (!preset) throw new Error(`Palette preset "${templateId}" does not exist.`);
    const sourcePosition = positionOf(preset.item.value.position) || { x: 0, y: 0 };
    return {
      commandId: `create-${preset.id}`,
      label: `Create ${preset.name}`,
      plan: pasteAuthoringClipboard(document, [preset.item], {
        x: target.x - sourcePosition.x,
        y: target.y - sourcePosition.y
      })
    };
  }
  if (templateId === 'link' || templateId === 'parallel-link' || templateId === 'parent-link-pipe' || templateId === 'directional-link') {
    const nodes = selection.filter((item) => item.kind === 'node');
    if (nodes.length !== 2) throw new Error('Link creation requires exactly two selected nodes.');
    return planStudioEdgeCreation({
      document,
      source: nodes[0].id,
      target: nodes[1].id,
      templateId
    });
  }
  if (templateId === 'path') {
    const value = createAuthoringPath(document, {
      mode: pathMode,
      sequence: selection.filter((item) => item.kind === 'node').map((item) => item.id)
    });
    return {
      commandId: `create-${value.id}`,
      label: 'Create path',
      plan: insertionPlan(['graph', 'paths'], { id: value.id, kind: 'path' }, value as unknown as Record<string, unknown>)
    };
  }
  if (templateId === 'parent-child') {
    const parent = createAuthoringNode(document, { kind: 'node', position: target, selectedLayerIds: ['physical'] });
    parent.name = 'Parent Node';
    parent.labels = { ...parent.labels, role: 'parent' };
    parent.style = { ...parent.style, shape: 'roundRectangle', width: 260, height: 150 };
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
    child.name = 'Child Node';
    child.parent = parent.id;
    child.labels = { ...child.labels, role: 'child' };
    child.style = { ...child.style, width: 112, height: 54 };
    return {
      commandId: `create-${parent.id}`,
      label: 'Create parent with child',
      plan: {
        insertions: [
          { path: ['graph', 'nodes'], selection: { id: parent.id, kind: 'node' }, value: parent as unknown as Record<string, unknown> },
          { path: ['graph', 'nodes'], selection: { id: child.id, kind: 'node' }, value: child as unknown as Record<string, unknown> }
        ],
        removals: [],
        updates: []
      }
    };
  }
  if (templateId === 'region') {
    const value = createAuthoringRegion(document, {
      members: selection.filter((item) => item.kind === 'node').map((item) => item.id),
      position: target
    });
    return {
      commandId: `create-${value.id}`,
      label: 'Create region',
      plan: insertionPlan(['graph', 'regions'], { id: value.id, kind: 'region' }, value as unknown as Record<string, unknown>)
    };
  }
  if (templateId === 'shape' || templateId === 'callout' || templateId === 'text') {
    const value = templateId === 'shape'
      ? createAuthoringShape(document, { position: target })
      : templateId === 'callout'
        ? createAuthoringCallout(document, { position: target })
        : createAuthoringText(document, { position: target });
    return {
      commandId: `create-${value.id}`,
      label: `Create ${templateId}`,
      plan: insertionPlan(['diagram', `${templateId}s`], { id: value.id, kind: templateId }, value as unknown as Record<string, unknown>)
    };
  }
  const { additionalMutations, value } = createStudioPaletteNodePlan(document, stylesheet, templateId, target);
  return {
    additionalMutations,
    commandId: `create-${value.id}`,
    label: `Create ${value.name}`,
    plan: insertionPlan(['graph', 'nodes'], { id: value.id, kind: 'node' }, value as unknown as Record<string, unknown>)
  };
}
