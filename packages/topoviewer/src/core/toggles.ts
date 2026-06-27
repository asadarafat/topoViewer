import type { TopoDocument, TopoViewerToggles } from './types';

export function defaultTopoViewerToggles(document: TopoDocument): TopoViewerToggles {
  return Object.fromEntries((document.toggles || []).map((toggle) => [toggle.id, toggle.default !== false]));
}
