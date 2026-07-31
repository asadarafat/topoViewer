import type { GraphLink, GraphNode, LayoutConfig, TreeLayoutDirection, TreeLayoutOptions } from './types';
import type { LayoutPositions } from './layoutTypes';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;
const DEFAULT_LEVEL_GAP = 160;
const DEFAULT_NODE_GAP = 160;
const DEFAULT_COMPONENT_GAP = 240;
const MARGIN = 64;

interface TreeComponent {
  readonly levels: ReadonlyMap<number, readonly string[]>;
  readonly maxWidth: number;
  readonly maxDepth: number;
}

function bounded(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, Number(value))) : fallback;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function adjacency(nodes: readonly GraphNode[], links: readonly GraphLink[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));
  const incomingCount = new Map(nodes.map((node) => [node.id, 0]));

  [...links]
    .filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target) && link.source !== link.target)
    .sort((left, right) => (
      left.source.localeCompare(right.source)
      || left.target.localeCompare(right.target)
      || left.id.localeCompare(right.id)
    ))
    .forEach((link) => {
      const targets = outgoing.get(link.source) || [];
      if (!targets.includes(link.target)) {
        targets.push(link.target);
        incomingCount.set(link.target, (incomingCount.get(link.target) || 0) + 1);
      }
    });

  outgoing.forEach((targets) => targets.sort((left, right) => left.localeCompare(right)));
  return { incomingCount, outgoing };
}

function components(nodes: readonly GraphNode[], links: readonly GraphLink[]): TreeComponent[] {
  const orderedIds = uniqueSorted(nodes.map((node) => node.id));
  const { incomingCount, outgoing } = adjacency(nodes, links);
  const visited = new Set<string>();
  const result: TreeComponent[] = [];

  const traverse = (root: string) => {
    if (visited.has(root)) return;
    const queue: Array<{ id: string; depth: number }> = [{ id: root, depth: 0 }];
    const levels = new Map<number, string[]>();
    let maxDepth = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current.id)) continue;
      visited.add(current.id);
      maxDepth = Math.max(maxDepth, current.depth);
      const row = levels.get(current.depth) || [];
      row.push(current.id);
      levels.set(current.depth, row);
      (outgoing.get(current.id) || []).forEach((target) => {
        if (!visited.has(target)) queue.push({ id: target, depth: current.depth + 1 });
      });
    }

    levels.forEach((ids) => ids.sort((left, right) => left.localeCompare(right)));
    result.push({
      levels,
      maxDepth,
      maxWidth: Math.max(1, ...[...levels.values()].map((ids) => ids.length))
    });
  };

  orderedIds.filter((id) => (incomingCount.get(id) || 0) === 0).forEach(traverse);
  orderedIds.forEach(traverse);
  return result;
}

function treeOptions(layout: LayoutConfig): Required<TreeLayoutOptions> {
  const options = layout.tree || {};
  const directions: readonly TreeLayoutDirection[] = ['topToBottom', 'bottomToTop', 'leftToRight', 'rightToLeft'];
  return {
    direction: directions.includes(options.direction || 'topToBottom') ? options.direction || 'topToBottom' : 'topToBottom',
    levelGap: bounded(options.levelGap, DEFAULT_LEVEL_GAP, 40, 1000),
    nodeGap: bounded(options.nodeGap, DEFAULT_NODE_GAP, 40, 800),
    componentGap: bounded(options.componentGap, DEFAULT_COMPONENT_GAP, 40, 1600)
  };
}

export function computeTreeLayoutPositions(
  nodes: readonly GraphNode[],
  links: readonly GraphLink[],
  layout: LayoutConfig = {}
): LayoutPositions {
  const options = treeOptions(layout);
  const vertical = options.direction === 'topToBottom' || options.direction === 'bottomToTop';
  const mainExtent = vertical ? layout.height || DEFAULT_HEIGHT : layout.width || DEFAULT_WIDTH;
  const crossExtent = vertical ? layout.width || DEFAULT_WIDTH : layout.height || DEFAULT_HEIGHT;
  const treeComponents = components(nodes, links);
  const componentWidths = treeComponents.map((component) => Math.max(options.nodeGap, (component.maxWidth - 1) * options.nodeGap));
  const totalWidth = componentWidths.reduce((total, width) => total + width, 0)
    + Math.max(0, treeComponents.length - 1) * options.componentGap;
  const crossStart = Math.max(MARGIN, (crossExtent - totalWidth) / 2);
  const maxDepth = Math.max(0, ...treeComponents.map((component) => component.maxDepth));
  const mainStart = Math.max(MARGIN, (mainExtent - maxDepth * options.levelGap) / 2);
  const positions: LayoutPositions = new Map();
  let componentStart = crossStart;

  treeComponents.forEach((component, componentIndex) => {
    const componentWidth = componentWidths[componentIndex];
    [...component.levels.entries()].sort(([left], [right]) => left - right).forEach(([depth, ids]) => {
      const rowWidth = Math.max(0, ids.length - 1) * options.nodeGap;
      const rowStart = componentStart + (componentWidth - rowWidth) / 2;
      ids.forEach((id, index) => {
        const cross = rowStart + index * options.nodeGap;
        const main = mainStart + depth * options.levelGap;
        if (options.direction === 'topToBottom') positions.set(id, { x: cross, y: main });
        if (options.direction === 'bottomToTop') positions.set(id, { x: cross, y: mainExtent - main });
        if (options.direction === 'leftToRight') positions.set(id, { x: main, y: cross });
        if (options.direction === 'rightToLeft') positions.set(id, { x: mainExtent - main, y: cross });
      });
    });
    componentStart += componentWidth + options.componentGap;
  });

  return positions;
}
