import yaml from 'js-yaml';
import type { TopoDocument } from 'topoviewer';
import {
  authoringLinkDirectionObjects,
  authoringObjectDisplayName,
  authoringObjectExists,
  authoringSelectionKey,
  createAuthoringNode,
  defaultLayerId as sharedDefaultLayerId,
  findAuthoringObject,
  graphHasLinkBetween as sharedGraphHasLinkBetween,
  graphHasReachabilityBetween as sharedGraphHasReachabilityBetween,
  nextAuthoringObjectId,
  pathSegmentsWithoutDirectLinks as sharedPathSegmentsWithoutDirectLinks,
  pathSegmentsWithoutReachability as sharedPathSegmentsWithoutReachability,
  resolveAuthoringSelection,
  sameAuthoringSelection
} from 'topoviewer/authoring';

export type TopoObjectKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'callout' | 'shape';
export type InsertObjectType = 'node' | 'router' | 'service' | 'controller' | 'external' | 'link' | 'path' | 'region' | 'callout' | 'shape' | 'alert';
export type AttentionFocusKind = 'nodeIds' | 'linkIds' | 'pathIds' | 'regionIds';

export interface TopoObjectSelection {
  kind: TopoObjectKind;
  id: string;
}

export interface MutationResult {
  text: string;
  document: Record<string, any>;
}

export interface InsertObjectOptions {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  type: InsertObjectType;
  selectedObjects: TopoObjectSelection[];
  selectedLayerIds: string[];
}

export interface TopoObjectPreset {
  body?: unknown;
  data?: Record<string, unknown>;
  icon?: string;
  id: string;
  kind: TopoObjectKind;
  labels?: Record<string, unknown>;
  name: string;
  style?: Record<string, unknown>;
  title?: string;
  type?: string;
}

export interface InsertPresetOptions {
  preset: TopoObjectPreset;
  selectedObjects: TopoObjectSelection[];
  selectedLayerIds: string[];
}

export interface UpdateObjectOptions {
  selection: TopoObjectSelection;
  name?: string;
  layerId?: string;
  members?: string[];
  position?: { x: number; y: number };
  labels?: Record<string, unknown>;
  labelsReplace?: Record<string, unknown>;
  data?: Record<string, unknown>;
  dataReplace?: Record<string, unknown>;
  style?: Record<string, unknown>;
  styleReplace?: Record<string, unknown>;
}

export interface UpsertGraphLinkOptions {
  id?: string;
  name?: string;
  normalizeByNodeOrder?: boolean;
  selectedLayerIds: string[];
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

export interface UpsertGraphPathOptions {
  id?: string;
  name?: string;
  selectedLayerIds: string[];
  sequence: string[];
}

export interface UpdateNodePositionOptions {
  nodeId: string;
  position: { x: number; y: number };
}

export interface UpdateNodePositionAndRegionMembershipOptions {
  nodeId: string;
  position: { x: number; y: number };
}

export interface UpdatePositionedObjectPositionOptions {
  selection: TopoObjectSelection;
  position: { x: number; y: number };
}

export interface UpdatePositionedObjectGeometryOptions {
  selection: TopoObjectSelection;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface ReleaseNodeFromRegionOptions {
  nodeId: string;
  regionId: string;
}

export interface UpdateRegionMemberPositionsOptions {
  delta: { x: number; y: number };
  regionId: string;
}

export interface AttentionFocusOptions {
  focusKind: AttentionFocusKind;
  ids: string[];
  mode: string;
}

export interface AttentionMatcherOptions {
  matcherKind: 'labels' | 'data';
  key: string;
  value: unknown;
  mode: string;
}

export interface SetRegionAggregateExpandedOptions {
  expanded: boolean;
  groupId?: string;
  regionId: string;
}

const graphCollectionByKind: Record<'node' | 'link' | 'path' | 'region', string> = {
  node: 'nodes',
  link: 'links',
  path: 'paths',
  region: 'regions'
};

const diagramCollectionByKind: Record<'callout' | 'shape', string> = {
  callout: 'callouts',
  shape: 'shapes'
};

export function parseTopologyText(text: string): Record<string, any> {
  const parsed = yaml.load(text || '{}') || {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Topology YAML must contain an object at the document root.');
  }
  return parsed as Record<string, any>;
}

export function dumpTopology(document: Record<string, any>): string {
  return yaml.dump(document, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    sortKeys: false
  });
}

export function mutateTopologyText(
  text: string,
  mutator: (document: Record<string, any>) => void
): MutationResult {
  const document = parseTopologyText(text);
  mutator(document);
  return {
    document,
    text: dumpTopology(document)
  };
}

function ensureGraph(document: Record<string, any>): Record<string, any> {
  document.graph = document.graph && typeof document.graph === 'object' ? document.graph : {};
  return document.graph;
}

function ensureDiagram(document: Record<string, any>): Record<string, any> {
  document.diagram = document.diagram && typeof document.diagram === 'object' ? document.diagram : {};
  return document.diagram;
}

function ensureArray(parent: Record<string, any>, key: string): any[] {
  parent[key] = Array.isArray(parent[key]) ? parent[key] : [];
  return parent[key];
}

function nextId(document: Record<string, any>, prefix: string): string {
  return nextAuthoringObjectId(document, prefix);
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneUnknown(value: unknown): unknown {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function presetPrefix(preset: TopoObjectPreset): string {
  const normalized = preset.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return normalized || preset.kind;
}

function presetFields(preset: TopoObjectPreset): Record<string, unknown> {
  return {
    name: preset.name,
    ...(preset.labels ? { labels: cloneRecord(preset.labels) } : {}),
    ...(preset.data ? { data: cloneRecord(preset.data) } : {}),
    ...(preset.style ? { style: cloneRecord(preset.style) } : {}),
    ...(preset.icon ? { icon: preset.icon } : {})
  };
}

export function defaultLayerId(document: Record<string, any> | TopoDocument | undefined, selectedLayerIds: string[]): string {
  return sharedDefaultLayerId(document, selectedLayerIds);
}

function layoutCenter(document: Record<string, any>): [number, number] {
  const layout = document.layout || {};
  return [Number(layout.width || 900) / 2, Number(layout.height || 520) / 2];
}

function positionOf(value: unknown): { x: number; y: number } | undefined {
  if (Array.isArray(value)) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  if (value && typeof value === 'object') {
    const candidate = value as { x?: unknown; y?: unknown };
    const x = Number(candidate.x);
    const y = Number(candidate.y);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  return undefined;
}

function sizeOf(value: unknown): { width: number; height: number } | undefined {
  if (Array.isArray(value)) {
    const width = Number(value[0]);
    const height = Number(value[1]);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height }
      : undefined;
  }
  if (value && typeof value === 'object') {
    const candidate = value as { width?: unknown; height?: unknown };
    const width = Number(candidate.width);
    const height = Number(candidate.height);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
      ? { width, height }
      : undefined;
  }
  return undefined;
}

function positionedObjects(document: Record<string, any>): Array<{ x: number; y: number }> {
  return [
    ...(document.graph?.nodes || []),
    ...(document.diagram?.shapes || []),
    ...(document.diagram?.callouts || [])
  ].flatMap((object: any) => {
    const position = positionOf(object.position);
    return position ? [position] : [];
  });
}

function selectedNodePosition(document: Record<string, any>, selectedObjects: TopoObjectSelection[]): { x: number; y: number } | undefined {
  const selectedNodeId = selectedIds(selectedObjects, 'node')[0];
  const node = selectedNodeId ? graphNodes(document).find((candidate) => candidate.id === selectedNodeId) : undefined;
  return positionOf(node?.position);
}

function hasNearbyObject(candidate: { x: number; y: number }, occupied: Array<{ x: number; y: number }>): boolean {
  return occupied.some((position) => Math.abs(candidate.x - position.x) < 140 && Math.abs(candidate.y - position.y) < 92);
}

function nextCanvasPosition(
  document: Record<string, any>,
  selectedObjects: TopoObjectSelection[],
  offset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  const selectedPosition = selectedNodePosition(document, selectedObjects);
  const [centerX, centerY] = layoutCenter(document);
  const base = selectedPosition
    ? { x: selectedPosition.x + 180 + offset.x, y: selectedPosition.y + offset.y }
    : { x: centerX + offset.x, y: centerY + offset.y };
  const occupied = positionedObjects(document);
  const offsets = [
    [0, 0],
    [180, 0],
    [-180, 0],
    [0, 120],
    [0, -120],
    [180, 120],
    [-180, 120],
    [180, -120],
    [-180, -120],
    [360, 0],
    [-360, 0],
    [360, 120],
    [-360, 120],
    [0, 240],
    [0, -240]
  ];
  for (const [x, y] of offsets) {
    const candidate = { x: Math.round(base.x + x), y: Math.round(base.y + y) };
    if (!hasNearbyObject(candidate, occupied)) return candidate;
  }
  const index = occupied.length;
  return {
    x: Math.round(centerX + (index % 6) * 180),
    y: Math.round(centerY + Math.floor(index / 6) * 120)
  };
}

function selectedIds(selectedObjects: TopoObjectSelection[], kind: TopoObjectKind): string[] {
  return selectedObjects.filter((object) => object.kind === kind).map((object) => object.id);
}

function firstGraphNodeIds(document: Record<string, any>, count: number): string[] {
  return ((document.graph?.nodes || []) as any[]).slice(0, count).map((node) => String(node.id)).filter(Boolean);
}

function selectedNodeIdsOrFallback(document: Record<string, any>, selectedObjects: TopoObjectSelection[], count: number): string[] {
  const selected = selectedIds(selectedObjects, 'node');
  return selected.length >= count ? selected.slice(0, count) : firstGraphNodeIds(document, count);
}

function selectedRegionMemberIdsOrFallback(document: Record<string, any>, selectedObjects: TopoObjectSelection[]): string[] {
  const selected = selectedIds(selectedObjects, 'node');
  return selected.length ? selected : firstGraphNodeIds(document, 1);
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

function regionParentKey(region: Record<string, any> | undefined): string {
  return String(region?.parent || '');
}

function hasExplicitRegionBounds(region: Record<string, any> | undefined): boolean {
  return !!region && !!positionOf(region.position) && !!sizeOf(region.size);
}

function pruneTouchedEmptyRegions(regions: any[], touchedRegionIds: Set<string>) {
  if (!touchedRegionIds.size) return;
  for (let index = regions.length - 1; index >= 0; index -= 1) {
    const region = regions[index];
    const regionId = String(region?.id || '');
    if (!touchedRegionIds.has(regionId)) continue;
    const hasMembers = Array.isArray(region.members) && region.members.length > 0;
    const hasChildren = regions.some((candidate) => String(candidate?.parent || '') === regionId);
    if (!hasMembers && !hasChildren && !hasExplicitRegionBounds(region)) regions.splice(index, 1);
  }
}

function removeMembersFromSiblingRegions(
  regions: any[],
  members: string[],
  options: { exemptRegionId?: string; parentId?: string } = {}
) {
  const memberSet = new Set(members);
  if (!memberSet.size) return;
  const parentKey = options.parentId || '';
  const touchedRegionIds = new Set<string>();

  regions.forEach((region) => {
    const regionId = String(region?.id || '');
    if (!regionId || regionId === options.exemptRegionId) return;
    if (regionParentKey(region) !== parentKey) return;
    if (!Array.isArray(region.members)) return;
    const nextMembers = region.members.map(String).filter((memberId: string) => !memberSet.has(memberId));
    if (nextMembers.length === region.members.length) return;
    region.members = nextMembers;
    if (!nextMembers.length) touchedRegionIds.add(regionId);
  });

  pruneTouchedEmptyRegions(regions, touchedRegionIds);
}

function recursiveRegionMemberNodeIds(document: Record<string, any>, regionId: string): string[] {
  const regions = Array.isArray(document.graph?.regions) ? document.graph.regions : [];
  const regionById = new Map<string, any>(regions.map((region: any) => [String(region.id || ''), region]));
  const nodeIds = graphNodeIds(document);
  const visitedRegions = new Set<string>();
  const memberNodeIds = new Set<string>();

  function visit(currentRegionId: string) {
    if (visitedRegions.has(currentRegionId)) return;
    visitedRegions.add(currentRegionId);
    const region = regionById.get(currentRegionId);
    if (!region) return;
    (Array.isArray(region.members) ? region.members : []).forEach((memberId: unknown) => {
      const normalizedMemberId = String(memberId || '');
      if (nodeIds.has(normalizedMemberId)) memberNodeIds.add(normalizedMemberId);
    });
    regions
      .filter((candidate: any) => String(candidate.parent || '') === currentRegionId)
      .forEach((child: any) => visit(String(child.id || '')));
  }

  visit(regionId);
  return [...memberNodeIds];
}

function translatePosition(value: unknown, delta: { x: number; y: number }): [number, number] | { x: number; y: number } {
  const current = positionOf(value) || { x: 0, y: 0 };
  const x = Math.round(current.x + delta.x);
  const y = Math.round(current.y + delta.y);
  return value && !Array.isArray(value) && typeof value === 'object' ? { x, y } : [x, y];
}

type Bounds = { x: number; y: number; width: number; height: number };
type RegionBoundsCandidate = { region: Record<string, any>; bounds: Bounds | undefined; area: number };

function unionBounds(boundsList: Array<Bounds | undefined>): Bounds | undefined {
  const bounds = boundsList.filter(Boolean) as Bounds[];
  if (!bounds.length) return undefined;
  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function explicitRegionBounds(region: Record<string, any>): Bounds | undefined {
  const position = positionOf(region.position);
  const size = sizeOf(region.size);
  return position && size ? { x: position.x, y: position.y, width: size.width, height: size.height } : undefined;
}

function memberRegionBounds(document: Record<string, any>, region: Record<string, any>): Bounds | undefined {
  const members = Array.isArray(region.members) ? region.members.map(String) : [];
  if (!members.length) return undefined;
  const nodesById = new Map(graphNodes(document).map((node) => [String(node.id || ''), node]));
  const nodes = members.map((id) => nodesById.get(id)).filter(Boolean);
  if (!nodes.length) return undefined;
  const padding = Number.isFinite(Number(region.padding)) ? Number(region.padding) : 88;
  const paddingX = Number.isFinite(Number(region.paddingX)) ? Number(region.paddingX) : padding;
  const paddingY = Number.isFinite(Number(region.paddingY)) ? Number(region.paddingY) : padding;
  const nodeWidth = Number.isFinite(Number(region.nodeWidth)) ? Number(region.nodeWidth) : 88;
  const nodeHeight = Number.isFinite(Number(region.nodeHeight)) ? Number(region.nodeHeight) : 74;
  const points = nodes.map((node) => positionOf(node.position) || { x: 0, y: 0 });
  const minX = Math.min(...points.map((point) => point.x)) - paddingX;
  const minY = Math.min(...points.map((point) => point.y)) - paddingY;
  const maxX = Math.max(...points.map((point) => point.x + nodeWidth)) + paddingX;
  const maxY = Math.max(...points.map((point) => point.y + nodeHeight)) + paddingY;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function regionBoundsForMembership(document: Record<string, any>, region: Record<string, any>): Bounds | undefined {
  return unionBounds([explicitRegionBounds(region), memberRegionBounds(document, region)]);
}

function containsPoint(bounds: Bounds | undefined, point: { x: number; y: number }): boolean {
  return !!bounds
    && point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.height;
}

function containingRegionForNodePosition(
  document: Record<string, any>,
  nodeId: string,
  position: { x: number; y: number }
): Record<string, any> | undefined {
  const regions = Array.isArray(document.graph?.regions) ? document.graph.regions : [];
  const point = { x: position.x + 44, y: position.y + 37 };
  return regions
    .map((region: any): RegionBoundsCandidate => {
      const bounds = regionBoundsForMembership(document, region);
      return { region, bounds, area: bounds ? bounds.width * bounds.height : Number.POSITIVE_INFINITY };
    })
    .filter((candidate: RegionBoundsCandidate) => String(candidate.region?.id || '') && containsPoint(candidate.bounds, point))
    .filter((candidate: RegionBoundsCandidate) => !(Array.isArray(candidate.region.members) && candidate.region.members.map(String).includes(nodeId)))
    .sort((a: RegionBoundsCandidate, b: RegionBoundsCandidate) => a.area - b.area)[0]?.region;
}

const graphLinkDirectionObjects = authoringLinkDirectionObjects;

function graphNodes(document: Record<string, any>): any[] {
  return Array.isArray(document.graph?.nodes) ? document.graph.nodes : [];
}

function graphNodeIds(document: Record<string, any>): Set<string> {
  return new Set(graphNodes(document).map((node) => String(node.id || '')).filter(Boolean));
}

function requireGraphNodeIds(document: Record<string, any>, ids: string[]) {
  const available = graphNodeIds(document);
  ids.forEach((id) => {
    if (!available.has(id)) throw new Error(`Node "${id}" does not exist.`);
  });
}

export function graphHasLinkBetween(document: Record<string, any> | TopoDocument | undefined, source: string, target: string): boolean {
  return sharedGraphHasLinkBetween(document, source, target);
}

export function graphHasReachabilityBetween(document: Record<string, any> | TopoDocument | undefined, source: string, target: string): boolean {
  return sharedGraphHasReachabilityBetween(document, source, target);
}

export function pathSegmentsWithoutReachability(document: Record<string, any> | TopoDocument | undefined, sequence: string[]) {
  return sharedPathSegmentsWithoutReachability(document, sequence);
}

export function pathSegmentsWithoutDirectLinks(document: Record<string, any> | TopoDocument | undefined, sequence: string[]) {
  return sharedPathSegmentsWithoutDirectLinks(document, sequence);
}

function requirePathReachability(document: Record<string, any>, sequence: string[]) {
  const missing = pathSegmentsWithoutReachability(document, sequence);
  if (!missing.length) return;
  const segment = missing[0];
  throw new Error(`Path segment "${segment.source}" -> "${segment.target}" requires graph reachability through existing links.`);
}

function normalizedPathSequence(sequence: string[]): string[] {
  const normalized = sequence.map((id) => id.trim()).filter(Boolean);
  if (normalized.length < 2) throw new Error('Path requires at least source and target nodes.');
  if (normalized[0] === normalized[normalized.length - 1]) {
    throw new Error('Path source and target must be different.');
  }
  return normalized;
}

export function findObject(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection | undefined): any | undefined {
  return findAuthoringObject(document, selection) as any;
}

export function objectExists(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection): boolean {
  return authoringObjectExists(document, selection);
}

export function objectDisplayName(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection | undefined): string {
  return authoringObjectDisplayName(document, selection);
}

export function resolveSelectionFromObject(document: TopoDocument | undefined, sourceId: string): TopoObjectSelection | undefined {
  return resolveAuthoringSelection(document, sourceId);
}

export function selectionKey(selection: TopoObjectSelection): string {
  return authoringSelectionKey(selection);
}

export function sameSelection(a: TopoObjectSelection, b: TopoObjectSelection): boolean {
  return sameAuthoringSelection(a, b);
}

export function insertTopoObject(text: string, options: InsertObjectOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const graph = ensureGraph(document);
    const layerId = defaultLayerId(document, options.selectedLayerIds);
    const nodes = ensureArray(graph, 'nodes');
    const links = ensureArray(graph, 'links');
    const paths = ensureArray(graph, 'paths');
    const regions = ensureArray(graph, 'regions');

    if (options.type === 'node' || options.type === 'router' || options.type === 'controller' || options.type === 'external' || options.type === 'service') {
      const position = options.position || nextCanvasPosition(document, options.selectedObjects);
      nodes.push(createAuthoringNode(document, {
        kind: options.type,
        position,
        selectedLayerIds: [layerId]
      }));
      return;
    }

    if (options.type === 'alert') {
      const target = selectedNodeIdsOrFallback(document, options.selectedObjects, 1)[0];
      const id = nextId(document, 'alert');
      const position = nextCanvasPosition(document, options.selectedObjects, { x: 180, y: -120 });
      nodes.push({
        id,
        name: 'Alert',
        labels: { role: 'ops' },
        data: { severity: 'major', status: 'investigating' },
        layers: [layerId],
        position: [position.x, position.y]
      });
      if (target) {
        links.push({
          id: nextId(document, 'incident'),
          name: 'Incident',
          source: id,
          target,
          labels: { layer: 'operations' },
          data: { severity: 'major' },
          layers: [layerId]
        });
      }
      return;
    }

    if (options.type === 'link') {
      const [source, target] = selectedNodeIdsOrFallback(document, options.selectedObjects, 2);
      if (!source || !target) throw new Error('Insert Link requires at least two nodes.');
      links.push({
        id: nextId(document, 'link'),
        name: 'New Link',
        source,
        target,
        labels: { layer: layerId },
        layers: [layerId]
      });
      return;
    }

    if (options.type === 'path') {
      const sequence = selectedNodeIdsOrFallback(document, options.selectedObjects, 3);
      if (sequence.length < 2) throw new Error('Insert Path requires at least two nodes.');
      paths.push({
        id: nextId(document, 'path'),
        name: 'New Path',
        labels: { path: layerId },
        layers: [layerId],
        sequence
      });
      return;
    }

    if (options.type === 'region') {
      const hasPlacement = !!options.position && !!options.size;
      const members = hasPlacement
        ? selectedIds(options.selectedObjects, 'node')
        : selectedRegionMemberIdsOrFallback(document, options.selectedObjects);
      if (!members.length && !hasPlacement) throw new Error('Insert Region requires at least one node or placement bounds.');
      const id = nextId(document, 'region');
      const normalizedMembers = uniqueIds(members);
      if (normalizedMembers.length) removeMembersFromSiblingRegions(regions, normalizedMembers);
      regions.push({
        id,
        name: 'New Region',
        labels: { scope: layerId },
        members: normalizedMembers,
        ...(options.position ? { position: [Math.round(options.position.x), Math.round(options.position.y)] } : {}),
        ...(options.size ? { size: [Math.round(options.size.width), Math.round(options.size.height)] } : {}),
        layers: [layerId],
        paddingX: 34,
        paddingY: 28,
        headerPadding: 34,
        style: {
          draggable: true,
          selectable: true
        }
      });
      return;
    }

    if (options.type === 'callout') {
      const callouts = ensureArray(ensureDiagram(document), 'callouts');
      const target = options.selectedObjects[0]?.kind === 'node' ? options.selectedObjects[0].id : undefined;
      const position = options.position || nextCanvasPosition(document, options.selectedObjects, { x: 120, y: -80 });
      callouts.push({
        id: nextId(document, 'callout'),
        title: 'New Callout',
        body: 'Add context',
        ...(target ? { target } : {}),
        ...(!target || options.position ? { position: [Math.round(position.x), Math.round(position.y)] } : {}),
        size: [160, 88],
        layers: [layerId]
      });
      return;
    }

    if (options.type === 'shape') {
      const shapes = ensureArray(ensureDiagram(document), 'shapes');
      const position = options.position || nextCanvasPosition(document, options.selectedObjects);
      const size = options.size || { width: 180, height: 96 };
      shapes.push({
        id: nextId(document, 'shape'),
        name: 'New Shape',
        type: 'rectangle',
        position: [Math.round(position.x), Math.round(position.y)],
        size: [Math.round(size.width), Math.round(size.height)],
        layers: [layerId]
      });
    }
  });
}

export function insertTopoPreset(text: string, options: InsertPresetOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const graph = ensureGraph(document);
    const layerId = defaultLayerId(document, options.selectedLayerIds);
    const nodes = ensureArray(graph, 'nodes');
    const links = ensureArray(graph, 'links');
    const paths = ensureArray(graph, 'paths');
    const regions = ensureArray(graph, 'regions');
    const preset = options.preset;
    const id = nextId(document, presetPrefix(preset));
    const fields = presetFields(preset);

    if (preset.kind === 'node') {
      const position = nextCanvasPosition(document, options.selectedObjects);
      nodes.push({
        id,
        ...fields,
        layers: [layerId],
        position: [position.x, position.y]
      });
      return;
    }

    if (preset.kind === 'link') {
      const [source, target] = selectedNodeIdsOrFallback(document, options.selectedObjects, 2);
      if (!source || !target) throw new Error('Insert link preset requires at least two nodes.');
      links.push({
        id,
        ...fields,
        source,
        target,
        layers: [layerId]
      });
      return;
    }

    if (preset.kind === 'path') {
      const sequence = selectedNodeIdsOrFallback(document, options.selectedObjects, 3);
      if (sequence.length < 2) throw new Error('Insert path preset requires at least two nodes.');
      paths.push({
        id,
        ...fields,
        sequence,
        layers: [layerId]
      });
      return;
    }

    if (preset.kind === 'region') {
      const members = selectedRegionMemberIdsOrFallback(document, options.selectedObjects);
      if (!members.length) throw new Error('Insert region preset requires at least one node.');
      const normalizedMembers = uniqueIds(members);
      removeMembersFromSiblingRegions(regions, normalizedMembers);
      regions.push({
        id,
        ...fields,
        members: normalizedMembers,
        layers: [layerId],
        style: {
          draggable: true,
          selectable: true,
          ...(fields.style && typeof fields.style === 'object' && !Array.isArray(fields.style) ? fields.style : {})
        }
      });
      return;
    }

    if (preset.kind === 'shape') {
      const shapes = ensureArray(ensureDiagram(document), 'shapes');
      const position = nextCanvasPosition(document, options.selectedObjects);
      shapes.push({
        id,
        ...fields,
        ...(preset.type ? { type: preset.type } : {}),
        layers: [layerId],
        position: [position.x, position.y]
      });
      return;
    }

    if (preset.kind === 'callout') {
      const callouts = ensureArray(ensureDiagram(document), 'callouts');
      const target = options.selectedObjects[0]?.kind === 'node' ? options.selectedObjects[0].id : undefined;
      const position = nextCanvasPosition(document, options.selectedObjects, { x: 120, y: -80 });
      callouts.push({
        id,
        ...fields,
        ...(preset.title ? { title: preset.title } : {}),
        ...(preset.body !== undefined ? { body: cloneUnknown(preset.body) } : {}),
        ...(target ? { target } : { position: [position.x, position.y] }),
        layers: [layerId]
      });
    }
  });
}

export function updateTopoObject(text: string, options: UpdateObjectOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const object = findObject(document, options.selection);
    if (!object) throw new Error(`Selected ${options.selection.kind} "${options.selection.id}" no longer exists.`);
    if (options.name !== undefined) object.name = options.name;
    if (options.layerId) object.layers = [options.layerId];
    if (options.members !== undefined) {
      if (options.selection.kind !== 'region') throw new Error('Only regions support member updates.');
      const members = uniqueIds(options.members);
      if (!members.length) throw new Error('Region requires at least one member.');
      const graph = ensureGraph(document);
      const regions = ensureArray(graph, 'regions');
      removeMembersFromSiblingRegions(regions, members, {
        exemptRegionId: options.selection.id,
        parentId: regionParentKey(object)
      });
      object.members = members;
    }
    if (options.position && (options.selection.kind === 'node' || options.selection.kind === 'shape' || options.selection.kind === 'callout' || options.selection.kind === 'region')) {
      object.position = [Math.round(options.position.x), Math.round(options.position.y)];
    }
    if (options.labels && Object.keys(options.labels).length > 0) {
      object.labels = {
        ...(object.labels && typeof object.labels === 'object' ? object.labels : {}),
        ...options.labels
      };
    }
    if (options.labelsReplace) {
      if (Object.keys(options.labelsReplace).length > 0) {
        object.labels = options.labelsReplace;
      } else {
        delete object.labels;
      }
    }
    if (options.data && Object.keys(options.data).length > 0) {
      object.data = {
        ...(object.data && typeof object.data === 'object' ? object.data : {}),
        ...options.data
      };
    }
    if (options.dataReplace) {
      if (Object.keys(options.dataReplace).length > 0) {
        object.data = options.dataReplace;
      } else {
        delete object.data;
      }
    }
    if (options.style && Object.keys(options.style).length > 0) {
      object.style = {
        ...(object.style && typeof object.style === 'object' ? object.style : {}),
        ...options.style
      };
    }
    if (options.styleReplace) {
      if (Object.keys(options.styleReplace).length > 0) {
        object.style = options.styleReplace;
      } else {
        delete object.style;
      }
    }
  });
}

export function upsertGraphLink(text: string, options: UpsertGraphLinkOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    if (!options.source || !options.target) throw new Error('Connection source and target are required.');
    if (options.source === options.target) throw new Error('Connection source and target must be different.');
    requireGraphNodeIds(document, [options.source, options.target]);

    const graph = ensureGraph(document);
    const links = ensureArray(graph, 'links');
    const existing = options.id ? links.find((link) => link.id === options.id) : undefined;
    const layerId = defaultLayerId(document, options.selectedLayerIds);
    const shouldNormalize = options.normalizeByNodeOrder && !options.id && !options.sourceHandle && !options.targetHandle;
    const nodeOrder = shouldNormalize
      ? new Map((graph.nodes || []).map((node: any, index: number) => [String(node.id || ''), index]))
      : undefined;
    const sourceOrder = nodeOrder?.get(options.source);
    const targetOrder = nodeOrder?.get(options.target);
    const swapsEndpoints = shouldNormalize
      && typeof sourceOrder === 'number'
      && typeof targetOrder === 'number'
      && sourceOrder > targetOrder;
    const source = swapsEndpoints ? options.target : options.source;
    const target = swapsEndpoints ? options.source : options.target;

    if (options.id && !existing) throw new Error(`Link "${options.id}" no longer exists.`);
    if (existing) {
      existing.source = source;
      existing.target = target;
      if (options.sourceHandle) {
        existing.sourceHandle = options.sourceHandle;
      } else {
        delete existing.sourceHandle;
      }
      if (options.targetHandle) {
        existing.targetHandle = options.targetHandle;
      } else {
        delete existing.targetHandle;
      }
      if (options.name !== undefined) existing.name = options.name;
      return;
    }

    links.push({
      id: nextId(document, 'link'),
      name: options.name || 'New Link',
      source,
      target,
      ...(options.sourceHandle ? { sourceHandle: options.sourceHandle } : {}),
      ...(options.targetHandle ? { targetHandle: options.targetHandle } : {}),
      labels: { layer: layerId },
      layers: [layerId]
    });
  });
}

export function upsertGraphPath(text: string, options: UpsertGraphPathOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const sequence = normalizedPathSequence(options.sequence);
    requireGraphNodeIds(document, sequence);
    requirePathReachability(document, sequence);

    const graph = ensureGraph(document);
    const paths = ensureArray(graph, 'paths');
    const existing = options.id ? paths.find((path) => path.id === options.id) : undefined;
    const layerId = defaultLayerId(document, options.selectedLayerIds);

    if (options.id && !existing) throw new Error(`Path "${options.id}" no longer exists.`);
    if (existing) {
      existing.sequence = sequence;
      delete existing.source;
      delete existing.target;
      if (options.name !== undefined) existing.name = options.name;
      return;
    }

    paths.push({
      id: nextId(document, 'path'),
      name: options.name || 'New Path',
      labels: { path: layerId },
      layers: [layerId],
      sequence
    });
  });
}

export function updateGraphNodePosition(text: string, options: UpdateNodePositionOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const node = graphNodes(document).find((candidate) => candidate.id === options.nodeId);
    if (!node) throw new Error(`Node "${options.nodeId}" no longer exists.`);
    const x = Math.round(options.position.x);
    const y = Math.round(options.position.y);
    if (Array.isArray(node.position)) {
      node.position = [x, y];
    } else if (node.position && typeof node.position === 'object') {
      node.position = { x, y };
    } else {
      node.position = [x, y];
    }
  });
}

export function updateGraphNodePositionAndRegionMembership(text: string, options: UpdateNodePositionAndRegionMembershipOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const node = graphNodes(document).find((candidate) => candidate.id === options.nodeId);
    if (!node) throw new Error(`Node "${options.nodeId}" no longer exists.`);
    const x = Math.round(options.position.x);
    const y = Math.round(options.position.y);
    if (Array.isArray(node.position)) {
      node.position = [x, y];
    } else if (node.position && typeof node.position === 'object') {
      node.position = { x, y };
    } else {
      node.position = [x, y];
    }

    const targetRegion = containingRegionForNodePosition(document, options.nodeId, { x, y });
    if (!targetRegion) return;
    const targetRegionId = String(targetRegion.id || '');
    targetRegion.members = uniqueIds([
      ...(Array.isArray(targetRegion.members) ? targetRegion.members.map(String) : []),
      options.nodeId
    ]);
    const regions = ensureArray(ensureGraph(document), 'regions');
    removeMembersFromSiblingRegions(regions, [options.nodeId], {
      exemptRegionId: targetRegionId,
      parentId: regionParentKey(targetRegion)
    });
  });
}

export function updatePositionedObjectPosition(text: string, options: UpdatePositionedObjectPositionOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const object = findObject(document, options.selection);
    if (!object) throw new Error(`Selected ${options.selection.kind} "${options.selection.id}" no longer exists.`);
    if (options.selection.kind !== 'shape' && options.selection.kind !== 'callout' && options.selection.kind !== 'region') {
      throw new Error(`Selected ${options.selection.kind} "${options.selection.id}" does not support direct position updates.`);
    }
    object.position = [Math.round(options.position.x), Math.round(options.position.y)];
  });
}

export function updatePositionedObjectGeometry(text: string, options: UpdatePositionedObjectGeometryOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const object = findObject(document, options.selection);
    if (!object) throw new Error(`Selected ${options.selection.kind} "${options.selection.id}" no longer exists.`);
    if (options.selection.kind !== 'shape' && options.selection.kind !== 'callout' && options.selection.kind !== 'region') {
      throw new Error(`Selected ${options.selection.kind} "${options.selection.id}" does not support direct geometry updates.`);
    }
    object.position = [Math.round(options.position.x), Math.round(options.position.y)];
    object.size = [
      Math.max(1, Math.round(options.size.width)),
      Math.max(1, Math.round(options.size.height))
    ];
  });
}

export function releaseNodeFromRegion(text: string, options: ReleaseNodeFromRegionOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const regions = Array.isArray(document.graph?.regions) ? document.graph.regions : [];
    const region = regions.find((candidate: any) => String(candidate.id || '') === options.regionId);
    if (!region) throw new Error(`Region "${options.regionId}" no longer exists.`);
    if (!Array.isArray(region.members)) return;
    region.members = region.members.map(String).filter((memberId: string) => memberId !== options.nodeId);
    pruneTouchedEmptyRegions(regions, new Set([options.regionId]));
  });
}

export function updateRegionMemberPositions(text: string, options: UpdateRegionMemberPositionsOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const regions = Array.isArray(document.graph?.regions) ? document.graph.regions : [];
    const region = regions.find((candidate: any) => String(candidate.id || '') === options.regionId);
    if (!region) {
      throw new Error(`Region "${options.regionId}" no longer exists.`);
    }
    const memberNodeIds = new Set(recursiveRegionMemberNodeIds(document, options.regionId));
    if (!memberNodeIds.size && !positionOf(region.position)) throw new Error(`Region "${options.regionId}" does not contain movable nodes.`);
    if (positionOf(region.position)) region.position = translatePosition(region.position, options.delta);
    graphNodes(document).forEach((node) => {
      if (!memberNodeIds.has(String(node.id || ''))) return;
      node.position = translatePosition(node.position, options.delta);
    });
  });
}

export function deleteTopoObjects(text: string, selections: TopoObjectSelection[]): MutationResult {
  return mutateTopologyText(text, (document) => {
    const deleted = selections.reduce((sets, selection) => {
      if (selection.kind !== 'linkDirection') sets[selection.kind].add(selection.id);
      return sets;
    }, {
      callout: new Set<string>(),
      link: new Set<string>(),
      node: new Set<string>(),
      path: new Set<string>(),
      region: new Set<string>(),
      shape: new Set<string>()
    } satisfies Record<Exclude<TopoObjectKind, 'linkDirection'>, Set<string>>);

    for (const selection of selections) {
      if (selection.kind === 'linkDirection') continue;
      if (selection.kind in graphCollectionByKind) {
        const graph = ensureGraph(document);
        const collection = graphCollectionByKind[selection.kind as keyof typeof graphCollectionByKind];
        graph[collection] = (graph[collection] || []).filter((item: any) => item.id !== selection.id);
      } else {
        const diagram = ensureDiagram(document);
        const collection = diagramCollectionByKind[selection.kind as keyof typeof diagramCollectionByKind];
        diagram[collection] = (diagram[collection] || []).filter((item: any) => item.id !== selection.id);
      }
    }

    const graph = ensureGraph(document);
    const diagram = ensureDiagram(document);
    const deletedNodeIds = deleted.node;
    const deletedRegionIds = deleted.region;
    const deletedVisualAnchorIds = new Set([
      ...deleted.callout,
      ...deleted.node,
      ...deleted.region,
      ...deleted.shape
    ]);

    if (deletedNodeIds.size > 0) {
      const removedLinkIds = new Set<string>();
      graph.links = (graph.links || []).filter((link: any) => {
        const remove = deletedNodeIds.has(String(link.source)) || deletedNodeIds.has(String(link.target));
        if (remove && link.id) removedLinkIds.add(String(link.id));
        return !remove;
      });
      removedLinkIds.forEach((id) => deleted.link.add(id));

      graph.paths = (graph.paths || []).filter((path: any) => {
        if (Array.isArray(path.sequence) && path.sequence.some((nodeId: unknown) => deletedNodeIds.has(String(nodeId)))) {
          return false;
        }
        return !deletedNodeIds.has(String(path.source)) && !deletedNodeIds.has(String(path.target));
      });

      graph.regions = (graph.regions || []).map((region: any) => ({
        ...region,
        members: Array.isArray(region.members)
          ? region.members.filter((member: unknown) => !deletedNodeIds.has(String(member)))
          : region.members
      }));
    }

    if (deleted.link.size > 0) {
      graph.links = (graph.links || []).filter((link: any) => !deleted.link.has(String(link.parent)));
    }

    if (deleted.path.size > 0) {
      graph.paths = (graph.paths || []).filter((path: any) => !deleted.path.has(String(path.parent)));
    }

    if (deletedRegionIds.size > 0) {
      graph.regions = (graph.regions || []).filter((region: any) => !deletedRegionIds.has(String(region.parent))).map((region: any) => ({
        ...region,
        members: Array.isArray(region.members)
          ? region.members.filter((member: unknown) => !deletedRegionIds.has(String(member)))
          : region.members
      }));
    }

    if (deletedVisualAnchorIds.size > 0 && diagram) {
      diagram.connectors = (diagram.connectors || []).filter((connector: any) => (
        (connector.sourcePosition || !deletedVisualAnchorIds.has(String(connector.source)))
        && (connector.targetPosition || !deletedVisualAnchorIds.has(String(connector.target)))
      ));
      diagram.callouts = (diagram.callouts || []).filter((callout: any) => {
        const source = callout.source || (callout.position || callout.size ? callout.id : undefined);
        return (callout.sourcePosition || !deletedVisualAnchorIds.has(String(source)))
          && (callout.targetPosition || !deletedVisualAnchorIds.has(String(callout.target)));
      });
    }
  });
}

export function updateAttentionFocus(text: string, options: AttentionFocusOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.query = {
      [options.focusKind === 'nodeIds' || options.focusKind === 'linkIds' ? 'ids' : options.focusKind]: options.ids,
      mode: options.mode
    };
  });
}

export function updateAttentionMatcher(text: string, options: AttentionMatcherOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.query = {
      [options.matcherKind]: {
        [options.key]: options.value
      },
      mode: options.mode
    };
  });
}

export function updateAttentionInteraction(text: string, interactive: boolean, clickMode: string): MutationResult {
  return mutateTopologyText(text, (document) => {
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.interactive = interactive;
    document.attention.clickMode = clickMode;
  });
}

export function updateAttentionRegionAggregation(text: string, regionIds: string[], expandOnClick: boolean): MutationResult {
  return mutateTopologyText(text, (document) => {
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.aggregate = document.attention.aggregate && typeof document.attention.aggregate === 'object'
      ? document.attention.aggregate
      : {};
    document.attention.aggregate.groups = regionIds.map((regionId) => ({ id: `summary-${regionId}`, by: 'region', regionId }));
    document.attention.aggregate.expandOnClick = expandOnClick;
  });
}

export function setRegionAggregateExpanded(text: string, options: SetRegionAggregateExpandedOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const regionId = options.regionId.trim();
    if (!regionId) throw new Error('Region aggregate toggle requires a region id.');
    const regions = Array.isArray(document.graph?.regions) ? document.graph.regions : [];
    if (!regions.some((region: any) => String(region.id || '') === regionId)) {
      throw new Error(`Region "${regionId}" no longer exists.`);
    }

    const groupId = (options.groupId || `summary-${regionId}`).trim() || `summary-${regionId}`;
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.aggregate = document.attention.aggregate && typeof document.attention.aggregate === 'object'
      ? document.attention.aggregate
      : {};
    const aggregate = document.attention.aggregate;
    const groups = Array.isArray(aggregate.groups) ? aggregate.groups : [];
    if (!groups.some((group: any) => String(group.id || '') === groupId)) {
      groups.push({ id: groupId, by: 'region', regionId });
    }
    aggregate.groups = groups;
    aggregate.expandOnClick = aggregate.expandOnClick !== false;

    const expandedGroupIds = Array.isArray(aggregate.expandedGroupIds)
      ? aggregate.expandedGroupIds.map(String)
      : [];
    aggregate.expandedGroupIds = options.expanded
      ? [...new Set([...expandedGroupIds, groupId])]
      : expandedGroupIds.filter((id: string) => id !== groupId);
  });
}

export function updateAttentionLinkGrouping(text: string, threshold: number): MutationResult {
  return mutateTopologyText(text, (document) => {
    document.attention = document.attention && typeof document.attention === 'object' ? document.attention : {};
    document.attention.links = document.attention.links && typeof document.attention.links === 'object'
      ? document.attention.links
      : {};
    document.attention.links.grouping = { threshold };
  });
}

export function clearAttention(text: string): MutationResult {
  return mutateTopologyText(text, (document) => {
    delete document.attention;
  });
}

export function objectIdsByKind(document: TopoDocument | undefined, focusKind: AttentionFocusKind): string[] {
  if (!document) return [];
  if (focusKind === 'nodeIds') return (document.graph?.nodes || []).map((node) => node.id);
  if (focusKind === 'linkIds') return [
    ...(document.graph?.links || []).map((link) => link.id),
    ...graphLinkDirectionObjects(document).map((direction) => direction.id)
  ];
  if (focusKind === 'pathIds') return (document.graph?.paths || []).map((path) => path.id);
  return (document.graph?.regions || []).map((region) => region.id);
}

export function focusKindForSelection(kind: TopoObjectKind): AttentionFocusKind | undefined {
  if (kind === 'node') return 'nodeIds';
  if (kind === 'link' || kind === 'linkDirection') return 'linkIds';
  if (kind === 'path') return 'pathIds';
  if (kind === 'region') return 'regionIds';
  return undefined;
}
