import { expect, test } from '@playwright/test';
import {
  focusYamlEditorAt,
  topologyText,
  waitForHarnessReady,
  yamlCompletions,
  yamlHover,
  yamlShouldOpenHelp,
  yamlSuggestionWidgetVisible,
  yamlStyleMetadata,
  typeYamlEditorText,
  type StyleValueDataType
} from './harness-helpers';
import { exportViewportMessage } from '../src/webview/host';

test('suggests topology keys and node references in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const nodeKeySuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - ',
    lineNumber: 3,
    column: 7
  });
  expect(nodeKeySuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'id',
    'name',
    'labels',
    'data',
    'layers',
    'position'
  ]));

  const sourceSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  links:\n    - source: ',
    lineNumber: 3,
    column: 15
  });
  expect(sourceSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'fra-pe',
    'ams-p',
    'lon-pe'
  ]));

  const hover = await yamlHover(page, {
    document: 'topology',
    text: 'graph:\n  links:\n    - source: fra-pe',
    lineNumber: 3,
    column: 8
  });
  expect(hover?.contents).toContain('Source graph node ID');

  const labelContextSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - labels:\n        ',
    lineNumber: 4,
    column: 9
  });
  expect(labelContextSuggestions.map((suggestion) => suggestion.label)).not.toEqual(expect.arrayContaining([
    'id',
    'name',
    'position'
  ]));
  expect(labelContextSuggestions.map((suggestion) => suggestion.label)).toContain('labels entry');

  const positionSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - id: n1\n      position:\n        - ',
    lineNumber: 5,
    column: 11
  });
  expect(positionSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining(['0', '160', '320']));
  expect(positionSuggestions.map((suggestion) => suggestion.label)).not.toContain('node snippet');
});

test('uses TopoViewer schemas for topology key suggestions across document contexts', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const cases = [
    {
      name: 'root',
      text: '',
      lineNumber: 1,
      column: 1,
      expected: ['graph', 'diagram', 'toggles', 'layout', 'limits', 'attention']
    },
    {
      name: 'graph',
      text: 'graph:\n  ',
      lineNumber: 2,
      column: 3,
      expected: ['id', 'layers', 'nodes', 'links', 'paths', 'regions']
    },
    {
      name: 'node',
      text: 'graph:\n  nodes:\n    - ',
      lineNumber: 3,
      column: 7,
      expected: ['id', 'name', 'label', 'labels', 'data', 'layers', 'style', 'icon', 'position', 'parent', 'pins']
    },
    {
      name: 'link',
      text: 'graph:\n  links:\n    - ',
      lineNumber: 3,
      column: 7,
      expected: ['id', 'name', 'source', 'target', 'parent', 'labels', 'data', 'layers']
    },
    {
      name: 'path',
      text: 'graph:\n  paths:\n    - ',
      lineNumber: 3,
      column: 7,
      expected: ['id', 'name', 'sequence', 'source', 'target', 'parent', 'labels', 'data', 'layers']
    },
    {
      name: 'region',
      text: 'graph:\n  regions:\n    - ',
      lineNumber: 3,
      column: 7,
      expected: ['id', 'name', 'members', 'padding', 'paddingX', 'paddingY', 'minWidth', 'minHeight']
    },
    {
      name: 'attention',
      text: 'attention:\n  ',
      lineNumber: 2,
      column: 3,
      expected: ['query', 'interactive', 'clickMode', 'aggregate', 'links']
    },
    {
      name: 'attention query',
      text: 'attention:\n  query:\n    ',
      lineNumber: 3,
      column: 5,
      expected: ['ids', 'labels', 'data', 'pathIds', 'regionIds', 'selectors', 'dependency', 'changes', 'mode']
    }
  ];

  for (const completionCase of cases) {
    const suggestions = await yamlCompletions(page, {
      document: 'topology',
      text: completionCase.text,
      lineNumber: completionCase.lineNumber,
      column: completionCase.column
    });
    expect(suggestions.map((suggestion) => suggestion.label), completionCase.name)
      .toEqual(expect.arrayContaining(completionCase.expected));
  }
});

test('keeps labels, data, position, and reference contexts specific', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const dataContextSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - data:\n        ',
    lineNumber: 4,
    column: 9
  });
  expect(dataContextSuggestions.map((suggestion) => suggestion.label)).toContain('data entry');
  expect(dataContextSuggestions.map((suggestion) => suggestion.label)).not.toEqual(expect.arrayContaining(['id', 'name', 'position']));

  const pathSequenceSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  paths:\n    - sequence:\n        - ',
    lineNumber: 4,
    column: 11
  });
  expect(pathSequenceSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining(['fra-pe', 'ams-p', 'lon-pe']));

  const layerSuggestions = await yamlCompletions(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - layers:\n        - ',
    lineNumber: 4,
    column: 11
  });
  expect(layerSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining(['underlay', 'bgp', 'service']));
});

test('keeps YAML question mark help structural and literal text editable', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await expect(await yamlShouldOpenHelp(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - ',
    lineNumber: 3,
    column: 7
  })).toBeTruthy();

  await expect(await yamlShouldOpenHelp(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - name: Router',
    lineNumber: 3,
    column: 21
  })).toBeFalsy();

  await expect(await yamlShouldOpenHelp(page, {
    document: 'topology',
    text: 'graph:\n  nodes:\n    - name: "Router"',
    lineNumber: 3,
    column: 21
  })).toBeFalsy();

  await expect(await yamlShouldOpenHelp(page, {
    document: 'topology',
    text: 'graph:\n  # comment',
    lineNumber: 2,
    column: 6
  })).toBeFalsy();
});

test('suggests stylesheet selectors, style keys, and typed values in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const selectorSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: ',
    lineNumber: 2,
    column: 15
  });
  expect(selectorSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'node',
    'node[id = "fra-pe"]',
    'node[labels.role = "pe"]',
    'node[data.status = "ok"]'
  ]));

  const styleKeySuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      ',
    lineNumber: 4,
    column: 7
  });
  expect(styleKeySuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'shape',
    'borderColor',
    'labelPosition'
  ]));

  const enumSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      shape: ',
    lineNumber: 4,
    column: 14
  });
  expect(enumSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'ellipse',
    'hexagon',
    'diamond'
  ]));

  const colorSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      borderColor: ',
    lineNumber: 4,
    column: 20
  });
  expect(colorSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    '#1976d2',
    '#42a5f5',
    '#d32f2f',
    '#2e7d32'
  ]));

  const integerSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      width: ',
    lineNumber: 4,
    column: 14
  });
  expect(integerSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    '0',
    '16',
    '96'
  ]));
  expect(integerSuggestions.map((suggestion) => suggestion.label)).not.toContain('#1976d2');

  const invalidIndentSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n      ',
    lineNumber: 3,
    column: 7
  });
  expect(invalidIndentSuggestions.map((suggestion) => suggestion.label)).toContain('fix indentation');

  const hover = await yamlHover(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - selector: node\n    style:\n      borderColor: "#1976d2"',
    lineNumber: 4,
    column: 12
  });
  expect(hover?.contents).toContain('Border color');
});

test('uses TopoViewer schemas for stylesheet root, icon, layout, and style-rule keys', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const rootSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: '',
    lineNumber: 1,
    column: 1
  });
  expect(rootSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'layout',
    'limits',
    'icons',
    'labelFields',
    'toggles',
    'stylesheet'
  ]));

  const layoutSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'layout:\n  ',
    lineNumber: 2,
    column: 3
  });
  expect(layoutSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'mode',
    'width',
    'height',
    'inferLabelRole',
    'clos',
    'iterations',
    'linkDistance'
  ]));

  const closLayoutSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'layout:\n  clos:\n    ',
    lineNumber: 3,
    column: 5
  });
  expect(closLayoutSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'direction',
    'stageKey',
    'stageOrder',
    'inferLabelRole',
    'groupKey',
    'preservePinned',
    'pinnedNodeIds'
  ]));

  const iconSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'icons:\n  router:\n    ',
    lineNumber: 3,
    column: 5
  });
  expect(iconSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'glyph',
    'fill',
    'stroke',
    'svg',
    'src',
    'alt'
  ]));

  const styleRuleSuggestions = await yamlCompletions(page, {
    document: 'stylesheet',
    text: 'stylesheet:\n  - ',
    lineNumber: 2,
    column: 5
  });
  expect(styleRuleSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'selector',
    'style'
  ]));
});

test('surfaces empty YAML assist state and keeps editor keyboard behavior predictable', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  await page.getByRole('tab', { name: 'YAML', exact: true }).click();
  await focusYamlEditorAt(page, 1, 1);
  await page.keyboard.press('Control+Space');
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeTruthy();
  await page.keyboard.press('Tab');
  await expect.poll(() => topologyText(page)).not.toHaveLength(0);
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeFalsy();

  const scalarText = 'graph:\n  nodes:\n    - id: test-node\n      name: Router';
  await page.evaluate((value) => {
    const models = (window as any).monaco.editor.getModels();
    const topologyModel = models.find((model: { getValue: () => string }) => model.getValue().includes('graph:')) || models[0];
    topologyModel.setValue(value);
  }, scalarText);
  await focusYamlEditorAt(page, 4, scalarText.split('\n')[3].length + 1);
  await typeYamlEditorText(page, ' ');
  await expect.poll(() => topologyText(page)).toContain('name: Router ');
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeFalsy();

  await typeYamlEditorText(page, '?');
  await expect.poll(() => topologyText(page)).toContain('name: Router ?');
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeFalsy();

  await typeYamlEditorText(page, '  ');
  await expect.poll(() => topologyText(page)).toContain('name: Router ?  ');
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeFalsy();

  await typeYamlEditorText(page, '\n');
  await expect.poll(() => topologyText(page)).toContain('name: Router ?  \n');
  await page.keyboard.press('Escape');
  await expect.poll(() => yamlSuggestionWidgetVisible(page)).toBeFalsy();

  await focusYamlEditorAt(page, 4, '      name: Router ?  '.length + 1);
  await page.getByRole('button', { name: 'YAML assist' }).click();
  await expect(page.locator('.topoviewer-vscode-yaml-assist-empty')).toContainText('No YAML suggestions are valid at the current cursor.');
});

test('creates stable VS Code export messages', () => {
  expect(exportViewportMessage({
    dataUrl: 'data:image/png;base64,AAAA',
    fileName: 'topology.png',
    format: 'png'
  })).toEqual({
    type: 'exportViewport',
    dataUrl: 'data:image/png;base64,AAAA',
    fileName: 'topology.png',
    format: 'png'
  });
});

test('covers every stylesheet style key and value type in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const metadata = await yamlStyleMetadata(page);
  const seenDataTypes = new Set<StyleValueDataType>();

  for (const [kind, options] of Object.entries(metadata.optionsByKind)) {
    const suggestions = await yamlCompletions(page, {
      document: 'stylesheet',
      text: `stylesheet:\n  - selector: ${kind}\n    style:\n      `,
      lineNumber: 4,
      column: 7
    });
    const suggestionsByLabel = new Map(suggestions.map((suggestion) => [suggestion.label, suggestion]));

    for (const option of options) {
      const suggestion = suggestionsByLabel.get(option.key);
      expect(suggestion, `${kind}.${option.key} should be suggested`).toBeTruthy();
      expect(suggestion?.detail, `${kind}.${option.key} should include a grouping detail`).toBeTruthy();
      expect(suggestion?.documentation, `${kind}.${option.key} should document its value type`).toContain('Value type:');
    }
  }

  for (const [kind, definitions] of Object.entries(metadata.valueTypesByKind)) {
    for (const [key, definition] of Object.entries(definitions)) {
      seenDataTypes.add(definition.dataType);
      const valueLine = `      ${key}: `;
      const suggestions = await yamlCompletions(page, {
        document: 'stylesheet',
        text: `stylesheet:\n  - selector: ${kind}\n    style:\n${valueLine}`,
        lineNumber: 4,
        column: valueLine.length + 1
      });
      const labels = suggestions.map((suggestion) => suggestion.label);

      if (definition.dataType === 'enum') {
        expect(labels, `${kind}.${key} should suggest every enum value`).toEqual(expect.arrayContaining(definition.options || []));
        continue;
      }
      if (definition.dataType === 'boolean') {
        expect(labels, `${kind}.${key} should suggest boolean values`).toEqual(expect.arrayContaining(['true', 'false']));
        continue;
      }
      if (definition.dataType === 'color') {
        expect(labels, `${kind}.${key} should suggest palette colors`).toEqual(expect.arrayContaining(['#1976d2', '#42a5f5', '#d32f2f', '#2e7d32']));
        continue;
      }
      if (definition.dataType === 'integer') {
        expect(labels, `${kind}.${key} should suggest integer values`).toEqual(expect.arrayContaining(['0', '16', '96']));
        expect(labels, `${kind}.${key} should not suggest color values`).not.toContain('#1976d2');
        continue;
      }
      if (definition.dataType === 'number') {
        expect(labels, `${kind}.${key} should suggest numeric values`).toEqual(expect.arrayContaining(['0', '0.5', '1']));
        expect(labels, `${kind}.${key} should not suggest color values`).not.toContain('#1976d2');
        continue;
      }
      expect(labels, `${kind}.${key} text values should stay free-form`).toHaveLength(0);
    }
  }

  expect([...seenDataTypes].sort()).toEqual(['boolean', 'color', 'enum', 'integer', 'number', 'text']);
});

test('suggests mapper keys, resolver values, object IDs, and metric labels in YAML intelligence', async ({ page }) => {
  await page.goto('/');
  await waitForHarnessReady(page);

  const rootSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: '',
    lineNumber: 1,
    column: 1
  });
  expect(rootSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'version',
    'identity',
    'palette',
    'mappings',
    'mapper document snippet'
  ]));

  const paletteSeveritySuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\npalette:\n  ',
    lineNumber: 3,
    column: 3
  });
  expect(paletteSeveritySuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'success',
    'info',
    'warning',
    'error'
  ]));

  const paletteColorSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\npalette:\n  error:\n    color: ',
    lineNumber: 4,
    column: 12
  });
  expect(paletteColorSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    '"#d32f2f"',
    '"#c62828"'
  ]));

  const targetKindSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\nmappings:\n  - target:\n      kind: ',
    lineNumber: 4,
    column: 13
  });
  expect(targetKindSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'node',
    'link',
    'path',
    'region',
    'layer',
    'graph'
  ]));

  const resolverSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\nmappings:\n  - target:\n      resolve:\n        by: ',
    lineNumber: 5,
    column: 13
  });
  expect(resolverSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'id',
    'label',
    'data',
    'endpoint',
    'selector',
    'aggregate',
    'staticObjectIds'
  ]));

  const metricLabelSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\nidentity:\n  sourceIdLabel: ',
    lineNumber: 3,
    column: 18
  });
  expect(metricLabelSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'source_id',
    'node_id',
    'link_id',
    'path_id',
    'region_id'
  ]));

  const objectIdSuggestions = await yamlCompletions(page, {
    document: 'mapper',
    text: 'version: 1\nmappings:\n  - target:\n      kind: link\n      resolve:\n        objectIds: ',
    lineNumber: 6,
    column: 20
  });
  expect(objectIdSuggestions.map((suggestion) => suggestion.label)).toEqual(expect.arrayContaining([
    'underlay-fra-ams',
    'bgp-fra-rr'
  ]));

  const hover = await yamlHover(page, {
    document: 'mapper',
    text: 'version: 1\nmappings:\n  - metric: topoviewer_link_up',
    lineNumber: 3,
    column: 7
  });
  expect(hover?.contents).toContain('Grafana data-frame metric name');
});
