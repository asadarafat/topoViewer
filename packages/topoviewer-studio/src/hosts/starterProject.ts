import type { StudioProject } from '../contracts/project';

export interface CreateStarterProjectOptions {
  id?: string;
  name?: string;
  now?: string;
}

export function createStarterProject(options: CreateStarterProjectOptions = {}): StudioProject {
  const now = options.now || new Date().toISOString();
  const id = options.id || 'studio-project';
  return {
    assets: [],
    documents: {
      topology: {
        contentHash: 'starter-topology-v1',
        kind: 'topology',
        path: 'topology.yaml',
        text: [
          'toggles:',
          '  - id: showEdgeLabels',
          '    name: Edge labels',
          '    default: true',
          '  - id: physical-port',
          '    name: Physical ports',
          '    default: true',
          '  - id: bandwidth',
          '    name: Bandwidth',
          '    default: true',
          'graph:',
          `  id: ${id}`,
          '  layers:',
          '    - id: physical',
          '      name: Physical',
          '    - id: paths',
          '      name: Paths',
          '    - id: annotations',
          '      name: Annotations',
          '  nodes: []',
          '  links: []',
          '  paths: []',
          '  regions: []',
          'diagram:',
          '  shapes: []',
          '  callouts: []',
          ''
        ].join('\n')
      },
      stylesheet: {
        contentHash: 'starter-stylesheet-v2',
        kind: 'stylesheet',
        path: 'stylesheet.yaml',
        text: [
          'icons:',
          '  router.generic:',
          '    glyph: R',
          '    alt: Router',
          '    svg: |',
          '      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img">',
          '        <rect width="120" height="120" rx="12" fill="#1976d2"/>',
          '        <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">',
          '          <path d="M25 60h70M60 25v70"/>',
          '          <path d="m25 60 12-10M25 60l12 10M95 60 83 50M95 60 83 70"/>',
          '          <path d="m60 25-10 12M60 25l10 12M60 95 50 83M60 95l10-12"/>',
          '        </g>',
          '      </svg>',
          '    fill: "#1976d2"',
          '    stroke: "#bbdefb"',
          'layout:',
          '  mode: manual',
          '  width: 1280',
          '  height: 720',
          'stylesheet:',
          '  - selector: node',
          '    style:',
          '      shape: rectangle',
          '  - selector: link',
          '    style:',
          '      curveStyle: bezier',
          '  - selector: node[isAggregate = "true"]',
          '    style:',
          '      shape: roundRectangle',
          '      width: 132',
          '      height: 68',
          '      backgroundColor: "#334155"',
          '      borderColor: "#60a5fa"',
          '      borderWidth: 3',
          '      labelFontWeight: 800',
          '      metaColor: transparent',
          ''
        ].join('\n')
      }
    },
    id,
    metadata: {
      createdAt: now,
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: now
    },
    name: options.name?.trim() || 'Untitled topology',
    revision: 'browser-initial'
  };
}
