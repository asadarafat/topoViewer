import { MarkerType } from '@xyflow/react';
import { matchingRules } from './selector';
import { mergePlainObjects, valueOrDefault, withoutUndefined } from './object';
import { isSafeImageReference } from './security';
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
  if (![3, 6].includes(hex.length)) return text;
  const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) return text;
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function dashPattern(value: unknown): string {
  if (Array.isArray(value)) return value.join(' ');
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
  const curveStyle = String(style.curveStyle || 'bezier').toLowerCase();
  if (['straight', 'haystack'].includes(curveStyle)) return 'straight';
  if (['segments', 'taxi'].includes(curveStyle)) return 'step';
  if (['round-segments', 'round-taxi', 'smooth-taxi', 'smooth-step', 'smoothstep'].includes(curveStyle)) return 'smoothstep';
  if (['simplebezier', 'unbundled-bezier'].includes(curveStyle)) return 'simplebezier';
  if (curveStyle === 'bezier') return 'bezier';
  return 'default';
}

function mapArrowShape(shape: unknown, color: string) {
  const arrowShape = String(shape || 'none').toLowerCase();
  if (['none', 'no-arrow'].includes(arrowShape)) return undefined;
  return { type: MarkerType.ArrowClosed, color };
}

export function compileNodeStyle(style: StyleDeclaration, entity: GraphEntity, spec: StylesheetDocument) {
  const icon = iconForStyle(style, entity, spec);
  const width = Number(valueOrDefault(style.width as number | undefined, 82));
  const height = Number(valueOrDefault(style.height as number | undefined, 60));
  const iconWidth = Number(valueOrDefault((style.iconWidth ?? style.iconSize) as number | undefined, 34));
  const iconHeight = Number(valueOrDefault((style.iconHeight ?? style.iconSize) as number | undefined, 34));
  const shape = String(style.shape || 'ellipse').toLowerCase();
  const borderRadius = shape === 'rectangle' ? 0 : shape === 'roundrectangle' ? 8 : '50%';

  return {
    flow: withoutUndefined({
      type: 'network',
      draggable: style.draggable !== false,
      selectable: style.selectable !== false,
      dragHandle: '.topoviewer-node-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, 10),
      style: withoutUndefined({
        width,
        opacity: style.opacity
      })
    }),
    data: {
      iconSpec: icon,
      labelHtml: markdownToHtml(displayName(entity)),
      edgeAnchor: {
        x: (width - iconWidth) / 2,
        y: 0,
        width: iconWidth,
        height: iconHeight
      },
      nodeStyle: withoutUndefined({
        width,
        minHeight: height
      }),
      iconStyle: withoutUndefined({
        width: iconWidth,
        height: iconHeight,
        borderRadius,
        borderColor: style.borderColor || icon.stroke,
        borderWidth: style.borderWidth,
        backgroundColor: style.backgroundColor || icon.fill,
        color: style.iconColor
      }),
      labelStyle: withoutUndefined({
        color: style.labelColor,
        fontSize: style.labelFontSize,
        fontWeight: style.labelFontWeight
      }),
      metaStyle: withoutUndefined({
        color: style.metaColor,
        fontSize: style.metaFontSize,
        fontWeight: style.metaFontWeight
      })
    }
  };
}

export function compileEdgeStyle(style: StyleDeclaration, entity: GraphEntity, spec: StylesheetDocument, labelsEnabled: boolean) {
  const lineColor = String(style.lineColor || '#6ea8fe');
  const label = edgeLabel(entity, spec, labelsEnabled, String(style.label || ''));
  const sourceLabel = labelsEnabled ? style.sourceLabel : undefined;
  const targetLabel = labelsEnabled ? style.targetLabel : undefined;
  const curveType = mapCurveStyle(style);
  const anchor = String(style.anchor || 'floating').toLowerCase();
  const lineWidth = Number(style.lineWidth || 1);
  const lineOpacity = style.lineOpacity ?? style.opacity;

  return withoutUndefined({
    type: anchor === 'floating' ? 'floating' : curveType === 'bezier' ? 'default' : curveType,
    animated: !!style.animated,
    hidden: style.display === 'none',
    interactionWidth: valueOrDefault(style.interactionWidth as number | undefined, Math.max(12, lineWidth + 10)),
    zIndex: valueOrDefault(style.zIndex as number | undefined, 6),
    markerStart: mapArrowShape(style.sourceArrowShape, String(style.arrowColor || lineColor)),
    markerEnd: mapArrowShape(style.targetArrowShape, String(style.arrowColor || lineColor)),
    label: label || undefined,
    labelStyle: withoutUndefined({
      fill: style.labelColor,
      fontSize: style.labelFontSize,
      fontWeight: style.labelFontWeight
    }),
    labelBgStyle: withoutUndefined({
      fill: colorWithOpacity(style.textBackgroundColor, style.textBackgroundOpacity)
    }),
    data: {
      anchor,
      curveType,
      pipe: style.pipe === true,
      pipeWidth: style.pipeWidth,
      pipeFill: style.pipeFill,
      pipeBorderColor: style.pipeBorderColor || style.lineColor,
      pipeBorderWidth: style.pipeBorderWidth,
      pipeOpacity: style.pipeOpacity,
      laneWidth: style.laneWidth,
      laneGap: style.laneGap,
      controlPointStepSize: style.controlPointStepSize,
      controlPointDistance: style.controlPointDistance,
      controlPointWeight: style.controlPointWeight,
      edgeDistances: style.edgeDistances,
      lineCap: style.lineCap,
      lineOutlineWidth: style.lineOutlineWidth,
      lineOutlineColor: style.lineOutlineColor,
      lineOpacity,
      sourceLabel: sourceLabel === undefined ? undefined : String(sourceLabel),
      targetLabel: targetLabel === undefined ? undefined : String(targetLabel),
      sourceLabelXOffset: style.sourceLabelXOffset,
      sourceLabelYOffset: style.sourceLabelYOffset,
      targetLabelXOffset: style.targetLabelXOffset,
      targetLabelYOffset: style.targetLabelYOffset
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
  const borderWidth = Number(valueOrDefault(style.borderWidth as number | undefined, 1));
  const shape = String(style.shape || 'roundrectangle').toLowerCase();
  const borderRadius = shape === 'rectangle' ? 0 : shape === 'ellipse' ? '50%' : 4;

  return {
    flow: withoutUndefined({
      type: 'region',
      selectable: style.selectable === true,
      draggable: style.draggable === true,
      dragHandle: style.draggable === true ? '.topoviewer-region-drag' : undefined,
      width,
      height,
      zIndex: valueOrDefault(style.zIndex as number | undefined, -20),
      style: withoutUndefined({
        width,
        height,
        zIndex: valueOrDefault(style.zIndex as number | undefined, -20),
        opacity: style.opacity
      })
    }),
    data: {
      fill: String(style.backgroundColor || 'rgba(76, 201, 240, 0.12)'),
      stroke: String(style.borderColor || 'rgba(76, 201, 240, 0.62)'),
      borderWidth,
      borderRadius,
      labelStyle: withoutUndefined({
        color: style.labelColor,
        background: style.labelBackgroundColor
      })
    }
  };
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
  const size = normalizeSize(entity.size, Number(style.width || 180), Number(style.height || 72));
  const shapeType = String(style.shape || entity.type || 'rectangle').toLowerCase();
  const fill = String(style.fill || style.backgroundColor || 'rgba(38, 54, 72, 0.82)');
  const stroke = String(style.stroke || style.borderColor || 'rgba(148, 163, 184, 0.64)');
  const borderWidth = Number(valueOrDefault(style.borderWidth as number | undefined, 2));
  const rotation = Number(valueOrDefault((style.rotation ?? style.rotate) as number | undefined, entity.rotation || 0));

  return {
    flow: withoutUndefined({
      type: 'shape',
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable === true && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-shape-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, -10),
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
  const size = normalizeSize(entity.size, Number(style.width || 320), Number(style.height || 120));
  const align = String(entity.align || style.align || style.textAlign || 'left');
  const markdown = entity.markdown !== undefined ? entity.markdown : entity.body;

  return {
    flow: withoutUndefined({
      type: 'callout',
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable === true && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-callout-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, 30),
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
