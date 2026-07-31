import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import type { GraphLink, GraphNode, LayoutConfig } from './types';
import { computeClosLayoutPositions } from './closLayout';
import { computeTreeLayoutPositions } from './treeLayout';
import type { LayoutPosition, LayoutPositions } from './layoutTypes';

export type { LayoutPosition, LayoutPositions } from './layoutTypes';

export interface LayoutProviderInput {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
  readonly layout: Readonly<LayoutConfig>;
  readonly initialPositions: ReadonlyMap<string, LayoutPosition>;
}

export interface LayoutProvider {
  readonly mode: string;
  readonly compute: (input: LayoutProviderInput) => LayoutPositions;
}

export type LayoutProviderRegistry = ReadonlyMap<string, LayoutProvider>;

interface ForceNode {
  id: string;
  x: number;
  y: number;
}

function normalizePosition(position: GraphNode['position']): LayoutPosition {
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') return { x: Number(position.x || 0), y: Number(position.y || 0) };
  return { x: 0, y: 0 };
}

function initialPositions(nodes: readonly GraphNode[]): LayoutPositions {
  const positions: LayoutPositions = new Map();
  nodes.forEach((node, index) => {
    const fallback = {
      x: 160 + (index % 6) * 160,
      y: 120 + Math.floor(index / 6) * 120
    };
    positions.set(node.id, node.position ? normalizePosition(node.position) : fallback);
  });
  return positions;
}

function seededRandom(seed = 42): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function layoutProvider(mode: string, compute: LayoutProvider['compute']): LayoutProvider {
  return Object.freeze({ mode, compute });
}

const manualProvider = layoutProvider('manual', ({ initialPositions: positions }) => new Map(positions));

const forceProvider = layoutProvider('force', ({ nodes, links, layout, initialPositions: positions }) => {
    const width = layout.width || 1280;
    const height = layout.height || 720;
    const simulationNodes: ForceNode[] = nodes.map((node) => ({
      id: node.id,
      ...(positions.get(node.id) || { x: width / 2, y: height / 2 })
    }));
    const linkData = links
      .filter((link) => positions.has(link.source) && positions.has(link.target))
      .map((link) => ({ source: link.source, target: link.target }));

    const simulation = forceSimulation(simulationNodes)
      .randomSource(seededRandom())
      .force('link', forceLink<ForceNode, { source: string; target: string }>(linkData).id((node) => node.id).distance(layout.linkDistance || 160).strength(0.55))
      .force('charge', forceManyBody().strength(layout.chargeStrength || -520))
      .force('collide', forceCollide(layout.collideRadius || 58).strength(0.88))
      .force('center', forceCenter(width / 2, height / 2).strength(layout.centerStrength || 0.08))
      .stop();

    for (let index = 0; index < (layout.iterations || 180); index += 1) simulation.tick();

    return new Map(simulationNodes.map((node) => [node.id, {
      x: Number(node.x || 0),
      y: Number(node.y || 0)
    }]));
  });

const closProvider = layoutProvider(
  'clos',
  ({ nodes, links, layout }) => computeClosLayoutPositions([...nodes], [...links], layout)
);

const treeProvider = layoutProvider(
  'tree',
  ({ nodes, links, layout }) => computeTreeLayoutPositions(nodes, links, layout)
);

function readonlyRegistry(entries: readonly (readonly [string, LayoutProvider])[]): LayoutProviderRegistry {
  const values = new Map(entries);
  return Object.freeze({
    get size() { return values.size; },
    get: values.get.bind(values),
    has: values.has.bind(values),
    entries: values.entries.bind(values),
    keys: values.keys.bind(values),
    values: values.values.bind(values),
    forEach: values.forEach.bind(values),
    [Symbol.iterator]: values[Symbol.iterator].bind(values)
  });
}

export const BUILT_IN_LAYOUT_PROVIDERS: LayoutProviderRegistry = readonlyRegistry([
  ['manual', manualProvider],
  ['force', forceProvider],
  ['clos', closProvider],
  ['tree', treeProvider]
]);

export function computeLayoutPositions(
  nodes: GraphNode[],
  links: GraphLink[],
  layout: LayoutConfig = {},
  providers?: LayoutProviderRegistry
): LayoutPositions {
  const mode = layout.mode || 'force';
  const provider = providers?.get(mode) || BUILT_IN_LAYOUT_PROVIDERS.get(mode);
  if (!provider) {
    const registered = uniqueProviderIds(providers);
    throw new Error(`Unknown layout provider "${mode}". Registered providers: ${registered.join(', ')}.`);
  }
  const positions = initialPositions(nodes);
  if (nodes.length === 0) return positions;
  return provider.compute({ nodes, links, layout, initialPositions: positions });
}

function uniqueProviderIds(providers?: LayoutProviderRegistry): string[] {
  return [...new Set([...BUILT_IN_LAYOUT_PROVIDERS.keys(), ...(providers ? [...providers.keys()] : [])])].sort();
}
