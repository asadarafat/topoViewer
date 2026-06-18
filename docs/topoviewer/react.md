# React Usage

Install the package and its peer dependencies.

```bash
npm install topoviewer @xyflow/react react react-dom
```

Import the component and stylesheet.

```tsx
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const documentSpec: TopoDocument = {
  graph: {
    layers: [{ id: 'physical', name: 'Physical' }],
    nodes: [
      { id: 'R01', name: 'R01', labels: { node: 'router' }, layers: ['physical'], position: [120, 160] },
      { id: 'R02', name: 'R02', labels: { node: 'router' }, layers: ['physical'], position: [360, 160] }
    ],
    links: [
      { id: 'R01-R02', source: 'R01', target: 'R02', labels: { link: 'physical' }, layers: ['physical'] }
    ]
  },
  stylesheet: [
    {
      selector: 'node',
      style: {
        width: 82,
        height: 60,
        backgroundColor: '#6ea8fe',
        borderColor: '#d8e8ff'
      }
    },
    {
      selector: 'link',
      style: {
        lineColor: '#6ea8fe',
        lineWidth: 1
      }
    }
  ]
};

export function Diagram() {
  return (
    <TopoViewer
      document={documentSpec}
      selectedLayerIds={['physical']}
      toggles={{ showRegions: true, showEdgeLabels: false }}
      style={{ height: 520 }}
    />
  );
}
```

## Public Exports

```ts
import {
  attentionSourceKey,
  attentionStateKey,
  TopoViewer,
  buildAttentionIndex,
  buildAttentionIndexCached,
  compileTopoGraph,
  computeLayoutPositions,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  explainAttentionScore,
  lintTopoDocument,
  rebuildRegionNodes,
  resolveAttentionPresentationCached,
  resolveFocusQuery,
  scoreAttention,
  topoviewerToPdf,
  topoviewerToPng,
  topoviewerToSvg,
  validateTopoDocument
} from 'topoviewer';
```

| Export | Use |
|---|---|
| `TopoViewer` | React component. |
| `buildAttentionIndex` | Builds immutable lookup tables for graph IDs, labels, data fields, paths, regions, parent-child relationships, and adjacency. |
| `buildAttentionIndexCached` | Reuses compatible attention indexes by stable graph hash for repeated focus interactions. |
| `attentionSourceKey` / `attentionStateKey` | Returns stable keys for graph content and attention query state. |
| `resolveFocusQuery` | Resolves semantic focus queries into focused, related, context, and hidden object ID sets with reason metadata. |
| `deriveAggregateGraph` | Produces aggregate overview documents from regions, parent-child relationships, or label-defined groups without mutating the source graph. |
| `scoreAttention` / `deriveAttentionPresentation` | Calculates explainable scores and default visual states for focused, related, dimmed, hidden, aggregate, and suppressed objects. |
| `explainAttentionScore` | Returns the score reasons for one object. |
| `resolveAttentionPresentationCached` | Resolves focus, scoring, and presentation with cache keys based on source graph and attention state. |
| `validateTopoDocument` | Runtime validation for topology/stylesheet documents. |
| `lintTopoDocument` | Semantic lint for references, parent relationships, names, layers, selectors, limits, and unsafe references. |
| `compileTopoGraph` | Converts a TopoViewer document into React Flow-compatible nodes and edges. |
| `computeLayoutPositions` | Runs layout calculation for graph nodes. |
| `rebuildRegionNodes` | Recomputes region hulls after graph changes. |
| `topoviewerToPng` / `topoviewerToSvg` / `topoviewerToPdf` | Converts a rendered TopoViewer element into a static export. |
| `downloadTopoViewerPng` / `downloadTopoViewerSvg` / `downloadTopoViewerPdf` | Downloads a rendered TopoViewer element as a static export. |

## Static Export

Standalone apps can export the rendered viewport for slides or documentation.

```tsx
import { downloadTopoViewerPdf, downloadTopoViewerPng } from 'topoviewer';

const element = document.querySelector('.topoviewer') as HTMLElement;
await downloadTopoViewerPng(element, {
  fileName: 'subscriber-interface.png',
  pixelRatio: 2
});

await downloadTopoViewerPdf(element, {
  fileName: 'subscriber-interface.pdf',
  pixelRatio: 2
});
```

The export helper targets the internal React Flow viewport when present, so graph objects, shapes, callouts, and callout lines are captured together.

Focused and aggregate views export the current rendered attention state. SVG is the most inspectable target for preserving dimming, hidden context, aggregate objects, and label priority; PNG/PDF are snapshots of that rendered viewport.

The package also exports TypeScript types for topology documents, graph entities, style rules, layout config, toggles, and component props.

## Attention Queries

The attention runtime APIs are UI-independent. Build an index once for a topology document, then resolve focus queries for paths, regions, labels, data fields, selectors, or dependency traversal. See [Topology attention](attention.md) for the full TypeScript reference, aggregation examples, scoring options, and MkDocs syntax.

```ts
import { buildAttentionIndex, resolveFocusQuery } from 'topoviewer';

const index = buildAttentionIndex(documentSpec);

const pathFocus = resolveFocusQuery(index, {
  pathIds: ['svc-1001'],
  mode: 'dim-context'
});

const blastRadius = resolveFocusQuery(index, {
  ids: ['pe-1'],
  dependency: {
    from: ['pe-1'],
    direction: 'both',
    depth: 2
  },
  mode: 'hide-context'
});

const changedSinceRevision = resolveFocusQuery(index, {
  changes: {
    since: '2026-06-01T00:00:00Z',
    revision: 41
  },
  mode: 'dim-context'
});

console.log(Array.from(pathFocus.focusedIds));
console.log(blastRadius.reasons.get('pe-1'));
console.log(Array.from(changedSinceRevision.focusedIds));
```

`changes.since` checks common timestamp fields under `data.*`, including `changedAt`, `updatedAt`, `lastChangedAt`, and `modifiedAt`. `changes.revision` checks common revision fields such as `revision`, `version`, `changeRevision`, and `updatedRevision`. Numeric revisions are treated as increasing counters; opaque string revisions are treated as changed when they differ from the baseline.

For repeated focus interactions, use the cached helpers around the same document facts:

```ts
import { resolveAttentionPresentationCached } from 'topoviewer';

const presentation = resolveAttentionPresentationCached(documentSpec, {
  query: {
    pathIds: ['svc-1001'],
    mode: 'dim-context'
  }
});
```

The React component reads a top-level `document.attention` block as the document default. The `attention` prop accepts the same state directly and overrides the document default for controlled React views:

```tsx
<TopoViewer
  document={documentSpec}
  attention={{
    query: {
      ids: ['pe-1'],
      dependency: { from: ['pe-1'], direction: 'both', depth: 2 },
      mode: 'dim-context'
    }
  }}
/>
```

## Attention Metadata

TopoViewer keeps attention metadata generic. Put operational signals in `data.*` and select them through focus queries, scoring, or host-owned UI:

```yaml
graph:
  nodes:
    - id: pe-1
      labels:
        role: pe
        site: fra
      data:
        severity: critical
        changedAt: "2026-06-12T09:15:00Z"
        revision: 42
```

Built-in scoring recognizes common values such as `critical`, `major`, `minor`, `warning`, `degraded`, `down`, `maintenance`, and `changed` under fields like `severity`, `status`, `health`, `alarmSeverity`, `operState`, and `adminState`. Hosts can still define their own data fields and selectors without changing the graph schema.

## Component Props

| Prop | Type | Use |
|---|---|---|
| `document` | `TopoDocument` | Required topology plus stylesheet document. |
| `selectedLayerIds` | `string[]` | Visible layers. Defaults to all defined layers. |
| `toggles` | `TopoViewerToggles` | Display toggles such as `showRegions`, `showChildNodesInsideParents`, and `showEdgeLabels`. |
| `layout` | `LayoutConfig` | Optional runtime layout override. |
| `attention` | object | Optional focus query or precomputed attention presentation. Overrides `document.attention` when provided. |
| `extensions` | `TopoViewerExtension[]` | Optional extension hooks for private or project-specific node/edge types and compile transforms. |
| `controlPanelToggle` | object | Enables the in-viewport controls button used by embeds. |
| `onObjectClick` | function | Called when a rendered node or edge is clicked; useful for controlled attention state. |
| `onPaneClick` | function | Called when empty viewport space is clicked; use it to clear controlled attention state. |
| `className` | string | Extra class on the root container. |
| `style` | React CSSProperties | Inline root style, commonly used for height. |

## Extensions

Extensions are the supported boundary for project-specific capability that should not be generalized into the public package. A private package can add custom React Flow node types, edge types, document transforms, or compiled-graph transforms without importing TopoViewer internals.

```tsx
import { TopoViewer, type TopoDocument, type TopoViewerExtension } from 'topoviewer';
import { PremiumDeviceNode } from '@example/topoviewer-pro-devices';

const proDevices: TopoViewerExtension = {
  name: 'pro-devices',
  nodeTypes: {
    premiumDevice: PremiumDeviceNode
  },
  beforeCompile(document) {
    return {
      ...document,
      icons: {
        ...document.icons,
        'router.premium': {
          src: '/assets/pro/router.svg',
          alt: 'Premium router'
        }
      }
    };
  },
  afterCompile(graph) {
    return {
      ...graph,
      nodes: graph.nodes.map((node) => {
        const data = node.data as { labels?: Record<string, unknown> } | undefined;
        if (data?.labels?.node !== 'premium-device') {
          return node;
        }
        return {
          ...node,
          type: 'premiumDevice'
        };
      })
    };
  }
};

export function Diagram({ documentSpec }: { documentSpec: TopoDocument }) {
  return <TopoViewer document={documentSpec} extensions={[proDevices]} style={{ height: 640 }} />;
}
```

Keep extension packages separate from the core package when they contain customer-owned icon sets, customer-specific importers, private policy logic, or deployment-specific export workflows.

## Validation

Call `validateTopoDocument()` before rendering user-provided YAML.

```ts
const documentSpec = validateTopoDocument(parsedYaml, 'customer topology');
```

Validation is permissive about custom fields, but rejects malformed core graph objects. Surface validation errors to authors instead of silently rendering incomplete graphs.
