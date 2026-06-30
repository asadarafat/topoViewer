# React Usage

**Support status:** Pre-Publish Supported

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
  assertRendererLimits,
  effectiveRendererLimits,
  lintTopoDocument,
  rendererLimitUsage,
  rendererLimitViolations,
  DEFAULT_RENDERER_LIMITS,
  applyStyle,
  computeClosLayoutPositions,
  computeLayoutPositions,
  rebuildRegionNodes,
  compileTopoGraph,
  validateTopoDocument,
  CURRENT_SCHEMA_VERSION,
  migrateTopoDocument,
  migrateTopoToggles,
  attentionSourceKey,
  attentionStateKey,
  buildAttentionIndex,
  buildAttentionIndexCached,
  resolveFocusQuery,
  resolveAttentionPresentationCached,
  deriveAggregateGraph,
  deriveAttentionPresentation,
  scoreAttention,
  explainAttentionScore,
  type FocusQuery,
  type FocusResult,
  type AttentionPresentation,
  type AttentionPresentationResult,
  type AttentionGraphInput,
  type AttentionGraphIndex,
  TopoViewer,
  type TopoViewerProps,
  type TopoViewerExtension,
  type TopoViewerObjectClick,
  type TopoViewerNodePositionChange,
  type TopoViewerViewport,
  type TopoDocument,
  type TopoDocumentAttention,
  type TopoViewerToggles,
  type GraphNode,
  type GraphLink,
  type GraphRegion,
  type ClosInferLabelRole,
  type ClosLayoutOptions,
  type LayoutConfig,
  topoviewerToPdf,
  topoviewerToPng,
  topoviewerToSvg,
  downloadTopoViewerPdf,
  downloadTopoViewerPng,
  downloadTopoViewerSvg,
  NODE_SHAPES,
  normalizeNodeShape,
  parseNodeShapePoints,
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements,
  type LintIssue,
  type LintOptions
} from 'topoviewer';
```

| Export | Use |
|---|---|
| `TopoViewer` | React component. |
| `TopoViewerProps`, `TopoViewerObjectClick`, `TopoViewerNodePositionChange`, `TopoViewerViewport`, `TopoViewerExtension` | Canonical component props and event payload types. |
| `TopoDocument`, `LayoutConfig`, `ClosLayoutOptions`, `ClosInferLabelRole`, `GraphNode`, `GraphLink`, `GraphRegion`, `TopoDocumentAttention`, `TopoViewerToggles` | Main schema and runtime contract types for integration layers. |
| `attentionSourceKey`, `attentionStateKey` | Stable cache keys for graph content and attention query state. |
| `LintIssue` / `LintOptions` | Static linting result shapes and lint options. |
| `compileTopoGraph` | Converts a TopoViewer document into React Flow-compatible nodes and edges. |
| `rebuildRegionNodes` | Recomputes region hull and containment geometry after graph changes. |
| `computeLayoutPositions` | Executes the selected layout mode for graph nodes. |
| `computeClosLayoutPositions` | Executes the generic CLOS layout engine directly for tests or custom host workflows. |
| `applyStyle` | Applies a stylesheet style declaration against a base style object using existing style resolvers. |
| `buildAttentionIndex` / `buildAttentionIndexCached` | Builds immutable attention indexes and cache-aware reuse variant. |
| `resolveFocusQuery` | Resolves semantic focus input into focused/related/context/hidden object sets. |
| `resolveAttentionPresentationCached` | Resolves presentation with cache keys based on graph and attention state. |
| `deriveAggregateGraph` / `deriveAttentionPresentation` / `scoreAttention` / `explainAttentionScore` | Builds aggregate-overview documents and explains scoring behavior. |
| `AttentionGraphIndex` / `AttentionGraphInput` / `AttentionPresentation` / `AttentionPresentationResult` / `FocusQuery` / `FocusResult` | Attention engine type contracts. |
| `topoviewerToPng` / `topoviewerToSvg` / `topoviewerToPdf` | Converts a rendered TopoViewer element into a static export payload. |
| `downloadTopoViewerPng` / `downloadTopoViewerSvg` / `downloadTopoViewerPdf` | Downloads a rendered TopoViewer viewport as an artifact. |
| `assertRendererLimits`, `effectiveRendererLimits`, `rendererLimitUsage`, `rendererLimitViolations`, `DEFAULT_RENDERER_LIMITS` | Renderer safety/limit checks and observability APIs. |
| `validateTopoDocument` / `lintTopoDocument` | Runtime validation and semantic lint gates for user-authored documents. |
| `CURRENT_SCHEMA_VERSION`, `migrateTopoDocument`, `migrateTopoToggles` | Schema migration and backward compatibility helpers. |
| `NODE_SHAPES`, `normalizeNodeShape`, `parseNodeShapePoints`, `nodeBadgePositions`, `nodeBorderStyles`, `nodeIconFitValues`, `nodeLabelPositions`, `nodeLabelTextOverflowValues`, `nodeLabelTextWrapValues`, `nodeStatusPlacements` | Canonical style enums and normalizers for production tooling and IDE hints. |

## Framework-specific snippets

### Plain React (Vite/CRA)

```tsx
import { useMemo } from 'react';
import { parse } from 'yaml';
import { TopoViewer, validateTopoDocument, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const rawTopology = `
graph:
  id: demo
  layers:
    - id: physical
  nodes:
    - id: R01
      labels:
        node: router
      layers: [physical]
`;

export function TopologyPanel() {
  const document = useMemo<TopoDocument>(() => {
    return validateTopoDocument(parse(rawTopology), 'topology yaml');
  }, []);

  return <TopoViewer document={document} selectedLayerIds={['physical']} style={{ height: 640 }} />;
}
```

### Next.js (App Router)

`@xyflow/react` needs DOM APIs, so load TopoViewer client-side:

```tsx
// app/topology/page.tsx
import dynamic from 'next/dynamic';
import 'topoviewer/style.css';

const TopoViewer = dynamic(
  () => import('topoviewer').then((m) => m.TopoViewer),
  { ssr: false }
);

export default function TopologyPage() {
  return <div className="h-[680px]"><TopoViewer document={documentSpec} style={{ height: '100%' }} /></div>;
}
```

### Gatsby

Load TopoViewer inside browser-only components and avoid prerendering it as raw JSX in server-only paths.

```tsx
import { TopoViewer } from 'topoviewer';
import 'topoviewer/style.css';

export function TopologyIsland({ document }) {
  return <TopoViewer document={document} style={{ height: 600 }} />;
}
```

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
| `selectedObjectIds` | `string[]` | Pre-select node, edge, path, region, or `linkDirection` object IDs in controlled modes. |
| `toggles` | `TopoViewerToggles` | Display toggles such as `showRegions`, `showChildNodesInsideParents`, and `showEdgeLabels`. |
| `layout` | `LayoutConfig` | Optional runtime layout override. |
| `attention` | `{ query?: FocusQuery; presentation?: AttentionPresentationResult }` | Optional focus query or precomputed attention presentation. Overrides `document.attention` when provided. |
| `extensions` | `TopoViewerExtension[]` | Optional extension hooks for project-specific node/edge types and compile transforms. |
| `controlPanelToggle` | `{ enabled?: boolean; open?: boolean; onToggle?: () => void }` | Enables the in-viewport controls button used by embeds. |
| `onObjectClick` | `(object: TopoViewerObjectClick) => void` | Called when a rendered node, edge, or directional link lane is clicked; useful for controlled attention state. |
| `onPaneClick` | `() => void` | Called when empty viewport space is clicked; use it to clear controlled attention state. |
| `onNodePositionChange` | `(change: TopoViewerNodePositionChange) => void` | Fired when a node drag ends. |
| `onViewportChange` | `(viewport: TopoViewerViewport) => void` | Fired on pan/zoom commit; useful for sync/URL persistence. |
| `onExport` | `() => void` | Fired when the internal export toolbar action is clicked. |
| `className` | `string` | Extra class on the root container. |
| `style` | `React.CSSProperties` | Inline root style, commonly used for height. |

TopoViewer uses React Flow `fitView` so oversized diagrams fit into the
available viewport, but automatic fit is capped at `zoom: 1`. React Flow's
default scale is therefore the upper bound: small diagrams are not enlarged
beyond authored coordinates, while large diagrams can still scale down.

Directional link lanes emit `element: 'linkDirection'`. The event `id` is the
direction object ID, and `data` includes `linkId`, `parentLinkId`, `direction`,
`source`, and `target`. The parent physical link remains clickable as
`element: 'edge'`, so controlled UIs can choose between selecting the whole
adjacency or only one traffic direction.

## Production Checklist

- [ ] Validate documents with `validateTopoDocument` before rendering and show line-oriented errors to users.
- [ ] Run `lintTopoDocument` in CI and editor pipelines.
- [ ] Set explicit limits (`document.limits` or environment override) and monitor `rendererLimitUsage(...)` for guardrails.
- [ ] Keep `document`, `layout`, and `attention` inputs memoized for stable referential updates.
- [ ] Debounce user edits before recomputing attention to reduce layout churn.
- [ ] Confirm export behavior for dark/light themes before release.
- [ ] Add acceptance tests that cover selection, pane interactions, and attention mode transitions.
- [ ] Verify hydration paths in SSR frameworks with no client-side DOM access before mount.

## Error handling and caching guidance

### Error handling

- `validateTopoDocument()` throws on malformed topology documents and should be wrapped in a `try/catch` around authoring flows.
- `lintTopoDocument()` is non-throwing and returns structured issues (`error` / `warning`) suitable for UI badges, editor diagnostics, and pre-commit checks.
- `assertRendererLimits()` throws fast when payloads exceed production safety policy.

```ts
import { validateTopoDocument, lintTopoDocument, assertRendererLimits } from 'topoviewer';

try {
  const parsed = validateTopoDocument(rawDocument, 'customer topology');
  const issues = lintTopoDocument(parsed, { requireNames: true });
  if (issues.some((issue) => issue.severity === 'error')) {
    throw new Error(issues.map((issue) => issue.message).join('\n'));
  }
  assertRendererLimits(parsed);
  // render TopoViewer
} catch (error) {
  console.error('Topology load failed:', error);
}
```

### SSR and caching

- TopoViewer is browser-first because `@xyflow/react` depends on layout APIs; load it in client-only boundaries (`dynamic(..., { ssr: false })` in Next.js, browser-only Gatsby/React routes, or custom hydration guards).
- Use cache-aware APIs when interaction is focus-heavy:
  - `buildAttentionIndexCached`
  - `resolveAttentionPresentationCached`
- Prefer stable hashes over raw object references to cache expensive derived values for long-lived host pages.
- Keep parsing/validation outside render and memoize stable inputs to avoid repeated schema and layout work.

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
