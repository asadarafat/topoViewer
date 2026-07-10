import { Handle, NodeResizer, Position, type ResizeParams } from '@xyflow/react';
import type { CSSProperties, SVGAttributes } from 'react';
import type { CompiledNodeData } from '../core/types';

type Point = [number, number];

function points(values: Point[]): string {
  return values.map(([x, y]) => `${x},${y}`).join(' ');
}

function ShapeSvg({
  type,
  fill,
  stroke,
  strokeWidth,
  rotation
}: {
  type: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation: number;
}) {
  const common: SVGAttributes<SVGElement> = {
    fill,
    stroke,
    strokeWidth,
    strokeLinejoin: 'round',
    strokeLinecap: 'round'
  };
  const line: SVGAttributes<SVGElement> = {
    fill: 'none',
    stroke,
    strokeWidth,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
    opacity: 0.82
  };
  const facet: SVGAttributes<SVGElement> = {
    fill,
    fillOpacity: 0.58,
    stroke,
    strokeWidth,
    strokeLinejoin: 'round',
    strokeLinecap: 'round'
  };

  const renderShape = () => {
    switch (type) {
      case 'circle':
        return <circle cx="50" cy="50" r="38" {...common} />;
      case 'triangle':
        return <polygon points={points([[50, 10], [90, 86], [10, 86]])} {...common} />;
      case 'square':
        return <rect x="18" y="18" width="64" height="64" rx="3" {...common} />;
      case 'pentagon':
        return <polygon points={points([[50, 8], [90, 38], [75, 88], [25, 88], [10, 38]])} {...common} />;
      case 'hexagon':
        return <polygon points={points([[28, 10], [72, 10], [92, 50], [72, 90], [28, 90], [8, 50]])} {...common} />;
      case 'octagon':
        return <polygon points={points([[32, 10], [68, 10], [90, 32], [90, 68], [68, 90], [32, 90], [10, 68], [10, 32]])} {...common} />;
      case 'ellipse':
        return <ellipse cx="50" cy="50" rx="40" ry="28" {...common} />;
      case 'semicircle':
        return <path d="M10 76 A40 40 0 0 1 90 76 Z" {...common} />;
      case 'trapezoid':
        return <polygon points={points([[26, 20], [74, 20], [90, 80], [10, 80]])} {...common} />;
      case 'parallelogram':
        return <polygon points={points([[30, 20], [90, 20], [70, 80], [10, 80]])} {...common} />;
      case 'rhombus':
        return <polygon points={points([[50, 10], [90, 50], [50, 90], [10, 50]])} {...common} />;
      case 'kite':
        return <polygon points={points([[50, 8], [84, 42], [58, 92], [16, 42]])} {...common} />;
      case 'star':
        return <polygon points={points([[50, 8], [61, 35], [90, 35], [67, 54], [75, 84], [50, 66], [25, 84], [33, 54], [10, 35], [39, 35]])} {...common} />;
      case 'cube':
        return (
          <>
            <polygon points={points([[24, 38], [42, 20], [86, 20], [68, 38]])} {...facet} />
            <polygon points={points([[68, 38], [86, 20], [86, 64], [68, 82]])} {...facet} />
            <polygon points={points([[24, 38], [68, 38], [68, 82], [24, 82]])} {...common} />
            <path d="M24 38 L42 20 M68 38 L86 20 M68 82 L86 64" {...line} />
          </>
        );
      case 'cuboid':
        return (
          <>
            <polygon points={points([[16, 42], [32, 28], [92, 28], [76, 42]])} {...facet} />
            <polygon points={points([[76, 42], [92, 28], [92, 64], [76, 78]])} {...facet} />
            <polygon points={points([[16, 42], [76, 42], [76, 78], [16, 78]])} {...common} />
            <path d="M16 42 L32 28 M76 42 L92 28 M76 78 L92 64" {...line} />
          </>
        );
      case 'sphere':
        return (
          <>
            <circle cx="50" cy="50" r="38" {...common} />
            <ellipse cx="50" cy="50" rx="15" ry="38" {...line} />
            <ellipse cx="50" cy="50" rx="38" ry="14" {...line} />
          </>
        );
      case 'cone':
        return (
          <>
            <path d="M50 10 L86 78 A36 10 0 0 1 14 78 Z" {...common} />
            <ellipse cx="50" cy="78" rx="36" ry="10" {...line} />
          </>
        );
      case 'cylinder':
        return (
          <>
            <path d="M16 28 A34 12 0 0 1 84 28 V76 A34 12 0 0 1 16 76 Z" {...common} />
            <ellipse cx="50" cy="28" rx="34" ry="12" {...facet} />
            <path d="M16 76 A34 12 0 0 0 84 76" {...line} />
          </>
        );
      case 'pyramid':
        return (
          <>
            <polygon points={points([[50, 10], [90, 82], [14, 82]])} {...common} />
            <path d="M50 10 L48 82 M14 82 L48 66 L90 82" {...line} />
          </>
        );
      case 'prism':
        return (
          <>
            <polygon points={points([[24, 30], [72, 30], [50, 10]])} {...facet} />
            <polygon points={points([[24, 30], [72, 30], [86, 74], [38, 74]])} {...common} />
            <polygon points={points([[50, 10], [72, 30], [86, 74], [64, 54]])} {...facet} />
            <path d="M24 30 L38 74 L86 74 M50 10 L64 54 L38 74" {...line} />
          </>
        );
      case 'rectangle':
      default:
        return <rect x="10" y="25" width="80" height="50" rx="4" {...common} />;
    }
  };

  return <g transform={rotation ? `rotate(${rotation} 50 50)` : undefined}>{renderShape()}</g>;
}

export function ShapeNode({ data }: { data: CompiledNodeData }) {
  const shapeType = data.shapeType || 'rectangle';
  const fill = data.fill || 'rgba(38, 54, 72, 0.82)';
  const stroke = data.stroke || 'rgba(148, 163, 184, 0.64)';
  const strokeWidth = Number(data.borderWidth || 2);
  const rotation = Number(data.rotation || 0);
  const onResizeEnd = typeof data.__topoviewerOnResizeEnd === 'function'
    ? data.__topoviewerOnResizeEnd as (params: ResizeParams) => void
    : undefined;

  return (
    <div
      className={`topoviewer-shape topoviewer-shape-drag topoviewer-shape-${shapeType}`}
      style={data.shapeStyle as CSSProperties}
      aria-label={data.name || data.id}
      data-topoviewer-object-id={data.id}
    >
      <NodeResizer
        isVisible={data.__topoviewerResizable === true}
        minWidth={48}
        minHeight={32}
        handleClassName="topoviewer-resize-handle"
        lineClassName="topoviewer-resize-line"
        onResizeEnd={onResizeEnd ? (_event, params) => onResizeEnd(params) : undefined}
      />
      <Handle type="target" position={Position.Left} />
      <svg className="topoviewer-shape-geometry" viewBox="0 0 100 100" role="presentation" focusable="false">
        <ShapeSvg type={shapeType} fill={fill} stroke={stroke} strokeWidth={strokeWidth} rotation={rotation} />
      </svg>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
