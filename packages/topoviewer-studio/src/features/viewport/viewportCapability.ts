import type { StudioCommand } from '../../contracts/commands';
import { createStudioViewportEditCommand } from '../../contracts/sourceEditCommands';
import type { StudioDocumentSession } from '../../session';

interface StudioViewportCapabilityOptions {
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
}

export function createStudioViewportCapability({ execute, session }: StudioViewportCapabilityOptions) {
  return {
    commitViewport(path: Array<string | number>, value: unknown, scopePath: Array<string | number>) {
      return execute(
        createStudioViewportEditCommand({
          existing: Boolean(session.sourceRange('stylesheet', path)),
          path,
          scopePath,
          selection: session.snapshot().selection,
          value
        })
      );
    }
  };
}
