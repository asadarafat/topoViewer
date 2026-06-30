# TypeScript API

The `topoviewer` package exposes a React renderer, document composition and
validation helpers, the graph compiler, layout engines, style metadata,
attention helpers, export helpers, renderer-limit guards, and public model
types.

Use this page when you are embedding TopoViewer in a TypeScript product. Use
the nested schema pages when you need the accepted YAML shape for topology,
nodes, links, layers, styles, layouts, or mapper documents.

## Install And Import

```bash
npm install topoviewer @xyflow/react react react-dom
```

```tsx
import {
  TopoViewer,
  composeTopoViewerDocument,
  validateTopoDocument,
  lintTopoDocument,
  compileTopoGraph,
  defaultTopoViewerToggles,
  type TopoDocument,
  type TopoViewerObjectClick,
  type TopoViewerViewport
} from 'topoviewer';
import 'topoviewer/style.css';
```

Expected result: your application imports one renderer, one document contract,
and the same validation/compiler helpers used by docs, the harness, and tests.

## Stability Labels

| Label | Meaning |
|---|---|
| Supported | Intended for application code. Breaking changes require migration notes. |
| Advanced | Public but lower-level. Prefer the higher-level wrapper unless you need exact control. |
| Experimental | Useful today, but the contract may change while the feature matures. |

## Minimal Rendered Topology

```tsx
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const document: TopoDocument = {
  graph: {
    id: 'api-basic',
    layers: [{ id: 'physical', name: 'Physical' }],
    nodes: [
      {
        id: 'PE1',
        name: 'PE1',
        labels: { role: 'pe' },
        layers: ['physical'],
        position: [160, 160]
      },
      {
        id: 'P1',
        name: 'P1',
        labels: { role: 'p' },
        layers: ['physical'],
        position: [420, 160]
      }
    ],
    links: [
      {
        id: 'PE1-P1',
        source: 'PE1',
        target: 'P1',
        layers: ['physical']
      }
    ]
  },
  layout: {
    mode: 'manual',
    width: 600,
    height: 320
  },
  labelFields: ['name'],
  stylesheet: [
    {
      selector: 'node',
      style: {
        shape: 'rectangle',
        width: 84,
        height: 60,
        borderWidth: 3,
        labelFontWeight: 800
      }
    },
    {
      selector: 'link',
      style: {
        curveStyle: 'straight',
        lineColor: '#42a5f5',
        lineWidth: 3,
        targetArrowShape: 'none'
      }
    }
  ]
};

export function NetworkDiagram() {
  return (
    <TopoViewer
      document={document}
      selectedLayerIds={['physical']}
      toggles={{ showEdgeLabels: false, showRegions: true }}
      style={{ height: 420 }}
    />
  );
}
```

Expected rendered result: two labeled rectangle nodes, one straight blue link,
and no edge label. Pan, zoom, selection, layer toggles, and renderer theming are
handled by `TopoViewer`.

Equivalent live viewport:

```topoviewer
topology: examples/graph/basic/topology.yaml
stylesheet: examples/graph/basic/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
title: TypeScript API basic render
```

## Document Composition

Use `composeTopoViewerDocument` when your product stores topology and stylesheet
YAML separately but renders a single `TopoDocument`.

```ts
import {
  composeTopoViewerDocument,
  validateTopoDocument,
  lintTopoDocument,
  type StylesheetDocument,
  type TopologyDocument,
  type TopoDocument
} from 'topoviewer';

const topology: TopologyDocument = {
  graph: {
    id: 'composed',
    layers: [{ id: 'physical' }],
    nodes: [
      { id: 'R1', name: 'R1', layers: ['physical'], position: [120, 120] }
    ]
  }
};

const stylesheet: StylesheetDocument = {
  layout: { mode: 'manual', width: 480, height: 280 },
  labelFields: ['name'],
  stylesheet: [
    {
      selector: 'node',
      style: { shape: 'rectangle', width: 82, height: 60 }
    }
  ]
};

const document = composeTopoViewerDocument(topology, stylesheet);
const valid: TopoDocument = validateTopoDocument(document);
const diagnostics = lintTopoDocument(valid);
```

Expected result: `document` contains graph facts and presentation in one object.
`validateTopoDocument` rejects malformed shape. `lintTopoDocument` returns
semantic warnings/errors such as missing endpoints, unknown layers, invalid
shape dimensions, unsupported style values, or renderer-limit concerns.

Related exports:

| Export | Stability | Use |
|---|---|---|
| `composeTopoViewerDocument` | Supported | Merge topology and stylesheet YAML into one document. |
| `ComposeTopoViewerDocumentOptions` | Supported | Options for compose behavior. |
| `validateTopoDocument` | Supported | Validate schema-level document correctness. |
| `lintTopoDocument` | Supported | Run semantic diagnostics. |
| `LintIssue` | Supported | One lint diagnostic. |
| `LintOptions` | Supported | Lint configuration. |
| `migrateTopoDocument` | Supported | Migrate older document shapes. |
| `migrateTopoToggles` | Supported | Migrate persisted toggle state. |
| `CURRENT_SCHEMA_VERSION` | Supported | Current schema version marker. |

## Compiler Output

Use `compileTopoGraph` when you need the render model before passing a document
to the component, for example to inspect selected layers, resolved styles, or
computed nodes/edges.

```ts
import { compileTopoGraph, rebuildRegionNodes, applyStyle } from 'topoviewer';

const compiled = compileTopoGraph(document, {
  selectedLayerIds: ['physical'],
  toggles: { showRegions: true, showEdgeLabels: true }
});

const firstNode = compiled.nodes[0];
const styledNode = applyStyle(firstNode, document.stylesheet ?? [], 'node');
const regions = rebuildRegionNodes(document.graph, compiled.nodes, document);
```

Expected result: `compiled.nodes` and `compiled.edges` are ready for the
renderer. `applyStyle` resolves selector-driven visual policy for custom
compiler workflows. `rebuildRegionNodes` recalculates region hull nodes after
you mutate graph objects in memory.

Related exports:

| Export | Stability | Use |
|---|---|---|
| `compileTopoGraph` | Supported | Compile a TopoViewer document into renderable graph state. |
| `applyStyle` | Advanced | Apply stylesheet rules to one object in compiler-style workflows. |
| `rebuildRegionNodes` | Advanced | Rebuild region hulls after graph changes. |

## React Renderer Props And Events

Use `TopoViewerProps` when wrapping the component in your own design system or
panel surface.

```tsx
import {
  TopoViewer,
  defaultTopoViewerToggles,
  type TopoViewerNodePositionChange,
  type TopoViewerObjectClick,
  type TopoViewerProps,
  type TopoViewerToggles,
  type TopoViewerViewport
} from 'topoviewer';

const toggles: TopoViewerToggles = {
  ...defaultTopoViewerToggles,
  showEdgeLabels: false
};

const props: TopoViewerProps = {
  document,
  selectedLayerIds: ['physical'],
  toggles,
  onObjectClick(event: TopoViewerObjectClick) {
    console.log(event.element, event.id);
  },
  onViewportChange(viewport: TopoViewerViewport) {
    localStorage.setItem('topoviewer.viewport', JSON.stringify(viewport));
  },
  onNodePositionChange(change: TopoViewerNodePositionChange) {
    console.log(change.id, change.position);
  },
  style: { height: 560 }
};

export function WrappedTopology() {
  return <TopoViewer {...props} />;
}
```

Expected rendered result: the same graph renders, but the host product owns
selection side effects, viewport persistence, and node-position persistence.

Related exports:

| Export | Stability | Use |
|---|---|---|
| `TopoViewer` | Supported | React component for rendering compiled TopoViewer documents. |
| `TopoViewerProps` | Supported | Props accepted by the React component. |
| `TopoViewerViewport` | Supported | Viewport state passed through events. |
| `TopoViewerObjectClick` | Supported | Object click event payload. |
| `TopoViewerNodePositionChange` | Supported | Node drag/persist event payload. |
| `TopoViewerToggles` | Supported | Layer and viewport toggle state. |
| `defaultTopoViewerToggles` | Supported | Default layer/control toggle state. |

## Layout APIs

Use `computeLayoutPositions` when topology YAML declares a layout mode and you
need deterministic positions before rendering or saving.

```ts
import {
  analyzeClosLayoutDiagnostics,
  computeClosLayoutPositions,
  computeLayoutPositions,
  type ClosInferLabelRole,
  type ClosLayoutDirection,
  type ClosLayoutOptions
} from 'topoviewer';

const nodes = document.graph.nodes ?? [];
const links = document.graph.links ?? [];

const positions = computeLayoutPositions(nodes, links, {
  mode: 'manual',
  width: 600,
  height: 320
});

const closOptions: ClosLayoutOptions = {
  direction: 'topToBottom' satisfies ClosLayoutDirection,
  maxStages: 10,
  nodeGap: 120,
  stageGap: 180,
  inferLabelRole: {
    'stage-1': ['super-spine', 'core'],
    'stage-2': ['spine'],
    'stage-3': ['leaf']
  } satisfies ClosInferLabelRole
};

const clos = computeClosLayoutPositions(nodes, links, {
  mode: 'clos',
  clos: closOptions
});
const closDiagnostics = analyzeClosLayoutDiagnostics(nodes, links, {
  mode: 'clos',
  clos: closOptions
});
```

Expected rendered result: nodes with generated positions render in stable
semantic rows. CLOS layouts use connection patterns first, optional label-role
overrides second, and report low-confidence or conflicting inference through
diagnostics.

Related exports:

| Export | Stability | Use |
|---|---|---|
| `computeLayoutPositions` | Supported | Calculate positions for configured layout modes. |
| `computeClosLayoutPositions` | Supported | Calculate generic CLOS positions. |
| `analyzeClosLayoutDiagnostics` | Supported | Inspect CLOS inference quality and conflicts. |
| `ClosLayoutOptions` | Supported | Options for generic CLOS layout. |
| `ClosLayoutDirection` | Supported | Direction type for generic CLOS layout. |
| `ClosInferLabelRole` | Supported | Explicit CLOS role override mapping type. |
| `ClosLayoutDiagnostic` | Supported | One CLOS layout diagnostic. |

## Style Metadata APIs

Covered exports: `DEFAULT_NODE_SHAPE`, `NODE_SHAPES`,
`canonicalStyleKeyByLowercase`, `isColorStyleKey`,
`isCommonLabelStyleKey`, `nodeBadgePositions`, `nodeBorderStyles`,
`nodeIconFitValues`, `nodeLabelPositions`,
`nodeLabelTextOverflowValues`, `nodeLabelTextWrapValues`,
`nodeStatusPlacements`, `normalizeNodeShape`, `parseNodeShapePoints`,
`styleDefaultDefinition`, `styleDefaultNumber`, `styleDefaultSummary`,
`styleDefaultValue`, `styleDefinitionForKey`, `styleDefinitions`,
`styleDefinitionsByKind`, and `styleValueDefinitionForKey`.

Use the style registry to drive form controls, Monaco suggestions, docs tables,
or validation in an embedding product.

```ts
import {
  DEFAULT_NODE_SHAPE,
  NODE_SHAPES,
  canonicalStyleKeyByLowercase,
  isColorStyleKey,
  isCommonLabelStyleKey,
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements,
  normalizeNodeShape,
  parseNodeShapePoints,
  styleDefaultDefinition,
  styleDefaultNumber,
  styleDefaultSummary,
  styleDefaultValue,
  styleDefinitionForKey,
  styleDefinitions,
  styleDefinitionsByKind,
  styleValueDefinitionForKey,
  type NodeBadgePosition,
  type NodeBorderStyle,
  type NodeIconFit,
  type NodeLabelPosition,
  type NodeLabelTextOverflow,
  type NodeLabelTextWrap,
  type NodeShapeName,
  type NodeShapePoint,
  type NodeStatusPlacement,
  type ParsedNodeShapePoints,
  type StyleDefault,
  type StyleKeyDefinition,
  type StyleTargetKind,
  type StyleValueDataType
} from 'topoviewer';

const shape: NodeShapeName = normalizeNodeShape('square');
const defaultShape = DEFAULT_NODE_SHAPE;
const shapeNames = NODE_SHAPES;
const lineColor = styleDefinitionForKey('link', 'lineColor');
const widthDefaultDefinition = styleDefaultDefinition('node', 'width');
const lineWidthDefault = styleDefaultNumber('link', 'lineWidth', 1);
const widthDefault = styleDefaultValue('node', 'width');
const widthHelp = styleDefaultSummary('node', 'width');
const iconFit = styleValueDefinitionForKey('node', 'iconFit');
const canonical = canonicalStyleKeyByLowercase.get('labelzindex');
const colorKey = isColorStyleKey('labelColor');
const labelKey = isCommonLabelStyleKey('labelFontSize');
const nodeKeys: StyleKeyDefinition[] = styleDefinitionsByKind.node;
const allKeys: StyleKeyDefinition[] = styleDefinitions;
const defaultMetadata: StyleDefault | undefined = widthDefaultDefinition?.default;
const polygonPoints: ParsedNodeShapePoints = parseNodeShapePoints('0,0 1,0 0.5,1');

const targetKind: StyleTargetKind = 'node';
const valueType: StyleValueDataType = iconFit?.dataType ?? 'string';
const rawPoint: NodeShapePoint = { x: 0.5, y: 1 };
const badge: NodeBadgePosition = nodeBadgePositions[0];
const border: NodeBorderStyle = nodeBorderStyles[0];
const fit: NodeIconFit = nodeIconFitValues[0];
const label: NodeLabelPosition = nodeLabelPositions[0];
const overflow: NodeLabelTextOverflow = nodeLabelTextOverflowValues[0];
const wrap: NodeLabelTextWrap = nodeLabelTextWrapValues[0];
const status: NodeStatusPlacement = nodeStatusPlacements[0];
```

Expected result: UI controls can show exactly the keys, enum values, defaults,
and data types supported by runtime rendering. This is the same registry used by
docs and YAML assist, so host tooling should not maintain a second style list.

## Attention APIs

Covered exports: `FocusQueryError`, `attentionSourceKey`,
`attentionStateKey`, `buildAttentionIndex`, `buildAttentionIndexCached`,
`deriveAggregateGraph`, `deriveAttentionPresentation`,
`explainAttentionScore`, `resolveAttentionPresentationCached`,
`resolveFocusQuery`, and `scoreAttention`.

Use attention APIs when a host product wants object focus, path focus, change
focus, blast-radius views, label priority, or aggregate summaries.

```ts
import {
  FocusQueryError,
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndex,
  buildAttentionIndexCached,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  resolveAttentionPresentationCached,
  resolveFocusQuery,
  scoreAttention,
  type AggregateGraphResult,
  type AttentionGraphIndex,
  type AttentionPresentationResult,
  type AttentionRuntimeState,
  type AttentionScoreResult,
  type FocusPresentationMode,
  type FocusQuery,
  type FocusResult
} from 'topoviewer';

const index: AttentionGraphIndex = buildAttentionIndex(document);
const query: FocusQuery = {
  ids: ['PE1'],
  dependency: { from: ['PE1'], direction: 'both', depth: 1 },
  mode: 'dim-context' satisfies FocusPresentationMode
};

let focus: FocusResult;
try {
  focus = resolveFocusQuery(index, query);
} catch (error) {
  if (error instanceof FocusQueryError) {
    console.error(error.code, error.message);
  }
  throw error;
}

const presentation: AttentionPresentationResult = deriveAttentionPresentation(index, focus);
const aggregate: AggregateGraphResult = deriveAggregateGraph(document, index, {
  groups: [{ id: 'pe-role', by: 'label', key: 'role', value: 'pe' }]
});
const score: AttentionScoreResult = scoreAttention(index, focus);
const explanation = explainAttentionScore(score, 'PE1');

const sourceKey = attentionSourceKey(document);
const stateKey = attentionStateKey(query);
const cachedIndex = buildAttentionIndexCached(document);
const cachedPresentation = resolveAttentionPresentationCached(document, {
  query
} satisfies AttentionRuntimeState);
```

Expected rendered result: pass `presentation` to `TopoViewer` as an attention
state to dim or hide context while keeping the same source graph. Aggregate
helpers can replace dense regions or labels with summary objects for large
topologies.

Additional attention types exported for strongly typed host state:
`AttentionGraphInput`, `AttentionIndexedObject`, `AttentionObjectByKind`,
`AttentionObjectKind`, `FocusDependencyDirection`, `FocusDependencyQuery`,
`FocusChangeQuery`, `FocusQueryErrorCode`, `AttentionViewportPolicy`,
`AggregateGroupDefinition`, `AggregateGroupKind`, `AggregateGroupSummary`,
`DeriveAggregateGraphOptions`, `LabelAggregateGroupDefinition`,
`LinkAggregateGroupSummary`, `LinkGroupingKey`, `LinkGroupingOptions`,
`LinkGroupingViewportPolicy`, `ParentAggregateGroupDefinition`,
`RegionAggregateGroupDefinition`, `AttentionLabelPriority`,
`AttentionPresentation`, `AttentionPresentationState`, `AttentionScore`,
and `AttentionScoringOptions`.

## Static Export APIs

Covered exports: `downloadTopoViewerPdf`, `downloadTopoViewerPng`,
`downloadTopoViewerSvg`, `topoviewerToPdf`, `topoviewerToPng`,
and `topoviewerToSvg`.

Use export helpers when a user needs a screenshot or artifact of the current
rendered viewport.

```ts
import {
  downloadTopoViewerPdf,
  downloadTopoViewerPng,
  downloadTopoViewerSvg,
  topoviewerToPdf,
  topoviewerToPng,
  topoviewerToSvg,
  type StaticExportOptions,
  type StaticPdfExportOptions
} from 'topoviewer';

const viewport = document.querySelector('.topoviewer') as HTMLElement;

const options: StaticExportOptions = {
  fileName: 'topology.png',
  pixelRatio: 2
};

const pdfOptions: StaticPdfExportOptions = {
  fileName: 'topology.pdf',
  pixelRatio: 2,
  orientation: 'landscape'
};

const png = await topoviewerToPng(viewport, options);
const svg = await topoviewerToSvg(viewport, { fileName: 'topology.svg' });
const pdf = await topoviewerToPdf(viewport, pdfOptions);

await downloadTopoViewerPng(viewport, options);
await downloadTopoViewerSvg(viewport, { fileName: 'topology.svg' });
await downloadTopoViewerPdf(viewport, pdfOptions);
```

Expected result: PNG/PDF exports preserve the rendered viewport as a snapshot.
SVG export is the most inspectable option when the consumer needs vector output
or wants to review attention, label, shape, and direction-lane geometry.

## Renderer Limits

Covered exports: `DEFAULT_RENDERER_LIMITS`, `effectiveRendererLimits`,
`rendererLimitUsage`, `rendererLimitViolations`, and
`assertRendererLimits`.

Use limits before rendering untrusted or very large YAML.

```ts
import {
  DEFAULT_RENDERER_LIMITS,
  assertRendererLimits,
  effectiveRendererLimits,
  rendererLimitUsage,
  rendererLimitViolations
} from 'topoviewer';

const checkedDocument = {
  ...document,
  limits: {
    maxNodes: 2000
  }
};

const limits = effectiveRendererLimits(checkedDocument);
const usage = rendererLimitUsage(document);
const violations = rendererLimitViolations(checkedDocument);

if (violations.length) {
  throw new Error(violations.join('\n'));
}

assertRendererLimits(checkedDocument);
```

Expected result: hostile or accidentally huge graphs fail with diagnostics
before React Flow, docs embeds, or Grafana panels try to render them.

## Extensions

Use extensions only when your product needs private rendering behavior that is
not part of the public YAML contract.

```ts
import type {
  TopoViewerExtension,
  TopoViewerExtensionContext
} from 'topoviewer';

const extension: TopoViewerExtension = {
  id: 'private-device-menu',
  beforeCompile(document, context: TopoViewerExtensionContext) {
    console.debug(context);
    return document;
  }
};
```

Expected result: the host application can compose private behavior around the
renderer without adding undocumented YAML keys to shared topology files.

## Public Model Types

Use these types when building strongly typed topology authoring tools,
generators, importers, or product integrations.

Graph and document types:
`TopoDocument`, `TopologyDocument`, `StylesheetDocument`, `GraphDefinition`,
`GraphNode`, `GraphLink`, `GraphPath`, `GraphRegion`, `LayerDefinition`,
`IconSpec`, `StyleRule`, `StyleDeclaration`, `LayoutConfig`,
`DiagramDefinition`, `DiagramShape`, `DiagramCallout`, `DiagramConnector`,
`DiagramPin`, and `ToggleDefinition`.

Renderer and extension types:
`TopoViewerProps`, `TopoViewerViewport`, `TopoViewerObjectClick`,
`TopoViewerNodePositionChange`, `TopoViewerToggles`, `TopoViewerExtension`,
and `TopoViewerExtensionContext`.

Layout types:
`ClosLayoutOptions`, `ClosLayoutDirection`, `ClosInferLabelRole`, and
`ClosLayoutDiagnostic`.

Style metadata types:
`StyleDefault`, `StyleKeyDefinition`, `StyleTargetKind`,
`StyleValueDataType`, `NodeShapeName`, `NodeShapePoint`,
`ParsedNodeShapePoints`, `NodeIconFit`, `NodeLabelPosition`,
`NodeBadgePosition`, `NodeBorderStyle`, `NodeLabelTextOverflow`,
`NodeLabelTextWrap`, and `NodeStatusPlacement`.

Attention types:
`AttentionGraphIndex`, `AttentionGraphInput`, `AttentionIndexedObject`,
`AttentionObjectByKind`, `AttentionObjectKind`, `FocusDependencyDirection`,
`FocusDependencyQuery`, `FocusChangeQuery`, `FocusPresentationMode`,
`FocusQuery`, `FocusQueryErrorCode`, `FocusResult`,
`AttentionViewportPolicy`, `AggregateGraphResult`,
`AggregateGroupDefinition`, `AggregateGroupKind`, `AggregateGroupSummary`,
`DeriveAggregateGraphOptions`, `LabelAggregateGroupDefinition`,
`LinkAggregateGroupSummary`, `LinkGroupingKey`, `LinkGroupingOptions`,
`LinkGroupingViewportPolicy`, `ParentAggregateGroupDefinition`,
`RegionAggregateGroupDefinition`, `AttentionLabelPriority`,
`AttentionPresentation`, `AttentionPresentationResult`,
`AttentionPresentationState`, `AttentionRuntimeState`, `AttentionScore`,
`AttentionScoreResult`, and `AttentionScoringOptions`.

## Export Checklist

Before adopting an API in application code:

- prefer `TopoViewer`, `TopoDocument`, `composeTopoViewerDocument`,
  `validateTopoDocument`, and `lintTopoDocument` for ordinary embedding;
- use `compileTopoGraph` and `applyStyle` only when you need lower-level graph
  inspection or custom host behavior;
- use `styleDefinitions` and `styleDefinitionForKey` for UI controls instead
  of maintaining another style-key list;
- use renderer limits before loading untrusted or generated topology;
- keep telemetry overlays outside source YAML unless you are deliberately
  authoring `*.mapper.tv.yaml` for Grafana.

## Next Steps

- [Topology schema](api-reference/schema/topology.md)
- [Style schema](api-reference/schema/style.md)
- [Mapper schema](api-reference/schema/mapper.md)
- [React guide](learn/guides/render-in-react.md)
