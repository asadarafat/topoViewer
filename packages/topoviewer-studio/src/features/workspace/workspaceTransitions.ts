export type StudioWorkspaceView = 'add' | 'mapper' | 'properties';

export type StudioWorkspaceEvent =
  | { type: 'activate'; view: StudioWorkspaceView }
  | { type: 'canvas-selected' }
  | { type: 'creation-cancelled' }
  | { type: 'creation-completed' }
  | { type: 'multi-selection' }
  | { type: 'panel-collapsed' }
  | { type: 'panel-expanded' }
  | { type: 'object-selected' };

export function transitionStudioWorkspace(
  current: StudioWorkspaceView,
  event: StudioWorkspaceEvent
): StudioWorkspaceView {
  if (event.type === 'activate') return event.view;
  if (
    event.type === 'creation-cancelled' ||
    event.type === 'panel-collapsed' ||
    event.type === 'panel-expanded'
  ) {
    return current;
  }
  if (
    event.type === 'object-selected' ||
    event.type === 'multi-selection' ||
    event.type === 'canvas-selected'
  ) {
    return current === 'mapper' ? 'mapper' : 'properties';
  }
  return 'properties';
}
