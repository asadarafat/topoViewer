import yaml from 'js-yaml';
import type { TopoDocument } from 'topoviewer';

export type TopoObjectKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'callout' | 'shape';
export type InsertObjectType = 'node' | 'router' | 'service' | 'controller' | 'external' | 'link' | 'path' | 'region' | 'callout' | 'alert';
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
  selectedLayerIds: string[];
  source: string;
  target: string;
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

function allObjectIds(document: Record<string, any>): Set<string> {
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  return new Set([
    ...(graph.nodes || []),
    ...(graph.links || []),
    ...(graph.paths || []),
    ...(graph.regions || []),
    ...(diagram.shapes || []),
    ...(diagram.callouts || [])
  ].map((item: any) => String(item.id || '')).filter(Boolean));
}

function nextId(document: Record<string, any>, prefix: string): string {
  const ids = allObjectIds(document);
  let index = 1;
  while (ids.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
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
  if (selectedLayerIds.length === 1) return selectedLayerIds[0];
  const layers = document?.graph?.layers || [];
  return layers[0]?.id || 'default';
}

function layoutCenter(document: Record<string, any>): [number, number] {
  const layout = document.layout || {};
  return [Number(layout.width || 900) / 2, Number(layout.height || 520) / 2];
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

function graphLinkDirectionObjects(document: Record<string, any> | TopoDocument | undefined): any[] {
  return ((document?.graph?.links || []) as any[]).flatMap((link) => Object.entries(link.directions || {}).flatMap(([direction, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    return [{
      ...(value as Record<string, unknown>),
      id: (value as Record<string, unknown>).id || `${link.id}:${direction}`,
      direction,
      linkId: link.id,
      parentLinkId: link.id
    }];
  }));
}

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

function normalizedPathSequence(sequence: string[]): string[] {
  const normalized = sequence.map((id) => id.trim()).filter(Boolean);
  if (normalized.length < 2) throw new Error('Path requires at least source and target nodes.');
  if (normalized[0] === normalized[normalized.length - 1]) {
    throw new Error('Path source and target must be different.');
  }
  return normalized;
}

export function findObject(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection | undefined): any | undefined {
  if (!document || !selection) return undefined;
  if (selection.kind === 'linkDirection') {
    return graphLinkDirectionObjects(document).find((item) => item.id === selection.id);
  }
  if (selection.kind in graphCollectionByKind) {
    const collection = graphCollectionByKind[selection.kind as keyof typeof graphCollectionByKind];
    return (document.graph?.[collection] || []).find((item: any) => item.id === selection.id);
  }
  const collection = diagramCollectionByKind[selection.kind as keyof typeof diagramCollectionByKind];
  return (document.diagram?.[collection] || []).find((item: any) => item.id === selection.id);
}

export function objectExists(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection): boolean {
  return !!findObject(document, selection);
}

export function objectDisplayName(document: Record<string, any> | TopoDocument | undefined, selection: TopoObjectSelection | undefined): string {
  const object = findObject(document, selection);
  if (!selection) return 'No selection';
  return object?.name || object?.label || selection.id;
}

export function resolveSelectionFromObject(document: TopoDocument | undefined, sourceId: string): TopoObjectSelection | undefined {
  if (!document || !sourceId) return undefined;
  if ((document.graph?.nodes || []).some((node) => node.id === sourceId)) return { kind: 'node', id: sourceId };
  if ((document.graph?.links || []).some((link) => link.id === sourceId)) return { kind: 'link', id: sourceId };
  if (graphLinkDirectionObjects(document).some((direction) => direction.id === sourceId)) return { kind: 'linkDirection', id: sourceId };
  if ((document.graph?.paths || []).some((path) => path.id === sourceId)) return { kind: 'path', id: sourceId };
  if ((document.graph?.regions || []).some((region) => region.id === sourceId)) return { kind: 'region', id: sourceId };
  if ((document.diagram?.callouts || []).some((callout) => callout.id === sourceId)) return { kind: 'callout', id: sourceId };
  if ((document.diagram?.shapes || []).some((shape) => shape.id === sourceId)) return { kind: 'shape', id: sourceId };
  return undefined;
}

export function selectionKey(selection: TopoObjectSelection): string {
  return `${selection.kind}:${selection.id}`;
}

export function sameSelection(a: TopoObjectSelection, b: TopoObjectSelection): boolean {
  return a.kind === b.kind && a.id === b.id;
}

export function insertTopoObject(text: string, options: InsertObjectOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const graph = ensureGraph(document);
    const diagram = ensureDiagram(document);
    const layerId = defaultLayerId(document, options.selectedLayerIds);
    const [cx, cy] = layoutCenter(document);
    const nodes = ensureArray(graph, 'nodes');
    const links = ensureArray(graph, 'links');
    const paths = ensureArray(graph, 'paths');
    const regions = ensureArray(graph, 'regions');
    const callouts = ensureArray(diagram, 'callouts');

    if (options.type === 'node' || options.type === 'router' || options.type === 'controller' || options.type === 'external' || options.type === 'service') {
      const id = nextId(document, options.type === 'service' ? 'service' : options.type);
      const roleByType: Record<string, string> = {
        node: 'node',
        router: 'router',
        controller: 'controller',
        external: 'external',
        service: 'service'
      };
      nodes.push({
        id,
        name: options.type === 'node' ? 'New Node' : options.type === 'service' ? 'New Service' : `New ${capitalize(options.type)}`,
        labels: { role: roleByType[options.type] },
        layers: [layerId],
        position: [Math.round(cx), Math.round(cy)]
      });
      return;
    }

    if (options.type === 'alert') {
      const target = selectedNodeIdsOrFallback(document, options.selectedObjects, 1)[0];
      const id = nextId(document, 'alert');
      nodes.push({
        id,
        name: 'Alert',
        labels: { role: 'ops' },
        data: { severity: 'major', status: 'investigating' },
        layers: [layerId],
        position: [Math.round(cx + 180), Math.round(cy - 120)]
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
      const members = selectedNodeIdsOrFallback(document, options.selectedObjects, 2);
      if (!members.length) throw new Error('Insert Region requires at least one node.');
      regions.push({
        id: nextId(document, 'region'),
        name: 'New Region',
        labels: { scope: layerId },
        members,
        layers: [layerId],
        paddingX: 34,
        paddingY: 28,
        headerPadding: 34
      });
      return;
    }

    if (options.type === 'callout') {
      const target = options.selectedObjects[0]?.kind === 'node' ? options.selectedObjects[0].id : undefined;
      callouts.push({
        id: nextId(document, 'callout'),
        title: 'New Callout',
        body: 'Add context',
        ...(target ? { target } : { position: [Math.round(cx + 120), Math.round(cy - 80)] }),
        size: [160, 88],
        layers: [layerId]
      });
    }
  });
}

export function insertTopoPreset(text: string, options: InsertPresetOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const graph = ensureGraph(document);
    const diagram = ensureDiagram(document);
    const layerId = defaultLayerId(document, options.selectedLayerIds);
    const [cx, cy] = layoutCenter(document);
    const nodes = ensureArray(graph, 'nodes');
    const links = ensureArray(graph, 'links');
    const paths = ensureArray(graph, 'paths');
    const regions = ensureArray(graph, 'regions');
    const shapes = ensureArray(diagram, 'shapes');
    const callouts = ensureArray(diagram, 'callouts');
    const preset = options.preset;
    const id = nextId(document, presetPrefix(preset));
    const fields = presetFields(preset);

    if (preset.kind === 'node') {
      nodes.push({
        id,
        ...fields,
        layers: [layerId],
        position: [Math.round(cx), Math.round(cy)]
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
      const members = selectedNodeIdsOrFallback(document, options.selectedObjects, 2);
      if (!members.length) throw new Error('Insert region preset requires at least one node.');
      regions.push({
        id,
        ...fields,
        members,
        layers: [layerId]
      });
      return;
    }

    if (preset.kind === 'shape') {
      shapes.push({
        id,
        ...fields,
        ...(preset.type ? { type: preset.type } : {}),
        layers: [layerId],
        position: [Math.round(cx), Math.round(cy)]
      });
      return;
    }

    if (preset.kind === 'callout') {
      const target = options.selectedObjects[0]?.kind === 'node' ? options.selectedObjects[0].id : undefined;
      callouts.push({
        id,
        ...fields,
        ...(preset.title ? { title: preset.title } : {}),
        ...(preset.body !== undefined ? { body: cloneUnknown(preset.body) } : {}),
        ...(target ? { target } : { position: [Math.round(cx + 120), Math.round(cy - 80)] }),
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
    if (options.position && (options.selection.kind === 'node' || options.selection.kind === 'shape' || options.selection.kind === 'callout')) {
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

    if (options.id && !existing) throw new Error(`Link "${options.id}" no longer exists.`);
    if (existing) {
      existing.source = options.source;
      existing.target = options.target;
      if (options.name !== undefined) existing.name = options.name;
      return;
    }

    links.push({
      id: nextId(document, 'link'),
      name: options.name || 'New Link',
      source: options.source,
      target: options.target,
      labels: { layer: layerId },
      layers: [layerId]
    });
  });
}

export function upsertGraphPath(text: string, options: UpsertGraphPathOptions): MutationResult {
  return mutateTopologyText(text, (document) => {
    const sequence = normalizedPathSequence(options.sequence);
    requireGraphNodeIds(document, sequence);

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

export function deleteTopoObjects(text: string, selections: TopoObjectSelection[]): MutationResult {
  return mutateTopologyText(text, (document) => {
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

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
