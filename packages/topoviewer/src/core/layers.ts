import type { LayerDefinition } from './types';

type LayerLike = Pick<LayerDefinition, 'id'>;

export function layerIds(layers: readonly LayerLike[] | undefined): string[] {
  return (layers || []).map((layer) => layer.id).filter(Boolean);
}

export function filterKnownLayerIds(layers: readonly LayerLike[] | undefined, selectedLayerIds: readonly string[]): string[] {
  const availableLayerIds = new Set(layerIds(layers));
  return [...new Set(selectedLayerIds)].filter((layerId) => availableLayerIds.has(layerId));
}

export function selectedLayerIdsOrAll(layers: readonly LayerLike[] | undefined, selectedLayerIds: readonly string[] | undefined): string[] {
  if (!selectedLayerIds) return layerIds(layers);
  return filterKnownLayerIds(layers, selectedLayerIds);
}

export function reconcileSelectedLayerIds(layers: readonly LayerLike[] | undefined, previousLayerIds: readonly string[]): string[] {
  const kept = filterKnownLayerIds(layers, previousLayerIds);
  return kept.length ? kept : layerIds(layers);
}

export function toggleSelectedLayerId(currentLayerIds: readonly string[], layerId: string, enabled: boolean): string[] {
  return enabled
    ? [...new Set([...currentLayerIds, layerId])]
    : currentLayerIds.filter((item) => item !== layerId);
}
