import type { StudioProject } from '../contracts/project';
import { stringify } from 'yaml';
import { studioVisualNodeTemplates } from '../templates/starterNodeTemplates';

export interface CreateStarterProjectOptions {
  id?: string;
  name?: string;
  now?: string;
  template?: 'backbone' | 'blank';
}

function starterIconYamlLines(): string[] {
  const icons = Object.fromEntries(Object.values(studioVisualNodeTemplates).map((template) => [template.iconKey, template.icon]));
  return stringify({ icons }, { lineWidth: 0 }).trimEnd().split('\n');
}

export function createStarterProject(options: CreateStarterProjectOptions = {}): StudioProject {
  const now = options.now || new Date().toISOString();
  const id = options.id || 'studio-project';
  const backbone = options.template === 'backbone';
  return {
    assets: [],
    documents: {
      topology: {
        contentHash: backbone ? 'starter-backbone-topology-v1' : 'starter-topology-v2',
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
          ...(backbone
            ? [
                '  nodes:',
                '    - id: edge-01',
                '      name: edge-01',
                '      icon: topoviewer.router',
                '      layers: [physical]',
                '      position: [215, 326]',
                '      style:',
                '        shape: square',
                '        width: 58',
                '        height: 58',
                '        borderWidth: 1',
                '        labelPosition: bottom',
                '        labelMargin: 7',
                '    - id: noc-controller',
                '      name: NOC Controller',
                '      icon: topoviewer.controller',
                '      data:',
                '        subtitle: Control plane · Healthy',
                '      layers: [physical]',
                '      position: [459, 269]',
                '      style:',
                '        shape: roundRectangle',
                '        width: 184',
                '        height: 62',
                '        backgroundColor: "#172430"',
                '        borderColor: "#52708a"',
                '        borderWidth: 1',
                '        nodeLayout:',
                '          type: card',
                '          direction: horizontal',
                '          icon:',
                '            placement: left',
                '            width: 44',
                '            height: 44',
                '          content:',
                '            align: left',
                '            titleField: name',
                '            subtitleField: data.subtitle',
                '    - id: edge-02',
                '      name: edge-02',
                '      icon: topoviewer.router',
                '      layers: [physical]',
                '      position: [761, 392]',
                '      style:',
                '        shape: square',
                '        width: 58',
                '        height: 58',
                '        borderWidth: 1',
                '        labelPosition: bottom',
                '        labelMargin: 7',
                '  links:',
                '    - id: edge-01-controller',
                '      source: edge-01',
                '      target: noc-controller',
                '      layers: [physical]',
                '      style:',
                '        curveStyle: straight',
                '    - id: controller-edge-02',
                '      source: noc-controller',
                '      target: edge-02',
                '      layers: [physical]',
                '      style:',
                '        curveStyle: straight'
              ]
            : ['  nodes: []', '  links: []']),
          '  paths: []',
          '  regions: []',
          'diagram:',
          '  shapes: []',
          '  callouts: []',
          '  texts: []',
          ''
        ].join('\n')
      },
      stylesheet: {
        contentHash: 'starter-stylesheet-v4',
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
          '      backgroundColor: "#1976d2"',
          '      borderColor: "#64b5f6"',
          '      borderWidth: 1',
          '      labelColor: "#e7edf4"',
          '      metaColor: "#93a8ba"',
          '  - selector: link',
          '    style:',
          '      curveStyle: bezier',
          '      lineColor: "#4f83ad"',
          '      lineWidth: 2',
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
    name: options.name?.trim() || (backbone ? 'Backbone topology' : 'Untitled topology'),
    revision: 'browser-initial'
  };
}
