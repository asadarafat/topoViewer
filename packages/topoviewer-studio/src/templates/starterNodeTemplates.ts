import type { IconSpec } from 'topoviewer';

export type StudioBuiltInIconId =
  | 'client'
  | 'cloud'
  | 'controller'
  | 'dcgw'
  | 'nsp'
  | 'pon'
  | 'rgw'
  | 'router'
  | 'server'
  | 'spine'
  | 'switch'
  | 'ue';

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

function nokiaSvg(colors: StudioVisualNodeTemplateColors, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">
  <rect width="120" height="120" fill="${safeColor(colors.fill)}"/>
  <g fill="none" stroke="${safeColor(colors.stroke)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    ${content}
  </g>
</svg>`;
}

const nokiaSvgFactories: Record<StudioBuiltInIconId, NokiaSvgFactory> = {
  client: (colors) => nokiaSvg(colors, '<path d="M100 91.1H20M89.1 32.5c0-2-1.6-3.6-3.6-3.6H34.6c-2 0-3.6 1.6-3.6 3.6V76h58.2V32.5z"/>'),
  cloud: (colors) => nokiaSvg(colors, '<path d="M20 70.9c.6 8 7.8 14.6 16.2 14.6h42.9c7.1 0 13.9-3.6 17.8-9.5 7.8-11.6 0-28.6-13.9-30.8-1.9-.2-3.5-.2-5.4 0l-2 .2c-1.5.2-3-.5-3.7-2-3.2-5.8-9.8-9.6-17.3-8.7-7.8.9-15.1 7.2-15.1 14.9v1.3c0 2-1.7 3.6-3.7 3.6h-.2C26.7 54.5 19.4 62 20 70.9z"/>'),
  controller: (colors) => nokiaSvg(colors, '<path d="M82.8 60c0 12.6-10.2 22.8-22.8 22.8S37.2 72.6 37.2 60 47.4 37.2 60 37.2c6.3 0 12 2.6 16.2 6.7 4 4.2 6.6 9.9 6.6 16.1z"/><path d="m92.4 27.8 6.7 7.2c1.2 1.2 1.2 2.9 0 4.1l-6.7 7.7M59.8 37.2h38.1M27.6 92.2 20.9 85c-1.2-1.2-1.2-2.9 0-4.1l6.7-7.7M60.2 82.8H22.1"/>'),
  dcgw: (colors) => nokiaSvg(colors, '<path d="M93.8 39.8H83.1c-1.8 0-3-1.3-3.1-3.1V25.9M99 21.2 83 37.3M19.9 33.9V23.2c0-1.8 1.3-3 3.1-3.1h10.8M38.9 39 22.8 22.9M24.9 80.9h10.7c1.8 0 3 1.3 3.1 3.1v10.8M19.9 99.8 36 83.8M100 86v10.7c0 1.8-1.3 3-3.1 3.1H86.1M81.1 81 97.1 97M100.1 50h-80M100.1 60h-80M100.1 70h-80"/>'),
  nsp: (colors) => nokiaSvg(colors, `<path d="M80 31.8c-10.4-7.4-24.5-8.7-36.4-2.2-10.9 5.9-17.4 16.8-18 28.4M40 88.1c10.4 7.3 24.4 8.7 36.4 2.2 10.9-5.9 17.4-16.9 18-28.4m-25-24.9 9.2-3.7c1.6-.6 2.3-2.1 1.8-3.8l-2.8-9.9M50.5 83l-9.2 3.7c-1.6.6-2.3 2.1-1.8 3.8l2.8 9.9"/><circle cx="28.8" cy="74.6" r="5.7"/><circle cx="91.2" cy="45.1" r="5.7"/><text x="60" y="64" fill="${safeColor(colors.stroke)}" stroke="none" font-family="sans-serif" font-size="18" text-anchor="middle">NSP</text>`),
  pon: (colors) => nokiaSvg(colors, `<path d="m20.9 20 76.1 40-76.1 40M20.9 60h52.9"/><circle cx="95.1" cy="60" r="3" fill="${safeColor(colors.stroke)}"/>`),
  rgw: (colors) => nokiaSvg(colors, `<path d="M46.8 54.6c7.5-7.5 20-7.5 27.5 0M53.7 63.9c3.8-3.8 10-3.8 13.8 0M17 55.6l37.7-36.5c3.1-3 8.1-3 11.2 0L103 55.7M29.9 63.8V95c0 4.4 3.6 8 8 8h17.9c2.4 0 4.3-1.9 4.3-4.3v-8.5M90.3 63.8V95c0 4.4-3.6 8-8 8h-8.5"/><circle cx="60" cy="73.4" r="2" fill="${safeColor(colors.stroke)}"/>`),
  router: (colors) => nokiaSvg(colors, '<path d="M71.7 19.7V48h28m-8.5-9.5 7.5 7.6c1.3 1.3 1.3 3.1 0 4.3L91.1 58M20 47.8h28.4v-28m-9.6 8.5 7.6-7.5c1.3-1.3 3.1-1.3 4.3 0l7.7 7.6M48 100.3V72H20m8.5 9.5L21 73.9c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7M100 71.9H71.6v28m9.6-8.5-7.6 7.5c-1.3 1.3-3.1 1.3-4.3 0l-7.7-7.6"/>'),
  server: (colors) => nokiaSvg(colors, '<path d="M84.9 95H35.1c-1.1 0-2-.9-2-2V27c0-1.1.9-2 2-2h49.7c1.1 0 2 .9 2 2v66c.1 1.1-.8 2-1.9 2zM35.1 41.3h43.6M35.1 53.8h43.6M35.1 66.2h43.6M35.1 78.7h43.6"/>'),
  spine: (colors) => nokiaSvg(colors, '<path d="M98 30.1H68L52 89.9H22m6 10.1-7-8.1c-1.3-1.3-1.3-3.1 0-4.3l7-7.6m64-60 7 8.1c1.3 1.3 1.3 3.1 0 4.3L92 40M98 89.9H64m28-9.9 7 7.6c1.3 1.3 1.3 3.1 0 4.3l-7 8.1M56 30.1H22m6 9.9-7-7.6c-1.3-1.3-1.3-3.1 0-4.3l7-8.1M100 60H72M20 60h28"/>'),
  switch: (colors) => nokiaSvg(colors, '<path d="m91.5 27.3 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7M28.5 46.9l-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7m63 45.8 7.6 7.6c1.3 1.3 1.3 3.1 0 4.3l-7.6 7.7M28.5 92.7l-7.6-7.6c-1.3-1.3-1.3-3.1 0-4.3l7.6-7.7M96.6 36.8H67.9l-16 45.9H23.2m73.4 0H67.9l-16-45.9H23.2"/>'),
  ue: (colors) => nokiaSvg(colors, '<path d="M54 83.8h11.9M36.2 28.3c0-4.4 3.4-7.9 7.7-7.9h32.2c4.3 0 7.7 3.5 7.7 7.9v63.6c0 4.3-3.5 7.7-7.9 7.7H43.9c-4.3 0-7.7-3.5-7.7-7.9V28.3z"/>')
};

const defaultColors: Record<StudioBuiltInIconId, StudioVisualNodeTemplateColors> = {
  client: { fill: '#455a64', stroke: '#ffffff' },
  cloud: { fill: '#546e7a', stroke: '#ffffff' },
  controller: { fill: '#7b1fa2', stroke: '#ffffff' },
  dcgw: { fill: '#1565c0', stroke: '#ffffff' },
  nsp: { fill: '#6a45b8', stroke: '#ffffff' },
  pon: { fill: '#00897b', stroke: '#ffffff' },
  rgw: { fill: '#388e3c', stroke: '#ffffff' },
  router: { fill: '#44546a', stroke: '#ffffff' },
  server: { fill: '#2e7d32', stroke: '#ffffff' },
  spine: { fill: '#5c6bc0', stroke: '#ffffff' },
  switch: { fill: '#0288d1', stroke: '#ffffff' },
  ue: { fill: '#6d4c41', stroke: '#ffffff' }
};

const iconMetadata: Record<StudioBuiltInIconId, { alt: string; glyph: string }> = {
  client: { alt: 'Nokia client', glyph: 'CLI' },
  cloud: { alt: 'Nokia cloud', glyph: 'CLD' },
  controller: { alt: 'Nokia controller', glyph: 'CTRL' },
  dcgw: { alt: 'Nokia data center gateway', glyph: 'DCGW' },
  nsp: { alt: 'Nokia NSP', glyph: 'NSP' },
  pon: { alt: 'Passive optical network', glyph: 'PON' },
  rgw: { alt: 'Residential gateway', glyph: 'RGW' },
  router: { alt: 'Nokia router', glyph: 'RTR' },
  server: { alt: 'Nokia server', glyph: 'SRV' },
  spine: { alt: 'Nokia spine', glyph: 'SPN' },
  switch: { alt: 'Nokia switch', glyph: 'SW' },
  ue: { alt: 'User equipment', glyph: 'UE' }
};

function builtInIcon(id: StudioBuiltInIconId): IconSpec & { svg: string } {
  const colors = defaultColors[id];
  return {
    ...iconMetadata[id],
    fill: colors.fill,
    stroke: colors.stroke,
    svg: nokiaSvgFactories[id]({ fill: '${fillColor}', stroke: '${strokeColor}' })
  };
}

export const studioBuiltInIcons: Record<string, IconSpec & { svg: string }> = Object.fromEntries(
  (Object.keys(iconMetadata) as StudioBuiltInIconId[]).map((id) => [`nokia.${id}`, builtInIcon(id)])
);

function visualTemplate(id: StudioVisualNodeTemplateId): StudioVisualNodeTemplate {
  return { iconKey: `nokia.${id}`, icon: studioBuiltInIcons[`nokia.${id}`] };
}

export const studioVisualNodeTemplates: Record<StudioVisualNodeTemplateId, StudioVisualNodeTemplate> = {
  controller: visualTemplate('controller'),
  router: visualTemplate('router'),
  server: visualTemplate('server'),
  switch: visualTemplate('switch')
};

function normalizedTemplateId(templateId: string): StudioVisualNodeTemplateId | undefined {
  if (templateId === 'service') return 'server';
  return Object.hasOwn(studioVisualNodeTemplates, templateId) ? (templateId as StudioVisualNodeTemplateId) : undefined;
}

export function studioVisualNodeTemplate(templateId: string): StudioVisualNodeTemplate | undefined {
  const normalized = normalizedTemplateId(templateId);
  return normalized ? studioVisualNodeTemplates[normalized] : undefined;
}

export function studioBuiltInIcon(iconKey: string): (IconSpec & { svg: string }) | undefined {
  return studioBuiltInIcons[iconKey];
}

export function studioVisualNodeTemplateDataUri(templateId: string, colors?: StudioVisualNodeTemplateColors): string | undefined {
  const normalized = normalizedTemplateId(templateId);
  if (!normalized) return undefined;
  const resolvedColors = colors || defaultColors[normalized];
  return `data:image/svg+xml,${encodeURIComponent(nokiaSvgFactories[normalized](resolvedColors))}`;
}
