const layeredLinks = [
  { fixtureId: 'layered-network', linkId: 'underlay-fra-ams', source: 'fra-pe', target: 'ams-p', site: 'core', pod: 'west' },
  { fixtureId: 'layered-network', linkId: 'underlay-ams-lon', source: 'ams-p', target: 'lon-pe', site: 'core', pod: 'east' },
  { fixtureId: 'layered-network', linkId: 'bgp-fra-rr', source: 'fra-pe', target: 'rr', site: 'control', pod: 'west' },
  { fixtureId: 'layered-network', linkId: 'bgp-lon-rr', source: 'lon-pe', target: 'rr', site: 'control', pod: 'east' },
  { fixtureId: 'layered-network', linkId: 'service-fra', source: 'payments', target: 'fra-pe', site: 'service', pod: 'west' },
  { fixtureId: 'layered-network', linkId: 'service-lon', source: 'payments', target: 'lon-pe', site: 'service', pod: 'east' },
  { fixtureId: 'layered-network', linkId: 'ops-alert', source: 'noc', target: 'lon-pe', site: 'ops', pod: 'east' }
];

const closLinks = [
  'Spine-1-Leaf-1',
  'Spine-1-Leaf-2',
  'Spine-1-Leaf-3',
  'Spine-1-Leaf-4',
  'Spine-2-Leaf-1',
  'Spine-2-Leaf-2',
  'Spine-2-Leaf-3',
  'Spine-2-Leaf-4'
].map((linkId) => {
  const [source, target] = linkId.split('-Leaf-');
  return {
    fixtureId: 'clos-2spine-4leaf',
    linkId,
    source,
    target: `Leaf-${target}`,
    site: 'fabric',
    pod: Number(target) <= 2 ? 'pair-1' : 'pair-2'
  };
});

function sample(base, utilizationPercent, options = {}) {
  const txUtilizationPercent = options.txUtilizationPercent ?? Math.min(100, utilizationPercent + 6);
  const rxUtilizationPercent = options.rxUtilizationPercent ?? Math.max(0, utilizationPercent - 5);
  return {
    ...base,
    up: options.up ?? 1,
    utilizationPercent,
    txUtilizationPercent,
    rxUtilizationPercent,
    rxBps: Math.round(utilizationPercent * 4_000_000_000),
    txBps: Math.round(utilizationPercent * 3_200_000_000),
    errorsTotal: options.errorsTotal ?? 0,
    timestampSeconds: Math.floor(Date.now() / 1000)
  };
}

function healthyScenario() {
  return [
    ...layeredLinks.map((link, index) => sample(link, 22 + index * 3)),
    ...closLinks.map((link, index) => sample(link, 18 + index * 2))
  ];
}

function highUtilizationScenario() {
  return healthyScenario().map((entry) => {
    if (entry.linkId === 'underlay-ams-lon') return sample(entry, 93, { errorsTotal: 4 });
    if (entry.linkId === 'service-lon') return sample(entry, 84, { errorsTotal: 1 });
    if (entry.linkId === 'Spine-1-Leaf-3') return sample(entry, 88, { errorsTotal: 2 });
    if (entry.linkId === 'Spine-2-Leaf-4') return sample(entry, 91, { errorsTotal: 3 });
    return entry;
  });
}

function linkFailureScenario() {
  return highUtilizationScenario().map((entry) => {
    if (entry.linkId === 'underlay-ams-lon') return sample(entry, 100, { up: 0, errorsTotal: 29 });
    if (entry.linkId === 'Spine-1-Leaf-3') return sample(entry, 100, { up: 0, errorsTotal: 18 });
    return entry;
  });
}

export const scenarioNames = ['healthy', 'high-utilization', 'link-failure'];

export function buildScenario(name) {
  if (name === 'healthy') return healthyScenario();
  if (name === 'high-utilization') return highUtilizationScenario();
  if (name === 'link-failure') return linkFailureScenario();
  throw new Error(`Unknown telemetry scenario "${name}". Expected one of: ${scenarioNames.join(', ')}.`);
}

export function applyMetricOverride(entries, override) {
  return entries.map((entry) => {
    if (entry.fixtureId !== override.fixtureId || entry.linkId !== override.linkId) return entry;
    const numericValue = Number(override.value);
    if (!Number.isFinite(numericValue)) return entry;
    if (override.field === 'up') return { ...entry, up: numericValue > 0 ? 1 : 0 };
    if (override.field === 'utilizationPercent') return sample(entry, numericValue, { up: entry.up, errorsTotal: entry.errorsTotal });
    if (override.field === 'errorsTotal') return { ...entry, errorsTotal: numericValue };
    return entry;
  });
}
