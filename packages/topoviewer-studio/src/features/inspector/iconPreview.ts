import type { IconSpec } from 'topoviewer';
import { materializeSvgColorTokens } from 'topoviewer/security';
import type { StudioIconColors } from '../../ui/colorContract';

const SAFE_CSS_COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([0-9.% ,+-]+\)|[a-z]+)$/i;

function previewColor(value: string | undefined, fallback: string): string {
  const color = value?.trim();
  return color && SAFE_CSS_COLOR.test(color) ? color : fallback;
}

export function studioIconPreviewSvg(
  icon: IconSpec,
  colors?: StudioIconColors
): string | undefined {
  if (!icon.svg) return undefined;
  const fill = previewColor(colors?.fill ?? icon.fill, '#44546a');
  const stroke = previewColor(colors?.stroke ?? icon.stroke, '#ffffff');
  return materializeSvgColorTokens(icon.svg, { fill, stroke });
}

export function studioIconPreviewSource(
  icon: IconSpec | undefined,
  colors?: StudioIconColors
): string | undefined {
  if (!icon) return undefined;
  const svg = studioIconPreviewSvg(icon, colors);
  return svg ? `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` : undefined;
}

export function studioIconPreviewGlyph(id: string, icon: IconSpec | undefined): string {
  const glyph = icon?.glyph?.trim();
  if (glyph) return glyph.slice(0, 5);
  const segment = id.split(/[.:/_-]+/).filter(Boolean).at(-1) || id;
  return segment.slice(0, 3).toUpperCase() || '?';
}
