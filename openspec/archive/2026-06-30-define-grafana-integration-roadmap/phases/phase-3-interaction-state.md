## Phase 3: Interactive Panel Runtime State

### Goal

Make the Grafana panel operationally interactive without turning Grafana into
the primary authoring surface.

### Required Interactions

- pan;
- zoom;
- fit to view;
- hover object inspection;
- select object;
- focus object and clear focus;
- drag nodes when enabled;
- reset local node position overrides.

### Runtime State

```ts
interface PanelInteractionState {
  topologyIdentity: string;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  selectedObjectIds?: string[];
  focusedObjectIds?: string[];
  nodePositionOverrides?: Record<string, { x: number; y: number }>;
  updatedAt: string;
}
```

### Merge Order

```text
base topology positions
  -> layout result, if layout is enabled
  -> saved/persisted node position overrides
  -> current drag preview position
```

Telemetry overlays affect visual and attention state. They must not overwrite
position overrides.

### Panel Options

```text
interaction.enabled: boolean
interaction.allowNodeDrag: boolean
interaction.persistViewport: "off" | "session" | "browser"
interaction.persistSelection: "off" | "session" | "browser"
interaction.persistNodePositions: "off" | "session" | "browser"
interaction.resetOnTopologyIdentityChange: boolean
```

### Persistence Policy

- `session`: required first implementation.
- `browser`: optional if straightforward.
- `dashboard`: future only; do not promise until Grafana APIs are proven safe.

### Acceptance

- User can drag a node and keep the moved position across dashboard refresh when
  enabled.
- Telemetry refresh does not clear viewport, focus, selection, or drag state.
- Reset clears local position overrides but preserves current telemetry-derived
  styles.
- Dragging an endpoint node does not break link attachment or metric matching.
