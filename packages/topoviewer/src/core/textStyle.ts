import { valueOrDefault, withoutUndefined } from './object';
import { styleDefaultNumber, styleDefaultValue } from './styleDefaults';
import type { DiagramText, StyleDeclaration } from './types';

function positiveDimension(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function textSize(value: unknown) {
  if (Array.isArray(value)) {
    return {
      width: positiveDimension(value[0]),
      height: positiveDimension(value[1])
    };
  }
  if (value && typeof value === 'object') {
    const size = value as Record<string, unknown>;
    return {
      width: positiveDimension(size.width),
      height: positiveDimension(size.height)
    };
  }
  return undefined;
}

export function compileTextStyle(style: StyleDeclaration, entity: DiagramText) {
  const entitySize = textSize(entity.size);
  const width = entitySize?.width ?? positiveDimension(style.width);
  const height = entitySize?.height ?? positiveDimension(style.height);
  const autoWidth = width === undefined;
  const autoHeight = height === undefined;
  const textAlign = String(entity.align || style.textAlign || styleDefaultValue('text', 'textAlign') || 'left');
  const verticalAlign = String(entity.verticalAlign || style.verticalAlign || styleDefaultValue('text', 'verticalAlign') || 'top');
  const rotation = Number(valueOrDefault(style.rotation as number | undefined, entity.rotation || 0));
  const justifyContent = verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';
  const text = String(entity.text ?? entity.label ?? entity.name ?? '');

  return {
    flow: withoutUndefined({
      type: 'text',
      connectable: false,
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable !== false && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-text-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('text', 'zIndex', 20)),
      style: withoutUndefined({
        width: autoWidth ? 'max-content' : width,
        height: autoHeight ? 'max-content' : height,
        maxWidth: autoWidth ? 520 : undefined,
        opacity: style.opacity,
        pointerEvents: entity.locked === true ? 'none' : undefined
      })
    }),
    data: {
      autoSize: autoWidth && autoHeight,
      rotation,
      text,
      textBoxStyle: withoutUndefined({
        width: autoWidth ? 'max-content' : width,
        height: autoHeight ? 'max-content' : height,
        minWidth: autoWidth ? 48 : undefined,
        minHeight: autoHeight ? 28 : undefined,
        maxWidth: autoWidth ? 520 : undefined,
        display: 'flex',
        flexDirection: 'column',
        justifyContent,
        padding: style.padding,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderStyle: Number(style.borderWidth || 0) > 0 ? 'solid' : undefined,
        borderWidth: style.borderWidth,
        borderRadius: style.borderRadius,
        color: style.color,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        lineHeight: style.lineHeight,
        textAlign,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center'
      })
    }
  };
}
