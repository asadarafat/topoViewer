import type { TopoDocument } from 'topoviewer';
import {
  createAuthoringCallout,
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
import type { StudioPaletteTemplateId, StudioUserPreset } from '../features/palette/types';
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

function defaultPalettePosition(document: TopoDocument) {
  const count = (document.graph?.nodes?.length || 0)
    + (document.graph?.regions?.length || 0)
    + (document.diagram?.shapes?.length || 0)
    + (document.diagram?.callouts?.length || 0)
    + (document.diagram?.texts?.length || 0);
  return { x: 120 + (count % 3) * 240, y: 120 + Math.floor(count / 3) * 160 };
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
