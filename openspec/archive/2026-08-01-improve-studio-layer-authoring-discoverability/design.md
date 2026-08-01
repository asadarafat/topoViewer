## Context

Layer definitions and object membership are part of `topology.yaml`. Layer
visibility is transient view state. The core package already owns pure plans
for layer creation, rename, reorder, membership, and deletion, while Studio
owns command dispatch and presentation. The current Project Source navigator
does not expose that capability clearly: Layers looks like an ordinary outline
row, has no disclosure icon, and navigates to YAML as a side effect of
expansion. Creation is hidden inside the expanded content and immediately adds
a generic layer.

The implementation must improve discovery without creating a second layer
model, moving layer state into a drawer, or adding a competing canvas-toolbar
control.

## Ownership Model

```text
topology.yaml graph.layers + object.layers
        |
        v
topoviewer pure authoring plans and projections
        |
        v
Studio controller command/history boundary
        |
        v
Project Source layer manager
```

- `topoviewer` owns deterministic layer IDs, mutation plans, reference
  traversal, and a pure usage-count projection.
- Studio's controller remains the only owner that applies plans, updates
  selection, records history, and persists through `StudioHost`.
- Project Source owns only ephemeral disclosure and dialog state.
- The renderer/host continues to own selected-layer visibility as view state.
- Browser and Wails hosts continue to mount the same Studio implementation.

## Interaction Contract

The Topology Outline SHALL render one explicit Layers header:

```text
[Layers] Layers                         4   [+] [expand]
```

The row body and actions have separate meanings:

- clicking the row or disclosure control expands or collapses the manager;
- clicking Add opens a create dialog without mutating YAML;
- clicking View YAML opens `topology.yaml` at `graph.layers`;
- selecting a layer row selects the canonical layer object for Properties;
- layer visibility remains independent of YAML mutation;
- rename, reorder, membership, and deletion continue through controller plans.

The create dialog requires a non-empty display name and previews the
collision-safe ID returned by the core helper. Confirmation recomputes the plan
from the latest project snapshot, commits exactly one command, and selects the
new layer. Cancel closes the dialog without changing source or history.

When a source draft is invalid, mutating actions are disabled because the
semantic projection is not authoritative. Expansion, source navigation,
selection, and visibility may remain available against the last valid
projection.

## Usage Projection

The UI needs a count of topology and diagram objects that reference each layer.
Studio SHALL NOT duplicate traversal over graph nodes, links, paths, regions,
diagram shapes, callouts, connectors, or texts. The core package will expose a
pure `authoringLayerReferenceCount(document, layerId)` projection backed by the
same internal collection traversal as layer mutation planning.

The count includes every supported layer-bearing object, including connectors
that are not selectable as ordinary topology objects. It does not mutate,
compile, or normalize the document.

## Component Boundaries

- `ProjectSourceNavigator` composes the Layers header, disclosure state, Add
  trigger, lazy loading, and source navigation.
- `LayerControls` owns the create form and the expanded layer-management list.
- `useStudioCanvasCapability` adapts UI intentions to the existing core plans
  and controller dispatcher.
- Layer mutation algorithms remain in `packages/topoviewer/src/core`.

The layer manager remains lazy-loaded. A collapsed Layers row must not pull its
feature module into the initial Studio bundle. Opening Add may expand and load
the manager before showing the dialog.

## Accessibility

- Add, expand/collapse, View YAML, visibility, reorder, membership, and delete
  controls have explicit accessible names.
- Expansion exposes `aria-expanded` and does not rely on icon shape alone.
- The create dialog associates the name field, generated-ID preview, validation
  state, and actions with Material UI form primitives.
- Keyboard focus returns to the Add trigger when the dialog closes.

## Validation Strategy

1. Add a core unit test proving usage counts include every supported object
   collection and return zero for unknown layers.
2. Add browser tests proving disclosure, Add cancellation/confirmation, source
   navigation, new-layer selection, usage updates, and invalid-draft guards.
3. Preserve existing CRUD, reorder, membership, visibility, and safe-delete
   browser coverage.
4. Run Studio type, unit, browser, accessibility, performance, and visual
   checks before the full repository CI gate.

## Risks And Mitigations

- **Stale generated ID preview:** confirmation recomputes against the current
  snapshot; the preview is informative, not authoritative.
- **Nested interactive controls:** the header uses sibling Material UI controls
  rather than placing buttons inside an accordion button.
- **Startup regression:** expanded content remains behind the existing lazy
  feature boundary.
- **Source/view confusion:** expansion and source navigation are separate
  commands, and visibility remains view state.
- **Mutation against invalid YAML:** all source-changing controls honor the
  existing `authoringDisabled` contract.

## Migration And Rollback

No YAML migration, schema change, host API change, or dependency is required.
Rollback removes the new Project Source presentation and usage projection while
leaving existing layer plans and persisted documents unchanged.
