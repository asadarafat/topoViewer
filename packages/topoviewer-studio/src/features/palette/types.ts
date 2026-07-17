import type { IconSpec } from 'topoviewer';
import type { AuthoringClipboardItem } from 'topoviewer/authoring';

export interface StudioUserPreset {
  id: string;
  icons?: Record<string, IconSpec>;
  item: AuthoringClipboardItem;
  name: string;
}

export type StudioEdgeTemplateId = 'link' | 'parallel-link' | 'parent-link-pipe' | 'directional-link';

export type StudioPaletteTemplateId =
  'node' | 'router' | 'switch' | 'service' | 'controller' | 'external' | 'parent-child' | 'link' | 'parallel-link' | 'parent-link-pipe' | 'directional-link' | 'shape' | 'callout' | 'text' | 'path' | 'region' | `preset:${string}`;
