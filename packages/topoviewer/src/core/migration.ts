import type { TopoDocument, TopoViewerToggles } from './types';

export const CURRENT_SCHEMA_VERSION = '0.1';

function normalizeToggles(toggles: TopoViewerToggles | undefined): TopoViewerToggles | undefined {
  if (!toggles) return toggles;
  if (toggles.showChildNodesInsideParents !== undefined || toggles.showServicesInsideNodes === undefined) {
    return toggles;
  }
  return {
    ...toggles,
    showChildNodesInsideParents: toggles.showServicesInsideNodes
  };
}

export function migrateTopoDocument(document: unknown): TopoDocument {
  const source = (document && typeof document === 'object' ? document : {}) as TopoDocument;
  return {
    ...source,
    version: source.version || CURRENT_SCHEMA_VERSION
  };
}

export function migrateTopoToggles(toggles: TopoViewerToggles | undefined): TopoViewerToggles | undefined {
  return normalizeToggles(toggles);
}
