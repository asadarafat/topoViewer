const DEFAULT_NODE_COUNT = 1000;
const DEFAULT_STAGE_COUNT = 5;
const DEFAULT_GROUPS_PER_STAGE = 8;
const DEFAULT_FANOUT = 2;

function positiveInteger(value, fallback, name) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer; received "${value}".`);
  }
  return number;
}

function nodeId(stageIndex, index) {
  return `s${String(stageIndex + 1).padStart(2, '0')}-n${String(index + 1).padStart(4, '0')}`;
}

function linkId(source, target) {
  return `${source}--${target}`;
}

function stageWeights(stageCount) {
  const midpoint = (stageCount - 1) / 2;
  return Array.from({ length: stageCount }, (_value, index) => {
    return Math.max(1, Math.round((stageCount - Math.abs(index - midpoint)) * 100));
  });
}

function distributeNodes(nodeCount, stageCount) {
  const weights = stageWeights(stageCount);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((weight) => Math.max(1, Math.floor((nodeCount * weight) / totalWeight)));

  let remaining = nodeCount - counts.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  while (remaining > 0) {
    counts[cursor % counts.length] += 1;
    cursor += 1;
    remaining -= 1;
  }

  while (remaining < 0) {
    const largestIndex = counts
      .map((count, index) => ({ count, index }))
      .filter((entry) => entry.count > 1)
      .sort((a, b) => b.count - a.count || a.index - b.index)[0]?.index;
    if (largestIndex === undefined) break;
    counts[largestIndex] -= 1;
    remaining += 1;
  }

  return counts;
}

function addLink(linksById, source, target, stageIndex, relation) {
  const id = linkId(source, target);
  if (linksById.has(id)) return;
  linksById.set(id, {
    id,
    source,
    target,
    labels: {
      relation,
      group: `stage-${stageIndex + 1}-to-${stageIndex + 2}`
    }
  });
}

function createStageNodes(stageIndex, count, groupsPerStage) {
  return Array.from({ length: count }, (_value, index) => ({
    id: nodeId(stageIndex, index),
    name: `S${stageIndex + 1}-${index + 1}`,
    labels: {
      group: `group-${String(index % groupsPerStage).padStart(2, '0')}`,
      class: 'synthetic-clos'
    },
    data: {
      syntheticStageIndex: stageIndex,
      ordinal: index
    }
  }));
}

function createStageLinks(stageNodes, fanout) {
  const linksById = new Map();

  for (let stageIndex = 0; stageIndex < stageNodes.length - 1; stageIndex += 1) {
    const current = stageNodes[stageIndex];
    const next = stageNodes[stageIndex + 1];

    next.forEach((target, targetIndex) => {
      const source = current[(targetIndex * 7 + stageIndex) % current.length];
      addLink(linksById, source.id, target.id, stageIndex, 'coverage');
    });

    current.forEach((source, sourceIndex) => {
      for (let offset = 0; offset < fanout; offset += 1) {
        const target = next[(sourceIndex * fanout + offset * 11 + stageIndex) % next.length];
        addLink(linksById, source.id, target.id, stageIndex, 'fanout');
      }
    });
  }

  return [...linksById.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function createSyntheticClosGraph(options = {}) {
  const nodeCount = positiveInteger(options.nodes ?? options.nodeCount, DEFAULT_NODE_COUNT, 'nodes');
  const stageCount = positiveInteger(options.stages ?? options.stageCount, DEFAULT_STAGE_COUNT, 'stages');
  const groupsPerStage = positiveInteger(options.groupsPerStage, DEFAULT_GROUPS_PER_STAGE, 'groupsPerStage');
  const fanout = positiveInteger(options.fanout, DEFAULT_FANOUT, 'fanout');

  if (nodeCount < stageCount) {
    throw new Error(`nodes must be greater than or equal to stages; received ${nodeCount} nodes and ${stageCount} stages.`);
  }

  const stageCounts = distributeNodes(nodeCount, stageCount);
  const stageNodes = stageCounts.map((count, stageIndex) => createStageNodes(stageIndex, count, groupsPerStage));
  const nodes = stageNodes.flat();
  const links = createStageLinks(stageNodes, fanout);
  const expectedStageById = Object.fromEntries(stageNodes.flatMap((stage, stageIndex) => stage.map((node) => [node.id, stageIndex])));

  return {
    nodes,
    links,
    metadata: {
      nodeCount: nodes.length,
      linkCount: links.length,
      stageCount,
      stageCounts,
      groupsPerStage,
      fanout,
      expectedStageById
    }
  };
}

export function createSyntheticClosDocument(options = {}) {
  const graph = createSyntheticClosGraph(options);
  const width = Number(options.width || Math.max(1280, graph.metadata.stageCounts.reduce((largest, count) => Math.max(largest, count), 0) * 8));
  const height = Number(options.height || Math.max(720, graph.metadata.stageCount * 180));

  return {
    version: '1.0',
    graph: {
      id: `synthetic-clos-${graph.metadata.nodeCount}`,
      layers: [{ id: 'benchmark', name: 'Benchmark' }],
      nodes: graph.nodes.map((node) => ({ ...node, layers: ['benchmark'] })),
      links: graph.links.map((link) => ({ ...link, layers: ['benchmark'] }))
    },
    layout: {
      mode: 'clos',
      width,
      height,
      clos: {
        direction: 'topToBottom',
        nodeGap: 24,
        groupGap: 72,
        maxStages: graph.metadata.stageCount
      }
    },
    limits: {
      maxNodes: graph.metadata.nodeCount + 10,
      maxEdges: graph.metadata.linkCount + 10,
      maxPathSegments: 0,
      maxLabels: graph.metadata.nodeCount + graph.metadata.linkCount + 10
    },
    metadata: graph.metadata
  };
}
