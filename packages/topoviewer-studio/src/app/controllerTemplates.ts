import type { GraphNode, TopoDocument } from 'topoviewer';
import { createAuthoringNode, type AuthoringNodeKind } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioPaletteTemplateId } from '../features/palette/types';
import { studioVisualNodeTemplate } from '../templates/starterNodeTemplates';

export interface StudioPaletteNodePlan {
  additionalMutations: StudioSourceMutation[];
  style?: Record<string, unknown>;
  value: GraphNode;
}

export function createStudioPaletteNodePlan(document: TopoDocument, stylesheet: Record<string, unknown> | undefined, templateId: StudioPaletteTemplateId, position: { x: number; y: number }): StudioPaletteNodePlan {
  const value = createAuthoringNode(document, {
    kind: templateId as AuthoringNodeKind,
    position,
    selectedLayerIds: ['physical']
  });
  const visualTemplate = studioVisualNodeTemplate(templateId);
  let style: Record<string, unknown> | undefined;
  if (templateId === 'controller') {
    value.data = { ...value.data, subtitle: 'Control plane' };
    style = {
      shape: 'roundRectangle',
      width: 190,
      height: 64,
      nodeLayout: {
        type: 'card',
        direction: 'horizontal',
        icon: { placement: 'left', width: 44, height: 44 },
        content: {
          align: 'left',
          titleField: 'labels.name',
          subtitleField: 'data.subtitle'
        }
      }
    };
  } else if (templateId === 'router' || templateId === 'switch') {
    style = { shape: 'square', width: 64, height: 64 };
  } else if (templateId === 'service') {
    value.data = { ...value.data, subtitle: 'Service' };
    style = {
      shape: 'roundRectangle',
      width: 176,
      height: 60,
      nodeLayout: {
        type: 'card',
        direction: 'horizontal',
        icon: { placement: 'left', width: 40, height: 40 },
        content: {
          align: 'left',
          titleField: 'labels.name',
          subtitleField: 'data.subtitle'
        }
      }
    };
  }
  if (!visualTemplate) return { additionalMutations: [], style, value };

  style = { ...style, icon: visualTemplate.iconKey };
  const icons = stylesheet?.icons && typeof stylesheet.icons === 'object' && !Array.isArray(stylesheet.icons) ? (stylesheet.icons as Record<string, unknown>) : undefined;
  const additionalMutations: StudioSourceMutation[] = Object.hasOwn(icons || {}, visualTemplate.iconKey)
    ? []
    : [
        {
          document: 'stylesheet',
          kind: 'upsert-value',
          path: ['icons', visualTemplate.iconKey],
          scopePath: icons ? ['icons'] : [],
          value: visualTemplate.icon
        }
      ];
  return { additionalMutations, style, value };
}
