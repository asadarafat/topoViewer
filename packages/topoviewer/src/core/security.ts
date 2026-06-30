const SVG_EVENT_ATTRIBUTE = /\s+on[a-z][\w:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SVG_SCRIPT_BLOCK = /<script\b[\s\S]*?<\/script>/gi;
const SVG_FOREIGN_OBJECT_BLOCK = /<foreignObject\b[\s\S]*?<\/foreignObject>/gi;
const SVG_JAVASCRIPT_HREF = /\s+(href|xlink:href)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)/gi;
const SVG_STYLE_JAVASCRIPT = /\s+style\s*=\s*(?:"[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi;

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(SVG_SCRIPT_BLOCK, '')
    .replace(SVG_FOREIGN_OBJECT_BLOCK, '')
    .replace(SVG_EVENT_ATTRIBUTE, '')
    .replace(SVG_JAVASCRIPT_HREF, '')
    .replace(SVG_STYLE_JAVASCRIPT, '');
}

export function isSafeImageReference(value: string): boolean {
  const reference = value.trim();
  if (!reference || /[\u0000-\u001F\u007F\s]/.test(reference)) return false;
  return /^(https?:|data:image\/(?:png|jpe?g|gif|webp);|\.{0,2}\/|#)/i.test(reference);
}
