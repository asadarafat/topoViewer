import type { LayerDefinition, TopoDocument } from './types';
import type {
  AuthoringEditPlan,
  AuthoringObjectKind,
  AuthoringObjectSelection,
  AuthoringRemoval,
  AuthoringValueUpdate
} from './authoringGraph';

interface LayeredEntry {
  kind?: AuthoringObjectKind;
  id: string;
  layers: string[];
  path: Array<string | number>;
  scopePath: Array<string | number>;
}

function slug(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'layer';
}

function layers(document: TopoDocument): LayerDefinition[] {
  return document.graph?.layers || [];
}

function nextLayerId(document: TopoDocument, name: string): string {
  const base = slug(name);
  const existing = new Set(layers(document).map((layer) => layer.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function createAuthoringLayer(document: TopoDocument, name = 'New Layer'): LayerDefinition {
  const id = nextLayerId(document, name);
  return name === id ? { id } : { id, labels: { name } };
}

function layeredEntries(document: TopoDocument): LayeredEntry[] {
  const graphCollections: Array<[AuthoringObjectKind, string, Array<{ id: string; layers?: string[] }>]> = [
    ['node', 'nodes', document.graph?.nodes || []],
    ['link', 'links', document.graph?.links || []],
    ['path', 'paths', document.graph?.paths || []],
    ['region', 'regions', document.graph?.regions || []]
  ];
  const diagramCollections: Array<[AuthoringObjectKind | undefined, string, Array<{ id: string; layers?: string[] }>]> = [
    ['shape', 'shapes', document.diagram?.shapes || []],
    ['callout', 'callouts', document.diagram?.callouts || []],
    ['text', 'texts', document.diagram?.texts || []],
    [undefined, 'connectors', document.diagram?.connectors || []]
  ];
  return [
    ...graphCollections.flatMap(([kind, collection, values]) => values.map((value, index) => ({
      id: value.id,
      kind,
      layers: value.layers || [],
      path: ['graph', collection, index, 'layers'],
      scopePath: ['graph', collection, index]
    }))),
    ...diagramCollections.flatMap(([kind, collection, values]) => values.map((value, index) => ({
      id: value.id,
      ...(kind ? { kind } : {}),
      layers: value.layers || [],
      path: ['diagram', collection, index, 'layers'],
      scopePath: ['diagram', collection, index]
    })))
  ];
}

export function authoringLayerReferences(document: TopoDocument, layerId: string): AuthoringObjectSelection[] {
  return layeredEntries(document).flatMap((entry) => entry.kind && entry.layers.includes(layerId)
    ? [{ id: entry.id, kind: entry.kind }]
    : []);
}

function layerIndex(document: TopoDocument, layerId: string): number {
  const index = layers(document).findIndex((layer) => layer.id === layerId);
  if (index < 0) throw new Error(`Layer "${layerId}" does not exist.`);
  return index;
}

export function planAuthoringLayerRename(document: TopoDocument, layerId: string, name: string): AuthoringEditPlan {
  const index = layerIndex(document, layerId);
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Layer name cannot be empty.');
  return {
    insertions: [], removals: [], updates: [{
      path: ['graph', 'layers', index, 'labels', 'name'],
      scopePath: ['graph', 'layers', index],
      value: normalizedName
    }]
  };
}

export function planAuthoringLayerReorder(document: TopoDocument, layerId: string, targetIndex: number): AuthoringEditPlan {
  const currentIndex = layerIndex(document, layerId);
  const nextLayers = structuredClone(layers(document));
  const [moved] = nextLayers.splice(currentIndex, 1);
  nextLayers.splice(Math.max(0, Math.min(nextLayers.length, Math.round(targetIndex))), 0, moved);
  return {
    insertions: [], removals: [], updates: [{
      path: ['graph', 'layers'], scopePath: ['graph'], value: nextLayers
    }]
  };
}

export function planAuthoringLayerMembership(
  document: TopoDocument,
  selections: AuthoringObjectSelection[],
  layerId: string,
  assigned: boolean
): AuthoringEditPlan {
  layerIndex(document, layerId);
  const selected = new Set(selections.map((selection) => `${selection.kind}:${selection.id}`));
  const updates = layeredEntries(document).flatMap((entry): AuthoringValueUpdate[] => {
    if (!entry.kind || !selected.has(`${entry.kind}:${entry.id}`)) return [];
    const nextLayers = assigned
      ? [...new Set([...entry.layers, layerId])]
      : entry.layers.filter((id) => id !== layerId);
    if (!nextLayers.length) throw new Error(`Object "${entry.id}" must remain assigned to at least one layer.`);
    if (nextLayers.length === entry.layers.length && nextLayers.every((id, index) => id === entry.layers[index])) return [];
    return [{ path: entry.path, scopePath: entry.scopePath, value: nextLayers }];
  });
  if (!updates.length && selections.length) throw new Error('The selected objects do not support layer membership.');
  return { insertions: [], removals: [], updates };
}

export function planAuthoringLayerDeletion(
  document: TopoDocument,
  layerId: string,
  replacementLayerId?: string
): AuthoringEditPlan {
  const index = layerIndex(document, layerId);
  if (layers(document).length <= 1) throw new Error('The final topology layer cannot be deleted.');
  if (replacementLayerId) {
    if (replacementLayerId === layerId) throw new Error('Replacement layer must differ from the deleted layer.');
    layerIndex(document, replacementLayerId);
  }
  const references = layeredEntries(document).filter((entry) => entry.layers.includes(layerId));
  if (references.length && !replacementLayerId) {
    throw new Error(`Layer "${layerId}" is referenced by ${references.length} object${references.length === 1 ? '' : 's'}.`);
  }
  const updates = references.map((entry): AuthoringValueUpdate => ({
    path: entry.path,
    scopePath: entry.scopePath,
    value: [...new Set(entry.layers.flatMap((id) => id === layerId ? [replacementLayerId!] : [id]))]
  }));
  const removal: AuthoringRemoval = {
    path: ['graph', 'layers', index],
    scopePath: ['graph', 'layers'],
    selection: { id: layerId, kind: 'layer' }
  };
  return { insertions: [], removals: [removal], updates };
}
