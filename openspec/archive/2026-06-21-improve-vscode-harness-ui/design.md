## Design

### Workspace Layout

The harness should default to a canvas-first layout:

```text
left authoring column: 1/3
canvas preview:       2/3
```

Use a real vertical divider between the left column and canvas. The divider
should support pointer dragging, keyboard adjustment, and a reset affordance.

Recommended behavior:

- default left column width: 33.333%;
- minimum left column width: 320px;
- maximum left column width: 55%;
- minimum canvas width: 480px;
- drag updates the split live without breaking Monaco or React Flow layout;
- double click or an explicit reset action restores the one-third/two-thirds
  default;
- the chosen split persists in local storage for browser harness sessions;
- when the viewport is too narrow, the layout stacks or turns the left column
  into a drawer instead of forcing an unusable canvas.

### Left Column Structure

The left column should behave like an authoring rail, not a page of stacked
cards. Use compact grouped tabs with clear priority:

- fixture selector;
- primary tabs for Build, Inspect, YAML, Attention, and Layers;
- nested source tabs for Topology YAML and Stylesheet YAML only inside YAML mode;
- an always-visible Diagnostics status row directly under the primary tabs;
- a full-height active pane for the currently selected mode.

The fixture selector should have visible spacing from the primary tab group so
the current fixture and current authoring mode do not read as one control.
Monaco should own the available rail height in YAML mode because editing YAML is
still the canonical authoring workflow. Build, Inspect, Attention, and Layers
should use the same available-height treatment instead of small stacked cards.

Diagnostics should not be a mode tab. It should remain visible as a compact
status row between the mode tabs and active pane, so validation health is never
hidden by the current authoring mode. Layers should be its own tab and remain
compact, scrollable, and count-backed.

The accepted first pass uses compact Material UI density for utility controls in
the authoring rail. Fixture, Inspect, and Attention controls should therefore
read as one compact control system rather than mixing large default fields with
small utility fields. This is a component-level density decision, not a
hardcoded pixel-height rule.

### Authoring Modes

Canvas clicks mean different things depending on whether the user is editing
YAML, inserting objects, inspecting existing objects, or building an attention
query. The harness should make that mode explicit.

Recommended modes:

- `Build`: object palette is active, canvas clicks can place the pending object
  when placement is supported;
- `Inspect`: canvas selection opens object properties and simple edits;
- `YAML`: Monaco-first editing, canvas selection is read-only context;
- `Attention`: canvas selection can populate focus query fields;
- `Layers`: layer visibility and object counts.

Mode controls should be compact grouped tabs, visible near the authoring rail
header, and keyboard reachable. Switching modes should not rewrite YAML by
itself.

### Selection Model

The harness needs a first-class selection model shared by canvas, Build,
Inspector, and Attention.

Required behavior:

- support single-select from canvas clicks;
- support multi-select with standard modifier keys;
- support clear selection by clicking blank canvas;
- show selected object count and object kind in the left rail;
- support selected nodes as source/target candidates for inserting links and
  paths;
- support selected nodes as members for inserted regions;
- support selected objects as targets for callouts;
- allow Attention Focus controls to use the current selection;
- keep selection as harness UI state only unless the user performs a YAML
  mutation;
- clear or repair selection when the selected object no longer exists after
  YAML edits;
- provide accessible keyboard movement between selectable objects where
  practical.

Selection should reference canonical object keys, such as `node:fra-pe`,
`link:underlay-fra-ams`, `path:payments-path`, or `region:provider-core`.
Implementation should use a clean internal shape, not literal strings with
spaces; the examples here are conceptual identifiers.

### Inspector

The harness should include a compact Inspector for the current selection. It
should act like a small properties panel rather than a full form builder.

Initial fields:

- `Object name`: read-only canonical selection key such as `node:fra-pe`;
- `Display name`: editable YAML `name`;
- `layers`;
- `labels` key/value rows;
- `data` key/value rows;
- `position` for nodes and absolute diagram objects;
- object-aware style picker for selected object inline `style`;
- add-style action that writes the selected style key/value into the object;
- save-as-Preset action that turns the currently inspected object into a
  reusable Build preset;
- delete selected object, with undo support.

The Inspector should write to Topology YAML through structured mutation and
trigger the same validation/render loop as Monaco, Build, and Attention.
Inspector controls should disable when the document is invalid or when the
selection contains incompatible object kinds.

### Undo And Redo

Any UI action that changes Topology YAML should be undoable:

- object insertion;
- object property edits in Inspector;
- Attention editor edits;
- deletion;
- layer assignment changes.

Use a small transaction model around topology text updates. Each transaction
should capture the previous topology text, next topology text, action label, and
selection repair target where useful. Monaco direct edits already have editor
undo behavior, but UI-driven mutations should also expose harness-level undo and
redo buttons/shortcuts.

Undo/redo should not cover purely local layout state such as the left/canvas
split width. Split width has its own reset behavior.

### YAML Mutation Contract

Structured mutation is a core constraint for this harness. Mutation helpers
should:

- parse current Topology YAML as an object;
- refuse to mutate when YAML cannot be parsed;
- preserve a valid TopoViewer document shape;
- serialize deterministic YAML;
- keep canonical fields in predictable order for inserted objects;
- avoid creating hidden state outside the YAML document;
- preserve Monaco scroll and cursor position where practical;
- show a clear diagnostic when a structured edit cannot be applied;
- run schema validation and semantic lint after every mutation.

The harness can tolerate modest formatting churn during structured edits, but
it must not append opaque snippets or create invalid YAML.

### Build Palette

The `Build` panel should borrow the interaction pattern from PowerPoint's
insert-shapes gallery, but use TopoViewer language:

- label the generic primitive `Node`, not `Object`;
- keep object language for the broader topology model only where the selected
  entity can be a node, link, path, region, shape, or callout;
- group objects by meaning, not by renderer internals;
- show icon buttons with labels and tooltips;
- support click-to-insert and keyboard activation first;
- optionally support drag-to-canvas later once insertion coordinates are stable.

Initial palette groups:

- Primitives: Node, Connection, Path, Region, Callout;
- Presets: Router, Service, Controller, External endpoint, plus user-saved
  presets from the Inspector.

Presets are durable browser-harness state. Saving a preset should capture the
selected object's current kind, name, labels, data, inline style, icon, type,
title, and body where those fields exist. Inserting a preset should use the same
structured Topology YAML mutation path as primitive insertion.

Insertion should update the topology YAML through a structured document update,
then rely on existing validation and rendering to update the canvas. The UI
should not create a second hidden diagram model.

Icon-forward palette polish is useful future work, but the first accepted
implementation can use compact labeled buttons with tooltips as long as the
generic primitive is clearly named `Node` and insertion remains keyboard
reachable.

### Insert Behavior

For the first implementation, keep insertion predictable:

- object IDs are generated from a stable prefix plus a numeric suffix;
- inserted nodes receive a default position near the visible canvas center when
  possible, otherwise near the center of the layout bounds;
- inserted connections require either selected source/target nodes or a small prompt
  inside the Build panel;
- inserted paths require selected nodes in order or a prompt;
- inserted regions include selected nodes when available;
- inserted callouts can target the current selection or use an absolute
  position;
- inserted objects and presets should use the currently selected layer when exactly one
  layer is selected, otherwise use the first visible layer with a clear default.

The implementation should prefer structured YAML parsing and serialization over
manual string appends. Some formatting churn is acceptable inside the browser
harness, but invalid YAML insertion is not.

### Attention Editor

The harness should include a compact Attention editor for the existing
`attention` block in Topology YAML. This editor is part of authoring, not a
separate runtime control plane.

The editor should make common attention behaviors discoverable:

- enable or clear attention configuration;
- choose the focus query type: object IDs, labels, data, dependency, change, or
  path focus;
- pick node, link, path, and region IDs from the current validated document;
- edit label/data matchers through small key/value controls;
- choose presentation mode, such as dim context or hide context;
- configure interactive click focus and click reset behavior;
- configure aggregate groups for region, parent-child, or label-based
  summaries;
- configure link grouping thresholds for dense parallel links;
- reset attention back to the fixture/default document state.

The Attention editor should write back to the canonical Topology YAML through
structured document mutation. It may expose an "Advanced YAML" affordance that
jumps the user to the `attention` block in Monaco, but the main controls should
cover the common declarative cases.

Recommended first implementation scope:

- `attention.query.pathIds`;
- `attention.query.nodeIds`;
- `attention.query.linkIds`;
- `attention.query.regionIds`;
- `attention.query.labels`;
- `attention.query.data`;
- `attention.query.mode`;
- `attention.interactive`;
- `attention.clickMode`;
- `attention.aggregate.groups` for region summaries;
- `attention.aggregate.expandOnClick`;
- `attention.links.grouping.threshold`.

Attention controls should support "Use selection" where relevant:

- selected nodes populate `attention.query.nodeIds`;
- selected links populate `attention.query.linkIds`;
- selected paths populate `attention.query.pathIds`;
- selected regions populate `attention.query.regionIds`;
- mixed selections are either filtered by the active focus type or rejected with
  a compact explanation.

When the document has validation errors, the Attention editor should disable
mutation controls and explain that validation must pass first. It should still
show the current parsed attention state when available.

### Attention Editor UX

The Attention editor must be compact because the left rail is narrow by
default. Use a small section with progressive disclosure:

- a summary row showing current attention mode and whether interaction,
  aggregation, or link grouping is enabled;
- collapsible sections for Object focus, Match by metadata, Click behavior, and
  Dense summaries;
- concise helper text that explains what value to enter and what the diagram
  will do after applying it;
- searchable object pickers only when needed;
- key/value rows for labels and data;
- icon buttons with tooltips for add/remove/reset;
- no large instructional copy inside the UI.

Canvas feedback should be immediate: after an attention edit updates YAML and
validation passes, the existing TopoViewer preview should re-render with the new
focus, aggregation, or grouping behavior.

The accepted implementation groups common controls into four collapsible
sections: Object focus, Match by metadata, Click behavior, and Dense summaries.
Use compact Material UI controls and concise helper text in those sections. The
helper text should explain what value to enter and what the diagram will do,
without turning the panel into documentation.

### Screen Real Estate Improvements

The harness should preserve canvas space without hiding essential controls:

- move low-frequency controls into icon buttons with tooltips;
- keep the preview action bar compact and top-left;
- keep React Flow zoom controls on the canvas edge;
- keep primary authoring modes as grouped tabs, not button rows;
- let the selected tab carry the mode title instead of repeating `Build`,
  `Inspect`, `Attention`, or `Layers` as pane headings;
- keep Diagnostics as a compact always-visible row under the mode tabs;
- show selection status as a compact context chip only when objects are
  selected;
- keep layer controls dense with counts and scrolling inside Layers mode;
- make Build groups horizontally compact where possible;
- keep the Attention editor summarized by default and expand only the active
  editing group;
- keep Inspector hidden or summarized when nothing is selected;
- avoid nested cards inside the left column;
- ensure text never overlaps in narrow desktop widths.

### Harness Fixtures

Add harness-owned fixtures that are intentionally small and workflow-specific:

- Build fixture: simple underlay with enough room to place objects;
- Attention fixture: path focus, region aggregation, and link grouping cases;
- Inspector fixture: objects with labels, data, layers, and positions;
- Dense links fixture: small endpoint pair with multiple parallel links for
  grouping controls.

Fixtures should remain separate from broad public docs examples when their main
purpose is UI workflow testing. Every fixture layer exposed in the harness must
have at least one object.

### Testing Strategy

Add Playwright coverage before treating the UI as complete:

- default split is approximately one-third/two-thirds;
- divider drag changes column widths and does not blank Monaco or the canvas;
- divider keyboard controls work;
- reset restores the default split;
- persisted split is restored on reload;
- Build panel shows primitive and preset groups with compact buttons;
- inserting a Node updates Topology YAML and renders a new node;
- saving an inspected object as a Preset adds it to Build and inserts it through
  structured YAML mutation;
- inserted objects receive a valid layer;
- canvas selection drives Build, Inspector, and Attention behavior;
- Inspector edits update YAML and canvas state;
- undo/redo restores topology YAML and rendered state for UI mutations;
- YAML mutation helpers reject invalid YAML without corrupting editor content;
- Attention editor updates Topology YAML and the canvas for path focus;
- Attention editor can enable interactive focus and link grouping without
  creating hidden state;
- Attention editor can use canvas selection to populate object ID focus fields;
- diagnostics still report invalid YAML;
- workflow fixtures cover Build, Attention, Inspector, and dense link grouping;
- responsive viewport does not overlap controls or make the canvas unusable.

Manual screenshot review should cover desktop light/dark and a narrow viewport.

### Future Follow-Ups

These improvements are intentionally outside the accepted first pass:

- icon-first Build palette presentation;
- drag-to-canvas insertion with precise coordinates;
- full object-aware style forms beyond the Inspector style key/value editor;
- schema-aware Monaco completions and diagnostics;
- deeper visual assertions for attention runtime effects such as path focus and
  click-reset behavior;
- extension-host integration tests and packaging.
