import type { StudioDocumentKind } from '../contracts/project';
import type { ParsedSources } from './projection';
import type { StudioSourceLocation, StudioYamlPath } from './types';

const collections: Array<{ collection: string; kind: string }> = [
  { collection: 'nodes', kind: 'node' },
  { collection: 'links', kind: 'link' },
  { collection: 'paths', kind: 'path' },
  { collection: 'regions', kind: 'region' }
];
const diagramCollections: Array<{ collection: string; kind: string }> = [
  { collection: 'shapes', kind: 'shape' },
  { collection: 'callouts', kind: 'callout' }
];

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function valueAtPath(root: unknown, path: StudioYamlPath): unknown {
  return path.reduce<unknown>((value, segment) => {
    if (typeof segment === 'number') return Array.isArray(value) ? value[segment] : undefined;
    return record(value)?.[segment];
  }, root);
}

export function semanticIdAtPath(sources: ParsedSources, document: StudioDocumentKind, path: StudioYamlPath): string | undefined {
  if (document !== 'topology') return undefined;
  const graphIndex = path[0] === 'graph' ? collections.find(({ collection }) => path[1] === collection) : undefined;
  const diagramIndex = path[0] === 'diagram' ? diagramCollections.find(({ collection }) => path[1] === collection) : undefined;
  const definition = graphIndex || diagramIndex;
  const index = path[2];
  if (!definition || typeof index !== 'number') return path[0] === 'graph' ? 'graph:root' : undefined;
  const entityPath: StudioYamlPath = [path[0], definition.collection, index];
  const entity = record(valueAtPath(sources.topology.value, entityPath));
  return typeof entity?.id === 'string' ? `${definition.kind}:${entity.id}` : undefined;
}

function findEntityPath(sources: ParsedSources, root: 'graph' | 'diagram', collection: string, id: string): StudioYamlPath | undefined {
  const values = valueAtPath(sources.topology.value, [root, collection]);
  if (!Array.isArray(values)) return undefined;
  const index = values.findIndex((value) => record(value)?.id === id);
  return index >= 0 ? [root, collection, index] : undefined;
}

export function sourcePathForSemanticSelection(sources: ParsedSources, selection: { id: string; kind: string }): StudioSourceLocation | undefined {
  if (selection.kind === 'graph') return { document: 'topology', path: ['graph'] };
  const graph = collections.find(({ kind }) => kind === selection.kind);
  const diagram = diagramCollections.find(({ kind }) => kind === selection.kind);
  const path = graph ? findEntityPath(sources, 'graph', graph.collection, selection.id) : diagram ? findEntityPath(sources, 'diagram', diagram.collection, selection.id) : undefined;
  return path ? { document: 'topology', path } : undefined;
}
