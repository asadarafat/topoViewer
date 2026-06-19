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
    return entry.isFile() && entry.name.endsWith('.yaml') ? [fullPath] : [];
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
  it('validates and compiles canonical camelCase style keys across style-bearing objects', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [
          {
            id: 'a',
            name: 'A',
            layers: ['physical'],
            position: [0, 0],
            style: {
              backgroundColor: '#dbeafe',
              borderColor: '#1d4ed8',
              borderWidth: 3,
              labelFontSize: 11
            }
          },
          { id: 'b', name: 'B', layers: ['physical'], position: [180, 0] }
        ],
        links: [
          {
            id: 'a-b',
            source: 'a',
            target: 'b',
            layers: ['physical'],
            style: { lineColor: '#dc2626', lineWidth: 4, lineDashPattern: '4 2' }
          }
        ],
        paths: [
          {
            id: 'path-a-b',
            sequence: ['a', 'b'],
            layers: ['physical'],
            style: { lineColor: '#7c3aed', lineWidth: 5, targetArrowShape: 'triangle' }
          }
        ],
        regions: [
          {
            id: 'region-ab',
            layers: ['physical'],
            members: ['a', 'b'],
            style: {
              backgroundColor: 'rgba(14, 165, 233, 0.18)',
              borderColor: '#0284c7',
              borderWidth: 2,
              labelColor: '#0f172a'
            }
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
            size: [120, 48],
            style: { fill: '#111827', stroke: '#f59e0b', borderWidth: 5 }
          }
        ],
        callouts: [
          {
            id: 'callout-1',
            layers: ['physical'],
            position: [220, 160],
            title: 'Note',
            body: 'Canonical style keys',
            target: 'a',
            style: { backgroundColor: '#f8fafc', borderColor: '#38bdf8', borderWidth: 2, titleColor: '#0f172a' },
            leader: { lineColor: '#22c55e', lineWidth: 2 }
          }
        ]
      }
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

  it('rejects kebab-case style keys at each style-bearing document location', () => {
    const cases: Array<[string, TopoDocument]> = [
      ['node style', { graph: { nodes: [{ id: 'a', style: { 'background-color': '#fff' } }] } }],
      ['link style', { graph: { nodes: [{ id: 'a' }, { id: 'b' }], links: [{ id: 'a-b', source: 'a', target: 'b', style: { 'line-color': '#fff' } }] } }],
      ['path style', { graph: { nodes: [{ id: 'a' }, { id: 'b' }], paths: [{ id: 'path', sequence: ['a', 'b'], style: { 'line-color': '#fff' } }] } }],
      ['region style', { graph: { regions: [{ id: 'region', style: { 'border-color': '#fff' } }] } }],
      ['shape style', { diagram: { shapes: [{ id: 'shape', style: { 'border-color': '#fff' } }] } }],
      ['callout style', { diagram: { callouts: [{ id: 'callout', style: { 'background-color': '#fff' } }] } }],
      ['callout leader style', { diagram: { callouts: [{ id: 'callout', leader: { 'line-color': '#fff' } }] } }],
      ['stylesheet rule style', { stylesheet: [{ selector: 'node', style: { 'background-color': '#fff' } }] }]
    ];

    cases.forEach(([name, document]) => {
      expect(() => validateTopoDocument(document), name).toThrow(/use camelCase style keys/);
    });
  });

  it('keeps first-party example style blocks in camelCase', () => {
    const examplesRoot = path.join(process.cwd(), 'examples', 'test-cases');
    const issues = collectYamlFiles(examplesRoot).flatMap((filePath) => {
      const parsed = YAML.load(fs.readFileSync(filePath, 'utf8'));
      return collectDashedStyleKeys(parsed).map((issue) => `${path.relative(examplesRoot, filePath)}:${issue}`);
    });

    expect(issues).toEqual([]);
  });
});
