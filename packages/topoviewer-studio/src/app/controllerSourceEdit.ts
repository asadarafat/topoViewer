import type { StudioCommand, StudioSourceMutation } from '../contracts/commands';
import type { StudioDocumentKind, StudioSelection } from '../contracts/project';

interface StudioSourceValueEditOptions {
  existing: boolean;
  path: Array<string | number>;
  scopePath: Array<string | number>;
  selection: StudioSelection[];
  value: unknown;
}

function sourceValueEditCommand(
  options: StudioSourceValueEditOptions & {
    coalescingKey?: string;
    document: StudioDocumentKind;
    idPrefix: string;
  }
): StudioCommand {
  const field = String(options.path.at(-1));
  const mutation: StudioSourceMutation = options.existing
    ? { document: options.document, kind: 'set-value', path: options.path, value: options.value }
    : {
        document: options.document,
        kind: 'upsert-value',
        path: options.path,
        scopePath: options.scopePath,
        value: options.value
      };
  return {
    coalescingKey: options.coalescingKey,
    id: `${options.idPrefix}-${options.path.join('-')}`,
    label: `Edit ${field}`,
    execute: () => ({ mutations: [mutation], selection: options.selection, summary: `Edit ${field}` })
  };
}

export function createStudioInspectorEditCommand(options: StudioSourceValueEditOptions): StudioCommand {
  const selection = options.selection[0];
  return sourceValueEditCommand({
    ...options,
    coalescingKey: selection ? `${selection.kind}:${selection.id}:${options.path.join('.')}` : undefined,
    document: 'topology',
    idPrefix: 'inspect'
  });
}

export function createStudioViewportEditCommand(options: StudioSourceValueEditOptions): StudioCommand {
  return sourceValueEditCommand({
    ...options,
    coalescingKey: `viewport:${options.path.join('.')}`,
    document: 'stylesheet',
    idPrefix: 'viewport'
  });
}
