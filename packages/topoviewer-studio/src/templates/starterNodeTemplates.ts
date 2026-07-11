import type { IconSpec } from 'topoviewer';

export type StudioVisualNodeTemplateId = 'router' | 'switch';

export interface StudioVisualNodeTemplate {
  iconKey: string;
  icon: IconSpec & { svg: string };
}

const routerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="#1976d2"/>
  <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M71.7 19.7V48h28"/>
    <path d="m91.2 38.5 7.5 7.6c1.3 1.3 1.3 3.1 0 4.3L91.1 58"/>
    <path d="M20 47.8h28.4v-28"/>
    <path d="m38.8 28.3 7.6-7.5c1.3-1.3 3.1-1.3 4.3 0l7.7 7.6"/>
    <path d="M48 100.3V72H20"/>
    <path d="m28.5 81.5-7.5-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="M100 71.9H71.6v28"/>
    <path d="m81.2 91.4-7.6 7.5c-1.3 1.3-3.1 1.3-4.3 0l-7.7-7.6"/>
  </g>
</svg>`;

const switchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="#00897b"/>
  <g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="m91.5 27.3 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7"/>
    <path d="m28.5 46.9-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="m91.5 73.1 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7"/>
    <path d="m28.5 92.7-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="M96.6 36.8H67.9l-16 45.9H23.2"/>
    <path d="M96.6 82.7H67.9l-16-45.9H23.2"/>
  </g>
</svg>`;

export const studioVisualNodeTemplates: Record<StudioVisualNodeTemplateId, StudioVisualNodeTemplate> = {
  router: {
    iconKey: 'router.generic',
    icon: { alt: 'Router', fill: '#1976d2', glyph: 'R', stroke: '#bbdefb', svg: routerSvg }
  },
  switch: {
    iconKey: 'switch.generic',
    icon: { alt: 'Switch', fill: '#00897b', glyph: 'SW', stroke: '#b2dfdb', svg: switchSvg }
  }
};

export function studioVisualNodeTemplate(templateId: string): StudioVisualNodeTemplate | undefined {
  return studioVisualNodeTemplates[templateId as StudioVisualNodeTemplateId];
}

export function studioVisualNodeTemplateDataUri(templateId: string): string | undefined {
  const svg = studioVisualNodeTemplate(templateId)?.icon.svg;
  return svg ? `data:image/svg+xml,${encodeURIComponent(svg)}` : undefined;
}
