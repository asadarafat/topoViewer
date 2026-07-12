import { valueOrDefault, withoutUndefined } from './object';
import { styleDefaultNumber, styleDefaultValue } from './styleDefaults';
import type { DiagramText, StyleDeclaration } from './types';

function textSize(value: unknown, fallbackWidth: number, fallbackHeight: number) {
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

export function compileTextStyle(style: StyleDeclaration, entity: DiagramText) {
  const size = textSize(
    entity.size,
    Number(style.width || styleDefaultNumber('text', 'width', 220)),
    Number(style.height || styleDefaultNumber('text', 'height', 64))
  );
  const textAlign = String(entity.align || style.textAlign || styleDefaultValue('text', 'textAlign') || 'left');
  const verticalAlign = String(entity.verticalAlign || style.verticalAlign || styleDefaultValue('text', 'verticalAlign') || 'top');
  const rotation = Number(valueOrDefault(style.rotation as number | undefined, entity.rotation || 0));
  const justifyContent = verticalAlign === 'middle' ? 'center' : verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';

  return {
    flow: withoutUndefined({
      type: 'text',
      draggable: style.draggable !== false && entity.locked !== true,
      selectable: style.selectable !== false && entity.locked !== true,
      dragHandle: entity.locked === true ? undefined : '.topoviewer-text-drag',
      hidden: style.display === 'none',
      zIndex: valueOrDefault(style.zIndex as number | undefined, styleDefaultNumber('text', 'zIndex', 20)),
      style: withoutUndefined({
        width: size.width,
        height: size.height,
        opacity: style.opacity,
        pointerEvents: entity.locked === true ? 'none' : undefined
      })
    }),
    data: {
      edgeAnchor: { x: 0, y: 0, width: size.width, height: size.height },
      rotation,
      text: String(entity.text ?? entity.label ?? entity.name ?? ''),
      textBoxStyle: withoutUndefined({
        width: size.width,
        height: size.height,
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
