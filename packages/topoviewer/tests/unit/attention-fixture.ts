import type { TopoDocument } from '../../src';

export function attentionFixture(): TopoDocument {
  return {
    version: '1.0',
    graph: {
      layers: [{ id: 'physical', name: 'Physical' }],
      nodes: [
        {
          id: 'core-1',
          label: 'Core 1',
          labels: { role: 'core', site: 'fra' },
          layers: ['physical'],
          data: { severity: 'critical', metrics: { fanout: 12 } }
        },
        {
          id: 'dist-1',
          label: 'Distribution 1',
          labels: { role: 'distribution', site: 'fra' },
          parent: 'region-fra',
          layers: ['physical'],
          data: { severity: 'major', metrics: { fanout: 4 } }
        },
        {
          id: 'access-1',
          label: 'Access 1',
          labels: { role: 'access', site: 'fra' },
          parent: 'dist-1',
          layers: ['physical'],
          data: { severity: 'minor', changed: true, changedAt: '2026-06-12T09:00:00Z', revision: 7 }
        }
      ],
      links: [
        {
          id: 'core-dist',
          source: 'core-1',
          target: 'dist-1',
          labels: { media: 'fiber' },
          layers: ['physical'],
          data: { utilization: 74 }
        }
      ],
      paths: [
        {
          id: 'lsp-critical',
          label: 'Critical LSP',
          sequence: ['core-1', 'dist-1', 'access-1'],
          labels: { service: 'lsp' },
          layers: ['physical'],
          data: { severity: 'critical', owner: { team: 'transport' } }
        },
        {
          id: 'stitched-vpn',
          source: 'access-1',
          target: 'core-1',
          parent: 'lsp-critical',
          labels: { service: 'vpn' },
          layers: ['physical']
        }
      ],
      regions: [
        {
          id: 'region-fra',
          label: 'Frankfurt',
          members: ['core-1', 'dist-1'],
          labels: { geography: 'metro' },
          layers: ['physical'],
          data: { site: { code: 'fra' } }
        }
      ]
    }
  };
}
