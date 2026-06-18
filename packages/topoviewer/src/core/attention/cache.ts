import type { AttentionGraphInput, AttentionGraphIndex, AttentionPresentationResult, FocusQuery } from './types';
import { buildAttentionIndex } from './index';
import { resolveFocusQuery } from './focus';
import { deriveAttentionPresentation, scoreAttention } from './scoring';
import type { TopoDocument } from '../types';

const MAX_CACHE_ENTRIES = 32;

export interface AttentionRuntimeState {
  query?: FocusQuery;
  presentation?: AttentionPresentationResult;
}

function graphFromInput(input: AttentionGraphInput) {
  if ('graph' in input || 'diagram' in input || 'toggles' in input || 'layout' in input || 'limits' in input || 'version' in input) {
    return (input as TopoDocument).graph || {};
  }
  return input;
}

function stableStringify(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`;
}

function setBounded<K, V>(cache: Map<K, V>, key: K, value: V) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

const indexCache = new Map<string, AttentionGraphIndex>();
const presentationCache = new Map<string, AttentionPresentationResult>();

export function attentionSourceKey(input: AttentionGraphInput): string {
  return stableStringify(graphFromInput(input));
}

export function attentionStateKey(query: FocusQuery | undefined): string {
  return stableStringify(query || null);
}

export function buildAttentionIndexCached(input: AttentionGraphInput): AttentionGraphIndex {
  const sourceKey = attentionSourceKey(input);
  const current = indexCache.get(sourceKey);
  if (current) return current;
  const index = buildAttentionIndex(input);
  setBounded(indexCache, sourceKey, index);
  return index;
}

export function resolveAttentionPresentationCached(
  document: TopoDocument,
  attention: AttentionRuntimeState | undefined
): AttentionPresentationResult | undefined {
  if (!attention) return undefined;
  if (attention.presentation) return attention.presentation;
  if (!attention.query) return undefined;

  const sourceKey = attentionSourceKey(document);
  const stateKey = attentionStateKey(attention.query);
  const cacheKey = `${sourceKey}\n${stateKey}`;
  const current = presentationCache.get(cacheKey);
  if (current) return current;

  const index = buildAttentionIndexCached(document);
  const focus = resolveFocusQuery(index, attention.query);
  const scores = scoreAttention(index, focus);
  const presentation = deriveAttentionPresentation(index, focus, scores);
  setBounded(presentationCache, cacheKey, presentation);
  return presentation;
}
