import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from 'd3-force';
import type { GraphLink, GraphNode, LayoutConfig } from './types';

export interface LayoutPosition {
  x: number;
  y: number;
}

export type LayoutPositions = Map<string, LayoutPosition>;

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

function seededRandom(seed = 42): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function computeLayoutPositions(nodes: GraphNode[], links: GraphLink[], layout: LayoutConfig = {}): LayoutPositions {
  const mode = layout.mode || 'force';
  const positions: LayoutPositions = new Map();

  nodes.forEach((node, index) => {
    const fallback = {
      x: 160 + (index % 6) * 160,
      y: 120 + Math.floor(index / 6) * 120
    };
    positions.set(node.id, node.position ? normalizePosition(node.position) : fallback);
  });

  if (mode === 'manual' || nodes.length === 0) return positions;

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

  for (let index = 0; index < (layout.iterations || 180); index += 1) {
    simulation.tick();
  }

  simulationNodes.forEach((node) => {
    positions.set(node.id, {
      x: Number(node.x || 0),
      y: Number(node.y || 0)
    });
  });

  return positions;
}
