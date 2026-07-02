#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const [inventoryDir = '.artifacts/eda-kubernetes-inventory', outputFile = 'topology.yaml'] =
  process.argv.slice(2);

function readJson(fileName, fallback = { items: [] }) {
  const filePath = path.join(inventoryDir, fileName);
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function asItems(document) {
  if (Array.isArray(document?.items)) {
    return document.items;
  }
  if (document?.metadata?.name) {
    return [document];
  }
  return [];
}

function stableSegment(value) {
  return String(value ?? 'unknown')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function objectId(prefix, object) {
  const namespace = object.metadata?.namespace ?? 'cluster';
  const name = object.metadata?.name ?? object.kind ?? prefix;
  return `${prefix}-${stableSegment(namespace)}-${stableSegment(name)}`;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => {
      if (entryValue === undefined || entryValue === null || entryValue === '') {
        return false;
      }
      if (Array.isArray(entryValue) && entryValue.length === 0) {
        return false;
      }
      if (typeof entryValue === 'object' && !Array.isArray(entryValue) && Object.keys(entryValue).length === 0) {
        return false;
      }
      return true;
    }),
  );
}

function selectorMatches(selector = {}, labels = {}) {
  const entries = Object.entries(selector);
  return entries.length > 0 && entries.every(([key, value]) => labels[key] === value);
}

function formatPorts(ports = []) {
  return ports.map((port) => {
    const name = port.name ? `${port.name}:` : '';
    return `${name}${port.port}/${port.protocol ?? 'TCP'}`;
  });
}

function statusFromObject(object) {
  if (object.kind === 'Pod') {
    return object.status?.phase === 'Running' ? 'ready' : stableSegment(object.status?.phase ?? 'unknown');
  }
  if (object.kind === 'Deployment') {
    return object.status?.readyReplicas === object.status?.replicas ? 'ready' : 'degraded';
  }
  return 'ready';
}

function gridPosition(index, row, columnGap = 170, rowGap = 190) {
  return [120 + index * columnGap, 110 + row * rowGap];
}

function serviceNode(service, index) {
  return {
    id: objectId('svc', service),
    name: service.metadata?.name,
    labels: compactObject({
      object: 'service',
      namespace: service.metadata?.namespace,
      role: service.metadata?.labels?.app ?? service.metadata?.labels?.['eda.nokia.com/app'] ?? 'service',
      status: statusFromObject(service),
    }),
    data: compactObject({
      kind: service.kind,
      type: service.spec?.type,
      clusterIP: service.spec?.clusterIP,
      externalIPs: service.spec?.externalIPs,
      ports: formatPorts(service.spec?.ports),
      selector: service.spec?.selector,
    }),
    layers: ['control-plane'],
    position: gridPosition(index, 0),
  };
}

function deploymentNode(deployment, index) {
  return {
    id: objectId('deploy', deployment),
    name: deployment.metadata?.name,
    labels: compactObject({
      object: 'deployment',
      namespace: deployment.metadata?.namespace,
      role:
        deployment.metadata?.labels?.app ??
        deployment.metadata?.labels?.['eda.nokia.com/app'] ??
        'deployment',
      status: statusFromObject(deployment),
    }),
    data: compactObject({
      kind: deployment.kind,
      replicas: deployment.status?.replicas,
      readyReplicas: deployment.status?.readyReplicas,
      selector: deployment.spec?.selector?.matchLabels,
      containers: deployment.spec?.template?.spec?.containers?.map((container) => container.name),
      images: deployment.spec?.template?.spec?.containers?.map((container) => container.image),
    }),
    layers: ['control-plane'],
    position: gridPosition(index, 1),
  };
}

function podNode(pod, index) {
  return {
    id: objectId('pod', pod),
    name: pod.metadata?.labels?.['app.kubernetes.io/name'] ?? pod.metadata?.name,
    labels: compactObject({
      object: 'pod',
      namespace: pod.metadata?.namespace,
      role: pod.metadata?.labels?.app ?? pod.metadata?.labels?.['eda.nokia.com/app'] ?? 'pod',
      status: statusFromObject(pod),
    }),
    data: compactObject({
      kind: pod.kind,
      pod: pod.metadata?.name,
      phase: pod.status?.phase,
      podIP: pod.status?.podIP,
      node: pod.spec?.nodeName,
      containers: pod.spec?.containers?.map((container) => container.name),
      images: pod.spec?.containers?.map((container) => container.image),
    }),
    layers: ['control-plane'],
    position: gridPosition(index, 2),
  };
}

function edaResourceNode(resource, index) {
  const kind = resource.kind ?? 'Resource';
  const layer = /toponode|networktopology/i.test(kind) ? 'topology-runtime' : 'control-plane';
  return {
    id: objectId(`eda-${stableSegment(kind)}`, resource),
    name: resource.metadata?.name ?? kind,
    labels: compactObject({
      object: 'edaResource',
      namespace: resource.metadata?.namespace,
      role: stableSegment(kind),
      status: stableSegment(resource.status?.phase ?? resource.status?.state ?? resource.status?.operState ?? 'observed'),
    }),
    data: compactObject({
      kind,
      apiVersion: resource.apiVersion,
      workflow: resource.status?.workflow,
      platform: resource.status?.platform,
      version: resource.status?.version,
      rawStatus: resource.status,
    }),
    layers: [layer],
    position: gridPosition(index, layer === 'topology-runtime' ? 3 : 1),
  };
}

function region(id, name, members, layers) {
  return {
    id,
    name,
    labels: { region: 'generated' },
    members,
    layers,
    paddingX: 48,
    paddingY: 42,
  };
}

const services = asItems(readJson('services.json'));
const deployments = asItems(readJson('deployments.json'));
const pods = asItems(readJson('pods.json'));

const knownFiles = new Set([
  'services.json',
  'deployments.json',
  'pods.json',
  'workload-summary.txt',
  'eda-namespaced-resource-types.txt',
  'eda-cluster-resource-types.txt',
]);

const edaResources = fs.existsSync(inventoryDir)
  ? fs
      .readdirSync(inventoryDir)
      .filter((fileName) => fileName.endsWith('.json') && !knownFiles.has(fileName))
      .flatMap((fileName) => asItems(readJson(fileName)))
  : [];

const serviceNodes = services.map(serviceNode);
const deploymentNodes = deployments.map(deploymentNode);
const podNodes = pods.map(podNode);
const edaNodes = edaResources.map(edaResourceNode);

const deploymentByObject = new Map(deployments.map((deployment) => [objectId('deploy', deployment), deployment]));
const podByObject = new Map(pods.map((pod) => [objectId('pod', pod), pod]));

const links = [];

for (const service of services) {
  const selector = service.spec?.selector ?? {};
  for (const deployment of deployments) {
    const labels = deployment.spec?.template?.metadata?.labels ?? deployment.metadata?.labels ?? {};
    if (selectorMatches(selector, labels)) {
      links.push({
        id: `selects-${objectId('svc', service)}-${objectId('deploy', deployment)}`,
        name: 'selector',
        source: objectId('svc', service),
        target: objectId('deploy', deployment),
        labels: { link: 'selector', layer: 'control-plane' },
        data: { selector },
        layers: ['control-plane'],
      });
    }
  }
}

for (const [deploymentId, deployment] of deploymentByObject.entries()) {
  const selector = deployment.spec?.selector?.matchLabels ?? {};
  for (const [podId, pod] of podByObject.entries()) {
    if (selectorMatches(selector, pod.metadata?.labels ?? {})) {
      links.push({
        id: `owns-${deploymentId}-${podId}`,
        name: 'creates pod',
        source: deploymentId,
        target: podId,
        labels: { link: 'owns', layer: 'control-plane' },
        data: { selector },
        layers: ['control-plane'],
      });
    }
  }
}

const topologyRuntimeMembers = edaNodes
  .filter((node) => node.layers.includes('topology-runtime'))
  .map((node) => node.id);

const regions = [
  region('generated-services', 'Services', serviceNodes.map((node) => node.id), ['control-plane']),
  region(
    'generated-workloads',
    'Deployments and pods',
    [...deploymentNodes, ...podNodes].map((node) => node.id),
    ['control-plane'],
  ),
];

if (topologyRuntimeMembers.length > 0) {
  regions.push(region('generated-topology-runtime', 'Topology runtime', topologyRuntimeMembers, ['topology-runtime']));
}

const expandedGroupIds = regions.map((entry) => entry.id);

const topology = {
  graph: {
    id: 'generated-eda-kubernetes-service-map',
    layers: [
      { id: 'control-plane', name: 'Kubernetes control plane' },
      { id: 'topology-runtime', name: 'Topology runtime' },
    ],
    nodes: [...serviceNodes, ...deploymentNodes, ...podNodes, ...edaNodes],
    links,
    regions,
  },
  attention: {
    aggregate: {
      groups: regions.map((entry) => ({
        id: entry.id,
        by: 'region',
        regionId: entry.id,
        label: entry.name,
      })),
      expandedGroupIds,
      expandOnClick: true,
    },
  },
};

fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, `${yaml.dump(topology, { lineWidth: 100, noRefs: true })}`);

console.log(`Wrote ${outputFile}`);
console.log(`Generated ${topology.graph.nodes.length} nodes, ${topology.graph.links.length} links, ${regions.length} regions.`);
