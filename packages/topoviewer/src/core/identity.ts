import { rewriteSelectorFieldValue, rewriteSelectorObjectId, selectorObjectIdReferences } from './selector';
import type { AuthoringObjectKind, AuthoringObjectSelection, AuthoringSourcePath } from './authoringTypes';
import type { StylesheetDocument, TopoDocument } from './types';

export type CanonicalIdentityDocument = 'topology' | 'stylesheet' | 'mapper';

export interface CanonicalIdentityBundle {
  mapper?: Record<string, unknown>;
  stylesheet?: StylesheetDocument;
  topology: TopoDocument;
}

export interface CanonicalIdentityMutation {
  document: CanonicalIdentityDocument;
  kind: 'set' | 'upsert';
  path: AuthoringSourcePath;
  role: string;
  scopePath?: AuthoringSourcePath;
  value: unknown;
}

export interface CanonicalIdentityRisk {
  code: 'external-telemetry-identity';
  message: string;
  path: AuthoringSourcePath;
}

export interface CanonicalIdentityRenamePlan {
  mutations: CanonicalIdentityMutation[];
  nextSelection: AuthoringObjectSelection;
  risks: CanonicalIdentityRisk[];
}

export interface CanonicalIdentityDefinition {
  explicit: boolean;
  id: string;
  kind: AuthoringObjectKind;
  path: AuthoringSourcePath;
  scopePath: AuthoringSourcePath;
}

export interface CanonicalIdentityReference {
  document: CanonicalIdentityDocument;
  path: AuthoringSourcePath;
  role: string;
  targetId: string;
  targetKind?: string;
}

export interface CanonicalIdentityIndex {
  definitions: readonly CanonicalIdentityDefinition[];
  definitionsByKey: ReadonlyMap<string, CanonicalIdentityDefinition>;
  references: readonly CanonicalIdentityReference[];
  referencesByTargetId: ReadonlyMap<string, readonly CanonicalIdentityReference[]>;
}

interface IdentityAlias {
  kind: string;
  nextId: string;
  previousId: string;
}

const graphCollections = {
  layer: 'layers',
  link: 'links',
  node: 'nodes',
  path: 'paths',
  region: 'regions'
} as const;

const diagramCollections = {
  callout: 'callouts',
  shape: 'shapes',
  text: 'texts'
} as const;

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function values(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const entry = record(item);
    return entry ? [entry] : [];
  }) : [];
}

function identityEntries(topology: TopoDocument): CanonicalIdentityDefinition[] {
  const graph = record(topology.graph) || {};
  const diagram = record(topology.diagram) || {};
  const entries: CanonicalIdentityDefinition[] = [];

  (Object.entries(graphCollections) as Array<[keyof typeof graphCollections, string]>).forEach(([kind, collection]) => {
    values(graph[collection]).forEach((entry, index) => {
      if (typeof entry.id !== 'string' || !entry.id) return;
      const scopePath: AuthoringSourcePath = ['graph', collection, index];
      entries.push({ explicit: true, id: entry.id, kind, path: [...scopePath, 'id'], scopePath });
      if (kind !== 'link') return;
      Object.entries(record(entry.directions) || {}).forEach(([direction, rawDirection]) => {
        const value = record(rawDirection);
        if (!value) return;
        const directionScope = [...scopePath, 'directions', direction];
        const explicit = typeof value.id === 'string' && value.id.length > 0;
        entries.push({
          explicit,
          id: explicit ? String(value.id) : `${entry.id}:${direction}`,
          kind: 'linkDirection',
          path: [...directionScope, 'id'],
          scopePath: directionScope
        });
      });
    });
  });

  (Object.entries(diagramCollections) as Array<[keyof typeof diagramCollections, string]>).forEach(([kind, collection]) => {
    values(diagram[collection]).forEach((entry, index) => {
      if (typeof entry.id !== 'string' || !entry.id) return;
      const scopePath: AuthoringSourcePath = ['diagram', collection, index];
      entries.push({ explicit: true, id: entry.id, kind, path: [...scopePath, 'id'], scopePath });
    });
  });

  return entries;
}

function identityKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

export function indexCanonicalIdentityBundle(bundle: CanonicalIdentityBundle): CanonicalIdentityIndex {
  const definitions = identityEntries(bundle.topology);
  const references: CanonicalIdentityReference[] = [];
  const add = (document: CanonicalIdentityDocument, path: AuthoringSourcePath, value: unknown, role: string, targetKind?: string) => {
    if (typeof value !== 'string' || !value) return;
    references.push({ document, path, role, targetId: value, ...(targetKind ? { targetKind } : {}) });
  };
  const addArray = (document: CanonicalIdentityDocument, path: AuthoringSourcePath, value: unknown, role: string, targetKind?: string) => {
    if (!Array.isArray(value)) return;
    value.forEach((item, index) => add(document, [...path, index], item, role, targetKind));
  };
  const addSelector = (document: CanonicalIdentityDocument, path: AuthoringSourcePath, selector: unknown, role: string) => {
    if (typeof selector !== 'string') return;
    selectorObjectIdReferences(selector).forEach((reference) => add(document, path, reference.id, role, reference.kind));
  };
  const graph = record(bundle.topology.graph) || {};
  const diagram = record(bundle.topology.diagram) || {};

  values(graph.nodes).forEach((node, index) => {
    const base = ['graph', 'nodes', index] as AuthoringSourcePath;
    add('topology', [...base, 'parent'], node.parent, 'parent-node', 'node');
    addArray('topology', [...base, 'layers'], node.layers, 'layer-membership', 'layer');
  });
  values(graph.links).forEach((link, index) => {
    const base = ['graph', 'links', index] as AuthoringSourcePath;
    add('topology', [...base, 'source'], link.source, 'link-source', 'node');
    add('topology', [...base, 'target'], link.target, 'link-target', 'node');
    add('topology', [...base, 'parent'], link.parent, 'parent-link', 'link');
    addArray('topology', [...base, 'layers'], link.layers, 'layer-membership', 'layer');
    add('topology', [...base, 'labels', 'layer'], record(link.labels)?.layer, 'layer-label', 'layer');
  });
  values(graph.paths).forEach((path, index) => {
    const base = ['graph', 'paths', index] as AuthoringSourcePath;
    addArray('topology', [...base, 'sequence'], path.sequence, 'path-sequence', 'node');
    add('topology', [...base, 'source'], path.source, 'path-source', 'node');
    add('topology', [...base, 'target'], path.target, 'path-target', 'node');
    add('topology', [...base, 'parent'], path.parent, 'parent-path', 'path');
    addArray('topology', [...base, 'layers'], path.layers, 'layer-membership', 'layer');
    add('topology', [...base, 'labels', 'layer'], record(path.labels)?.layer, 'layer-label', 'layer');
  });
  values(graph.regions).forEach((region, index) => {
    const base = ['graph', 'regions', index] as AuthoringSourcePath;
    addArray('topology', [...base, 'members'], region.members, 'region-member');
    add('topology', [...base, 'parent'], region.parent, 'parent-region', 'region');
    addArray('topology', [...base, 'layers'], region.layers, 'layer-membership', 'layer');
  });
  ['shapes', 'connectors', 'callouts', 'texts'].forEach((collection) => {
    values(diagram[collection]).forEach((entity, index) => {
      const base = ['diagram', collection, index] as AuthoringSourcePath;
      addArray('topology', [...base, 'layers'], entity.layers, 'layer-membership', 'layer');
      if (collection === 'connectors' || collection === 'callouts') {
        add('topology', [...base, 'source'], entity.source, 'diagram-source');
        add('topology', [...base, 'target'], entity.target, 'diagram-target');
      }
    });
  });

  const attention = record(bundle.topology.attention);
  const query = record(attention?.query);
  addArray('topology', ['attention', 'query', 'ids'], query?.ids, 'attention-id');
  addArray('topology', ['attention', 'query', 'pathIds'], query?.pathIds, 'attention-path', 'path');
  addArray('topology', ['attention', 'query', 'regionIds'], query?.regionIds, 'attention-region', 'region');
  if (Array.isArray(query?.selectors)) query.selectors.forEach((selector, index) => addSelector('topology', ['attention', 'query', 'selectors', index], selector, 'attention-selector'));
  values(record(attention?.aggregate)?.groups).forEach((group, index) => {
    const base = ['attention', 'aggregate', 'groups', index] as AuthoringSourcePath;
    add('topology', [...base, 'regionId'], group.regionId, 'attention-region', 'region');
    add('topology', [...base, 'parentId'], group.parentId, 'attention-parent');
  });
  addSelector('topology', ['attention', 'links', 'grouping', 'selector'], record(record(attention?.links)?.grouping)?.selector, 'attention-selector');
  addArray('topology', ['layout', 'clos', 'pinnedNodeIds'], record(record(bundle.topology.layout)?.clos)?.pinnedNodeIds, 'layout-pinned-node', 'node');

  const addStyleSelectors = (document: CanonicalIdentityDocument, rules: unknown) => {
    values(rules).forEach((rule, index) => addSelector(document, ['stylesheet', index, 'selector'], rule.selector, 'selector'));
  };
  addStyleSelectors('topology', (bundle.topology as unknown as Record<string, unknown>).stylesheet);
  addStyleSelectors('stylesheet', bundle.stylesheet?.stylesheet);
  addArray('stylesheet', ['layout', 'clos', 'pinnedNodeIds'], record(record(bundle.stylesheet?.layout)?.clos)?.pinnedNodeIds, 'layout-pinned-node', 'node');

  const mapper = record(bundle.mapper);
  values(mapper?.rules).forEach((rule, index) => addSelector('mapper', ['rules', index, 'select'], rule.select, 'mapper-selector'));
  values(mapper?.mappings).forEach((mapping, index) => {
    const target = record(mapping.target);
    const resolve = record(target?.resolve);
    const base = ['mappings', index, 'target', 'resolve'] as AuthoringSourcePath;
    addArray('mapper', [...base, 'objectIds'], resolve?.objectIds, 'mapper-static-object', typeof target?.kind === 'string' ? target.kind : undefined);
    addSelector('mapper', [...base, 'selector'], resolve?.selector, 'mapper-selector');
  });

  const referencesByTargetId = new Map<string, CanonicalIdentityReference[]>();
  references.forEach((reference) => {
    const entries = referencesByTargetId.get(reference.targetId) || [];
    entries.push(reference);
    referencesByTargetId.set(reference.targetId, entries);
  });
  return {
    definitions,
    definitionsByKey: new Map(definitions.map((definition) => [identityKey(definition.kind, definition.id), definition])),
    references,
    referencesByTargetId
  };
}

function mutationKey(document: CanonicalIdentityDocument, path: AuthoringSourcePath): string {
  return `${document}:${JSON.stringify(path)}`;
}

function safeGroupId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '').toLowerCase() || 'group';
}

function groupingKey(link: Record<string, unknown>, keys: readonly string[], replace?: { kind: AuthoringObjectKind; nextId: string; previousId: string }): string {
  return keys.map((key) => {
    if (key === 'endpoints') {
      const endpoints = [String(link.source || ''), String(link.target || '')].map((id) => (
        replace?.kind === 'node' && id === replace.previousId ? replace.nextId : id
      ));
      return ['endpoints', ...endpoints.sort()].join(':');
    }
    if (key === 'layer') {
      const layers = Array.isArray(link.layers) ? link.layers.map(String) : ['physical'];
      return ['layer', ...layers.map((id) => (
        replace?.kind === 'layer' && id === replace.previousId ? replace.nextId : id
      )).sort()].join(':');
    }
    return '';
  }).filter(Boolean).join('|');
}

function targetKind(selection: AuthoringObjectSelection): string {
  return selection.kind;
}

export function planCanonicalObjectIdRename(
  bundle: CanonicalIdentityBundle,
  selection: AuthoringObjectSelection,
  requestedId: string
): CanonicalIdentityRenamePlan {
  const nextId = requestedId.trim();
  if (!nextId) throw new Error('Object ID cannot be empty.');
  if (/[\u0000-\u001f\u007f]/.test(nextId)) throw new Error('Object ID cannot contain control characters.');

  const identityIndex = indexCanonicalIdentityBundle(bundle);
  const entries = identityIndex.definitions;
  const source = entries.find((entry) => entry.kind === selection.kind && entry.id === selection.id);
  if (!source) throw new Error(`${selection.kind} "${selection.id}" does not exist.`);
  if (nextId === selection.id) {
    return { mutations: [], nextSelection: selection, risks: [] };
  }
  const conflict = entries.find((entry) => entry.id === nextId && entry !== source);
  if (conflict) throw new Error(`Object ID "${nextId}" is already used by ${conflict.kind} "${conflict.id}".`);

  const mutations = new Map<string, CanonicalIdentityMutation>();
  const risks = new Map<string, CanonicalIdentityRisk>();
  const addMutation = (
    document: CanonicalIdentityDocument,
    path: AuthoringSourcePath,
    value: unknown,
    role: string,
    kind: CanonicalIdentityMutation['kind'] = 'set',
    scopePath?: AuthoringSourcePath
  ) => {
    mutations.set(mutationKey(document, path), { document, kind, path, role, value, ...(scopePath ? { scopePath } : {}) });
  };
  const addRisk = (path: AuthoringSourcePath, message: string) => {
    const key = JSON.stringify(path);
    risks.set(key, { code: 'external-telemetry-identity', message, path });
  };
  const replaceScalar = (
    document: CanonicalIdentityDocument,
    path: AuthoringSourcePath,
    value: unknown,
    role: string,
    previousId = selection.id,
    replacement = nextId
  ) => {
    if (value === previousId) addMutation(document, path, replacement, role);
  };
  const replaceArray = (
    document: CanonicalIdentityDocument,
    path: AuthoringSourcePath,
    value: unknown,
    role: string,
    aliases: ReadonlyMap<string, string> = new Map([[selection.id, nextId]])
  ) => {
    if (!Array.isArray(value)) return;
    value.forEach((item, index) => {
      const replacement = aliases.get(String(item));
      if (replacement !== undefined) addMutation(document, [...path, index], replacement, role);
    });
  };

  addMutation('topology', source.path, nextId, 'definition', source.explicit ? 'set' : 'upsert', source.scopePath);

  const aliases: IdentityAlias[] = [{ kind: targetKind(selection), previousId: selection.id, nextId }];
  const topologyGraph = record(bundle.topology.graph) || {};
  const topologyDiagram = record(bundle.topology.diagram) || {};
  const links = values(topologyGraph.links);

  if (selection.kind === 'link') {
    const link = links.find((entry) => entry.id === selection.id);
    Object.entries(record(link?.directions) || {}).forEach(([direction, rawDirection]) => {
      const value = record(rawDirection);
      if (!value || (typeof value.id === 'string' && value.id)) return;
      aliases.push({
        kind: 'linkDirection',
        previousId: `${selection.id}:${direction}`,
        nextId: `${nextId}:${direction}`
      });
    });
  }
  if (selection.kind === 'callout') {
    aliases.push({ kind: 'link', previousId: `${selection.id}:leader`, nextId: `${nextId}:leader` });
  }
  const aliasMap = new Map(aliases.map((alias) => [alias.previousId, alias.nextId]));

  aliases.forEach((alias) => {
    (identityIndex.referencesByTargetId.get(alias.previousId) || []).forEach((reference) => {
      if (reference.targetKind && reference.targetKind !== alias.kind) return;
      if (reference.role.includes('selector')) return;
      addMutation(reference.document, reference.path, alias.nextId, reference.role);
    });
  });

  links.forEach((link, index) => {
    const base = ['graph', 'links', index] as AuthoringSourcePath;
    if (selection.kind === 'node') {
      replaceScalar('topology', [...base, 'source'], link.source, 'link-source');
      replaceScalar('topology', [...base, 'target'], link.target, 'link-target');
    }
    if (selection.kind === 'link') replaceScalar('topology', [...base, 'parent'], link.parent, 'parent-link');
    if (selection.kind === 'layer') {
      replaceArray('topology', [...base, 'layers'], link.layers, 'layer-membership');
      replaceScalar('topology', [...base, 'labels', 'layer'], record(link.labels)?.layer, 'layer-label');
    }
  });

  values(topologyGraph.nodes).forEach((node, index) => {
    const base = ['graph', 'nodes', index] as AuthoringSourcePath;
    if (selection.kind === 'node') replaceScalar('topology', [...base, 'parent'], node.parent, 'parent-node');
    if (selection.kind === 'layer') replaceArray('topology', [...base, 'layers'], node.layers, 'layer-membership');
  });
  values(topologyGraph.paths).forEach((path, index) => {
    const base = ['graph', 'paths', index] as AuthoringSourcePath;
    if (selection.kind === 'node') {
      replaceArray('topology', [...base, 'sequence'], path.sequence, 'path-sequence');
      replaceScalar('topology', [...base, 'source'], path.source, 'path-source');
      replaceScalar('topology', [...base, 'target'], path.target, 'path-target');
    }
    if (selection.kind === 'path') replaceScalar('topology', [...base, 'parent'], path.parent, 'parent-path');
    if (selection.kind === 'layer') {
      replaceArray('topology', [...base, 'layers'], path.layers, 'layer-membership');
      replaceScalar('topology', [...base, 'labels', 'layer'], record(path.labels)?.layer, 'layer-label');
    }
  });
  values(topologyGraph.regions).forEach((region, index) => {
    const base = ['graph', 'regions', index] as AuthoringSourcePath;
    if (selection.kind === 'node' || selection.kind === 'region') {
      replaceArray('topology', [...base, 'members'], region.members, 'region-member');
    }
    if (selection.kind === 'region') replaceScalar('topology', [...base, 'parent'], region.parent, 'parent-region');
    if (selection.kind === 'layer') replaceArray('topology', [...base, 'layers'], region.layers, 'layer-membership');
  });

  const layeredDiagramCollections = ['shapes', 'connectors', 'callouts', 'texts'];
  layeredDiagramCollections.forEach((collection) => {
    values(topologyDiagram[collection]).forEach((entity, index) => {
      const base = ['diagram', collection, index] as AuthoringSourcePath;
      if (selection.kind === 'layer') replaceArray('topology', [...base, 'layers'], entity.layers, 'layer-membership');
      if (collection === 'connectors' || collection === 'callouts') {
        replaceScalar('topology', [...base, 'source'], entity.source, 'diagram-source');
        replaceScalar('topology', [...base, 'target'], entity.target, 'diagram-target');
      }
    });
  });

  const attention = record(bundle.topology.attention);
  const query = record(attention?.query);
  if (query) {
    replaceArray('topology', ['attention', 'query', 'ids'], query.ids, 'attention-id', aliasMap);
    if (selection.kind === 'path') replaceArray('topology', ['attention', 'query', 'pathIds'], query.pathIds, 'attention-path');
    if (selection.kind === 'region') replaceArray('topology', ['attention', 'query', 'regionIds'], query.regionIds, 'attention-region');
  }
  const aggregate = record(attention?.aggregate);
  values(aggregate?.groups).forEach((group, index) => {
    const base = ['attention', 'aggregate', 'groups', index] as AuthoringSourcePath;
    if (selection.kind === 'region') replaceScalar('topology', [...base, 'regionId'], group.regionId, 'attention-region');
    replaceScalar('topology', [...base, 'parentId'], group.parentId, 'attention-parent');
  });

  const rewriteSelectors = (document: CanonicalIdentityDocument, rules: unknown, base: AuthoringSourcePath) => {
    values(rules).forEach((rule, index) => {
      if (typeof rule.selector !== 'string') return;
      let rewritten = rule.selector;
      aliases.forEach((alias) => {
        rewritten = rewriteSelectorObjectId(rewritten, alias.kind, alias.previousId, alias.nextId);
      });
      if (selection.kind === 'layer') {
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'layers', selection.id, nextId);
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'labels.layer', selection.id, nextId);
      }
      if (rewritten !== rule.selector) addMutation(document, [...base, index, 'selector'], rewritten, 'selector');
    });
  };

  rewriteSelectors('topology', (bundle.topology as unknown as Record<string, unknown>).stylesheet, ['stylesheet']);
  rewriteSelectors('stylesheet', bundle.stylesheet?.stylesheet, ['stylesheet']);

  const rewriteQuerySelector = (path: AuthoringSourcePath, selector: unknown) => {
    if (typeof selector !== 'string') return;
    let rewritten = selector;
    aliases.forEach((alias) => {
      rewritten = rewriteSelectorObjectId(rewritten, alias.kind, alias.previousId, alias.nextId);
    });
    if (selection.kind === 'layer') {
      rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'layers', selection.id, nextId);
      rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'labels.layer', selection.id, nextId);
    }
    if (rewritten !== selector) addMutation('topology', path, rewritten, 'attention-selector');
  };
  if (query && Array.isArray(query.selectors)) {
    query.selectors.forEach((selector, index) => rewriteQuerySelector(['attention', 'query', 'selectors', index], selector));
  }
  rewriteQuerySelector(['attention', 'links', 'grouping', 'selector'], record(record(attention?.links)?.grouping)?.selector);

  const rewritePinnedNodes = (document: CanonicalIdentityDocument, sourceDocument: unknown) => {
    if (selection.kind !== 'node') return;
    const pinned = record(record(sourceDocument)?.layout);
    const clos = record(pinned?.clos);
    replaceArray(document, ['layout', 'clos', 'pinnedNodeIds'], clos?.pinnedNodeIds, 'layout-pinned-node');
  };
  rewritePinnedNodes('topology', bundle.topology);
  rewritePinnedNodes('stylesheet', bundle.stylesheet);

  const grouping = record(record(attention?.links)?.grouping);
  if ((selection.kind === 'node' || selection.kind === 'layer') && grouping) {
    const keys = Array.isArray(grouping.by) && grouping.by.length ? grouping.by.map(String) : ['endpoints', 'layer'];
    const groupAliases = new Map<string, string>();
    links.forEach((link) => {
      const previous = safeGroupId(groupingKey(link, keys));
      const next = safeGroupId(groupingKey(link, keys, { kind: selection.kind, previousId: selection.id, nextId }));
      if (previous !== next) groupAliases.set(previous, next);
    });
    replaceArray('topology', ['attention', 'links', 'grouping', 'expandedGroupIds'], grouping.expandedGroupIds, 'attention-link-group', groupAliases);
  }

  const mapper = record(bundle.mapper);
  values(mapper?.rules).forEach((rule, index) => {
    const select = typeof rule.select === 'string' ? rule.select : undefined;
    if (select) {
      let rewritten = select;
      aliases.forEach((alias) => {
        rewritten = rewriteSelectorObjectId(rewritten, alias.kind, alias.previousId, alias.nextId);
      });
      if (selection.kind === 'layer') {
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'layers', selection.id, nextId);
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'labels.layer', selection.id, nextId);
      }
      if (rewritten !== select) addMutation('mapper', ['rules', index, 'select'], rewritten, 'mapper-selector');
      const selectedKind = select.match(/^[a-zA-Z][\w-]*/)?.[0];
      if (rule.join !== undefined && selectedKind === selection.kind) {
        addRisk(
          ['rules', index, 'join'],
          `Mapper rule "${String(rule.id || index)}" joins external telemetry values to ${selection.kind} IDs; producers may still emit "${selection.id}".`
        );
      }
    }
  });
  values(mapper?.mappings).forEach((mapping, index) => {
    const target = record(mapping.target);
    const resolver = record(target?.resolve);
    if (!resolver) return;
    const base = ['mappings', index, 'target', 'resolve'] as AuthoringSourcePath;
    replaceArray('mapper', [...base, 'objectIds'], resolver.objectIds, 'mapper-static-object', aliasMap);
    if (typeof resolver.selector === 'string') {
      let rewritten = resolver.selector;
      aliases.forEach((alias) => {
        rewritten = rewriteSelectorObjectId(rewritten, alias.kind, alias.previousId, alias.nextId);
      });
      if (selection.kind === 'layer') {
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'layers', selection.id, nextId);
        rewritten = rewriteSelectorFieldValue(rewritten, undefined, 'labels.layer', selection.id, nextId);
      }
      if (rewritten !== resolver.selector) addMutation('mapper', [...base, 'selector'], rewritten, 'mapper-selector');
    }
    const by = String(resolver.by || '');
    const kind = String(target?.kind || '');
    if (
      (by === 'id' && kind === selection.kind)
      || (by === 'endpoint' && selection.kind === 'node')
      || (kind === 'linkDirection' && selection.kind === 'link' && resolver.linkMetricLabel !== undefined)
    ) {
      addRisk(
        [...base, 'by'],
        `Mapper "${String(mapping.id || index)}" resolves external telemetry by topology identity; producers may still emit "${selection.id}".`
      );
    }
  });

  return {
    mutations: [...mutations.values()],
    nextSelection: { ...selection, id: nextId },
    risks: [...risks.values()]
  };
}
