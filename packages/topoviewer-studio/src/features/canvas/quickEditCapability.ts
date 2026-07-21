import type { StudioCommand } from '../../contracts/commands';
import type { StudioSelection } from '../../contracts/project';
import type { StudioDocumentSession } from '../../session';
import { resolveStudioQuickEditTarget } from './quickEditTarget';

interface StudioQuickEditCapabilityOptions {
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
}

export function createStudioQuickEditCapability({ execute, session }: StudioQuickEditCapabilityOptions) {
  return {
    commitObjectText(selection: StudioSelection, value: string) {
      const target = resolveStudioQuickEditTarget(session.snapshot().projection.document, selection);
      if (!target) return false;
      if (value === target.value) return true;
      const path = [...target.scopePath, ...target.fieldPath];
      const existing = session.sourceRange('topology', path);
      return execute({
        coalescingKey: `${selection.kind}:${selection.id}:quick-text`,
        id: `quick-text-${selection.kind}-${selection.id}`,
        label: `Edit ${target.label}`,
        execute: () => ({
          mutations: [
            existing
              ? { document: 'topology', kind: 'set-value', path, value }
              : {
                  document: 'topology',
                  kind: 'upsert-value',
                  path,
                  scopePath: target.scopePath,
                  value
                }
          ],
          selection: [selection],
          summary: `Edited ${target.label}`
        })
      });
    }
  };
}
