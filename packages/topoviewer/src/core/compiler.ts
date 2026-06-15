import { applyStyle, compileCalloutStyle, compileEdgeStyle, compileNodeStyle, compileRegionStyle, compileShapeStyle } from './style';
import { computeLayoutPositions } from './layout';
import { assertRendererLimits } from './limits';
import { mergePlainObjects } from './object';
import { buildRegionBoundsMap } from './regions';
import type {
  CompiledGraph,
  DiagramCallout,
  DiagramConnector,
  DiagramPin,
  DiagramShape,
  GraphEntity,
  GraphLink,
  GraphNode,
  GraphPath,
  GraphRegion,
  LayoutConfig,
  PositionTuple,
  TopoDocument,
  TopoViewerToggles
} from './types';
import { validateTopoDocument } from './validation';

function defaultLayerIds(spec: TopoDocument): string[] {
  return spec.graph?.layers?.map((layer) => layer.id) || [];
}

function intersects(values: string[] | undefined, layers: Set<string>): boolean {
  return (values || []).some((value) => layers.has(value));
}

function positionOf(value: PositionTuple | { x: number; y: number } | undefined): { x: number; y: number } {
  if (Array.isArray(value)) return { x: Number(value[0] || 0), y: Number(value[1] || 0) };
  if (value && typeof value === 'object') return { x: Number(value.x || 0), y: Number(value.y || 0) };
  return { x: 0, y: 0 };
}

function pinNodeId(ownerId: string, pinId: string): string {
  return `pin:${ownerId}:${pinId}`;
}

function pinPosition(pin: DiagramPin): { x: number; y: number } {
  return pin.position ? positionOf(pin.position) : { x: Number(pin.x || 0), y: Number(pin.y || 0) };
}

function addPinNodes(ownerId: string, pins: DiagramPin[] | undefined, pinNodes: Array<Record<string, unknown>>) {
  (pins || []).forEach((pin) => {
    pinNodes.push({
      id: pinNodeId(ownerId, pin.id),
      type: 'pin',
      parentId: ownerId,
      extent: 'parent',
      position: pinPosition(pin),
      data: { id: pin.id, ownerId },
      selectable: false,
      draggable: false,
      hidden: false,
      style: { width: 1, height: 1, opacity: 0, pointerEvents: 'none' },
      zIndex: 80
    });
  });
}

function childNodesInsideParentsEnabled(toggles: TopoViewerToggles): boolean {
  return !!(toggles.showChildNodesInsideParents ?? toggles.showServicesInsideNodes);
}

function nodeDimensions(style: Record<string, unknown> | undefined): { width: number; height: number } {
  return {
    width: Number(style?.width || 82),
    height: Number(style?.height || 60)
  };
}

function childNodePosition(parentWidth: number, childWidth: number, headerHeight: number, childStep: number, siblingIndex: number): { x: number; y: number } {
  return {
    x: Math.max(16, (parentWidth - childWidth) / 2),
    y: headerHeight + siblingIndex * childStep
  };
}

function visibleLinksForLayout(links: GraphLink[], layers: Set<string>, nodeIds: Set<string>): GraphLink[] {
  return links.filter((link) => intersects(link.layers, layers) && nodeIds.has(link.source) && nodeIds.has(link.target));
}

function visiblePathLinks(paths: GraphPath[], layers: Set<string>, nodeIds: Set<string>): GraphLink[] {
  return paths.flatMap((path) => {
    if (!intersects(path.layers, layers)) return [];
    if (!pathHasSequence(path)) {
      if (!path.source || !path.target || !nodeIds.has(path.source) || !nodeIds.has(path.target)) return [];
      return [{ ...path, id: path.id, source: path.source, target: path.target }];
    }
    return path.sequence.slice(0, -1).flatMap((source, index) => {
      const target = path.sequence[index + 1];
      if (!nodeIds.has(source) || !nodeIds.has(target)) return [];
      return [{ ...path, id: `${path.id}:${index}`, source, target }];
    });
  });
}

function pathHasSequence(path: GraphPath): path is GraphPath & { sequence: string[] } {
  return Array.isArray(path.sequence) && path.sequence.length >= 2;
}

function compileShapeNodes(
  shapes: DiagramShape[],
  selectedLayers: Set<string>,
  spec: TopoDocument,
  pinNodes: Array<Record<string, unknown>>
) {
  return shapes.flatMap((shape) => {
    if (!intersects(shape.layers, selectedLayers)) return [];
    const visualStyle = applyStyle('shape', shape, spec);
    const rendered = compileShapeStyle(visualStyle, shape);
    addPinNodes(shape.id, shape.pins, pinNodes);
    return [{
      ...rendered.flow,
      id: shape.id,
      position: positionOf(shape.position),
      data: mergePlainObjects({ ...shape, ...(shape.data || {}) }, rendered.data || {}),
      style: { ...(rendered.flow.style || {}) }
    }];
  });
}

function compileCalloutNodes(
  callouts: DiagramCallout[],
  selectedLayers: Set<string>,
  spec: TopoDocument,
  pinNodes: Array<Record<string, unknown>>
) {
  return callouts.flatMap((callout) => {
    if (!intersects(callout.layers, selectedLayers)) return [];
    if (!hasCalloutBox(callout)) return [];
    const visualStyle = applyStyle('callout', callout, spec);
    const rendered = compileCalloutStyle(visualStyle, callout);
    addPinNodes(callout.id, callout.pins, pinNodes);
    return [{
      ...rendered.flow,
      id: callout.id,
      position: positionOf(callout.position),
      data: mergePlainObjects({ ...callout, ...(callout.data || {}) }, rendered.data || {}),
      style: { ...(rendered.flow.style || {}) }
    }];
  });
}

function hasCalloutBox(callout: DiagramCallout): boolean {
  return !!(callout.position || callout.title || callout.body || callout.markdown);
}

function anchorId(ownerId: string | undefined, pinId: string | undefined): string | undefined {
  if (!ownerId) return undefined;
  return pinId ? pinNodeId(ownerId, pinId) : ownerId;
}

function addAbsolutePin(id: string, position: PositionTuple | { x: number; y: number } | undefined, pinNodes: Array<Record<string, unknown>>): string | undefined {
  if (!position) return undefined;
  pinNodes.push({
    id,
    type: 'pin',
    position: positionOf(position),
    data: { id },
    selectable: false,
    draggable: false,
    hidden: false,
    style: { width: 1, height: 1, opacity: 0, pointerEvents: 'none' },
    zIndex: 80
  });
  return id;
}

function compilePrimitiveEdge(
  kind: 'connector' | 'callout',
  entity: GraphEntity,
  selectedLayers: Set<string>,
  source: string | undefined,
  target: string | undefined,
  spec: TopoDocument,
  visualIds: Set<string>,
  labelsEnabled: boolean,
  styleOverride: Record<string, unknown> = {}
) {
  if (!intersects(entity.layers, selectedLayers)) return undefined;
  if (!source || !target || !visualIds.has(source) || !visualIds.has(target)) return undefined;
  const visualStyle = mergePlainObjects(applyStyle(kind, entity, spec), styleOverride);
  const rendered = compileEdgeStyle(visualStyle, entity, spec, labelsEnabled);
  return {
    ...rendered,
    id: entity.id,
    source,
    target,
    data: mergePlainObjects({ ...entity, ...(entity.data || {}) }, rendered.data || {})
  };
}

export function compileTopoGraph(
  spec: TopoDocument,
  selectedLayerIds: string[] = defaultLayerIds(spec),
  toggles: TopoViewerToggles = {},
  layoutOverride: LayoutConfig = {}
): CompiledGraph {
  spec = validateTopoDocument(spec);
  assertRendererLimits(spec);
  const graph = spec.graph || {};
  const diagram = spec.diagram || {};
  const selectedLayers = new Set(selectedLayerIds);
  const graphNodes = graph.nodes || [];
  const visibleSourceNodeIds = new Set(graphNodes.filter((node) => intersects(node.layers, selectedLayers)).map((node) => node.id));
  const visibleLayoutLinks = [
    ...visibleLinksForLayout(graph.links || [], selectedLayers, visibleSourceNodeIds),
    ...visiblePathLinks(graph.paths || [], selectedLayers, visibleSourceNodeIds)
  ];
  const layout = { ...(spec.layout || {}), ...layoutOverride };
  const layoutPositions = computeLayoutPositions(
    graphNodes.filter((node) => visibleSourceNodeIds.has(node.id)),
    visibleLayoutLinks,
    layout
  );
  const childCountByParentId = new Map<string, number>();
  const includedNodeIds = new Set<string>();
  const containedChildCountByParentId = new Map<string, number>();
  const containedChildMaxWidthByParentId = new Map<string, number>();
  const containedChildMaxHeightByParentId = new Map<string, number>();
  const nodeVisualStyleById = new Map<string, Record<string, unknown>>();
  const containedParentWidthById = new Map<string, number>();
  const containedParentHeaderHeightById = new Map<string, number>();
  const containedParentChildStepById = new Map<string, number>();
  const showChildNodesInsideParents = childNodesInsideParentsEnabled(toggles);

  graphNodes.forEach((node) => {
    if (!visibleSourceNodeIds.has(node.id)) return;
    nodeVisualStyleById.set(node.id, applyStyle('node', node, spec));
  });

  graphNodes.forEach((node) => {
    if (!visibleSourceNodeIds.has(node.id)) return;
    const shouldContain = showChildNodesInsideParents && !!node.parent && visibleSourceNodeIds.has(node.parent);
    if (!shouldContain || !node.parent) return;
    const childDimensions = nodeDimensions(nodeVisualStyleById.get(node.id));
    containedChildCountByParentId.set(node.parent, (containedChildCountByParentId.get(node.parent) || 0) + 1);
    containedChildMaxWidthByParentId.set(node.parent, Math.max(containedChildMaxWidthByParentId.get(node.parent) || 0, childDimensions.width));
    containedChildMaxHeightByParentId.set(node.parent, Math.max(containedChildMaxHeightByParentId.get(node.parent) || 0, childDimensions.height));
  });

  containedChildCountByParentId.forEach((childCount, parentId) => {
    const parentStyle = nodeVisualStyleById.get(parentId);
    if (!parentStyle) return;
    const baseDimensions = nodeDimensions(parentStyle);
    const maxChildWidth = containedChildMaxWidthByParentId.get(parentId) || 0;
    const maxChildHeight = containedChildMaxHeightByParentId.get(parentId) || 0;
    const parentHeaderHeight = 98;
    const childStep = maxChildHeight + 16;
    const parentWidth = Math.max(baseDimensions.width, maxChildWidth + 48);
    parentStyle.width = parentWidth;
    parentStyle.height = Math.max(baseDimensions.height, parentHeaderHeight + childCount * childStep + 22);
    containedParentWidthById.set(parentId, parentWidth);
    containedParentHeaderHeightById.set(parentId, parentHeaderHeight);
    containedParentChildStepById.set(parentId, childStep);
  });

  const networkNodes: Array<Record<string, unknown>> = [];

  graphNodes.forEach((node) => {
    if (!visibleSourceNodeIds.has(node.id)) return;

    includedNodeIds.add(node.id);
    const position = layoutPositions.get(node.id) || { x: 0, y: 0 };
    const shouldContain = showChildNodesInsideParents && !!node.parent && visibleSourceNodeIds.has(node.parent);
    const siblingIndex = shouldContain ? childCountByParentId.get(node.parent!) || 0 : 0;
    if (shouldContain) childCountByParentId.set(node.parent!, siblingIndex + 1);

    const visualStyle = nodeVisualStyleById.get(node.id) || applyStyle('node', node, spec);
    const baseDimensions = nodeDimensions(visualStyle);
    const parentWidth = shouldContain && node.parent ? containedParentWidthById.get(node.parent) || baseDimensions.width : baseDimensions.width;
    const parentHeaderHeight = shouldContain && node.parent ? containedParentHeaderHeightById.get(node.parent) || 0 : 0;
    const childStep = shouldContain && node.parent ? containedParentChildStepById.get(node.parent) || 0 : 0;
    const rendered = compileNodeStyle(visualStyle, node, spec);
    const nodeData = mergePlainObjects({ ...node, ...(node.data || {}) }, rendered.data || {}) as Record<string, unknown>;
    nodeData.containedChildCount = containedChildCountByParentId.get(node.id) || 0;
    nodeData.isContainedChild = shouldContain;
    const nodeId = node.id;

    networkNodes.push({
      ...rendered.flow,
      id: nodeId,
      type: rendered.flow.type || 'network',
      parentId: shouldContain ? node.parent : undefined,
      extent: shouldContain ? 'parent' : undefined,
      position: shouldContain ? childNodePosition(parentWidth, baseDimensions.width, parentHeaderHeight, childStep, siblingIndex) : position,
      data: nodeData,
      style: { ...(rendered.flow.style || {}) },
      zIndex: rendered.flow.zIndex ?? 10
    });
  });

  const pinNodes: Array<Record<string, unknown>> = [];
  graphNodes.forEach((node) => {
    if (!visibleSourceNodeIds.has(node.id)) return;
    addPinNodes(node.id, node.pins, pinNodes);
  });

  const regionNodes = toggles.showRegions === false ? [] : rebuildRegionNodes(graph.regions || [], selectedLayers, networkNodes, spec);
  const shapeNodes = compileShapeNodes(diagram.shapes || [], selectedLayers, spec, pinNodes);
  const calloutNodes = compileCalloutNodes(diagram.callouts || [], selectedLayers, spec, pinNodes);
  const visualIds = new Set([
    ...includedNodeIds,
    ...shapeNodes.map((node) => String(node.id)),
    ...calloutNodes.map((node) => String(node.id)),
    ...pinNodes.map((node) => String(node.id))
  ]);
  const primitiveEdges = buildPrimitiveEdges(diagram.connectors || [], diagram.callouts || [], selectedLayers, visualIds, pinNodes, spec, !!toggles.showEdgeLabels);
  primitiveEdges.forEach((edge) => {
    visualIds.add(String(edge.source));
    visualIds.add(String(edge.target));
  });
  const edges = [
    ...buildEdges(graph.links || [], graph.paths || [], selectedLayers, includedNodeIds, toggles, spec),
    ...primitiveEdges
  ];

  return {
    nodes: [...regionNodes, ...shapeNodes, ...networkNodes, ...calloutNodes, ...pinNodes],
    edges,
    selectedLayerIds: [...selectedLayers]
  };
}

export function rebuildRegionNodes(regions: GraphRegion[], selectedLayers: Set<string>, networkNodes: Array<Record<string, unknown>>, spec: TopoDocument) {
  const nodeById = new Map<string, GraphNode>(networkNodes.map((node) => [
    String(node.id),
    { id: String(node.id), position: node.position as GraphNode['position'] }
  ]));
  const boundsById = buildRegionBoundsMap(regions, selectedLayers, nodeById);

  return regions.flatMap((region) => {
    if (!intersects(region.layers, selectedLayers)) return [];
    const bounds = boundsById.get(region.id);
    if (!bounds) return [];
    const visualStyle = applyStyle('region', region, spec);
    const rendered = compileRegionStyle(visualStyle, bounds.width, bounds.height);
    return [{
      ...rendered.flow,
      id: `region:${region.id}`,
      type: rendered.flow.type || 'region',
      position: { x: bounds.x, y: bounds.y },
      data: {
        ...region,
        ...(region.data || {}),
        ...rendered.data
      },
      style: { ...(rendered.flow.style || {}) }
    }];
  });
}

function buildPrimitiveEdges(
  connectors: DiagramConnector[],
  callouts: DiagramCallout[],
  selectedLayers: Set<string>,
  visualIds: Set<string>,
  pinNodes: Array<Record<string, unknown>>,
  spec: TopoDocument,
  labelsEnabled = false
) {
  const flowEdges: Array<Record<string, unknown>> = [];

  connectors.forEach((connector) => {
    const source = connector.sourcePosition
      ? addAbsolutePin(pinNodeId(connector.id, 'source'), connector.sourcePosition, pinNodes)
      : anchorId(connector.source, connector.sourcePin);
    const target = connector.targetPosition
      ? addAbsolutePin(pinNodeId(connector.id, 'target'), connector.targetPosition, pinNodes)
      : anchorId(connector.target, connector.targetPin);

    if (source) visualIds.add(source);
    if (target) visualIds.add(target);
    const edge = compilePrimitiveEdge('connector', connector, selectedLayers, source, target, spec, visualIds, labelsEnabled);
    if (edge) flowEdges.push(edge);
  });

  callouts.forEach((callout) => {
    if (!callout.target && !callout.targetPosition) return;
    const source = callout.sourcePosition
      ? addAbsolutePin(pinNodeId(callout.id, 'source'), callout.sourcePosition, pinNodes)
      : anchorId(callout.source || (hasCalloutBox(callout) ? callout.id : undefined), callout.sourcePin);
    const target = callout.targetPosition
      ? addAbsolutePin(pinNodeId(callout.id, 'target'), callout.targetPosition, pinNodes)
      : anchorId(callout.target, callout.targetPin);

    if (source) visualIds.add(source);
    if (target) visualIds.add(target);
    const showLineLabel = hasCalloutBox(callout) ? false : labelsEnabled;
    const edge = compilePrimitiveEdge('callout', {
      ...callout,
      id: `${callout.id}:leader`,
      labels: { ...(callout.labels || {}), leader: true }
    }, selectedLayers, source, target, spec, visualIds, showLineLabel, callout.leader || {});
    if (edge) flowEdges.push(edge);
  });

  return flowEdges;
}

function buildEdges(
  links: GraphLink[],
  paths: GraphPath[],
  selectedLayers: Set<string>,
  includedNodeIds: Set<string>,
  toggles: TopoViewerToggles,
  spec: TopoDocument
) {
  const flowEdges: Array<Record<string, unknown>> = [];
  const visibleLinks = links.filter((link) => (
    intersects(link.layers, selectedLayers)
    && includedNodeIds.has(link.source)
    && includedNodeIds.has(link.target)
  ));
  const linkById = new Map(visibleLinks.map((link) => [link.id, link]));
  const childLinksByParentId = new Map<string, GraphLink[]>();
  const visiblePaths = paths.filter((path) => intersects(path.layers, selectedLayers));
  const pathById = new Map(visiblePaths.filter(pathHasSequence).map((path) => [path.id, path]));
  const childPathsByParentId = new Map<string, GraphPath[]>();

  visibleLinks.forEach((link) => {
    if (!link.parent || !linkById.has(link.parent)) return;
    const childLinks = childLinksByParentId.get(link.parent) || [];
    childLinks.push(link);
    childLinksByParentId.set(link.parent, childLinks);
  });

  visiblePaths.forEach((path) => {
    if (!path.parent || !path.source || !path.target || !pathById.has(path.parent)) return;
    if (!includedNodeIds.has(path.source) || !includedNodeIds.has(path.target)) return;
    const childPaths = childPathsByParentId.get(path.parent) || [];
    childPaths.push(path);
    childPathsByParentId.set(path.parent, childPaths);
  });

  visibleLinks.forEach((link) => {
    const parentLink = link.parent ? linkById.get(link.parent) : undefined;
    const siblingLinks = link.parent ? childLinksByParentId.get(link.parent) || [] : [];
    const laneIndex = parentLink ? Math.max(0, siblingLinks.findIndex((candidate) => candidate.id === link.id)) : undefined;
    const hasChildLanes = childLinksByParentId.has(link.id);
    const visualStyle = applyStyle('link', link, spec);
    if (parentLink) {
      const parentVisualStyle = applyStyle('link', parentLink, spec);
      visualStyle.curveStyle = parentVisualStyle.curveStyle ?? visualStyle.curveStyle;
      visualStyle.anchor = parentVisualStyle.anchor ?? visualStyle.anchor;
    }
    if (hasChildLanes) {
      visualStyle.pipe = visualStyle.pipe ?? true;
      visualStyle.pipeWidth = visualStyle.pipeWidth ?? Math.max(Number(visualStyle.lineWidth || 1) + 14, 18);
      visualStyle.pipeFill = visualStyle.pipeFill ?? visualStyle.lineColor;
      visualStyle.pipeOpacity = visualStyle.pipeOpacity ?? 0.18;
    }
    const rendered = compileEdgeStyle(visualStyle, link, spec, !!toggles.showEdgeLabels);
    const edgeData = mergePlainObjects({ ...link, ...(link.data || {}) }, rendered.data || {}) as Record<string, unknown>;
    if (hasChildLanes) {
      edgeData.isPipe = true;
      edgeData.childLinkCount = childLinksByParentId.get(link.id)?.length || 0;
    }
    if (parentLink && laneIndex !== undefined) {
      edgeData.isLane = true;
      edgeData.parentLink = parentLink.id;
      edgeData.originalSource = link.source;
      edgeData.originalTarget = link.target;
      edgeData.laneIndex = laneIndex;
      edgeData.laneCount = siblingLinks.length;
      edgeData.laneGap = visualStyle.laneGap ?? 5;
      edgeData.laneWidth = visualStyle.laneWidth ?? visualStyle.lineWidth ?? 3;
    }
    flowEdges.push({
      ...rendered,
      id: link.id,
      source: parentLink ? parentLink.source : link.source,
      target: parentLink ? parentLink.target : link.target,
      data: edgeData
    });
  });

  visiblePaths.forEach((path) => {
    if (path.parent && childPathsByParentId.get(path.parent)?.some((candidate) => candidate.id === path.id)) return;
    if (!pathHasSequence(path)) return;
    const hasChildLanes = childPathsByParentId.has(path.id);
    const visualStyle = applyStyle('path', path, spec);
    if (hasChildLanes) {
      visualStyle.pipe = visualStyle.pipe ?? true;
      visualStyle.pipeWidth = visualStyle.pipeWidth ?? Math.max(Number(visualStyle.lineWidth || 1) + 14, 18);
      visualStyle.pipeFill = visualStyle.pipeFill ?? visualStyle.lineColor;
      visualStyle.pipeOpacity = visualStyle.pipeOpacity ?? 0.18;
    }
    path.sequence.slice(0, -1).forEach((source, index) => {
      const target = path.sequence[index + 1];
      if (!includedNodeIds.has(source) || !includedNodeIds.has(target)) return;
      const rendered = compileEdgeStyle(visualStyle, path, spec, !!toggles.showEdgeLabels);
      const edgeData = mergePlainObjects({ ...path, ...(path.data || {}) }, rendered.data || {}) as Record<string, unknown>;
      if (hasChildLanes) {
        edgeData.isPipe = true;
        edgeData.childPathCount = childPathsByParentId.get(path.id)?.length || 0;
        edgeData.parentPathSegmentIndex = index;
      }
      flowEdges.push({
        ...rendered,
        id: `${path.id}:${index}`,
        source,
        target,
        data: edgeData
      });
    });
  });

  childPathsByParentId.forEach((childPaths, parentPathId) => {
    const parentPath = pathById.get(parentPathId);
    if (!parentPath) return;
    const parentVisualStyle = applyStyle('path', parentPath, spec);
    const lastSegmentIndex = parentPath.sequence.length - 2;

    childPaths.forEach((path) => {
      if (!path.source || !path.target) return;
      const laneIndex = Math.max(0, childPaths.findIndex((candidate) => candidate.id === path.id));
      parentPath.sequence.slice(0, -1).forEach((source, index) => {
        const target = parentPath.sequence[index + 1];
        if (!includedNodeIds.has(source) || !includedNodeIds.has(target)) return;
        const visualStyle = applyStyle('path', path, spec);
        visualStyle.curveStyle = parentVisualStyle.curveStyle ?? visualStyle.curveStyle;
        visualStyle.anchor = parentVisualStyle.anchor ?? visualStyle.anchor;
        const rendered = compileEdgeStyle(visualStyle, path, spec, !!toggles.showEdgeLabels && index === Math.floor(lastSegmentIndex / 2));
        const edgeData = mergePlainObjects({ ...path, ...(path.data || {}) }, rendered.data || {}) as Record<string, unknown>;
        edgeData.isLane = true;
        edgeData.parentPath = parentPath.id;
        edgeData.parentPathSegmentIndex = index;
        edgeData.originalSource = index === 0 ? path.source : undefined;
        edgeData.originalTarget = index === lastSegmentIndex ? path.target : undefined;
        edgeData.laneIndex = laneIndex;
        edgeData.laneCount = childPaths.length;
        edgeData.laneGap = visualStyle.laneGap ?? 5;
        edgeData.laneWidth = visualStyle.laneWidth ?? visualStyle.lineWidth ?? 3;
        edgeData.suppressLaneMarker = true;
        flowEdges.push({
          ...rendered,
          id: `${path.id}:${index}`,
          source,
          target,
          data: edgeData
        });
      });
    });
  });

  return flowEdges;
}
