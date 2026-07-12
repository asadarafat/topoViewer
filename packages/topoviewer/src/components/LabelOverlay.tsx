import { ViewportPortal, useStore, useViewport, type Edge, type Node } from '@xyflow/react';
import { memo, useMemo, type CSSProperties } from 'react';
import { labelBounds, placeLabels, type LabelCollisionPolicy, type LabelPlacementCandidate, type LabelPlacementItem, type LabelPlacementObstacle, type LabelPlacementResult } from '../core/labelPlacement';
import { displayName, formatLabels } from '../core/style';
import type { Bounds, CompiledNodeData } from '../core/types';

type RuntimeNode = Node<Record<string, unknown>> & {
  measured?: {
    width?: number;
    height?: number;
  };
  positionAbsolute?: {
    x: number;
    y: number;
  };
  internals?: {
    positionAbsolute?: {
      x: number;
      y: number;
    };
  };
};

type RuntimeEdge = Edge<Record<string, unknown>> & {
  label?: unknown;
};

type AnchorTransform = {
  x: number;
  y: number;
  transform: string;
};

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function cssNumber(value: unknown, fallback: number): number {
  return finiteNumber(value) ?? fallback;
}

function textValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function labelCollisionPolicy(value: unknown): LabelCollisionPolicy {
  if (value === 'none' || value === 'fade' || value === 'hide') return value;
  return 'avoid';
}

function nodeSize(node: RuntimeNode, data: CompiledNodeData): { width: number; height: number } {
  const nodeStyle = (data.nodeStyle || {}) as Record<string, unknown>;
  const flowStyle = (node.style || {}) as Record<string, unknown>;
  return {
    width: cssNumber(node.width ?? node.measured?.width ?? flowStyle.width ?? nodeStyle.width, 82),
    height: cssNumber(node.height ?? node.measured?.height ?? flowStyle.height ?? nodeStyle.minHeight, 60)
  };
}

function edgeAnchor(data: CompiledNodeData, width: number, height: number): Bounds {
  const anchor = data.edgeAnchor;
  if (anchor) return anchor;
  return { x: 0, y: 0, width, height };
}

function nodePosition(node: RuntimeNode): { x: number; y: number } {
  return node.internals?.positionAbsolute || node.positionAbsolute || node.position || { x: 0, y: 0 };
}

function nodeLabelCandidate(node: RuntimeNode, data: CompiledNodeData, labelPosition: string): AnchorTransform {
  const { width, height } = nodeSize(node, data);
  const anchor = edgeAnchor(data, width, height);
  const position = nodePosition(node);
  const nodeStyle = (data.nodeStyle || {}) as Record<string, unknown>;
  const offsetX = cssNumber(nodeStyle['--topoviewer-node-label-x-offset'], 0);
  const offsetY = cssNumber(nodeStyle['--topoviewer-node-label-y-offset'], 0);
  const centerX = position.x + anchor.x + anchor.width / 2;
  const centerY = position.y + anchor.y + anchor.height / 2;

  switch (labelPosition) {
    case 'top':
      return {
        x: centerX + offsetX,
        y: position.y + anchor.y - 8 + offsetY,
        transform: 'translate(-50%, -100%)'
      };
    case 'left':
      return {
        x: position.x + anchor.x - 8 + offsetX,
        y: centerY + offsetY,
        transform: 'translate(-100%, -50%)'
      };
    case 'right':
      return {
        x: position.x + anchor.x + anchor.width + 8 + offsetX,
        y: centerY + offsetY,
        transform: 'translate(0, -50%)'
      };
    case 'center':
      return {
        x: centerX + offsetX,
        y: centerY + offsetY,
        transform: 'translate(-50%, -50%)'
      };
    case 'bottom':
    default:
      return {
        x: centerX + offsetX,
        y: position.y + anchor.y + anchor.height + 8 + offsetY,
        transform: 'translate(-50%, 0)'
      };
  }
}

function nodeMetaCandidate(node: RuntimeNode, data: CompiledNodeData, labelPosition: string): AnchorTransform {
  const { width, height } = nodeSize(node, data);
  const anchor = edgeAnchor(data, width, height);
  const position = nodePosition(node);
  const nodeStyle = (data.nodeStyle || {}) as Record<string, unknown>;
  const offsetX = cssNumber(nodeStyle['--topoviewer-node-label-x-offset'], 0);
  const offsetY = cssNumber(nodeStyle['--topoviewer-node-label-y-offset'], 0);
  const centerX = position.x + anchor.x + anchor.width / 2;
  const centerY = position.y + anchor.y + anchor.height / 2;

  switch (labelPosition) {
    case 'top':
      return { x: centerX + offsetX, y: position.y + anchor.y - 28 + offsetY, transform: 'translate(-50%, -100%)' };
    case 'left':
      return { x: position.x + anchor.x - 18 + offsetX, y: centerY + offsetY, transform: 'translate(-100%, -50%)' };
    case 'right':
      return { x: position.x + anchor.x + anchor.width + 18 + offsetX, y: centerY + offsetY, transform: 'translate(0, -50%)' };
    case 'center':
      return { x: centerX + offsetX, y: centerY + 18 + offsetY, transform: 'translate(-50%, 0)' };
    case 'bottom':
    default:
      return { x: centerX + offsetX, y: position.y + anchor.y + anchor.height + 30 + offsetY, transform: 'translate(-50%, 0)' };
  }
}

function uniqueCandidates(candidates: AnchorTransform[]): AnchorTransform[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.x}:${candidate.y}:${candidate.transform}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nodeLabelCandidates(node: RuntimeNode, data: CompiledNodeData): AnchorTransform[] {
  const preferred = String(data.labelPosition || 'bottom');
  return uniqueCandidates([
    nodeLabelCandidate(node, data, preferred),
    nodeLabelCandidate(node, data, 'bottom'),
    nodeLabelCandidate(node, data, 'top'),
    nodeLabelCandidate(node, data, 'right'),
    nodeLabelCandidate(node, data, 'left'),
    nodeLabelCandidate(node, data, 'center')
  ]);
}

function nodeMetaCandidates(node: RuntimeNode, data: CompiledNodeData): AnchorTransform[] {
  const preferred = String(data.labelPosition || 'bottom');
  return uniqueCandidates([
    nodeMetaCandidate(node, data, preferred),
    nodeMetaCandidate(node, data, 'bottom'),
    nodeMetaCandidate(node, data, 'top'),
    nodeMetaCandidate(node, data, 'right'),
    nodeMetaCandidate(node, data, 'left'),
    nodeMetaCandidate(node, data, 'center')
  ]);
}

function regionLabelCandidate(node: RuntimeNode, data: CompiledNodeData, labelPosition: string): AnchorTransform {
  const { width, height } = nodeSize(node, data);
  const position = nodePosition(node);
  const margin = cssNumber(data.labelMargin, 12);
  const leftMargin = cssNumber(data.labelLeftMargin, margin);

  switch (labelPosition) {
    case 'topCenter':
      return { x: position.x + width / 2, y: position.y + margin, transform: 'translate(-50%, 0)' };
    case 'topRight':
    case 'rightTop':
      return { x: position.x + width - margin, y: position.y + margin, transform: 'translate(-100%, 0)' };
    case 'rightCenter':
      return { x: position.x + width - margin, y: position.y + height / 2, transform: 'translate(-100%, -50%)' };
    case 'rightBottom':
    case 'bottomRight':
      return { x: position.x + width - margin, y: position.y + height - margin, transform: 'translate(-100%, -100%)' };
    case 'bottomCenter':
      return { x: position.x + width / 2, y: position.y + height - margin, transform: 'translate(-50%, -100%)' };
    case 'bottomLeft':
    case 'leftBottom':
      return { x: position.x + leftMargin, y: position.y + height - margin, transform: 'translate(0, -100%)' };
    case 'leftCenter':
      return { x: position.x + leftMargin, y: position.y + height / 2, transform: 'translate(0, -50%)' };
    case 'leftTop':
    case 'topLeft':
    default:
      return { x: position.x + leftMargin, y: position.y + margin, transform: 'translate(0, 0)' };
  }
}

function regionLabelCandidates(node: RuntimeNode, data: CompiledNodeData): AnchorTransform[] {
  const preferred = String(data.labelPosition || 'topLeft');
  return uniqueCandidates([
    regionLabelCandidate(node, data, preferred),
    regionLabelCandidate(node, data, 'topLeft'),
    regionLabelCandidate(node, data, 'topCenter'),
    regionLabelCandidate(node, data, 'topRight'),
    regionLabelCandidate(node, data, 'rightCenter'),
    regionLabelCandidate(node, data, 'bottomRight'),
    regionLabelCandidate(node, data, 'bottomCenter'),
    regionLabelCandidate(node, data, 'bottomLeft'),
    regionLabelCandidate(node, data, 'leftCenter')
  ]);
}

function overlayStyle(
  baseStyle: CSSProperties | undefined,
  point: AnchorTransform | LabelPlacementResult,
  zIndex: number,
  overrideStyle?: CSSProperties
): CSSProperties {
  const opacity = 'opacity' in point ? point.opacity : undefined;
  const hidden = 'hidden' in point ? point.hidden : undefined;
  return {
    ...(baseStyle || {}),
    position: 'absolute',
    left: point.x,
    top: point.y,
    zIndex,
    transform: point.transform,
    pointerEvents: 'none',
    ...(opacity === undefined ? {} : { opacity }),
    ...(hidden ? { display: 'none' } : {}),
    ...(overrideStyle || {})
  };
}

function shouldRenderOverlayLabel(data: CompiledNodeData, viewportZoom: number): boolean {
  if (finiteNumber(data.labelZIndex) === undefined) return false;
  if (data.attentionLabelPriority === 'hidden') return false;
  if (typeof data.labelMinZoom === 'number') {
    const configuredFontSize = cssNumber(data.labelStyle?.fontSize, 10);
    return configuredFontSize * viewportZoom >= data.labelMinZoom;
  }
  return true;
}

function shouldRenderOverlayMeta(data: CompiledNodeData): boolean {
  return finiteNumber(data.metaZIndex) !== undefined
    && data.metaVisible !== false
    && formatLabels(data.labels) !== '';
}

function labelContent(data: CompiledNodeData) {
  if (data.labelHtml) return { dangerouslySetInnerHTML: { __html: data.labelHtml } };
  return {};
}

function estimateLabelSize(text: string, style: CSSProperties | undefined, fallbackFontSize = 10): { width: number; height: number } {
  const fontSize = cssNumber(style?.fontSize, fallbackFontSize);
  const padding = cssNumber(style?.padding, 4);
  const borderWidth = cssNumber(style?.borderWidth, 0);
  const maxWidth = finiteNumber(style?.maxWidth);
  const width = Math.max(22, text.length * fontSize * 0.58 + padding * 2 + borderWidth * 2 + 4);
  return {
    width: maxWidth === undefined ? width : Math.min(width, maxWidth),
    height: Math.max(16, fontSize + padding * 2 + borderWidth * 2 + 4)
  };
}

function nodeBodyObstacle(node: RuntimeNode, data: CompiledNodeData): LabelPlacementObstacle | undefined {
  if (node.hidden || node.type !== 'network') return undefined;
  const position = nodePosition(node);
  const size = nodeSize(node, data);
  const anchor = edgeAnchor(data, size.width, size.height);
  return {
    id: `${node.id}:body`,
    bounds: {
      x: position.x + anchor.x,
      y: position.y + anchor.y,
      width: anchor.width,
      height: anchor.height
    }
  };
}

function nodeBounds(node: RuntimeNode, data: CompiledNodeData): Bounds {
  const position = nodePosition(node);
  const size = nodeSize(node, data);
  const anchor = edgeAnchor(data, size.width, size.height);
  return {
    x: position.x + anchor.x,
    y: position.y + anchor.y,
    width: anchor.width,
    height: anchor.height
  };
}

function intersects(first: Bounds, second: Bounds): boolean {
  return first.x <= second.x + second.width
    && first.x + first.width >= second.x
    && first.y <= second.y + second.height
    && first.y + first.height >= second.y;
}

function boxCenter(box: Bounds) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

function boundaryPoint(from: Bounds, to: Bounds) {
  const source = boxCenter(from);
  const target = boxCenter(to);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (dx === 0 && dy === 0) return source;
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : (from.width / 2) / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : (from.height / 2) / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return {
    x: source.x + dx * scale,
    y: source.y + dy * scale
  };
}

function edgeLabelSize(data: Record<string, unknown>, text: string, role: 'center' | 'source' | 'target') {
  const fontSize = cssNumber(role === 'center' ? data.labelFontSize : data[`${role}LabelFontSize`] ?? data.labelFontSize, 10);
  return {
    width: Math.max(22, text.length * fontSize * 0.58 + 14),
    height: Math.max(16, fontSize + 10)
  };
}

function obstacleFromLabel(id: string, point: LabelPlacementCandidate, width: number, height: number): LabelPlacementObstacle {
  return {
    id,
    bounds: labelBounds(point, width, height)
  };
}

function endpointLabelObstacle(
  edge: RuntimeEdge,
  role: 'source' | 'target',
  data: Record<string, unknown>,
  sourceEndpoint: { x: number; y: number },
  targetEndpoint: { x: number; y: number }
): LabelPlacementObstacle | undefined {
  const label = textValue(data[`${role}Label`]);
  if (!label) return undefined;
  const lineWidth = cssNumber(data.lineWidth, 1);
  const distance = cssNumber(data[`${role}LabelDistance`] ?? data.endpointLabelDistance, Math.max(18, lineWidth + 14));
  const sideOffset = cssNumber(data[`${role}LabelSideOffset`] ?? data.endpointLabelSideOffset, 0);
  const xOffset = cssNumber(data[`${role}LabelXOffset`], 0);
  const yOffset = cssNumber(data[`${role}LabelYOffset`], 0);
  const dx = targetEndpoint.x - sourceEndpoint.x;
  const dy = targetEndpoint.y - sourceEndpoint.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const unit = { x: dx / length, y: dy / length };
  const normal = { x: -unit.y, y: unit.x };
  const direction = role === 'source' ? 1 : -1;
  const anchor = role === 'source' ? sourceEndpoint : targetEndpoint;
  const point = {
    x: anchor.x + unit.x * distance * direction + normal.x * sideOffset + xOffset,
    y: anchor.y + unit.y * distance * direction + normal.y * sideOffset + yOffset,
    transform: 'translate(-50%, -50%)'
  };
  const size = edgeLabelSize(data, label, role);
  return obstacleFromLabel(`${edge.id}:${role}Label`, point, size.width, size.height);
}

function directionLabelObstacles(
  edge: RuntimeEdge,
  data: Record<string, unknown>,
  sourceEndpoint: { x: number; y: number },
  targetEndpoint: { x: number; y: number }
): LabelPlacementObstacle[] {
  if (!Array.isArray(data.linkDirections)) return [];
  const dx = targetEndpoint.x - sourceEndpoint.x;
  const dy = targetEndpoint.y - sourceEndpoint.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const unit = { x: dx / length, y: dy / length };
  const normal = { x: -unit.y, y: unit.x };
  const offset = cssNumber(data.directionLabelOffset, 0);

  return data.linkDirections.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const direction = entry as Record<string, unknown>;
    const label = textValue(direction.label);
    if (!label) return [];
    const key = String(direction.direction || index);
    const directionMultiplier = key === 'sourceToTarget' ? -1 : 1;
    const point = {
      x: (sourceEndpoint.x + targetEndpoint.x) / 2 + normal.x * offset * directionMultiplier,
      y: (sourceEndpoint.y + targetEndpoint.y) / 2 + normal.y * offset * directionMultiplier,
      transform: 'translate(-50%, -50%)'
    };
    const directionData = (direction.data && typeof direction.data === 'object' ? direction.data : {}) as Record<string, unknown>;
    const size = edgeLabelSize({ ...data, ...directionData }, label, 'center');
    return [obstacleFromLabel(`${edge.id}:direction:${key}`, point, size.width, size.height)];
  });
}

function edgeLabelObstacles(edges: RuntimeEdge[], nodes: RuntimeNode[]): LabelPlacementObstacle[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  return edges.flatMap((edge) => {
    if (edge.hidden) return [];
    const data = (edge.data || {}) as Record<string, unknown>;
    const hasDirectionLabel = Array.isArray(data.linkDirections)
      && data.linkDirections.some((entry) => (
        entry && typeof entry === 'object' && textValue((entry as Record<string, unknown>).label)
      ));
    if (
      !textValue(edge.label ?? data.label)
      && !textValue(data.sourceLabel)
      && !textValue(data.targetLabel)
      && !hasDirectionLabel
    ) return [];
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);
    const sourceData = sourceNode?.data as unknown as CompiledNodeData | undefined;
    const targetData = targetNode?.data as unknown as CompiledNodeData | undefined;
    if (!sourceNode || !targetNode || !sourceData || !targetData) return [];

    const sourceBox = nodeBounds(sourceNode, sourceData);
    const targetBox = nodeBounds(targetNode, targetData);
    const sourceEndpoint = boundaryPoint(sourceBox, targetBox);
    const targetEndpoint = boundaryPoint(targetBox, sourceBox);
    const obstacles: LabelPlacementObstacle[] = [];
    const centerLabel = textValue(edge.label ?? data.label);
    if (centerLabel) {
      const xOffset = cssNumber(data.labelXOffset, 0);
      const yOffset = cssNumber(data.labelYOffset, 0);
      const point = {
        x: (sourceEndpoint.x + targetEndpoint.x) / 2 + xOffset,
        y: (sourceEndpoint.y + targetEndpoint.y) / 2 + yOffset,
        transform: 'translate(-50%, -50%)'
      };
      const size = edgeLabelSize(data, centerLabel, 'center');
      obstacles.push(obstacleFromLabel(`${edge.id}:label`, point, size.width, size.height));
    }

    const sourceLabel = endpointLabelObstacle(edge, 'source', data, sourceEndpoint, targetEndpoint);
    const targetLabel = endpointLabelObstacle(edge, 'target', data, sourceEndpoint, targetEndpoint);
    if (sourceLabel) obstacles.push(sourceLabel);
    if (targetLabel) obstacles.push(targetLabel);
    obstacles.push(...directionLabelObstacles(edge, data, sourceEndpoint, targetEndpoint));
    return obstacles;
  });
}

function labelItems(nodes: RuntimeNode[], viewportZoom: number): LabelPlacementItem[] {
  return nodes.flatMap((node) => {
    const data = node.data as unknown as CompiledNodeData | undefined;
    const labelZIndex = finiteNumber(data?.labelZIndex);
    if (!data || node.hidden) return [];
    const items: LabelPlacementItem[] = [];

    if (labelZIndex !== undefined && shouldRenderOverlayLabel(data, viewportZoom)) {
      const text = displayName(data);
      const size = estimateLabelSize(text, data.labelStyle, node.type === 'region' ? 12 : 10);

      if (node.type === 'region') {
        items.push({
          id: `${node.id}:label`,
          width: size.width,
          height: size.height,
          priority: cssNumber(data.labelPriority, 40),
          collisionPolicy: labelCollisionPolicy(data.labelCollisionPolicy),
          candidates: regionLabelCandidates(node, data)
        });
      }

      if (node.type === 'network') {
        items.push({
          id: `${node.id}:label`,
          width: size.width,
          height: size.height,
          priority: cssNumber(data.labelPriority, 80),
          collisionPolicy: labelCollisionPolicy(data.labelCollisionPolicy),
          ignoredObstacleIds: [`${node.id}:body`],
          candidates: nodeLabelCandidates(node, data)
        });
      }
    }

    if (node.type === 'network' && shouldRenderOverlayMeta(data)) {
      const metaText = formatLabels(data.labels);
      const size = estimateLabelSize(metaText, data.metaStyle, 9);
      items.push({
        id: `${node.id}:meta`,
        width: size.width,
        height: size.height,
        priority: cssNumber(data.metaPriority, 70),
        collisionPolicy: labelCollisionPolicy(data.labelCollisionPolicy),
        candidates: nodeMetaCandidates(node, data)
      });
    }

    return items;
  });
}

function LabelOverlayComponent({
  nodes,
  edges = [],
  onlyRenderVisibleElements = false
}: {
  nodes: RuntimeNode[];
  edges?: RuntimeEdge[];
  frozen?: boolean;
  onlyRenderVisibleElements?: boolean;
}) {
  const viewport = useViewport();
  const viewportSize = useStore(
    (state) => ({ height: state.height, width: state.width }),
    (previous, next) => previous.height === next.height && previous.width === next.width
  );
  const visibleBounds = useMemo<Bounds | undefined>(() => {
    if (!onlyRenderVisibleElements || viewportSize.width <= 0 || viewportSize.height <= 0) return undefined;
    const zoom = Math.max(0.01, viewport.zoom);
    const margin = 160;
    return {
      x: (-viewport.x - margin) / zoom,
      y: (-viewport.y - margin) / zoom,
      width: (viewportSize.width + margin * 2) / zoom,
      height: (viewportSize.height + margin * 2) / zoom
    };
  }, [onlyRenderVisibleElements, viewport.x, viewport.y, viewport.zoom, viewportSize.height, viewportSize.width]);
  const overlayNodes = useMemo(() => {
    if (!visibleBounds) return nodes;
    return nodes.filter((node) => {
      const data = node.data as unknown as CompiledNodeData | undefined;
      return !!data && intersects(nodeBounds(node, data), visibleBounds);
    });
  }, [nodes, visibleBounds]);
  const items = useMemo(
    () => labelItems(overlayNodes, viewport.zoom),
    [overlayNodes, viewport.zoom]
  );
  const edgeObstacles = useMemo(() => {
    if (!items.length) return [];
    const all = edgeLabelObstacles(edges, nodes);
    return visibleBounds ? all.filter((obstacle) => intersects(obstacle.bounds, visibleBounds)) : all;
  }, [edges, items.length, nodes, visibleBounds]);
  const obstacles = useMemo(() => [
    ...overlayNodes.flatMap((node) => {
      const data = node.data as unknown as CompiledNodeData | undefined;
      const obstacle = data ? nodeBodyObstacle(node, data) : undefined;
      return obstacle ? [obstacle] : [];
    }),
    ...edgeObstacles
  ], [edgeObstacles, overlayNodes]);
  const placements = useMemo(
    () => placeLabels(items, obstacles),
    [items, obstacles]
  );
  const labels = overlayNodes.flatMap((node) => {
    const data = node.data as unknown as CompiledNodeData | undefined;
    const labelZIndex = finiteNumber(data?.labelZIndex);
    if (!data || node.hidden) return [];

    if (node.type === 'region' && labelZIndex !== undefined && shouldRenderOverlayLabel(data, viewport.zoom)) {
      const point = placements[`${node.id}:label`] || regionLabelCandidates(node, data)[0];
      return [(
        <div
          key={`${node.id}:label`}
          className="topoviewer-region-label topoviewer-label-overlay"
          data-label-z-index={labelZIndex}
          style={overlayStyle(data.labelStyle, point, labelZIndex)}
        >
          {displayName(data)}
        </div>
      )];
    }

    if (node.type !== 'network') return [];
    const rendered = [];

    if (labelZIndex !== undefined && shouldRenderOverlayLabel(data, viewport.zoom)) {
      const point = placements[`${node.id}:label`] || nodeLabelCandidates(node, data)[0];
      rendered.push((
        <div
          key={`${node.id}:label`}
          className="topoviewer-node-label topoviewer-label-overlay"
          data-label-position={data.labelPosition || 'bottom'}
          data-label-priority={data.attentionLabelPriority || undefined}
          data-label-z-index={labelZIndex}
          style={overlayStyle(data.labelStyle, point, labelZIndex)}
          {...labelContent(data)}
        >
          {data.labelHtml ? null : displayName(data)}
        </div>
      ));
    }

    if (shouldRenderOverlayMeta(data)) {
      const metaZIndex = finiteNumber(data.metaZIndex) ?? (labelZIndex === undefined ? 0 : labelZIndex - 1);
      const point = placements[`${node.id}:meta`] || nodeMetaCandidates(node, data)[0];
      rendered.push((
        <div
          key={`${node.id}:meta`}
          className="topoviewer-node-meta topoviewer-label-overlay"
          data-label-role="meta"
          data-label-z-index={metaZIndex}
          style={overlayStyle(data.metaStyle, point, metaZIndex)}
        >
          {formatLabels(data.labels)}
        </div>
      ));
    }

    return rendered;
  });

  if (!labels.length) return null;
  return (
    <ViewportPortal>
      {labels}
    </ViewportPortal>
  );
}

export const LabelOverlay = memo(LabelOverlayComponent, (previous, next) => {
  if (previous.frozen && next.frozen) {
    return previous.edges === next.edges
      && previous.onlyRenderVisibleElements === next.onlyRenderVisibleElements;
  }
  return previous.nodes === next.nodes
    && previous.edges === next.edges
    && previous.frozen === next.frozen
    && previous.onlyRenderVisibleElements === next.onlyRenderVisibleElements;
});
