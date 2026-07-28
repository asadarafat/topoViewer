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
        contentHash: backbone ? 'starter-backbone-topology-v2' : 'starter-topology-v3',
        kind: 'topology',
        path: 'topology.yaml',
        text: [
          'version: "0.2"',
          'toggles:',
          '  - id: showEdgeLabels',
          '    default: true',
          '    labels:',
          '      name: Edge labels',
          '  - id: physical-port',
          '    default: true',
          '    labels:',
          '      name: Physical ports',
          '  - id: bandwidth',
          '    default: true',
          '    labels:',
          '      name: Bandwidth',
          'graph:',
          `  id: ${id}`,
          '  layers:',
          '    - id: physical',
          '      labels:',
          '        name: Physical',
          '    - id: paths',
          '      labels:',
          '        name: Paths',
          '    - id: annotations',
          '      labels:',
          '        name: Annotations',
          ...(backbone
            ? [
                '  nodes:',
                '    - id: edge-01',
                '      layers: [physical]',
                '      position: [215, 326]',
                '    - id: noc-controller',
                '      labels:',
                '        name: NOC Controller',
                '      data:',
                '        subtitle: Control plane · Healthy',
                '      layers: [physical]',
                '      position: [459, 269]',
                '    - id: edge-02',
                '      layers: [physical]',
                '      position: [761, 392]',
                '  links:',
                '    - id: edge-01-controller',
                '      source: edge-01',
                '      target: noc-controller',
                '      layers: [physical]',
                '    - id: controller-edge-02',
                '      source: noc-controller',
                '      target: edge-02',
                '      layers: [physical]'
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
        contentHash: backbone ? 'starter-backbone-stylesheet-v7' : 'starter-stylesheet-v7',
        kind: 'stylesheet',
        path: 'stylesheet.yaml',
        text: [
          'version: "0.2"',
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
          ...(backbone
            ? [
                '  - selector: node[id = "edge-01"]',
                '    style:',
                '      icon: nokia.router',
                '      shape: square',
                '      width: 58',
                '      height: 58',
                '      borderWidth: 1',
                '      labelPosition: bottom',
                '      labelMargin: 7',
                '  - selector: node[id = "noc-controller"]',
                '    style:',
                '      icon: nokia.controller',
                '      shape: roundRectangle',
                '      width: 184',
                '      height: 62',
                '      backgroundColor: "#172430"',
                '      borderColor: "#52708a"',
                '      borderWidth: 1',
                '      nodeLayout:',
                '        type: card',
                '        direction: horizontal',
                '        icon:',
                '          placement: left',
                '          width: 44',
                '          height: 44',
                '        content:',
                '          align: left',
                '          titleField: labels.name',
                '          subtitleField: data.subtitle',
                '  - selector: node[id = "edge-02"]',
                '    style:',
                '      icon: nokia.router',
                '      shape: square',
                '      width: 58',
                '      height: 58',
                '      borderWidth: 1',
                '      labelPosition: bottom',
                '      labelMargin: 7',
                '  - selector: link[id = "edge-01-controller"]',
                '    style:',
                '      curveStyle: straight',
                '  - selector: link[id = "controller-edge-02"]',
                '    style:',
                '      curveStyle: straight'
              ]
            : []),
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
