# React

**Support status:** Supported

Render two routers in your application, select either router, and see its stable
ID beside the diagram. This recipe uses TopoViewer **0.5.0**, Node.js 22.12 or
newer, and a React/TypeScript app. See [documentation versions](../../start/documentation-versions.md)
when using newer development features.

## Create An App

```bash
npm create vite@latest router-app -- --template react-ts
cd router-app
npm install topoviewer@0.5.0 @xyflow/react react react-dom
npm run dev
```

Replace `src/App.tsx` with:

<!-- docs-check: react -->
```tsx
import { useState } from 'react';
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const document: TopoDocument = {
  version: '0.2',
  graph: {
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    nodes: [
      { id: 'R01', labels: { name: 'Edge A' }, layers: ['physical'], position: [100, 120] },
      { id: 'R02', labels: { name: 'Core B' }, layers: ['physical'], position: [380, 120] }
    ],
    links: [{ id: 'ethernet', source: 'R01', target: 'R02', layers: ['physical'] }]
  },
  layout: { mode: 'manual' },
  stylesheet: [
    { selector: 'node', style: { width: 100, height: 60, labelFontSize: 14 } },
    { selector: 'link', style: { targetArrowShape: 'none', lineWidth: 2 } }
  ]
};

export default function App() {
  const [selected, setSelected] = useState('None');
  return (
    <main>
      <h1>Router map</h1>
      <p role="status">Selected object: {selected}</p>
      <TopoViewer
        document={document}
        colorMode="light"
        nodesDraggable={false}
        onObjectClick={(object) => setSelected(object.id)}
        errorFallback={(issues) => <p role="alert">{issues[0]?.message}</p>}
        style={{ height: 400, width: '100%' }}
      />
    </main>
  );
}
```

Replace the Vite template's `src/index.css` with:

```css
body { margin: 0; font-family: system-ui, sans-serif; }
main { max-width: 960px; margin: auto; padding: 24px; }
```

**Check:** the browser shows Edge A and Core B joined by one undirected link.
Click Core B: the status text reads `Selected object: R02`. Resize the browser,
choose Fit View, then check both routers remain present.

The React prop is a composed runtime document. When authoring portable YAML,
keep topology facts and the stylesheet separate and compose them at the data
boundary, as shown below.

## Load Your Own YAML Bundle

Put your validated files in the app's public `diagrams/` directory. Install
`js-yaml` and its TypeScript declarations, then use its `load` function and
`composeTopoViewerDocument` to parse and validate the pair.

```bash
npm install js-yaml
npm install --save-dev @types/js-yaml
```

```tsx
import { load } from 'js-yaml';
import {
  composeTopoViewerDocument,
  type TopologyDocument,
  type StylesheetDocument
} from 'topoviewer';

async function loadBundle(signal: AbortSignal) {
  const paths = ['diagrams/topology.yaml', 'diagrams/stylesheet.yaml'];
  const sources = await Promise.all(paths.map(async (path) => {
    const response = await fetch(`${import.meta.env.BASE_URL}${path}`, { signal });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.text();
  }));
  return composeTopoViewerDocument(
    load(sources[0]) as TopologyDocument,
    load(sources[1]) as StylesheetDocument
  );
}
```

Composition validates source ownership and schema shape; type assertions here
only describe parsed values to TypeScript. They do not bypass that validation.
Run [semantic validation](../../author/validate-yaml.md) as well to check endpoint
IDs, layers, and other references.

Call `loadBundle` from an effect or your application's data loader. Show a
loading state, catch parse/HTTP/schema errors, and abort the request on cleanup
with `AbortController`. Apply a complete replacement document after loading;
keep the last valid document when a refresh fails and mark it stale in your UI.
Never display a failed refresh as healthy live data.

## Own State And Handle Failures

| Task | Supported API and host responsibility |
|---|---|
| Inspect selection | `onObjectClick` receives source `id`, opaque `runtimeId`, kind, and data. Use source IDs for your domain lookup. |
| Control multi-selection | Supply `selectedObjectIds`; use `onSelectionChange` to update host state. |
| Restore a viewport | Save `onViewportChange` output; supply it as `initialViewport` when remounting. Use `fitViewRequestId` for an explicit later fit. |
| Update inventory or telemetry | Derive a new document from validated data; retain stable IDs. The host owns collection and freshness. |
| Handle empty or invalid input | Use `emptyFallback`, `errorFallback`, and `onDiagnostics`. Keep diagnostics visible and actionable. |
| Export an image | Import helpers from `topoviewer/export`; preserve the source bundle separately. |
| Embed under a strict security policy | Serve source and assets from approved origins. Follow the [threat model](../../evaluate/threat-model.md); the host owns CSP and authentication. |

Use [Component props and events](../../reference/component-props.md) for the exact
contract. See [Debug Rendering](../../author/debug-rendering.md) for CSS, asset,
layer, and viewport failures. The [incident replay](../react-incident-replay.md)
shows a larger application-state pattern after this basic integration works.
