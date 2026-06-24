import type {
  AggregateGraphResult,
  AggregateGroupDefinition,
  AggregateGroupSummary,
  AttentionGraphIndex,
  DeriveAggregateGraphOptions,
  LinkAggregateGroupSummary,
  LinkGroupingKey,
  LinkGroupingOptions
} from './types';
import type { GraphLink, GraphNode, GraphPath, GraphRegion, Scalar, TopoDocument } from '../types';

const AGGREGATE_STYLE_RULE = {
  selector: 'node[isAggregate="true"]',
  style: {
    width: 118,
    height: 76,
    backgroundColor: '#334155',
    borderColor: '#e2e8f0',
    borderWidth: 2,
    borderRadius: 8,
    color: '#f8fafc'
  }
};

const LINK_AGGREGATE_STYLE_RULE = {
  selector: 'link[isLinkAggregate="true"]',
  style: {
    lineColor: '#8b5cf6',
    lineWidth: 4,
    lineDashPattern: '10 5',
    labelColor: '#312e81',
    textBackgroundColor: '#ede9fe',
    textBackgroundOpacity: 0.96
  }
};

function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => cloneDeep(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneDeep(entry)])) as T;
  }
  return value;
}

function uniqueIds(ids: readonly string[]): readonly string[] {
  const result: string[] = [];
  ids.forEach((id) => {
    if (!result.includes(id)) result.push(id);
  });
  return result;
}

function aggregateNodeId(groupId: string): string {
  return `aggregate:${groupId}`;
}

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_.-]+/g, '-').replace(/^-+|-+$/g, '') || 'group';
}

function memberIdsForGroup(index: AttentionGraphIndex, group: AggregateGroupDefinition): readonly string[] {
  if (group.by === 'region') return index.getRegionMembers(group.regionId).filter((id) => !!index.getNode(id));
  if (group.by === 'parent') return index.getChildren(group.parentId).filter((id) => !!index.getNode(id));
  return index.getByLabel(group.key, group.value).filter((id) => !!index.getNode(id));
}

function sourceIdForGroup(group: AggregateGroupDefinition): string | undefined {
  if (group.by === 'region') return group.regionId;
  if (group.by === 'parent') return group.parentId;
  return `${group.key}:${String(group.value)}`;
}

function severityValue(node: GraphNode): string {
  const data = node.data || {};
  const value = data.severity ?? data.status ?? data.health;
  return value === undefined ? 'unknown' : String(value);
}

function severitySummary(memberIds: readonly string[], nodeById: Map<string, GraphNode>): Record<string, number> {
  return memberIds.reduce<Record<string, number>>((summary, id) => {
    const node = nodeById.get(id);
    if (!node) return summary;
    const severity = severityValue(node);
    summary[severity] = (summary[severity] || 0) + 1;
    return summary;
  }, {});
}

function severityRank(value: string): number {
  const order: Record<string, number> = {
    critical: 5,
    major: 4,
    minor: 3,
    warning: 3,
    normal: 2,
    up: 2,
    unknown: 1
  };
  return order[value.toLowerCase()] || 1;
}

function worstSeverity(summary: Readonly<Record<string, number>>): string {
  return Object.keys(summary).sort((left, right) => severityRank(right) - severityRank(left))[0] || 'unknown';
}

function countLabel(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function nodePosition(node: GraphNode): { x: number; y: number } | undefined {
  const position = node.position;
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') return { x: Number(position.x || 0), y: Number(position.y || 0) };
  return undefined;
}

function aggregatePosition(memberIds: readonly string[], nodeById: Map<string, GraphNode>): GraphNode['position'] | undefined {
  const points = memberIds
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .map((node) => nodePosition(node!))
    .filter(Boolean) as Array<{ x: number; y: number }>;
  if (!points.length) return undefined;
  return {
    x: Math.round(points.reduce((total, point) => total + point.x, 0) / points.length),
    y: Math.round(points.reduce((total, point) => total + point.y, 0) / points.length)
  };
}

function groupLinkCount(memberIds: readonly string[], links: readonly GraphLink[]): number {
  const members = new Set(memberIds);
  return links.filter((link) => members.has(link.source) || members.has(link.target)).length;
}

function createAggregateNode(group: AggregateGroupDefinition, summary: AggregateGroupSummary, nodeById: Map<string, GraphNode>): GraphNode {
  const criticalCount = summary.severitySummary.critical || 0;
  const majorCount = summary.severitySummary.major || 0;
  return {
    id: summary.aggregateNodeId,
    name: group.label || `Aggregate ${group.id}`,
    label: group.label || `${summary.childCount} objects`,
    labels: {
      aggregate: 'true',
      aggregateBy: group.by,
      nodes: summary.childCount,
      links: summary.linkCount,
      severity: worstSeverity(summary.severitySummary),
      ...(criticalCount ? { critical: criticalCount } : {}),
      ...(majorCount ? { major: majorCount } : {})
    },
    layers: ['physical'],
    position: aggregatePosition(summary.memberIds, nodeById),
    data: {
      isAggregate: true,
      aggregateId: summary.id,
      aggregateBy: group.by,
      aggregateSourceId: summary.sourceId,
      members: [...summary.memberIds],
      childCount: summary.childCount,
      linkCount: summary.linkCount,
      severitySummary: { ...summary.severitySummary }
    }
  };
}

function visibleNodeId(nodeId: string, memberToAggregate: Map<string, string>): string {
  return memberToAggregate.get(nodeId) || nodeId;
}

function remapLinks(links: readonly GraphLink[], memberToAggregate: Map<string, string>): GraphLink[] {
  const aggregateLinks = new Map<string, GraphLink & { data: Record<string, unknown> }>();
  const result: GraphLink[] = [];

  links.forEach((link) => {
    const source = visibleNodeId(link.source, memberToAggregate);
    const target = visibleNodeId(link.target, memberToAggregate);
    if (source === target) return;

    if (source !== link.source || target !== link.target) {
      const key = `${source}->${target}`;
      const current = aggregateLinks.get(key);
      if (current) {
        const count = Number(current.data.count || 1) + 1;
        current.label = countLabel(count, 'link');
        current.data.count = count;
        current.data.members = [...(current.data.members as string[]), link.id];
        return;
      }
      const aggregateLink = {
        id: `aggregate-link:${source}:${target}`,
        source,
        target,
        label: countLabel(1, 'link'),
        labels: { aggregate: 'true' as Scalar },
        layers: link.layers ? [...link.layers] : ['physical'],
        data: {
          isAggregate: true,
          count: 1,
          members: [link.id]
        }
      };
      aggregateLinks.set(key, aggregateLink);
      result.push(aggregateLink);
      return;
    }

    result.push(cloneDeep(link));
  });

  return result;
}

function linkLayers(link: GraphLink): string[] {
  return link.layers?.length ? [...link.layers] : ['physical'];
}

function linkMemberIds(link: GraphLink): string[] {
  const members = link.data?.members;
  if (Array.isArray(members) && members.every((item) => typeof item === 'string')) return [...members];
  return [link.id];
}

function linkGroupingKeys(options: LinkGroupingOptions | undefined): readonly LinkGroupingKey[] {
  return options?.by?.length ? options.by : ['endpoints', 'layer'];
}

function linkGroupingEnabled(options: LinkGroupingOptions | undefined): boolean {
  return !!options && options.enabled !== false;
}

function linkGroupKey(link: GraphLink, keys: readonly LinkGroupingKey[]): string {
  return keys.map((key) => {
    if (key === 'endpoints') return ['endpoints', ...[link.source, link.target].sort()].join(':');
    if (key === 'layer') return ['layer', ...linkLayers(link).sort()].join(':');
    return '';
  }).filter(Boolean).join('|');
}

function createLinkAggregateLink(
  id: string,
  entries: readonly GraphLink[],
  memberIds: readonly string[],
  keys: readonly LinkGroupingKey[]
): GraphLink {
  const first = entries[0];
  const layers = linkLayers(first);
  return {
    id: `aggregate-link-group:${id}`,
    source: first.source,
    target: first.target,
    label: `${memberIds.length} links`,
    labels: {
      ...(first.labels || {}),
      aggregate: 'true',
      aggregateBy: 'link',
      linkAggregate: 'true'
    },
    layers,
    data: {
      isAggregate: true,
      isLinkAggregate: true,
      aggregateId: id,
      aggregateBy: 'link',
      groupedBy: [...keys],
      count: memberIds.length,
      members: [...memberIds]
    }
  };
}

function groupParallelLinks(
  links: readonly GraphLink[],
  options: LinkGroupingOptions | undefined
): { links: GraphLink[]; groups: LinkAggregateGroupSummary[] } {
  if (!linkGroupingEnabled(options)) {
    return { links: links.map((link) => cloneDeep(link)), groups: [] };
  }

  const threshold = Math.max(2, Math.floor(Number(options?.threshold || 2)));
  const expanded = new Set(options?.expandedGroupIds || []);
  const keys = linkGroupingKeys(options);
  const groupsByKey = new Map<string, GraphLink[]>();

  links.forEach((link) => {
    const key = linkGroupKey(link, keys);
    const group = groupsByKey.get(key) || [];
    group.push(link);
    groupsByKey.set(key, group);
  });

  const emitted = new Set<string>();
  const groups: LinkAggregateGroupSummary[] = [];
  const result: GraphLink[] = [];

  links.forEach((link) => {
    const key = linkGroupKey(link, keys);
    if (emitted.has(key)) return;
    emitted.add(key);
    const entries = groupsByKey.get(key) || [link];
    const memberIds = entries.flatMap((entry) => linkMemberIds(entry));
    const id = safeId(key);

    if (entries.length < threshold || expanded.has(id)) {
      result.push(...entries.map((entry) => cloneDeep(entry)));
      return;
    }

    const aggregateLink = createLinkAggregateLink(id, entries, memberIds, keys);
    groups.push({
      id,
      aggregateLinkId: aggregateLink.id,
      source: aggregateLink.source,
      target: aggregateLink.target,
      layers: aggregateLink.layers || [],
      memberIds,
      count: memberIds.length
    });
    result.push(aggregateLink);
  });

  return { links: result, groups };
}

function remapPathSequence(sequence: readonly string[], memberToAggregate: Map<string, string>): string[] {
  const mapped = sequence.map((id) => visibleNodeId(id, memberToAggregate));
  return mapped.filter((id, index) => index === 0 || id !== mapped[index - 1]);
}

function remapPaths(paths: readonly GraphPath[], memberToAggregate: Map<string, string>): GraphPath[] {
  return paths.flatMap((path) => {
    if (Array.isArray(path.sequence)) {
      const sequence = remapPathSequence(path.sequence, memberToAggregate);
      if (sequence.length < 2) return [];
      return [{ ...cloneDeep(path), sequence }];
    }
    if (!path.source || !path.target) return [cloneDeep(path)];
    const source = visibleNodeId(path.source, memberToAggregate);
    const target = visibleNodeId(path.target, memberToAggregate);
    if (source === target) return [];
    return [{ ...cloneDeep(path), source, target }];
  });
}

function remapRegions(regions: readonly GraphRegion[], memberToAggregate: Map<string, string>, collapsedRegionIds: Set<string>): GraphRegion[] {
  return regions.flatMap((region) => {
    if (collapsedRegionIds.has(region.id)) return [];
    const members = uniqueIds((region.members || []).map((id) => visibleNodeId(id, memberToAggregate)));
    return [{
      ...cloneDeep(region),
      members: [...members]
    }];
  });
}

export function deriveAggregateGraph(source: TopoDocument, index: AttentionGraphIndex, options: DeriveAggregateGraphOptions): AggregateGraphResult<TopoDocument> {
  const graph = source.graph || {};
  const nodes = graph.nodes || [];
  const links = graph.links || [];
  const expanded = new Set(options.expandedGroupIds || []);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const memberToAggregate = new Map<string, string>();
  const collapsedRegionIds = new Set<string>();
  const summaries: AggregateGroupSummary[] = [];
  const aggregateNodes: GraphNode[] = [];

  options.groups.forEach((group) => {
    if (expanded.has(group.id)) return;
    const memberIds = memberIdsForGroup(index, group);
    if (!memberIds.length) return;
    const summary: AggregateGroupSummary = {
      id: group.id,
      aggregateNodeId: aggregateNodeId(group.id),
      by: group.by,
      sourceId: sourceIdForGroup(group),
      memberIds,
      childCount: memberIds.length,
      linkCount: groupLinkCount(memberIds, links),
      severitySummary: severitySummary(memberIds, nodeById)
    };
    summaries.push(summary);
    aggregateNodes.push(createAggregateNode(group, summary, nodeById));
    memberIds.forEach((id) => {
      if (!memberToAggregate.has(id)) memberToAggregate.set(id, summary.aggregateNodeId);
    });
    if (group.by === 'region') collapsedRegionIds.add(group.regionId);
  });

  const hiddenMembers = new Set(memberToAggregate.keys());
  const visibleNodes = nodes.filter((node) => !hiddenMembers.has(node.id)).map((node) => cloneDeep(node));
  const groupedLinks = groupParallelLinks(remapLinks(links, memberToAggregate), options.linkGrouping);
  const derivedDocument: TopoDocument = {
    ...cloneDeep(source),
    graph: {
      ...cloneDeep(graph),
      nodes: [...aggregateNodes, ...visibleNodes],
      links: groupedLinks.links,
      paths: remapPaths(graph.paths || [], memberToAggregate),
      regions: remapRegions(graph.regions || [], memberToAggregate, collapsedRegionIds)
    },
    stylesheet: [
      ...(source.stylesheet || []).map((rule) => cloneDeep(rule)),
      AGGREGATE_STYLE_RULE,
      LINK_AGGREGATE_STYLE_RULE
    ]
  };

  return Object.freeze({
    document: derivedDocument,
    groups: Object.freeze(summaries.map((summary) => Object.freeze({
      ...summary,
      memberIds: Object.freeze([...summary.memberIds]),
      severitySummary: Object.freeze({ ...summary.severitySummary })
    }))),
    linkGroups: Object.freeze(groupedLinks.groups.map((summary) => Object.freeze({
      ...summary,
      layers: Object.freeze([...summary.layers]),
      memberIds: Object.freeze([...summary.memberIds])
    })))
  });
}
