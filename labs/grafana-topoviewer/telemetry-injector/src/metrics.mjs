const metricHelp = {
  topoviewer_link_up: 'Whether a TopoViewer link is operational: 1 up, 0 down.',
  topoviewer_link_utilization_percent: 'Current TopoViewer link utilization percentage.',
  topoviewer_link_direction_utilization_percent: 'Current TopoViewer directional link utilization percentage.',
  topoviewer_link_rx_bps: 'Current receive rate for a TopoViewer link in bits per second.',
  topoviewer_link_tx_bps: 'Current transmit rate for a TopoViewer link in bits per second.',
  topoviewer_link_errors_total: 'Total observed errors for a TopoViewer link.',
  topoviewer_metric_timestamp_seconds: 'Unix timestamp for the current injected TopoViewer telemetry sample.'
};

function escapeLabel(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function labelsForEntry(entry) {
  const labels = {
    fixture_id: entry.fixtureId,
    link_id: entry.linkId,
    source: entry.source,
    target: entry.target,
    site: entry.site,
    pod: entry.pod
  };
  if (entry.direction) labels.direction = entry.direction;
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
    .join(',');
}

function renderMetric(name, entries, valueForEntry) {
  return [
    `# HELP ${name} ${metricHelp[name]}`,
    `# TYPE ${name} gauge`,
    ...entries.map((entry) => `${name}{${labelsForEntry(entry)}} ${valueForEntry(entry)}`)
  ].join('\n');
}

function directionEntries(entries) {
  return entries.flatMap((entry) => [
    {
      ...entry,
      direction: 'sourceToTarget',
      directionUtilizationPercent: entry.txUtilizationPercent ?? entry.utilizationPercent
    },
    {
      ...entry,
      direction: 'targetToSource',
      directionUtilizationPercent: entry.rxUtilizationPercent ?? entry.utilizationPercent
    }
  ]);
}

export function renderPrometheusMetrics(entries) {
  const directions = directionEntries(entries);
  const metricBlocks = [
    renderMetric('topoviewer_link_up', entries, (entry) => entry.up),
    renderMetric('topoviewer_link_utilization_percent', entries, (entry) => entry.utilizationPercent),
    renderMetric('topoviewer_link_direction_utilization_percent', directions, (entry) => entry.directionUtilizationPercent),
    renderMetric('topoviewer_link_rx_bps', entries, (entry) => entry.rxBps),
    renderMetric('topoviewer_link_tx_bps', entries, (entry) => entry.txBps),
    renderMetric('topoviewer_link_errors_total', entries, (entry) => entry.errorsTotal),
    renderMetric('topoviewer_metric_timestamp_seconds', entries, (entry) => entry.timestampSeconds)
  ];
  return `${metricBlocks.join('\n\n')}\n`;
}
