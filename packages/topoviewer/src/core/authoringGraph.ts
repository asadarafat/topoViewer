import type { DiagramCallout, DiagramShape, DiagramText, GraphEntity, GraphLink, GraphNode, GraphPath, GraphRegion, TopoDocument } from './types';
import { authoringRegionBounds, authoringRegionPlacement } from './authoringRegions';
import { applyStyle, resolveShapeDimensions } from './style';
import { TOPOLOGY_OBJECT_PRESENTATION_FIELDS, type TopologyPresentationObjectKind } from './topologyOwnership';
import type {
  AuthoringEditPlan,
  AuthoringGraphObject,
  AuthoringInsertion,
  AuthoringObjectKind,
  AuthoringObjectSelection,
  AuthoringRemoval,
  AuthoringSourcePath,
  AuthoringValueUpdate
} from './authoringTypes';
export type {
  AuthoringEditPlan,
  AuthoringGraphObject,
  AuthoringInsertion,
  AuthoringObjectKind,
  AuthoringObjectSelection,
  AuthoringRemoval,
  AuthoringSourcePath,
  AuthoringValueUpdate
} from './authoringTypes';

export type AuthoringLinkDirectionObject = AuthoringGraphObject & { id: string };
export type AuthoringNodeKind = 'node' | 'router' | 'switch' | 'service' | 'controller' | 'external';

export const DEFAULT_AUTHORING_SHAPE_SIZE = Object.freeze({ height: 96, width: 180 });
export const DEFAULT_AUTHORING_CALLOUT_SIZE = Object.freeze({ height: 88, width: 160 });

export function resolveAuthoringShapeSize(
  value: { height: number; width: number } = DEFAULT_AUTHORING_SHAPE_SIZE
): { height: number; width: number } {
  return {
    height: Math.max(24, Math.round(value.height)),
    width: Math.max(24, Math.round(value.width))
  };
}

export function resolveAuthoringCalloutSize(
  value: { height: number; width: number } = DEFAULT_AUTHORING_CALLOUT_SIZE
): { height: number; width: number } {
  return {
    height: Math.max(24, Math.round(value.height)),
    width: Math.max(24, Math.round(value.width))
  };
}

export interface CreateAuthoringNodeOptions {
  kind: AuthoringNodeKind;
  position: { x: number; y: number };
  selectedLayerIds: string[];
}

export type AuthoringAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type AuthoringDistributionAxis = 'horizontal' | 'vertical';

export interface AuthoringClipboardItem {
  selection: AuthoringObjectSelection;
  value: AuthoringGraphObject;
}

export interface CreateAuthoringLinkOptions {
  selectedLayerIds: string[];
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

export interface CreateAuthoringPositionedObjectOptions {
  position: { x: number; y: number };
  selectedLayerIds?: string[];
}

export interface CreateAuthoringPathOptions {
  mode?: 'explicit' | 'loose' | 'shortest';
  selectedLayerIds?: string[];
  sequence: string[];
}

export interface FindAuthoringPathTraversalsOptions {
  limit?: number;
  maxDepth?: number;
}

export interface CreateAuthoringRegionOptions extends CreateAuthoringPositionedObjectOptions {
  allowOverlap?: boolean;
  members?: string[];
  parentId?: string;
  size?: { width: number; height: number };
}

export const DEFAULT_AUTHORING_REGION_SIZE = Object.freeze({ height: 180, width: 280 });

export function resolveAuthoringRegionSize(
  value: CreateAuthoringRegionOptions['size'] = DEFAULT_AUTHORING_REGION_SIZE
): { height: number; width: number } {
  return {
    height: Math.max(80, Math.round(value.height)),
    width: Math.max(120, Math.round(value.width))
  };
}

const graphCollectionByKind: Record<'layer' | 'node' | 'link' | 'path' | 'region', string> = {
  layer: 'layers',
  link: 'links',
  node: 'nodes',
  path: 'paths',
  region: 'regions'
};
const diagramCollectionByKind: Record<'callout' | 'shape' | 'text', string> = {
  callout: 'callouts',
  shape: 'shapes',
  text: 'texts'
};

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function records(value: unknown): AuthoringGraphObject[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const entry = record(item);
    return entry ? [entry as AuthoringGraphObject] : [];
  }) : [];
}

function graph(document: Record<string, unknown> | TopoDocument): Record<string, unknown> {
  return record(document.graph) || {};
}

function diagram(document: Record<string, unknown> | TopoDocument): Record<string, unknown> {
  return record(document.diagram) || {};
}

function graphLinks(document: Record<string, unknown> | TopoDocument): AuthoringGraphObject[] {
  return records(graph(document).links);
}

function allObjectIds(document: Record<string, unknown> | TopoDocument): Set<string> {
  const graphValue = graph(document);
  const diagramValue = diagram(document);
  return new Set([
    ...records(graphValue.nodes), ...records(graphValue.links), ...records(graphValue.paths), ...records(graphValue.regions),
    ...records(diagramValue.shapes), ...records(diagramValue.callouts), ...records(diagramValue.texts)
  ].map((item) => String(item.id || '')).filter(Boolean));
}

export function nextAuthoringObjectId(
  document: Record<string, unknown> | TopoDocument,
  prefix: string
): string {
  const ids = allObjectIds(document);
  let index = 1;
  while (ids.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

export function authoringLinkDirectionObjects(
  document: Record<string, unknown> | TopoDocument | undefined
): AuthoringLinkDirectionObject[] {
  if (!document) return [];
  return graphLinks(document).flatMap((link) => Object.entries(record(link.directions) || {}).flatMap(([direction, value]) => {
    const entry = record(value);
    if (!entry) return [];
    const linkId = String(link.id || '');
    return [{
      ...entry,
      direction,
      id: typeof entry.id === 'string' && entry.id ? entry.id : `${linkId}:${direction}`,
      linkId,
      parentLinkId: linkId
    }];
  }));
}

export function defaultLayerId(
  document: Record<string, unknown> | TopoDocument | undefined,
  selectedLayerIds: string[]
): string {
  const layers = records(document ? graph(document).layers : undefined);
  const declared = new Set(layers.map((layer) => String(layer.id || '')).filter(Boolean));
  const selectedDeclared = selectedLayerIds.find((id) => declared.has(id));
  if (selectedDeclared) return selectedDeclared;
  const selected = selectedLayerIds.find((id) => id.trim().length > 0);
  if (!layers.length && selected) return selected;
  return String(layers[0]?.id || selected || 'default');
}

export function createAuthoringNode(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringNodeOptions
): GraphNode {
  const prefix = options.kind === 'service' ? 'service' : options.kind;
  return {
    id: nextAuthoringObjectId(document, prefix),
    labels: { role: options.kind },
    layers: [defaultLayerId(document, options.selectedLayerIds)],
    position: [Math.round(options.position.x), Math.round(options.position.y)]
  };
}

export function graphHasLinkBetween(
  document: Record<string, unknown> | TopoDocument | undefined,
  source: string,
  target: string
): boolean {
  if (!document || !source || !target) return false;
  return graphLinks(document).some((link) => (
    (String(link.source || '') === source && String(link.target || '') === target)
    || (String(link.source || '') === target && String(link.target || '') === source)
  ));
}

export function graphHasReachabilityBetween(
  document: Record<string, unknown> | TopoDocument | undefined,
  source: string,
  target: string
): boolean {
  if (!document || !source || !target) return false;
  if (source === target) return true;
  const adjacency = new Map<string, Set<string>>();
  for (const link of graphLinks(document)) {
    const linkSource = String(link.source || '');
    const linkTarget = String(link.target || '');
    if (!linkSource || !linkTarget) continue;
    if (!adjacency.has(linkSource)) adjacency.set(linkSource, new Set());
    if (!adjacency.has(linkTarget)) adjacency.set(linkTarget, new Set());
    adjacency.get(linkSource)?.add(linkTarget);
    adjacency.get(linkTarget)?.add(linkSource);
  }
  if (!adjacency.has(source) || !adjacency.has(target)) return false;
  const seen = new Set([source]);
  const queue = [source];
  for (let index = 0; index < queue.length; index += 1) {
    for (const next of adjacency.get(queue[index]) || []) {
      if (next === target) return true;
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return false;
}

export function pathSegmentsWithoutReachability(
  document: Record<string, unknown> | TopoDocument | undefined,
  sequence: string[]
): Array<{ source: string; target: string }> {
  return sequence.slice(0, -1).flatMap((source, index) => {
    const target = sequence[index + 1];
    return graphHasReachabilityBetween(document, source, target) ? [] : [{ source, target }];
  });
}

export function pathSegmentsWithoutDirectLinks(
  document: Record<string, unknown> | TopoDocument | undefined,
  sequence: string[]
): Array<{ source: string; target: string }> {
  return sequence.slice(0, -1).flatMap((source, index) => {
    const target = sequence[index + 1];
    return graphHasLinkBetween(document, source, target) ? [] : [{ source, target }];
  });
}

export function findAuthoringPathTraversals(
  document: Record<string, unknown> | TopoDocument | undefined,
  source: string,
  target: string,
  options: FindAuthoringPathTraversalsOptions = {}
): string[][] {
  if (!document || !source || !target || source === target) return [];
  const nodes = records(graph(document).nodes);
  const nodeOrder = new Map(nodes.map((node, index) => [String(node.id || ''), index]));
  if (!nodeOrder.has(source) || !nodeOrder.has(target)) return [];
  const adjacency = new Map<string, Set<string>>(nodes.map((node) => [String(node.id || ''), new Set()]));
  graphLinks(document).forEach((link) => {
    const linkSource = String(link.source || '');
    const linkTarget = String(link.target || '');
    if (!adjacency.has(linkSource) || !adjacency.has(linkTarget) || linkSource === linkTarget) return;
    adjacency.get(linkSource)?.add(linkTarget);
    adjacency.get(linkTarget)?.add(linkSource);
  });
  const compareNodeIds = (left: string, right: string) => (
    (nodeOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (nodeOrder.get(right) ?? Number.MAX_SAFE_INTEGER)
    || left.localeCompare(right)
  );
  const limit = Math.max(1, Math.min(32, Math.floor(options.limit || 8)));
  const maxDepth = Math.max(2, Math.min(nodes.length, Math.floor(options.maxDepth || nodes.length)));
  const queue: string[][] = [[source]];
  const traversals: string[][] = [];
  let shortestLength = Number.POSITIVE_INFINITY;

  for (let index = 0; index < queue.length && traversals.length < limit; index += 1) {
    const path = queue[index];
    if (path.length >= shortestLength || path.length >= maxDepth) continue;
    const current = path[path.length - 1];
    for (const next of [...(adjacency.get(current) || [])].sort(compareNodeIds)) {
      if (path.includes(next)) continue;
      const candidate = [...path, next];
      if (next === target) {
        shortestLength = candidate.length;
        traversals.push(candidate);
        if (traversals.length >= limit) break;
        continue;
      }
      if (candidate.length < shortestLength) queue.push(candidate);
    }
  }
  return traversals;
}

export function findAuthoringObject(
  document: Record<string, unknown> | TopoDocument | undefined,
  selection: AuthoringObjectSelection | undefined
): AuthoringGraphObject | undefined {
  if (!document || !selection) return undefined;
  if (selection.kind === 'linkDirection') {
    return authoringLinkDirectionObjects(document).find((item) => item.id === selection.id);
  }
  if (selection.kind in graphCollectionByKind) {
    const collection = graphCollectionByKind[selection.kind as keyof typeof graphCollectionByKind];
    return records(graph(document)[collection]).find((item) => item.id === selection.id);
  }
  const collection = diagramCollectionByKind[selection.kind as keyof typeof diagramCollectionByKind];
  return records(diagram(document)[collection]).find((item) => item.id === selection.id);
}

export function authoringObjectExists(
  document: Record<string, unknown> | TopoDocument | undefined,
  selection: AuthoringObjectSelection
): boolean {
  return Boolean(findAuthoringObject(document, selection));
}

export function authoringObjectDisplayName(
  document: Record<string, unknown> | TopoDocument | undefined,
  selection: AuthoringObjectSelection | undefined
): string {
  const object = findAuthoringObject(document, selection);
  if (!selection) return 'No selection';
  return String(record(object?.labels)?.name ?? selection.id);
}

export function resolveAuthoringSelection(
  document: TopoDocument | undefined,
  sourceId: string
): AuthoringObjectSelection | undefined {
  if (!document || !sourceId) return undefined;
  const candidates: Array<[AuthoringObjectKind, AuthoringGraphObject[]]> = [
    ['node', records(document.graph?.nodes)],
    ['layer', records(document.graph?.layers)],
    ['link', records(document.graph?.links)],
    ['linkDirection', authoringLinkDirectionObjects(document)],
    ['path', records(document.graph?.paths)],
    ['region', records(document.graph?.regions)],
    ['callout', records(document.diagram?.callouts)],
    ['shape', records(document.diagram?.shapes)],
    ['text', records(document.diagram?.texts)]
  ];
  const match = candidates.find(([, values]) => values.some((value) => value.id === sourceId));
  return match ? { id: sourceId, kind: match[0] } : undefined;
}

export function authoringSelectionKey(selection: AuthoringObjectSelection): string {
  return `${selection.kind}:${selection.id}`;
}

export function sameAuthoringSelection(left: AuthoringObjectSelection, right: AuthoringObjectSelection): boolean {
  return left.kind === right.kind && left.id === right.id;
}

function cloneAuthoringValue<T>(value: T): T {
  return structuredClone(value);
}

function declaredLayerId(document: Record<string, unknown> | TopoDocument, preferred: string, selected: string[] = []) {
  const declared = new Set(records(graph(document).layers).map((layer) => String(layer.id || '')).filter(Boolean));
  if (declared.has(preferred)) return preferred;
  const selectedDeclared = selected.find((layerId) => declared.has(layerId));
  return selectedDeclared || preferred;
}

function nodeIndexById(document: Record<string, unknown> | TopoDocument, id: string) {
  return records(graph(document).nodes).findIndex((node) => node.id === id);
}

export function createAuthoringLink(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringLinkOptions
): GraphLink {
  if (!options.source || !options.target) throw new Error('Connection source and target are required.');
  if (options.source === options.target) throw new Error('Connection source and target must be different.');
  const sourceIndex = nodeIndexById(document, options.source);
  const targetIndex = nodeIndexById(document, options.target);
  if (sourceIndex < 0) throw new Error(`Connection source node "${options.source}" does not exist.`);
  if (targetIndex < 0) throw new Error(`Connection target node "${options.target}" does not exist.`);
  const swapsEndpoints = sourceIndex > targetIndex;
  const source = swapsEndpoints ? options.target : options.source;
  const target = swapsEndpoints ? options.source : options.target;
  const sourceHandle = swapsEndpoints ? options.targetHandle : options.sourceHandle;
  const targetHandle = swapsEndpoints ? options.sourceHandle : options.targetHandle;
  const layerId = declaredLayerId(document, 'physical', options.selectedLayerIds);
  return {
    id: nextAuthoringObjectId(document, 'link'),
    labels: { layer: layerId },
    layers: [layerId],
    source,
    ...(sourceHandle ? { sourceHandle } : {}),
    target,
    ...(targetHandle ? { targetHandle } : {})
  };
}

export function createAuthoringShape(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringPositionedObjectOptions
): DiagramShape {
  const layerId = declaredLayerId(document, 'annotations', options.selectedLayerIds);
  return {
    id: nextAuthoringObjectId(document, 'shape'),
    layers: [layerId],
    position: [Math.round(options.position.x), Math.round(options.position.y)]
  };
}

export function createAuthoringCallout(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringPositionedObjectOptions
): DiagramCallout {
  const layerId = declaredLayerId(document, 'annotations', options.selectedLayerIds);
  return {
    body: 'Add context',
    id: nextAuthoringObjectId(document, 'callout'),
    layers: [layerId],
    position: [Math.round(options.position.x), Math.round(options.position.y)],
    title: 'New Callout'
  };
}

export function createAuthoringText(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringPositionedObjectOptions
): DiagramText {
  const layerId = declaredLayerId(document, 'annotations', options.selectedLayerIds);
  return {
    id: nextAuthoringObjectId(document, 'text'),
    layers: [layerId],
    position: [Math.round(options.position.x), Math.round(options.position.y)],
    text: 'Text'
  };
}

export function createAuthoringPath(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringPathOptions
): GraphPath {
  const sequence = options.sequence.filter((id, index, values) => id && (index === 0 || id !== values[index - 1]));
  if (sequence.length < 2) throw new Error('Path creation requires at least two selected nodes.');
  if (sequence[0] === sequence[sequence.length - 1]) throw new Error('Path source and target must be different.');
  for (const id of sequence) {
    if (nodeIndexById(document, id) < 0) throw new Error(`Path node "${id}" does not exist.`);
  }
  const mode = options.mode || 'loose';
  let resolvedSequence = sequence;
  if (mode === 'explicit') {
    const missing = pathSegmentsWithoutDirectLinks(document, sequence);
    if (missing.length) throw new Error(`Explicit path segment ${missing[0].source} -> ${missing[0].target} requires a direct link.`);
  } else if (mode === 'shortest') {
    resolvedSequence = sequence.slice(0, -1).reduce((resolved, source, index) => {
      const target = sequence[index + 1];
      const traversal = findAuthoringPathTraversals(document, source, target, { limit: 1 })[0];
      if (!traversal) throw new Error(`No graph traversal exists between ${source} and ${target}.`);
      return [...resolved, ...traversal.slice(resolved.length ? 1 : 0)];
    }, [] as string[]);
  } else {
    const unreachable = pathSegmentsWithoutReachability(document, sequence);
    if (unreachable.length) {
      throw new Error(`No graph traversal exists between ${unreachable[0].source} and ${unreachable[0].target}.`);
    }
  }
  const layerId = declaredLayerId(document, 'paths', options.selectedLayerIds);
  return {
    id: nextAuthoringObjectId(document, 'path'),
    labels: { path: layerId },
    layers: [layerId],
    sequence: resolvedSequence
  };
}

export function createAuthoringRegion(
  document: Record<string, unknown> | TopoDocument,
  options: CreateAuthoringRegionOptions
): GraphRegion {
  const layerId = declaredLayerId(document, 'physical', options.selectedLayerIds);
  const size = resolveAuthoringRegionSize(options.size);
  const position = authoringRegionPlacement(document as TopoDocument, {
    allowOverlap: options.allowOverlap,
    parentId: options.parentId,
    position: options.position,
    size
  });
  return {
    id: nextAuthoringObjectId(document, 'region'),
    labels: { scope: layerId },
    layers: [layerId],
    members: [...new Set(options.members || [])],
    ...(options.parentId ? { parent: options.parentId } : {}),
    position: [position.x, position.y]
  };
}

function collectionDetails(
  document: Record<string, unknown> | TopoDocument,
  kind: Exclude<AuthoringObjectKind, 'linkDirection'>
): { path: AuthoringSourcePath; values: AuthoringGraphObject[] } {
  if (kind === 'shape' || kind === 'callout' || kind === 'text') {
    const collection = diagramCollectionByKind[kind];
    return { path: ['diagram', collection], values: records(diagram(document)[collection]) };
  }
  const collection = graphCollectionByKind[kind];
  return { path: ['graph', collection], values: records(graph(document)[collection]) };
}

function sourceEntry(
  document: Record<string, unknown> | TopoDocument,
  selection: AuthoringObjectSelection
): { index: number; object: AuthoringGraphObject; path: AuthoringSourcePath; scopePath: AuthoringSourcePath } | undefined {
  if (selection.kind === 'linkDirection') return undefined;
  const collection = collectionDetails(document, selection.kind);
  const index = collection.values.findIndex((value) => value.id === selection.id);
  if (index < 0) return undefined;
  const scopePath = [...collection.path, index];
  return { index, object: collection.values[index], path: collection.path, scopePath };
}

export function authoringObjectSourcePath(
  document: Record<string, unknown> | TopoDocument,
  selection: AuthoringObjectSelection
): AuthoringSourcePath | undefined {
  if (selection.kind !== 'linkDirection') return sourceEntry(document, selection)?.scopePath;
  const links = graphLinks(document);
  for (let linkIndex = 0; linkIndex < links.length; linkIndex += 1) {
    const link = links[linkIndex];
    const linkId = String(link.id || '');
    for (const [direction, value] of Object.entries(record(link.directions) || {})) {
      const entry = record(value);
      if (!entry) continue;
      const directionId = typeof entry.id === 'string' && entry.id ? entry.id : `${linkId}:${direction}`;
      if (directionId === selection.id) return ['graph', 'links', linkIndex, 'directions', direction];
    }
  }
  return undefined;
}

export function planAuthoringCalloutAttachment(
  document: Record<string, unknown> | TopoDocument,
  calloutId: string,
  targetNodeId: string
): AuthoringEditPlan {
  const callout = sourceEntry(document, { id: calloutId, kind: 'callout' });
  if (!callout) throw new Error(`Callout "${calloutId}" does not exist.`);
  const target = sourceEntry(document, { id: targetNodeId, kind: 'node' });
  if (!target) throw new Error(`Callout target node "${targetNodeId}" does not exist.`);
  return {
    insertions: [],
    removals: [],
    updates: [{
      path: [...callout.scopePath, 'target'],
      scopePath: callout.scopePath,
      value: targetNodeId
    }]
  };
}

function uniqueAuthoringSelections(selections: AuthoringObjectSelection[]) {
  const seen = new Set<string>();
  return selections.filter((selection) => {
    const key = authoringSelectionKey(selection);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function copyAuthoringSelection(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[]
): AuthoringClipboardItem[] {
  return uniqueAuthoringSelections(selections).flatMap((selection) => {
    const entry = sourceEntry(document, selection);
    return entry ? [{ selection, value: cloneAuthoringValue(entry.object) }] : [];
  });
}

function duplicatePrefix(selection: AuthoringObjectSelection) {
  const normalized = selection.id
    .replace(/-\d+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();
  return normalized || selection.kind;
}

function nextReservedId(existingIds: Set<string>, prefix: string) {
  let index = 1;
  while (existingIds.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  existingIds.add(id);
  return id;
}

function translatedPosition(value: unknown, offset: { x: number; y: number }) {
  if (Array.isArray(value)) {
    return [Math.round(Number(value[0] || 0) + offset.x), Math.round(Number(value[1] || 0) + offset.y)];
  }
  const position = record(value);
  return position
    ? { x: Math.round(Number(position.x || 0) + offset.x), y: Math.round(Number(position.y || 0) + offset.y) }
    : undefined;
}

export function pasteAuthoringClipboard(
  document: Record<string, unknown> | TopoDocument,
  clipboard: AuthoringClipboardItem[],
  offset: { x: number; y: number } = { x: 32, y: 32 }
): AuthoringEditPlan {
  const existingIds = allObjectIds(document);
  const idBySource = new Map<string, string>();
  for (const item of clipboard) {
    idBySource.set(item.selection.id, nextReservedId(existingIds, duplicatePrefix(item.selection)));
  }
  const insertions = clipboard.flatMap((item): AuthoringInsertion[] => {
    if (item.selection.kind === 'linkDirection') return [];
    const id = idBySource.get(item.selection.id);
    if (!id) return [];
    const value = cloneAuthoringValue(item.value);
    value.id = id;
    const position = translatedPosition(value.position, offset);
    if (position) value.position = position;
    if (item.selection.kind === 'link') {
      value.source = idBySource.get(String(value.source || '')) || value.source;
      value.target = idBySource.get(String(value.target || '')) || value.target;
    }
    if (item.selection.kind === 'path' && Array.isArray(value.sequence)) {
      value.sequence = value.sequence.map((nodeId) => idBySource.get(String(nodeId)) || nodeId);
    }
    if (item.selection.kind === 'region' && Array.isArray(value.members)) {
      value.members = value.members.map((memberId) => idBySource.get(String(memberId)) || memberId);
    }
    if (item.selection.kind === 'callout') {
      if (value.source) value.source = idBySource.get(String(value.source)) || value.source;
      if (value.target) value.target = idBySource.get(String(value.target)) || value.target;
    }
    if (value.parent) value.parent = idBySource.get(String(value.parent)) || value.parent;
    const collection = collectionDetails(document, item.selection.kind);
    const selection = { id, kind: item.selection.kind };
    return [{ path: collection.path, selection, value }];
  });
  return { insertions, removals: [], updates: [] };
}

function removalForSelection(
  document: Record<string, unknown> | TopoDocument,
  selection: AuthoringObjectSelection
): AuthoringRemoval | undefined {
  const entry = sourceEntry(document, selection);
  if (!entry) return undefined;
  return {
    path: [...entry.path, entry.index],
    scopePath: entry.path,
    selection
  };
}

export function planAuthoringDeletion(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[]
): AuthoringEditPlan {
  const selected = uniqueAuthoringSelections(selections);
  if (selected.some((selection) => selection.kind === 'layer')) {
    throw new Error('Use the layer deletion plan so referenced objects remain valid.');
  }
  const selectedNodeIds = new Set(selected.filter((item) => item.kind === 'node').map((item) => item.id));
  const dependent: AuthoringObjectSelection[] = [];
  if (selectedNodeIds.size) {
    graphLinks(document).forEach((link) => {
      if (selectedNodeIds.has(String(link.source || '')) || selectedNodeIds.has(String(link.target || ''))) {
        dependent.push({ id: String(link.id), kind: 'link' });
      }
    });
    records(graph(document).paths).forEach((path) => {
      const sequence = Array.isArray(path.sequence) ? path.sequence.map(String) : [];
      if (sequence.some((id) => selectedNodeIds.has(id))) dependent.push({ id: String(path.id), kind: 'path' });
    });
    records(diagram(document).callouts).forEach((callout) => {
      if (selectedNodeIds.has(String(callout.source || '')) || selectedNodeIds.has(String(callout.target || ''))) {
        dependent.push({ id: String(callout.id), kind: 'callout' });
      }
    });
  }
  const removals = uniqueAuthoringSelections([...selected, ...dependent])
    .flatMap((selection) => {
      const removal = removalForSelection(document, selection);
      return removal ? [removal] : [];
    })
    .sort((left, right) => {
      const dependencyPriority: Partial<Record<AuthoringObjectKind, number>> = {
        callout: 0,
        link: 1,
        path: 2,
        shape: 3,
        text: 4,
        region: 5,
        node: 6
      };
      const priorityDelta = (dependencyPriority[left.selection.kind] ?? 10) - (dependencyPriority[right.selection.kind] ?? 10);
      if (priorityDelta !== 0) return priorityDelta;
      const leftCollection = left.scopePath.join('.');
      const rightCollection = right.scopePath.join('.');
      if (leftCollection !== rightCollection) return leftCollection.localeCompare(rightCollection);
      return Number(right.path.at(-1)) - Number(left.path.at(-1));
    });
  const updates = records(graph(document).regions).flatMap((region, index): AuthoringValueUpdate[] => {
    if (!Array.isArray(region.members) || !selectedNodeIds.size) return [];
    const members = region.members.map(String);
    const nextMembers = members.filter((memberId) => !selectedNodeIds.has(memberId));
    return nextMembers.length === members.length ? [] : [{
      path: ['graph', 'regions', index, 'members'],
      scopePath: ['graph', 'regions', index],
      value: nextMembers
    }];
  });
  return { insertions: [], removals, updates };
}

function positionTuple(value: unknown): { kind: 'tuple' | 'record'; x: number; y: number } | undefined {
  if (Array.isArray(value)) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { kind: 'tuple', x, y } : undefined;
  }
  const position = record(value);
  if (!position) return undefined;
  const x = Number(position.x);
  const y = Number(position.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { kind: 'record', x, y } : undefined;
}

function objectSize(
  document: Record<string, unknown> | TopoDocument,
  selection: AuthoringObjectSelection,
  object: AuthoringGraphObject
) {
  if (selection.kind === 'region') {
    const bounds = authoringRegionBounds(document as TopoDocument, selection.id);
    if (bounds) return { width: bounds.width, height: bounds.height };
  }
  if (selection.kind === 'shape') {
    const shape = object as DiagramShape;
    return resolveShapeDimensions(applyStyle('shape', shape, document as TopoDocument));
  }
  const styleKind = selection.kind === 'node' || selection.kind === 'callout' || selection.kind === 'text'
    ? selection.kind
    : undefined;
  const style = styleKind ? applyStyle(styleKind, object as GraphEntity, document as TopoDocument) : {};
  const width = Number(style.width || (selection.kind === 'node' ? 88 : selection.kind === 'callout' ? 320 : selection.kind === 'text' ? 220 : 0));
  const height = Number(style.height || (selection.kind === 'node' ? 74 : selection.kind === 'callout' ? 120 : selection.kind === 'text' ? 64 : 0));
  return {
    width: Number.isFinite(width) && width > 0 ? width : 0,
    height: Number.isFinite(height) && height > 0 ? height : 0
  };
}

function positionUpdates(
  entry: NonNullable<ReturnType<typeof sourceEntry>>,
  position: { x: number; y: number }
): AuthoringValueUpdate[] {
  const current = positionTuple(entry.object.position);
  if (!current) throw new Error(`Selected object "${String(entry.object.id || '')}" does not have an editable position.`);
  const keys: Array<string | number> = current.kind === 'tuple' ? [0, 1] : ['x', 'y'];
  return [position.x, position.y].map((value, index) => ({
    path: [...entry.scopePath, 'position', keys[index]],
    scopePath: entry.scopePath,
    value: Math.round(value)
  }));
}

function positionedEntries(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[]
) {
  return uniqueAuthoringSelections(selections).flatMap((selection) => {
    const entry = sourceEntry(document, selection);
    const position = entry ? positionTuple(entry.object.position) : undefined;
    return entry && position ? [{ entry, position, selection, size: objectSize(document, selection, entry.object) }] : [];
  });
}

export function planAuthoringPositionDelta(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[],
  delta: { x: number; y: number }
): AuthoringEditPlan {
  const entries = positionedEntries(document, selections);
  if (!entries.length) throw new Error('Move selection requires at least one positioned object.');
  return {
    insertions: [], removals: [],
    updates: entries.flatMap(({ entry, position }) => positionUpdates(entry, {
      x: position.x + delta.x,
      y: position.y + delta.y
    }))
  };
}

export function planAuthoringAlignment(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[],
  alignment: AuthoringAlignment
): AuthoringEditPlan {
  const entries = positionedEntries(document, selections);
  if (entries.length < 2) throw new Error('Align selection requires at least two positioned objects.');
  const minX = Math.min(...entries.map(({ position }) => position.x));
  const minY = Math.min(...entries.map(({ position }) => position.y));
  const maxX = Math.max(...entries.map(({ position, size }) => position.x + size.width));
  const maxY = Math.max(...entries.map(({ position, size }) => position.y + size.height));
  return {
    insertions: [], removals: [],
    updates: entries.flatMap(({ entry, position, size }) => {
      const next = { x: position.x, y: position.y };
      if (alignment === 'left') next.x = minX;
      if (alignment === 'center') next.x = minX + (maxX - minX - size.width) / 2;
      if (alignment === 'right') next.x = maxX - size.width;
      if (alignment === 'top') next.y = minY;
      if (alignment === 'middle') next.y = minY + (maxY - minY - size.height) / 2;
      if (alignment === 'bottom') next.y = maxY - size.height;
      return positionUpdates(entry, next);
    })
  };
}

export function planAuthoringDistribution(
  document: Record<string, unknown> | TopoDocument,
  selections: AuthoringObjectSelection[],
  axis: AuthoringDistributionAxis
): AuthoringEditPlan {
  const entries = positionedEntries(document, selections).sort((left, right) => (
    axis === 'horizontal'
      ? left.position.x + left.size.width / 2 - (right.position.x + right.size.width / 2)
      : left.position.y + left.size.height / 2 - (right.position.y + right.size.height / 2)
  ));
  if (entries.length < 3) throw new Error('Distribute selection requires at least three positioned objects.');
  const first = entries[0];
  const last = entries.at(-1) as typeof first;
  const firstCenter = axis === 'horizontal'
    ? first.position.x + first.size.width / 2
    : first.position.y + first.size.height / 2;
  const lastCenter = axis === 'horizontal'
    ? last.position.x + last.size.width / 2
    : last.position.y + last.size.height / 2;
  const step = (lastCenter - firstCenter) / (entries.length - 1);
  return {
    insertions: [], removals: [],
    updates: entries.flatMap(({ entry, position, size }, index) => {
      const center = firstCenter + step * index;
      return positionUpdates(entry, {
        x: axis === 'horizontal' ? center - size.width / 2 : position.x,
        y: axis === 'vertical' ? center - size.height / 2 : position.y
      });
    })
  };
}

export function planAuthoringResize(
  document: Record<string, unknown> | TopoDocument,
  selection: AuthoringObjectSelection,
  position: { x: number; y: number },
  _size: { width: number; height: number }
): AuthoringEditPlan {
  const entry = sourceEntry(document, selection);
  if (!entry || selection.kind === 'link' || selection.kind === 'linkDirection' || selection.kind === 'path') {
    throw new Error(`Selected ${selection.kind} "${selection.id}" does not support direct resize.`);
  }
  const currentPosition = positionTuple(entry.object.position);
  const updates = currentPosition
    ? positionUpdates(entry, position)
    : selection.kind === 'region'
      ? [{
          path: [...entry.scopePath, 'position'],
          scopePath: entry.scopePath,
          value: [Math.round(position.x), Math.round(position.y)]
        }]
      : positionUpdates(entry, position);
  // Dimensions and visual geometry are stylesheet policy for every resizable
  // object. This topology plan owns position and removes imported residue only.
  const presentationKind = selection.kind in TOPOLOGY_OBJECT_PRESENTATION_FIELDS
    ? selection.kind as TopologyPresentationObjectKind
    : undefined;
  const presentationKeys = presentationKind ? TOPOLOGY_OBJECT_PRESENTATION_FIELDS[presentationKind] : [];
  const removals = presentationKeys.flatMap((key): AuthoringRemoval[] => key in entry.object ? [{
        path: [...entry.scopePath, key],
        scopePath: entry.scopePath,
        selection
      }] : []);
  return { insertions: [], removals, updates };
}
