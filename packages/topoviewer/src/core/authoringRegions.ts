import type { GraphNode, GraphRegion, TopoDocument } from './types';
import type { AuthoringEditPlan, AuthoringValueUpdate } from './authoringTypes';

export interface AuthoringRegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AuthoringRegionPlacementOptions {
  allowOverlap?: boolean;
  parentId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

function position(value: unknown): { x: number; y: number } | undefined {
  if (Array.isArray(value)) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}

function size(value: unknown): { width: number; height: number } | undefined {
  if (Array.isArray(value)) {
    const width = Number(value[0]);
    const height = Number(value[1]);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height }
      : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { width?: unknown; height?: unknown };
  const width = Number(candidate.width);
  const height = Number(candidate.height);
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
    ? { width, height }
    : undefined;
}

function regions(document: TopoDocument): GraphRegion[] {
  return document.graph?.regions || [];
}

function nodes(document: TopoDocument): GraphNode[] {
  return document.graph?.nodes || [];
}

function explicitBounds(region: GraphRegion): AuthoringRegionBounds | undefined {
  const origin = position(region.position);
  const dimensions = size(region.size);
  return origin && dimensions ? { ...origin, ...dimensions } : undefined;
}

function nodeBounds(node: GraphNode): AuthoringRegionBounds | undefined {
  const origin = position(node.position);
  if (!origin) return undefined;
  const width = 82;
  const height = 60;
  return {
    ...origin,
    width: Number.isFinite(width) && width > 0 ? width : 82,
    height: Number.isFinite(height) && height > 0 ? height : 60
  };
}

function union(bounds: AuthoringRegionBounds[]): AuthoringRegionBounds | undefined {
  if (!bounds.length) return undefined;
  const x = Math.min(...bounds.map((item) => item.x));
  const y = Math.min(...bounds.map((item) => item.y));
  const right = Math.max(...bounds.map((item) => item.x + item.width));
  const bottom = Math.max(...bounds.map((item) => item.y + item.height));
  return { x, y, width: right - x, height: bottom - y };
}

export function authoringRegionBounds(document: TopoDocument, regionId: string): AuthoringRegionBounds | undefined {
  const region = regions(document).find((candidate) => candidate.id === regionId);
  if (!region) return undefined;
  const direct = explicitBounds(region);
  const nodeById = new Map(nodes(document).map((node) => [node.id, node]));
  const memberBounds = (region.members || []).flatMap((memberId) => {
    const member = nodeById.get(memberId);
    const bounds = member ? nodeBounds(member) : undefined;
    return bounds ? [bounds] : [];
  });
  if (!memberBounds.length) return direct;
  const paddingX = Number(region.paddingX ?? region.padding ?? 34);
  const paddingY = Number(region.paddingY ?? region.padding ?? 28);
  const members = union(memberBounds);
  if (!members) return direct;
  const padded = {
    x: members.x - paddingX,
    y: members.y - paddingY - Number(region.headerPadding || 0),
    width: members.width + paddingX * 2,
    height: members.height + paddingY * 2 + Number(region.headerPadding || 0)
  };
  return union([padded, ...(direct ? [direct] : [])]);
}

function overlaps(left: AuthoringRegionBounds, right: AuthoringRegionBounds, gap = 12): boolean {
  return left.x < right.x + right.width + gap
    && left.x + left.width + gap > right.x
    && left.y < right.y + right.height + gap
    && left.y + left.height + gap > right.y;
}

function containsBounds(parent: AuthoringRegionBounds, child: AuthoringRegionBounds, gap = 12): boolean {
  return child.x >= parent.x + gap
    && child.y >= parent.y + gap
    && child.x + child.width <= parent.x + parent.width - gap
    && child.y + child.height <= parent.y + parent.height - gap;
}

export function authoringRegionDepth(document: TopoDocument, regionId: string): number {
  const byId = new Map(regions(document).map((region) => [region.id, region]));
  const seen = new Set<string>();
  let current = byId.get(regionId);
  let depth = 0;
  while (current?.parent && !seen.has(current.parent)) {
    seen.add(current.parent);
    current = byId.get(current.parent);
    if (!current) break;
    depth += 1;
  }
  return depth;
}

export function authoringRegionPlacement(
  document: TopoDocument,
  options: AuthoringRegionPlacementOptions
): { x: number; y: number } {
  const parent = options.parentId ? regions(document).find((region) => region.id === options.parentId) : undefined;
  if (options.parentId && !parent) throw new Error(`Parent region "${options.parentId}" does not exist.`);
  const parentBounds = parent ? authoringRegionBounds(document, parent.id) : undefined;
  if (parent && !parentBounds) throw new Error(`Parent region "${parent.id}" has no authoring bounds.`);
  const siblingBounds = regions(document)
    .filter((region) => (region.parent || '') === (options.parentId || ''))
    .flatMap((region) => {
      const bounds = authoringRegionBounds(document, region.id);
      return bounds ? [bounds] : [];
    });
  const stepX = options.size.width + 40;
  const stepY = options.size.height + 40;
  const offsets = [{ x: 0, y: 0 }];
  for (let ring = 1; ring <= 6; ring += 1) {
    offsets.push(
      { x: ring * stepX, y: 0 },
      { x: 0, y: ring * stepY },
      { x: -ring * stepX, y: 0 },
      { x: 0, y: -ring * stepY },
      { x: ring * stepX, y: ring * stepY },
      { x: -ring * stepX, y: ring * stepY },
      { x: ring * stepX, y: -ring * stepY },
      { x: -ring * stepX, y: -ring * stepY }
    );
  }

  for (const offset of offsets) {
    const candidate = {
      x: Math.round(options.position.x + offset.x),
      y: Math.round(options.position.y + offset.y),
      width: options.size.width,
      height: options.size.height
    };
    if (parentBounds && !containsBounds(parentBounds, candidate)) continue;
    if (!options.allowOverlap && siblingBounds.some((bounds) => overlaps(bounds, candidate))) continue;
    return { x: candidate.x, y: candidate.y };
  }
  throw new Error(parentBounds
    ? `No non-overlapping placement is available inside parent region "${options.parentId}".`
    : 'No non-overlapping region placement is available near the requested position.');
}

export function authoringRegionForNodePosition(
  document: TopoDocument,
  nodeId: string,
  nextPosition: { x: number; y: number }
): string | undefined {
  const node = nodes(document).find((candidate) => candidate.id === nodeId);
  if (!node) return undefined;
  const width = 82;
  const height = 60;
  const point = { x: nextPosition.x + width / 2, y: nextPosition.y + height / 2 };
  return regions(document)
    .flatMap((region) => {
      const bounds = authoringRegionBounds(document, region.id);
      if (!bounds) return [];
      const contains = point.x >= bounds.x && point.x <= bounds.x + bounds.width
        && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
      return contains ? [{ area: bounds.width * bounds.height, depth: authoringRegionDepth(document, region.id), id: region.id }] : [];
    })
    .sort((left, right) => right.depth - left.depth || left.area - right.area || left.id.localeCompare(right.id))[0]?.id;
}

export function authoringRegionsForMember(document: TopoDocument, memberId: string): string[] {
  return regions(document)
    .filter((region) => (region.members || []).includes(memberId))
    .map((region) => region.id);
}

function positionUpdates(
  scopePath: Array<string | number>,
  current: unknown,
  next: { x: number; y: number }
): AuthoringValueUpdate[] {
  const tuple = Array.isArray(current);
  return [next.x, next.y].map((value, index) => ({
    path: [...scopePath, 'position', tuple ? index : index === 0 ? 'x' : 'y'],
    scopePath,
    value: Math.round(value)
  }));
}

export function planAuthoringNodeMove(
  document: TopoDocument,
  nodeId: string,
  nextPosition: { x: number; y: number }
): AuthoringEditPlan {
  const nodeIndex = nodes(document).findIndex((node) => node.id === nodeId);
  if (nodeIndex < 0) throw new Error(`Node "${nodeId}" does not exist.`);
  const node = nodes(document)[nodeIndex];
  if (!position(node.position)) throw new Error(`Node "${nodeId}" does not have an editable position.`);
  const targetRegionId = authoringRegionForNodePosition(document, nodeId, nextPosition);
  const updates = positionUpdates(['graph', 'nodes', nodeIndex], node.position, nextPosition);
  if (targetRegionId) {
    regions(document).forEach((region, index) => {
      const currentMembers = region.members || [];
      const nextMembers = region.id === targetRegionId
        ? [...new Set([...currentMembers, nodeId])]
        : currentMembers.filter((memberId) => memberId !== nodeId);
      if (nextMembers.length === currentMembers.length && nextMembers.every((id, memberIndex) => id === currentMembers[memberIndex])) return;
      updates.push({ path: ['graph', 'regions', index, 'members'], scopePath: ['graph', 'regions', index], value: nextMembers });
    });
  }
  return { insertions: [], removals: [], updates };
}

function descendantRegionIds(document: TopoDocument, regionId: string): string[] {
  const result: string[] = [];
  const visit = (parentId: string) => {
    regions(document).filter((region) => region.parent === parentId).forEach((region) => {
      result.push(region.id);
      visit(region.id);
    });
  };
  visit(regionId);
  return result;
}

function recursiveMemberNodeIds(document: TopoDocument, regionId: string): string[] {
  const regionIds = new Set([regionId, ...descendantRegionIds(document, regionId)]);
  return [...new Set(regions(document)
    .filter((region) => regionIds.has(region.id))
    .flatMap((region) => region.members || [])
    .filter((memberId) => nodes(document).some((node) => node.id === memberId)))];
}

export function planAuthoringRegionMove(
  document: TopoDocument,
  regionId: string,
  nextPosition: { x: number; y: number }
): AuthoringEditPlan {
  const regionIndex = regions(document).findIndex((region) => region.id === regionId);
  if (regionIndex < 0) throw new Error(`Region "${regionId}" does not exist.`);
  const region = regions(document)[regionIndex];
  const current = position(region.position);
  if (!current) throw new Error(`Region "${regionId}" does not have an editable position.`);
  const delta = { x: nextPosition.x - current.x, y: nextPosition.y - current.y };
  const updates = positionUpdates(['graph', 'regions', regionIndex], region.position, nextPosition);
  const movedRegionIds = descendantRegionIds(document, regionId);
  movedRegionIds.forEach((childId) => {
    const index = regions(document).findIndex((candidate) => candidate.id === childId);
    const child = regions(document)[index];
    const childPosition = position(child.position);
    if (childPosition) updates.push(...positionUpdates(['graph', 'regions', index], child.position, {
      x: childPosition.x + delta.x, y: childPosition.y + delta.y
    }));
  });
  recursiveMemberNodeIds(document, regionId).forEach((memberId) => {
    const index = nodes(document).findIndex((node) => node.id === memberId);
    const member = nodes(document)[index];
    const memberPosition = position(member.position);
    if (memberPosition) updates.push(...positionUpdates(['graph', 'nodes', index], member.position, {
      x: memberPosition.x + delta.x, y: memberPosition.y + delta.y
    }));
  });
  return { insertions: [], removals: [], updates };
}

export function planAuthoringReleaseFromRegion(
  document: TopoDocument,
  memberId: string,
  regionId?: string
): AuthoringEditPlan {
  const targetIds = regionId ? [regionId] : authoringRegionsForMember(document, memberId);
  if (!targetIds.length) throw new Error(`Object "${memberId}" is not a direct region member.`);
  const updates = regions(document).flatMap((region, index): AuthoringValueUpdate[] => {
    if (!targetIds.includes(region.id) || !(region.members || []).includes(memberId)) return [];
    return [{
      path: ['graph', 'regions', index, 'members'],
      scopePath: ['graph', 'regions', index],
      value: (region.members || []).filter((id) => id !== memberId)
    }];
  });
  return { insertions: [], removals: [], updates };
}

export function planAuthoringRegionExpanded(
  document: TopoDocument,
  regionId: string,
  expanded: boolean,
  requestedGroupId?: string
): AuthoringEditPlan {
  const region = regions(document).find((candidate) => candidate.id === regionId);
  if (!region) throw new Error(`Region "${regionId}" does not exist.`);
  const aggregate = document.attention?.aggregate && typeof document.attention.aggregate === 'object'
    ? structuredClone(document.attention.aggregate) as Record<string, unknown>
    : {};
  const groupId = requestedGroupId || `summary-${regionId}`;
  const groups = Array.isArray(aggregate.groups) ? structuredClone(aggregate.groups) as Array<Record<string, unknown>> : [];
  if (!groups.some((group) => String(group.id || '') === groupId)) {
    groups.push({ id: groupId, by: 'region', regionId, label: String(region.labels?.name || region.id) });
  }
  const currentExpanded = Array.isArray(aggregate.expandedGroupIds) ? aggregate.expandedGroupIds.map(String) : [];
  aggregate.groups = groups;
  aggregate.expandOnClick = aggregate.expandOnClick !== false;
  aggregate.expandedGroupIds = expanded
    ? [...new Set([...currentExpanded, groupId])]
    : currentExpanded.filter((id) => id !== groupId);
  const hasAttention = !!document.attention && typeof document.attention === 'object';
  return {
    insertions: [], removals: [], updates: [{
      path: hasAttention ? ['attention', 'aggregate'] : ['attention'],
      scopePath: hasAttention ? ['attention'] : [],
      value: hasAttention ? aggregate : { aggregate }
    }]
  };
}
