# React incident replay

**Support status:** Supported

This is an advanced, fictional application-state example. Incident names and customer-impact percentages are authored values; changing a button does not run a network simulation or isolate a real peer. Start with the [React quickstart](use-cases/react.md) before building this larger UI.

Physical fibers and control sessions use undirected strokes. Telemetry arrows mean data sent toward the Grafana display. The service link is an authored association. These link kinds have separate meaning even when they share endpoints.

Use the React package when TopoViewer is part of a product surface: an internal
portal, incident console, topology explorer, or customer-facing application.
The application owns state and interaction. TopoViewer receives a document,
selected layers, and optional attention state.

## Build the replay

Create a small Vite app:

```bash
npm create vite@latest topoviewer-noc-replay -- --template react-ts
cd topoviewer-noc-replay
npm install topoviewer@0.5.0 @xyflow/react react react-dom
npm run dev
```

Replace `src/App.tsx` with this component:

```tsx
import { useMemo, useState } from 'react';
import { TopoViewer, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';
import './App.css';

type Scenario = {
  name: string;
  title: string;
  focus: string;
  impact: string;
  badNodes: string[];
  badLinks: string[];
};

const scenarios: Scenario[] = [
  {
    name: 'T-00 Calm',
    title: 'All systems nominal',
    focus: 'grafana',
    impact: '0%',
    badNodes: [],
    badLinks: []
  },
  {
    name: 'T+07 Fiber cut',
    title: 'Atlantic fiber cut, traffic drains east',
    focus: 'lon-core',
    impact: '18%',
    badNodes: ['lon-core'],
    badLinks: ['fiber-sfo-lon']
  },
  {
    name: 'T+12 BGP leak',
    title: 'Route leak detected, controller isolates peer',
    focus: 'ams-edge',
    impact: '41%',
    badNodes: ['ams-edge', 'nrc'],
    badLinks: ['bgp-ams-nrc', 'svc-game']
  }
];

function includes(list: string[], id: string) {
  return list.includes(id);
}

function node(
  scenario: Scenario,
  id: string,
  displayName: string,
  kind: string,
  x: number,
  y: number,
  layers: string[]
) {
  return {
    id,
    labels: {
      name: displayName,
      kind,
      health: includes(scenario.badNodes, id) ? 'critical' : 'ok'
    },
    layers,
    position: [x, y] as [number, number]
  };
}

function link(
  scenario: Scenario,
  id: string,
  source: string,
  target: string,
  kind: string,
  layers: string[]
) {
  return {
    id,
    source,
    target,
    labels: {
      kind,
      health: includes(scenario.badLinks, id) ? 'critical' : 'ok'
    },
    layers
  };
}

function buildDocument(scenario: Scenario): TopoDocument {
  return {
    version: '0.2',
    graph: {
      id: 'noc-time-machine',
      layers: [
        { id: 'underlay', labels: { name: 'Underlay' } },
        { id: 'control', labels: { name: 'Control plane' } },
        { id: 'services', labels: { name: 'Services' } },
        { id: 'telemetry', labels: { name: 'Telemetry' } }
      ],
      nodes: [
        node(scenario, 'sfo-edge', 'SFO Edge', 'router', 90, 250, ['underlay', 'services']),
        node(scenario, 'lon-core', 'London Core', 'router', 360, 160, ['underlay', 'control']),
        node(scenario, 'ams-edge', 'AMS Edge', 'router', 650, 230, ['underlay', 'services', 'control']),
        node(scenario, 'nsp', 'NSP Intent Brain', 'controller', 480, 40, ['control', 'telemetry']),
        node(scenario, 'nrc', 'NRC Path Engine', 'controller', 720, 70, ['control']),
        node(scenario, 'grafana', 'Grafana NOC Wall', 'controller', 180, 55, ['telemetry']),
        node(scenario, 'game-pop', 'Game POP', 'customer', 930, 235, ['services'])
      ],
      links: [
        link(scenario, 'fiber-sfo-lon', 'sfo-edge', 'lon-core', 'fiber', ['underlay']),
        link(scenario, 'fiber-lon-ams', 'lon-core', 'ams-edge', 'fiber', ['underlay']),
        link(scenario, 'bgp-lon-nsp', 'lon-core', 'nsp', 'control', ['control']),
        link(scenario, 'bgp-ams-nrc', 'ams-edge', 'nrc', 'control', ['control']),
        link(scenario, 'telemetry-sfo', 'sfo-edge', 'grafana', 'telemetry', ['telemetry']),
        link(scenario, 'telemetry-ams', 'ams-edge', 'grafana', 'telemetry', ['telemetry']),
        link(scenario, 'svc-game', 'ams-edge', 'game-pop', 'service', ['services'])
      ],
      regions: [
        { id: 'west', labels: { name: 'US West' }, members: ['sfo-edge', 'grafana'] },
        { id: 'europe', labels: { name: 'Europe Backbone' }, members: ['lon-core', 'ams-edge'] },
        { id: 'control', labels: { name: 'Autonomous Control' }, members: ['nsp', 'nrc'] }
      ]
    },
    stylesheet: [
      {
        selector: 'node',
        style: {
          shape: 'rectangle',
          width: 96,
          height: 58,
          backgroundColor: '#203340',
          borderColor: '#9bbfd4',
          borderWidth: 2,
          labelColor: '#e6edf2',
          labelFontWeight: 800
        }
      },
      {
        selector: 'node[labels.kind = "controller"]',
        style: { backgroundColor: '#3a3349', borderColor: '#b4a1d0' }
      },
      {
        selector: 'node[labels.kind = "customer"]',
        style: { backgroundColor: '#243f37', borderColor: '#a7c8b8' }
      },
      {
        selector: 'node[labels.health = "critical"]',
        style: { backgroundColor: '#503536', borderColor: '#e0a0a0', borderWidth: 5 }
      },
      {
        selector: 'link',
        style: {
          lineColor: '#90b2ca',
          lineWidth: 2,
          lineOpacity: 0.72,
          targetArrowShape: 'none',
          targetArrowColor: '#90b2ca'
        }
      },
      {
        selector: 'link[labels.kind = "control"]',
        style: { lineColor: '#b4a1d0', lineWidth: 3, lineStyle: 'dashed' }
      },
      {
        selector: 'link[labels.kind = "telemetry"]',
        style: { targetArrowShape: 'triangle' }
      },
      {
        selector: 'link[labels.kind = "service"]',
        style: { lineColor: '#82baa0', lineWidth: 4 }
      },
      {
        selector: 'link[labels.health = "critical"]',
        style: { lineColor: '#e0a0a0', lineWidth: 7, lineOpacity: 1 }
      },
      {
        selector: 'region',
        style: {
          backgroundColor: 'rgba(14,165,233,.07)',
          borderColor: 'rgba(125,211,252,.28)',
          borderWidth: 1,
          labelColor: '#e6edf2'
        }
      }
    ]
  };
}

export default function App() {
  const [scenario, setScenario] = useState(scenarios[0]);
  const document = useMemo(() => buildDocument(scenario), [scenario]);

  return (
    <main className="appShell">
      <aside className="panel">
        <p className="eyebrow">React TopoViewer app</p>
        <h1>NOC Time Machine</h1>
        <p className="copy">
          Application state drives topology labels. TopoViewer renders the
          topology and attention state.
        </p>
        <strong>Customer impact: {scenario.impact}</strong>
        {scenarios.map((item) => (
          <button
            key={item.name}
            className={item.name === scenario.name ? 'active' : ''}
            onClick={() => setScenario(item)}
          >
            {item.name}
          </button>
        ))}
      </aside>
      <section className="stage">
        <header>
          <span>Live topology replay</span>
          <strong>{scenario.title}</strong>
        </header>
        <TopoViewer
          document={document}
          selectedLayerIds={['underlay', 'control', 'services', 'telemetry']}
          attention={{ query: { ids: [scenario.focus], mode: 'dim-context' } }}
          style={{ height: '100%' }}
        />
      </section>
    </main>
  );
}
```

Replace `src/App.css` with:

```css
body {
  margin: 0;
  min-height: 100vh;
  background: #182630;
  color: #e5f2ff;
  font-family: Inter, system-ui, sans-serif;
}

.appShell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 18px;
  height: 100vh;
  padding: 18px;
  box-sizing: border-box;
}

.panel,
.stage {
  border: 1px solid rgba(125, 211, 252, .24);
  background: rgba(5, 10, 24, .82);
  border-radius: 18px;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.stage {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.stage header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, .16);
}

.eyebrow {
  color: #9bbfd4;
  font-size: 12px;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.copy {
  color: #a7b9d6;
  line-height: 1.55;
}

button {
  cursor: pointer;
  border: 1px solid rgba(125, 211, 252, .25);
  background: rgba(14, 165, 233, .12);
  color: #dff7ff;
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  font: inherit;
}

button:hover,
button.active {
  background: #284858;
  border-color: rgba(125, 211, 252, .65);
}
```

## The UX Pattern

This is a real React pattern, not a static embed trick:

```text
click incident step
  -> update React state
  -> derive topology document
  -> pass document and attention query to TopoViewer
  -> inspect affected topology objects
```

The host application owns the scenario list, buttons, customer impact, and
incident title. TopoViewer owns graph rendering, styling, layer filtering, and
attention dimming.

## The DevX Pattern

Keep this boundary in your product:

```text
application state
  -> topology document
  -> stylesheet rules
  -> selected layers and attention query
  -> <TopoViewer />
```

The topology document is ordinary typed data. You can generate it from API
responses, source-of-truth data, local YAML, or a mapper result. The stylesheet
stays separate so visual policy does not get copied into every incident branch.

Use `validateTopoDocument()` before rendering user-provided or remotely loaded
documents. Use `lintTopoDocument()` when the UI should show warnings without
blocking every draft.

## Use This Pattern When

Use the React component when a product already has state and needs a topology
view:

- incident replay and NOC consoles;
- service dependency drilldowns;
- customer-impact views;
- topology previews in internal portals;
- generated topology from inventory or controller APIs;
- controlled selection, attention, and viewport persistence.

Use the static embed path instead when you need a no-build HTML page, CodePen
demo, MkDocs page, Zensical page, or another documentation-like surface.

## Production Notes

Memoize the `document`, selected layers, and attention query. Keep parsing,
validation, and topology generation outside render hot paths. Persist stable
topology source separately from runtime state so an incident replay cannot
corrupt the long-lived topology model.

For complete prop names, validation helpers, export helpers, and extension
hooks, use the [TypeScript API](../reference/typescript-api.md) reference.
