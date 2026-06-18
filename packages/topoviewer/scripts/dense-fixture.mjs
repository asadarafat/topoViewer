export const DEFAULT_DENSE_SIZES = [1000, 5000, 10000];

const VENDORS = ['nokia', 'juniper', 'cisco', 'arista'];

function nodeId(index) {
  return `node-${String(index).padStart(5, '0')}`;
}

function roleFor(index) {
  if (index % 100 === 0) return 'core';
  if (index % 10 === 0) return 'distribution';
  return 'access';
}

function parentFor(index) {
  const role = roleFor(index);
  if (role === 'core') return undefined;
  if (role === 'distribution') return nodeId(Math.floor(index / 100) * 100);
  return nodeId(Math.floor(index / 10) * 10);
}

function severityFor(index) {
  if (index % 197 === 0) return 'critical';
  if (index % 89 === 0) return 'major';
  if (index % 37 === 0) return 'minor';
  return 'normal';
}

function statusFor(index) {
  if (index % 197 === 0) return 'down';
  if (index % 89 === 0) return 'degraded';
  if (index % 53 === 0) return 'maintenance';
  return 'up';
}

function positionFor(index) {
  const columns = 50;
  return [
    80 + (index % columns) * 72,
    80 + Math.floor(index / columns) * 54
  ];
}

function createNodes(nodeCount, regionCount) {
  return Array.from({ length: nodeCount }, (_value, index) => {
    const role = roleFor(index);
    const site = `site-${String(index % regionCount).padStart(2, '0')}`;
    const pod = `pod-${String(Math.floor(index / 100)).padStart(3, '0')}`;
    const parent = parentFor(index);
    return {
      id: nodeId(index),
      name: `Node ${String(index).padStart(5, '0')}`,
      label: role === 'access' ? undefined : `N${String(index).padStart(5, '0')}`,
      labels: {
        role,
        site,
        pod,
        vendor: VENDORS[index % VENDORS.length]
      },
      ...(parent ? { parent } : {}),
      layers: ['physical'],
      position: positionFor(index),
      data: {
        severity: severityFor(index),
        status: statusFor(index),
        health: statusFor(index) === 'up' ? 'ok' : 'attention',
        ...(index % 113 === 0 ? { changedAt: `2026-06-${String((index % 28) + 1).padStart(2, '0')}T12:00:00Z` } : {}),
        revision: `r${index % 41}`,
        metrics: {
          fanout: role === 'core' ? 100 : role === 'distribution' ? 10 : 1,
          utilization: (index * 17) % 100
        }
      }
    };
  });
}

function createLinks(nodeCount) {
  const links = [];
  for (let index = 0; index < nodeCount - 1; index += 1) {
    links.push({
      id: `chain-${String(index).padStart(5, '0')}`,
      source: nodeId(index),
      target: nodeId(index + 1),
      labels: { relation: 'chain' },
      layers: ['physical'],
      data: {
        severity: severityFor(index + 1),
        utilization: ((index + 1) * 19) % 100
      }
    });
  }

  for (let index = 1; index < nodeCount; index += 1) {
    const parent = parentFor(index);
    if (!parent || parent === nodeId(index - 1)) continue;
    links.push({
      id: `uplink-${String(index).padStart(5, '0')}`,
      source: parent,
      target: nodeId(index),
      labels: { relation: 'parent-uplink' },
      layers: ['physical'],
      data: {
        severity: severityFor(index),
        utilization: (index * 23) % 100
      }
    });
  }

  return links;
}

function createPaths(nodeCount) {
  const pathCount = Math.max(1, Math.min(80, Math.floor(nodeCount / 25)));
  const paths = [];

  for (let index = 0; index < pathCount; index += 1) {
    const start = (index * 17) % Math.max(1, nodeCount - 12);
    paths.push({
      id: `path-${String(index).padStart(4, '0')}`,
      name: `Service path ${index}`,
      sequence: Array.from({ length: 10 }, (_value, offset) => nodeId(start + offset)),
      labels: {
        service: index % 2 === 0 ? 'lsp' : 'vpn',
        tenant: `tenant-${index % 12}`
      },
      layers: ['physical'],
      data: {
        severity: severityFor(start),
        status: statusFor(start),
        revision: `p${index % 17}`
      }
    });
  }

  for (let index = 0; index < Math.min(12, pathCount); index += 1) {
    const parent = `path-${String(index).padStart(4, '0')}`;
    paths.push({
      id: `stitched-${String(index).padStart(4, '0')}`,
      source: nodeId((index * 19) % nodeCount),
      target: nodeId((index * 19 + 13) % nodeCount),
      parent,
      labels: {
        service: 'stitched-vpn',
        tenant: `tenant-${index % 12}`
      },
      layers: ['physical'],
      data: {
        severity: index % 5 === 0 ? 'major' : 'normal'
      }
    });
  }

  return paths;
}

function createRegions(nodeCount, regionCount) {
  const regions = Array.from({ length: regionCount }, (_value, index) => ({
    id: `region-site-${String(index).padStart(2, '0')}`,
    name: `Site ${String(index).padStart(2, '0')}`,
    label: `Site ${index}`,
    members: Array.from({ length: nodeCount }, (_item, nodeIndex) => nodeIndex)
      .filter((nodeIndex) => nodeIndex % regionCount === index)
      .map((nodeIndex) => nodeId(nodeIndex)),
    labels: {
      geography: 'site',
      site: `site-${String(index).padStart(2, '0')}`
    },
    layers: ['physical'],
    data: {
      severity: index % 7 === 0 ? 'major' : 'normal',
      status: index % 7 === 0 ? 'degraded' : 'up'
    }
  }));

  return [
    {
      id: 'region-backbone',
      name: 'Backbone',
      label: 'Backbone',
      members: regions.map((region) => region.id),
      labels: { geography: 'backbone' },
      layers: ['physical'],
      data: { severity: 'normal', status: 'up' }
    },
    ...regions
  ];
}

export function createDenseTopology(options = {}) {
  const nodeCount = Number(options.nodes || options.nodeCount || 1000);
  if (!Number.isInteger(nodeCount) || nodeCount < 1) {
    throw new Error(`Dense topology node count must be a positive integer; received "${options.nodes}".`);
  }

  const regionCount = Math.max(4, Math.min(24, Math.ceil(nodeCount / 250)));
  const nodes = createNodes(nodeCount, regionCount);
  const links = createLinks(nodeCount);
  const paths = createPaths(nodeCount);
  const regions = createRegions(nodeCount, regionCount);

  return {
    version: '1.0',
    graph: {
      id: `dense-${nodeCount}`,
      layers: [
        { id: 'physical', name: 'Physical' },
        { id: 'service', name: 'Service' }
      ],
      nodes,
      links,
      paths,
      regions
    },
    layout: {
      mode: 'manual',
      width: 3600,
      height: Math.max(1200, Math.ceil(nodeCount / 50) * 60)
    },
    limits: {
      maxNodes: nodeCount + 100,
      maxEdges: links.length + paths.length * 12 + 100,
      maxPathSegments: paths.length * 12,
      maxLabels: nodeCount + links.length + paths.length + regions.length + 100,
      maxCallouts: 1,
      maxShapes: 1,
      maxImageBytes: 1
    },
    stylesheet: [
      {
        selector: 'node[labels.role="core"]',
        style: { width: 92, height: 64, backgroundColor: '#244c7c', borderColor: '#dbeafe' }
      },
      {
        selector: 'node[labels.role="distribution"]',
        style: { width: 76, height: 54, backgroundColor: '#2f6f5e', borderColor: '#dcfce7' }
      },
      {
        selector: 'node[severity="critical"]',
        style: { borderColor: '#dc2626', borderWidth: 3 }
      },
      {
        selector: 'link[severity="critical"]',
        style: { lineColor: '#dc2626', lineWidth: 3 }
      },
      {
        selector: 'path[service="lsp"]',
        style: { lineColor: '#7c3aed', lineWidth: 2, lineDasharray: '8 4' }
      }
    ]
  };
}
