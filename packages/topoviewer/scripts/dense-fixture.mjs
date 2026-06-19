export const DEFAULT_DENSE_SIZES = [1000, 5000, 10000];

const VENDORS = ['nokia', 'juniper', 'cisco', 'arista'];
const REGIONAL_NAMES = ['north', 'east', 'west', 'south', 'central', 'metro-a', 'metro-b', 'metro-c'];

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

function regionSlug(index) {
  return REGIONAL_NAMES[index] || `region-${index + 1}`;
}

function regionalNodeId(region, ring, role, index) {
  return `${region}-r${String(ring + 1).padStart(2, '0')}-${role}${String(index + 1).padStart(2, '0')}`;
}

function regionalSeverity(regionIndex, ring, index, role) {
  if (role === 'pe' && (regionIndex + ring + index) % 5 === 0) return 'major';
  if (role === 'edge' && (regionIndex * 31 + ring * 7 + index) % 37 === 0) return 'critical';
  if ((ring + index) % 17 === 0) return 'minor';
  return 'normal';
}

function regionalPosition(regionIndex, ring, slot, slotsPerRing, ringsPerRegion) {
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(regionIndex + 1))));
  const regionColumn = regionIndex % columns;
  const regionRow = Math.floor(regionIndex / columns);
  const centerX = 760 + regionColumn * 1720;
  const centerY = 760 + regionRow * 1580;
  const radius = 130 + ring * 64;
  const angle = ((Math.PI * 2) / slotsPerRing) * slot + (ring % 2 ? Math.PI / slotsPerRing : 0);
  const jitter = ring === ringsPerRegion - 1 ? 0 : (slot % 2) * 8;
  return [
    Math.round(centerX + Math.cos(angle) * (radius + jitter)),
    Math.round(centerY + Math.sin(angle) * (radius + jitter))
  ];
}

function createRegionalDenseNodes(options) {
  const regions = Number(options.regions || 3);
  const ringsPerRegion = Number(options.ringsPerRegion || 10);
  const edgeNodesPerRing = Number(options.edgeNodesPerRing || 8);
  const aggregationNodesPerRing = Number(options.aggregationNodesPerRing || 2);
  const peRoutersPerRegion = Number(options.peRoutersPerRegion || 4);
  const slotsPerRing = edgeNodesPerRing + aggregationNodesPerRing;
  const nodes = [];
  const regionMembers = new Map();
  const regionPes = new Map();

  for (let regionIndex = 0; regionIndex < regions; regionIndex += 1) {
    const region = regionSlug(regionIndex);
    const members = [];
    const pes = [];

    for (let ring = 0; ring < ringsPerRegion; ring += 1) {
      for (let agg = 0; agg < aggregationNodesPerRing; agg += 1) {
        const globalAggIndex = ring * aggregationNodesPerRing + agg;
        const role = globalAggIndex < peRoutersPerRegion ? 'pe' : 'aggregation';
        const id = regionalNodeId(region, ring, role === 'pe' ? 'pe' : 'agg', agg);
        if (role === 'pe') pes.push(id);
        members.push(id);
        nodes.push({
          id,
          name: `${region.toUpperCase()} ${role === 'pe' ? 'PE' : 'AGG'} ${ring + 1}.${agg + 1}`,
          labels: {
            role,
            region,
            ring: String(ring + 1),
            vendor: VENDORS[(regionIndex + ring + agg) % VENDORS.length]
          },
          layers: ['physical', 'transport'],
          position: regionalPosition(regionIndex, ring, agg, slotsPerRing, ringsPerRegion),
          data: {
            severity: regionalSeverity(regionIndex, ring, agg, role),
            status: role === 'pe' ? 'backbone' : 'up',
            metrics: {
              fanout: role === 'pe' ? regions * peRoutersPerRegion : edgeNodesPerRing,
              ring: ring + 1
            }
          }
        });
      }

      for (let edge = 0; edge < edgeNodesPerRing; edge += 1) {
        const id = regionalNodeId(region, ring, 'edge', edge);
        members.push(id);
        nodes.push({
          id,
          name: `${region.toUpperCase()} EDGE ${ring + 1}.${edge + 1}`,
          labels: {
            role: 'edge',
            region,
            ring: String(ring + 1),
            vendor: VENDORS[(regionIndex + ring + edge + 2) % VENDORS.length]
          },
          layers: ['physical'],
          position: regionalPosition(regionIndex, ring, aggregationNodesPerRing + edge, slotsPerRing, ringsPerRegion),
          data: {
            severity: regionalSeverity(regionIndex, ring, edge, 'edge'),
            status: 'up',
            metrics: {
              fanout: 1,
              ring: ring + 1
            }
          }
        });
      }
    }

    regionMembers.set(region, members);
    regionPes.set(region, pes);
  }

  return { nodes, regionMembers, regionPes };
}

function createRegionalDenseLinks(options, regionMembers, regionPes) {
  const ringsPerRegion = Number(options.ringsPerRegion || 10);
  const edgeNodesPerRing = Number(options.edgeNodesPerRing || 8);
  const aggregationNodesPerRing = Number(options.aggregationNodesPerRing || 2);
  const links = [];

  for (const region of regionMembers.keys()) {
    for (let ring = 0; ring < ringsPerRegion; ring += 1) {
      const ringAggs = Array.from({ length: aggregationNodesPerRing }, (_value, agg) => {
        const globalAggIndex = ring * aggregationNodesPerRing + agg;
        return regionalNodeId(region, ring, globalAggIndex < Number(options.peRoutersPerRegion || 4) ? 'pe' : 'agg', agg);
      });
      const ringEdges = Array.from({ length: edgeNodesPerRing }, (_value, edge) => regionalNodeId(region, ring, 'edge', edge));
      const ringNodes = [...ringAggs, ...ringEdges];

      ringNodes.forEach((source, index) => {
        const target = ringNodes[(index + 1) % ringNodes.length];
        links.push({
          id: `${region}-r${String(ring + 1).padStart(2, '0')}-ring-${String(index + 1).padStart(2, '0')}`,
          name: `${region.toUpperCase()} ring ${ring + 1} segment ${index + 1}`,
          source,
          target,
          labels: { relation: 'ring' },
          layers: ['physical'],
          data: { severity: 'normal', utilization: (ring * 11 + index * 7) % 100 }
        });
      });

      ringEdges.forEach((edgeId, index) => {
        const target = ringAggs[index % ringAggs.length];
        links.push({
          id: `${edgeId}-uplink`,
          name: `${edgeId.toUpperCase()} uplink`,
          source: edgeId,
          target,
          labels: { relation: 'edge-uplink' },
          layers: ['physical'],
          data: { severity: index % 7 === 0 ? 'minor' : 'normal', utilization: (ring * 13 + index * 17) % 100 }
        });
      });

      if (ring < ringsPerRegion - 1) {
        ringAggs.forEach((aggId, agg) => {
          const nextGlobalAggIndex = (ring + 1) * aggregationNodesPerRing + agg;
          const nextRole = nextGlobalAggIndex < Number(options.peRoutersPerRegion || 4) ? 'pe' : 'agg';
          links.push({
            id: `${aggId}-to-r${String(ring + 2).padStart(2, '0')}`,
            name: `${region.toUpperCase()} ring ${ring + 1}-${ring + 2} spine ${agg + 1}`,
            source: aggId,
            target: regionalNodeId(region, ring + 1, nextRole, agg),
            labels: { relation: 'ring-spine' },
            layers: ['physical'],
            data: { severity: 'normal', utilization: (ring * 19 + agg * 23) % 100 }
          });
        });
      }
    }

    const pes = regionPes.get(region) || [];
    for (let left = 0; left < pes.length; left += 1) {
      for (let right = left + 1; right < pes.length; right += 1) {
        links.push({
          id: `${pes[left]}-${pes[right]}-mesh`,
          name: `${region.toUpperCase()} PE mesh ${left + 1}-${right + 1}`,
          source: pes[left],
          target: pes[right],
          labels: { relation: 'regional-pe-mesh' },
          layers: ['transport'],
          data: { severity: 'normal', utilization: ((left + 1) * (right + 3) * 9) % 100 }
        });
      }
    }
  }

  const regionIds = [...regionPes.keys()];
  for (let leftRegion = 0; leftRegion < regionIds.length; leftRegion += 1) {
    for (let rightRegion = leftRegion + 1; rightRegion < regionIds.length; rightRegion += 1) {
      const leftPes = regionPes.get(regionIds[leftRegion]) || [];
      const rightPes = regionPes.get(regionIds[rightRegion]) || [];
      leftPes.forEach((leftPe, leftIndex) => {
        rightPes.forEach((rightPe, rightIndex) => {
          links.push({
            id: `${leftPe}-${rightPe}-inter-region`,
            name: `${regionIds[leftRegion].toUpperCase()}-${regionIds[rightRegion].toUpperCase()} PE full mesh ${leftIndex + 1}-${rightIndex + 1}`,
            source: leftPe,
            target: rightPe,
            labels: { relation: 'inter-region-full-mesh' },
            layers: ['transport'],
            data: {
              severity: (leftIndex + rightIndex + leftRegion + rightRegion) % 11 === 0 ? 'major' : 'normal',
              utilization: (leftIndex * 29 + rightIndex * 31 + rightRegion * 17) % 100
            }
          });
        });
      });
    }
  }

  return links;
}

function createRegionalDenseRegions(regionMembers) {
  return [...regionMembers.entries()].map(([region, members], index) => ({
    id: `region-${region}`,
    name: `${region.toUpperCase()} metro`,
    label: `${region.toUpperCase()} metro`,
    members,
    labels: {
      geography: 'metro',
      region
    },
    layers: ['physical', 'transport'],
    padding: 90,
    minWidth: 1350,
    minHeight: 1350,
    data: {
      severity: index === 1 ? 'major' : 'normal',
      status: index === 1 ? 'degraded' : 'up'
    }
  }));
}

function regionalDenseStylesheet() {
  return {
    icons: {
      pe: { glyph: 'PE', fill: '#7c3aed', stroke: '#ddd6fe' },
      agg: { glyph: 'A', fill: '#0369a1', stroke: '#bae6fd' },
      edge: { glyph: 'E', fill: '#0f766e', stroke: '#ccfbf1' }
    },
    labelFields: ['name', 'label', 'count'],
    stylesheet: [
      {
        selector: 'node',
        style: {
          width: 42,
          height: 34,
          borderWidth: 1.4,
          labelFontSize: 9,
          labelColor: 'var(--topoviewer-fg-muted)'
        }
      },
      {
        selector: 'node[labels.role="pe"]',
        style: {
          icon: 'pe',
          width: 58,
          height: 42,
          borderWidth: 2.4,
          labelFontWeight: 800,
          labelColor: '#4c1d95'
        }
      },
      {
        selector: 'node[labels.role="aggregation"]',
        style: {
          icon: 'agg',
          width: 50,
          height: 38,
          borderWidth: 2
        }
      },
      {
        selector: 'node[labels.role="edge"]',
        style: {
          icon: 'edge'
        }
      },
      {
        selector: 'node[isAggregate = "true"]',
        style: {
          width: 160,
          height: 92,
          backgroundColor: '#1e1b4b',
          borderColor: '#c4b5fd',
          borderWidth: 3,
          labelColor: '#f5f3ff',
          labelFontSize: 15,
          labelFontWeight: 900
        }
      },
      {
        selector: 'link',
        style: {
          curveStyle: 'bezier',
          controlPointStepSize: 36,
          lineColor: '#94a3b8',
          lineWidth: 1.2,
          targetArrowShape: 'none',
          opacity: 0.5
        }
      },
      {
        selector: 'link[labels.relation="inter-region-full-mesh"]',
        style: {
          lineColor: '#7c3aed',
          lineWidth: 1.8,
          opacity: 0.42
        }
      },
      {
        selector: 'link[aggregate = "true"]',
        style: {
          lineColor: '#7c3aed',
          lineWidth: 4,
          lineDashPattern: '12 6',
          opacity: 0.9
        }
      },
      {
        selector: 'link[isLinkAggregate = "true"]',
        style: {
          lineColor: '#7c3aed',
          lineWidth: 4,
          lineDashPattern: '12 6',
          labelColor: '#312e81',
          textBackgroundColor: '#ede9fe',
          textBackgroundOpacity: 0.96,
          opacity: 0.95
        }
      },
      {
        selector: 'region',
        style: {
          backgroundColor: '#0ea5e91a',
          borderColor: '#38bdf8aa',
          borderWidth: 1.2,
          borderRadius: 8,
          zIndex: -30
        }
      }
    ]
  };
}

export function createRegionalDenseTopology(options = {}) {
  const regions = Number(options.regions || 3);
  const ringsPerRegion = Number(options.ringsPerRegion || 10);
  const edgeNodesPerRing = Number(options.edgeNodesPerRing || 8);
  const aggregationNodesPerRing = Number(options.aggregationNodesPerRing || 2);
  const peRoutersPerRegion = Number(options.peRoutersPerRegion || 4);

  if (!Number.isInteger(regions) || regions < 2) {
    throw new Error(`Regional dense topology requires at least two regions; received "${options.regions}".`);
  }

  const { nodes, regionMembers, regionPes } = createRegionalDenseNodes({
    regions,
    ringsPerRegion,
    edgeNodesPerRing,
    aggregationNodesPerRing,
    peRoutersPerRegion
  });
  const links = createRegionalDenseLinks({
    ringsPerRegion,
    edgeNodesPerRing,
    aggregationNodesPerRing,
    peRoutersPerRegion
  }, regionMembers, regionPes);
  const graphRegions = createRegionalDenseRegions(regionMembers);
  const nodeCount = nodes.length;

  return {
    topology: {
      version: '1.0',
      graph: {
        id: `dense-regional-${regions}x${nodeCount / regions}`,
        layers: [
          { id: 'physical', name: 'Physical' },
          { id: 'transport', name: 'Transport' }
        ],
        nodes,
        links,
        regions: graphRegions
      },
      attention: {
        aggregate: {
          groups: graphRegions.map((region) => ({
            id: region.id,
            by: 'region',
            regionId: region.id,
            label: region.label || region.name
          })),
          expandOnClick: true
        },
        links: {
          grouping: {
            enabled: true,
            threshold: 2,
            by: ['endpoints', 'layer'],
            expandOnClick: true
          }
        }
      },
      layout: {
        mode: 'manual',
        width: Math.min(3, regions) * 1720 + 360,
        height: Math.ceil(regions / Math.min(3, regions)) * 1580 + 220
      },
      limits: {
        maxNodes: nodeCount + graphRegions.length + 25,
        maxEdges: links.length + 100,
        maxPathSegments: 100,
        maxLabels: nodeCount + links.length + graphRegions.length + 100,
        maxCallouts: 1,
        maxShapes: 1,
        maxImageBytes: 1
      }
    },
    stylesheet: regionalDenseStylesheet()
  };
}
