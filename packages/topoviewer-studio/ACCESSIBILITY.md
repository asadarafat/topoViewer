# TopoViewer Studio Accessibility Contract

TopoViewer Studio targets WCAG 2.2 AA for the primary authoring workflows in
the browser and desktop hosts. Both routes mount the same Studio application,
so keyboard, focus, naming, validation, and announcement behavior belong to
this package.

## Focus Model

The default focus order follows the visible layout: command bar, project-source
navigator, workbench context, shared source editor, preview controls and
topology canvas, contextual drawer when open, session dock, then status bar.
Responsive source and contextual drawers retain their logical position and
restore focus to the control that opened them.

- Activating an Add template creates and selects the object, then moves
  focus to the canvas.
- React Flow nodes and edges remain keyboard focusable. Selection updates the
  contextual Properties workspace and the polite live region without moving
  focus away from the selected object.
- Double-click opens one anchored editor for the selected object's canonical
  displayed text. Commit, cancel, multiline entry, and focus return do not
  depend on pointer-only canvas state.
- Add, Properties, and Mapper are one non-modal preview-local drawer on
  desktop. Closing it restores focus to the control that opened it. On narrow
  layouts the same content uses a modal MUI drawer with contained focus.
- Source, Split, and Preview preserve focusable project state. The split
  separator exposes separator semantics, bounded values, and arrow-key resizing
  without mutating source.
- Export, destructive confirmations, and external-change dialogs contain focus
  while open and restore the prior focus when they close.
- Presentation mode moves focus to its exit control and restores focus to the
  presentation command on exit.
- Opening the keyboard context menu moves focus to its first available action;
  closing it restores focus to the canvas object or canvas region.

## Keyboard Map

Keyboard commands are scoped to the topology canvas. They do not intercept
text inputs, editable content, dialogs, menus, or Monaco.

| Workflow | Keyboard interaction |
|---|---|
| Choose and place | Focus a palette template and press `Enter` or `Space`. |
| Select | Tab to a topology object, then use the React Flow selection keys. Use the platform modifier for additive selection. |
| Move | Press an arrow key for one pixel or `Shift+Arrow` for ten pixels. |
| Resize | Press `Alt+Arrow` for one pixel or `Alt+Shift+Arrow` for ten pixels. Left/up shrink; right/down grow. |
| Edit displayed text | Double-click an object. Press `Enter` to save, `Shift+Enter` for a new line in standalone text, or `Escape` to cancel. |
| Connect | Select exactly two nodes and press `L`, or activate **Connect selected nodes** in the canvas toolbar. |
| Region membership | Create a region from selected nodes, or nudge a node into a region. Press `Shift+F10` or the Context Menu key and choose **Release from region** to remove membership. |
| Context actions | Press `Shift+F10` or the Context Menu key. Use arrow keys, `Home`, and `End` within the menu; press `Escape` to close it. |
| Clipboard | Use `Control/Command+C`, `X`, or `V`; use `Control/Command+D` to duplicate. |
| Delete | Press `Delete` or `Backspace` while canvas focus is active. |
| Visual properties and mapper | Tab through generated controls. `Enter` commits text fields and `Escape` restores their previous value. Visual groups use named accordion controls; mixed values, provenance, diagnostics, Apply, and Revert have text equivalents. Mapper metrics are buttons as well as drag sources. |
| YAML source | Select `topology.yaml`, `stylesheet.yaml`, or `mapper.yaml` in project source. Use Monaco completion and diagnostics, then Apply or Revert from the source footer. An editor failure leaves the real preview and raw-source recovery reachable. |
| Layers | Open Layers from project source or the canvas controls, then use named checkboxes and buttons for visibility, membership, ordering, creation, and deletion. |
| Source split | Focus the source/preview separator and use left/right arrows to resize within the documented bounds. |
| Workbench and dock choices | Use arrow keys or `Home`/`End` within Source/Split/Preview and the session-dock tab list; only active tab-like choices enter their content. |
| Save and export | Use the named header commands and dialog controls. Progress, completion, and failures are announced. |

## Announcements

One polite live region reports selection, placement, valid or invalid
connection targets, command completion, diagnostics, persistence state, and
export completion. Blocking failures also render as visible alerts. Repeated
connection-target messages are deduplicated so pointer movement does not flood
assistive technology.

Color is supplementary. Selection, connection validity, mapper coverage,
diagnostics, save state, and errors all have text or accessible-state
equivalents.

Every schema-declared color control has an exact text field and a separately
named visual well. The resize completion cue is omitted when reduced motion is
requested; active resize never uses a geometry transition.

The header Appearance menu exposes System, Light, and Dark as named menu
choices with selected state. Theme-owned canvas and grid colors retain text
equivalents and follow the active MUI color scheme. Explicit custom colors keep
their values across scheme changes.

## Verification Contract

The automated gate covers:

- automated axe checks for the default YAML-first shell, project source,
  selected-object Properties, canvas Properties and layers, shared topology,
  stylesheet, and mapper source, Mapper Visual, project menu, export dialog,
  and external-change dialog;
- keyboard-only creation, selection, movement, resize, connection, contextual
  region action, source switching, split resizing, mapper rule creation, save,
  and export entry;
- 200 percent zoom, narrow viewport, light and dark schemes, reduced motion,
  forced colors, and long translated-like labels;
- a macOS keyboard and VoiceOver review of the same primary workflow.

Critical and serious automated findings block the phase. Lower-severity
findings require an owner and rationale in this document before release.

## Residual Findings

No lower-severity automated exception is approved by default. Host applications
remain responsible for preserving platform zoom, contrast, reduced-motion, and
assistive-technology preferences around the Studio webview.

## Phase 16 Review Record

On 2026-07-10, Chromium completed seven Studio accessibility workflows with
zero axe violations. The suite covered all major shell states, keyboard-only
authoring, connection announcements, focus containment and restoration,
validation associations, narrow reflow, dark mode, reduced motion, forced
colors, long labels, and external-change conflict handling.

Asad Arafat completed the manual VoiceOver review on 2026-07-10 with macOS
26.5.1 and Chrome 150.0.7871.47. Focus order, names, roles, values, selected
state, keyboard authoring, live announcements, modal focus containment and
restoration, 200 percent zoom, Increase Contrast, and Reduce Motion passed. The
review found no critical, serious, or lower-severity residual accessibility
findings.

The manual review used this repeatable checklist:

1. Open `http://127.0.0.1:5175/` in Chrome on macOS and enable VoiceOver.
2. Traverse the header, project source, shared source editor, preview, Add,
   canvas objects, Properties, session dock, and status bar in DOM order;
   confirm names, roles, values, and selected state are announced.
3. Create two nodes from the palette, select both, connect them, move and resize
   one node, create a region, and release a member through `Shift+F10`.
4. Confirm placement, selection, connection validity, command completion, save
   state, and rejection messages are announced once and remain understandable.
5. Switch topology, stylesheet, and mapper source; open and close contextual
   Add, Properties, Mapper, export, project, layer-delete, mapper-delete, and
   external-change surfaces; confirm focus containment and restoration.
6. Repeat the save and export entry workflows at 200 percent zoom and with
   Increase Contrast and Reduce Motion enabled.

Future reviews must record the reviewer, macOS/browser versions, date, and any
finding. Do not pass the OpenSpec assistive-technology gate while any critical
or serious finding remains unresolved.

## Source And Visual Review Record

On 2026-07-30, Chromium completed the YAML-first Studio accessibility workflows
with zero critical or serious axe findings. The run covered project-source and
document navigation, Source/Split/Preview, keyboard divider resizing,
selection-driven Properties, Mapper Visual, grouped fields, mixed values,
completion, source-mapped diagnostics, Apply/Revert, editor loading and
failure, invalid candidates, external conflicts, light and dark schemes,
forced colors, reduced motion, and 200 percent zoom. Source, preview,
selection, and contextual authoring remained reachable at the constrained
breakpoint.
