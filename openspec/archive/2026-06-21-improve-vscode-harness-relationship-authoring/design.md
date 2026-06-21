## Design

### Current Gap

`Connection` insertion currently maps to `graph.links` and needs two selected
nodes. `Path` insertion maps to `graph.paths` and uses the selected node order as
the path sequence. This is useful as a shortcut, but it is not enough as a
primary UX:

- users cannot author a connection by explicitly choosing source and target
  nodes from the left rail;
- users cannot reorder path transit nodes after insertion;
- existing links and paths do not expose endpoint or sequence controls in
  Inspector;
- canvas node movement does not have a first-class persisted writeback path.

The next pass should make these common operations available through compact UI
while preserving the canonical Topology YAML model.

### Relationship Authoring Model

Treat relationship authoring as structured YAML mutation over graph entities:

- `Connection` creates or edits a `graph.links[]` entry with `source` and
  `target`;
- `Path` creates or edits a `graph.paths[]` entry with `sequence`;
- when the path UI only has source and target, serialize `sequence:
  [source, target]`;
- when transit nodes are present, serialize `sequence: [source, ...transit,
  target]`;
- preserve existing `source` / `target` path fields only if the source document
  uses them and the renderer requires that shape, otherwise prefer `sequence`
  for ordered path authoring.

The UI must never create a hidden relationship model. The left rail controls are
editors for the YAML document, not a separate graph store.

### Build Mode UX

Build mode should keep the compact object palette, but relationship insertion
needs a focused authoring area when the user chooses `Connection` or `Path`.

Recommended flow:

- clicking `+ Connection` opens a compact relationship composer instead of
  immediately failing when two nodes are not selected;
- if exactly two or more nodes are selected, prefill source and target from the
  first two selected nodes;
- expose `Source` and `Target` node comboboxes populated from validated
  `graph.nodes`;
- disable the create action until source and target are both set and different;
- clicking `+ Path` opens a path composer;
- prefill source, transit, and target from the selected node order when two or
  more nodes are selected;
- expose `Source`, `Transit nodes`, and `Target` controls;
- transit nodes should be reorderable with compact up/down controls and
  removable without editing YAML manually;
- create actions should remain keyboard reachable and use compact Material UI
  sizing consistent with the harness rail.

Selection remains a convenience input, not the only authoring path.

### Inspector UX

Inspector should expose relationship-specific controls when a link or path is
selected:

- selected `link` shows source and target node comboboxes;
- selected `path` shows source, ordered transit nodes, and target;
- changing endpoints updates Topology YAML through structured mutation;
- invalid edits are disabled or rejected before writing YAML;
- existing labels, data, layer, and style editing remain available.

When multiple links or paths are selected, the first pass may show a compact
message explaining that endpoint editing is single-object only. Bulk relationship
editing can be future work.

### Inspect Sync Model

Inspect should be a synchronized editor for the selected object, not a detached
form. When the selected object changes, Inspect hydrates from validated YAML and
the same renderer-effective style resolution used by the canvas:

- Labels and Data render as editable rows populated from `object.labels` and
  `object.data`;
- applying Labels or Data writes the visible row set back to topology YAML with
  replace semantics;
- style rows render from effective style: matching stylesheet rules first,
  inline object style last;
- each style row shows provenance as `stylesheet`, `inline`, or `new`;
- applying styles writes only rows that changed, so inherited stylesheet values
  are not copied into `object.style`;
- changed inherited values become explicit inline overrides;
- reset removes an inline override and lets the row fall back to stylesheet or
  default behavior after validation;
- the style key picker groups keys by purpose, such as Geometry, Labels,
  Status, Icon, Border and underlay, Line, Routing, and Arrows.

This keeps Topology YAML as the editable source of truth without hiding the
stylesheet-driven canvas state from the user. It also prevents a common bad
outcome: selecting an object and pressing Apply should not materialize every
inherited style into the object.

### Node Position Persistence

Canvas node dragging should persist node positions into Topology YAML:

- when a user drags a graph node and releases it, update that node's
  `position`;
- preserve the existing position shape where practical:
  - if the source uses `[x, y]`, update as a tuple;
  - if the source uses `{ x, y }`, update as an object;
  - if the node has no position, write `[x, y]` for compact YAML;
- round positions to stable integer values to avoid YAML churn;
- create an undo transaction labeled clearly, for example `Move node`;
- support redo;
- do not write position changes while the user is still dragging;
- do not persist viewport pan/zoom.

Node movement is still a UI-driven Topology YAML mutation, so the same parsing,
validation, undo/redo, and failure-preservation rules apply.

### Mutation Helpers

Add focused helpers in `src/shared/topologyMutations.ts`:

- create or update link endpoints;
- create or update path sequence;
- update node position by node ID;
- validate endpoint node existence before mutation;
- reject source/target equality for links and two-node paths unless a future
  self-loop design explicitly supports it;
- preserve deterministic YAML serialization.

These helpers should return the same `MutationResult` shape used by the current
Build, Inspector, and Attention actions.

### Tests

Playwright should cover the behavior from the user's point of view:

- `+ Connection` opens endpoint controls when no nodes are selected;
- selecting source and target creates a link in YAML and canvas;
- selected nodes prefill the connection composer;
- Inspector can update an existing link source/target;
- `+ Path` opens source/transit/target controls;
- transit nodes can be added, reordered, and removed;
- creating a path writes the expected `sequence`;
- Inspector can update an existing path sequence;
- dragging a node updates its `position` in Topology YAML after release;
- undo and redo restore node positions and relationship edits;
- invalid current YAML prevents structured relationship and position mutations
  without corrupting Monaco content.

### Future Follow-Ups

- drag-to-draw connection creation on canvas;
- endpoint hover handles and snap targets;
- manual edge route editing;
- bulk relationship editing;
- schema-aware Monaco completions for node IDs.
