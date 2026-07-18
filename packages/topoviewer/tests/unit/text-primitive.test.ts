import { describe, expect, it } from 'vitest';
import {
  compileTopoGraph,
  validateTopoDocument,
  type TopoDocument
} from '../../src';
import {
  copyAuthoringSelection,
  createAuthoringText,
  findAuthoringObject,
  planAuthoringResize,
  styleAuthoringMetadataByTarget
} from '../../src/authoring';

function documentWithText(): TopoDocument {
  return {
    graph: {
      layers: [{ id: 'annotations', labels: { name: 'Annotations' } }],
      nodes: [],
      links: []
    },
    diagram: {
      texts: [{
        id: 'note',
        text: '<script>alert(1)</script>\nMaintenance',
        position: [40, 80],
        size: [240, 72],
        layers: ['annotations']
      }]
    },
    stylesheet: [{
      selector: 'text',
      style: {
        color: '#172033',
        fontSize: 18,
        textAlign: 'center',
        verticalAlign: 'middle'
      }
    }]
  };
}

describe('diagram text primitive', () => {
  it('validates and compiles inert, layer-aware text nodes', () => {
    const document = validateTopoDocument(documentWithText());
    const graph = compileTopoGraph(document, ['annotations']);
    const text = graph.nodes.find((node) => node.id === 'note');

    expect(text?.type).toBe('text');
    expect(text?.position).toEqual({ x: 40, y: 80 });
    expect(text?.style).toMatchObject({ width: 240, height: 72 });
    expect(text?.data).toMatchObject({
      objectKind: 'text',
      text: '<script>alert(1)</script>\nMaintenance'
    });
    expect(compileTopoGraph(document, []).nodes.some((node) => node.id === 'note')).toBe(false);
  });

  it('publishes complete text style authoring metadata', () => {
    const paths = new Set(styleAuthoringMetadataByTarget.text.map((field) => field.path));
    for (const path of [
      'color', 'backgroundColor', 'borderColor', 'fontFamily', 'fontSize',
      'fontWeight', 'fontStyle', 'lineHeight', 'textAlign', 'verticalAlign',
      'padding', 'rotation', 'width', 'height', 'opacity', 'zIndex'
    ]) expect(paths.has(path), path).toBe(true);
    expect(styleAuthoringMetadataByTarget.text.find((field) => field.path === 'color')?.level).toBe('basic');
  });

  it('auto-fits new rich text and never exposes it as a link endpoint', () => {
    const document = documentWithText();
    const created = createAuthoringText(document, { position: { x: 300, y: 160 } });
    created.text = '**Maintenance**\n\n- Router A\n- Router B\n<script>alert(1)</script>';
    document.diagram?.texts?.push(created);

    const compiled = compileTopoGraph(document, ['annotations']).nodes.find((node) => node.id === created.id);

    expect(created.size).toBeUndefined();
    expect(compiled).toMatchObject({
      connectable: false,
      style: { height: 'max-content', maxWidth: 520, width: 'max-content' }
    });
    expect(compiled?.data).toMatchObject({ autoSize: true, objectKind: 'text' });

    const resize = planAuthoringResize(document, { id: created.id, kind: 'text' }, { x: 305, y: 165 }, {
      width: 280,
      height: 96
    });
    expect(resize.updates).toContainEqual(expect.objectContaining({
      path: ['diagram', 'texts', 1, 'size'],
      value: [280, 96]
    }));
  });

  it('creates, finds, copies, and resizes text through pure authoring APIs', () => {
    const document = documentWithText();
    const created = createAuthoringText(document, { position: { x: 300, y: 160 } });
    expect(created).toMatchObject({
      id: 'text-1',
      layers: ['annotations'],
      position: [300, 160],
      text: 'Text'
    });
    expect(findAuthoringObject(document, { id: 'note', kind: 'text' })?.text).toContain('Maintenance');
    expect(copyAuthoringSelection(document, [{ id: 'note', kind: 'text' }])).toHaveLength(1);

    const resize = planAuthoringResize(document, { id: 'note', kind: 'text' }, { x: 45, y: 90 }, {
      width: 280,
      height: 96
    });
    expect(resize.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['diagram', 'texts', 0, 'position', 0], value: 45 }),
      expect.objectContaining({ path: ['diagram', 'texts', 0, 'position', 1], value: 90 }),
      expect.objectContaining({ path: ['diagram', 'texts', 0, 'size', 0], value: 280 }),
      expect.objectContaining({ path: ['diagram', 'texts', 0, 'size', 1], value: 96 })
    ]));
  });
});
