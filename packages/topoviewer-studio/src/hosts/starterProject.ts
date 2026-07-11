import type { StudioProject } from '../contracts/project';
import { stringify } from 'yaml';
import { studioVisualNodeTemplates } from '../templates/starterNodeTemplates';

export interface CreateStarterProjectOptions {
  id?: string;
  name?: string;
  now?: string;
}

function starterIconYamlLines(): string[] {
  const icons = Object.fromEntries(Object.values(studioVisualNodeTemplates).map((template) => [
    template.iconKey,
    template.icon
  ]));
  return stringify({ icons }, { lineWidth: 0 }).trimEnd().split('\n');
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
        contentHash: 'starter-stylesheet-v3',
        kind: 'stylesheet',
        path: 'stylesheet.yaml',
        text: [
          ...starterIconYamlLines(),
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
