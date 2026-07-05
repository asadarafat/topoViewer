import { matchingRules } from './selector';
import { mergePlainObjects, valueOrDefault, withoutUndefined } from './object';
import { isSafeImageReference } from './security';
import { nodeShapeGeometry, nodeShapeGeometryToSvgElement, nodeShapePointsToSvg, normalizeNodeShape, parseNodeShapePoints, type NodeShapeName, type NodeShapePoint } from './nodeShapes';
import { DEFAULT_NODE_SHAPE, styleDefaultNumber, styleDefaultValue } from './styleDefaults';
import {
  finiteNumber,
  normalizeCurveStyleToken,
  normalizeEdgeArrowShape,
  normalizeGradientStops,
  normalizeTaxiDirection,
  numberList,
  positiveNumber,
} from './edgeStyle';
import {
  dashPatternForBorderStyle,
  nodeDashPattern,
  nonNegativeNumber,
  normalizeNodeBadgePosition,
  normalizeNodeIconFit,
  normalizeNodeLabelPosition,
  normalizeNodeLabelTextOverflow,
  normalizeNodeLabelTextWrap,
  normalizeNodeLayout,
  normalizeNodeStatusPlacement,
  opacityNumber,
  worstSeverityColor,
} from './nodeStyle';
import { normalizeRegionLabelPosition, regionLabelMargin } from './regionStyle';
import type { DiagramCallout, DiagramShape, GraphEntity, IconSpec, StyleDeclaration, StylesheetDocument } from './types';

export function applyStyle(kind: string, entity: GraphEntity, spec: StylesheetDocument): StyleDeclaration {
  const matchedStyle = matchingRules(kind, entity, spec.stylesheet || []).reduce<StyleDeclaration>((style, rule) => {
    return mergePlainObjects(style, rule.style || {});
  }, {});

  return entity.style && typeof entity.style === 'object'
    ? mergePlainObjects(matchedStyle, entity.style)
    : matchedStyle;
}

export function iconForStyle(style: StyleDeclaration, entity: GraphEntity, spec: StylesheetDocument): IconSpec {
  const icons = spec.icons || {};
  const iconKey = String(style.icon || entity.icon || entity.data?.icon || 'router.generic');
  return icons[iconKey] || icons['router.generic'] || { glyph: 'R', fill: '#6ea8fe', stroke: '#d8e8ff' };
}

export function displayName(entity?: { id?: string; name?: string; label?: string }): string {
  return entity?.name || entity?.label || entity?.id || '';
}

export function formatLabels(labels?: unknown): string {
  if (Array.isArray(labels)) return labels.join(' / ');
  if (labels && typeof labels === 'object') {
    return Object.entries(labels).map(([key, value]) => `${key}:${String(value)}`).join(' / ');
  }
  return String(labels || '');
}

export function normalizeTextLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(/\n/).map((line) => line.trim()).filter(Boolean);
}

function markdownSource(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((line) => String(line).trim())
      .filter(Boolean)
      .map((line) => /^(\s*[-*+]\s+|\s*\d+\.\s+|#{1,6}\s+)/.test(line) ? line : `- ${line}`)
      .join('\n');
  }
  if (value === undefined || value === null) return '';
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeMarkdownUrl(value: string): string | undefined {
  const url = value.trim();
  if (!url || /[\u0000-\u001F\u007F\s]/.test(url)) return undefined;
  if (isSafeImageReference(url)) {
    return escapeHtml(url);
  }
  return undefined;
}

function inlineMarkdown(value: string): string {
  const placeholders: string[] = [];
  const placeholder = (html: string) => {
    const key = `\u0000${placeholders.length}\u0000`;
    placeholders.push(html);
    return key;
  };

  const withMedia = value
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
      const safeUrl = safeMarkdownUrl(String(url));
      if (!safeUrl) return escapeHtml(String(_match));
      return placeholder(`<img src="${safeUrl}" alt="${escapeHtml(String(alt))}" loading="lazy" />`);
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
      const safeUrl = safeMarkdownUrl(String(url));
      if (!safeUrl) return escapeHtml(String(_match));
      return placeholder(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(String(label))}</a>`);
    });

  return escapeHtml(withMedia)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\+\+([^+]+)\+\+/g, '<u>$1</u>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\u0000(\d+)\u0000/g, (_match, index) => placeholders[Number(index)] || '');
}

function flushParagraph(output: string[], paragraph: string[]) {
  if (!paragraph.length) return;
  output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
  paragraph.length = 0;
}

export function markdownToHtml(value: unknown): string {
  const lines = markdownSource(value).split(/\r?\n/);
  const output: string[] = [];
  const paragraph: string[] = [];
  let listType: 'ul' | 'ol' | undefined;

  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = undefined;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph(output, paragraph);
      closeList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph(output, paragraph);
      closeList();
      const level = Math.min(heading[1].length, 6);
      output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph(output, paragraph);
      const nextListType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextListType) closeList();
      if (!listType) {
        listType = nextListType;
        output.push(`<${listType}>`);
      }
      output.push(`<li>${inlineMarkdown((unordered || ordered)![1])}</li>`);
      return;
    }

    closeList();
    paragraph.push(line);
  });

  flushParagraph(output, paragraph);
  closeList();
  return output.join('');
}

function edgeLabel(entity: GraphEntity, spec: StylesheetDocument, enabled: boolean, fallbackLabel = ''): string {
  if (!enabled) return '';
  const subject = { ...(entity.data || {}), ...entity } as Record<string, unknown>;
  const fields = [...(spec.labelFields || ['name']), 'label'];
  const value = fields.map((field) => subject[field]).find((item) => item !== undefined && item !== null && item !== '');
  if (Array.isArray(value)) return value.join(' / ');
  return value === undefined ? fallbackLabel : String(value);
}

function colorWithOpacity(color: unknown, opacity: unknown): string | undefined {
  if (color === undefined || color === null) return undefined;
  if (opacity === undefined || opacity === null) return String(color);
  const text = String(color).trim();
  if (!text.startsWith('#')) return text;
  const hex = text.slice(1);
  if (![3, 4, 6, 8].includes(hex.length)) return text;
  const expanded = [3, 4].includes(hex.length) ? hex.split('').map((char) => char + char).join('') : hex;
  const value = Number.parseInt(expanded, 16);
  const opacityValue = opacityNumber(opacity);
  if (Number.isNaN(value) || opacityValue === undefined) return text;
  const hasAlpha = expanded.length === 8;
  const red = hasAlpha ? (value >> 24) & 255 : (value >> 16) & 255;
  const green = hasAlpha ? (value >> 16) & 255 : (value >> 8) & 255;
  const blue = hasAlpha ? (value >> 8) & 255 : value & 255;
  const alpha = hasAlpha ? Math.round(((value & 255) / 255) * opacityValue * 1000) / 1000 : opacityValue;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function dashPattern(value: unknown): string {
  if (Array.isArray(value)) return value.join(' ');
  return String(value);
}

function cssPixel(value: unknown): string | number | undefined {
  const parsed = finiteNumber(value);
  return parsed !== undefined ? `${parsed}px` : undefined;
}

function cssPadding(value: unknown): string | number | undefined {
  const parsed = nonNegativeNumber(value);
  return parsed !== undefined ? `${parsed}px` : undefined;
}

function isZeroNumber(value: unknown): boolean {
  const parsed = finiteNumber(value);
  return parsed === 0;
}

function isTransparentColor(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const text = String(value).trim().toLowerCase().replace(/\s+/g, '');
  if (text === 'transparent') return true;
  if (text === '#0000' || text === '#00000000') return true;
  const rgba = text.match(/^rgba?\((.+)\)$/);
  if (!rgba) return false;
  const parts = rgba[1].split(',');
  return parts.length === 4 && finiteNumber(parts[3]) === 0;
}

function estimatedNodeLabelHeight(style: StyleDeclaration): number {
  const fontSize = finiteNumber(style.labelFontSize) ?? 10;
  const padding = nonNegativeNumber(style.labelPadding) ?? 0;
  return fontSize * 1.1 + padding * 2;
}

function estimatedNodeMetaHeight(entity: GraphEntity, style: StyleDeclaration): number {
  const text = formatLabels(entity.labels);
  if (!text || isTransparentColor(style.metaColor) || isZeroNumber(style.metaFontSize)) return 0;
  const fontSize = finiteNumber(style.metaFontSize) ?? 8;
  const lineHeight = fontSize * 1.2;
  const lines = Math.max(1, Math.ceil(text.length / 28));
  return lineHeight * lines;
}

function estimatedRegionNodeHeight(entity: GraphEntity, style: StyleDeclaration, bodyHeight: number, labelPosition: string, rendersOverlayLabel: boolean): number {
  const stackGap = 3;
  const labelHeight = !rendersOverlayLabel && labelPosition === 'bottom' ? estimatedNodeLabelHeight(style) : 0;
  const metaHeight = estimatedNodeMetaHeight(entity, style);
  return bodyHeight
    + (labelHeight > 0 ? stackGap + labelHeight : 0)
    + (metaHeight > 0 ? stackGap + metaHeight : 0);
}

function labelWhiteSpace(value: unknown): string | undefined {
  const wrap = normalizeNodeLabelTextWrap(value);
  if (wrap === 'wrap') return 'normal';
  if (wrap === 'none') return 'nowrap';
  return undefined;
}

function labelOverflow(value: unknown): string | undefined {
  const overflow = normalizeNodeLabelTextOverflow(value);
  if (overflow === 'ellipsis' || overflow === 'clip') return 'hidden';
  return undefined;
}

function labelTextOverflow(value: unknown): string | undefined {
  return normalizeNodeLabelTextOverflow(value);
}

function aggregateSeverity(entity: GraphEntity): string | undefined {
  const severity = entity.labels?.severity;
  return severity === undefined ? undefined : String(severity);
}

function aggregateBadgeLabel(style: StyleDeclaration, entity: GraphEntity): string | undefined {
  if (style.badgeLabel !== undefined) return String(style.badgeLabel);
  if (entity.data?.isAggregate === true && entity.data.childCount !== undefined) {
    return String(entity.data.childCount);
  }
  return undefined;
}

function aggregateStatusColor(style: StyleDeclaration, entity: GraphEntity): unknown {
  if (style.statusColor !== undefined) return style.statusColor;
  if (entity.data?.isAggregate === true) return worstSeverityColor(aggregateSeverity(entity));
  return undefined;
}

function pathValue(source: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  if (Object.prototype.hasOwnProperty.call(source, path)) return source[path];
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function fieldText(entity: GraphEntity, field: string | undefined): string {
  if (!field) return '';
  const subject = {
    ...(entity.data || {}),
    ...entity,
    data: entity.data || {},
    labels: entity.labels || {}
  } as Record<string, unknown>;
  const value = pathValue(subject, field);
  if (Array.isArray(value)) return value.map(String).filter(Boolean).join(' / ');
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function mapLineDash(style: StyleDeclaration): string {
  const explicitPattern = style.lineDashPattern;
  if (explicitPattern !== undefined) return dashPattern(explicitPattern);
  const lineStyle = String(style.lineStyle || 'solid').toLowerCase();
  if (lineStyle === 'dashed') return '8 6';
  if (lineStyle === 'dotted') return '2 6';
  return '';
}

function mapCurveStyle(style: StyleDeclaration): string {
  const curveStyle = normalizeCurveStyleToken(style.curveStyle || styleDefaultValue('link', 'curveStyle') || 'bezier');
  if (['straight', 'haystack'].includes(curveStyle)) return 'straight';
  if (['segments', 'taxi'].includes(curveStyle)) return 'step';
  if (['roundsegments', 'roundtaxi', 'smoothtaxi', 'smoothstep'].includes(curveStyle)) return 'smoothstep';
  if (['simplebezier', 'unbundledbezier'].includes(curveStyle)) return 'simplebezier';
  if (curveStyle === 'bezier') return 'bezier';
  return 'default';
}

function routeKind(style: StyleDeclaration): string | undefined {
  const curveStyle = normalizeCurveStyleToken(style.curveStyle);
  if (curveStyle === 'segments' || curveStyle === 'roundsegments') return 'segments';
  if (curveStyle === 'taxi' || curveStyle === 'roundtaxi' || curveStyle === 'smoothtaxi') return 'taxi';
  return undefined;
}

interface NodeBodyBox {
  authoredHeight?: number;
  authoredWidth?: number;
  bodyHeight: number;
  bodyWidth: number;
  defaultHeight: number;
  defaultWidth: number;
}

function resolveNodeBodyBox(style: StyleDeclaration, shape: string): NodeBodyBox {
  const defaultWidth = styleDefaultNumber('node', 'width', 82);
  const defaultHeight = styleDefaultNumber('node', 'height', 60);
  const authoredWidth = finiteNumber(style.width);
  const authoredHeight = finiteNumber(style.height);

  if (shape === 'circle' || shape === 'square') {
    const size = authoredWidth ?? authoredHeight ?? defaultHeight;
    return {
      authoredHeight,
      authoredWidth,
      bodyHeight: size,
      bodyWidth: size,
      defaultHeight,
      defaultWidth
    };
  }

  return {
    authoredHeight,
    authoredWidth,
    bodyHeight: authoredHeight ?? defaultHeight,
    bodyWidth: authoredWidth ?? defaultWidth,
    defaultHeight,
    defaultWidth
  };
}

function iconClipForNodeShape(shape: NodeShapeName, polygonPoints: readonly NodeShapePoint[] | undefined) {
  const geometry = nodeShapeGeometry(shape, nodeShapePointsToSvg(polygonPoints));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${nodeShapeGeometryToSvgElement(geometry, { fill: '#000' })}</svg>`;
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  return {
    maskImage: mask,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: '100% 100%',
    WebkitMaskImage: mask,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: '100% 100%'
  };
}

export function compileNodeStyle(style: StyleDeclaration, entity: GraphEntity, spec: StylesheetDocument) {
  const icon = iconForStyle(style, entity, spec);
  const shape = normalizeNodeShape(style.shape) || DEFAULT_NODE_SHAPE;
  const bodyBox = resolveNodeBodyBox(style, shape);
  const width = bodyBox.bodyWidth;
  const height = bodyBox.bodyHeight;
  const shapePoints = parseNodeShapePoints(style.shapePolygonPoints).points;
  const fill = String(style.backgroundColor || icon.fill);
  const stroke = String(style.borderColor || icon.stroke);
  const borderWidth = Number(valueOrDefault(style.borderWidth as number | undefined, styleDefaultNumber('node', 'borderWidth', 4)));
  const borderStyleDash = nodeDashPattern(style.borderDashPattern) || dashPatternForBorderStyle(style.borderStyle);
  const borderOpacity = opacityNumber(style.borderOpacity);
  const outlineWidth = nonNegativeNumber(style.outlineWidth);
  const underlayPadding = nonNegativeNumber(style.underlayPadding);
  const labelPosition = normalizeNodeLabelPosition(style.labelPosition) || String(styleDefaultValue('node', 'labelPosition') || 'bottom');
  const rendersOverlayLabel = finiteNumber(style.labelZIndex) !== undefined;
  const badgeLabel = aggregateBadgeLabel(style, entity);
  const badgePosition = normalizeNodeBadgePosition(style.badgePosition) || String(styleDefaultValue('node', 'badgePosition') || 'topRight');
  const statusColor = aggregateStatusColor(style, entity);
  const statusPlacement = normalizeNodeStatusPlacement(style.statusPlacement) || String(styleDefaultValue('node', 'statusPlacement') || 'bottomRight');
  const statusSize = nonNegativeNumber(style.statusSize);
  const iconFit = normalizeNodeIconFit(style.iconFit);
  const iconClipStyle = iconClipForNodeShape(shape, shapePoints);
  const metaVisible = !isTransparentColor(style.metaColor) && !isZeroNumber(style.metaFontSize);
  const nodeLayout = shape === 'roundRectangle' ? normalizeNodeLayout(style.nodeLayout) : undefined;

  return {
    flow: withoutUndefined({
      type: 'network',
      draggable: style.draggable !== false,
      selectable: style.selectable !== false,
      dragHandle: '.topoviewer-node-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('node', 'zIndex', 10)),
      style: withoutUndefined({
        width,
        opacity: style.opacity
      })
    }),
    data: {
      iconSpec: icon,
      nodeShapeType: shape,
      nodeShapePoints: shape === 'polygon' ? nodeShapePointsToSvg(shapePoints) : undefined,
      labelHtml: markdownToHtml(displayName(entity)),
      edgeAnchor: {
        x: 0,
        y: 0,
        width,
        height
      },
      nodeStyle: withoutUndefined({
        width,
        minHeight: height,
        '--topoviewer-node-icon-width': `${width}px`,
        '--topoviewer-node-icon-height': `${height}px`,
        '--topoviewer-node-label-x-offset': cssPixel(style.labelXOffset) || '0px',
        '--topoviewer-node-label-y-offset': cssPixel(style.labelYOffset) || '0px'
      }),
      regionBoundsWidth: width,
      regionBoundsHeight: estimatedRegionNodeHeight(entity, style, height, labelPosition, rendersOverlayLabel),
      iconStyle: withoutUndefined({
        width,
        height,
        borderColor: stroke,
        borderWidth,
        backgroundColor: fill,
        color: style.iconColor,
        opacity: opacityNumber(style.iconOpacity)
      }),
      iconContentStyle: withoutUndefined({
        width,
        height,
        padding: cssPadding(style.iconPadding),
        backgroundColor: style.iconBackgroundColor,
        opacity: opacityNumber(style.iconOpacity),
        ...iconClipStyle
      }),
      iconImageStyle: withoutUndefined({
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'block',
        alignSelf: 'stretch',
        justifySelf: 'stretch',
        aspectRatio: 'auto',
        objectPosition: 'center',
        objectFit: iconFit
      }),
      nodeShapeStyle: withoutUndefined({
        fill,
        stroke,
        strokeWidth: borderWidth,
        strokeDasharray: borderStyleDash,
        strokeOpacity: borderOpacity
      }),
      nodeOutlineStyle: withoutUndefined({
        fill: 'none',
        stroke: style.outlineColor,
        strokeWidth: outlineWidth,
        strokeOpacity: opacityNumber(style.outlineOpacity),
        display: outlineWidth !== undefined && style.outlineColor !== undefined ? undefined : 'none'
      }),
      nodeUnderlayStyle: withoutUndefined({
        fill: style.underlayColor,
        fillOpacity: opacityNumber(style.underlayOpacity),
        stroke: 'none',
        display: underlayPadding !== undefined && style.underlayColor !== undefined ? undefined : 'none',
        '--topoviewer-node-underlay-scale-x': underlayPadding === undefined ? undefined : String(1 + (underlayPadding * 2) / Math.max(width, 1)),
        '--topoviewer-node-underlay-scale-y': underlayPadding === undefined ? undefined : String(1 + (underlayPadding * 2) / Math.max(height, 1))
      }),
      labelPosition,
      labelZIndex: finiteNumber(style.labelZIndex),
      labelCollisionPolicy: style.labelCollisionPolicy,
      labelMinZoom: nonNegativeNumber(style.minZoomedLabelFontSize),
      labelStyle: withoutUndefined({
        color: style.labelColor,
        fontSize: style.labelFontSize,
        fontWeight: style.labelFontWeight,
        opacity: opacityNumber(style.labelOpacity),
        backgroundColor: colorWithOpacity(style.labelBackgroundColor, style.labelBackgroundOpacity),
        borderColor: style.labelBorderColor,
        borderWidth: nonNegativeNumber(style.labelBorderWidth),
        borderStyle: style.labelBorderColor || style.labelBorderWidth !== undefined ? 'solid' : undefined,
        padding: cssPadding(style.labelPadding),
        maxWidth: cssPixel(style.labelTextMaxWidth),
        whiteSpace: labelWhiteSpace(style.labelTextWrap),
        overflow: labelOverflow(style.labelTextOverflow),
        textOverflow: labelTextOverflow(style.labelTextOverflow),
        textAlign: style.labelTextAlign
      }),
      metaStyle: withoutUndefined({
        color: style.metaColor,
        fontSize: style.metaFontSize,
        fontWeight: style.metaFontWeight
      }),
      metaZIndex: finiteNumber(style.metaZIndex),
      metaVisible,
      badgeLabel,
      badgePosition,
      badgeStyle: withoutUndefined({
        color: style.badgeColor,
        backgroundColor: style.badgeBackgroundColor,
        borderColor: style.badgeBorderColor,
        borderWidth: cssPixel(style.badgeBorderWidth),
        fontSize: cssPixel(style.badgeFontSize),
        fontWeight: style.badgeFontWeight,
        minWidth: cssPixel(style.badgeMinWidth),
        minHeight: cssPixel(style.badgeMinHeight),
        padding: cssPadding(style.badgePadding),
        '--topoviewer-node-badge-offset': cssPixel(style.badgeOffset)
      }),
      nodeLayout,
      cardTitle: nodeLayout ? fieldText(entity, nodeLayout.content.titleField) || displayName(entity) : undefined,
      cardSubtitle: nodeLayout ? fieldText(entity, nodeLayout.content.subtitleField) : undefined,
      cardContentStyle: nodeLayout ? withoutUndefined({
        textAlign: nodeLayout.content.align
      }) : undefined,
      cardIconStyle: nodeLayout ? withoutUndefined({
        width: nodeLayout.icon.width,
        height: nodeLayout.icon.height,
        color: style.iconColor,
        backgroundColor: style.iconBackgroundColor,
        opacity: opacityNumber(style.iconOpacity)
      }) : undefined,
      cardIconContentStyle: nodeLayout ? withoutUndefined({
        width: nodeLayout.icon.width,
        height: nodeLayout.icon.height,
        padding: cssPadding(style.iconPadding),
        opacity: opacityNumber(style.iconOpacity)
      }) : undefined,
      cardIconImageStyle: nodeLayout ? withoutUndefined({
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'block',
        alignSelf: 'stretch',
        justifySelf: 'stretch',
        aspectRatio: 'auto',
        objectPosition: 'center',
        objectFit: iconFit
      }) : undefined,
      statusPlacement,
      statusStyle: statusColor === undefined ? undefined : withoutUndefined({
        backgroundColor: statusColor,
        width: cssPixel(statusSize),
        height: cssPixel(statusSize),
        '--topoviewer-node-status-offset': statusSize === undefined ? undefined : `${statusSize / 2}px`
      })
    }
  };
}

export function compileEdgeStyle(style: StyleDeclaration, entity: GraphEntity, spec: StylesheetDocument, labelsEnabled: boolean) {
  const lineColor = String(style.lineColor || styleDefaultValue('link', 'lineColor') || '#6ea8fe');
  const label = edgeLabel(entity, spec, labelsEnabled, String(style.label || ''));
  const endpointEntity = entity as GraphEntity & { sourceLabel?: unknown; targetLabel?: unknown };
  const sourceLabel = labelsEnabled ? style.sourceLabel ?? endpointEntity.sourceLabel : undefined;
  const targetLabel = labelsEnabled ? style.targetLabel ?? endpointEntity.targetLabel : undefined;
  const curveType = mapCurveStyle(style);
  const anchor = String(style.anchor || styleDefaultValue('link', 'anchor') || 'floating').toLowerCase();
  const lineWidth = Number(style.lineWidth || styleDefaultNumber('link', 'lineWidth', 1));
  const lineOpacity = style.lineOpacity ?? style.opacity;
  const interactive = style.interactive !== false;
  const lineFill = String(style.lineFill || styleDefaultValue('link', 'lineFill') || 'solid');
  const gradientStops = lineFill === 'linearGradient'
    ? normalizeGradientStops(style.lineGradientStopColors, style.lineGradientStopPositions)
    : undefined;
  const sourceArrowShape = normalizeEdgeArrowShape(style.sourceArrowShape) || 'none';
  const targetArrowShape = normalizeEdgeArrowShape(style.targetArrowShape) || 'none';
  const sourceArrowColor = String(style.sourceArrowColor || style.arrowColor || lineColor);
  const targetArrowColor = String(style.targetArrowColor || style.arrowColor || lineColor);
  const edgeLabelColor = style.edgeLabelColor ?? style.labelColor ?? lineColor;
  const zIndex = valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('link', 'zIndex', 6));

  return withoutUndefined({
    type: anchor === 'floating' ? 'floating' : curveType === 'bezier' ? 'default' : curveType,
    animated: !!style.animated,
    hidden: style.display === 'none',
    selectable: interactive ? undefined : false,
    focusable: interactive ? undefined : false,
    interactionWidth: interactive
      ? valueOrDefault(style.interactionWidth as number | undefined, Math.max(12, lineWidth + 10))
      : 0,
    zIndex,
    label: label || undefined,
    labelStyle: withoutUndefined({
      fill: edgeLabelColor,
      fontSize: style.labelFontSize,
      fontWeight: style.labelFontWeight,
      fontStyle: style.labelFontStyle
    }),
    labelBgStyle: withoutUndefined({
      fill: colorWithOpacity(style.textBackgroundColor, style.textBackgroundOpacity)
    }),
    data: {
      anchor,
      zIndex,
      curveType,
      routeKind: routeKind(style),
      interactive,
      labelInteractive: style.labelInteractive !== false,
      pipe: style.pipe === true,
      pipeWidth: style.pipeWidth,
      pipeFill: style.pipeFill,
      pipeBorderColor: style.pipeBorderColor || style.lineColor,
      pipeBorderWidth: style.pipeBorderWidth,
      pipeOpacity: style.pipeOpacity,
      directionalStrokes: style.directionalStrokes === true,
      directionCenterGap: positiveNumber(style.directionCenterGap),
      directionStartGap: positiveNumber(style.directionStartGap),
      directionLabelPlacement: style.directionLabelPlacement,
      directionLabelOffset: finiteNumber(style.directionLabelOffset),
      directionLabelRotation: style.directionLabelRotation,
      directionOverlayLayer: style.directionOverlayLayer,
      laneWidth: style.laneWidth,
      laneGap: style.laneGap,
      controlPointStepSize: style.controlPointStepSize,
      controlPointDistance: style.controlPointDistance,
      controlPointWeight: style.controlPointWeight,
      edgeDistances: style.edgeDistances,
      segmentDistances: numberList(style.segmentDistances),
      segmentWeights: numberList(style.segmentWeights),
      taxiRoutingExplicit: style.taxiDirection !== undefined || style.taxiTurn !== undefined || style.taxiTurnMinDistance !== undefined,
      taxiDirection: normalizeTaxiDirection(style.taxiDirection),
      taxiTurn: style.taxiTurn,
      taxiTurnMinDistance: positiveNumber(style.taxiTurnMinDistance),
      sourceDistanceFromNode: positiveNumber(style.sourceDistanceFromNode),
      targetDistanceFromNode: positiveNumber(style.targetDistanceFromNode),
      lineCap: style.lineCap,
      lineOutlineWidth: style.lineOutlineWidth,
      lineOutlineColor: style.lineOutlineColor,
      lineOpacity,
      lineFill,
      lineGradientStopColors: gradientStops?.colors,
      lineGradientStopPositions: gradientStops?.positions,
      sourceArrowShape,
      targetArrowShape,
      sourceArrowColor,
      targetArrowColor,
      sourceArrowBorderColor: style.sourceArrowBorderColor,
      targetArrowBorderColor: style.targetArrowBorderColor,
      sourceArrowBorderWidth: positiveNumber(style.sourceArrowBorderWidth),
      targetArrowBorderWidth: positiveNumber(style.targetArrowBorderWidth),
      lineWidth,
      sourceArrowSize: positiveNumber(style.sourceArrowSize),
      targetArrowSize: positiveNumber(style.targetArrowSize),
      sourceArrowOffset: finiteNumber(style.sourceArrowOffset),
      targetArrowOffset: finiteNumber(style.targetArrowOffset),
      labelBorderColor: style.labelBorderColor,
      labelBorderWidth: finiteNumber(style.labelBorderWidth),
      labelFontStyle: style.labelFontStyle,
      labelXOffset: finiteNumber(style.labelXOffset),
      labelYOffset: finiteNumber(style.labelYOffset),
      labelCollisionPolicy: style.labelCollisionPolicy,
      sourceLabel: sourceLabel === undefined ? undefined : String(sourceLabel),
      targetLabel: targetLabel === undefined ? undefined : String(targetLabel),
      edgeLabelColor,
      sourceLabelColor: style.sourceLabelColor,
      sourceLabelBackgroundColor: style.sourceLabelBackgroundColor,
      sourceLabelBorderColor: style.sourceLabelBorderColor,
      sourceLabelBorderWidth: finiteNumber(style.sourceLabelBorderWidth),
      sourceLabelFontSize: style.sourceLabelFontSize,
      sourceLabelFontWeight: style.sourceLabelFontWeight,
      sourceLabelFontStyle: style.sourceLabelFontStyle,
      sourceLabelOpacity: finiteNumber(style.sourceLabelOpacity),
      sourceLabelAutoPosition: style.sourceLabelAutoPosition,
      sourceLabelDistance: positiveNumber(style.sourceLabelDistance),
      sourceLabelMaxDistance: positiveNumber(style.sourceLabelMaxDistance),
      sourceLabelSideOffset: finiteNumber(style.sourceLabelSideOffset),
      targetLabelColor: style.targetLabelColor,
      targetLabelBackgroundColor: style.targetLabelBackgroundColor,
      targetLabelBorderColor: style.targetLabelBorderColor,
      targetLabelBorderWidth: finiteNumber(style.targetLabelBorderWidth),
      targetLabelFontSize: style.targetLabelFontSize,
      targetLabelFontWeight: style.targetLabelFontWeight,
      targetLabelFontStyle: style.targetLabelFontStyle,
      targetLabelOpacity: finiteNumber(style.targetLabelOpacity),
      targetLabelAutoPosition: style.targetLabelAutoPosition,
      targetLabelDistance: positiveNumber(style.targetLabelDistance),
      targetLabelMaxDistance: positiveNumber(style.targetLabelMaxDistance),
      targetLabelSideOffset: finiteNumber(style.targetLabelSideOffset),
      endpointLabelAutoPosition: style.endpointLabelAutoPosition,
      endpointLabelDistance: positiveNumber(style.endpointLabelDistance),
      endpointLabelMaxDistance: positiveNumber(style.endpointLabelMaxDistance),
      endpointLabelSideOffset: finiteNumber(style.endpointLabelSideOffset),
      endpointLabelOverlayLayer: style.endpointLabelOverlayLayer,
      sourceLabelOverlayLayer: style.sourceLabelOverlayLayer,
      targetLabelOverlayLayer: style.targetLabelOverlayLayer,
      labelZIndex: finiteNumber(style.labelZIndex),
      sourceLabelZIndex: finiteNumber(style.sourceLabelZIndex),
      targetLabelZIndex: finiteNumber(style.targetLabelZIndex),
      sourceLabelXOffset: finiteNumber(style.sourceLabelXOffset),
      sourceLabelYOffset: finiteNumber(style.sourceLabelYOffset),
      targetLabelXOffset: finiteNumber(style.targetLabelXOffset),
      targetLabelYOffset: finiteNumber(style.targetLabelYOffset),
      labelColor: style.labelColor,
      labelFontSize: finiteNumber(style.labelFontSize),
      labelFontWeight: style.labelFontWeight,
      textBackgroundColor: colorWithOpacity(style.textBackgroundColor, style.textBackgroundOpacity),
      textBackgroundOpacity: style.textBackgroundOpacity
    },
    style: withoutUndefined({
      stroke: lineColor,
      strokeWidth: lineWidth,
      strokeDasharray: mapLineDash(style),
      strokeDashoffset: style.lineDashOffset,
      strokeLinecap: style.lineCap,
      opacity: lineOpacity
    })
  });
}

export function compileRegionStyle(style: StyleDeclaration, width: number, height: number) {
  const borderWidth = Number(valueOrDefault(style.borderWidth as number | undefined, styleDefaultNumber('region', 'borderWidth', 1)));
  const shape = String(style.shape || styleDefaultValue('region', 'shape') || 'roundRectangle').toLowerCase();
  const borderRadius = shape === 'rectangle' ? 0 : shape === 'ellipse' ? '50%' : 4;
  const labelPosition = normalizeRegionLabelPosition(style.labelPosition) || String(styleDefaultValue('region', 'labelPosition') || 'topLeft');
  const explicitLabelMargin = regionLabelMargin(style.labelMargin);
  const defaultMargin = explicitLabelMargin ?? styleDefaultNumber('region', 'labelMargin', 12);
  const legacyLeftMargin = style.labelPosition === undefined && style.labelMargin === undefined ? 18 : defaultMargin;
  const labelPlacementStyle = regionLabelPlacementStyle(labelPosition, defaultMargin, legacyLeftMargin);

  return {
    flow: withoutUndefined({
      type: 'region',
      selectable: style.selectable === true,
      draggable: style.draggable === true,
      dragHandle: style.draggable === true ? '.topoviewer-region-drag' : undefined,
      width,
      height,
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('region', 'zIndex', -20)),
      style: withoutUndefined({
        width,
        height,
        zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('region', 'zIndex', -20)),
        opacity: style.opacity
      })
    }),
    data: {
      fill: String(style.backgroundColor || styleDefaultValue('region', 'backgroundColor') || 'rgba(76, 201, 240, 0.12)'),
      stroke: String(style.borderColor || styleDefaultValue('region', 'borderColor') || 'rgba(76, 201, 240, 0.62)'),
      borderWidth,
      borderRadius,
      labelPosition,
      labelMargin: defaultMargin,
      labelLeftMargin: legacyLeftMargin,
      labelZIndex: finiteNumber(style.labelZIndex),
      labelCollisionPolicy: style.labelCollisionPolicy,
      labelStyle: withoutUndefined({
        color: style.labelColor,
        background: style.labelBackgroundColor,
        fontSize: style.labelFontSize,
        fontWeight: style.labelFontWeight,
        ...labelPlacementStyle
      })
    }
  };
}

function regionLabelPlacementStyle(position: string, margin: number, leftMargin = margin) {
  const reset = { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto', transform: 'none' };
  const verticalCenter = { top: '50%', transform: 'translateY(-50%)' };
  const horizontalCenter = { left: '50%', transform: 'translateX(-50%)' };

  switch (position) {
    case 'topCenter':
      return { ...reset, top: margin, ...horizontalCenter };
    case 'topRight':
    case 'rightTop':
      return { ...reset, top: margin, right: margin };
    case 'rightCenter':
      return { ...reset, ...verticalCenter, right: margin };
    case 'rightBottom':
    case 'bottomRight':
      return { ...reset, right: margin, bottom: margin };
    case 'bottomCenter':
      return { ...reset, bottom: margin, ...horizontalCenter };
    case 'bottomLeft':
    case 'leftBottom':
      return { ...reset, bottom: margin, left: leftMargin };
    case 'leftTop':
    case 'topLeft':
      return { ...reset, top: margin, left: leftMargin };
    case 'leftCenter':
      return { ...reset, ...verticalCenter, left: leftMargin };
    default:
      return { ...reset, top: margin, left: leftMargin };
  }
}

function normalizeSize(value: unknown, fallbackWidth: number, fallbackHeight: number): { width: number; height: number } {
  if (Array.isArray(value)) {
    return {
      width: Number(value[0] || fallbackWidth),
      height: Number(value[1] || fallbackHeight)
    };
  }
  if (value && typeof value === 'object') {
    const size = value as Record<string, unknown>;
    return {
      width: Number(size.width || fallbackWidth),
      height: Number(size.height || fallbackHeight)
    };
  }
  return { width: fallbackWidth, height: fallbackHeight };
}

export function compileShapeStyle(style: StyleDeclaration, entity: DiagramShape) {
  const size = normalizeSize(entity.size, Number(style.width || styleDefaultNumber('shape', 'width', 180)), Number(style.height || styleDefaultNumber('shape', 'height', 72)));
  const shapeType = String(style.shape || entity.type || styleDefaultValue('shape', 'shape') || 'rectangle').toLowerCase();
  const fill = String(style.fill || style.backgroundColor || styleDefaultValue('shape', 'fill') || 'rgba(38, 54, 72, 0.82)');
  const stroke = String(style.stroke || style.borderColor || styleDefaultValue('shape', 'stroke') || 'rgba(148, 163, 184, 0.64)');
  const borderWidth = Number(valueOrDefault(style.borderWidth as number | undefined, styleDefaultNumber('shape', 'strokeWidth', 2)));
  const rotation = Number(valueOrDefault((style.rotation ?? style.rotate) as number | undefined, entity.rotation || 0));

  return {
    flow: withoutUndefined({
      type: 'shape',
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable === true && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-shape-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('shape', 'zIndex', -10)),
      style: withoutUndefined({
        width: size.width,
        height: size.height,
        opacity: style.opacity,
        pointerEvents: entity.locked === true ? 'none' : undefined
      })
    }),
    data: {
      shapeType,
      fill,
      stroke,
      borderWidth,
      rotation,
      edgeAnchor: {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
      },
      nodeStyle: {
        width: size.width,
        minHeight: size.height
      },
      labelZIndex: finiteNumber(style.labelZIndex),
      shapeStyle: withoutUndefined({
        width: size.width,
        height: size.height,
        backgroundColor: 'transparent',
        boxShadow: style.boxShadow,
        pointerEvents: entity.locked === true ? 'none' : undefined
      })
    }
  };
}

export function compileCalloutStyle(style: StyleDeclaration, entity: DiagramCallout) {
  const size = normalizeSize(entity.size, Number(style.width || styleDefaultNumber('callout', 'width', 320)), Number(style.height || styleDefaultNumber('callout', 'height', 120)));
  const align = String(entity.align || style.align || style.textAlign || styleDefaultValue('callout', 'textAlign') || 'left');
  const markdown = entity.markdown !== undefined ? entity.markdown : entity.body;

  return {
    flow: withoutUndefined({
      type: 'callout',
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable === true && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-callout-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('callout', 'zIndex', 30)),
      style: withoutUndefined({
        width: size.width,
        minHeight: size.height,
        opacity: style.opacity
      })
    }),
    data: {
      title: entity.title || entity.name,
      body: normalizeTextLines(entity.body),
      bodyHtml: markdownToHtml(markdown),
      edgeAnchor: {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height
      },
      nodeStyle: {
        width: size.width,
        minHeight: size.height
      },
      labelZIndex: finiteNumber(style.labelZIndex),
      shapeStyle: withoutUndefined({
        width: size.width,
        minHeight: size.height,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        color: style.color,
        boxShadow: style.boxShadow,
        textAlign: align
      }),
      headerStyle: withoutUndefined({
        color: style.titleColor || style.color,
        background: style.titleBackgroundColor,
        fontSize: style.titleFontSize,
        fontWeight: style.titleFontWeight,
        textAlign: align
      }),
      bodyStyle: withoutUndefined({
        color: style.bodyColor || style.color,
        fontSize: style.bodyFontSize,
        fontWeight: style.bodyFontWeight,
        lineHeight: style.bodyLineHeight,
        textAlign: align
      })
    }
  };
}
