# Design

## Current State

The Harness has the foundations needed for a real authoring surface:

- stable manual-layout starter topology;
- deterministic object insertion;
- semantic default layer-aware creation;
- selection and multi-selection;
- node dragging with persisted YAML positions;
- helper lines and drag smoothness coverage;
- connection/path/region/callout/shape CRUD through buttons and Inspector;
- candidate/apply YAML editing;
- diagnostics, YAML assist, undo/redo, and bundle export.

The limitation is interaction shape. The user still drives most creation and
editing through panels. A canvas-native editor should put the canvas in charge
of common actions while keeping YAML as the source of truth.

## Product Principle

Canvas authoring must be topology-aware, not whiteboard-first.

The editor may feel familiar to draw.io or PowerPoint, but the output is not an
opaque drawing. A user action creates or changes a TopoViewer object:

```text
pointer gesture / keyboard action
        -> topology mutation
        -> validated YAML
        -> rendered graph
```

If an action cannot be represented as clean TopoViewer YAML, it should not be a
primary authoring action.

## Authoring Modes

Use an explicit tool model:

```ts
type CanvasAuthoringTool =
  | 'select'
  | 'pan'
  | 'node'
  | 'router'
  | 'service'
  | 'controller'
  | 'external'
  | 'link'
  | 'path'
  | 'region'
  | 'callout'
  | 'shape'
  | 'text';
```

Initial support can map `text` to a callout or label-like diagram primitive if
there is no standalone text primitive yet. Do not expose unsupported tools in
the UI.

Tool behavior:

- `select`: click selects, shift-click toggles, drag empty canvas creates a
  marquee selection, drag selected objects moves them.
- `pan`: drag canvas pans the viewport.
- node preset tools: click canvas inserts the preset at the clicked topology
  coordinate.
- `link`: drag from a source node/handle to a target node/handle creates a link.
- `path`: click nodes in sequence, Enter commits, Escape cancels.
- `region`: drag a rectangle or create from current selection.
- `callout`: click target then click placement, or create from selected object.
- `shape`: drag rectangle/ellipse/line-like annotation where supported.

Authoring layer defaults are semantic, not a side effect of the visible layer
filter. New nodes, node presets, links, and regions should default to the
`physical` layer. New paths should default to the `paths` layer. Diagram
annotations such as callouts, shapes, and future text primitives should default
to the `annotations` layer. If a document does not declare one of those
preferred layers, the mutation helper should fall back to a declared layer
instead of writing an undeclared layer id.

Path authoring must preserve topology semantics without assuming every path is
a strict hop-by-hop physical walk. In IP networking a path can represent a
strict route over existing links, or an abstract/loose transport construct such
as an IGP shortcut, Binding SID tunnel, loose SID tunnel, or service path. The
canvas path tool may therefore create `graph.paths[]` sequences whose adjacent
nodes are not backed by direct visible `graph.links[]` entries.

The invariant is that every adjacent path node must be reachable through the
existing graph. A disconnected node cannot be added to a path. Path authoring
must not create hidden or phantom `graph.links[]` entries to manufacture that
reachability. If a path segment is backed by a direct existing link, the
renderer should make the path read as an overlay lane instead of visually
replacing that link. If a segment has graph reachability but no direct link,
the UI should treat it as a loose/tunnel segment and make that authoring state
visible.

## Data Flow

All direct-manipulation actions should reuse shared mutation helpers or add new
helpers under `packages/vscode-topoviewer/src/shared/`.

Recommended shape:

```ts
type AuthoringCommand =
  | { type: 'insertNodeAt'; preset: InsertObjectType; position: Point; layers: string[] }
  | { type: 'insertLinkBetween'; source: EndpointRef; target: EndpointRef; layers: string[] }
  | { type: 'insertPathSequence'; sequence: string[]; layers: string[] }
  | { type: 'insertRegionFromBounds'; bounds: Rect; members?: string[]; layers: string[] }
  | { type: 'insertCalloutAt'; target?: TopoObjectSelection; position: Point; layers: string[] }
  | { type: 'moveSelection'; selections: TopoObjectSelection[]; delta: Point }
  | { type: 'resizeObject'; selection: TopoObjectSelection; bounds: Rect }
  | { type: 'duplicateSelection'; selections: TopoObjectSelection[]; offset: Point }
  | { type: 'deleteSelection'; selections: TopoObjectSelection[] };
```

Each command becomes one durable undo/redo transaction. The transaction label
should describe the user action, such as `Place router`, `Draw link`, or
`Resize region`.

## Coordinate Model

Pointer coordinates must be converted through the current React Flow viewport
into topology coordinates. Do not infer positions from DOM pixels after zoom.

Creation coordinates should respect:

- current zoom/pan;
- semantic layer intent plus selected visible layer set as fallback context;
- snap grid when enabled;
- helper-line commit snap where applicable;
- parent/region/group context when the user creates inside a container.

## Region Container Model

The region tool supports two compatible YAML models:

- member-derived regions, where `members` define computed visual bounds;
- explicit region containers, where `position` and `size` define a durable
  canvas container that may start with `members: []`.

Clicking the Region tool on the canvas creates an explicit empty region
container. Dragging a bounds marquee creates an explicit region container and
adds any deterministically enclosed nodes as initial members. Dragging a node
into a region container adds that node to the region on drag stop. Dragging the
node back out does not release membership because that would make ordinary
layout cleanup destructive; releasing a node from a region is an explicit node
context-menu action.

Existing member-derived region YAML remains valid. Explicit region containers
must render even when empty, must survive reload, and must remain selectable
and draggable through the normal region node surface.

## Link Drawing

Link drawing needs a first-class interaction rather than combobox-only creation.

The minimum contract:

- dragging from a node body or visible handle starts a link preview;
- hovering a valid target node/handle highlights the target;
- dropping on a valid target creates a `graph.links[]` entry;
- dropping on empty canvas cancels unless a future "create node on drop" flow
  is explicitly implemented;
- source/target labels and handles must be recorded when they are supported by
  the schema and renderer;
- parallel links must receive deterministic IDs and must not overwrite existing
  links.

Do not implement link drawing by relying on React Flow's temporary edge state
alone. React Flow can provide interaction hooks, but the committed output must
be the shared TopoViewer topology mutation.

## Transform Handles

Supported direct geometry editing should be explicit:

- nodes: move, optional resize when width/height are object-specific or style
  override support exists;
- shapes: move and resize;
- callouts: move anchor/label position where supported;
- regions: move region if explicit region geometry exists or by translating
  member objects when region-as-group behavior is active.

For object families without a clean YAML target for resize or rotate, do not
show resize/rotate handles.

## Region Move Contract

Region bounds are derived from member objects unless a future schema revision
adds explicit persisted region geometry. Canvas-native authoring should
therefore treat a region as a topology-aware group, not as an independent
rectangle with its own durable position.

The selected behavior is:

- creating a region writes `graph.regions[].members`;
- canvas-created regions are draggable/selectable by default so the authored
  group can be manipulated immediately;
- creating or editing a top-level region removes its member nodes from sibling
  top-level regions by default; this prevents accidental duplicate ownership
  and overlapping region hulls while preserving explicit nested `parent`
  regions;
- drag-bounds region creation derives members from positioned nodes whose YAML
  positions fall inside the drag rectangle;
- region creation exits the region tool after completion so a follow-up drag
  moves the group instead of drawing another region;
- dragging an existing region translates member node positions when the
  operation can be persisted as one undoable YAML transaction;
- moving a parent region also translates member nodes in child regions;
- region drag must not write hidden region-only geometry;
- if member translation cannot be persisted safely for a selected object family,
  the UI should keep that drag visual/selection-only instead of inventing
  local state.

This keeps region behavior aligned with TopoViewer's model: the region is a
semantic grouping and a computed visual container. The durable geometry remains
on the member nodes, shapes, or callouts until the schema explicitly supports
region geometry.

Collapse/expand is intentionally separate from region geometry. The current
production path is attention aggregation (`attention.aggregate`) rather than
persisting a collapsed region rectangle. A future canvas-native collapse affordance
must be backed by that aggregate model or a schema addition; it must not hide
members in local React state only.

## Selection And Clipboard

Selection must behave predictably:

- click selects one object;
- shift-click toggles one object;
- drag empty canvas creates a marquee selection;
- Escape clears selection or cancels an active tool;
- Delete/Backspace deletes selected objects;
- Cmd/Ctrl+C copies selected topology objects as internal JSON/YAML;
- Cmd/Ctrl+V pastes with deterministic new IDs and an offset;
- Cmd/Ctrl+D duplicates selected objects;
- Cmd/Ctrl+Z/Y or Shift+Cmd/Ctrl+Z uses the existing undo/redo stack.

Clipboard behavior must preserve internal references where possible:

- duplicated links should point to duplicated endpoint nodes when both endpoints
  are included;
- links whose endpoints are not included should either be omitted or keep
  references only if that behavior is explicitly chosen and tested;
- regions should include only members present in the duplicated selection unless
  a "keep external members" option is added later.

## Alignment And Distribution

Canvas authoring should expose common layout commands:

- align left, center, right, top, middle, bottom;
- distribute horizontally/vertically;
- bring forward/send backward where diagram object ordering exists;
- nudge by arrow keys;
- larger nudge with Shift+arrow;
- optional grid snap.

These are deterministic YAML mutations and must be tested by checking object
positions after the command.

## UI Placement

The first production surface should use:

- a compact floating canvas toolbar for high-frequency tools;
- a right or left Inspector for selected-object properties;
- a context menu for object-level commands;
- keyboard shortcut labels in tooltips, not persistent explanatory text;
- a small mode/status readout for active tool and pending command.

The existing rail may stay for YAML, diagnostics, mapper, and advanced
structured flows, but the primary authoring path should not require the user to
open the Build tab for common actions.

## YAML Draft Interaction

Canvas mutations should not silently overwrite dirty YAML drafts.

If YAML draft is dirty:

- disable canvas mutation tools and show a clear apply/revert prompt; or
- apply the mutation to the draft only and keep the preview on the last valid
  applied document.

The first option is safer and matches the existing candidate/apply model.

## Test Strategy

Testing must cover both UI behavior and YAML output.

For each implemented action:

- assert the visual object exists or changes;
- assert the corresponding YAML object exists or changes;
- assert undo/redo;
- assert reload persistence when the action changes applied state;
- assert no actionable browser console errors.

The CRUD matrix should include:

- node presets: node, router, service, controller, external;
- links: create, edit labels/data if surfaced, delete, undo/redo;
- paths: create sequence, edit sequence, delete, undo/redo;
- regions: create from selection and/or bounds, edit name/members, delete;
- callouts: create from target, move, edit text/name, delete;
- shapes: create, move, resize, style/name, delete;
- layers: creation uses semantic defaults (`physical`, `paths`, `annotations`)
  and does not accidentally write graph objects into a hidden or merely visible
  non-semantic layer.

## Risks

- React Flow makes some interactions easy but not all topology semantics. Avoid
  leaking React Flow-specific edge/node data into TopoViewer YAML.
- A full freeform drawing editor would dilute TopoViewer's topology-as-code
  value. Keep the model semantic.
- Direct manipulation can race with YAML draft state unless mutation gating is
  strict.
- Clipboard and duplication can create broken references if references are not
  rewritten deliberately.
- Resize/region behavior can become confusing if object bounds are style-driven
  rather than object-driven.
