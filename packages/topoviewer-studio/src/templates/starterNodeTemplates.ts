import type { IconSpec } from 'topoviewer';

export type StudioVisualNodeTemplateId = 'controller' | 'router' | 'server' | 'switch';

export interface StudioVisualNodeTemplate {
  iconKey: string;
  icon: IconSpec & { svg: string };
}

export interface StudioVisualNodeTemplateColors {
  fill: string;
  stroke: string;
}

type NokiaSvgFactory = (colors: StudioVisualNodeTemplateColors) => string;

function safeColor(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

const nokiaSvgFactories: Record<StudioVisualNodeTemplateId, NokiaSvgFactory> = {
  controller: ({ fill, stroke }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="${safeColor(fill)}"/>
  <g fill="none" stroke="${safeColor(stroke)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M82.8 60c0 12.6-10.2 22.8-22.8 22.8S37.2 72.6 37.2 60 47.4 37.2 60 37.2c6.3 0 12 2.6 16.2 6.7 4 4.2 6.6 9.9 6.6 16.1z"/>
    <path d="m92.4 27.8 6.7 7.2c1.2 1.2 1.2 2.9 0 4.1l-6.7 7.7M59.8 37.2h38.1"/>
    <path d="M27.6 92.2 20.9 85c-1.2-1.2-1.2-2.9 0-4.1l6.7-7.7M60.2 82.8H22.1"/>
  </g>
</svg>`,
  router: ({ fill, stroke }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="${safeColor(fill)}"/>
  <g fill="none" stroke="${safeColor(stroke)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M71.7 19.7V48h28"/>
    <path d="m91.2 38.5 7.5 7.6c1.3 1.3 1.3 3.1 0 4.3L91.1 58"/>
    <path d="M20 47.8h28.4v-28"/>
    <path d="m38.8 28.3 7.6-7.5c1.3-1.3 3.1-1.3 4.3 0l7.7 7.6"/>
    <path d="M48 100.3V72H20"/>
    <path d="m28.5 81.5-7.5-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="M100 71.9H71.6v28"/>
    <path d="m81.2 91.4-7.6 7.5c-1.3 1.3-3.1 1.3-4.3 0l-7.7-7.6"/>
  </g>
</svg>`,
  server: ({ fill, stroke }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="${safeColor(fill)}"/>
  <g fill="none" stroke="${safeColor(stroke)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="M84.9 95H35.1c-1.1 0-2-.9-2-2V27c0-1.1.9-2 2-2h49.7c1.1 0 2 .9 2 2v66c.1 1.1-.8 2-1.9 2z"/>
    <path d="M35.1 41.3h43.6M35.1 53.8h43.6M35.1 66.2h43.6M35.1 78.7h43.6"/>
  </g>
</svg>`,
  switch: ({ fill, stroke }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="${safeColor(fill)}"/>
  <g fill="none" stroke="${safeColor(stroke)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <path d="m91.5 27.3 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7M28.5 46.9l-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="m91.5 73.1 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7M28.5 92.7l-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7"/>
    <path d="M96.6 36.8H67.9l-16 45.9H23.2M96.6 82.7H67.9l-16-45.9H23.2"/>
  </g>
</svg>`
};

const defaultColors: Record<StudioVisualNodeTemplateId, StudioVisualNodeTemplateColors> = {
  controller: { fill: '#7b1fa2', stroke: '#ffffff' },
  router: { fill: '#1976d2', stroke: '#ffffff' },
  server: { fill: '#2e7d32', stroke: '#ffffff' },
  switch: { fill: '#0288d1', stroke: '#ffffff' }
};

function visualTemplate(id: StudioVisualNodeTemplateId, alt: string, glyph: string): StudioVisualNodeTemplate {
  const colors = defaultColors[id];
  return {
    iconKey: `nokia.${id}`,
    icon: {
      alt,
      fill: colors.fill,
      glyph,
      stroke: colors.stroke,
      svg: nokiaSvgFactories[id](colors)
    }
  };
}

export const studioVisualNodeTemplates: Record<StudioVisualNodeTemplateId, StudioVisualNodeTemplate> = {
  controller: visualTemplate('controller', 'Nokia controller', 'CTRL'),
  router: visualTemplate('router', 'Nokia router', 'RTR'),
  server: visualTemplate('server', 'Nokia server', 'SRV'),
  switch: visualTemplate('switch', 'Nokia switch', 'SW')
};

function normalizedTemplateId(templateId: string): StudioVisualNodeTemplateId | undefined {
  if (templateId === 'service') return 'server';
  return Object.hasOwn(studioVisualNodeTemplates, templateId) ? (templateId as StudioVisualNodeTemplateId) : undefined;
}

export function studioVisualNodeTemplate(templateId: string): StudioVisualNodeTemplate | undefined {
  const normalized = normalizedTemplateId(templateId);
  return normalized ? studioVisualNodeTemplates[normalized] : undefined;
}

export function studioVisualNodeTemplateDataUri(templateId: string, colors?: StudioVisualNodeTemplateColors): string | undefined {
  const normalized = normalizedTemplateId(templateId);
  if (!normalized) return undefined;
  const svg = colors ? nokiaSvgFactories[normalized](colors) : studioVisualNodeTemplates[normalized].icon.svg;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
