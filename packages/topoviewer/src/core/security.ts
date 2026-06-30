const SVG_EVENT_ATTRIBUTE = /\s+on[a-z][\w:-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SVG_SCRIPT_BLOCK = /<script\b[\s\S]*?<\\?\/script>/gi;
const SVG_SCRIPT_TAG = /<\/?script\b[^>]*>/gi;
const SVG_FOREIGN_OBJECT_BLOCK = /<foreignObject\b[\s\S]*?<\/foreignObject>/gi;
const SVG_FOREIGN_OBJECT_TAG = /<\/?foreignObject\b[^>]*>/gi;
const SVG_HREF_ATTRIBUTE = /\s+(href|xlink:href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const SVG_STYLE_ATTRIBUTE = /\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const SVG_STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const SVG_ACTIVE_ELEMENT_BLOCK = /<(iframe|object|embed)\b[\s\S]*?<\/\1>/gi;
const SVG_ACTIVE_ELEMENT_SELF = /<(iframe|object|embed)\b[^>]*\/?>/gi;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_match, codepoint) => String.fromCodePoint(Number.parseInt(codepoint, 16)))
    .replace(/&#([0-9]+);?/g, (_match, codepoint) => String.fromCodePoint(Number.parseInt(codepoint, 10)))
    .replace(/&colon;?/gi, ':')
    .replace(/&tab;?/gi, '\t')
    .replace(/&newline;?/gi, '\n')
    .replace(/&lpar;?/gi, '(')
    .replace(/&rpar;?/gi, ')');
}

function unquotedAttributeValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizedPayload(value: string): string {
  return decodeHtmlEntities(unquotedAttributeValue(value))
    .replace(/[\u0000-\u001F\u007F\s]+/g, '')
    .toLowerCase();
}

function unsafeUrlPayload(value: string): boolean {
  const normalized = normalizedPayload(value);
  return normalized.includes('javascript:')
    || normalized.includes('vbscript:')
    || normalized.startsWith('data:image/svg+xml');
}

function unsafeCssPayload(value: string): boolean {
  const normalized = normalizedPayload(value);
  return normalized.includes('javascript:')
    || normalized.includes('vbscript:')
    || normalized.includes('expression(')
    || normalized.includes('-moz-binding:')
    || normalized.includes('data:image/svg+xml');
}

export function sanitizeSvg(svg: string): string {
  return svg
    .replace(SVG_SCRIPT_BLOCK, '')
    .replace(SVG_SCRIPT_TAG, '')
    .replace(SVG_FOREIGN_OBJECT_BLOCK, '')
    .replace(SVG_FOREIGN_OBJECT_TAG, '')
    .replace(SVG_ACTIVE_ELEMENT_BLOCK, '')
    .replace(SVG_ACTIVE_ELEMENT_SELF, '')
    .replace(SVG_EVENT_ATTRIBUTE, '')
    .replace(SVG_HREF_ATTRIBUTE, (attribute, _name, value) => unsafeUrlPayload(value) ? '' : attribute)
    .replace(SVG_STYLE_ATTRIBUTE, (attribute, value) => unsafeCssPayload(value) ? '' : attribute)
    .replace(SVG_STYLE_BLOCK, (styleBlock) => unsafeCssPayload(styleBlock) ? '' : styleBlock);
}

export function isSafeImageReference(value: string): boolean {
  const reference = value.trim();
  if (!reference || /[\u0000-\u001F\u007F\s]/.test(reference)) return false;
  return /^(https?:|data:image\/(?:png|jpe?g|gif|webp);|\.{0,2}\/|#)/i.test(reference);
}
