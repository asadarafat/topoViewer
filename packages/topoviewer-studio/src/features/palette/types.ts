import type { AuthoringClipboardItem } from 'topoviewer/authoring';

export interface StudioUserPreset {
  id: string;
  item: AuthoringClipboardItem;
  name: string;
}

export type StudioPaletteTemplateId =
  | 'node'
  | 'router'
  | 'switch'
  | 'service'
  | 'controller'
  | 'external'
  | 'shape'
  | 'callout'
  | 'path'
  | 'region'
  | `preset:${string}`;
