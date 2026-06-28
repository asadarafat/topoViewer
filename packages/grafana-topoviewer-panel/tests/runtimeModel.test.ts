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

describe('runtime model', () => {
  it('normalizes missing panel options', () => {
    expect(normalizePanelOptions(undefined)).toEqual({
      sourceMode: 'fixture',
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
