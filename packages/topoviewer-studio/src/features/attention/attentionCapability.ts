import type { AuthoringAttentionAction } from 'topoviewer/authoring/attention';
import type { StudioCommand } from '../../contracts/commands';
import type { StudioDocumentSession } from '../../session';

interface StudioAttentionCapabilityOptions {
  announce(message: string): void;
  execute(command: StudioCommand): boolean;
  session: StudioDocumentSession;
  setError(message?: string): void;
}

const capabilityBySession = new WeakMap<StudioDocumentSession, ReturnType<typeof createStudioAttentionCapability>>();

function actionLabel(action: AuthoringAttentionAction): string {
  switch (action.type) {
    case 'set-focus-ids': return 'Set attention focus';
    case 'set-focus-mode': return 'Set attention focus mode';
    case 'clear-focus-query': return 'Clear attention focus';
    case 'set-interactive': return 'Set interactive attention';
    case 'set-click-mode': return 'Set attention click mode';
    case 'add-aggregate-group': return 'Add attention aggregate';
    case 'remove-aggregate-group': return 'Remove attention aggregate';
    case 'set-aggregate-group-expanded': return 'Set aggregate expansion';
    case 'set-aggregate-expand-on-click': return 'Set aggregate click expansion';
    case 'set-link-grouping-enabled': return 'Set parallel-link grouping';
    case 'set-link-grouping-threshold': return 'Set parallel-link threshold';
    case 'set-link-grouping-by': return 'Set parallel-link grouping keys';
    case 'set-link-grouping-selector': return 'Set parallel-link selector';
    case 'set-link-grouping-expand-on-click': return 'Set parallel-link click expansion';
    case 'remove-attention': return 'Remove Attention';
  }
}

export function createStudioAttentionCapability({
  announce,
  execute,
  session,
  setError
}: StudioAttentionCapabilityOptions) {
  let pending = Promise.resolve();

  function reject(message: string) {
    setError(message);
    announce(`Attention change rejected: ${message}`);
    return false;
  }

  async function apply(action: AuthoringAttentionAction) {
    try {
      const { applyAuthoringAttentionAction } = await import('topoviewer/authoring/attention');
      const current = session.snapshot();
      if (current.invalidDrafts.topology) {
        return reject('Correct or revert the invalid topology draft before changing Attention visually.');
      }
      const value = applyAuthoringAttentionAction(current.projection.document, action);
      const existing = Boolean(session.sourceRange('topology', ['attention']));
      if (value === undefined && !existing) return true;
      const label = actionLabel(action);
      const plan = {
        mutations: [
          value === undefined
            ? {
                document: 'topology' as const,
                kind: 'remove-value' as const,
                path: ['attention'],
                scopePath: []
              }
            : {
                document: 'topology' as const,
                kind: 'upsert-value' as const,
                path: ['attention'],
                scopePath: [],
                value
              }
        ],
        selection: current.selection,
        summary: label
      };
      return execute({
        id: `attention-${action.type}`,
        label,
        execute: () => plan,
        plan
      });
    } catch (error) {
      return reject(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    applyAttentionAction(action: AuthoringAttentionAction) {
      const result = pending.then(() => apply(action));
      pending = result.then(() => undefined);
      return result;
    }
  };
}

export function applyStudioAttentionAction(
  options: StudioAttentionCapabilityOptions,
  action: AuthoringAttentionAction
) {
  let capability = capabilityBySession.get(options.session);
  if (!capability) {
    capability = createStudioAttentionCapability(options);
    capabilityBySession.set(options.session, capability);
  }
  return capability.applyAttentionAction(action);
}
