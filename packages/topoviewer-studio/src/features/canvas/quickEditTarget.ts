import type { TopoDocument } from 'topoviewer';
import {
  authoringObjectSourcePath,
  findAuthoringObject,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { StudioSelection } from '../../contracts/project';

export interface StudioQuickEditTarget {
  fieldPath: Array<string | number>;
  label: string;
  multiline: boolean;
  richText: boolean;
  scopePath: Array<string | number>;
  selection: StudioSelection;
  value: string;
}

export function resolveStudioQuickEditTarget(
  document: TopoDocument,
  selection: StudioSelection
): StudioQuickEditTarget | undefined {
  const authoringSelection = selection as AuthoringObjectSelection;
  const object = findAuthoringObject(document, authoringSelection);
  const scopePath = authoringObjectSourcePath(document, authoringSelection);
  if (!object || !scopePath) return undefined;

  const source = object as Record<string, unknown>;
  const fieldPath = selection.kind === 'text'
    ? ['text']
    : selection.kind === 'callout'
      ? ['title']
      : selection.kind === 'linkDirection'
        ? ['label']
        : ['labels', 'name'];
  const value = fieldPath.reduce<unknown>((current, segment) => (
    current && typeof current === 'object' ? (current as Record<string, unknown>)[segment] : undefined
  ), source);

  return {
    fieldPath,
    label: selection.kind === 'linkDirection'
      ? 'direction label'
      : selection.kind === 'text'
        ? 'text'
        : selection.kind === 'callout'
          ? 'title'
          : 'visible label',
    multiline: selection.kind === 'text',
    richText: selection.kind === 'text',
    scopePath,
    selection,
    value: String(value ?? (fieldPath[0] === 'labels' ? selection.id : ''))
  };
}
