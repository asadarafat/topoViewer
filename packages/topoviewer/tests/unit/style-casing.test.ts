import fs from 'node:fs';
import path from 'node:path';
import YAML from 'js-yaml';
import { describe, expect, it } from 'vitest';
import { compileTopoGraph, validateTopoDocument, type TopoDocument } from '../../src';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function collectYamlFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectYamlFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.yaml') && entry.name !== 'expected.yaml' ? [fullPath] : [];
  });
}

function collectDashedStyleKeys(value: unknown, pathParts: string[] = []): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectDashedStyleKeys(item, [...pathParts, String(index)]));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const childPath = [...pathParts, key];
    const styleKeyIssues = (key === 'style' || key === 'leader')
      ? Object.keys(record(child))
        .filter((styleKey) => styleKey.includes('-'))
        .map((styleKey) => [...childPath, styleKey].join('.'))
      : [];

    return [...styleKeyIssues, ...collectDashedStyleKeys(child, childPath)];
  });
}

describe('style key casing', () => {
  it('validates and compiles canonical camelCase style keys from the stylesheet', () => {
    const document: TopoDocument = {
      version: '0.2',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          {
            id: 'a',
            labels: { name: 'A' },
            layers: ['physical'],
            position: [0, 0]
          },
          { id: 'b', labels: { name: 'B' }, layers: ['physical'], position: [180, 0] }
        ],
        links: [
          {
            id: 'a-b',
            source: 'a',
            target: 'b',
            layers: ['physical']
          }
        ],
        paths: [
          {
            id: 'path-a-b',
            sequence: ['a', 'b'],
            layers: ['physical']
          }
        ],
        regions: [
          {
            id: 'region-ab',
            layers: ['physical'],
            members: ['a', 'b']
          }
        ]
      },
      diagram: {
        shapes: [
          {
            id: 'shape-1',
            type: 'rectangle',
            layers: ['physical'],
            position: [0, 160],
            size: [120, 48]
          }
        ],
        callouts: [
          {
            id: 'callout-1',
            layers: ['physical'],
            position: [220, 160],
            title: 'Note',
            body: 'Canonical style keys',
            target: 'a'
          }
        ]
      },
      stylesheet: [
        {
          selector: 'node[id = "a"]',
          style: { backgroundColor: '#dbeafe', borderColor: '#1d4ed8', borderWidth: 3, labelFontSize: 11 }
        },
        { selector: 'link[id = "a-b"]', style: { lineColor: '#dc2626', lineWidth: 4, lineDashPattern: '4 2' } },
        { selector: 'path[id = "path-a-b"]', style: { lineColor: '#7c3aed', lineWidth: 5, targetArrowShape: 'triangle' } },
        {
          selector: 'region[id = "region-ab"]',
          style: {
            backgroundColor: 'rgba(14, 165, 233, 0.18)',
            borderColor: '#0284c7',
            borderWidth: 2,
            labelColor: '#0f172a',
            labelPosition: 'topRight',
            labelMargin: 16
          }
        },
        { selector: 'shape[id = "shape-1"]', style: { fill: '#111827', stroke: '#f59e0b', borderWidth: 5 } },
        {
          selector: 'callout[id = "callout-1"]',
          style: { backgroundColor: '#f8fafc', borderColor: '#38bdf8', borderWidth: 2, titleColor: '#0f172a' }
        },
        { selector: 'link[id = "callout-1:leader"]', style: { lineColor: '#22c55e', lineWidth: 2 } }
      ]
    };

    expect(() => validateTopoDocument(document)).not.toThrow();

    const compiled = compileTopoGraph(document, ['physical']);
    const nodeA = compiled.nodes.find((node) => node.id === 'a');
    const region = compiled.nodes.find((node) => node.id === 'region:region-ab');
    const shape = compiled.nodes.find((node) => node.id === 'shape-1');
    const callout = compiled.nodes.find((node) => node.id === 'callout-1');
    const link = compiled.edges.find((edge) => edge.id === 'a-b');
    const pathEdge = compiled.edges.find((edge) => edge.id === 'path-a-b:0');
    const leader = compiled.edges.find((edge) => edge.id === 'callout-1:leader');

    expect(record(record(nodeA?.data).iconStyle)).toMatchObject({
      backgroundColor: '#dbeafe',
      borderColor: '#1d4ed8',
      borderWidth: 3
    });
    expect(region?.data).toMatchObject({ fill: 'rgba(14, 165, 233, 0.18)', stroke: '#0284c7', borderWidth: 2 });
    expect(record(record(region?.data).labelStyle)).toMatchObject({ top: 16, right: 16, left: 'auto' });
    expect(shape?.data).toMatchObject({ fill: '#111827', stroke: '#f59e0b', borderWidth: 5 });
    expect(record(record(callout?.data).shapeStyle)).toMatchObject({
      backgroundColor: '#f8fafc',
      borderColor: '#38bdf8',
      borderWidth: 2
    });
    expect(link?.style).toMatchObject({ stroke: '#dc2626', strokeWidth: 4, strokeDasharray: '4 2' });
    expect(pathEdge?.style).toMatchObject({ stroke: '#7c3aed', strokeWidth: 5 });
    expect(leader?.style).toMatchObject({ stroke: '#22c55e', strokeWidth: 2 });
  });

  it('rejects inline appearance ownership on canonical topology objects', () => {
    const cases: Array<[string, unknown]> = [
      ['node style', { graph: { nodes: [{ id: 'a', style: { backgroundColor: '#fff' } }] } }],
      ['link style', { graph: { nodes: [{ id: 'a' }, { id: 'b' }], links: [{ id: 'a-b', source: 'a', target: 'b', style: { lineColor: '#fff' } }] } }],
      ['path style', { graph: { nodes: [{ id: 'a' }, { id: 'b' }], paths: [{ id: 'path', sequence: ['a', 'b'], style: { lineColor: '#fff' } }] } }],
      ['region style', { graph: { regions: [{ id: 'region', style: { borderColor: '#fff' } }] } }],
      ['shape style', { diagram: { shapes: [{ id: 'shape', style: { borderColor: '#fff' } }] } }],
      ['callout style', { diagram: { callouts: [{ id: 'callout', style: { backgroundColor: '#fff' } }] } }],
      ['callout leader style', { diagram: { callouts: [{ id: 'callout', leader: { lineColor: '#fff' } }] } }]
    ];

    cases.forEach(([name, document]) => {
      const canonicalDocument = { ...record(document), version: '0.2' } as unknown as TopoDocument;
      expect(() => validateTopoDocument(canonicalDocument), name).toThrow(/not allowed in canonical topology objects/);
    });
  });

  it('rejects kebab-case style keys in the canonical stylesheet source', () => {
    const document = {
      stylesheet: [{ selector: 'node', style: { 'background-color': '#fff' } }]
    } as unknown as TopoDocument;

    expect(() => validateTopoDocument(document)).toThrow(/use camelCase style keys/);
  });

  it('keeps first-party example style blocks in camelCase', () => {
    const examplesRoot = path.join(process.cwd(), 'content', 'examples');
    const issues = collectYamlFiles(examplesRoot).flatMap((filePath) => {
      const parsed = YAML.load(fs.readFileSync(filePath, 'utf8'));
      return collectDashedStyleKeys(parsed).map((issue) => `${path.relative(examplesRoot, filePath)}:${issue}`);
    });

    expect(issues).toEqual([]);
  });
});
