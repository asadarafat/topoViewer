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
  TopoViewer,
  compileTopoGraph,
  computeLayoutPositions,
  lintTopoDocument,
  rebuildRegionNodes,
  topoviewerToPdf,
  topoviewerToPng,
  topoviewerToSvg,
  validateTopoDocument
} from 'topoviewer';
```

| Export | Use |
|---|---|
| `TopoViewer` | React component. |
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

The package also exports TypeScript types for topology documents, graph entities, style rules, layout config, toggles, and component props.

## Component Props

| Prop | Type | Use |
|---|---|---|
| `document` | `TopoDocument` | Required topology plus stylesheet document. |
| `selectedLayerIds` | `string[]` | Visible layers. Defaults to all defined layers. |
| `toggles` | `TopoViewerToggles` | Display toggles such as `showRegions`, `showChildNodesInsideParents`, and `showEdgeLabels`. |
| `layout` | `LayoutConfig` | Optional runtime layout override. |
| `extensions` | `TopoViewerExtension[]` | Optional extension hooks for private or project-specific node/edge types and compile transforms. |
| `controlPanelToggle` | object | Enables the in-viewport controls button used by embeds. |
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
