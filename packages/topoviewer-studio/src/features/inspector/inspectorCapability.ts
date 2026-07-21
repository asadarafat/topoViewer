import type { StudioCommand } from '../../contracts/commands';
import type { StudioDocumentKind, StudioSelection } from '../../contracts/project';
import { createStudioInspectorEditCommand } from '../../contracts/sourceEditCommands';
import type { StudioDocumentSession } from '../../session';

interface StudioInspectorCapabilityOptions {
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
  setSelection(selection: StudioSelection[]): void;
}

export function createStudioInspectorCapability({ execute, session, setSelection }: StudioInspectorCapabilityOptions) {
  function selectSourcePath(document: StudioDocumentKind, path: Array<string | number>) {
    const semanticId = session.semanticIdForPath(document, path);
    if (!semanticId) return false;
    const separator = semanticId.indexOf(':');
    const kind = semanticId.slice(0, separator) as StudioSelection['kind'];
    const id = semanticId.slice(separator + 1);
    if (!id) return false;
    setSelection([{ id, kind }]);
    return true;
  }

  return {
    commitInspector(path: Array<string | number>, value: unknown, scopePath: Array<string | number>) {
      const selection = session.snapshot().selection.slice(0, 1);
      return execute(
        createStudioInspectorEditCommand({
          existing: Boolean(session.sourceRange('topology', path)),
          path,
          scopePath,
          selection,
          value
        })
      );
    },
    selectSourceOffset(document: StudioDocumentKind, offset: number) {
      const path = session.sourcePathAtOffset(document, offset);
      if (!path) return undefined;
      selectSourcePath(document, path);
      return path;
    },
    selectSourcePath,
    sourcePathForSelection(selection = session.snapshot().selection[0]) {
      return selection ? session.sourcePathForSelection(selection) : undefined;
    },
    sourceRange(document: StudioDocumentKind, path: Array<string | number>) {
      return session.sourceRange(document, path);
    },
    unsetInspector(path: Array<string | number>, scopePath: Array<string | number>) {
      const selection = session.snapshot().selection[0];
      if (!session.sourceRange('topology', path)) return false;
      return execute({
        id: `unset-${path.join('-')}`,
        label: `Unset ${String(path.at(-1))}`,
        execute: () => ({
          mutations: [{ document: 'topology', kind: 'remove-value', path, scopePath }],
          selection: selection ? [selection] : undefined,
          summary: `Unset ${String(path.at(-1))}`
        })
      });
    }
  };
}
