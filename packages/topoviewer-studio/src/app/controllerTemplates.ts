import type { GraphNode, TopoDocument } from 'topoviewer';
import { createAuthoringNode, type AuthoringNodeKind } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioPaletteTemplateId } from '../features/palette/types';
import { studioVisualNodeTemplate } from '../templates/starterNodeTemplates';

export interface StudioPaletteNodePlan {
  additionalMutations: StudioSourceMutation[];
  value: GraphNode;
}

export function createStudioPaletteNodePlan(
  document: TopoDocument,
  stylesheet: Record<string, unknown> | undefined,
  templateId: StudioPaletteTemplateId,
  position: { x: number; y: number }
): StudioPaletteNodePlan {
  const value = createAuthoringNode(document, {
    kind: templateId as AuthoringNodeKind,
    position,
    selectedLayerIds: ['physical']
  });
  const visualTemplate = studioVisualNodeTemplate(templateId);
  if (!visualTemplate) return { additionalMutations: [], value };

  value.icon = visualTemplate.iconKey;
  const icons = stylesheet?.icons && typeof stylesheet.icons === 'object' && !Array.isArray(stylesheet.icons)
    ? stylesheet.icons as Record<string, unknown>
    : undefined;
  const additionalMutations: StudioSourceMutation[] = Object.hasOwn(icons || {}, visualTemplate.iconKey)
    ? []
    : [{
        document: 'stylesheet',
        kind: 'upsert-value',
        path: ['icons', visualTemplate.iconKey],
        scopePath: icons ? ['icons'] : [],
        value: visualTemplate.icon
      }];
  return { additionalMutations, value };
}
