import { applyStyle, type IconSpec, type TopoDocument } from 'topoviewer';
import { authoringObjectDisplayName, copyAuthoringSelection, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioUserPreset } from './types';

const presetCollectionVersion = 1;
const maximumPresetCount = 24;
const maximumPresetCollectionBytes = 14 * 1024;
const maximumPresetNameLength = 80;
const supportedPresetKinds = new Set<AuthoringObjectSelection['kind']>(['callout', 'link', 'node', 'region', 'shape', 'text']);
const unsafeObjectKeys = new Set(['__proto__', 'constructor', 'prototype']);

export const studioUserPresetsPreferenceKey = 'object-palette-presets';

export interface StudioUserPresetCollection {
  presets: StudioUserPreset[];
  version: typeof presetCollectionVersion;
}

export interface StudioUserPresetLoadResult {
  presets: StudioUserPreset[];
  warnings: string[];
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function byteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function containsUnsafeObjectKey(value: unknown, visited = new Set<object>()): boolean {
  if (!value || typeof value !== 'object') return false;
  if (visited.has(value)) return false;
  visited.add(value);
  if (Array.isArray(value)) return value.some((entry) => containsUnsafeObjectKey(entry, visited));
  return Object.entries(value).some(([key, entry]) => unsafeObjectKeys.has(key) || containsUnsafeObjectKey(entry, visited));
}

function normalizedName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maximumPresetNameLength);
}

function uniqueName(base: string, presets: StudioUserPreset[]): string {
  const names = new Set(presets.map((preset) => preset.name.toLocaleLowerCase()));
  if (!names.has(base.toLocaleLowerCase())) return base;
  let suffix = 2;
  while (names.has(`${base} ${suffix}`.toLocaleLowerCase())) suffix += 1;
  return `${base} ${suffix}`;
}

function nextPresetId(presets: StudioUserPreset[]): string {
  const existing = new Set(presets.map((preset) => preset.id));
  let index = 1;
  while (existing.has(`preset-${index}`)) index += 1;
  return `preset-${index}`;
}

function reusableSourceId(value: Record<string, unknown>, kind: AuthoringObjectSelection['kind']): string {
  const source = String(value.name || value.title || value.text || kind)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 72);
  return source || kind;
}

function materializedIcon(document: TopoDocument, presetId: string, value: Record<string, unknown>, style: Record<string, unknown>): Record<string, IconSpec> | undefined {
  const data = record(value.data);
  const sourceKey = String(style.icon || value.icon || data?.icon || '').trim();
  const definition = sourceKey ? document.icons?.[sourceKey] : undefined;
  if (!definition) return undefined;
  const key = `studio-${presetId}-icon`;
  style.icon = key;
  delete value.icon;
  return { [key]: structuredClone(definition) };
}

function materializeLinkDirectionStyles(document: TopoDocument, linkId: string, value: Record<string, unknown>) {
  const directions = record(value.directions);
  for (const [directionKey, directionValue] of Object.entries(directions || {})) {
    const direction = record(directionValue);
    if (!direction) continue;
    const id = String(direction.id || `${linkId}:${directionKey}`);
    const effectiveStyle = applyStyle(
      'linkDirection',
      {
        ...direction,
        data: { ...record(direction.data), direction: directionKey, linkId },
        id
      } as Parameters<typeof applyStyle>[1],
      document
    ) as Record<string, unknown>;
    if (Object.keys(effectiveStyle).length > 0) direction.style = effectiveStyle;
  }
}

function normalizePresetItem(document: TopoDocument, presetId: string, selection: AuthoringObjectSelection): Pick<StudioUserPreset, 'icons' | 'item'> | undefined {
  const copied = copyAuthoringSelection(document, [selection])[0];
  if (!copied) return undefined;
  const value = structuredClone(copied.value) as Record<string, unknown>;
  const effectiveStyle = applyStyle(selection.kind, { ...value, id: selection.id } as Parameters<typeof applyStyle>[1], document) as Record<string, unknown>;
  const icons = materializedIcon(document, presetId, value, effectiveStyle);
  if (selection.kind === 'link') materializeLinkDirectionStyles(document, selection.id, value);

  delete value.id;
  delete value.parent;
  if (selection.kind === 'link') {
    delete value.source;
    delete value.sourceHandle;
    delete value.target;
    delete value.targetHandle;
    const directions = record(value.directions);
    for (const direction of Object.values(directions || {})) {
      const directionRecord = record(direction);
      if (directionRecord) delete directionRecord.id;
    }
    delete value.position;
  } else {
    value.position = [0, 0];
  }
  if (Object.keys(effectiveStyle).length > 0) value.style = effectiveStyle;
  else delete value.style;

  if (selection.kind === 'region') value.members = [];
  if (selection.kind === 'callout') {
    delete value.source;
    delete value.sourcePin;
    delete value.sourcePosition;
    delete value.target;
    delete value.targetPin;
    delete value.targetPosition;
  }

  return {
    icons,
    item: {
      selection: {
        id: reusableSourceId(value, selection.kind),
        kind: selection.kind
      },
      value
    }
  };
}

function validIconMap(value: unknown): value is Record<string, IconSpec> {
  const icons = record(value);
  return icons !== undefined && Object.entries(icons).every(([key, definition]) => Boolean(key.trim()) && record(definition) !== undefined);
}

function validPreset(value: unknown): value is StudioUserPreset {
  const preset = record(value);
  const item = record(preset?.item);
  const selection = record(item?.selection);
  const object = record(item?.value);
  const kind = selection?.kind;
  return Boolean(
    preset &&
    typeof preset.id === 'string' &&
    /^preset-\d+$/.test(preset.id) &&
    typeof preset.name === 'string' &&
    normalizedName(preset.name) === preset.name &&
    item &&
    selection &&
    typeof selection.id === 'string' &&
    selection.id.length > 0 &&
    typeof kind === 'string' &&
    supportedPresetKinds.has(kind as AuthoringObjectSelection['kind']) &&
    object &&
    (!Object.hasOwn(preset, 'icons') || preset.icons === undefined || validIconMap(preset.icons)) &&
    !containsUnsafeObjectKey(preset)
  );
}

export function canSaveSelectionAsPreset(selection: AuthoringObjectSelection[]): boolean {
  return selection.length === 1 && supportedPresetKinds.has(selection[0].kind);
}

export function createStudioUserPreset(document: TopoDocument, selection: AuthoringObjectSelection[], existing: StudioUserPreset[]): StudioUserPreset | undefined {
  if (!canSaveSelectionAsPreset(selection)) return undefined;
  const id = nextPresetId(existing);
  const normalized = normalizePresetItem(document, id, selection[0]);
  if (!normalized) return undefined;
  const displayName = normalizedName(authoringObjectDisplayName(document, selection[0]) || selection[0].kind);
  return {
    id,
    ...normalized,
    name: uniqueName(`${displayName} preset`, existing)
  };
}

export function studioUserPresetCollection(presets: StudioUserPreset[]): StudioUserPresetCollection {
  if (presets.length > maximumPresetCount) {
    throw new Error(`The Object Palette supports up to ${maximumPresetCount} saved objects.`);
  }
  const collection: StudioUserPresetCollection = {
    presets: structuredClone(presets),
    version: presetCollectionVersion
  };
  if (byteLength(collection) > maximumPresetCollectionBytes) {
    throw new Error('Saved Object Palette items exceed the supported 14 KiB storage budget.');
  }
  return collection;
}

export function loadStudioUserPresets(value: unknown): StudioUserPresetLoadResult {
  if (value === undefined) return { presets: [], warnings: [] };
  const collection = record(value);
  if (collection?.version !== presetCollectionVersion || !Array.isArray(collection.presets)) {
    return {
      presets: [],
      warnings: ['Saved Object Palette items use an unsupported format and were ignored.']
    };
  }

  const presets: StudioUserPreset[] = [];
  let rejected = 0;
  for (const value of collection.presets.slice(0, maximumPresetCount)) {
    if (!validPreset(value) || presets.some((preset) => preset.id === value.id || preset.name.toLocaleLowerCase() === value.name.toLocaleLowerCase())) {
      rejected += 1;
      continue;
    }
    const candidate = [...presets, structuredClone(value)];
    try {
      studioUserPresetCollection(candidate);
      presets.push(structuredClone(value));
    } catch {
      rejected += 1;
      break;
    }
  }
  rejected += Math.max(0, collection.presets.length - maximumPresetCount);
  return {
    presets,
    warnings: rejected > 0 ? [`${rejected} invalid or oversized Object Palette item${rejected === 1 ? '' : 's'} were ignored.`] : []
  };
}

export function renamedStudioUserPreset(presets: StudioUserPreset[], id: string, requestedName: string): StudioUserPreset[] {
  const name = normalizedName(requestedName);
  if (!name) throw new Error('Object Palette item name cannot be empty.');
  if (presets.some((preset) => preset.id !== id && preset.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
    throw new Error(`An Object Palette item named "${name}" already exists.`);
  }
  if (!presets.some((preset) => preset.id === id)) throw new Error(`Object Palette item "${id}" does not exist.`);
  return presets.map((preset) => (preset.id === id ? { ...preset, name } : preset));
}
