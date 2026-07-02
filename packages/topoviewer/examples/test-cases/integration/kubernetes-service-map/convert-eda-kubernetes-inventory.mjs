#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const [inventoryDir = 'eda-kubernetes-inventory', outputFile = 'topology.yaml'] = process.argv.slice(2);
const knownFiles = new Set(['services.json', 'deployments.json', 'pods.json']);
const read = (file, fallback = { items: [] }) => {
  const filePath = path.join(inventoryDir, file);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : fallback;
};
const items = (doc) => Array.isArray(doc?.items) ? doc.items : doc?.metadata?.name ? [doc] : [];
const slug = (value) => String(value ?? 'unknown').trim().toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
const id = (prefix, object) =>
  `${prefix}-${slug(object.metadata?.namespace ?? 'cluster')}-${slug(object.metadata?.name ?? object.kind)}`;
const empty = (item) => item === undefined || item === null || item === ''
  || (Array.isArray(item) && item.length === 0)
  || (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0);
const pick = (value) => Object.fromEntries(Object.entries(value).filter(([, item]) => !empty(item)));
const labels = (object) => object.metadata?.labels ?? {};
const role = (object, fallback) => labels(object).app ?? labels(object)['eda.nokia.com/app'] ?? fallback;
const match = (selector = {}, candidate = {}) =>
  Object.entries(selector).length > 0 && Object.entries(selector).every(([key, value]) => candidate[key] === value);
const ports = (specPorts = []) =>
  specPorts.map((port) => `${port.name ? `${port.name}:` : ''}${port.port}/${port.protocol ?? 'TCP'}`);
const status = (object) => {
  if (object.kind === 'Pod') return object.status?.phase === 'Running' ? 'ready' : slug(object.status?.phase);
  if (object.kind === 'Deployment') return object.status?.readyReplicas === object.status?.replicas ? 'ready' : 'degraded';
  return slug(object.status?.phase ?? object.status?.state ?? object.status?.operState ?? 'ready');
};
const xy = (index, row) => [120 + (index % 8) * 170, 110 + Math.floor(index / 8) * 150 + row * 250];
const node = (object, prefix, objectType, index, row, data, layer = 'control-plane') => ({
  id: id(prefix, object), name: object.metadata?.labels?.['app.kubernetes.io/name'] ?? object.metadata?.name ?? object.kind,
  labels: pick({ object: objectType, namespace: object.metadata?.namespace, role: role(object, objectType), status: status(object) }),
  data: pick(data), layers: [layer], position: xy(index, row),
});
const region = (idValue, name, members, layers) =>
  ({ id: idValue, name, labels: { region: 'generated' }, members, layers, paddingX: 48, paddingY: 42 });

const services = items(read('services.json'));
const deployments = items(read('deployments.json'));
const pods = items(read('pods.json'));
const extras = fs.existsSync(inventoryDir)
  ? fs.readdirSync(inventoryDir).filter((file) => file.endsWith('.json') && !knownFiles.has(file)).flatMap((file) => items(read(file)))
  : [];
const serviceNodes = services.map((service, index) => node(service, 'svc', 'service', index, 0, {
  kind: service.kind, type: service.spec?.type, clusterIP: service.spec?.clusterIP,
  externalIPs: service.spec?.externalIPs, ports: ports(service.spec?.ports), selector: service.spec?.selector,
}));
const deploymentNodes = deployments.map((deployment, index) => node(deployment, 'deploy', 'deployment', index, 1, {
  kind: deployment.kind, replicas: deployment.status?.replicas, readyReplicas: deployment.status?.readyReplicas,
  selector: deployment.spec?.selector?.matchLabels,
  containers: deployment.spec?.template?.spec?.containers?.map((container) => container.name),
  images: deployment.spec?.template?.spec?.containers?.map((container) => container.image),
}));
const podNodes = pods.map((pod, index) => node(pod, 'pod', 'pod', index, 2, {
  kind: pod.kind, pod: pod.metadata?.name, phase: pod.status?.phase, podIP: pod.status?.podIP,
  node: pod.spec?.nodeName, containers: pod.spec?.containers?.map((container) => container.name),
  images: pod.spec?.containers?.map((container) => container.image),
}));
const extraNodes = extras.map((resource, index) => {
  const layer = /networktopology|toponode/i.test(resource.kind ?? '') ? 'topology-runtime' : 'control-plane';
  return node(resource, `cr-${slug(resource.kind)}`, 'customResource', index, layer === 'topology-runtime' ? 3 : 1,
    { kind: resource.kind, apiVersion: resource.apiVersion, status: resource.status }, layer);
});
const links = [];
services.forEach((service) => deployments.forEach((deployment) => {
  if (match(service.spec?.selector, deployment.spec?.template?.metadata?.labels)) links.push({
    id: `${id('svc', service)}-selects-${id('deploy', deployment)}`, name: 'selects',
    source: id('svc', service), target: id('deploy', deployment), labels: { link: 'selector' }, layers: ['control-plane'],
  });
}));
deployments.forEach((deployment) => pods.forEach((pod) => {
  if (match(deployment.spec?.selector?.matchLabels, labels(pod))) links.push({
    id: `${id('deploy', deployment)}-owns-${id('pod', pod)}`, name: 'creates pod',
    source: id('deploy', deployment), target: id('pod', pod), labels: { link: 'owns' }, layers: ['control-plane'],
  });
}));
extras.filter((item) => /networktopology/i.test(item.kind ?? '')).forEach((topology) =>
  extras.filter((item) => /toponode/i.test(item.kind ?? '')).forEach((topoNode) => links.push({
    id: `${id('cr-networktopology', topology)}-contains-${id('cr-toponode', topoNode)}`, name: 'contains',
    source: id('cr-networktopology', topology), target: id('cr-toponode', topoNode), labels: { link: 'topology' }, layers: ['topology-runtime'],
  })));
const regions = [
  region('region-services', 'Services', serviceNodes.map((item) => item.id), ['control-plane']),
  region('region-workloads', 'Deployments and pods', [...deploymentNodes, ...podNodes].map((item) => item.id), ['control-plane']),
  region('region-runtime', 'Topology runtime', extraNodes.filter((item) => item.layers.includes('topology-runtime')).map((item) => item.id), ['topology-runtime']),
].filter((item) => item.members.length > 0);
const graph = { id: 'kubernetes-inventory-service-map', layers: [
  { id: 'control-plane', name: 'Control plane' }, { id: 'topology-runtime', name: 'Topology runtime' },
], nodes: [...serviceNodes, ...deploymentNodes, ...podNodes, ...extraNodes], links, regions };
const attention = { aggregate: {
  groups: regions.map((item) => ({ id: item.id, by: 'region', regionId: item.id, label: item.name })),
  expandedGroupIds: regions.map((item) => item.id), expandOnClick: true,
}};
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, yaml.dump({ graph, attention }, { lineWidth: 120 }), 'utf8');
console.log(`Wrote ${graph.nodes.length} nodes, ${graph.links.length} links, ${regions.length} regions to ${outputFile}`);
