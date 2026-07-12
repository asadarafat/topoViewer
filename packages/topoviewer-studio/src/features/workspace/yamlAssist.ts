import type { TopoDocument } from 'topoviewer';
import { mapperAuthoringMetadata, styleAuthoringMetadata } from 'topoviewer/authoring';
import type { StudioDocumentKind, StudioProject } from '../../contracts/project';

export interface StudioYamlAssistItem {
  detail: string;
  documentation: string;
  insertText: string;
  label: string;
  values?: string[];
}

export interface StudioYamlHover {
  contents: string;
}

export interface StudioYamlAssist {
  completions(document: StudioDocumentKind): StudioYamlAssistItem[];
  hover(document: StudioDocumentKind, word: string): StudioYamlHover | undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function unique(items: StudioYamlAssistItem[]) {
  const byLabel = new Map<string, StudioYamlAssistItem>();
  items.forEach((item) => {
    const current = byLabel.get(item.label);
    if (!current || item.documentation.length > current.documentation.length) byLabel.set(item.label, item);
  });
  return [...byLabel.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function item(label: string, detail: string, documentation: string, insertText = label, values?: string[]): StudioYamlAssistItem {
  return { detail, documentation, insertText, label, values };
}

function metadataLeaf(path: string) {
  return path.replace(/\[\]|\.\*/g, '').split('.').at(-1) || path;
}

function graphFacts(document: TopoDocument) {
  const graph = record(document.graph) || {};
  const diagram = record(document.diagram) || {};
  const collections = ['layers', 'nodes', 'links', 'paths', 'regions'] as const;
  const ids = collections.flatMap((collection) => (
    Array.isArray(graph[collection])
      ? (graph[collection] as unknown[]).flatMap((value) => {
          const id = record(value)?.id;
          return typeof id === 'string' ? [id] : [];
        })
      : []
  ));
  const objects = ['nodes', 'links', 'paths', 'regions'].flatMap((collection) => (
    Array.isArray(graph[collection]) ? graph[collection] as unknown[] : []
  )).concat(['shapes', 'callouts', 'texts'].flatMap((collection) => (
    Array.isArray(diagram[collection]) ? diagram[collection] as unknown[] : []
  ))).map(record).filter(Boolean) as Record<string, unknown>[];
  ids.push(...['shapes', 'callouts', 'texts'].flatMap((collection) => (
    Array.isArray(diagram[collection])
      ? (diagram[collection] as unknown[]).flatMap((value) => {
          const id = record(value)?.id;
          return typeof id === 'string' ? [id] : [];
        })
      : []
  )));
  const labelKeys = [...new Set(objects.flatMap((value) => Object.keys(record(value.labels) || {})))];
  const dataKeys = [...new Set(objects.flatMap((value) => Object.keys(record(value.data) || {})))];
  return { dataKeys, ids, labelKeys };
}

const topologyFields = [
  ['graph', 'Topology root', 'Contains stable graph identity and object collections.'],
  ['layers', 'Graph layers', 'Defines reusable topology visibility layers.'],
  ['nodes', 'Graph nodes', 'Defines topology nodes with stable IDs.'],
  ['links', 'Graph links', 'Defines edges between existing node IDs.'],
  ['paths', 'Graph paths', 'Defines traversals over graph reachability.'],
  ['regions', 'Graph regions', 'Defines logical groups and membership.'],
  ['diagram', 'Diagram annotations', 'Contains shapes, callouts, and standalone text.'],
  ['shapes', 'Diagram shapes', 'Defines non-semantic geometry and labels.'],
  ['callouts', 'Diagram callouts', 'Defines explanatory annotation cards and leaders.'],
  ['texts', 'Diagram text', 'Defines standalone, layer-aware text boxes.'],
  ['position', 'Object position', 'Two-number canvas position in document coordinates.'],
  ['labels', 'Selector facts', 'Stable facts used by selectors and integrations.'],
  ['data', 'Object data', 'Domain metadata retained with the topology object.'],
  ['layers', 'Layer membership', 'Layer IDs assigned to this object.']
] as const;

export function createStudioYamlAssist(project: StudioProject, document: TopoDocument): StudioYamlAssist {
  const facts = graphFacts(document);
  const topology = unique([
    ...topologyFields.map(([label, detail, documentation]) => item(label, detail, documentation, `${label}: `)),
    ...facts.ids.map((id) => item(id, 'Topology object ID', 'An existing stable object or layer ID.', id)),
    ...facts.labelKeys.map((key) => item(
      `labels.${key}`, 'Selector fact', `A label key present in the current topology. Use it in selectors such as node[labels.${key} = "value"].`, key
    )),
    ...facts.dataKeys.map((key) => item(
      `data.${key}`, 'Data fact', `A data key present in the current topology. Use it in selectors or mapper joins as data.${key}.`, key
    ))
  ]);
  const stylesheet = unique([
    item('stylesheet', 'Stylesheet rules', 'Ordered selector and style rules.', 'stylesheet:\n  - selector: node\n    style:\n      '),
    item('selector', 'Rule selector', 'Targets topology objects by kind and facts.', 'selector: node'),
    item('style', 'Visual policy', 'Contains fields supported by the selected object type.', 'style:\n  '),
    ...styleAuthoringMetadata.map((field) => item(
      metadataLeaf(field.path),
      `${field.group} · ${field.targets.join(', ')}`,
      `${field.description}${field.values?.length ? ` Accepted values: ${field.values.join(', ')}.` : ''}${field.examples?.length ? ` Examples: ${field.examples.join(', ')}.` : ''}`,
      `${metadataLeaf(field.path)}: `,
      field.values
    )),
    ...facts.labelKeys.map((key) => item(
      `labels.${key}`, 'Selector fact', `Current topology fact available to stylesheet selectors.`, `labels.${key}`
    ))
  ]);
  const mapper = unique([
    ...mapperAuthoringMetadata.map((field) => item(
      metadataLeaf(field.path),
      `${field.group} · ${field.valueType}`,
      `${field.description}${field.values?.length ? ` Accepted values: ${field.values.join(', ')}.` : ''}`,
      `${metadataLeaf(field.path)}: `,
      field.values
    )),
    ...facts.ids.map((id) => item(id, 'Mapper target ID', 'An existing topology object ID available for explicit mapper resolution.', id)),
    item('node_id', 'Common telemetry label', 'Common label used to join telemetry to node IDs.'),
    item('link_id', 'Common telemetry label', 'Common label used to join telemetry to link IDs.'),
    item('direction', 'Directional telemetry label', 'Distinguishes sourceToTarget and targetToSource samples.')
  ]);
  const values: Record<StudioDocumentKind, StudioYamlAssistItem[]> = {
    mapper: project.documents.mapper ? mapper : [],
    stylesheet,
    topology
  };
  return {
    completions: (kind) => values[kind],
    hover(kind, word) {
      const normalized = word.trim().replace(/:$/, '');
      const match = values[kind].find((candidate) => (
        candidate.label === normalized || metadataLeaf(candidate.label) === normalized
      ));
      return match ? { contents: `**${match.label}**\n\n${match.documentation}` } : undefined;
    }
  };
}
