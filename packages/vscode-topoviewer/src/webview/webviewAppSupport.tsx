import { useEffect, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { reconcileSelectedLayerIds } from 'topoviewer/integration';
import { parseTopologyText, type AttentionFocusKind, type InsertObjectType, type TopoObjectPreset, type TopoObjectSelection } from '../shared/topologyMutations';
import { safeGetJson, safeGetString, safeSetJson, safeSetString } from './browserStorage';

export type HarnessMode = 'build' | 'inspect' | 'yaml' | 'attention' | 'layers';

interface HarnessTabPanelProps {
  children?: ReactNode;
  className?: string;
  index: number;
  value: number;
}

export interface DocumentTransaction {
  label: string;
  previousMapperText?: string;
  previousStylesheetText: string;
  previousTopologyText: string;
  nextMapperText?: string;
  nextStylesheetText: string;
  nextTopologyText: string;
}

export const splitStorageKey = 'topoviewer.vscodeHarness.splitPercent.v2';
export const presetStorageKey = 'topoviewer.vscodeHarness.presets.v1';
export const defaultSplitPercent = 33.333;
export const minSplitPercent = 24;
export const maxSplitPercent = 55;
export const harnessModes: HarnessMode[] = ['build', 'inspect', 'yaml', 'attention', 'layers'];

const relationshipObjects: Array<{ type: InsertObjectType; label: string }> = [
  { type: 'link', label: 'Connection' },
  { type: 'path', label: 'Path' }
];

type InsertPaletteItem =
  | { kind: 'insert'; label: string; type: InsertObjectType }
  | { kind: 'preset'; label: string; preset: TopoObjectPreset };

export const baseInsertObjectGroups: Array<{
  description: string;
  objects: InsertPaletteItem[];
  title: string;
}> = [
  {
    title: 'Structured relationships',
    description: 'Exact source, transit, and target forms',
    objects: relationshipObjects.map((object) => ({ kind: 'insert' as const, ...object }))
  }
];

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function initialSplitPercent() {
  const raw = safeGetString(splitStorageKey, '');
  if (!raw) return defaultSplitPercent;
  const stored = Number(raw);
  return Number.isFinite(stored) ? clamp(stored, minSplitPercent, maxSplitPercent) : defaultSplitPercent;
}

export function initialSavedPresets(): TopoObjectPreset[] {
  return safeGetJson<unknown[]>(presetStorageKey, [])
    .filter((preset): preset is TopoObjectPreset => Boolean(
      preset
      && typeof preset === 'object'
      && 'id' in preset
      && 'name' in preset
      && 'kind' in preset
    ));
}

export function useHarnessPreferencePersistence(splitPercent: number, savedPresets: TopoObjectPreset[]) {
  useEffect(() => {
    safeSetString(splitStorageKey, String(splitPercent));
  }, [splitPercent]);

  useEffect(() => {
    safeSetJson(presetStorageKey, savedPresets);
  }, [savedPresets]);
}

export function mergeLayerSelection(previous: string[], layers: Array<{ id: string }>) {
  return reconcileSelectedLayerIds(layers, previous);
}

export function layerSelectionFromTopologyText(topologyText: string | undefined): Array<{ id: string }> {
  if (!topologyText) return [];
  try {
    const document = parseTopologyText(topologyText);
    const layers = Array.isArray(document.graph?.layers) ? document.graph.layers : [];
    return layers
      .map((layer: { id?: unknown }) => String(layer?.id || ''))
      .filter((id: string) => Boolean(id))
      .map((id: string) => ({ id }));
  } catch {
    return [];
  }
}

export function modeLabel(mode: HarnessMode) {
  if (mode === 'build') return 'Build';
  if (mode === 'yaml') return 'YAML';
  if (mode === 'inspect') return 'Inspect';
  if (mode === 'attention') return 'Attention';
  return 'Layers';
}

export function modeIndex(mode: HarnessMode) {
  return harnessModes.indexOf(mode);
}

function tabId(index: number) {
  return `topoviewer-authoring-tab-${index}`;
}

function tabPanelId(index: number) {
  return `topoviewer-authoring-tabpanel-${index}`;
}

export function a11yProps(index: number) {
  return {
    id: tabId(index),
    'aria-controls': tabPanelId(index)
  };
}

export function HarnessTabPanel({ children, value, index, className }: HarnessTabPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={tabPanelId(index)}
      aria-labelledby={tabId(index)}
      className={className}
    >
      {children}
    </Box>
  );
}

export function selectionSummary(selection: TopoObjectSelection[]) {
  if (!selection.length) return 'No selection';
  const kinds = [...new Set(selection.map((object) => object.kind))];
  return `${selection.length} ${kinds.length === 1 ? kinds[0] : 'objects'} selected`;
}

export function selectedObjectIds(selection: TopoObjectSelection[]) {
  return selection.map((object) => object.id);
}

function cloneRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneUnknown(value: unknown): unknown {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function presetFromObject(selection: TopoObjectSelection, object: any, presetName: string): TopoObjectPreset {
  return {
    id: `preset-${Date.now()}`,
    name: presetName || object?.labels?.name || selection.id,
    kind: selection.kind,
    ...(object?.labels ? { labels: cloneRecord(object.labels) } : {}),
    ...(object?.data ? { data: cloneRecord(object.data) } : {}),
    ...(object?.type ? { type: String(object.type) } : {}),
    ...(object?.title ? { title: String(object.title) } : {}),
    ...(object?.body !== undefined ? { body: cloneUnknown(object.body) } : {})
  };
}

export function focusKindLabel(focusKind: AttentionFocusKind) {
  if (focusKind === 'nodeIds') return 'Nodes';
  if (focusKind === 'linkIds') return 'Links';
  if (focusKind === 'pathIds') return 'Paths';
  return 'Regions';
}

export function selectedNodeIds(selection: TopoObjectSelection[]) {
  return selection.filter((object) => object.kind === 'node').map((object) => object.id);
}

export function positionOf(value: unknown): { x: number; y: number } | undefined {
  if (Array.isArray(value)) return { x: Number(value[0] || 0), y: Number(value[1] || 0) };
  if (value && typeof value === 'object') {
    const position = value as { x?: number; y?: number };
    return { x: Number(position.x || 0), y: Number(position.y || 0) };
  }
  return undefined;
}

export function sizeOf(value: unknown): { width: number; height: number } | undefined {
  if (Array.isArray(value)) return { width: Number(value[0] || 0), height: Number(value[1] || 0) };
  if (value && typeof value === 'object') {
    const size = value as { width?: number; height?: number };
    return { width: Number(size.width || 0), height: Number(size.height || 0) };
  }
  return undefined;
}

export function pathSequenceFromObject(path: any): string[] {
  if (Array.isArray(path?.sequence)) return path.sequence.map(String);
  return [path?.source, path?.target].map((id) => String(id || '')).filter(Boolean);
}

export function sequenceFromControls(source: string, transitIds: string[], target: string) {
  const transit = transitIds.filter((id, index) => id && id !== source && id !== target && transitIds.indexOf(id) === index);
  return [source, ...transit, target].filter(Boolean);
}

export function sameRoundedPosition(a: { x: number; y: number } | undefined, b: { x: number; y: number }) {
  return !!a && Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);
}

export function sameRoundedSize(a: { width: number; height: number } | undefined, b: { width: number; height: number }) {
  return !!a && Math.round(a.width) === Math.round(b.width) && Math.round(a.height) === Math.round(b.height);
}

export function editorDocumentForTab(tab: number): 'topology' | 'stylesheet' | 'mapper' {
  if (tab === 0) return 'topology';
  if (tab === 1) return 'stylesheet';
  return 'mapper';
}

export function clampLine(line: number | undefined, maxLine: number) {
  if (!line || !Number.isFinite(line)) return 1;
  return Math.min(maxLine, Math.max(1, Math.round(line)));
}
