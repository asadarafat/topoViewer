import { describe, expect, it } from 'vitest';
import type { GrafanaMountedBundlePayload } from '../src/types';
import { createRuntimeModel, normalizePanelOptions } from '../src/runtimeModel';

function mountedBundlePayload(overrides: Partial<GrafanaMountedBundlePayload> = {}): GrafanaMountedBundlePayload {
  return {
    bundle: {
      id: 'branch',
      name: 'Branch',
      root: '/etc/topoviewer/bundles/branch',
      topologyPath: '/etc/topoviewer/bundles/branch/branch.topo.tv.yaml',
      stylesheetPath: '/etc/topoviewer/bundles/branch/branch.style.tv.yaml',
      mapperPath: '/etc/topoviewer/bundles/branch/branch.mapper.tv.yaml'
    },
    topologyYaml: [
      'graph:',
      '  id: branch',
      '  nodes:',
      '    - id: PE1',
      '      name: PE1',
      '      position: [120, 140]',
      '    - id: P1',
      '      name: P1',
      '      position: [320, 140]',
      '  links:',
      '    - id: PE1-P1',
      '      source: PE1',
      '      target: P1'
    ].join('\n'),
    stylesheetYaml: [
      'layout:',
      '  mode: manual',
      '  width: 480',
      '  height: 280',
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      width: 80',
      '      height: 48'
    ].join('\n'),
    mapperYaml: [
      'version: 1',
      'mappings:',
      '  - id: utilization',
      '    metric: topoviewer_link_utilization_percent',
      '    target:',
      '      kind: link',
      '      resolve:',
      '        by: id',
      '        metricLabel: link_id'
    ].join('\n'),
    diagnostics: [],
    ...overrides
  };
}

function harnessExportedBundlePayload(): GrafanaMountedBundlePayload {
  return {
    bundle: {
      id: 'harness-exported-branch',
      name: 'Harness Exported Branch',
      root: '/etc/topoviewer/bundles/harness-exported-branch',
      topologyPath: '/etc/topoviewer/bundles/harness-exported-branch/harness-exported-branch.topo.tv.yaml',
      stylesheetPath: '/etc/topoviewer/bundles/harness-exported-branch/harness-exported-branch.style.tv.yaml',
      mapperPath: '/etc/topoviewer/bundles/harness-exported-branch/harness-exported-branch.mapper.tv.yaml'
    },
    topologyYaml: [
      'graph:',
      '  id: harness-exported-branch',
      '  layers:',
      '    - id: underlay',
      '      name: Underlay',
      '  nodes:',
      '    - id: PE1',
      '      name: PE1',
      '      labels:',
      '        role: pe',
      '      layers: [underlay]',
      '      position: [120, 140]',
      '    - id: P1',
      '      name: P1',
      '      labels:',
      '        role: p',
      '      layers: [underlay]',
      '      position: [320, 140]',
      '  links:',
      '    - id: PE1-P1',
      '      source: PE1',
      '      target: P1',
      '      labels:',
      '        link: underlay',
      '      layers: [underlay]'
    ].join('\n'),
    stylesheetYaml: [
      'layout:',
      '  mode: manual',
      '  width: 480',
      '  height: 280',
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      shape: rectangle',
      '      width: 80',
      '      height: 48',
      '  - selector: link',
      '    style:',
      '      lineWidth: 3',
      '      lineColor: "#4caf50"'
    ].join('\n'),
    mapperYaml: [
      'version: 1',
      'identity:',
      '  sourceId: harness-exported-branch',
      '  sourceIdLabel: source_id',
      'rules:',
      '  - id: link-state',
      '    metric: topoviewer_link_up',
      '    select: link',
      '    join: link_id',
      '    value: up',
      '    states:',
      '      down: "==0"',
      '    style:',
      '      default:',
      '        label: UP',
      '        lineColor: "#4caf50"',
      '      down:',
      '        label: DOWN',
      '        lineColor: "#d32f2f"',
      '        lineStyle: dashed'
    ].join('\n'),
    diagnostics: []
  };
}

describe('runtime model', () => {
  it('normalizes missing panel options', () => {
    expect(normalizePanelOptions(undefined)).toEqual({
      sourceMode: 'mountedBundle',
      fixtureId: 'layered-network',
      mountedBundle: {
        bundleRoot: '/etc/topoviewer/bundles',
        manifestPath: '',
        selectedBundleId: ''
      },
      themeMode: 'auto',
      showControls: true,
      controlsOpen: false,
      telemetry: {
        enabled: false,
        infoPercent: 50,
        warningPercent: 80,
        errorPercent: 90
      },
      interaction: {
        enabled: true,
        allowNodeDrag: true,
        persistViewport: 'session',
        persistSelection: 'session',
        persistNodePositions: 'session',
        resetOnTopologyIdentityChange: true
      }
    });
  });

  it('infers fixture mode for legacy dashboards that only set fixtureId', () => {
    expect(normalizePanelOptions({ fixtureId: 'clos-2spine-4leaf' }).sourceMode).toBe('fixture');
  });

  it('builds TopoViewer props from the selected generated fixture', () => {
    const model = createRuntimeModel({ fixtureId: 'clos-2spine-4leaf' });

    expect(model.diagnostics).toEqual([]);
    expect(model.fixture?.id).toBe('clos-2spine-4leaf');
    expect(model.document?.graph?.id).toBe('clos-2spine-4leaf');
    expect(model.topoviewerProps?.document).toBe(model.document);
    expect(model.topoviewerProps?.className).toContain('topoviewer-parity-theme');
  });

  it('returns an actionable diagnostic for an unknown fixture', () => {
    const model = createRuntimeModel({ fixtureId: 'missing-fixture' });

    expect(model.document).toBeUndefined();
    expect(model.diagnostics).toHaveLength(1);
    expect(model.diagnostics[0]?.code).toBe('invalid-fixture-id');
    expect(model.diagnostics[0]?.message).toContain('layered-network');
  });

  it('builds TopoViewer props from a mounted bundle payload', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: {
        bundleRoot: '/etc/topoviewer/bundles',
        selectedBundleId: 'branch'
      }
    }, mountedBundlePayload());

    expect(model.diagnostics).toEqual([]);
    expect(model.mountedBundle?.bundle.id).toBe('branch');
    expect(model.document?.graph?.id).toBe('branch');
    expect(model.mapper?.mappings[0]?.id).toBe('utilization');
    expect(model.topoviewerProps?.document).toBe(model.document);
  });

  it('renders a harness-exported canonical bundle without fixture catalog data', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      fixtureId: 'clos-2spine-4leaf',
      mountedBundle: {
        bundleRoot: '/etc/topoviewer/bundles',
        selectedBundleId: 'harness-exported-branch'
      }
    }, harnessExportedBundlePayload());

    expect(model.diagnostics).toEqual([]);
    expect(model.fixture).toBeUndefined();
    expect(model.mountedBundle?.bundle.id).toBe('harness-exported-branch');
    expect(model.document?.graph?.id).toBe('harness-exported-branch');
    expect(model.mapper?.identity?.sourceId).toBe('harness-exported-branch');
    expect(model.mapper?.mappings[0]?.id).toBe('link-state');
    expect(model.topoviewerProps?.document).toBe(model.document);
  });

  it('reports mounted bundle YAML parse line and column', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: {
        selectedBundleId: 'branch'
      }
    }, mountedBundlePayload({
      topologyYaml: [
        'graph:',
        '  id: branch',
        '  nodes: ['
      ].join('\n')
    }));

    expect(model.topoviewerProps).toBeUndefined();
    expect(model.diagnostics[0]).toMatchObject({
      severity: 'error',
      code: 'yaml-parse-error',
      document: 'topology'
    });
    expect(model.diagnostics[0]?.line).toBeGreaterThan(0);
    expect(model.diagnostics[0]?.column).toBeGreaterThan(0);
  });

  it('blocks mounted bundles with mapper schema diagnostics', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: {
        selectedBundleId: 'branch'
      }
    }, mountedBundlePayload({
      mapperYaml: [
        'version: 1',
        'mappings:',
        '  - id: bad',
        '    metric: device_cpu_percent',
        '    target:',
        '      kind: interface',
        '      resolve:',
        '        by: id',
        '        metricLabel: interface_id'
      ].join('\n')
    }));

    expect(model.topoviewerProps).toBeUndefined();
    expect(model.diagnostics[0]).toMatchObject({
      severity: 'error',
      code: 'mapper-target-invalid',
      path: 'mappings[0].target.kind'
    });
  });

  it('blocks empty mounted graphs before rendering', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: {
        selectedBundleId: 'branch'
      }
    }, mountedBundlePayload({
      topologyYaml: 'graph:\n  id: empty\n'
    }));

    expect(model.topoviewerProps).toBeUndefined();
    expect(model.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'empty-graph'
    }));
  });

  it('blocks mounted graphs that exceed renderer limits', () => {
    const model = createRuntimeModel({
      sourceMode: 'mountedBundle',
      mountedBundle: {
        selectedBundleId: 'branch'
      }
    }, mountedBundlePayload({
      topologyYaml: [
        'limits:',
        '  maxNodes: 1',
        'graph:',
        '  id: over-limit',
        '  nodes:',
        '    - id: PE1',
        '    - id: P1'
      ].join('\n')
    }));

    expect(model.topoviewerProps).toBeUndefined();
    expect(model.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'renderer-limit'
    }));
  });
});
