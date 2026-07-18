import type { ClosInferLabelRole, ClosLayoutOptions, GraphLink, GraphNode, LayoutConfig } from './types';

interface LayoutPosition {
  x: number;
  y: number;
}

type LayoutPositions = Map<string, LayoutPosition>;

type StageHint = number | string | undefined;

interface NodeState {
  id: string;
  node: GraphNode;
  stage: number;
  groupId: string;
}

export interface ClosLayoutDiagnostic {
  code: 'clos-low-confidence-inference' | 'clos-conflicting-stage-hints' | 'clos-max-stages-reached';
  message: string;
  path?: string;
}

interface LayoutAxis {
  primarySize: number;
  secondarySize: number;
  write(primary: number, secondary: number): LayoutPosition;
}

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_MAX_STAGES = 10;
const DEFAULT_NODE_GAP = 132;
const DEFAULT_GROUP_GAP = 180;
const DEFAULT_STAGE_MARGIN = 88;

const AUTO_STAGE_PATHS = [
  'labels.stage',
  'data.stage',
  'labels.closStage',
  'data.closStage',
  'labels.level',
  'data.level',
  'labels.tier',
  'data.tier'
];

const AUTO_GROUP_PATHS = [
  'labels.group',
  'data.group',
  'labels.pod',
  'data.pod',
  'labels.zone',
  'data.zone',
  'labels.rack',
  'data.rack',
  'labels.site',
  'data.site'
];

const COMMON_STAGE_ORDER = new Map<string, number>([
  ['super-spine', 0],
  ['superspine', 0],
  ['super_spine', 0],
  ['core', 0],
  ['spine', 1],
  ['distribution', 1],
  ['leaf', 2],
  ['access', 2],
  ['tor', 3],
  ['edge', 3],
  ['server', 4],
  ['workload', 5]
]);

function normalizePosition(position: GraphNode['position']): LayoutPosition | undefined {
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') return { x: Number(position.x || 0), y: Number(position.y || 0) };
  return undefined;
}

function stableLabel(node: GraphNode): string {
  return String(node.labels?.name ?? node.id);
}

function compareNode(a: GraphNode, b: GraphNode): number {
  return stableLabel(a).localeCompare(stableLabel(b)) || a.id.localeCompare(b.id);
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function readPath(node: GraphNode, path: string): unknown {
  const parts = path.split('.').filter(Boolean);
  let current: unknown = node;
  for (const part of parts) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function parseNumericStage(value: string): number | undefined {
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const stageMatch = trimmed.match(/^(?:stage|level|tier)[-_ ]?(\d+)$/i);
  if (stageMatch) return Number(stageMatch[1]);
  return undefined;
}

function normalizeStageText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function stageOrderMap(order: string[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  (order || []).forEach((value, index) => {
    map.set(normalizeStageText(value), index);
  });
  return map;
}

function stageNameIndex(stageName: string): number | undefined {
  const normalized = normalizeStageText(stageName);
  const match = normalized.match(/^stage-(\d+)$/);
  if (match) return Math.max(0, Number(match[1]) - 1);
  return parseNumericStage(stageName);
}

function inferLabelRoleMap(value: ClosInferLabelRole | undefined): Map<string, number> {
  const map = new Map<string, number>();
  const entries = Array.isArray(value)
    ? value.flatMap((entry) => Object.entries(entry))
    : Object.entries(value || {});

  entries.forEach(([stageName, roleValues]) => {
    const stage = stageNameIndex(stageName);
    if (stage === undefined) return;
    const values = Array.isArray(roleValues) ? roleValues : [roleValues];
    values.forEach((roleValue) => {
      map.set(normalizeStageText(roleValue), stage);
    });
  });

  return map;
}

function nodeClassifierValues(node: GraphNode): string[] {
  const values: string[] = [];
  const entityType = (node as GraphNode & { type?: unknown }).type;
  [entityType, ...(node.labels ? Object.values(node.labels) : []), ...(node.data ? Object.values(node.data) : [])]
    .forEach((value) => {
      const text = scalarString(value);
      if (text) values.push(normalizeStageText(text));
    });
  return values;
}

function inferLabelRoleStage(node: GraphNode, layout: LayoutConfig, options: ClosLayoutOptions): number | undefined {
  const roleMap = inferLabelRoleMap(options.inferLabelRole || layout.inferLabelRole);
  if (!roleMap.size) return undefined;
  for (const value of nodeClassifierValues(node)) {
    const stage = roleMap.get(value);
    if (stage !== undefined) return stage;
  }
  return undefined;
}

function topLevelInferLabelRoleStage(node: GraphNode, layout: LayoutConfig): number | undefined {
  const roleMap = inferLabelRoleMap(layout.inferLabelRole);
  if (!roleMap.size) return undefined;
  for (const value of nodeClassifierValues(node)) {
    const stage = roleMap.get(value);
    if (stage !== undefined) return stage;
  }
  return undefined;
}

function closInferLabelRoleStage(node: GraphNode, options: ClosLayoutOptions): number | undefined {
  const roleMap = inferLabelRoleMap(options.inferLabelRole);
  if (!roleMap.size) return undefined;
  for (const value of nodeClassifierValues(node)) {
    const stage = roleMap.get(value);
    if (stage !== undefined) return stage;
  }
  return undefined;
}

function stageHintFromValue(value: unknown, order: Map<string, number>, allowArbitraryText: boolean): StageHint {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = scalarString(value);
  if (!text) return undefined;
  const numeric = parseNumericStage(text);
  if (numeric !== undefined) return numeric;
  const normalized = normalizeStageText(text);
  if (order.has(normalized)) return order.get(normalized);
  if (COMMON_STAGE_ORDER.has(normalized)) return COMMON_STAGE_ORDER.get(normalized);
  return allowArbitraryText ? text : undefined;
}

function stageHint(node: GraphNode, layout: LayoutConfig, options: ClosLayoutOptions): StageHint {
  const roleStage = inferLabelRoleStage(node, layout, options);
  if (roleStage !== undefined) return roleStage;

  const order = stageOrderMap(options.stageOrder);
  const hasExplicitStageKey = Boolean(options.stageKey && options.stageKey !== 'auto');
  const paths = hasExplicitStageKey ? [options.stageKey as string] : AUTO_STAGE_PATHS;
  for (const path of paths) {
    const hint = stageHintFromValue(readPath(node, path), order, hasExplicitStageKey);
    if (hint !== undefined) return hint;
  }
  return undefined;
}

function explicitStageKeyHint(node: GraphNode, options: ClosLayoutOptions): number | undefined {
  if (!options.stageKey || options.stageKey === 'auto') return undefined;
  const hint = stageHintFromValue(readPath(node, options.stageKey), stageOrderMap(options.stageOrder), false);
  return typeof hint === 'number' ? hint : undefined;
}

function degreeStageAssignments(nodes: GraphNode[], links: GraphLink[]): Map<string, number> | undefined {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const degree = new Map(nodes.map((node) => [node.id, 0]));
  links.forEach((link) => {
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return;
    degree.set(link.source, (degree.get(link.source) || 0) + 1);
    degree.set(link.target, (degree.get(link.target) || 0) + 1);
  });

  const degreeValues = [...new Set(degree.values())].sort((a, b) => a - b);
  if (degreeValues.length < 2) return undefined;
  const stageByDegree = new Map(degreeValues.map((value, index) => [value, index]));
  return new Map(nodes.map((node) => [node.id, stageByDegree.get(degree.get(node.id) || 0) ?? 0]));
}

function groupHint(node: GraphNode, options: ClosLayoutOptions): string | undefined {
  const paths = options.groupKey && options.groupKey !== 'auto' ? [options.groupKey] : AUTO_GROUP_PATHS;
  for (const path of paths) {
    const value = scalarString(readPath(node, path));
    if (value) return value;
  }
  return undefined;
}

function adjacency(nodes: GraphNode[], links: GraphLink[]): Map<string, Set<string>> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const neighbors = new Map<string, Set<string>>();
  nodes.forEach((node) => neighbors.set(node.id, new Set()));
  links.forEach((link) => {
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return;
    neighbors.get(link.source)?.add(link.target);
    neighbors.get(link.target)?.add(link.source);
  });
  return neighbors;
}

function connectedComponents(nodes: GraphNode[], neighbors: Map<string, Set<string>>): string[][] {
  const remaining = new Set(nodes.map((node) => node.id));
  const components: string[][] = [];
  const idsByStableOrder = [...remaining].sort();

  for (const seed of idsByStableOrder) {
    if (!remaining.has(seed)) continue;
    const queue = [seed];
    const component: string[] = [];
    remaining.delete(seed);
    while (queue.length) {
      const id = queue.shift() as string;
      component.push(id);
      [...(neighbors.get(id) || [])].sort().forEach((neighborId) => {
        if (!remaining.has(neighborId)) return;
        remaining.delete(neighborId);
        queue.push(neighborId);
      });
    }
    components.push(component.sort());
  }

  return components;
}

function groupedByNeighborSignature(component: string[], neighbors: Map<string, Set<string>>): Map<string, string[]> {
  const componentSet = new Set(component);
  const groups = new Map<string, string[]>();
  component.forEach((id) => {
    const signature = [...(neighbors.get(id) || [])]
      .filter((neighborId) => componentSet.has(neighborId))
      .sort()
      .join('|');
    const group = groups.get(signature) || [];
    group.push(id);
    groups.set(signature, group);
  });
  return groups;
}

function farthestGroup(seed: string, groupNeighbors: Map<string, Set<string>>): string {
  const distances = bfs(seed, groupNeighbors);
  return [...distances.entries()]
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))[0]?.[0] || seed;
}

function bfs(seed: string, neighbors: Map<string, Set<string>>): Map<string, number> {
  const distances = new Map<string, number>([[seed, 0]]);
  const queue = [seed];
  while (queue.length) {
    const id = queue.shift() as string;
    const distance = distances.get(id) || 0;
    [...(neighbors.get(id) || [])].sort().forEach((neighborId) => {
      if (distances.has(neighborId)) return;
      distances.set(neighborId, distance + 1);
      queue.push(neighborId);
    });
  }
  return distances;
}

function inferredComponentStages(component: string[], neighbors: Map<string, Set<string>>): Map<string, number> {
  if (component.length <= 1) return new Map(component.map((id) => [id, 0]));

  const signatureGroups = groupedByNeighborSignature(component, neighbors);
  const groupIds = [...signatureGroups.keys()].sort();
  const groupByNode = new Map<string, string>();
  signatureGroups.forEach((members, groupId) => members.forEach((memberId) => groupByNode.set(memberId, groupId)));

  const groupNeighbors = new Map<string, Set<string>>();
  groupIds.forEach((groupId) => groupNeighbors.set(groupId, new Set()));
  component.forEach((id) => {
    const sourceGroup = groupByNode.get(id);
    if (!sourceGroup) return;
    (neighbors.get(id) || new Set()).forEach((neighborId) => {
      const targetGroup = groupByNode.get(neighborId);
      if (!targetGroup || targetGroup === sourceGroup) return;
      groupNeighbors.get(sourceGroup)?.add(targetGroup);
    });
  });

  const start = groupIds
    .sort((a, b) => ((groupNeighbors.get(a)?.size || 0) - (groupNeighbors.get(b)?.size || 0)) || a.localeCompare(b))[0];
  const end = farthestGroup(start, groupNeighbors);
  const groupDistances = bfs(end, groupNeighbors);
  const stages = new Map<string, number>();

  signatureGroups.forEach((members, groupId) => {
    const distance = groupDistances.get(groupId) ?? 0;
    members.forEach((memberId) => stages.set(memberId, distance));
  });

  return stages;
}

function directedStageAssignments(nodes: GraphNode[], links: GraphLink[]): Map<string, number> | undefined {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, Set<string>>();
  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    outgoing.set(node.id, new Set());
  });

  let validLinkCount = 0;
  links.forEach((link) => {
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target) || link.source === link.target) return;
    if (outgoing.get(link.source)?.has(link.target)) return;
    outgoing.get(link.source)?.add(link.target);
    incoming.set(link.target, (incoming.get(link.target) || 0) + 1);
    validLinkCount += 1;
  });
  if (!validLinkCount) return undefined;

  const queue = [...nodes]
    .filter((node) => (incoming.get(node.id) || 0) === 0)
    .sort(compareNode)
    .map((node) => node.id);
  if (!queue.length) return undefined;

  const ranks = new Map(nodes.map((node) => [node.id, 0]));
  let visited = 0;
  while (queue.length) {
    const id = queue.shift() as string;
    visited += 1;
    [...(outgoing.get(id) || [])].sort().forEach((targetId) => {
      ranks.set(targetId, Math.max(ranks.get(targetId) || 0, (ranks.get(id) || 0) + 1));
      incoming.set(targetId, (incoming.get(targetId) || 0) - 1);
      if ((incoming.get(targetId) || 0) === 0) queue.push(targetId);
    });
    queue.sort((a, b) => a.localeCompare(b));
  }

  if (visited !== nodes.length) return undefined;
  if (new Set(ranks.values()).size < 2) return undefined;
  return compactStageNumbers(ranks);
}

function compactStageNumbers(stageById: Map<string, number>): Map<string, number> {
  const unique = [...new Set(stageById.values())].sort((a, b) => a - b);
  const compact = new Map(unique.map((stage, index) => [stage, index]));
  const result = new Map<string, number>();
  stageById.forEach((stage, id) => result.set(id, compact.get(stage) ?? 0));
  return result;
}

function compressStageCount(stageById: Map<string, number>, maxStages: number): Map<string, number> {
  const compact = compactStageNumbers(stageById);
  const highestStage = Math.max(0, ...compact.values());
  if (highestStage + 1 <= maxStages) return compact;

  const result = new Map<string, number>();
  compact.forEach((stage, id) => {
    result.set(id, Math.round((stage / highestStage) * (maxStages - 1)));
  });
  return compactStageNumbers(result);
}

function stageAssignments(nodes: GraphNode[], links: GraphLink[], layout: LayoutConfig, options: ClosLayoutOptions): Map<string, number> {
  const hinted = new Map<string, StageHint>();
  nodes.forEach((node) => {
    const hint = stageHint(node, layout, options);
    if (hint !== undefined) hinted.set(node.id, hint);
  });

  const applyHints = (stages: Map<string, number>) => {
    const stringHints = [...hinted.values()].filter((value): value is string => typeof value === 'string');
    const stringOrder = new Map([...new Set(stringHints.map(normalizeStageText))].sort().map((value, index) => [value, index]));
    hinted.forEach((hint, id) => {
      if (hint === undefined) return;
      stages.set(id, typeof hint === 'number' ? hint : stringOrder.get(normalizeStageText(hint)) ?? 0);
    });
    return compactStageNumbers(stages);
  };

  if (hinted.size === nodes.length) {
    return applyHints(new Map());
  }

  const directed = directedStageAssignments(nodes, links);
  if (directed) return hinted.size ? applyHints(directed) : directed;

  const degree = degreeStageAssignments(nodes, links);
  const neighbors = adjacency(nodes, links);
  const stages = degree || new Map<string, number>();
  if (!degree) {
    connectedComponents(nodes, neighbors).forEach((component) => {
      const inferred = inferredComponentStages(component, neighbors);
      inferred.forEach((stage, id) => stages.set(id, stage));
    });
  }
  return hinted.size ? applyHints(stages) : compactStageNumbers(stages);
}

function effectiveMaxStages(options: ClosLayoutOptions): number {
  if (typeof options.stageCount === 'number' && Number.isFinite(options.stageCount)) return Math.max(1, Math.floor(options.stageCount));
  if (typeof options.maxStages === 'number' && Number.isFinite(options.maxStages)) return Math.max(1, Math.floor(options.maxStages));
  return DEFAULT_MAX_STAGES;
}

function uniqueStageCount(stages: Map<string, number>): number {
  return new Set(stages.values()).size;
}

function validLayoutLinks(nodes: GraphNode[], links: GraphLink[]): GraphLink[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  return links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target) && link.source !== link.target);
}

function conflictingStageHintDiagnostics(nodes: GraphNode[], layout: LayoutConfig, options: ClosLayoutOptions): ClosLayoutDiagnostic[] {
  const diagnostics: ClosLayoutDiagnostic[] = [];
  nodes.forEach((node, index) => {
    const stageKeyStage = explicitStageKeyHint(node, options);
    const topLevelRoleStage = topLevelInferLabelRoleStage(node, layout);
    const closRoleStage = closInferLabelRoleStage(node, options);

    if (stageKeyStage !== undefined && topLevelRoleStage !== undefined && stageKeyStage !== topLevelRoleStage) {
      diagnostics.push({
        code: 'clos-conflicting-stage-hints',
        message: `Node "${node.id}" has conflicting CLOS stage hints: layout.clos.stageKey resolves to stage ${stageKeyStage + 1}, but layout.inferLabelRole resolves to stage ${topLevelRoleStage + 1}.`,
        path: `graph.nodes[${index}]`
      });
    }

    if (stageKeyStage !== undefined && closRoleStage !== undefined && stageKeyStage !== closRoleStage) {
      diagnostics.push({
        code: 'clos-conflicting-stage-hints',
        message: `Node "${node.id}" has conflicting CLOS stage hints: layout.clos.stageKey resolves to stage ${stageKeyStage + 1}, but layout.clos.inferLabelRole resolves to stage ${closRoleStage + 1}.`,
        path: `graph.nodes[${index}]`
      });
    }

    if (topLevelRoleStage !== undefined && closRoleStage !== undefined && topLevelRoleStage !== closRoleStage) {
      diagnostics.push({
        code: 'clos-conflicting-stage-hints',
        message: `Node "${node.id}" has conflicting CLOS stage hints: layout.inferLabelRole resolves to stage ${topLevelRoleStage + 1}, but layout.clos.inferLabelRole resolves to stage ${closRoleStage + 1}.`,
        path: `graph.nodes[${index}]`
      });
    }
  });
  return diagnostics;
}

export function analyzeClosLayoutDiagnostics(nodes: GraphNode[], links: GraphLink[], layout: LayoutConfig = {}): ClosLayoutDiagnostic[] {
  if (layout.mode !== 'clos' || nodes.length < 2) return [];
  const options = layout.clos || {};
  const diagnostics = conflictingStageHintDiagnostics(nodes, layout, options);
  const validLinks = validLayoutLinks(nodes, links);
  const maxStages = effectiveMaxStages(options);
  const inferredStages = stageAssignments(nodes, validLinks, layout, options);
  const inferredStageCount = uniqueStageCount(inferredStages);

  if (inferredStageCount > maxStages) {
    diagnostics.push({
      code: 'clos-max-stages-reached',
      message: `CLOS layout inferred ${inferredStageCount} stages but layout.clos.maxStages allows ${maxStages}; later stages will be compacted into the configured cap.`,
      path: options.maxStages !== undefined ? 'layout.clos.maxStages' : options.stageCount !== undefined ? 'layout.clos.stageCount' : 'layout.clos'
    });
  }

  const hasDirectedHierarchy = Boolean(directedStageAssignments(nodes, validLinks));
  const hintedNodeCount = nodes.filter((node) => stageHint(node, layout, options) !== undefined).length;
  if (!hasDirectedHierarchy && hintedNodeCount < nodes.length && inferredStageCount < 2) {
    diagnostics.push({
      code: 'clos-low-confidence-inference',
      message: 'CLOS layout could not infer at least two stages from directed hierarchy, endpoint count, or explicit hints. Add directed links, layout.clos.stageKey, layout.clos.stageOrder, or use manual/force layout.',
      path: 'layout'
    });
  }

  return diagnostics;
}

function inferGroupId(state: Omit<NodeState, 'groupId'>, byId: Map<string, NodeState>, neighbors: Map<string, Set<string>>, options: ClosLayoutOptions): string {
  const explicit = groupHint(state.node, options);
  if (explicit) return explicit;

  const previous = [...(neighbors.get(state.id) || [])]
    .filter((id) => (byId.get(id)?.stage ?? state.stage) < state.stage)
    .sort()
    .join(',');
  const next = [...(neighbors.get(state.id) || [])]
    .filter((id) => (byId.get(id)?.stage ?? state.stage) > state.stage)
    .sort()
    .join(',');
  return `stage:${state.stage}|prev:${previous}|next:${next}`;
}

function barycenter(id: string, stage: number, direction: 'forward' | 'backward', order: Map<string, number>, states: Map<string, NodeState>, neighbors: Map<string, Set<string>>): number {
  const adjacent = [...(neighbors.get(id) || [])]
    .filter((neighborId) => {
      const neighborStage = states.get(neighborId)?.stage;
      if (neighborStage === undefined) return false;
      return direction === 'forward' ? neighborStage < stage : neighborStage > stage;
    })
    .map((neighborId) => order.get(neighborId))
    .filter((value): value is number => value !== undefined);
  if (!adjacent.length) return Number.POSITIVE_INFINITY;
  return adjacent.reduce((sum, value) => sum + value, 0) / adjacent.length;
}

function orderedStages(states: NodeState[], links: GraphLink[]): Map<number, NodeState[]> {
  const byId = new Map(states.map((state) => [state.id, state]));
  const neighbors = adjacency(states.map((state) => state.node), links);
  const stageIds = [...new Set(states.map((state) => state.stage))].sort((a, b) => a - b);
  const byStage = new Map<number, NodeState[]>();
  stageIds.forEach((stage) => {
    byStage.set(stage, states.filter((state) => state.stage === stage).sort((a, b) => compareNode(a.node, b.node)));
  });

  let order = new Map<string, number>();
  const refreshOrder = () => {
    order = new Map();
    stageIds.forEach((stage) => {
      (byStage.get(stage) || []).forEach((state, index) => order.set(state.id, index));
    });
  };
  refreshOrder();

  for (let pass = 0; pass < 3; pass += 1) {
    for (const direction of ['forward', 'backward'] as const) {
      const activeStages = direction === 'forward' ? stageIds : [...stageIds].reverse();
      activeStages.forEach((stage) => {
        const sorted = [...(byStage.get(stage) || [])].sort((a, b) => {
          const groupCompare = a.groupId.localeCompare(b.groupId);
          const aBarycenter = barycenter(a.id, stage, direction, order, byId, neighbors);
          const bBarycenter = barycenter(b.id, stage, direction, order, byId, neighbors);
          return (aBarycenter - bBarycenter) || groupCompare || compareNode(a.node, b.node);
        });
        byStage.set(stage, sorted);
      });
      refreshOrder();
    }
  }

  return byStage;
}

function axisFor(direction: ClosLayoutOptions['direction'], width: number, height: number): LayoutAxis {
  switch (direction) {
    case 'bottomToTop':
      return { primarySize: height, secondarySize: width, write: (primary, secondary) => ({ x: secondary, y: height - primary }) };
    case 'leftToRight':
      return { primarySize: width, secondarySize: height, write: (primary, secondary) => ({ x: primary, y: secondary }) };
    case 'rightToLeft':
      return { primarySize: width, secondarySize: height, write: (primary, secondary) => ({ x: width - primary, y: secondary }) };
    case 'topToBottom':
    default:
      return { primarySize: height, secondarySize: width, write: (primary, secondary) => ({ x: secondary, y: primary }) };
  }
}

function rowSecondaryCoordinates(row: NodeState[], center: number, nodeGap: number, groupGap: number): Map<string, number> {
  const distances: number[] = [];
  for (let index = 1; index < row.length; index += 1) {
    distances.push(row[index].groupId === row[index - 1].groupId ? nodeGap : groupGap);
  }
  const total = distances.reduce((sum, distance) => sum + distance, 0);
  let current = center - total / 2;
  const coordinates = new Map<string, number>();
  row.forEach((state, index) => {
    if (index > 0) current += distances[index - 1];
    coordinates.set(state.id, current);
  });
  return coordinates;
}

function stagePrimaryCoordinates(stages: number[], options: ClosLayoutOptions, axis: LayoutAxis): Map<number, number> {
  const stageGap = typeof options.stageGap === 'number'
    ? options.stageGap
    : (axis.primarySize - DEFAULT_STAGE_MARGIN * 2) / Math.max(1, stages.length - 1);
  const center = axis.primarySize / 2;
  const start = center - (stageGap * (stages.length - 1)) / 2;
  return new Map(stages.map((stage, index) => [stage, start + index * stageGap]));
}

export function computeClosLayoutPositions(nodes: GraphNode[], links: GraphLink[], layout: LayoutConfig = {}): LayoutPositions {
  const options = layout.clos || {};
  const stageById = compressStageCount(stageAssignments(nodes, links, layout, options), effectiveMaxStages(options));
  const neighbors = adjacency(nodes, links);
  const staged = nodes.map((node) => ({ id: node.id, node, stage: stageById.get(node.id) ?? 0 }));
  const stateById = new Map(staged.map((state) => [state.id, { ...state, groupId: '' }]));
  const states = staged.map((state) => ({
    ...state,
    groupId: inferGroupId(state, stateById, neighbors, options)
  }));

  const width = layout.width || DEFAULT_WIDTH;
  const height = layout.height || DEFAULT_HEIGHT;
  const axis = axisFor(options.direction || 'topToBottom', width, height);
  const nodeGap = typeof options.nodeGap === 'number' ? options.nodeGap : DEFAULT_NODE_GAP;
  const groupGap = typeof options.groupGap === 'number' ? options.groupGap : DEFAULT_GROUP_GAP;
  const ordered = orderedStages(states, links);
  const stageIds = [...ordered.keys()].sort((a, b) => a - b);
  const primaryByStage = stagePrimaryCoordinates(stageIds, options, axis);
  const positions: LayoutPositions = new Map();

  stageIds.forEach((stage) => {
    const row = ordered.get(stage) || [];
    const secondaryById = rowSecondaryCoordinates(row, axis.secondarySize / 2, nodeGap, groupGap);
    const primary = primaryByStage.get(stage) ?? axis.primarySize / 2;
    row.forEach((state) => {
      positions.set(state.id, axis.write(primary, secondaryById.get(state.id) ?? axis.secondarySize / 2));
    });
  });

  if (options.preservePinned) {
    const pinned = new Set(options.pinnedNodeIds || []);
    nodes.forEach((node) => {
      if (!pinned.has(node.id)) return;
      const position = normalizePosition(node.position);
      if (position) positions.set(node.id, position);
    });
  }

  return positions;
}
