import { expect, test } from '@playwright/test';

test('serves validation through the local fixture API', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const stylesheet = await (await request.get('/fixtures/layered-network/stylesheet.yaml')).text();
  const response = await request.post('/validate', {
    data: { topologyText: topology, stylesheetText: stylesheet }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toEqual([]);
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('underlay');
  expect(body.layers.map((layer: { id: string }) => layer.id)).toContain('operations');
  expect(body.layers.every((layer: { objectCount: number }) => layer.objectCount > 0)).toBeTruthy();
});

test('reports topology-aware mapper diagnostics through validation', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const stylesheet = await (await request.get('/fixtures/layered-network/stylesheet.yaml')).text();
  const mapper = [
    'version: 1',
    'mappings:',
    '  - id: stale-node',
    '    metric: topoviewer_node_health',
    '    target:',
    '      kind: node',
    '      resolve:',
    '        by: staticObjectIds',
    '        objectIds:',
    '          - fra-pe',
    '          - missing-node',
    '    overlay:',
    '      lineColorBySeverity: true',
    '  - id: selector-mismatch',
    '    metric: topoviewer_node_health',
    '    target:',
    '      kind: node',
    '      resolve:',
    '        by: selector',
    '        selector: link',
    '    overlay:',
    '      statusMarker: true',
    ''
  ].join('\n');

  const response = await request.post('/validate', {
    data: { topologyText: topology, stylesheetText: stylesheet, mapperText: mapper }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { diagnostics: Array<{ code: string; document?: string; severity: string }> };
  expect(body.diagnostics).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 'mapper-static-object-stale', document: 'mapper', severity: 'warning' }),
    expect.objectContaining({ code: 'mapper-overlay-unsupported', document: 'mapper', severity: 'warning' }),
    expect.objectContaining({ code: 'mapper-selector-kind-mismatch', document: 'mapper', severity: 'warning' })
  ]));
});

test('reports mapper ambiguity and missing link-direction diagnostics', async ({ request }) => {
  const topology = [
    'graph:',
    '  id: mapper-ambiguous-endpoints',
    '  layers:',
    '    - id: underlay',
    '      name: Underlay',
    '  nodes:',
    '    - id: A',
    '      name: A',
    '      layers: [underlay]',
    '      position: [120, 120]',
    '    - id: B',
    '      name: B',
    '      layers: [underlay]',
    '      position: [360, 120]',
    '  links:',
    '    - id: A-B-primary',
    '      source: A',
    '      target: B',
    '      layers: [underlay]',
    '    - id: A-B-backup',
    '      source: A',
    '      target: B',
    '      layers: [underlay]',
    ''
  ].join('\n');
  const stylesheet = 'layout:\n  mode: manual\nstylesheet: []\n';
  const mapper = [
    'version: 1',
    'mappings:',
    '  - id: endpoint-link',
    '    metric: link_utilization',
    '    target:',
    '      kind: link',
    '      resolve:',
    '        by: endpoint',
    '        sourceLabel: source',
    '        targetLabel: target',
    '    overlay:',
    '      lineColorBySeverity: true',
    '  - id: directional-link',
    '    metric: link_direction_bps',
    '    target:',
    '      kind: linkDirection',
    '      resolve:',
    '        by: id',
    '        linkMetricLabel: link_id',
    '        directionMetricLabel: direction',
    '    overlay:',
    '      lineWidthBySeverity: true',
    ''
  ].join('\n');

  const response = await request.post('/validate', {
    data: { topologyText: topology, stylesheetText: stylesheet, mapperText: mapper }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { diagnostics: Array<{ code: string; document?: string; severity: string }> };
  expect(body.diagnostics).toEqual(expect.arrayContaining([
    expect.objectContaining({ code: 'mapper-endpoint-ambiguous', document: 'mapper', severity: 'warning' }),
    expect.objectContaining({ code: 'mapper-link-direction-missing-direction', document: 'mapper', severity: 'warning' })
  ]));
});

test('reports missing companion files through validation diagnostics', async ({ request }) => {
  const topology = await (await request.get('/fixtures/layered-network/topology.yaml')).text();
  const response = await request.post('/validate', {
    data: {
      topologyText: topology,
      stylesheetText: '',
      stylesheetPath: '/workspace/stylesheet.yaml',
      stylesheetMissing: true
    }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.diagnostics).toContainEqual(expect.objectContaining({
    severity: 'warning',
    source: 'host',
    code: 'missing-stylesheet-yaml'
  }));
});

test('harness fixtures do not expose empty layers', async ({ request }) => {
  const fixtures = await (await request.get('/fixtures')).json() as Array<{ id: string }>;
  expect(fixtures.map((fixture) => fixture.id)).toEqual(expect.arrayContaining([
    'clos-2spine-4leaf',
    'insert-workflow',
    'attention-workflow',
    'inspector-workflow',
    'dense-links'
  ]));

  for (const fixture of fixtures) {
    const topology = await (await request.get(`/fixtures/${fixture.id}/topology.yaml`)).text();
    const stylesheet = await (await request.get(`/fixtures/${fixture.id}/stylesheet.yaml`)).text();
    const response = await request.post('/validate', {
      data: { topologyText: topology, stylesheetText: stylesheet }
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { layers: Array<{ id: string; objectCount: number }> };
    expect(body.layers.length, `${fixture.id} should declare at least one layer`).toBeGreaterThan(0);
    for (const layer of body.layers) {
      expect(layer.objectCount, `${fixture.id}:${layer.id} should have objects`).toBeGreaterThan(0);
    }
  }
});
