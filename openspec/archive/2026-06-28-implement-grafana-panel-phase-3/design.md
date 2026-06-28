# Design

## Phase Boundary

Phase 3 persists Grafana panel runtime interaction state only:

```text
Grafana panel interaction
  -> panel interaction state
  -> session/browser storage
  -> transient TopoViewer props/extensions
```

The panel must not persist telemetry-derived style into topology YAML or
stylesheet YAML.

## State Model

```ts
interface PanelInteractionState {
  topologyIdentity: string;
  viewport?: { x: number; y: number; zoom: number };
  selectedObjectIds?: string[];
  focusedObjectIds?: string[];
  nodePositionOverrides?: Record<string, { x: number; y: number }>;
  updatedAt: string;
}
```

`topologyIdentity` is derived from `fixtureId` and `graph.id`. This avoids
applying a CLOS node override to a different fixture.

## Persistence Options

```ts
interaction?: {
  enabled?: boolean;
  allowNodeDrag?: boolean;
  persistViewport?: 'off' | 'session' | 'browser';
  persistSelection?: 'off' | 'session' | 'browser';
  persistNodePositions?: 'off' | 'session' | 'browser';
  resetOnTopologyIdentityChange?: boolean;
}
```

`session` is the default for the first implementation. `browser` is supported
for users who want local persistence across browser restarts. Dashboard-level
persistence remains future work because it needs a safer Grafana API contract.

## Merge Order

```text
canonical topology positions
  -> layout result
  -> local node position overrides
  -> telemetry style overlays
```

Position overrides are applied through a TopoViewer extension before compile.
Telemetry overlays are separate extensions and only affect style/data state.

## TopoViewer Core Hooks

Phase 3 adds two small core props:

- `initialViewport`: restores React Flow `defaultViewport` on mount;
- `nodesDraggable`: lets host surfaces disable drag without forking renderer
  behavior.

Existing callbacks are reused:

- `onViewportChange`;
- `onNodePositionChange`;
- `onObjectClick`;
- `onPaneClick`.

## UX Contract

- Click object: selected/focused state is stored according to
  `interaction.persistSelection`.
- Click empty pane: selection/focus clears.
- Pan/zoom: viewport is stored according to `interaction.persistViewport`.
- Drag node: local node position override is stored according to
  `interaction.persistNodePositions`.
- Reset positions: clears local node position overrides only.

## Phase 3 Finding

React Flow viewport restore is mount-time state. The panel keys the TopoViewer
instance by topology identity so restored viewport state is applied on refresh
and fixture changes. Live controlled viewport synchronization remains future
work unless a stronger user need appears.
